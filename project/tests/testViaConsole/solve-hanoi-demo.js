#!/usr/bin/env node
/**
 * Risolve hanoi4 (4 dischi) mossa per mossa nel browser.
 * Usa simulateMove in-page (cursore rosso con ?demo=1) + pause tra le mosse.
 *
 * Prerequisito: npx --yes serve -l 5500 app  (dalla root del repo)
 *
 * Env:
 *   PAUSE_MS     pausa dopo ogni mossa (default 1500)
 *   STEP_DELAY  ms tra punti del drag (default 14)
 *   KEEP_OPEN=1  lascia aperto il browser alla fine (Playwright Inspector)
 *   URL          override URL esercizio
 */
const { chromium } = require('@playwright/test');
const { injectTestHelpers } = require('../helpers/injectTest');

const DEFAULT_URL =
	'http://127.0.0.1:5500/?demo=1&preloadPath=./Data/exercises/hanoi4.mmls';
const PAUSE_MS = process.env.PAUSE_MS ? Number(process.env.PAUSE_MS) : 1500;
const STEP_DELAY = process.env.STEP_DELAY ? Number(process.env.STEP_DELAY) : 14;

function buildHanoiMoves(n, from, to, aux, moves) {
	moves = moves || [];
	if (n === 0) {
		return moves;
	}
	buildHanoiMoves(n - 1, from, aux, to, moves);
	moves.push({ fromRodIndex: from, toRodIndex: to });
	buildHanoiMoves(n - 1, aux, to, from, moves);
	return moves;
}

async function waitForHanoiReady(page) {
	await page.evaluate(async () => {
		await window.__aabacusTest.waitForReady();
		var start = Date.now();
		while (!window.__aabacusTestExercises.hanoi.isExerciseReady()) {
			if (Date.now() - start > 15000) {
				throw new Error(
					'Hanoi not ready: ' +
						JSON.stringify(window.__aabacusTestExercises.hanoi.getExerciseState())
				);
			}
			await new Promise(function (r) {
				setTimeout(r, 100);
			});
		}
	});
}

async function simulateHanoiMove(page, move, stepDelayMs) {
	return page.evaluate(
		async function (opts) {
			return await window.__aabacusTestExercises.hanoi.simulateMove({
				fromRodIndex: opts.fromRodIndex,
				toRodIndex: opts.toRodIndex,
				steps: 35,
				stepDelayMs: opts.stepDelayMs,
				showCursor: true,
				settleMs: 2500
			});
		},
		{ fromRodIndex: move.fromRodIndex, toRodIndex: move.toRodIndex, stepDelayMs: stepDelayMs }
	);
}

async function main() {
	const url = process.env.URL || DEFAULT_URL;
	const moves = buildHanoiMoves(4, 0, 2, 1);
	const browser = await chromium.launch({ headless: false, slowMo: 30 });
	const page = await browser.newPage();
	page.setDefaultTimeout(60000);

	try {
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
	} catch (err) {
		console.error(
			'\nImpossibile aprire ' +
				url +
				'\nAvvia: npx --yes serve -l 5500 app\n'
		);
		await browser.close();
		process.exit(1);
	}

	await injectTestHelpers(page, { exercise: 'hanoi' });
	await waitForHanoiReady(page);

	const initial = await page.evaluate(function () {
		return window.__aabacusTestExercises.hanoi.getRodDiscCounts();
	});
	console.log('\nTorre di Hanoi — 4 dischi, obiettivo: tutti sulla terza colonna');
	console.log('Stato iniziale:', initial, '(colonne 0, 1, 2)');
	console.log('Mosse previste:', moves.length, '\n');

	for (var i = 0; i < moves.length; i++) {
		var move = moves[i];
		var label =
			'Mossa ' + (i + 1) + '/' + moves.length + ': colonna ' + move.fromRodIndex + ' → ' + move.toRodIndex;

		var result = null;
		for (var attempt = 1; attempt <= 3; attempt++) {
			result = await simulateHanoiMove(page, move, STEP_DELAY);
			if (result.moved) {
				break;
			}
			console.warn(label + ' — tentativo ' + attempt + ' fallito, riprovo…');
			await page.waitForTimeout(600);
		}

		var status = result.moved ? 'OK' : 'FALLITA';
		console.log(
			label + ' — ' + status + '  ' + JSON.stringify(result.before) + ' → ' + JSON.stringify(result.after)
		);

		if (!result.moved) {
			console.error('\nMossa non riuscita, interrompo.');
			if (process.env.KEEP_OPEN) {
				await page.pause();
			}
			await browser.close();
			process.exit(1);
		}

		if (PAUSE_MS > 0 && i < moves.length - 1) {
			await page.waitForTimeout(PAUSE_MS);
		}
	}

	const final = await page.evaluate(function () {
		return window.__aabacusTestExercises.hanoi.getRodDiscCounts();
	});
	const solved = final[0] === 0 && final[1] === 0 && final[2] === 4;

	console.log('\nStato finale:', final);
	console.log(solved ? 'Obiettivo raggiunto: [0, 0, 4]' : 'Obiettivo NON raggiunto');

	await page.waitForTimeout(3000);
	if (process.env.KEEP_OPEN) {
		console.log('\nPremi Resume nel Playwright Inspector per chiudere.\n');
		await page.pause();
	} else {
		console.log('\nFine demo (KEEP_OPEN=1 per lasciare aperto il browser).\n');
	}
	await browser.close();
}

main().catch(function (err) {
	console.error(err);
	process.exit(1);
});
