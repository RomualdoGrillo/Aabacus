const { test, expect } = require('@playwright/test');
const { injectTestHelpers } = require('../helpers/injectTest');

const HANOI_URL = '/?preloadPath=./Data/exercises/hanoi4.mmls';

function buildHanoiMoves(n, from, to, aux, moves = []) {
	if (n === 0) return moves;
	buildHanoiMoves(n - 1, from, aux, to, moves);
	moves.push({ fromRodIndex: from, toRodIndex: to });
	buildHanoiMoves(n - 1, aux, to, from, moves);
	return moves;
}

async function simulateHanoiMove(page, move) {
	return page.evaluate(async (opts) => {
		return await window.__aabacusTestExercises.hanoi.simulateMove({
			fromRodIndex: opts.fromRodIndex,
			toRodIndex: opts.toRodIndex,
			steps: 35,
			stepDelayMs: 12,
			showCursor: true,
			settleMs: 3000
		});
	}, move);
}

test('solves Hanoi 4 disks in 15 moves', async ({ page }) => {
	await page.goto(HANOI_URL);
	await injectTestHelpers(page, { exercise: 'hanoi' });
	await page.evaluate(async () => {
		await window.__aabacusTest.waitForReady();
		while (!window.__aabacusTestExercises.hanoi.isExerciseReady()) {
			await new Promise((r) => setTimeout(r, 100));
		}
	});

	const moves = buildHanoiMoves(4, 0, 2, 1);
	for (let i = 0; i < moves.length; i++) {
		let result = null;
		for (let attempt = 1; attempt <= 3; attempt++) {
			result = await simulateHanoiMove(page, moves[i]);
			if (result.moved) break;
			await page.waitForTimeout(500);
		}
		expect(result.moved, 'move ' + (i + 1)).toBe(true);
		expect(result.after[moves[i].toRodIndex], 'move ' + (i + 1)).toBe(result.before[moves[i].toRodIndex] + 1);
		expect(result.after[moves[i].fromRodIndex], 'move ' + (i + 1)).toBe(result.before[moves[i].fromRodIndex] - 1);
		await page.waitForTimeout(200);
	}

	const final = await page.evaluate(() => window.__aabacusTestExercises.hanoi.getRodDiscCounts());
	expect(final).toEqual([0, 0, 4]);
});
