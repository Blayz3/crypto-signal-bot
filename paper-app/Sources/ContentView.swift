import SwiftUI

struct ContentView: View {
    @StateObject private var store = AccountStore()

    var body: some View {
        TabView {
            tab(SummaryView(store: store), "Resumen", "chart.line.uptrend.xyaxis")
            tab(PositionsView(store: store), "Posiciones", "list.bullet.rectangle")
            tab(HistoryView(store: store), "Historial", "clock.arrow.circlepath")
        }
        .tint(.up)
        .onAppear { store.start() }
        .onDisappear { store.stop() }
    }

    private func tab<V: View>(_ v: V, _ title: String, _ icon: String) -> some View {
        NavigationStack {
            v.navigationTitle("Crypto Paper")
                #if os(iOS)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .topBarTrailing) { statusBadge } }
                #else
                .toolbar { ToolbarItem { statusBadge } }
                #endif
        }
        .tabItem { Label(title, systemImage: icon) }
    }

    private var statusBadge: some View {
        HStack(spacing: 5) {
            Circle().fill(Color.up).frame(width: 7, height: 7)
            Text(store.lastUpdated.map { _ in "en vivo" } ?? "…")
                .font(.caption2).foregroundStyle(.secondary)
        }
    }
}
