#!/usr/bin/env node
/**
 * Demo newPM: apre l'app, carica newPM, inserisce x_+y_ vs a+b, anima il matching.
 *
 *   cd project/tests && node testViaConsole/demo-newpm.js
 *
 * Opzioni:
 *   KEEP_OPEN=1  lascia il browser aperto
 *   SCENARIO=reject  prova times(a,b) che non calza
 */
const { chromium } = require('@playwright/test');

const PORT = process.env.PORT || '5598';
const BASE = 'http://127.0.0.1:' + PORT;
const SCENARIO = process.env.SCENARIO || 'match';
const KEEP_OPEN = process.env.KEEP_OPEN === '1';

async function main() {
	const { spawn } = require('child_process');
	const path = require('path');
	const repoRoot = path.join(__dirname, '../../..');

	const server = spawn(
		'npx',
		['--yes', 'serve', '-l', 'tcp://127.0.0.1:' + PORT, 'app'],
		{ cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'], shell: true }
	);

	const started = Date.now();
	while (Date.now() - started < 60000) {
		try {
			const res = await fetch(BASE + '/');
			if (res.ok || res.status === 200) break;
		} catch (e) {
			/* retry */
		}
		await new Promise(function (r) {
			setTimeout(r, 250);
		});
	}
	// ultimo check
	const probe = await fetch(BASE + '/').catch(function () {
		return null;
	});
	if (!probe || !probe.ok) {
		server.kill('SIGTERM');
		throw new Error('server non raggiungibile su ' + BASE);
	}

	const browser = await chromium.launch({ headless: !KEEP_OPEN });
	const page = await browser.newPage();

	try {
		await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForFunction(function () {
			return typeof window.$ === 'function' && typeof window.inject === 'function';
		});

		const bust = String(Date.now());
		await page.evaluate(function (bust) {
			return new Promise(function (resolve, reject) {
				$.getScript('js/newPM/load.js?v=' + bust)
					.done(function () {
						var n = 0;
						var id = setInterval(function () {
							n++;
							if (window.newPM && window.newPM.version) {
								clearInterval(id);
								resolve(true);
							} else if (n > 80) {
								clearInterval(id);
								reject(new Error('newPM non pronto'));
							}
						}, 50);
					})
					.fail(function () {
						reject(new Error('getScript load.js fallito'));
					});
			});
		}, bust);

		// load.js auto-start può aver già caricato i moduli: forza reload moduli se serve
		await page.evaluate(function (bust) {
			return new Promise(function (resolve, reject) {
				$.getScript('js/newPM/demo-fixtures.js?v=' + bust)
					.done(function () {
						resolve(true);
					})
					.fail(function () {
						reject(new Error('getScript demo-fixtures.js fallito'));
					});
			});
		}, bust);

		const shotDir = require('path').join(__dirname, '../../../app/js/newPM/_shots');
		require('fs').mkdirSync(shotDir, { recursive: true });

		const playPromise = page.evaluate(async function (scenario) {
			return await runNewPmDemo(scenario, { play: true, stepMs: 1100 });
		}, SCENARIO);

		// screenshot durante le fasi chiave
		await page.waitForTimeout(900);
		await page.screenshot({
			path: require('path').join(shotDir, '01-drag.png'),
			fullPage: true
		});
		await page.waitForTimeout(1200);
		await page.screenshot({
			path: require('path').join(shotDir, '02-ghost.png'),
			fullPage: true
		});
		await page.waitForTimeout(2200);
		await page.screenshot({
			path: require('path').join(shotDir, '03-fit.png'),
			fullPage: true
		});

		const summary = await playPromise;

		console.log('\n========== newPM demo (schema fasi) ==========');
		console.log('scenario:', summary.scenario);
		console.log('matched:', summary.matched);
		console.log('msg:', summary.msg || '(ok)');
		console.log('bindings:', summary.bindings);
		console.log('--- fasi visuali ---');
		(summary.phases || []).forEach(function (step, i) {
			console.log(
				String(i + 1).padStart(2, ' ') +
					') [' +
					step.phase +
					' / ' +
					step.kind +
					'] ' +
					step.narrate
			);
		});
		console.log('==============================================\n');

		if (KEEP_OPEN) {
			console.log('KEEP_OPEN=1 — chiudi il browser per terminare.\n');
			await page.pause();
		} else {
			await page.waitForTimeout(1200);
		}
	} finally {
		await browser.close();
		server.kill('SIGTERM');
	}
}

main().catch(function (err) {
	console.error(err);
	process.exit(1);
});
