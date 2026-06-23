import AppKit

/// Icono de la app (el que se ve en el Dock / al cambiar de app con ⌘-Tab).
/// 1) Si existe `~/crypto-signal-bot/swift-app/logo.png`, usa ese (tu logo).
/// 2) Si no, dibuja uno por código (velas sobre fondo degradado).
enum AppIcon {
    static func make() -> NSImage {
        let custom = NSString(string: "~/crypto-signal-bot/swift-app/logo.png").expandingTildeInPath
        if FileManager.default.fileExists(atPath: custom), let img = NSImage(contentsOfFile: custom) {
            return img
        }
        return drawn()
    }

    private static func drawn() -> NSImage {
        let size = NSSize(width: 512, height: 512)
        let img = NSImage(size: size)
        img.lockFocus()

        // Fondo: rectángulo redondeado con degradado azul → oscuro.
        let bg = NSBezierPath(roundedRect: NSRect(x: 24, y: 24, width: 464, height: 464),
                              xRadius: 110, yRadius: 110)
        let grad = NSGradient(colors: [
            NSColor(red: 0.13, green: 0.42, blue: 0.98, alpha: 1),
            NSColor(red: 0.05, green: 0.07, blue: 0.12, alpha: 1),
        ])
        grad?.draw(in: bg, angle: -90)

        // Velas japonesas.
        func candle(x: CGFloat, bodyY: CGFloat, bodyH: CGFloat, wickH: CGFloat, color: NSColor) {
            color.setFill()
            let w: CGFloat = 54
            NSBezierPath(rect: NSRect(x: x + w / 2 - 5, y: bodyY - (wickH - bodyH) / 2,
                                      width: 10, height: wickH)).fill()
            NSBezierPath(roundedRect: NSRect(x: x, y: bodyY, width: w, height: bodyH),
                         xRadius: 7, yRadius: 7).fill()
        }
        let green = NSColor(red: 0.18, green: 0.80, blue: 0.36, alpha: 1)
        let red = NSColor(red: 0.97, green: 0.32, blue: 0.29, alpha: 1)
        candle(x: 150, bodyY: 175, bodyH: 95, wickH: 165, color: red)
        candle(x: 234, bodyY: 205, bodyH: 150, wickH: 230, color: green)
        candle(x: 318, bodyY: 250, bodyH: 120, wickH: 190, color: green)

        img.unlockFocus()
        return img
    }
}
