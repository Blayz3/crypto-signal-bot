import SwiftUI

enum Fmt {
    static func money(_ v: Double, sign: Bool = false) -> String {
        let s = sign && v > 0 ? "+" : ""
        let neg = v < 0 ? "-" : s
        let a = abs(v)
        let str = a >= 1000 ? String(format: "%.0f", a) : String(format: "%.2f", a)
        return "\(neg)$\(group(str))"
    }
    static func pct(_ v: Double) -> String {
        "\(v > 0 ? "+" : "")\(String(format: "%.1f", v))%"
    }
    static func price(_ v: Double) -> String {
        if v >= 100 { return String(format: "%.2f", v) }
        if v >= 1 { return String(format: "%.4f", v) }
        return String(format: "%.6f", v)
    }
    private static func group(_ s: String) -> String {
        // separador de miles simple
        let parts = s.split(separator: ".")
        guard let intPart = parts.first else { return s }
        var out = ""
        var c = 0
        for ch in String(intPart).reversed() {
            if c != 0 && c % 3 == 0 { out = "," + out }
            out = String(ch) + out; c += 1
        }
        if parts.count > 1 { out += "." + String(parts[1]) }
        return out
    }
}

extension Color {
    static let up = Color(red: 0.15, green: 0.78, blue: 0.55)
    static let down = Color(red: 0.94, green: 0.33, blue: 0.31)
    static let bg = Color(red: 0.05, green: 0.06, blue: 0.09)
    static let card = Color(red: 0.10, green: 0.12, blue: 0.16)
    static func pnl(_ v: Double) -> Color { v > 0 ? .up : v < 0 ? .down : .secondary }
}

extension String {
    /// "BTC/USDT" -> "BTC"
    var base: String { split(separator: "/").first.map(String.init) ?? self }
}

func gradeColor(_ g: String) -> Color {
    switch g {
    case "A+": return .up
    case "A": return Color(red: 0.4, green: 0.7, blue: 1.0)
    case "B": return .orange
    default: return .gray
    }
}
