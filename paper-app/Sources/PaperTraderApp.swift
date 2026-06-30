import SwiftUI

@main
struct PaperTraderApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
        #if os(macOS)
        .defaultSize(width: 460, height: 760)
        #endif
    }
}
