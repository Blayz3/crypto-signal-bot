import Foundation

/// Una señal de trade que devuelve el motor Node (scanner.js --json).
struct Signal: Codable, Identifiable {
    let symbol: String
    let action: String
    let confidence: Double?
    let style: String?
    let timeframe: String?
    let setup: String?
    let regime: String?
    let orderType: String?
    let confluence: Int?
    let entry: Double?
    let stop: Double?
    let target: Double?
    let rr: Double?
    let localScore: Double?
    let rationale: String?
    let ts: String?

    var id: String { "\(symbol)-\(ts ?? action)" }

    var isLong: Bool { action.lowercased() == "long" }
    var confidencePct: Int { Int((confidence ?? 0).rounded()) }
    var isLimit: Bool { (orderType ?? "market").lowercased() == "limit" }

    // Plan de órdenes concreto para colocar en el exchange.
    /// Orden de ENTRADA: límite de compra/venta o market.
    var entryOrder: String {
        let side = isLong ? "COMPRA" : "VENTA"
        let type = isLimit ? "LIMIT" : "MARKET"
        let px = entry.map { priceString($0) } ?? "—"
        return "\(side) \(type) @ \(px)"
    }
    /// Orden de TAKE PROFIT: siempre límite, lado opuesto a la entrada.
    var takeProfitOrder: String {
        let side = isLong ? "VENTA" : "COMPRA"
        let px = target.map { priceString($0) } ?? "—"
        return "\(side) LIMIT @ \(px)"
    }
    /// Orden de STOP LOSS.
    var stopOrder: String {
        let px = stop.map { priceString($0) } ?? "—"
        return "STOP @ \(px)"
    }
}

/// El resultado completo de un escaneo.
struct ScanResult: Codable {
    let signals: [Signal]
    let scanned: Int?
    let candidates: Int?
    let visited: Int?
    let halted: String?
    let error: String?
}

// MARK: - Gráfico (OHLCV)

struct Candle: Codable {
    let time: Double
    let open: Double
    let high: Double
    let low: Double
    let close: Double
}

struct OHLCVResult: Codable {
    let symbol: String?
    let timeframe: String?
    let candles: [Candle]
    let error: String?
}

// MARK: - Historial de señales

struct HistoryEntry: Codable, Identifiable {
    let file: String
    let symbol: String?
    let action: String?
    let status: String
    let setup: String?
    let date: String?
    let entry: Double?
    let stop: Double?
    let target: Double?
    let rr: Double?
    let result_r: Double?
    let confidence: Double?

    var id: String { file }
    var isLong: Bool { (action ?? "").lowercased() == "long" }
}

struct HistoryStats: Codable {
    let total: Int?
    let closed: Int?
    let open: Int?
    let wr: Double?
    let expectancy: Double?
    let sumR: Double?
}

struct HistoryResult: Codable {
    let stats: HistoryStats
    let entries: [HistoryEntry]
    let error: String?
}

/// Petición para mostrar el gráfico con el setup dibujado.
struct ChartRequest: Identifiable {
    let id = UUID()
    let symbol: String
    let timeframe: String
    let entry: Double?
    let stop: Double?
    let target: Double?
    let isLong: Bool
}
