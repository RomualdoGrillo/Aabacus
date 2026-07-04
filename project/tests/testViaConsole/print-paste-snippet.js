#!/usr/bin/env node
/**
 * Stampa in stdout il codice da incollare in DevTools Console
 * (alternativa senza Playwright — va rieseguito dopo ogni reload pagina).
 *
 * Uso:
 *   node testViaConsole/print-paste-snippet.js | pbcopy   # macOS: copia negli appunti
 *   node testViaConsole/print-paste-snippet.js > /tmp/aabacus-console.js
 */
const fs = require('fs');
const path = require('path');

const helpersDir = path.join(__dirname, '../helpers');

const core = fs.readFileSync(path.join(helpersDir, 'browser/core.js'), 'utf8');
const hanoi = fs.readFileSync(path.join(helpersDir, 'exercises/hanoi.js'), 'utf8');

process.stdout.write(
	[
		'// Incolla tutto questo blocco in DevTools Console (dopo aver aperto l\'esercizio).',
		'// Ordine: core → hanoi. Richiede jQuery e Sortable già caricati dall\'app.',
		'',
		core,
		'',
		hanoi,
		'',
		'// Poi ad esempio:',
		'// await __aabacusTest.waitForReady()',
		'// await __aabacusTestExercises.hanoi.simulateMove({ fromRodIndex: 0, toRodIndex: 1 })',
		''
	].join('\n')
);
