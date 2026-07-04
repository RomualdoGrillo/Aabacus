const fs = require('fs');
const path = require('path');

const helpersDir = __dirname;

function readHelper(relativePath) {
	return fs.readFileSync(path.join(helpersDir, relativePath), 'utf8');
}

/**
 * Inietta gli helper di test nel browser (dopo il caricamento dell'app).
 * @param {import('@playwright/test').Page} page
 * @param {{ exercise?: string }} [options]
 */
async function injectTestHelpers(page, options) {
	options = options || {};
	await page.waitForFunction(() => typeof $ === 'function' && typeof Sortable !== 'undefined');
	await page.evaluate(readHelper('browser/core.js'));
	await page.waitForFunction(() => window.__aabacusTest != null);

	if (options.exercise) {
		await page.evaluate(readHelper('exercises/' + options.exercise + '.js'));
		await page.waitForFunction(
			(n) => window.__aabacusTestExercises != null && window.__aabacusTestExercises[n] != null,
			options.exercise
		);
	}
}

module.exports = { injectTestHelpers };
