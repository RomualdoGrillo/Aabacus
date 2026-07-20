/**
 * Loader console-only per newPM (non incluso in index.html).
 *
 * Dalla DevTools console, con l'app già aperta:
 *   $.getScript('js/newPM/load.js')
 *
 * Poi:
 *   newPM(pattern, input)
 *   await newPM(pattern, input, { play: true })
 */
(function (global) {
	'use strict';

	var BASE = 'js/newPM/';
	var FILES = ['match.js', 'visualize.js', 'api.js'];
	var loading = null;
	var loaded = false;

	function loadCss(href) {
		if (document.querySelector('link[data-newpm-css]')) {
			return Promise.resolve();
		}
		return new Promise(function (resolve, reject) {
			var link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = href;
			link.setAttribute('data-newpm-css', '1');
			link.onload = function () {
				resolve();
			};
			link.onerror = function () {
				reject(new Error('newPM: impossibile caricare ' + href));
			};
			document.head.appendChild(link);
		});
	}

	function loadScript(src) {
		return new Promise(function (resolve, reject) {
			// evita doppioni se si richiama load()
			if (document.querySelector('script[data-newpm-src="' + src + '"]')) {
				resolve();
				return;
			}
			var s = document.createElement('script');
			s.src = src;
			s.async = false;
			s.setAttribute('data-newpm-src', src);
			s.onload = function () {
				resolve();
			};
			s.onerror = function () {
				reject(new Error('newPM: impossibile caricare ' + src));
			};
			document.head.appendChild(s);
		});
	}

	async function load(opts) {
		if (loaded && global.newPM && global.newPM.version) {
			return global.newPM;
		}
		if (loading) return loading;

		opts = opts || {};
		var base = opts.base || BASE;

		loading = (async function () {
			await loadCss(base + 'fitting.css');
			for (var i = 0; i < FILES.length; i++) {
				await loadScript(base + FILES[i]);
			}
			loaded = true;
			if (typeof console !== 'undefined') {
				console.info(
					'[newPM] pronto v' +
						(global.newPM && global.newPM.version) +
						' — usa newPM(pattern, input) oppure newPM(p, i, { play: true })'
				);
			}
			return global.newPM;
		})();

		try {
			return await loading;
		} finally {
			loading = null;
		}
	}

	if (typeof global.newPM !== 'function') {
		global.newPM = function () {
			throw new Error('newPM: attendi il load — $.getScript("js/newPM/load.js")');
		};
	}
	global.newPM.load = load;

	// Auto-start: funziona anche quando jQuery getScript azzera currentScript.
	load().catch(function (err) {
		console.error(err);
	});
})(typeof window !== 'undefined' ? window : globalThis);
