/**
 * importMmlsV1.js — adattatore mmls versione 1 → tabella G/A.
 *
 * Unico modulo che interpreta la sezione events legacy (MathML eventtoaction).
 * Semantica: le ricette v1 descrivono lo stato tied → scrivono solo actionsTied.
 * Non tocca index.html / MAIN.js: usato dalla pista index2 dopo il load
 * del backend esistente (preload / SaveLoad.injectAllMMLS).
 *
 * Spec: project/specs/gesture-action-table.md §4.1
 */
(function (global) {
	'use strict';

	/** Frecce unicode di gestToAction.mml → alias G/A (Arrow*). */
	const V1_EVENT_ALIASES = {
		'←': 'ArrowLeft',
		'→': 'ArrowRight',
		'↑': 'ArrowUp',
		'↓': 'ArrowDown',
		'arrowleft': 'ArrowLeft',
		'arrowright': 'ArrowRight',
		'arrowup': 'ArrowUp',
		'arrowdown': 'ArrowDown',
		'slice.h': 'slashHor',
		'slice.v': 'slashVert',
		'slashhor': 'slashHor',
		'slashvert': 'slashVert',
		'pinchhor': 'pinchHor',
		'pinchvert': 'pinchVert'
	};

	/**
	 * Normalizza il nome evento v1 verso trigger/alias della G/A.
	 * @param {string} name
	 * @returns {string|null}
	 */
	function normalizeV1EventName(name) {
		if (name == null) return null;
		const raw = String(name).trim();
		if (!raw) return null;
		if (V1_EVENT_ALIASES[raw]) return V1_EVENT_ALIASES[raw];
		const low = raw.toLowerCase();
		if (V1_EVENT_ALIASES[low]) return V1_EVENT_ALIASES[low];
		if (raw.length === 1) return low;
		return raw;
	}

	/**
	 * Da elenco ricette { event, actions[] } → override per applyMmlsOverrides
	 * con **solo** actionsTied (untied intatte).
	 * @param {Array<{event:string, actions:Array}>} recipes
	 * @returns {Object} map key → { actionsTied }
	 */
	function recipesToTiedOverrides(recipes) {
		const overrides = {};
		if (!Array.isArray(recipes)) return overrides;
		for (let i = 0; i < recipes.length; i++) {
			const r = recipes[i];
			if (!r) continue;
			const key = normalizeV1EventName(r.event);
			if (!key) continue;
			const actions = Array.isArray(r.actions) ? r.actions : [];
			if (!actions.length) continue;
			overrides[key] = { actionsTied: actions.slice() };
		}
		return overrides;
	}

	/**
	 * Legge #events (o un root) e restituisce ricette v1 pure (senza toccare la G/A).
	 * Richiede jQuery + ENODE_getRoles / ENODE_getName (backend esistente).
	 * @param {JQuery|Element|string} [root='#events']
	 * @returns {Array<{event:string, actions:Array<{name:string,val?:string}>}>}
	 */
	function readV1RecipesFromDom(root) {
		const recipes = [];
		if (typeof $ === 'undefined' || typeof ENODE_getRoles !== 'function') {
			return recipes;
		}
		const $root = root == null || root === '#events'
			? $('#events')
			: (typeof root === 'string' ? $(root) : $(root));
		if (!$root.length) return recipes;

		$root.find('[data-enode="eventtoaction"]').each(function () {
			let eventName;
			try {
				const $role = ENODE_getRoles(this, '.event');
				if ($role.length !== 1) return;
				const ev = $role.children()[0];
				if (ev === undefined) return;
				eventName = ENODE_getName(ev);
			} catch (err) { return; }
			if (!eventName) return;

			const actions = [];
			const $actions = ENODE_getRoles(this, '.actions').children();
			for (let j = 0; j < $actions.length; j++) {
				try {
					const name = ENODE_getName(ENODE_getRoles($actions[j], '.function').children()[0]);
					if (!name) continue;
					const action = { name: name };
					try {
						const val = ENODE_getName(ENODE_getRoles($actions[j], '.values').children()[0]);
						if (val) action.val = val;
					} catch (errVal) { /* .values assente */ }
					actions.push(action);
				} catch (err) { /* action malformata */ }
			}
			if (actions.length) recipes.push({ event: eventName, actions: actions });
		});
		return recipes;
	}

	/**
	 * True se #events contiene ricette MathML v1 (eventtoaction).
	 * @param {JQuery|Element|string} [root='#events']
	 * @returns {boolean}
	 */
	function isMmlsEventsV1(root) {
		if (typeof $ === 'undefined') return false;
		const $root = root == null || root === '#events'
			? $('#events')
			: (typeof root === 'string' ? $(root) : $(root));
		return $root.find('[data-enode="eventtoaction"]').length > 0;
	}

	/**
	 * Import v1 → G/A: DEFAULT (o base) + override solo tied.
	 * @param {Object[]} [baseTable] — default: INPUT2.DEFAULT_TABLE
	 * @param {Array|{}} [recipesOrOverrides] — ricette [{event,actions}] oppure già override map
	 * @returns {{table:Object[], violations:string[], overrides:Object, recipes:Array}}
	 */
	function importMmlsV1ToGA(baseTable, recipesOrOverrides) {
		const api = global.INPUT2 || {};
		const base = baseTable || api.DEFAULT_TABLE || [];
		let recipes = [];
		let overrides;

		if (Array.isArray(recipesOrOverrides)) {
			recipes = recipesOrOverrides;
			overrides = recipesToTiedOverrides(recipes);
		} else if (recipesOrOverrides && typeof recipesOrOverrides === 'object') {
			overrides = recipesOrOverrides;
		} else {
			recipes = readV1RecipesFromDom();
			overrides = recipesToTiedOverrides(recipes);
		}

		if (typeof api.applyMmlsOverrides !== 'function') {
			return { table: base.slice(), violations: [], overrides: overrides, recipes: recipes };
		}
		const res = api.applyMmlsOverrides(base, overrides);
		return {
			table: res.table,
			violations: res.violations || [],
			overrides: overrides,
			recipes: recipes
		};
	}

	const exported = {
		V1_EVENT_ALIASES: V1_EVENT_ALIASES,
		normalizeV1EventName: normalizeV1EventName,
		recipesToTiedOverrides: recipesToTiedOverrides,
		readV1RecipesFromDom: readV1RecipesFromDom,
		isMmlsEventsV1: isMmlsEventsV1,
		importMmlsV1ToGA: importMmlsV1ToGA
	};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = exported;
	}

	global.INPUT2 = global.INPUT2 || {};
	global.INPUT2.normalizeV1EventName = normalizeV1EventName;
	global.INPUT2.recipesToTiedOverrides = recipesToTiedOverrides;
	global.INPUT2.readV1RecipesFromDom = readV1RecipesFromDom;
	global.INPUT2.isMmlsEventsV1 = isMmlsEventsV1;
	global.INPUT2.importMmlsV1ToGA = importMmlsV1ToGA;
})(typeof window !== 'undefined' ? window : globalThis);
