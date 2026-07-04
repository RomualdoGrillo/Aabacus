const { defineConfig } = require('@playwright/test');
const path = require('path');

const repoRoot = path.join(__dirname, '../..');
const slowMo = process.env.SLOW_MO ? Number(process.env.SLOW_MO) : 0;

module.exports = defineConfig({
	testDir: './e2e',
	timeout: 120000,
	use: {
		baseURL: 'http://127.0.0.1:5500',
		headless: true,
		launchOptions: {
			slowMo
		}
	},
	webServer: {
		command: 'npx --yes serve -l 5500 app',
		cwd: repoRoot,
		url: 'http://127.0.0.1:5500',
		reuseExistingServer: true,
		timeout: 120000
	}
});
