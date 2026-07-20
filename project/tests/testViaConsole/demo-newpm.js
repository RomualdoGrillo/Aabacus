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
		['--yes', 'serve', '-l', PORT, 'app'],
		{ cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'], shell: true }
	);

	await new Promise(function (resolve, reject) {
		const t = setTimeout(function () {
			reject(new Error('timeout avvio server'));
		}, 60000);
		server.stdout.on('data', function (buf) {
			if (/Accepting connections|http/i.test(String(buf))) {
				clearTimeout(t);
				resolve();
			}
		});
		server.stderr.on('data', function (buf) {
			const s = String(buf);
			if (/Accepting connections|http/i.test(s)) {
				clearTimeout(t);
				resolve();
			}
		});
	});

	// piccolo margine dopo "Accepting"
	await new Promise(function (r) {
		setTimeout(r, 400);
	});

	const browser = await chromium.launch({ headless: !KEEP_OPEN });
	const page = await browser.newPage();

	try {
		await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
		await page.waitForFunction(function () {
			return typeof window.$ === 'function' && typeof window.inject === 'function';
		});

		await page.evaluate(function () {
			return new Promise(function (resolve, reject) {
				$.getScript('js/newPM/load.js')
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
		});

		await page.evaluate(function () {
			return new Promise(function (resolve, reject) {
				$.getScript('js/newPM/demo-fixtures.js')
					.done(function () {
						resolve(true);
					})
					.fail(function () {
						reject(new Error('getScript demo-fixtures.js fallito'));
					});
			});
		});

		const summary = await page.evaluate(async function (scenario) {
			return await runNewPmDemo(scenario, { play: true, stepMs: 350 });
		}, SCENARIO);

		console.log('\n========== newPM demo ==========');
		console.log('scenario:', summary.scenario);
		console.log('matched:', summary.matched);
		console.log('msg:', summary.msg || '(ok)');
		console.log('bindings keys:', Object.keys(summary.bindings || {}));
		console.log('--- trace ---');
		(summary.trace || []).forEach(function (step, i) {
			console.log(
				String(i + 1).padStart(2, ' ') +
					') [' +
					step.kind +
					'] ' +
					step.narrate
			);
		});
		console.log('================================\n');

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
