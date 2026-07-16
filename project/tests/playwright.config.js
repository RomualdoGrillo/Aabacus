const { defineConfig } = require('@playwright/test');
const path = require('path');

const repoRoot = path.join(__dirname, '../..');
const slowMo = process.env.SLOW_MO ? Number(process.env.SLOW_MO) : 0;

module.exports = defineConfig({
	testDir: './e2e',
	timeout: 120000,
	use: {
		// Porta dedicata (5599) per NON riusare il "Live Server" di Cursor su 5500,
		// che serve una copia obsoleta dell'app e mascherava le modifiche CSS.
		baseURL: 'http://127.0.0.1:5599',
		headless: true,
		launchOptions: {
			slowMo
		}
	},
	webServer: {
		command: 'npx --yes serve -l 5599 app',
		cwd: repoRoot,
		url: 'http://127.0.0.1:5599',
		reuseExistingServer: false,
		timeout: 120000
	}
});
