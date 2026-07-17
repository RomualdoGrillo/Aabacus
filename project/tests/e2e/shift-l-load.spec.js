const { test, expect } = require('@playwright/test');
const path = require('path');
const { injectTestHelpers } = require('../helpers/injectTest');

const START_URL = '/?preloadPath=./Data/exercises/threeplustwo.mmls';
const HANOI_FILE = path.join(__dirname, '../../../app/Data/exercises/hanoi4.mmls');

/**
 * Regressione: Shift+L deve aprire il file chooser e, con un .mmls,
 * sostituire il canvas dopo conferma.
 */
test.describe('Shift+L load file', () => {
	test('opens file chooser and loads hanoi4.mmls into the canvas', async ({ page }) => {
		page.on('dialog', async (dialog) => {
			expect(dialog.type()).toBe('confirm');
			await dialog.accept();
		});

		await page.goto(START_URL);
		await injectTestHelpers(page);
		await page.evaluate(async () => {
			await window.__aabacusTest.waitForReady();
		});

		const before = await page.evaluate(() => ({
			plusCount: document.querySelectorAll('#canvasRole [data-enode=plus]').length,
			hanoiCount: document.querySelectorAll('#canvasRole [data-enode=hanoi]').length
		}));
		expect(before.plusCount).toBeGreaterThan(0);
		expect(before.hanoiCount).toBe(0);

		const [fileChooser] = await Promise.all([
			page.waitForEvent('filechooser', { timeout: 5000 }),
			page.keyboard.press('Shift+KeyL')
		]);
		expect(fileChooser).toBeTruthy();
		await fileChooser.setFiles(HANOI_FILE);

		await page.waitForFunction(
			() => document.querySelectorAll('#canvasRole [data-enode=hanoi]').length > 0,
			null,
			{ timeout: 15000 }
		);

		const after = await page.evaluate(() => ({
			hanoiCount: document.querySelectorAll('#canvasRole [data-enode=hanoi]').length,
			rodCount: document.querySelectorAll('#canvasRole [data-enode=hanoirod]').length,
			tiedCanvas: typeof GLBsettings !== 'undefined' && !!GLBsettings.tiedCanvas
		}));
		expect(after.hanoiCount).toBe(1);
		expect(after.rodCount).toBe(3);
		expect(after.tiedCanvas).toBe(true);
	});
});
