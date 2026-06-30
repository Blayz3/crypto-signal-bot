import SwiftUI
import Charts

struct SummaryView: View {
    @ObservedObject var store: AccountStore

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let acc = store.account {
                    equityCard(acc)
                    statsRow(acc)
                    chartCard(acc)
                } else if store.loading {
                    ProgressView("Cargando cuenta…").padding(40)
                } else {
                    Text(store.errorText ?? "Sin datos todavía.")
                        .foregroundStyle(.secondary).padding(40)
                }
            }
            .padding()
        }
        .background(Color.bg)
    }

    // Tarjeta principal: equity grande + variación
    private func equityCard(_ acc: Account) -> some View {
        let pnlTotal = acc.equity - acc.startingBalance
        return VStack(spacing: 6) {
            Text("EQUITY (PAPER)").font(.caption).foregroundStyle(.secondary)
            Text(Fmt.money(acc.equity)).font(.system(size: 44, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            HStack(spacing: 6) {
                Image(systemName: pnlTotal >= 0 ? "arrow.up.right" : "arrow.down.right")
                Text("\(Fmt.money(pnlTotal, sign: true)) (\(Fmt.pct(pnlTotal / acc.startingBalance * 100)))")
            }
            .font(.headline).foregroundStyle(Color.pnl(pnlTotal))
            Text("Balance \(Fmt.money(acc.balance)) · inicio \(Fmt.money(acc.startingBalance))")
                .font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(22)
        .background(Color.card).clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private func statsRow(_ acc: Account) -> some View {
        HStack(spacing: 12) {
            stat("Realizado", Fmt.money(acc.realizedPnl, sign: true), Color.pnl(acc.realizedPnl))
            stat("No realizado", Fmt.money(acc.unrealizedPnl, sign: true), Color.pnl(acc.unrealizedPnl))
            stat("Win rate", acc.stats.winRate.map { "\(Int($0))%" } ?? "—", .white)
            stat("W / L", "\(acc.stats.wins)/\(acc.stats.losses)", .white)
        }
    }

    private func stat(_ title: String, _ value: String, _ color: Color) -> some View {
        VStack(spacing: 4) {
            Text(title).font(.caption2).foregroundStyle(.secondary)
            Text(value).font(.system(.subheadline, design: .rounded)).bold().foregroundStyle(color)
                .lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 14)
        .background(Color.card).clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func chartCard(_ acc: Account) -> some View {
        let pts = acc.equityCurve.enumerated().map { (i, p) in (i: i, bal: p.balance) }
        let start = acc.startingBalance
        let up = (pts.last?.bal ?? start) >= start
        return VStack(alignment: .leading, spacing: 10) {
            Text("Dinero ganado / perdido").font(.headline).foregroundStyle(.white)
            if pts.count < 2 {
                Text("Aún sin trades cerrados para graficar.")
                    .font(.caption).foregroundStyle(.secondary).padding(.vertical, 30)
            } else {
                Chart {
                    ForEach(pts, id: \.i) { p in
                        AreaMark(x: .value("n", p.i), yStart: .value("base", minBal(pts)), yEnd: .value("bal", p.bal))
                            .foregroundStyle(.linearGradient(colors: [(up ? Color.up : Color.down).opacity(0.35), .clear],
                                                             startPoint: .top, endPoint: .bottom))
                        LineMark(x: .value("n", p.i), y: .value("bal", p.bal))
                            .foregroundStyle(up ? Color.up : Color.down)
                            .interpolationMethod(.monotone)
                    }
                    RuleMark(y: .value("inicio", start))
                        .foregroundStyle(.secondary.opacity(0.4))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                }
                .chartYScale(domain: chartDomain(pts, start))
                .frame(height: 220)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading).padding(18)
        .background(Color.card).clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private func minBal(_ pts: [(i: Int, bal: Double)]) -> Double { pts.map(\.bal).min() ?? 0 }
    private func chartDomain(_ pts: [(i: Int, bal: Double)], _ start: Double) -> ClosedRange<Double> {
        let vals = pts.map(\.bal) + [start]
        let lo = (vals.min() ?? 0) * 0.98
        let hi = (vals.max() ?? 1) * 1.02
        return lo...max(hi, lo + 1)
    }
}
