import SwiftUI
import WebKit

/// WKWebView que renderiza un gráfico de velas (TradingView Lightweight Charts)
/// con las líneas del setup dibujadas: entrada, stop y target.
struct ChartWebView: NSViewRepresentable {
    let candles: [Candle]
    let entry: Double?
    let stop: Double?
    let target: Double?
    let isLong: Bool

    func makeNSView(context: Context) -> WKWebView {
        WKWebView()
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        webView.loadHTMLString(Self.html(candles: candles, entry: entry, stop: stop,
                                         target: target, isLong: isLong),
                               baseURL: nil)
    }

    /// Lee la librería de gráficos empaquetada en la app (sin depender de internet).
    private static let libJS: String = {
        guard let url = Bundle.module.url(forResource: "lightweight-charts", withExtension: "js"),
              let s = try? String(contentsOf: url, encoding: .utf8) else {
            return ""
        }
        return s
    }()

    static func html(candles: [Candle], entry: Double?, stop: Double?, target: Double?, isLong: Bool) -> String {
        let candlesJSON = (try? String(data: JSONEncoder().encode(candles), encoding: .utf8) ?? "[]") ?? "[]"
        func line(_ v: Double?, _ color: String, _ title: String) -> String {
            guard let v = v else { return "" }
            return """
            series.createPriceLine({ price: \(v), color: '\(color)', lineWidth: 2,
              lineStyle: 2, axisLabelVisible: true, title: '\(title)' });
            """
        }
        return """
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <style>html,body,#c{height:100%;margin:0;background:#0d1117;}</style>
        <script>\(libJS)</script>
        </head><body><div id="c"></div><script>
        const candles = \(candlesJSON);
        const chart = LightweightCharts.createChart(document.getElementById('c'), {
          layout: { background: { color: '#0d1117' }, textColor: '#8b949e' },
          grid: { vertLines: { color: '#1c2230' }, horzLines: { color: '#1c2230' } },
          rightPriceScale: { borderColor: '#283041' },
          timeScale: { borderColor: '#283041', timeVisible: true, secondsVisible: false },
          crosshair: { mode: 0 },
        });
        const series = chart.addCandlestickSeries({
          upColor: '#2ea043', downColor: '#f85149', borderVisible: false,
          wickUpColor: '#2ea043', wickDownColor: '#f85149',
        });
        series.setData(candles);
        \(line(entry, "#58a6ff", "Entrada"))
        \(line(stop, "#f85149", "Stop"))
        \(line(target, "#2ea043", "Target"))
        if (candles.length) {
          series.setMarkers([{ time: candles[candles.length-1].time,
            position: '\(isLong ? "belowBar" : "aboveBar")',
            color: '#58a6ff', shape: '\(isLong ? "arrowUp" : "arrowDown")', text: '\(isLong ? "LONG" : "SHORT")' }]);
        }
        chart.timeScale().fitContent();
        window.addEventListener('resize', () => chart.applyOptions({}));
        </script></body></html>
        """
    }
}

/// Hoja modal: carga el OHLCV del símbolo y muestra el gráfico con el setup.
struct ChartSheet: View {
    let request: ChartRequest
    @Environment(\.dismiss) private var dismiss

    @State private var candles: [Candle] = []
    @State private var loading = true
    @State private var errorText: String?

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(request.symbol).font(.system(size: 16, weight: .bold))
                    Text("\(request.timeframe) · setup dibujado")
                        .font(.system(size: 11)).foregroundColor(.muted)
                }
                Spacer()
                legend
                Button("Cerrar") { dismiss() }
            }
            .padding(14)
            Divider().overlay(Color.border)

            ZStack {
                Color.bg
                if loading {
                    ProgressView("Cargando gráfico…").tint(.accent)
                } else if let e = errorText {
                    Text(e).foregroundColor(.short).padding()
                } else {
                    ChartWebView(candles: candles, entry: request.entry, stop: request.stop,
                                 target: request.target, isLong: request.isLong)
                }
            }
        }
        .frame(width: 820, height: 540)
        .background(Color.bg)
        .task { await load() }
    }

    private var legend: some View {
        HStack(spacing: 12) {
            legendItem(.accent, "Entrada")
            legendItem(.short, "Stop")
            legendItem(.long, "Target")
        }
    }

    private func legendItem(_ c: Color, _ t: String) -> some View {
        HStack(spacing: 4) {
            Rectangle().fill(c).frame(width: 12, height: 2)
            Text(t).font(.system(size: 11)).foregroundColor(.muted)
        }
    }

    private func load() async {
        loading = true
        let result = await NodeRunner.run(["scripts/ohlcv.js", request.symbol, request.timeframe, "200"])
        loading = false
        switch result {
        case .success(let data):
            if let ohlcv = try? JSONDecoder().decode(OHLCVResult.self, from: data) {
                if let e = ohlcv.error { errorText = e } else { candles = ohlcv.candles }
            } else {
                errorText = "No se pudo leer el gráfico."
            }
        case .failure(let err):
            errorText = err.localizedDescription
        }
    }
}
