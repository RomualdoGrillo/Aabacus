/**
 * UserEvToFunctCall2.js — omologo FrontEnd2 di UserEvToFunctCall.js.
 *
 * Unico custode della tabella gesture/tasto → azioni per index2.
 * Ogni riga ha DUE try-list: actionsUntied e actionsTied (stato GLBsettings.tiedCanvas).
 *
 * Formato riga (DEFAULT_TABLE):
 *   {
 *     trigger: string|null,       // 'tap'|'lasso'|'dnd'|'pinchHor'|…|null
 *     alias: string|null,         // 'Mod+z'|'Shift+L'|'p'|'ArrowDown'|…
 *     targetSource: 'selected'|'pinched'|'slashed'|null,
 *     actionsUntied: Array<{name,val?}|string>,
 *     actionsTied:   Array<{name,val?}|string>,
 *     system: boolean             // true → non riconfigurabile da .mmls
 *   }
 *
 * API pure (niente DOM): resolveIntent, nextAction, listTryActions,
 * applyMmlsOverrides, computeAvailability.
 * Browser: window.INPUT2.*; Node: module.exports.
 *
 * Fonte tabella: bozza Romualdo (tied/untied) + ricette gestToAction dove la
 * bozza lascia i slash/pinch didattici solo in tied.
 */
(function (global) {
	'use strict';

	/** Azioni builtin (non passano da TryOnePropertyByName). */
	const BUILTIN_ACTIONS = {
		undo: true,
		load: true,
		save: true,
		toggleSelect: true,
		selectSiblings: true,
		selectMultiple: true, // alias bozza Romualdo → selectSiblings in MAIN2
		applyDnD: true
	};

	/**
	 * @param {string|{name:string, val?:string}} a
	 * @returns {{name:string, val?:string}|null}
	 */
	function normalizeAction(a) {
		if (a == null) return null;
		if (typeof a === 'string') {
			const name = String(a);
			return name ? { name: name } : null;
		}
		if (typeof a === 'object' && a.name != null && String(a.name)) {
			const out = { name: String(a.name) };
			if (a.val != null && a.val !== '') out.val = String(a.val);
			return out;
		}
		return null;
	}

	function actionName(a) {
		if (typeof a === 'string') return a;
		if (a && a.name != null) return String(a.name);
		return null;
	}

	function cloneActions(actions) {
		const out = [];
		if (!Array.isArray(actions)) return out;
		for (let i = 0; i < actions.length; i++) {
			const n = normalizeAction(actions[i]);
			if (n) out.push(n);
		}
		return out;
	}

	/**
	 * Normalizza una riga: accetta actionsUntied/actionsTied oppure legacy `actions`
	 * (copiato su entrambe le colonne se le colonne mancano).
	 */
	function normalizeRow(row) {
		if (!row || typeof row !== 'object') {
			return {
				trigger: null,
				alias: null,
				targetSource: null,
				actionsUntied: [],
				actionsTied: [],
				system: false
			};
		}
		let untied = row.actionsUntied;
		let tied = row.actionsTied;
		if (!Array.isArray(untied) && !Array.isArray(tied) && Array.isArray(row.actions)) {
			untied = row.actions;
			tied = row.actions;
		}
		return {
			trigger: row.trigger == null ? null : String(row.trigger),
			alias: row.alias == null ? null : String(row.alias),
			targetSource: row.targetSource == null ? null : String(row.targetSource),
			actionsUntied: cloneActions(untied || []),
			actionsTied: cloneActions(tied || []),
			system: !!row.system
		};
	}

	function cloneRow(row) {
		return normalizeRow(row);
	}

	function cloneTable(table) {
		return (table || []).map(cloneRow);
	}

	/**
	 * Sceglie la try-list in base allo stato tied.
	 * @param {Object} entry
	 * @param {boolean} tied
	 * @returns {Array<{name:string, val?:string}>}
	 */
	function actionsForTiedState(entry, tied) {
		if (!entry) return [];
		return tied ? cloneActions(entry.actionsTied) : cloneActions(entry.actionsUntied);
	}

	/**
	 * Tabella di default — due colonne untied/tied (bozza Romualdo).
	 * Slash/pinch: bozza lascia spesso vuoto in untied; liste didattiche in tied
	 * (ricette gestToAction). Lazo: selectMultiple in untied, plusAssociate rtl in tied.
	 */
	const DEFAULT_TABLE = [
		{
			trigger: null,
			alias: 'Mod+z',
			targetSource: null,
			actionsUntied: ['undo'],
			actionsTied: ['undo'],
			system: true
		},
		{
			trigger: null,
			alias: 'Shift+L',
			targetSource: null,
			// Load solo a canvas svincolato; in tied MAIN2 avvisa di svincolare prima.
			actionsUntied: ['load'],
			actionsTied: [],
			system: true
		},
		{
			trigger: null,
			alias: 'Shift+S',
			targetSource: 'selected',
			actionsUntied: ['save'],
			actionsTied: ['save'],
			system: true
		},
		{
			trigger: 'tap',
			alias: null,
			targetSource: null,
			actionsUntied: ['toggleSelect'],
			actionsTied: ['toggleSelect'],
			system: true
		},
		{
			trigger: 'lasso',
			alias: null,
			targetSource: null,
			actionsUntied: ['selectSiblings'],
			actionsTied: [{ name: 'plusAssociate', val: 'rtl' }],
			system: true
		},
		{
			trigger: 'dnd',
			alias: null,
			targetSource: null,
			actionsUntied: ['applyDnD'],
			actionsTied: ['applyDnD'],
			system: true
		},
		{
			trigger: null,
			alias: 'p',
			targetSource: 'selected',
			actionsUntied: [],
			actionsTied: [
				{ name: 'plusAssociate', val: 'ltr' },
				{ name: 'plusAssociate', val: 'rtl' }
			],
			system: false
		},
		{
			trigger: null,
			alias: 'c',
			targetSource: 'selected',
			actionsUntied: [],
			actionsTied: [
				{ name: 'OppositeOfOpposite', val: 'ltr' },
				{ name: 'PlusSingleTerm', val: 'ltr' },
				{ name: 'TimesSingleFactor', val: 'ltr' },
				{ name: 'AndSingleChild', val: 'ltr' },
				{ name: 'OrSingleChild', val: 'ltr' }
			],
			system: false
		},
		{
			trigger: 'pinchHor',
			alias: 'ArrowDown',
			targetSource: 'pinched',
			actionsUntied: [],
			actionsTied: [
				{ name: 'compose' },
				{ name: 'AndNeutral', val: 'ltr' },
				{ name: 'timesAbsorbingEl', val: 'ltr' }
			],
			system: false
		},
		{
			trigger: 'pinchVert',
			alias: 'ArrowLeft',
			targetSource: 'pinched',
			actionsUntied: [],
			actionsTied: [
				{ name: 'compose' },
				{ name: 'composeXorNotX', val: 'rtl' }
			],
			system: false
		},
		{
			trigger: 'slashHor',
			alias: 'ArrowUp',
			targetSource: 'slashed',
			actionsUntied: [],
			actionsTied: [
				{ name: 'timesAbsorbingEl', val: 'rtl' },
				{ name: 'decomposeInAProduct' },
				{ name: 'AndNeutral', val: 'rtl' },
				{ name: 'Reciprocal', val: 'rtl' }
			],
			system: false
		},
		{
			trigger: 'slashVert',
			alias: 'ArrowRight',
			targetSource: 'slashed',
			actionsUntied: [],
			actionsTied: [
				{ name: 'decomposeInASum' },
				{ name: 'Opposite', val: 'rtl' },
				{ name: 'defZero', val: 'rtl' },
				{ name: 'composeXorNotX', val: 'rtl' }
			],
			system: false
		}
	];

	function isBuiltinAction(name) {
		return !!(name && BUILTIN_ACTIONS[name]);
	}

	/**
	 * Trigger di gesto presenti in tabella (campo `trigger` non null), indipendenti dallo stato tied.
	 * @param {Object[]} [table]
	 * @returns {string[]}
	 */
	function listGestureTriggers(table) {
		const rows = table || DEFAULT_TABLE;
		const out = [];
		const seen = {};
		for (let i = 0; i < rows.length; i++) {
			const t = rows[i] && rows[i].trigger != null ? String(rows[i].trigger) : '';
			if (!t || seen[t]) continue;
			seen[t] = true;
			out.push(t);
		}
		return out;
	}

	/**
	 * Trigger con almeno un’azione nella colonna dello stato tied/untied corrente.
	 * Spec L2 gesture-action-table.md §3: lista vuota nella colonna attiva ⇒ non ascoltare.
	 * @param {Object[]} [table]
	 * @param {{tied?: boolean}} [opts] — default untied (tied:false)
	 * @returns {string[]}
	 */
	function listActiveGestureTriggers(table, opts) {
		const tied = !!(opts && opts.tied);
		const rows = table || DEFAULT_TABLE;
		const out = [];
		const seen = {};
		for (let i = 0; i < rows.length; i++) {
			const row = normalizeRow(rows[i]);
			const t = row.trigger;
			if (!t || seen[t]) continue;
			const actions = tied ? row.actionsTied : row.actionsUntied;
			if (!actions || actions.length === 0) continue;
			seen[t] = true;
			out.push(t);
		}
		return out;
	}

	/**
	 * Flag per il recognizer: ascolta solo i trigger con azioni non vuote
	 * nella colonna dello stato tied/untied corrente.
	 * @param {Object[]} [table]
	 * @param {{tied?: boolean}} [opts]
	 * @returns {{tap:boolean,lasso:boolean,dnd:boolean,slice:boolean,pinch:boolean,
	 *   slashHor:boolean,slashVert:boolean,pinchHor:boolean,pinchVert:boolean}}
	 */
	function enabledRecognizerIntents(table, opts) {
		const set = {};
		const triggers = listActiveGestureTriggers(table, opts);
		for (let i = 0; i < triggers.length; i++) set[triggers[i]] = true;
		const slashHor = !!(set.slashHor || set['slice.h']);
		const slashVert = !!(set.slashVert || set['slice.v']);
		const pinchHor = !!set.pinchHor;
		const pinchVert = !!set.pinchVert;
		return {
			tap: !!set.tap,
			lasso: !!set.lasso,
			dnd: !!set.dnd,
			slice: !!(slashHor || slashVert),
			pinch: !!(pinchHor || pinchVert),
			slashHor: slashHor,
			slashVert: slashVert,
			pinchHor: pinchHor,
			pinchVert: pinchVert
		};
	}

	function intentToTrigger(intent) {
		if (!intent || !intent.type) return null;
		if (intent.type === 'tap') return 'tap';
		if (intent.type === 'lasso') return 'lasso';
		if (intent.type === 'dnd') return 'dnd';
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
	 * @param {{tied?: boolean}} [opts] — se omesso, `actions` resta [] (chiamare con tied esplicito)
	 * @returns {Object|null} entry con actionsUntied, actionsTied e `actions` = lista attiva
	 */
	function resolveIntent(intent, table, opts) {
		const rows = table || DEFAULT_TABLE;
		if (!intent) return null;

		let found = null;
		const trigger = intentToTrigger(intent);
		if (trigger) {
			for (let i = 0; i < rows.length; i++) {
				if (rows[i].trigger === trigger) {
					found = cloneRow(rows[i]);
					break;
				}
			}
		}
		if (!found) {
			const alias = intentToAlias(intent);
			if (alias) {
				for (let i = 0; i < rows.length; i++) {
					if (rows[i].alias && normalizeAliasString(rows[i].alias) === alias) {
						found = cloneRow(rows[i]);
						break;
					}
				}
			}
		}
		if (!found) return null;

		const tied = !!(opts && opts.tied);
		found.tied = tied;
		found.actions = actionsForTiedState(found, tied);
		return found;
	}

	function nextAction(entry, availability) {
		const list = entry && Array.isArray(entry.actions) ? entry.actions : [];
		for (let i = 0; i < list.length; i++) {
			const action = normalizeAction(list[i]);
			if (!action) continue;
			const name = action.name;
			if (isBuiltinAction(name) || (entry && entry.system)) return action;
			if (!availability || availability[name] !== false) return action;
		}
		return null;
	}

	function listTryActions(entry, availability) {
		if (!entry) return [];
		const list = Array.isArray(entry.actions) ? entry.actions : [];
		const out = [];
		for (let i = 0; i < list.length; i++) {
			const action = normalizeAction(list[i]);
			if (!action) continue;
			const name = action.name;
			if (isBuiltinAction(name) || entry.system) {
				out.push(action);
				continue;
			}
			if (!availability || availability[name] !== false) out.push(action);
		}
		return out;
	}

	/**
	 * Override .mmls: actionsUntied / actionsTied, oppure `actions` → entrambe.
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
			if (Array.isArray(ov.actionsUntied)) {
				base[hit].actionsUntied = cloneActions(ov.actionsUntied);
			}
			if (Array.isArray(ov.actionsTied)) {
				base[hit].actionsTied = cloneActions(ov.actionsTied);
			}
			if (Array.isArray(ov.actions)) {
				const both = cloneActions(ov.actions);
				base[hit].actionsUntied = both;
				base[hit].actionsTied = cloneActions(ov.actions);
			}
			if (ov.targetSource !== undefined) base[hit].targetSource = ov.targetSource;
			if (ov.alias !== undefined && ov.alias !== null) base[hit].alias = String(ov.alias);
		}
		return { table: base, violations: violations };
	}

	function computeAvailability(table, resolverFns) {
		const fns = resolverFns || {};
		const hasCanvasCi = typeof fns.hasCanvasCi === 'function' ? fns.hasCanvasCi : function () { return false; };
		const isRegistered = typeof fns.isRegistered === 'function' ? fns.isRegistered : function () { return true; };
		const availability = {};
		const unresolved = [];
		const seen = {};
		const rows = table || DEFAULT_TABLE;

		for (let r = 0; r < rows.length; r++) {
			const row = normalizeRow(rows[r]);
			const actions = (row.actionsUntied || []).concat(row.actionsTied || []);
			for (let a = 0; a < actions.length; a++) {
				const name = actionName(actions[a]);
				if (!name || seen[name]) continue;
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

	let activeTable = cloneTable(DEFAULT_TABLE);

	function getTable() {
		return cloneTable(activeTable);
	}

	/**
	 * Sostituisce la tabella attiva (unico custode).
	 * Accetta array di righe oppure stringa JSON dello stesso array.
	 * @param {Object[]|string} table
	 * @returns {Object[]} clone della tabella attiva
	 */
	function setTable(table) {
		let rows = table;
		if (typeof table === 'string') {
			try {
				rows = JSON.parse(table);
			} catch (err) {
				throw new Error('INPUT2.setTable: JSON non valido — ' + (err && err.message ? err.message : err));
			}
		}
		if (!Array.isArray(rows)) {
			throw new Error('INPUT2.setTable: serve un array di righe (o JSON di un array)');
		}
		activeTable = cloneTable(rows);
		return getTable();
	}

	function lookupIntent(intent, opts) {
		const entry = resolveIntent(intent, activeTable, opts || {});
		if (!entry) return null;
		const action = nextAction(entry, null);
		if (!action) return null;
		const name = action.name;
		if (isBuiltinAction(name)) return { kind: 'builtin', name: name, entry: entry, action: action };
		return { kind: 'property', name: name, entry: entry, action: action };
	}

	const api = {
		DEFAULT_TABLE: cloneTable(DEFAULT_TABLE),
		BUILTIN_ACTIONS: Object.assign({}, BUILTIN_ACTIONS),
		isBuiltinAction: isBuiltinAction,
		normalizeAction: normalizeAction,
		actionName: actionName,
		normalizeRow: normalizeRow,
		actionsForTiedState: actionsForTiedState,
		resolveIntent: resolveIntent,
		nextAction: nextAction,
		listTryActions: listTryActions,
		applyMmlsOverrides: applyMmlsOverrides,
		computeAvailability: computeAvailability,
		listGestureTriggers: listGestureTriggers,
		listActiveGestureTriggers: listActiveGestureTriggers,
		enabledRecognizerIntents: enabledRecognizerIntents,
		intentToTrigger: intentToTrigger,
		intentToAlias: intentToAlias,
		getTable: getTable,
		setTable: setTable,
		lookupIntent: lookupIntent,
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
	global.INPUT2.normalizeAction = normalizeAction;
	global.INPUT2.actionName = actionName;
	global.INPUT2.normalizeRow = normalizeRow;
	global.INPUT2.actionsForTiedState = actionsForTiedState;
	global.INPUT2.resolveIntent = resolveIntent;
	global.INPUT2.nextAction = nextAction;
	global.INPUT2.listTryActions = listTryActions;
	global.INPUT2.applyMmlsOverrides = applyMmlsOverrides;
	global.INPUT2.computeAvailability = computeAvailability;
	global.INPUT2.listGestureTriggers = listGestureTriggers;
	global.INPUT2.listActiveGestureTriggers = listActiveGestureTriggers;
	global.INPUT2.enabledRecognizerIntents = enabledRecognizerIntents;
	global.INPUT2.intentToTrigger = intentToTrigger;
	global.INPUT2.intentToAlias = intentToAlias;
	global.INPUT2.getTable = getTable;
	global.INPUT2.setTable = setTable;
	global.INPUT2.lookupIntent = lookupIntent;
	global.INPUT2.getIntentMap = getTable;
	global.INPUT2.setIntentMap = setTable;
})(typeof window !== 'undefined' ? window : globalThis);
