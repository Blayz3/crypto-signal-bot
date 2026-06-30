import Foundation

// Modelos que mapean cerebro-trading/paper-account.json (lo escribe el bot en la nube).

struct Account: Codable {
    var updated: String
    var marginPerTrade: Double
    var startingBalance: Double
    var balance: Double
    var equity: Double
    var realizedPnl: Double
    var unrealizedPnl: Double
    var stats: Stats
    var open: [Position]
    var closed: [ClosedTrade]
    var equityCurve: [EquityPoint]
}

struct Stats: Codable {
    var openCount: Int
    var closedCount: Int
    var wins: Int
    var losses: Int
    var winRate: Double?
}

struct Position: Codable, Identifiable {
    var id: String
    var symbol: String
    var dir: String
    var grade: String
    var entry: Double
    var stop: Double
    var target: Double
    var leverage: Double
    var margin: Double
    var notional: Double
    var qty: Double
    var openedAt: String
    var markPrice: Double?
    var unrealizedPnl: Double?
    var unrealizedPct: Double?

    var isLong: Bool { dir == "long" }
}

struct ClosedTrade: Codable, Identifiable {
    var id: String
    var symbol: String
    var dir: String
    var grade: String
    var entry: Double
    var exit: Double
    var leverage: Double
    var margin: Double
    var notional: Double
    var status: String
    var resultR: Double?
    var pnl: Double
    var pnlPct: Double
    var openedAt: String
    var closedAt: String

    var isLong: Bool { dir == "long" }
}

struct EquityPoint: Codable, Identifiable {
    var t: String
    var balance: Double
    var id: String { t }
    var date: Date { ISO8601DateFormatter.shared.date(from: t) ?? Date.distantPast }
}

extension ISO8601DateFormatter {
    static let shared: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    func dateLoose(_ s: String) -> Date? {
        date(from: s) ?? {
            let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime]
            return f.date(from: s)
        }()
    }
}
