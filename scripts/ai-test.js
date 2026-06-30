'use strict';

/**
 * Diagnóstico: prueba cada proveedor de IA directamente (1 llamada chica) y
 * reporta si responde o qué error da. Útil para confirmar GEMINI/GROQ keys.
 * Uso: node scripts/ai-test.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { AIEngine } = require('../src/core/ai');
const config = require('../config.json');

(async () => {
  console.log('Keys presentes:', {
    GEMINI: !!process.env.GEMINI_API_KEY,
    GROQ: !!process.env.GROQ_API_KEY,
    OPENROUTER: !!process.env.OPENROUTER_API_KEY,
  });
  const ai = new AIEngine(config, process.env.OPENROUTER_API_KEY);
  console.log('Cadena:', ai._decisionChain().map((c) => c.provider.name + ':' + c.model).join('  →  '));
  console.log('');
  for (const p of ai.providers) {
    const m = (p.decision_models || [])[0];
    try {
      const t0 = Date.now();
      const content = await ai._chat(
        p, m,
        [{ role: 'user', content: 'Responde UNICAMENTE el JSON: {"ok":true}' }],
        { jsonMode: true, maxTokens: 50 }
      );
      console.log(`OK  ${p.name}:${m}  → ${String(content).replace(/\s+/g, ' ').slice(0, 80)}  (${Date.now() - t0}ms)`);
    } catch (e) {
      console.log(`FALLO  ${p.name}:${m}  → ${e.message}`);
    }
  }

  // --- Escaneo real: ¿la IA produce trades o dice "none"? ---
  console.log('\n=== ESCANEO REAL ===');
  const { runScan, loadConfig } = require('../src/core/scanner');
  const res = await runScan(loadConfig(), {});
  const ideas = res.ideas || [];
  const grades = {};
  for (const e of ideas) grades[e.grade] = (grades[e.grade] || 0) + 1;
  console.log('Candidatas a IA:', res.candidates, '| grados:', JSON.stringify(grades));
  const withPlan = ideas.filter((e) => e.hasPlan);
  console.log('Con plan IA (A+/A/B):', withPlan.length, '| C (mecánico):', ideas.length - withPlan.length);
  withPlan.slice(0, 3).forEach((e) => console.log(`  [${e.grade}] ${e.dir} ${e.symbol} conf ${e.confidence} — ${(e.rationale || '').slice(0, 110)}`));
  const aiErr = (res.errors || []).filter((e) => e.error && !/marketdata/.test(e.error));
  console.log('Errores de IA:', aiErr.length, aiErr[0] ? '→ ej: ' + aiErr[0].error.slice(0, 120) : '');
})().catch((e) => { console.error('fatal:', e.message); process.exit(1); });
