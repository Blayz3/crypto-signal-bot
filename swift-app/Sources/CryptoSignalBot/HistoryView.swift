import SwiftUI

/// Historial de señales registradas en el diario: cuáles ganamos y cuáles no,
/// con el win rate y la expectativa acumulada. Tocar una abre su gráfico.
struct HistoryView: View {
    let onSelect: (ChartRequest) -> Void

    @State private var entries: [HistoryEntry] = []
    @State private var stats: HistoryStats?
    @State private var loading = true
    @State private var analysisMsg: String?

    var body: some View {
        VStack(spacing: 0) {
            statsHeader
            if let msg = analysisMsg {
                HStack(spacing: 8) {
                    Image(systemName: "stethoscope").foregroundColor(.accent)
                    Text(msg).font(.system(size: 12)).foregroundColor(.text)
                    Spacer()
                }
                .padding(.horizontal, 20).padding(.vertical, 8)
                .background(Color.accent.opacity(0.10))
            }
            Divider().overlay(Color.border)
            if loading {
                Spacer(); ProgressView().tint(.accent); Spacer()
            } else if entries.isEmpty {
                emptyState
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(entries) { row($0) }
                    }
                    .padding(16)
                }
            }
        }
        .task { await load() }
    }

    private var statsHeader: some View {
        HStack(spacing: 26) {
            stat("Win Rate", stats?.wr.map { "\(Int($0 * 100))%" } ?? "—")
            stat("Expectativa", stats?.expectancy.map { fmtR($0) } ?? "—")
            stat("R total", stats?.sumR.map { fmtR($0) } ?? "—")
            stat("Cerradas", stats?.closed.map(String.init) ?? "0")
            stat("Abiertas", stats?.open.map(String.init) ?? "0")
            Spacer()
            Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") }
                .buttonStyle(.plain).foregroundColor(.accent)
        }
        .padding(.horizontal, 20).padding(.vertical, 14)
    }

    private func stat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label).font(.system(size: 11)).foregroundColor(.muted)
            Text(value).font(.system(size: 16, weight: .bold))
        }
    }

    private func row(_ e: HistoryEntry) -> some View {
        HStack(spacing: 12) {
            statusDot(e.status)
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(e.symbol ?? "—").font(.system(size: 14, weight: .semibold))
                    Text((e.action ?? "").uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(e.isLong ? .long : .short)
                }
                Text(e.setup ?? "—").font(.system(size: 11)).foregroundColor(.muted)
            }
            Spacer()

            if e.status == "open" {
                // Marcar resultado (persiste en el diario / bóveda).
                HStack(spacing: 6) {
                    resultButton("Ganada", .long) { await mark(e, "win") }
                    resultButton("Perdida", .short) { await mark(e, "loss") }
                    resultButton("BE", .muted) { await mark(e, "breakeven") }
                }
            } else {
                VStack(alignment: .trailing, spacing: 2) {
                    Text(statusLabel(e)).font(.system(size: 13, weight: .semibold))
                        .foregroundColor(statusColor(e.status))
                    Text(shortDate(e.date)).font(.system(size: 10)).foregroundColor(.muted)
                }
            }
        }
        .padding(12)
        .background(Color.panel)
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.border))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .contentShape(Rectangle())
        .onTapGesture { open(e) }
    }

    private func resultButton(_ title: String, _ color: Color, _ action: @escaping () async -> Void) -> some View {
        Button { Task { await action() } } label: {
            Text(title).font(.system(size: 11, weight: .semibold))
                .padding(.horizontal, 9).padding(.vertical, 5)
                .foregroundColor(color)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(color.opacity(0.5)))
        }
        .buttonStyle(.plain)
    }

    /// Marca el resultado y lo guarda en el diario. win = +R del trade, loss = -1R, BE = 0.
    private func mark(_ e: HistoryEntry, _ status: String) async {
        let r: Double
        switch status {
        case "win": r = (e.rr.flatMap { $0.isNaN ? nil : $0 }) ?? 2.0
        case "loss": r = -1.0
        default: r = 0.0
        }
        _ = await NodeRunner.run(["scripts/journal-result.js", e.file, status, String(r)])
        await load()

        // Si fue PÉRDIDA, la IA analiza qué pasó y por qué (causa raíz + lección).
        if status == "loss" {
            analysisMsg = "🔍 Analizando por qué se perdió \(e.symbol ?? "")…"
            let res = await NodeRunner.run(["scripts/analyze-loss.js", e.file])
            if case .success(let data) = res,
               let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let lesson = obj["lesson"] as? String, !lesson.isEmpty {
                analysisMsg = "📝 \(e.symbol ?? ""): \(lesson)"
            } else {
                analysisMsg = nil
            }
            await load()
        }
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Spacer()
            Image(systemName: "clock.arrow.circlepath").font(.system(size: 32)).foregroundColor(.muted)
            Text("Aún no hay señales en el historial").foregroundColor(.muted)
            Text("Cuando el bot genere señales aparecerán aquí. Marca su resultado para medir el WR.")
                .font(.system(size: 12)).foregroundColor(.muted)
                .multilineTextAlignment(.center).frame(maxWidth: 360)
            Spacer()
        }.frame(maxWidth: .infinity)
    }

    private func statusDot(_ status: String) -> some View {
        Circle().fill(statusColor(status)).frame(width: 9, height: 9)
    }

    private func statusColor(_ status: String) -> Color {
        switch status {
        case "win": return .long
        case "loss": return .short
        case "breakeven": return .muted
        default: return .accent // open
        }
    }

    private func statusLabel(_ e: HistoryEntry) -> String {
        switch e.status {
        case "win": return "Ganada \(e.result_r.map { fmtR($0) } ?? "")"
        case "loss": return "Perdida \(e.result_r.map { fmtR($0) } ?? "")"
        case "breakeven": return "Break-even"
        default: return "Abierta"
        }
    }

    private func open(_ e: HistoryEntry) {
        guard let sym = e.symbol else { return }
        onSelect(ChartRequest(symbol: sym, timeframe: "1h",
                              entry: e.entry, stop: e.stop, target: e.target, isLong: e.isLong))
    }

    private func load() async {
        loading = true
        let result = await NodeRunner.run(["scripts/history.js"])
        loading = false
        if case .success(let data) = result,
           let h = try? JSONDecoder().decode(HistoryResult.self, from: data) {
            stats = h.stats
            entries = h.entries
        }
    }
}

func fmtR(_ r: Double) -> String {
    String(format: "%@%.2fR", r >= 0 ? "+" : "", r)
}

func shortDate(_ iso: String?) -> String {
    guard let iso = iso, iso.count >= 10 else { return "" }
    return String(iso.prefix(10))
}
