import Foundation
import SwiftUI

/// Ejecuta el motor Node (scanner.js --json) y publica las señales a la UI.
/// Maneja el modo automático con un temporizador configurable.
@MainActor
final class ScanService: ObservableObject {
    @Published var signals: [Signal] = []
    @Published var isScanning = false
    @Published var statusText = "Listo para analizar."
    @Published var lastScan: Date?
    @Published var autoOn = false
    @Published var intervalMinutes: Int = 10
    @Published var metaText = ""

    private var timer: Timer?

    // MARK: - Escaneo manual

    func analyzeNow() {
        guard !isScanning else { return }
        Task { await runScan() }
    }

    // MARK: - Tomar / descartar una señal

    /// "Tomado": persiste la señal en el diario (pasa al historial) y la quita de la lista.
    func take(_ signal: Signal) {
        Task {
            if let data = try? JSONEncoder().encode(signal),
               let json = String(data: data, encoding: .utf8) {
                _ = await NodeRunner.run(["scripts/journal-add.js", json])
            }
            remove(signal)
            statusText = "Trade tomado: \(signal.symbol) → guardado en el historial."
        }
    }

    /// "No lo tomé": descarta la señal (no se guarda, no va al historial).
    func skip(_ signal: Signal) {
        remove(signal)
    }

    private func remove(_ signal: Signal) {
        signals.removeAll { $0.id == signal.id }
    }

    // MARK: - Modo automático

    func toggleAuto(_ on: Bool) {
        autoOn = on
        timer?.invalidate()
        timer = nil
        if on {
            statusText = "Modo automático activo · cada \(intervalMinutes) min."
            analyzeNow()
            let t = Timer.scheduledTimer(withTimeInterval: Double(intervalMinutes) * 60,
                                         repeats: true) { [weak self] _ in
                Task { @MainActor in self?.analyzeNow() }
            }
            timer = t
        } else {
            statusText = "Modo automático apagado."
        }
    }

    func updateInterval(_ minutes: Int) {
        intervalMinutes = minutes
        if autoOn { toggleAuto(true) } // reprograma con el nuevo intervalo
    }

    // MARK: - Ejecutar el motor Node

    private func runScan() async {
        isScanning = true
        statusText = "Analizando el mercado…"
        let result = await NodeRunner.run(["src/core/scanner.js", "--json"])
        isScanning = false
        lastScan = Date()

        switch result {
        case .success(let data):
            guard let scan = try? JSONDecoder().decode(ScanResult.self, from: data) else {
                let raw = String(data: data, encoding: .utf8) ?? ""
                statusText = raw.isEmpty
                    ? "Sin salida del motor (¿ruta de node o del proyecto?)"
                    : "Respuesta no válida: \(String(raw.prefix(120)))"
                return
            }
            if let err = scan.error {
                statusText = "Error del motor: \(err)"
                return
            }
            signals = scan.signals.sorted { ($0.confidence ?? 0) > ($1.confidence ?? 0) }
            if let halted = scan.halted {
                statusText = "⛔ Operativa detenida: \(halted)"
            } else if signals.isEmpty {
                statusText = "Sin señales de alta probabilidad ahora."
            } else {
                statusText = "\(signals.count) señal(es) encontradas."
            }
            let scanned = scan.scanned ?? 0
            let second = scan.visited ?? scan.candidates ?? 0
            metaText = "\(scanned) analizadas · \(second) a IA · \(signals.count) señales"
        case .failure(let error):
            statusText = "No se pudo ejecutar el bot: \(error.localizedDescription)"
        }
    }
}
