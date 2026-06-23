import SwiftUI

struct ContentView: View {
    @StateObject private var service = ScanService()
    @State private var tab = 0
    @State private var chartRequest: ChartRequest?
    // Filtro de confianza (persiste entre sesiones).
    @AppStorage("highConfidenceOnly") private var highConfOnly = false
    private let minConf = 75

    /// Señales mostradas según el filtro de confianza.
    private var shownSignals: [Signal] {
        highConfOnly ? service.signals.filter { $0.confidencePct >= minConf } : service.signals
    }
    private var hiddenCount: Int { service.signals.count - shownSignals.count }

    var body: some View {
        ZStack {
            Color.bg.ignoresSafeArea()
            VStack(spacing: 0) {
                header
                controls
                tabPicker
                if tab == 0 {
                    confidenceFilterRow
                    statusBar
                    Divider().overlay(Color.border)
                    content
                } else {
                    Divider().overlay(Color.border)
                    HistoryView { chartRequest = $0 }
                }
            }
        }
        .frame(minWidth: 720, minHeight: 560)
        .sheet(item: $chartRequest) { ChartSheet(request: $0) }
    }

    // Interruptor: solo alta confianza (≥75%) vs todas las señales.
    private var confidenceFilterRow: some View {
        HStack(spacing: 10) {
            Toggle(isOn: $highConfOnly) {
                Text("Solo alta confianza (≥\(minConf)%)")
                    .font(.system(size: 12)).foregroundColor(.text)
            }
            .toggleStyle(.switch)
            .tint(.accent)
            if highConfOnly && hiddenCount > 0 {
                Text("· \(hiddenCount) oculta\(hiddenCount == 1 ? "" : "s")")
                    .font(.system(size: 11)).foregroundColor(.muted)
            }
            Spacer()
        }
        .padding(.horizontal, 22).padding(.bottom, 10)
    }

    private var tabPicker: some View {
        Picker("", selection: $tab) {
            Text("Señales").tag(0)
            Text("Historial").tag(1)
        }
        .pickerStyle(.segmented)
        .labelsHidden()
        .padding(.horizontal, 22).padding(.bottom, 12)
    }

    // MARK: Header

    private var header: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(service.autoOn ? Color.long : Color.accent)
                .frame(width: 10, height: 10)
                .shadow(color: service.autoOn ? Color.long : Color.accent, radius: 6)
            VStack(alignment: .leading, spacing: 2) {
                Text("Crypto Signal Bot").font(.system(size: 18, weight: .bold))
                Text("Cerebro + IA · busca tus mejores entradas")
                    .font(.system(size: 12)).foregroundColor(.muted)
            }
            Spacer()
            if !service.metaText.isEmpty {
                Text(service.metaText).font(.system(size: 11)).foregroundColor(.muted)
            }
        }
        .padding(.horizontal, 22).padding(.vertical, 18)
    }

    // MARK: Controls (los dos botones que pediste)

    private var controls: some View {
        HStack(spacing: 14) {
            Button(action: service.analyzeNow) {
                HStack(spacing: 8) {
                    if service.isScanning {
                        ProgressView().controlSize(.small).tint(.black)
                    } else {
                        Image(systemName: "bolt.fill")
                    }
                    Text(service.isScanning ? "Analizando…" : "Analizar")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity).frame(height: 44)
            }
            .buttonStyle(PrimaryButton())
            .disabled(service.isScanning)

            Toggle(isOn: Binding(
                get: { service.autoOn },
                set: { service.toggleAuto($0) }
            )) {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.triangle.2.circlepath")
                    Text("Automático")
                }
            }
            .toggleStyle(.switch)
            .tint(.long)
            .frame(height: 44)
            .padding(.horizontal, 14)
            .background(Color.panel)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.border))
            .clipShape(RoundedRectangle(cornerRadius: 10))

            Picker("", selection: Binding(
                get: { service.intervalMinutes },
                set: { service.updateInterval($0) }
            )) {
                ForEach([5, 10, 15, 30], id: \.self) { Text("\($0) min").tag($0) }
            }
            .labelsHidden()
            .frame(width: 90, height: 44)
            .disabled(service.isScanning)
        }
        .padding(.horizontal, 22).padding(.bottom, 14)
    }

    private var statusBar: some View {
        HStack {
            Text(service.statusText).font(.system(size: 12)).foregroundColor(.muted)
            Spacer()
            if let last = service.lastScan {
                Text("Último: \(last.formatted(date: .omitted, time: .shortened))")
                    .font(.system(size: 11)).foregroundColor(.muted)
            }
        }
        .padding(.horizontal, 22).padding(.bottom, 12)
    }

    // MARK: Content

    @ViewBuilder private var content: some View {
        if shownSignals.isEmpty {
            VStack(spacing: 10) {
                Spacer()
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.system(size: 38)).foregroundColor(.muted)
                if !service.signals.isEmpty && highConfOnly {
                    Text("Ninguna señal supera el \(minConf)% de confianza")
                        .foregroundColor(.muted).font(.system(size: 14))
                    Text("Hay \(service.signals.count) señal(es) de menor confianza. Apaga el filtro para verlas.")
                        .foregroundColor(.muted).font(.system(size: 12))
                        .multilineTextAlignment(.center).frame(maxWidth: 380)
                } else {
                    Text("Pulsa Analizar para buscar entradas")
                        .foregroundColor(.muted).font(.system(size: 14))
                    Text("El bot filtra el mercado y solo te muestra los setups de alta probabilidad.")
                        .foregroundColor(.muted).font(.system(size: 12))
                        .multilineTextAlignment(.center).frame(maxWidth: 380)
                }
                Spacer()
            }
            .frame(maxWidth: .infinity)
        } else {
            ScrollView {
                LazyVStack(spacing: 14) {
                    ForEach(shownSignals) { signal in
                        SignalCard(signal: signal,
                                   onTake: { service.take(signal) },
                                   onSkip: { service.skip(signal) })
                            .contentShape(Rectangle())
                            .onTapGesture { chartRequest = chartRequest(for: signal) }
                    }
                }
                .padding(22)
            }
        }
    }

    private func chartRequest(for s: Signal) -> ChartRequest {
        ChartRequest(symbol: s.symbol, timeframe: s.timeframe ?? "1h",
                     entry: s.entry, stop: s.stop, target: s.target, isLong: s.isLong)
    }
}

// MARK: - Tarjeta de señal

struct SignalCard: View {
    let signal: Signal
    var onTake: () -> Void = {}
    var onSkip: () -> Void = {}
    private var accent: Color { signal.isLong ? .long : .short }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(signal.symbol).font(.system(size: 18, weight: .bold))
                Spacer()
                Text(signal.action.uppercased())
                    .font(.system(size: 11, weight: .bold))
                    .padding(.horizontal, 10).padding(.vertical, 4)
                    .background(accent.opacity(0.18))
                    .foregroundColor(accent)
                    .clipShape(Capsule())
            }

            HStack(spacing: 22) {
                level("Entrada", signal.entry)
                level("Stop", signal.stop)
                level("Target", signal.target)
                level("R:R", signal.rr, isRatio: true)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Confianza \(signal.confidencePct)%")
                        .font(.system(size: 11)).foregroundColor(.muted)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.bg).frame(height: 5)
                            Capsule().fill(Color.accent)
                                .frame(width: geo.size.width * CGFloat(signal.confidencePct) / 100,
                                       height: 5)
                        }
                    }.frame(width: 120, height: 5)
                }
            }

            // Plan de órdenes concreto (market / limit buy / limit sell + TP + SL).
            HStack(spacing: 8) {
                Image(systemName: signal.isLimit ? "mappin.circle.fill" : "bolt.circle.fill")
                    .foregroundColor(accent)
                Text("\(signal.entryOrder)  ·  TP \(signal.takeProfitOrder.replacingOccurrences(of: " LIMIT", with: ""))  ·  SL \(signal.stopOrder.replacingOccurrences(of: "STOP @ ", with: ""))")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.text)
            }
            .padding(.horizontal, 10).padding(.vertical, 7)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(accent.opacity(0.10))
            .clipShape(RoundedRectangle(cornerRadius: 8))

            if let r = signal.rationale, !r.isEmpty {
                Text(r).font(.system(size: 13)).foregroundColor(.text.opacity(0.9))
                    .fixedSize(horizontal: false, vertical: true)
            }

            HStack(spacing: 8) {
                if let s = signal.setup, !s.isEmpty { tag("🧠 \(s)") }
                if let c = signal.confluence, c > 0 { tag("🔗 \(c) factores") }
                if let ot = signal.orderType, !ot.isEmpty { tag(ot == "limit" ? "📍 limit" : "⚡ market") }
                if let tf = signal.timeframe, !tf.isEmpty { tag(tf) }
                if let st = signal.style, !st.isEmpty { tag(st) }
                if let rg = signal.regime, !rg.isEmpty { tag(rg) }
            }

            Divider().overlay(Color.border)

            HStack(spacing: 10) {
                Button(action: onTake) {
                    HStack(spacing: 6) { Image(systemName: "checkmark.circle.fill"); Text("Tomado") }
                        .font(.system(size: 13, weight: .semibold))
                        .frame(maxWidth: .infinity).frame(height: 36)
                        .foregroundColor(.black).background(Color.long)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }.buttonStyle(.plain)

                Button(action: onSkip) {
                    HStack(spacing: 6) { Image(systemName: "xmark.circle"); Text("No lo tomé") }
                        .font(.system(size: 13, weight: .semibold))
                        .frame(maxWidth: .infinity).frame(height: 36)
                        .foregroundColor(.muted)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.border))
                }.buttonStyle(.plain)

                Text("Toca la tarjeta para ver el gráfico")
                    .font(.system(size: 10)).foregroundColor(.muted)
            }
        }
        .padding(16)
        .background(Color.panel)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.border)
        )
        .overlay(Rectangle().fill(accent).frame(width: 4)
            .clipShape(RoundedRectangle(cornerRadius: 4)), alignment: .leading)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func level(_ label: String, _ value: Double?, isRatio: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.system(size: 11)).foregroundColor(.muted)
            Text(format(value, isRatio: isRatio)).font(.system(size: 15, weight: .semibold))
        }
    }

    private func tag(_ s: String) -> some View {
        Text(s).font(.system(size: 11)).foregroundColor(.muted)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(Color.bg)
            .overlay(RoundedRectangle(cornerRadius: 5).stroke(Color.border))
            .clipShape(RoundedRectangle(cornerRadius: 5))
    }

    private func format(_ v: Double?, isRatio: Bool) -> String {
        guard let v = v else { return "—" }
        if isRatio { return String(format: "%.2f", v) }
        return priceString(v)
    }
}

/// Formatea un precio con separador de miles y decimales según su magnitud.
/// (Arregla el bug donde BTC/precios ≥1000 no se mostraban.)
func priceString(_ v: Double) -> String {
    let f = NumberFormatter()
    f.numberStyle = .decimal
    f.usesGroupingSeparator = true
    if v >= 1000 { f.maximumFractionDigits = 2 }
    else if v >= 1 { f.maximumFractionDigits = 4 }
    else { f.maximumFractionDigits = 6 }
    return f.string(from: NSNumber(value: v)) ?? String(format: "%.2f", v)
}

// MARK: - Estilo de botón y colores

struct PrimaryButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(.black)
            .background(
                LinearGradient(colors: [Color.accent, Color.accent.opacity(0.8)],
                               startPoint: .top, endPoint: .bottom)
            )
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}

extension Color {
    static let bg = Color(red: 0.05, green: 0.065, blue: 0.09)
    static let panel = Color(red: 0.086, green: 0.106, blue: 0.133)
    static let border = Color(red: 0.16, green: 0.19, blue: 0.25)
    static let text = Color(red: 0.9, green: 0.93, blue: 0.95)
    static let muted = Color(red: 0.55, green: 0.58, blue: 0.62)
    static let accent = Color(red: 0.345, green: 0.65, blue: 1.0)
    static let long = Color(red: 0.18, green: 0.63, blue: 0.26)
    static let short = Color(red: 0.97, green: 0.32, blue: 0.29)
}
