const { test, expect } = require('@playwright/test');
const { injectTestHelpers } = require('../helpers/injectTest');

const HANOI_URL = '/?preloadPath=./Data/exercises/hanoi4.mmls';

const DEMO = !!process.env.DEMO;
const PAUSE_MS = process.env.PAUSE_MS ? Number(process.env.PAUSE_MS) : 0;

async function pauseForDemo(page) {
	if (PAUSE_MS > 0) {
		await page.waitForTimeout(PAUSE_MS);
	}
}

async function gotoHanoi(page) {
	await page.goto(HANOI_URL);
	await injectTestHelpers(page, { exercise: 'hanoi' });
}

async function waitForHanoiReady(page) {
	await page.evaluate(async () => {
		await window.__aabacusTest.waitForReady();
		var start = Date.now();
		while (!window.__aabacusTestExercises.hanoi.isExerciseReady()) {
			if (Date.now() - start > 15000) {
				throw new Error('Hanoi exercise not ready: ' + JSON.stringify(
					window.__aabacusTestExercises.hanoi.getExerciseState()
				));
			}
			await new Promise(function (r) {
				setTimeout(r, 100);
			});
		}
	});
}

/** Drag Hanoi con mouse Playwright (input OS). */
async function trustedHanoiMove(page, options = {}) {
	const coords = await page.evaluate((opts) => {
		return window.__aabacusTestExercises.hanoi.getMoveCoordinates(opts);
	}, options);
	const steps = options.steps != null ? options.steps : 25;
	await page.mouse.move(coords.from.x, coords.from.y);
	await page.mouse.down();
	await page.mouse.move(coords.to.x, coords.to.y, { steps });
	await page.mouse.up();
	await page.waitForTimeout(DEMO ? 500 : 100);
	const after = await page.evaluate(() => window.__aabacusTestExercises.hanoi.getRodDiscCounts());
	return { coords, after };
}

test.describe('hanoi4.mmls with testHooks', () => {
	test('loads Hanoi exercise and exposes test hooks', async ({ page }) => {
		await gotoHanoi(page);

		const state = await page.evaluate(async () => {
			await window.__aabacusTest.waitForReady();
			return window.__aabacusTestExercises.hanoi.getExerciseState();
		});

		expect(state.hanoiRodCount).toBe(3);
		expect(state.hanoiDiscCount).toBe(4);

		const appState = await page.evaluate(() => window.__aabacusTest.getState());
		expect(appState.tiedCanvas).toBe(true);
		await pauseForDemo(page);
	});

	test('trusted mouse moves top disc to another rod', async ({ page }) => {
		await gotoHanoi(page);
		await waitForHanoiReady(page);
		const before = await page.evaluate(() => window.__aabacusTestExercises.hanoi.getRodDiscCounts());

		const { after } = await trustedHanoiMove(page, {
			fromRodIndex: 0,
			toRodIndex: 1,
			steps: DEMO ? 30 : 20
		});

		expect(after[1]).toBe(before[1] + 1);
		expect(after[0]).toBe(before[0] - 1);
		await pauseForDemo(page);
	});

	test('simulateMove via exercise helper moves top disc', async ({ page }) => {
		await gotoHanoi(page);
		await waitForHanoiReady(page);
		const result = await page.evaluate(async () => {
			const hanoi = window.__aabacusTestExercises.hanoi;
			const before = hanoi.getRodDiscCounts();
			const move = await hanoi.simulateMove({
				fromRodIndex: 0,
				toRodIndex: 1,
				steps: 25,
				stepDelayMs: 8
			});
			return { before, after: move.after, moved: move.moved };
		});

		expect(result.moved).toBe(true);
		expect(result.after[1]).toBe(result.before[1] + 1);
		expect(result.after[0]).toBe(result.before[0] - 1);
		await pauseForDemo(page);
	});

	test('probeElement hits a Hanoi disc', async ({ page }) => {
		await gotoHanoi(page);
		await waitForHanoiReady(page);

		const probe = await page.evaluate(() => {
			return window.__aabacusTest.probeElement({
				selector: '#canvasRole [data-enode=hanoi] [data-enode=cn]',
				offset: { x: 0.5, y: 0.5 }
			});
		});

		expect(probe.hit).not.toBeNull();
		expect(probe.hit.enode).toBe('cn');
		await pauseForDemo(page);
	});

	test('dragging a rod does not move rods or discs', async ({ page }) => {
		await gotoHanoi(page);
		await waitForHanoiReady(page);

		const before = await page.evaluate(() => {
			const hanoi = window.__aabacusTestExercises.hanoi;
			return {
				discCounts: hanoi.getRodDiscCounts(),
				rodOrder: hanoi.getRodOrder()
			};
		});

		const coords = await page.evaluate(() => {
			return window.__aabacusTestExercises.hanoi.getRodDragCoordinates({
				fromRodIndex: 0,
				toRodIndex: 2
			});
		});

		const steps = DEMO ? 30 : 20;
		await page.mouse.move(coords.from.x, coords.from.y);
		await page.mouse.down();
		await page.mouse.move(coords.to.x, coords.to.y, { steps });
		await page.mouse.up();
		await page.waitForTimeout(DEMO ? 500 : 100);

		const after = await page.evaluate(() => {
			const hanoi = window.__aabacusTestExercises.hanoi;
			return {
				discCounts: hanoi.getRodDiscCounts(),
				rodOrder: hanoi.getRodOrder()
			};
		});

		expect(after.discCounts).toEqual(before.discCounts);
		expect(after.rodOrder).toEqual(before.rodOrder);
		await pauseForDemo(page);
	});
});
