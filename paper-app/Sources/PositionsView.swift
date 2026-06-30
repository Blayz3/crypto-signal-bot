import SwiftUI

struct PositionsView: View {
    @ObservedObject var store: AccountStore

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 10) {
                if let acc = store.account {
                    if acc.open.isEmpty {
                        Text("Sin posiciones abiertas.").foregroundStyle(.secondary).padding(40)
                    } else {
                        ForEach(acc.open) { p in PositionRow(p: p) }
                    }
                } else {
                    ProgressView().padding(40)
                }
            }
            .padding()
        }
        .background(Color.bg)
    }
}

struct PositionRow: View {
    let p: Position

    var body: some View {
        let u = p.unrealizedPnl ?? 0
        VStack(spacing: 10) {
            HStack {
                Text(p.symbol.base).font(.headline).foregroundStyle(.white)
                Text(p.isLong ? "LONG" : "SHORT")
                    .font(.caption2).bold().padding(.horizontal, 7).padding(.vertical, 3)
                    .background((p.isLong ? Color.up : Color.down).opacity(0.2))
                    .foregroundStyle(p.isLong ? Color.up : Color.down)
                    .clipShape(Capsule())
                Text("\(Int(p.leverage))x").font(.caption2).bold()
                    .padding(.horizontal, 6).padding(.vertical, 3)
                    .background(Color.white.opacity(0.08)).foregroundStyle(.white.opacity(0.8))
                    .clipShape(Capsule())
                Text(p.grade).font(.caption2).bold().foregroundStyle(gradeColor(p.grade))
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(Fmt.money(u, sign: true)).font(.system(.headline, design: .rounded)).bold()
                        .foregroundStyle(Color.pnl(u))
                    Text(Fmt.pct(p.unrealizedPct ?? 0)).font(.caption2).foregroundStyle(Color.pnl(u))
                }
            }
            HStack(spacing: 0) {
                leg("Entrada", Fmt.price(p.entry), .secondary)
                leg("Actual", p.markPrice.map(Fmt.price) ?? "…", .white)
                leg("SL", Fmt.price(p.stop), .down)
                leg("TP", Fmt.price(p.target), .up)
            }
            .font(.caption)
            Text("Margen \(Fmt.money(p.margin)) · nocional \(Fmt.money(p.notional))")
                .font(.caption2).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(14)
        .background(Color.card).clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func leg(_ t: String, _ v: String, _ c: Color) -> some View {
        VStack(spacing: 2) {
            Text(t).font(.caption2).foregroundStyle(.secondary)
            Text(v).foregroundStyle(c)
        }.frame(maxWidth: .infinity)
    }
}
