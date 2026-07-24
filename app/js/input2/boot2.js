/**
 * input2/boot2.js — orchestrazione input2 (sostituisce MAIN.js + layer interaction).
 *
 * STUB / globali definiti qui (file esclusi da index2.html):
 *   - canvasRole  — in MAIN.js; usata da alcuni path di ExpressionManager/UserEv…;
 *                   definita qui perché MAIN.js non è caricato.
 *   - ExtendAndInitialize / ExtendAndInitializeTree — in MAIN.js; chiamate da
 *                   ENODEclone / inject / Undo. Reimplementate qui (solo refresh
 *                   lucchetto sulle definizioni), senza DnD/sortable.
 *   - conclude2   — analogo snello di PActxConclude senza game/sound/DnD.
 *
 * Selezione (strutturale) — riusa `selectionManager` (js/selectionManager.js):
 *   tap          → selectionManager($target, meta|ctrl, shift)
 *   lasso        → deselectAll + ctrl-add sui soli sibling colpiti
 */
(function (global) {
	'use strict';

	// ——— Stub/globali mancanti (MAIN.js escluso) ———
	/** @type {Element|null} Globale d'interfaccia: contenitore #canvasRole (era in MAIN.js). */
	global.canvasRole = document.getElementById('canvasRole');

	/**
	 * Stub di MAIN.js: inizializza un singolo ENODE (icone lucchetto su definizioni).
	 * @param {JQuery} $ENODE
	 */
	function ExtendAndInitialize($ENODE) {
		if ($ENODE && $ENODE.is && $ENODE.is('[data-enode]') && typeof isDefinition === 'function' && isDefinition($ENODE[0])) {
			ENODERefreshAsymmEq($ENODE);
		}
	}

	/**
	 * Stub di MAIN.js: applica ExtendAndInitialize all'albero.
	 * Richiesto da ENODEclone / inject (SaveLoad) / Undo — senza questo il preload fallisce.
	 * @param {JQuery} $startElement
	 */
	function ExtendAndInitializeTree($startElement) {
		ENODEapplyFunctToTree($startElement, true, ExtendAndInitialize);
	}

	global.ExtendAndInitialize = ExtendAndInitialize;
	global.ExtendAndInitializeTree = ExtendAndInitializeTree;

	const INTENT_LOG_MAX = 50;
	const intentLog = [];

	global.INPUT2 = global.INPUT2 || {};
	global.INPUT2.lastIntent = null;
	global.INPUT2.intentLog = intentLog;

	/**
	 * Conclusione proprietà (sostituto di PActxConclude senza game/celebrate/sound).
	 * Se matchedTF → postApplyAfterProperty, refresh infix, snapshot undo.
	 * @param {PActx} PActx
	 */
	function conclude2(PActx) {
		if (PActx && PActx.matchedTF === true) {
			postApplyAfterProperty(PActx);
			RefreshEmptyInfixBraketsGlued($('body'), true);
			ssnapshot.take();
		}
		return PActx;
	}
	global.INPUT2.conclude2 = conclude2;

	function pushIntent(intent) {
		global.INPUT2.lastIntent = intent;
		intentLog.push({
			t: Date.now(),
			type: intent.type,
			axis: intent.axis || null,
			tag: intent.target && intent.target.getAttribute
				? intent.target.getAttribute('data-enode')
				: null,
			nTargets: intent.targets ? intent.targets.length : undefined
		});
		if (intentLog.length > INTENT_LOG_MAX) intentLog.shift();
	}

	function isDomElement(el) {
		return !!(el && el.nodeType === 1 && el.classList && typeof el.matches === 'function');
	}

	function requireSelectionManager() {
		if (typeof selectionManager !== 'function') {
			console.error('INPUT2: selectionManager.js non caricato');
			return false;
		}
		return true;
	}

	/**
	 * Porta un ENODE al livello “figlio di role” (termine di somma/prodotto), se possibile.
	 * @param {Element} el
	 * @returns {Element}
	 */
	function toRoleChild(el) {
		let n = el;
		while (n && n.parentElement) {
			const p = n.parentElement;
			if (p.matches && p.matches('.ol_role, .ul_role, .s_role, .bVar_role')) {
				if (n.matches && n.matches('[data-enode]')) return n;
			}
			if (n.matches && n.matches('#canvasRole, #canvas, #centralColumn')) break;
			n = p;
		}
		return el;
	}

	/**
	 * Tra i target del lazo, tiene solo il gruppo di fratelli (stesso parent) più numeroso.
	 * Non aggiunge i fratelli non colpiti.
	 * @param {Element[]} targets
	 * @returns {Element[]}
	 */
	function filterSiblingSet(targets) {
		if (!targets || !targets.length) return [];
		const terms = [];
		const seen = new Set();
		for (let i = 0; i < targets.length; i++) {
			const t = targets[i];
			if (!isDomElement(t)) continue;
			const term = toRoleChild(t);
			if (seen.has(term)) continue;
			seen.add(term);
			terms.push(term);
		}
		if (terms.length <= 1) return terms;

		/** @type {Map<Element, Element[]>} */
		const byParent = new Map();
		for (let i = 0; i < terms.length; i++) {
			const term = terms[i];
			const parent = term.parentElement;
			if (!parent) continue;
			let list = byParent.get(parent);
			if (!list) {
				list = [];
				byParent.set(parent, list);
			}
			list.push(term);
		}
		let best = terms.slice(0, 1);
		byParent.forEach(function (list) {
			if (list.length > best.length) best = list;
		});
		return best;
	}

	/**
	 * Selezione lazo via selectionManager: clear + multi-select (ctrl) sui soli colpiti.
	 * @param {Element[]} targets
	 */
	function selectSiblings(targets) {
		if (!requireSelectionManager()) return [];
		const chosen = filterSiblingSet(targets || []);
		selectionManager('', false, false, true);
		for (let i = 0; i < chosen.length; i++) {
			selectionManager($(chosen[i]), true, false);
		}
		return chosen;
	}

	/**
	 * Tap → selectionManager (stessa semantica della UI legacy / DnD.js).
	 * @param {Object} intent
	 */
	function applySelect(intent) {
		if (!requireSelectionManager()) return;
		const target = intent && intent.target;
		if (!isDomElement(target)) return;
		const ctrl = !!(intent.metaKey || intent.ctrlKey);
		const shift = !!intent.shiftKey;
		selectionManager($(target), ctrl, shift);
	}

	function dispatchIntent(intent) {
		pushIntent(intent);
		const action = global.INPUT2.lookupIntent
			? global.INPUT2.lookupIntent(intent)
			: null;
		if (!action) {
			if (typeof debugMode !== 'undefined' && debugMode) {
				console.log('INPUT2: nessun mapping per', intent);
			}
			return;
		}
		if (action.kind === 'property') {
			const PActx = TryOnePropertyByName(action.name, $(intent.target));
			conclude2(PActx);
		} else if (action.kind === 'builtin' && (action.name === 'select' || action.name === 'toggleSelect')) {
			applySelect(intent);
		} else if (action.kind === 'builtin' && action.name === 'selectSiblings') {
			selectSiblings(intent.targets || (intent.target ? [intent.target] : []));
		}
	}

	function boot() {
		// Init undo (come MAIN.js)
		ssnapshot();
		// Preload asincrono (state.js ha già letto ?preloadPath=)
		preloadAll(preloadPath);
		ssnapshot.take();

		if (typeof global.INPUT2.bindGestureRecognizer !== 'function') {
			console.error('INPUT2: gestures.js non caricato');
			return;
		}
		global.INPUT2._recognizer = global.INPUT2.bindGestureRecognizer({
			root: '#centralColumn',
			onIntent: dispatchIntent
		});

		console.log('INPUT2 boot ok — preloadPath=', preloadPath);
	}

	global.INPUT2._selectionHelpers = {
		filterSiblingSet: filterSiblingSet,
		selectSiblings: selectSiblings,
		applySelect: applySelect,
		toRoleChild: toRoleChild
	};
	global.INPUT2.dispatchIntent = dispatchIntent;

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})(typeof window !== 'undefined' ? window : globalThis);
