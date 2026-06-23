'use strict';

/**
 * Prueba de control de TradingView (sin IA).
 * Abre TradingView, cambia a un símbolo, recorre 2 temporalidades y captura
 * cada una. Sirve para validar permisos de Accesibilidad/Grabación y los
 * atajos de teclado antes de usar el pipeline visual completo.
 *
 * Uso:  node scripts/tv-test.js [SIMBOLO]
 *       npm run tv-test
 */

const path = require('path');
const { TradingViewController } = require('../src/core/tradingview');

function loadConfig() {
  return require('../config.json');
}

(async () => {
  const config = loadConfig();
  const symbol = process.argv[2] || 'BTCUSDT';
  const tv = new TradingViewController(config);

  console.log('— Prueba de control de TradingView —');
  console.log('Voy a abrir TradingView y controlarlo. NO toques el teclado/ratón ~15s.\n');

  if (!(await tv.isAvailable())) {
    console.error('❌ No tengo permiso para controlar el sistema.');
    console.error('   Da permiso de Accesibilidad a tu Terminal:');
    console.error('   Ajustes > Privacidad y seguridad > Accesibilidad.');
    process.exit(1);
  }

  console.log('1) Activando TradingView…');
  await tv.activate();

  console.log(`2) Cambiando símbolo a ${symbol}…`);
  await tv.setSymbol(symbol);

  const tfs = ['15m', '1h'];
  for (const tf of tfs) {
    console.log(`3) Temporalidad ${tf} + captura…`);
    await tv.setTimeframe(tf);
    const shot = await tv.capture(`tvtest-${symbol}-${tf}`);
    console.log(`   ✅ captura: ${shot.file}`);
  }

  console.log('\n✅ Listo. Abre las capturas y confirma que se ve el gráfico correcto.');
  console.log(`   Carpeta: ${path.dirname((await tv.capture('tvtest-final')).file)}`);
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
