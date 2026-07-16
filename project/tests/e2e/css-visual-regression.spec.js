const { test, expect } = require('@playwright/test');
const { injectTestHelpers } = require('../helpers/injectTest');

/**
 * Regressione visiva CSS.
 *
 * Presidia il refactor CSS in corso: carica ciascun esercizio via query string
 * e cattura uno screenshot dell'area di rendering (`#canvasRole`). Confrontando
 * con la baseline catturata dal CSS pre-refactor si rileva qualunque alterazione
 * visiva introdotta dalle modifiche in `app/css/`.
 *
 * Si fotografa solo `#canvasRole` (non l'intera pagina) perché le colonne laterali
 * si nascondono su :not(:hover) e il loro fade introdurrebbe flakiness.
 */

// Viewport fisso e deterministico.
test.use({ viewport: { width: 1280, height: 900 } });

// nome leggibile -> preloadPath
const EXERCISES = [
	{ name: 'hanoi4', path: './Data/exercises/hanoi4.mmls' },
	{ name: 'hanoi5', path: './Data/exercises/hanoi5.mmls' },
	{ name: 'CommutativaAssociativaBinarie', path: './Data/exercises/CommutativaAssociativaBinarie.mmls' },
	{ name: 'assGenDiretta_e_Inversa', path: './Data/exercises/assGenDiretta_e_Inversa.mmls' },
	{ name: 'prop_comm_gen', path: './Data/exercises/prop_comm_gen.mmls' },
	{ name: 'Crotti', path: './Data/exercises/Crotti.mmls' },
	{ name: 'distributivaOrizzontale', path: './Data/exercises/distributivaOrizzontale.mmls' },
	{ name: 'SemplificaElementiNeutri', path: './Data/exercises/SemplificaElementiNeutri.mmls' },
	{ name: 'threeplustwo', path: './Data/exercises/threeplustwo.mmls' },
	{ name: 'threetimestwo', path: './Data/exercises/threetimestwo.mmls' },
	{ name: 'factorizeSix', path: './Data/exercises/factorizeSix.mmls' },
	{ name: 'UseNumberNames', path: './Data/exercises/UseNumberNames.mmls' },
	{ name: 'riordina_somma_molt', path: './Data/exercises/riordina_somma_molt.mmls' },
	{ name: 'dbo', path: './Data/exercises/dbo/dbo.mmls' }
];

test.describe('CSS visual regression', () => {
	for (const exercise of EXERCISES) {
		test(exercise.name, async ({ page }) => {
			await page.goto('/?preloadPath=' + exercise.path);
			await injectTestHelpers(page);

			// waitForReady lancia se `#canvasRole` non contiene almeno un [data-enode]
			// entro il timeout: rendiamo il fallimento esplicito e leggibile.
			try {
				await page.evaluate(() => window.__aabacusTest.waitForReady());
			} catch (err) {
				throw new Error(
					'Esercizio "' + exercise.name + '" (' + exercise.path + ') non pronto: ' +
						'#canvasRole non contiene [data-enode] entro il timeout. ' +
						'Causa originale: ' + (err && err.message ? err.message : String(err))
				);
			}

			// Settle: lascia stabilizzare layout/rendering prima dello scatto.
			await page.waitForTimeout(300);

			await expect(page.locator('#canvasRole')).toHaveScreenshot('canvas-' + exercise.name + '.png', {
				animations: 'disabled',
				maxDiffPixelRatio: 0.01
			});
		});
	}
});

/**
 * Copertura "vista ampia": presidia i selettori che le baseline `#canvasRole`
 * NON esercitano perché stanno fuori dall'area di rendering.
 *
 * Perché `#centralColumn` e non l'intera pagina: `#centralColumn` contiene
 * palette + `#canvas`/`#canvasRole` + `#result`, mentre le colonne laterali
 * (`#leftColumn`/`#rightColumn`) — che sfumano via `:not(:hover)` e sarebbero
 * fonte di flakiness — ne sono FUORI (sono sibling). Così otteniamo una vista
 * più ampia di `#canvasRole` (in particolare include `#result`) restando
 * deterministici, senza iniettare CSS di stabilizzazione.
 *
 * `#result` è nascosto se `body` non ha `.gameMode` (styleIDEhideSections.css).
 * `threetimestwo.mmls` ha `"gameMode":true` nei settings e una sezione `result`
 * con nodi `num`: l'app applica `.gameMode` al body in fase di load e popola
 * `#result` — meccanismo reale, nessuna API inventata.
 */
const SHOT = { animations: 'disabled', maxDiffPixelRatio: 0.01 };
const GAMEMODE_EXERCISE = './Data/exercises/threetimestwo.mmls';

async function loadAndWait(page, preloadPath) {
	await page.goto('/?preloadPath=' + preloadPath);
	await injectTestHelpers(page);
	try {
		await page.evaluate(() => window.__aabacusTest.waitForReady());
	} catch (err) {
		throw new Error(
			'Preload "' + preloadPath + '" non pronto: #canvasRole senza [data-enode]. ' +
				'Causa: ' + (err && err.message ? err.message : String(err))
		);
	}
}

test.describe('CSS visual regression — wide view', () => {
	// A) Vista ampia con #result: copre `num:not(:hover)` esteso a #result e lo
	//    stile di #result, insieme a canvas/palette, in un solo scatto stabile.
	test('centralView-threetimestwo', async ({ page }) => {
		await loadAndWait(page, GAMEMODE_EXERCISE);

		// Attende l'attivazione reale di gameMode (#result visibile) e il popolamento.
		try {
			await page.waitForFunction(
				() => {
					const inGameMode = document.body.classList.contains('gameMode');
					const result = document.querySelector('#result');
					return inGameMode && result && result.querySelector('[data-enode]');
				},
				null,
				{ timeout: 10000 }
			);
		} catch (err) {
			throw new Error(
				'centralView: #result non attivabile in modo deterministico ' +
					'(atteso body.gameMode + #result con [data-enode]). ' +
					'Causa: ' + (err && err.message ? err.message : String(err))
			);
		}

		await page.waitForTimeout(300);
		await expect(page.locator('#centralColumn')).toHaveScreenshot('wide-centralView-threetimestwo.png', SHOT);
	});

	// C) .celebration: reward appeso a #result al completamento. Non risolviamo
	//    l'esercizio (il solve completo è costoso/fragile): invochiamo la funzione
	//    app REALE `VisualizeCelebration` (stessa usata dal branch di reward in
	//    game.js), che appende `.celebration` a #result esattamente come in
	//    produzione. Deterministico e stabile; esercita la regola CSS `.celebration`.
	test('celebration-threetimestwo', async ({ page }) => {
		await loadAndWait(page, GAMEMODE_EXERCISE);
		await page.waitForFunction(() => document.body.classList.contains('gameMode'), null, {
			timeout: 10000
		});

		await page.evaluate(() => {
			if (typeof VisualizeCelebration !== 'function') {
				throw new Error('VisualizeCelebration non disponibile come globale app');
			}
			VisualizeCelebration('images/goal.svg');
		});

		// Attende il caricamento effettivo dell'immagine di reward.
		try {
			await page.waitForFunction(
				() => {
					const img = document.querySelector('.celebration > img');
					return img && img.complete && img.naturalWidth > 0;
				},
				null,
				{ timeout: 10000 }
			);
		} catch (err) {
			throw new Error(
				'celebration: immagine reward non caricata (.celebration > img). ' +
					'Causa: ' + (err && err.message ? err.message : String(err))
			);
		}

		await page.waitForTimeout(300);
		await expect(page.locator('#result')).toHaveScreenshot('wide-celebration-threetimestwo.png', SHOT);
	});
});

/**
 * Copertura schema colori "Rainbow" (`body.coloredBorders`): colori per data-type
 * (num/bool/point/line/obj). Serve come baseline "PRIMA" del refactor colori-per-tipo.
 *
 * Attivazione deterministica: dopo waitForReady forziamo `body.coloredBorders`
 * via page.evaluate. settings.js applica normalmente una sola delle classi
 * whiteBorders/greyBorders/coloredBorders in base a `visSettingSelected`; gli
 * esercizi scelti hanno `visSettingSelected:1` (=> greyBorders), quindi di default
 * NON sono in coloredBorders. Prima di forzare la classe registriamo lo stato di
 * default (diagnostico) così da sapere se le baseline `canvas-*` mostrano già i
 * colori-per-tipo.
 */
const COLORED_BORDERS_EXERCISES = [
	{ name: 'prop_comm_gen', path: './Data/exercises/prop_comm_gen.mmls' },
	{ name: 'CommutativaAssociativaBinarie', path: './Data/exercises/CommutativaAssociativaBinarie.mmls' }
];

test.describe('CSS visual regression — coloredBorders', () => {
	for (const exercise of COLORED_BORDERS_EXERCISES) {
		test('coloredBorders-' + exercise.name, async ({ page }) => {
			await loadAndWait(page, exercise.path);

			// Diagnostico: lo schema colori è già attivo di default per questo esercizio?
			const defaultColorClasses = await page.evaluate(() => {
				const b = document.body.classList;
				return {
					coloredBorders: b.contains('coloredBorders'),
					greyBorders: b.contains('greyBorders'),
					whiteBorders: b.contains('whiteBorders')
				};
			});
			// eslint-disable-next-line no-console
			console.log(
				'[coloredBorders-default] ' + exercise.name + ': ' + JSON.stringify(defaultColorClasses)
			);

			await page.evaluate(() => document.body.classList.add('coloredBorders'));
			await page.waitForTimeout(300);

			await expect(page.locator('#canvasRole')).toHaveScreenshot(
				'coloredBorders-' + exercise.name + '.png',
				{ animations: 'disabled', maxDiffPixels: 0, threshold: 0 }
			);
		});
	}
});
