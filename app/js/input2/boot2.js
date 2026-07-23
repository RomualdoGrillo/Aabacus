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
 * Selezione (strutturale):
 *   tap          → come selectionManager senza Cmd (sostituisce) / con Cmd (add)
 *   lasso        → selectSiblings: solo i target del lazo che condividono lo stesso padre
 *                  (mai “tutti i fratelli del role”)
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

	function clearSelection(scope) {
		const root = scope || document;
		const nodes = root.querySelectorAll('[data-enode].selected, [data-enode].unselected');
		for (let i = 0; i < nodes.length; i++) {
			nodes[i].classList.remove('selected', 'unselected');
		}
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
	 * Selezione lazo = multi-select dei soli target (fratelli) colpiti.
	 * @param {Element[]} targets
	 */
	function selectSiblings(targets) {
		clearSelection(document.getElementById('canvasRole') || document);
		const chosen = filterSiblingSet(targets || []);
		for (let i = 0; i < chosen.length; i++) {
			chosen[i].classList.add('selected');
		}
		return chosen;
	}

	/**
	 * Tap: allineato a selectionManager (MAIN.js).
	 * - senza Cmd/Ctrl: deseleziona tutto e seleziona il target (o deseleziona se era già selected)
	 * - con Cmd/Ctrl: aggiunge alla selezione (multi), senza toccare gli altri
	 * - Shift: unselect mirato (come legacy)
	 * @param {Object} intent
	 */
	function applySelect(intent) {
		const target = intent && intent.target;
		if (!isDomElement(target)) return;
		const multi = !!(intent.metaKey || intent.ctrlKey);
		const shift = !!intent.shiftKey;

		if (multi) {
			if (target.classList.contains('selected')) {
				target.classList.remove('selected');
				const nested = target.querySelectorAll('[data-enode]');
				for (let i = 0; i < nested.length; i++) {
					nested[i].classList.remove('selected', 'unselected');
				}
			} else if (target.closest && target.closest('.selected')) {
				// antenato già selected: ignora (come legacy)
			} else {
				target.classList.add('selected');
			}
			return;
		}

		if (shift) {
			if (target.classList.contains('selected')) {
				target.classList.remove('selected');
				const nested = target.querySelectorAll('[data-enode]');
				for (let i = 0; i < nested.length; i++) {
					nested[i].classList.remove('selected', 'unselected');
				}
			} else if (target.classList.contains('unselected')) {
				target.classList.remove('unselected');
				const nested = target.querySelectorAll('[data-enode]');
				for (let i = 0; i < nested.length; i++) {
					nested[i].classList.remove('selected', 'unselected');
				}
			} else if (target.closest('.selected') && !target.closest('.unselected')) {
				target.classList.add('unselected');
				const nested = target.querySelectorAll('[data-enode]');
				for (let i = 0; i < nested.length; i++) {
					nested[i].classList.remove('selected', 'unselected');
				}
			}
			return;
		}

		const wasSelected = target.classList.contains('selected');
		clearSelection(document.getElementById('canvasRole') || document);
		if (!wasSelected) {
			target.classList.add('selected');
		}
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
		} else if (action.kind === 'builtin' && action.name === 'select') {
			applySelect(intent);
		} else if (action.kind === 'builtin' && action.name === 'selectSiblings') {
			selectSiblings(intent.targets || (intent.target ? [intent.target] : []));
		} else if (action.kind === 'builtin' && action.name === 'toggleSelect') {
			// retrocompat: tratta come select semplice
			applySelect(intent);
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
		clearSelection: clearSelection,
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
