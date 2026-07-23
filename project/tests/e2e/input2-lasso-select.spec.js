/**
 * Regressione input2: lazo = multi-select parziale; tap plain deseleziona.
 */
const { test, expect } = require('@playwright/test');

// `serve` redirige index2.html → /index2 e perde la query; usare il path senza .html
const URL = '/index2?preloadPath=./Data/exercises/prop_comm_gen.mmls';

async function waitReady(page) {
	await page.waitForFunction(() => {
		if (!(window.INPUT2 && window.INPUT2.dispatchIntent)) return false;
		const roles = document.querySelectorAll('#canvasRole [data-enode="plus"] > .ul_role, #canvasRole [data-enode="plus"] > .ol_role');
		for (let i = 0; i < roles.length; i++) {
			const kids = roles[i].querySelectorAll(':scope > [data-enode]');
			if (kids.length >= 6) {
				const texts = Array.from(kids).map((k) => (k.querySelector('.name') || k).textContent.trim());
				if (texts.indexOf('e') !== -1 && texts.indexOf('b') !== -1) return true;
			}
		}
		return false;
	}, null, { timeout: 20000 });
}

/** Restituisce i 6 termini della somma expression (figli del ul_role del plus). */
async function sumTermIds(page) {
	return page.evaluate(() => {
		const roles = document.querySelectorAll('#canvasRole [data-enode="plus"] > .ul_role, #canvasRole [data-enode="plus"] > .ol_role');
		for (let i = 0; i < roles.length; i++) {
			const kids = Array.from(roles[i].querySelectorAll(':scope > [data-enode]'));
			if (kids.length < 6) continue;
			const texts = kids.map((k) => (k.querySelector('.name') || k).textContent.trim());
			if (texts.indexOf('e') === -1 || texts.indexOf('b') === -1) continue;
			return kids.map((child) => {
				const r = child.getBoundingClientRect();
				return {
					tag: child.getAttribute('data-enode'),
					text: (child.querySelector('.name') || child).textContent.trim(),
					rect: {
						x: r.left + r.width / 2,
						y: r.top + r.height / 2,
						left: r.left,
						top: r.top,
						right: r.right,
						bottom: r.bottom
					}
				};
			});
		}
		return [];
	});
}

async function selectedTexts(page) {
	return page.evaluate(() => {
		const sel = document.querySelectorAll('#canvasRole [data-enode].selected');
		return Array.from(sel).map((el) => ({
			tag: el.getAttribute('data-enode'),
			text: (el.querySelector('.name') || el).textContent.trim()
		}));
	});
}

/** Disegna un lazo rettangolare chiuso attorno ai centri dati. */
async function drawLassoAround(page, centers) {
	const xs = centers.map((c) => c.x);
	const ys = centers.map((c) => c.y);
	const pad = 18;
	const left = Math.min(...xs) - pad;
	const right = Math.max(...xs) + pad;
	const top = Math.min(...ys) - pad;
	const bottom = Math.max(...ys) + pad;
	// Parti fuori dal blocco: un po' sopra-sinistra
	const start = { x: left - 10, y: top - 10 };
	const path = [
		start,
		{ x: right + 10, y: top - 10 },
		{ x: right + 10, y: bottom + 10 },
		{ x: left - 10, y: bottom + 10 },
		{ x: left - 10, y: top - 8 },
		{ x: start.x + 2, y: start.y + 2 }
	];
	await page.mouse.move(path[0].x, path[0].y);
	await page.mouse.down();
	for (let i = 1; i < path.length; i++) {
		await page.mouse.move(path[i].x, path[i].y, { steps: 8 });
	}
	await page.mouse.up();
	await page.waitForTimeout(100);
}

test.describe('input2 lasso + tap select', () => {
	test('lasso sugli ultimi due termini seleziona solo quelli', async ({ page }) => {
		await page.goto(URL);
		await waitReady(page);
		const terms = await sumTermIds(page);
		expect(terms.length).toBeGreaterThanOrEqual(6);
		// ultimi due: a, b nell'esercizio (ordine e c d f a b)
		const lastTwo = terms.slice(-2);
		await drawLassoAround(page, lastTwo.map((t) => t.rect));
		const selected = await selectedTexts(page);
		const texts = selected.map((s) => s.text);
		expect(texts.sort().join(',')).toBe(lastTwo.map((t) => t.text).sort().join(','));
		expect(selected.length).toBe(2);
	});

	test('tap senza Cmd deseleziona la selezione precedente', async ({ page }) => {
		await page.goto(URL);
		await waitReady(page);
		const terms = await sumTermIds(page);
		const lastTwo = terms.slice(-2);
		const first = terms[0];
		await drawLassoAround(page, lastTwo.map((t) => t.rect));
		let selected = await selectedTexts(page);
		expect(selected.length).toBe(2);

		await page.mouse.click(first.rect.x, first.rect.y);
		await page.waitForTimeout(80);
		selected = await selectedTexts(page);
		expect(selected.length).toBe(1);
		expect(selected[0].text).toBe(first.text);
	});
});
