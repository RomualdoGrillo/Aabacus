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
