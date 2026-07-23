/**
 * input2/intentMap.js — mappa dichiarativa intent → azione.
 * Cuore della customizzabilità futura: nessuna logica di riconoscimento qui.
 *
 * Semantica slice:
 *   slice.v (taglio quasi-verticale) → addendi  (decomposeInASum)
 *   slice.h (taglio quasi-orizzontale) → fattori (decomposeInAProduct)
 */
(function (global) {
	'use strict';

	const DEFAULT_MAP = {
		'slice.v': { kind: 'property', name: 'decomposeInASum' },
		'slice.h': { kind: 'property', name: 'decomposeInAProduct' },
		'tap': { kind: 'builtin', name: 'toggleSelect' }
	};

	let intentMap = Object.assign({}, DEFAULT_MAP);

	function getIntentMap() {
		return Object.assign({}, intentMap);
	}

	function setIntentMap(map) {
		if (!map || typeof map !== 'object') {
			throw new TypeError('setIntentMap: expected object');
		}
		intentMap = Object.assign({}, map);
		return getIntentMap();
	}

	function lookupIntent(intent) {
		if (!intent || !intent.type) return null;
		if (intent.type === 'slice' && intent.axis) {
			return intentMap['slice.' + intent.axis] || null;
		}
		return intentMap[intent.type] || null;
	}

	global.INPUT2 = global.INPUT2 || {};
	global.INPUT2.getIntentMap = getIntentMap;
	global.INPUT2.setIntentMap = setIntentMap;
	global.INPUT2.lookupIntent = lookupIntent;
	global.INPUT2.DEFAULT_INTENT_MAP = Object.assign({}, DEFAULT_MAP);
})(typeof window !== 'undefined' ? window : globalThis);
