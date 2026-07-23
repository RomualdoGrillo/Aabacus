/**
 * input2/intentMap.js — tabella gesture↔action e risoluzione PURA (niente DOM/jQuery).
 *
 * Formato riga (DEFAULT_TABLE):
 *   {
 *     trigger: string|null,       // gesto: 'tap'|'pinchHor'|'pinchVert'|'slashHor'|'slashVert'|null
 *     alias: string|null,         // tastiera: 'Mod+z'|'Shift+L'|'Shift+S'|'p'|'c'|'ArrowDown'|…
 *     targetSource: 'selected'|'pinched'|'slashed'|null,
 *     actions: string[],          // try-list ordinata (builtin o nomi proprietà)
 *     system: boolean             // true → non riconfigurabile da .mmls
 *   }
 *
 * API pure: resolveIntent, nextAction, applyMmlsOverrides, computeAvailability.
 * Browser: window.INPUT2.*; Node: module.exports.
 */
(function (global) {
	'use strict';

	/** Azioni builtin (non passano da TryOnePropertyByName). */
	const BUILTIN_ACTIONS = {
		undo: true,
		load: true,
		save: true,
		toggleSelect: true
	};

	/**
	 * Tabella di default — §7.5 + tap strutturale + compose in coda al pinch
	 * (composePlus/composeTimes ancora non nel registry).
	 */
	const DEFAULT_TABLE = [
		{
			trigger: null,
			alias: 'Mod+z',
			targetSource: null,
			actions: ['undo'],
			system: true
		},
		{
			trigger: null,
			alias: 'Shift+L',
			targetSource: null,
			actions: ['load'],
			system: true
		},
		{
			trigger: null,
			alias: 'Shift+S',
			targetSource: 'selected',
			actions: ['save'],
			system: true
		},
		{
			trigger: 'tap',
			alias: null,
			targetSource: null,
			actions: ['toggleSelect'],
			system: true
		},
		{
			trigger: null,
			alias: 'p',
			targetSource: 'selected',
			actions: ['createParenthesis'],
			system: false
		},
		{
			trigger: null,
			alias: 'c',
			targetSource: 'selected',
			actions: ['simplifyParethesis', 'delEmptyParenthesis'],
			system: false
		},
		{
			trigger: 'pinchHor',
			alias: 'ArrowDown',
			targetSource: 'pinched',
			actions: ['composePlus', 'composeTimes', 'compose'],
			system: false
		},
		{
			trigger: 'pinchVert',
			alias: 'ArrowLeft',
			targetSource: 'pinched',
			actions: ['composePlus', 'composeTimes', 'compose'],
			system: false
		},
		{
			trigger: 'slashHor',
			alias: 'ArrowRight',
			targetSource: 'slashed',
			actions: ['decomposeInAProduct'],
			system: false
		},
		{
			trigger: 'slashVert',
			alias: 'ArrowUp',
			targetSource: 'slashed',
			actions: ['decomposeInASum'],
			system: false
		}
	];

	function cloneRow(row) {
		return {
			trigger: row.trigger == null ? null : String(row.trigger),
			alias: row.alias == null ? null : String(row.alias),
			targetSource: row.targetSource == null ? null : String(row.targetSource),
			actions: Array.isArray(row.actions) ? row.actions.slice() : [],
			system: !!row.system
		};
	}

	function cloneTable(table) {
		return (table || []).map(cloneRow);
	}

	function isBuiltinAction(name) {
		return !!(name && BUILTIN_ACTIONS[name]);
	}

	/** Intent gesto → nome trigger tabella. */
	function intentToTrigger(intent) {
		if (!intent || !intent.type) return null;
		if (intent.type === 'tap') return 'tap';
		if (intent.type === 'slice' || intent.type === 'slash') {
			if (intent.axis === 'h') return 'slashHor';
			if (intent.axis === 'v') return 'slashVert';
			return null;
		}
		if (intent.type === 'pinch') {
			if (intent.axis === 'h') return 'pinchHor';
			if (intent.axis === 'v') return 'pinchVert';
			return null;
		}
		if (typeof intent.trigger === 'string') return intent.trigger;
		return null;
	}

	/**
	 * Normalizza alias tastiera da intent.key o stringa già alias.
	 * Accetta: {type:'key', key, metaKey, ctrlKey, shiftKey} oppure {alias:'ArrowUp'}.
	 */
	function intentToAlias(intent) {
		if (!intent) return null;
		if (typeof intent.alias === 'string') return normalizeAliasString(intent.alias);
		if (intent.type !== 'key') return null;
		const key = intent.key != null ? String(intent.key) : '';
		if (!key) return null;
		const lower = key.length === 1 ? key.toLowerCase() : key;
		if ((intent.metaKey || intent.ctrlKey) && lower === 'z') return 'Mod+z';
		if (intent.shiftKey && lower === 'l') return 'Shift+L';
		if (intent.shiftKey && lower === 's') return 'Shift+S';
		if (/^arrow/i.test(key)) {
			return 'Arrow' + key.slice(5, 6).toUpperCase() + key.slice(6).toLowerCase();
		}
		// frecce già in forma ArrowUp / arrowup
		const arrows = {
			arrowup: 'ArrowUp',
			arrowdown: 'ArrowDown',
			arrowleft: 'ArrowLeft',
			arrowright: 'ArrowRight'
		};
		if (arrows[key.toLowerCase()]) return arrows[key.toLowerCase()];
		if (key.length === 1 && !intent.metaKey && !intent.ctrlKey && !intent.shiftKey && !intent.altKey) {
			return key.toLowerCase();
		}
		return normalizeAliasString(key);
	}

	function normalizeAliasString(s) {
		if (s == null) return null;
		const t = String(s).trim();
		if (!t) return null;
		const low = t.toLowerCase();
		if (low === 'mod+z' || low === 'cmd+z' || low === 'ctrl+z' || low === 'command+z') return 'Mod+z';
		if (low === 'shift+l' || low === 'maiusc+l') return 'Shift+L';
		if (low === 'shift+s' || low === 'maiusc+s') return 'Shift+S';
		const arrows = {
			arrowup: 'ArrowUp',
			arrowdown: 'ArrowDown',
			arrowleft: 'ArrowLeft',
			arrowright: 'ArrowRight'
		};
		if (arrows[low]) return arrows[low];
		if (t.length === 1) return t.toLowerCase();
		return t;
	}

	/**
	 * @param {Object} intent
	 * @param {Object[]} [table]
	 * @returns {Object|null} entry clonata
	 */
	function resolveIntent(intent, table) {
		const rows = table || DEFAULT_TABLE;
		if (!intent) return null;

		const trigger = intentToTrigger(intent);
		if (trigger) {
			for (let i = 0; i < rows.length; i++) {
				if (rows[i].trigger === trigger) return cloneRow(rows[i]);
			}
		}

		const alias = intentToAlias(intent);
		if (alias) {
			for (let i = 0; i < rows.length; i++) {
				if (rows[i].alias && normalizeAliasString(rows[i].alias) === alias) {
					return cloneRow(rows[i]);
				}
			}
		}
		return null;
	}

	/**
	 * Prima azione della try-list ancora disponibile.
	 * @param {Object} entry
	 * @param {Object<string,boolean>} [availability]
	 * @returns {string|null} nome azione o builtin
	 */
	function nextAction(entry, availability) {
		if (!entry || !Array.isArray(entry.actions)) return null;
		for (let i = 0; i < entry.actions.length; i++) {
			const name = entry.actions[i];
			if (isBuiltinAction(name) || entry.system) return name;
			if (!availability || availability[name] !== false) return name;
		}
		return null;
	}

	/**
	 * Try-list filtrata (salta non disponibili). Pure.
	 * @param {Object} entry
	 * @param {Object<string,boolean>} [availability]
	 * @returns {string[]}
	 */
	function listTryActions(entry, availability) {
		if (!entry || !Array.isArray(entry.actions)) return [];
		const out = [];
		for (let i = 0; i < entry.actions.length; i++) {
			const name = entry.actions[i];
			if (isBuiltinAction(name) || entry.system) {
				out.push(name);
				continue;
			}
			if (!availability || availability[name] !== false) out.push(name);
		}
		return out;
	}

	/**
	 * Applica override .mmls; le righe system non si toccano → violazioni.
	 * @param {Object[]} table
	 * @param {Object|Object[]} overrides — mappa trigger|alias → {actions?, targetSource?} oppure lista righe parziali
	 * @returns {{ table: Object[], violations: string[] }}
	 */
	function applyMmlsOverrides(table, overrides) {
		const base = cloneTable(table || DEFAULT_TABLE);
		const violations = [];
		if (!overrides) return { table: base, violations: violations };

		const ovList = Array.isArray(overrides)
			? overrides
			: Object.keys(overrides).map(function (k) {
				const v = overrides[k] || {};
				return Object.assign({ key: k }, v);
			});

		function rowKey(row) {
			return row.trigger || row.alias || null;
		}

		for (let o = 0; o < ovList.length; o++) {
			const ov = ovList[o];
			const key = ov.key || ov.trigger || ov.alias;
			if (!key) continue;
			let hit = -1;
			for (let i = 0; i < base.length; i++) {
				const rk = rowKey(base[i]);
				if (rk === key || normalizeAliasString(rk) === normalizeAliasString(key)) {
					hit = i;
					break;
				}
			}
			if (hit < 0) continue;
			if (base[hit].system) {
				violations.push(String(key));
				continue;
			}
			if (Array.isArray(ov.actions)) base[hit].actions = ov.actions.slice();
			if (ov.targetSource !== undefined) base[hit].targetSource = ov.targetSource;
			if (ov.alias !== undefined && ov.alias !== null) base[hit].alias = String(ov.alias);
		}
		return { table: base, violations: violations };
	}

	/**
	 * Disponibilità azioni: system/builtin sempre true; altrimenti hasCanvasCi(name).
	 * unresolved: nomi didattici non isRegistered (dichiarati ma non risolti).
	 *
	 * @param {Object[]} table
	 * @param {{ hasCanvasCi?: function(string):boolean, isRegistered?: function(string):boolean }} resolverFns
	 * @returns {{ availability: Object<string,boolean>, unresolved: string[] }}
	 */
	function computeAvailability(table, resolverFns) {
		const fns = resolverFns || {};
		const hasCanvasCi = typeof fns.hasCanvasCi === 'function' ? fns.hasCanvasCi : function () { return false; };
		const isRegistered = typeof fns.isRegistered === 'function' ? fns.isRegistered : function () { return true; };
		const availability = {};
		const unresolved = [];
		const seen = {};
		const rows = table || DEFAULT_TABLE;

		for (let r = 0; r < rows.length; r++) {
			const row = rows[r];
			const actions = row.actions || [];
			for (let a = 0; a < actions.length; a++) {
				const name = actions[a];
				if (seen[name]) continue;
				seen[name] = true;
				if (row.system || isBuiltinAction(name)) {
					availability[name] = true;
					continue;
				}
				if (!isRegistered(name)) {
					availability[name] = false;
					unresolved.push(name);
					continue;
				}
				availability[name] = !!hasCanvasCi(name);
			}
		}
		return { availability: availability, unresolved: unresolved };
	}

	// ——— stato mutabile browser (non usato dalle pure; comodo per boot2) ———
	let activeTable = cloneTable(DEFAULT_TABLE);

	function getTable() {
		return cloneTable(activeTable);
	}

	function setTable(table) {
		activeTable = cloneTable(table);
		return getTable();
	}

	/** Compat: vecchia lookupIntent → {kind,name} della prima azione. */
	function lookupIntent(intent) {
		const entry = resolveIntent(intent, activeTable);
		if (!entry) return null;
		const name = nextAction(entry, null);
		if (!name) return null;
		if (isBuiltinAction(name)) return { kind: 'builtin', name: name, entry: entry };
		return { kind: 'property', name: name, entry: entry };
	}

	const api = {
		DEFAULT_TABLE: cloneTable(DEFAULT_TABLE),
		BUILTIN_ACTIONS: Object.assign({}, BUILTIN_ACTIONS),
		isBuiltinAction: isBuiltinAction,
		resolveIntent: resolveIntent,
		nextAction: nextAction,
		listTryActions: listTryActions,
		applyMmlsOverrides: applyMmlsOverrides,
		computeAvailability: computeAvailability,
		intentToTrigger: intentToTrigger,
		intentToAlias: intentToAlias,
		getTable: getTable,
		setTable: setTable,
		lookupIntent: lookupIntent,
		// compat nomi precedenti
		getIntentMap: getTable,
		setIntentMap: setTable,
		DEFAULT_INTENT_MAP: null
	};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = api;
	}

	global.INPUT2 = global.INPUT2 || {};
	global.INPUT2.DEFAULT_TABLE = api.DEFAULT_TABLE;
	global.INPUT2.BUILTIN_ACTIONS = api.BUILTIN_ACTIONS;
	global.INPUT2.isBuiltinAction = isBuiltinAction;
	global.INPUT2.resolveIntent = resolveIntent;
	global.INPUT2.nextAction = nextAction;
	global.INPUT2.listTryActions = listTryActions;
	global.INPUT2.applyMmlsOverrides = applyMmlsOverrides;
	global.INPUT2.computeAvailability = computeAvailability;
	global.INPUT2.intentToTrigger = intentToTrigger;
	global.INPUT2.intentToAlias = intentToAlias;
	global.INPUT2.getTable = getTable;
	global.INPUT2.setTable = setTable;
	global.INPUT2.lookupIntent = lookupIntent;
	global.INPUT2.getIntentMap = getTable;
	global.INPUT2.setIntentMap = setTable;
})(typeof window !== 'undefined' ? window : globalThis);
