import Foundation
import SwiftUI

/// Carga la cuenta de paper trading desde GitHub (la publica el bot) y refresca el
/// P&L de las posiciones abiertas con PRECIOS EN VIVO de KuCoin → tiempo real.
@MainActor
final class AccountStore: ObservableObject {
    @Published var account: Account?
    @Published var lastUpdated: Date?
    @Published var errorText: String?
    @Published var loading = false

    // API de GitHub (devuelve el archivo SIN cache de 5 min de raw). Cambia el repo si es otro.
    private let accountURL =
        "https://api.github.com/repos/Blayz3/crypto-signal-bot/contents/cerebro-trading/paper-account.json"
    private let kucoinTickers = "https://api.kucoin.com/api/v1/market/allTickers"

    private var accountTimer: Timer?
    private var priceTimer: Timer?

    func start() {
        Task { await refreshAccount() }
        Task { await refreshPrices() }
        accountTimer = Timer.scheduledTimer(withTimeInterval: 120, repeats: true) { [weak self] _ in
            Task { await self?.refreshAccount() }
        }
        priceTimer = Timer.scheduledTimer(withTimeInterval: 10, repeats: true) { [weak self] _ in
            Task { await self?.refreshPrices() }
        }
    }

    func stop() {
        accountTimer?.invalidate(); priceTimer?.invalidate()
    }

    // MARK: - Cuenta (JSON del bot)

    func refreshAccount() async {
        loading = (account == nil)
        defer { loading = false }
        guard let url = URL(string: accountURL) else { return }
        do {
            var req = URLRequest(url: url)
            req.cachePolicy = .reloadIgnoringLocalCacheData
            req.setValue("application/vnd.github.raw", forHTTPHeaderField: "Accept")
            req.setValue("CryptoPaper", forHTTPHeaderField: "User-Agent")
            let (data, _) = try await URLSession.shared.data(for: req)
            var acc = try JSONDecoder().decode(Account.self, from: data)
            // Conserva los precios en vivo ya conocidos.
            applyLivePrices(to: &acc)
            self.account = acc
            self.lastUpdated = Date()
            self.errorText = nil
        } catch {
            self.errorText = "No se pudo cargar la cuenta: \(error.localizedDescription)"
        }
    }

    // MARK: - Precios en vivo (KuCoin) → recalcula P&L no realizado

    private var livePrices: [String: Double] = [:]  // "BTC/USDT" -> precio

    func refreshPrices() async {
        guard let url = URL(string: kucoinTickers) else { return }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let resp = try JSONDecoder().decode(KuCoinTickers.self, from: data)
            var map: [String: Double] = [:]
            for t in resp.data.ticker {
                let sym = t.symbol.replacingOccurrences(of: "-", with: "/")  // BTC-USDT -> BTC/USDT
                if let p = Double(t.last ?? "") { map[sym] = p }
            }
            if !map.isEmpty {
                self.livePrices = map
                if var acc = self.account { applyLivePrices(to: &acc); self.account = acc }
            }
        } catch {
            // silencioso: si KuCoin falla, se usan los precios snapshot del JSON
        }
    }

    /// Recalcula markPrice / unrealizedPnl de cada posición abierta con el precio en vivo,
    /// y actualiza equity/unrealized del total. Misma fórmula que el bot (capado al margen).
    private func applyLivePrices(to acc: inout Account) {
        guard !livePrices.isEmpty else { return }
        var totalU = 0.0
        for i in acc.open.indices {
            let p = acc.open[i]
            guard let live = livePrices[p.symbol] else {
                totalU += p.unrealizedPnl ?? 0; continue
            }
            let dirSign = p.isLong ? 1.0 : -1.0
            let raw = p.notional * ((live - p.entry) / p.entry) * dirSign
            let pnl = max(-p.margin, raw)
            acc.open[i].markPrice = live
            acc.open[i].unrealizedPnl = (pnl * 100).rounded() / 100
            acc.open[i].unrealizedPct = (pnl / p.margin * 100 * 100).rounded() / 100
            totalU += pnl
        }
        acc.unrealizedPnl = (totalU * 100).rounded() / 100
        acc.equity = ((acc.balance + totalU) * 100).rounded() / 100
    }
}

private struct KuCoinTickers: Codable {
    struct DataBlock: Codable { var ticker: [Ticker] }
    struct Ticker: Codable { var symbol: String; var last: String? }
    var data: DataBlock
}
