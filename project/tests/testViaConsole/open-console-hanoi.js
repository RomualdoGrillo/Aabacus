#!/usr/bin/env node
/**
 * Apre Chromium con hanoi4 preloadato e helper di test già iniettati.
 * Usa DevTools → Console per probe / simulateMove.
 *
 * Prerequisito: npx --yes serve -l 5500 app  (dalla root del repo)
 */
const { chromium } = require('@playwright/test');
const { injectTestHelpers } = require('../helpers/injectTest');

const DEFAULT_URL =
	'http://127.0.0.1:5500/?demo=1&preloadPath=./Data/exercises/hanoi4.mmls';

async function main() {
	const url = process.env.URL || DEFAULT_URL;
	const browser = await chromium.launch({ headless: false });
	const page = await browser.newPage();

	try {
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
	} catch (err) {
		console.error(
			'\nImpossibile aprire ' +
				url +
				'\nAvvia prima il server dalla root del repo:\n  npx --yes serve -l 5500 app\n'
		);
		await browser.close();
		process.exit(1);
	}

	await injectTestHelpers(page, { exercise: 'hanoi' });

	console.log('\n--- Test manuali via console ---');
	console.log('DevTools → Console (Cmd+Opt+I / F12)\n');
	console.log('API disponibili:');
	console.log('  window.__aabacusTest');
	console.log('  window.__aabacusTestExercises.hanoi\n');
	console.log('Esempi:');
	console.log('  await __aabacusTest.waitForReady()');
	console.log(
		'  await __aabacusTestExercises.hanoi.simulateMove({ fromRodIndex: 0, toRodIndex: 1 })'
	);
	console.log('  __aabacusTest.getState()\n');
	console.log('Chiudi il browser o premi Resume nel Playwright Inspector per uscire.\n');

	await page.pause();
	await browser.close();
}

main().catch(function (err) {
	console.error(err);
	process.exit(1);
});
