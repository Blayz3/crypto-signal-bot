import Foundation

/// Ejecuta el motor Node del proyecto y devuelve la salida (stdout) como Data.
/// Compartido por el escaneo, el gráfico (OHLCV) y el historial.
enum NodeRunner {
    static let nodePath = "/usr/local/bin/node"
    static let projectDir = NSString(string: "~/crypto-signal-bot").expandingTildeInPath

    static func run(_ args: [String]) async -> Result<Data, Error> {
        await withCheckedContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                let proc = Process()
                proc.executableURL = URL(fileURLWithPath: nodePath)
                proc.arguments = args
                proc.currentDirectoryURL = URL(fileURLWithPath: projectDir)

                let out = Pipe()
                let err = Pipe()
                proc.standardOutput = out
                proc.standardError = err

                do {
                    try proc.run()
                } catch {
                    continuation.resume(returning: .failure(error))
                    return
                }
                let data = out.fileHandleForReading.readDataToEndOfFile()
                _ = err.fileHandleForReading.readDataToEndOfFile()
                proc.waitUntilExit()
                continuation.resume(returning: .success(data))
            }
        }
    }
}
