import SwiftUI

struct HistoryView: View {
    @ObservedObject var store: AccountStore

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                if let acc = store.account {
                    if acc.closed.isEmpty {
                        Text("Sin trades cerrados todavía.").foregroundStyle(.secondary).padding(40)
                    } else {
                        ForEach(acc.closed.reversed()) { t in ClosedRow(t: t) }
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

struct ClosedRow: View {
    let t: ClosedTrade

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: t.pnl > 0 ? "checkmark.circle.fill" : t.pnl < 0 ? "xmark.circle.fill" : "minus.circle.fill")
                .foregroundStyle(Color.pnl(t.pnl)).font(.title3)
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(t.symbol.base).font(.subheadline).bold().foregroundStyle(.white)
                    Text(t.isLong ? "LONG" : "SHORT").font(.caption2)
                        .foregroundStyle(t.isLong ? Color.up : Color.down)
                    Text("\(Int(t.leverage))x").font(.caption2).foregroundStyle(.secondary)
                }
                Text("\(Fmt.price(t.entry)) → \(Fmt.price(t.exit))  ·  \(shortDate(t.closedAt))")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(Fmt.money(t.pnl, sign: true)).font(.system(.subheadline, design: .rounded)).bold()
                    .foregroundStyle(Color.pnl(t.pnl))
                Text(Fmt.pct(t.pnlPct)).font(.caption2).foregroundStyle(Color.pnl(t.pnl))
            }
        }
        .padding(12)
        .background(Color.card).clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func shortDate(_ s: String) -> String {
        guard let d = ISO8601DateFormatter.shared.dateLoose(s) else { return "" }
        let f = DateFormatter(); f.dateFormat = "d MMM HH:mm"
        return f.string(from: d)
    }
}
