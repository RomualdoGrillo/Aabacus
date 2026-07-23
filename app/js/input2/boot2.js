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
 * Non modifica file esistenti. Nessun git commit da questo modulo.
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
				: null
		});
		if (intentLog.length > INTENT_LOG_MAX) intentLog.shift();
	}

	function toggleSelect(target) {
		if (!(target instanceof Element)) return;
		target.classList.toggle('selected');
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
		} else if (action.kind === 'builtin' && action.name === 'toggleSelect') {
			toggleSelect(intent.target);
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

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})(typeof window !== 'undefined' ? window : globalThis);
