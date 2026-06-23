// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "CryptoSignalBot",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "CryptoSignalBot",
            path: "Sources/CryptoSignalBot",
            resources: [.copy("Resources/lightweight-charts.js")]
        )
    ]
)
