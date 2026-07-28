/**
 * MAIN2.js — omologo FrontEnd2 di MAIN.js (pista index2).
 *
 * Orchestrazione input2: boot, stub dei globali che mancano senza MAIN.js,
 * dispatch intent → tabella UserEvToFunctCall2, tied/untied, debug.
 * Il recognizer puro resta in input2/gestures.js.
 *
 * STUB / globali definiti qui (MAIN.js escluso da index2.html):
 *   - canvasRole  — in MAIN.js; usata da alcuni path di ExpressionManager/UserEv…;
 *   - ExtendAndInitialize / ExtendAndInitializeTree — refresh lucchetto, senza DnD/sortable;
 *   - conclude2   — analogo snello di PActxConclude senza game/sound/DnD.
 *
 * Smistamento gesture→action: tabella in UserEvToFunctCall2.js (tied/untied);
 * qui solo cablaggio. Selezione: `selectionManager` (condiviso con legacy).
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

	// searchEventHandler / tryEventActionsOnNode (usati da refine.js per il
	// cascade refining 'c') arrivano da UserEvToFunctCall.js, caricato in
	// index2.html: solo definizioni, i listener legacy vivono in MAIN.js (escluso).

	const INTENT_LOG_MAX = 50;
	const intentLog = [];
	const unresolvedWarned = {};

	/** Cache disponibilità; null = dirty (ricalcolo lazy). */
	let availabilityCache = null;

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

	/**
	 * Tabella attiva = sempre il custode UserEvToFunctCall2 (niente cache locale divergente).
	 * @returns {Object[]}
	 */
	function getActiveTable() {
		if (global.INPUT2.getTable) return global.INPUT2.getTable();
		return (global.INPUT2.DEFAULT_TABLE || []).slice();
	}

	/**
	 * Dopo ogni cambio tabella: availability, recognizer (trigger presenti), pannello debug.
	 */
	function onTableChanged() {
		invalidateAvailability();
		syncRecognizerEnabledIntents();
		refreshDebugPanel();
	}

	/**
	 * Avvolge INPUT2.setTable così console/API aggiornano anche recognizer e Shift+D.
	 */
	function installSetTableHook() {
		const orig = global.INPUT2.setTable;
		if (typeof orig !== 'function' || orig._main2Wrapped) return;
		function wrapped(table) {
			const result = orig.call(global.INPUT2, table);
			onTableChanged();
			return result;
		}
		wrapped._main2Wrapped = true;
		global.INPUT2.setTable = wrapped;
		global.INPUT2.setIntentMap = wrapped;
	}

	function buildResolverFns() {
		return {
			hasCanvasCi: function (name) {
				if (typeof findPMPropByName !== 'function') return false;
				return findPMPropByName(name).length > 0;
			},
			isRegistered: function (name) {
				if (typeof getHardWired !== 'function') return false;
				return typeof getHardWired(name) === 'function';
			}
		};
	}

	/**
	 * Ricalcola disponibilità (dopo tied / preload). Invalidabile.
	 * Aggancio: wrap di GLBsettingsToInterface + lazy alla prima dispatch.
	 */
	function refreshAvailability() {
		const table = getActiveTable();
		const result = global.INPUT2.computeAvailability
			? global.INPUT2.computeAvailability(table, buildResolverFns())
			: { availability: {}, unresolved: [] };
		availabilityCache = result.availability || result;
		const unresolved = result.unresolved || [];
		for (let i = 0; i < unresolved.length; i++) {
			const name = unresolved[i];
			if (!unresolvedWarned[name]) {
				unresolvedWarned[name] = true;
				console.warn('INPUT2: azione dichiarata ma non risolta nel registry:', name);
			}
		}
		return availabilityCache;
	}

	function invalidateAvailability() {
		availabilityCache = null;
	}

	function ensureAvailability() {
		if (!availabilityCache) refreshAvailability();
		return availabilityCache;
	}

	global.INPUT2.refreshAvailability = refreshAvailability;
	global.INPUT2.invalidateAvailability = invalidateAvailability;
	global.INPUT2.availability = function () {
		return Object.assign({}, ensureAvailability());
	};

	/**
	 * Propaga alla FSM i trigger attivi nella colonna tied/untied corrente (spec L2 G/A).
	 */
	function syncRecognizerEnabledIntents() {
		const rec = global.INPUT2._recognizer;
		if (!rec || typeof rec.setEnabledIntents !== 'function') return;
		const flags = global.INPUT2.enabledRecognizerIntents
			? global.INPUT2.enabledRecognizerIntents(getActiveTable(), { tied: isCanvasTied() })
			: null;
		if (flags) rec.setEnabledIntents(flags);
	}
	global.INPUT2.syncRecognizerEnabledIntents = syncRecognizerEnabledIntents;

	/**
	 * Tentativo load G/A da events JSON (mmls v2). Ritorna null se non applicabile.
	 * @returns {{table:Object[], violations:string[]}|null}
	 */
	function tryLoadMmlsV2GA() {
		if (typeof GLBsettings !== 'undefined' && GLBsettings && Number(GLBsettings.mmlsVersion) === 2) {
			/* ok */
		} else if (!$('#events').length) {
			return null;
		}
		// Testo grezzo della sezione #events (prototipo v2: JSON, non eventtoaction)
		let raw = '';
		try {
			raw = ($('#events').text() || '').trim();
		} catch (err) { return null; }
		if (!raw || raw.charAt(0) !== '{') return null;
		let parsed;
		try {
			parsed = JSON.parse(raw);
		} catch (err) { return null; }
		if (!parsed || parsed.format !== 'gestureActionTable' || !Array.isArray(parsed.rows)) {
			return null;
		}
		if (typeof global.INPUT2.setTable !== 'function') return null;
		const table = global.INPUT2.setTable(parsed.rows);
		if (!global.INPUT2.setTable._main2Wrapped) onTableChanged();
		return { table: table, violations: [] };
	}

	/**
	 * Dopo injectAllMMLS / settings (backend esistente): aggiorna la G/A.
	 * - mmls v2 → JSON in #events
	 * - mmls v1 → importMmlsV1 (solo colonna tied); index.html resta intatto
	 * @returns {{table: Object[], violations: string[]}}
	 */
	function reloadMmlsOverrides() {
		// v2: tabella G/A completa dal file
		if (!(global.INPUT2.isMmlsEventsV1 && global.INPUT2.isMmlsEventsV1())) {
			const v2 = tryLoadMmlsV2GA();
			if (v2) return v2;
		}

		// v1: backend ha già riempito #events con eventtoaction → solo actionsTied
		if (typeof global.INPUT2.importMmlsV1ToGA !== 'function') {
			console.warn('INPUT2: importMmlsV1.js non caricato — G/A non aggiornata dal .mmls');
			return { table: getActiveTable(), violations: [] };
		}
		const res = global.INPUT2.importMmlsV1ToGA(global.INPUT2.DEFAULT_TABLE);
		if (typeof global.INPUT2.setTable === 'function') {
			global.INPUT2.setTable(res.table);
			if (!global.INPUT2.setTable._main2Wrapped) onTableChanged();
		} else {
			onTableChanged();
		}
		for (let i = 0; i < (res.violations || []).length; i++) {
			console.warn('INPUT2: import mmls v1 ignora riga system:', res.violations[i]);
		}
		return { table: res.table, violations: res.violations || [] };
	}
	global.INPUT2.reloadMmlsOverrides = reloadMmlsOverrides;

	/**
	 * Wrap GLBsettingsToInterface: dopo tiedCanvas dal preload, ricalcola availability.
	 * Aggancio robusto (preload è async via ajax).
	 */
	function hookSettingsToInterface() {
		if (typeof global.GLBsettingsToInterface !== 'function') return;
		if (global.GLBsettingsToInterface._input2Wrapped) return;
		const orig = global.GLBsettingsToInterface;
		function wrapped() {
			const ret = orig.apply(this, arguments);
			// #events è già iniettata a questo punto: applica gli override gesto→azione del .mmls
			try { reloadMmlsOverrides(); } catch (err) {
				console.warn('INPUT2: reloadMmlsOverrides post-settings', err);
			}
			// tied applicato: ricalcola subito (ci già nel DOM a questo punto)
			try { refreshAvailability(); } catch (err) {
				console.warn('INPUT2: refreshAvailability post-settings', err);
			}
			try { refreshDebugPanel(); } catch (err) { /* pannello opzionale */ }
			// checkpoint post-preload (il take iniziale in boot è troppo presto: ajax)
			try { if (typeof ssnapshot !== 'undefined' && ssnapshot.take) ssnapshot.take(); } catch (_) { /* ignore */ }
			return ret;
		}
		wrapped._input2Wrapped = true;
		global.GLBsettingsToInterface = wrapped;
	}

	function pushIntent(intent) {
		global.INPUT2.lastIntent = intent;
		const tag = intent.target && intent.target.getAttribute
			? intent.target.getAttribute('data-enode')
			: (intent.source && intent.source.getAttribute
				? intent.source.getAttribute('data-enode')
				: null);
		intentLog.push({
			t: Date.now(),
			type: intent.type,
			axis: intent.axis || null,
			tag: tag,
			nTargets: intent.targets ? intent.targets.length : undefined
		});
		if (intentLog.length > INTENT_LOG_MAX) intentLog.shift();
	}

	function requireSelectionManager() {
		if (typeof selectionManager !== 'function') {
			console.error('INPUT2: selectionManager.js non caricato');
			return false;
		}
		return true;
	}

	/**
	 * Builtin tap/toggleSelect → selectionManager (stessa semantica legacy / DnD.js).
	 * Click plain deseleziona il resto; Cmd/Ctrl = multi; Shift = unselect mirato.
	 * @param {Object} intent
	 */
	function isDomElement(el) {
		return !!(el && el.nodeType === 1 && el.classList);
	}

	function toggleSelect(intentOrTarget) {
		if (!requireSelectionManager()) return;
		const intent = (intentOrTarget && intentOrTarget.nodeType === 1)
			? { target: intentOrTarget }
			: (intentOrTarget || {});
		const target = intent.target;
		if (!isDomElement(target)) return;
		const ctrl = !!(intent.metaKey || intent.ctrlKey);
		const shift = !!intent.shiftKey;
		selectionManager($(target), ctrl, shift);
	}

	/**
	 * Builtin selectSiblings via selectionManager: clear + multi-select (ctrl)
	 * sui soli targets del lazo (già filtrati dal recognizer).
	 * @param {Element[]} targets
	 */
	function selectSiblings(targets) {
		if (!requireSelectionManager()) return;
		const list = targets || [];
		selectionManager('', false, false, true);
		for (let i = 0; i < list.length; i++) {
			if (isDomElement(list[i])) {
				selectionManager($(list[i]), true, false);
			}
		}
	}

	/**
	 * Proprietà DnD il cui apply presuppone che Sortable abbia già inserito
	 * `dropped` nel DOM. In input2 NON spostiamo il DOM speculativamente → skip.
	 * (Documentato: limite rispetto a DnD.js + SortableJS.)
	 */
	const DND_SKIP_NEEDS_PREINSERT = {
		associativeDnD: true,
		associativeGenDnD: true,
		partDistributDnD: true,
		addRedundantDnD: true
	};

	/**
	 * Replica getDnDpropEnabled senza dipendere da tool declare: itera
	 * listDnDProperties rispettando requiresCanvasCi / ci nel canvas.
	 * @returns {Array<{name:string, findTgt:Function, apply:Function, icon?:string}>}
	 */
	function listEnabledDnDProps() {
		if (typeof listDnDProperties !== 'function') return [];
		if (typeof getDnDpropEnabled === 'function') {
			return getDnDpropEnabled().filter(function (d) {
				return !DND_SKIP_NEEDS_PREINSERT[d.name];
			});
		}
		const $cis = $('#canvasRole [data-enode=ci][data-tag]');
		const namelist = $cis.toArray().map(function (e) { return e.getAttribute('data-tag'); });
		const all = listDnDProperties();
		const out = [];
		for (let i = 0; i < all.length; i++) {
			const d = all[i];
			if (DND_SKIP_NEEDS_PREINSERT[d.name]) continue;
			const index = namelist.indexOf(d.name);
			if (!d.requiresCanvasCi || index !== -1) {
				out.push({
					name: d.name,
					findTgt: d.findTgt,
					apply: d.apply,
					icon: index !== -1 ? $cis[index].getAttribute('data-tagimg') : undefined
				});
			}
		}
		return out;
	}

	/**
	 * Verifica se (source→target) è una coppia DnD valida (prima proprietà match).
	 * Usato dal recognizer per highlight sotto il dito.
	 */
	function isValidDnDTarget(source, target) {
		return !!findFirstValidDnD(source, target);
	}

	/**
	 * Prima proprietà DnD abilitata la cui findTgt accetta source→target.
	 * findTgt legacy restituisce la lista di target validi (ruoli o ENODE);
	 * qui controlliamo se `target` (o un suo antenato role/ENODE) è nella lista.
	 * @returns {{prop:Object, $dropTarget:JQuery}|null}
	 */
	function findFirstValidDnD(source, target) {
		if (!(source instanceof Element) || !(target instanceof Element)) return null;
		if (typeof window.jQuery === 'undefined') return null;
		const $source = $(source);
		const enabled = listEnabledDnDProps();
		let $claimed = $();
		for (let i = 0; i < enabled.length; i++) {
			const prop = enabled[i];
			if (typeof prop.findTgt !== 'function') continue;
			let $found;
			try {
				$found = $(prop.findTgt($source, false, false, $claimed));
			} catch (err) {
				console.warn('INPUT2 applyDnD: findTgt fallita per', prop.name, err);
				continue;
			}
			if (!$found || !$found.length) continue;
			// target ENODE o ruolo sotto il punto di rilascio
			let $hit = $found.filter(function () {
				return this === target || (this.contains && this.contains(target)) ||
					(target.contains && target.contains(this));
			});
			if (!$hit.length) {
				// climb: il drop è sull'ENODE più profondo; findTgt può restituire il role padre o l'asta
				let climb = target;
				while (climb && climb !== document.body) {
					const el = climb;
					$hit = $found.filter(function () { return this === el; });
					if ($hit.length) break;
					climb = climb.parentElement;
				}
			}
			if ($hit.length) {
				return { prop: prop, $dropTarget: $hit.first() };
			}
			$claimed = $claimed.add($found);
		}
		return null;
	}

	/**
	 * Builtin applyDnD: pipeline DnD.js SENZA SortableJS e SENZA spostare il
	 * DOM prima della validazione. Alla prima findTgt valida → apply → conclude2.
	 * replaceDnD (requiresCanvasCi:false) resta il fallback sempre disponibile
	 * (se applicabile alla coppia). Proprietà che presuppongono dropped già
	 * inserito da Sortable sono saltate (v. DND_SKIP_NEEDS_PREINSERT).
	 */
	function applyDnD(source, target) {
		const hit = findFirstValidDnD(source, target);
		if (!hit) return false;
		const prop = hit.prop;
		const $dropTarget = hit.$dropTarget;
		let PActx;
		try {
			// firma legacy: apply(dragged, target, dropped?) — senza pre-insert
			// passiamo undefined come dropped; le prop skippate non arrivano qui
			PActx = prop.apply($(source), $dropTarget, undefined);
		} catch (err) {
			console.warn('INPUT2 applyDnD: apply fallita per', prop.name, err);
			return false;
		}
		if (PActx && PActx.matchedTF === true) {
			if (prop.icon) PActx.visualization = prop.icon;
			conclude2(PActx);
			return true;
		}
		return false;
	}

	/** Builtin undo — come scorciatoia sistema (ssnapshot.undo + refresh). */
	function builtinUndo() {
		if (typeof ssnapshot !== 'undefined' && ssnapshot.undo) {
			ssnapshot.undo();
			if (typeof RefreshEmptyInfixBraketsGlued === 'function') {
				RefreshEmptyInfixBraketsGlued($('body'), true);
			}
		}
	}

	/** Builtin load — stessa azione di MAIN.js shift+l. */
	function builtinLoad() {
		$('#fileToLoad').trigger('click');
	}

	/** Builtin save — stessa logica di MAIN.js shift+s (funzioni SaveLoad). */
	function builtinSave() {
		let fileExtension;
		let stringToBeSaved;
		if ($('.selected').length === 0) {
			stringToBeSaved = AlltoMMLSstring();
			fileExtension = '.mmls';
		} else {
			const $toBeSaved = $('.selected');
			$('.selected').removeClass('selected');
			const contentString = ENODEcreateMathmlString($toBeSaved, true);
			stringToBeSaved = '<math xmlns="http://www.w3.org/1998/Math/MathML">' + contentString + '</math>';
			fileExtension = '.mml';
		}
		if (stringToBeSaved) {
			const fileName = prompt('Save as... Attenzione: Il file verrà salvato nella cartella "Download" !! non è possibile salvare in altre cartelle', 'noname');
			if (fileName !== null) {
				saveTextAsFile(stringToBeSaved, fileName + fileExtension);
			}
		}
	}

	/**
	 * Target jQuery per l'azione: selected / pinched / slashed.
	 * Per compose* su nodo operazione → figli (compose lavora sugli operandi).
	 */
	function resolveTargets(entry, intent, actionName) {
		let $target = $();
		const src = entry.targetSource;
		if (intent && intent.type === 'key') {
			$target = $('.selected');
		} else if (src === 'selected') {
			$target = $('.selected');
		} else if (src === 'pinched' || src === 'slashed' || !src) {
			if (intent && intent.target) $target = $(intent.target);
		}

		if ($target.length === 0 && intent && intent.target && (src === 'pinched' || src === 'slashed')) {
			$target = $(intent.target);
		}

		// compose su plus/times/or: passare i figli
		if (actionName && /^compose/i.test(actionName) && $target.length === 1) {
			const tag = $target.attr('data-enode');
			if (tag === 'plus' || tag === 'times' || tag === 'or') {
				if (typeof ENODE_getChildren === 'function') {
					$target = ENODE_getChildren($target);
				} else {
					$target = $target.find('> .ul_role > [data-enode], > .ol_role > [data-enode], > .s_role > [data-enode]');
				}
			}
		}
		return $target;
	}

	function runBuiltin(name) {
		if (name === 'undo') builtinUndo();
		else if (name === 'load') builtinLoad();
		else if (name === 'save') builtinSave();
		else if (name === 'toggleSelect') { /* gestito a parte con target */ }
	}

	function isCanvasTied() {
		return !!(typeof GLBsettings !== 'undefined' && GLBsettings.tiedCanvas);
	}

	/**
	 * True se event.target è il lucchetto (.firstMember) di una definizione asimmetrica.
	 * @param {Event} event
	 * @returns {JQuery|null} il parent [data-viseq=asymmetric], o null
	 */
	function definitionLockFromEvent(event) {
		const $t = $(event.target);
		if (!$t.is('.firstMember')) return null;
		const $ENODE = $t.parent();
		if (!$ENODE.length || typeof isDefinition !== 'function' || !isDefinition($ENODE[0])) return null;
		return $ENODE;
	}

	/**
	 * Capture: sul lucchetto non far arrivare pointerdown al recognizer (#centralColumn).
	 * Altrimenti setPointerCapture ritargetta pointerup/click su centralColumn e il
	 * toggle tied/untied non scatta mai (click “perso”).
	 */
	function lockPointerDownCapture(event) {
		if (definitionLockFromEvent(event)) {
			event.stopPropagation();
		}
	}

	/**
	 * Click sul lucchetto (.firstMember di una definizione) — omologo di MAIN.js clickHandler.
	 * Su #canvas alterna GLBsettings.tiedCanvas (e classi .untied su canvas/result/events);
	 * sulle altre definizioni asimmetriche toggla solo .untied locale.
	 * Necessario in index2 perché MAIN.js non è caricato: senza questo il lazo resta
	 * sulla colonna tied (plusAssociate) e non seleziona.
	 */
	function clickHandler(event) {
		const $ENODE = definitionLockFromEvent(event);
		if (!$ENODE) return;

		if ($ENODE.is('#canvas')) {
			if (!GLBsettings.tiedCanvas) {
				GLBsettings.tiedCanvas = true;
				$('#canvas,#result,#events').removeClass('untied');
			} else {
				GLBsettings.tiedCanvas = false;
				$('#canvas,#result,#events').addClass('untied');
			}
		} else {
			$ENODE.toggleClass('untied');
		}
		if (typeof ENODERefreshAsymmEq === 'function') ENODERefreshAsymmEq($ENODE);
		if (typeof ssnapshot !== 'undefined' && ssnapshot.take) ssnapshot.take();
		// Cambio colonna tied/untied ⇒ quali gesti ascoltare può cambiare
		invalidateAvailability();
		syncRecognizerEnabledIntents();
		refreshDebugPanel();
	}
	global.INPUT2.clickHandler = clickHandler;

	function dispatchIntent(intent) {
		pushIntent(intent);
		const table = getActiveTable();
		const avail = ensureAvailability();
		const tied = isCanvasTied();
		const entry = global.INPUT2.resolveIntent
			? global.INPUT2.resolveIntent(intent, table, { tied: tied })
			: null;
		if (!entry) {
			if (typeof debugMode !== 'undefined' && debugMode) {
				console.log('INPUT2: nessun mapping per', intent);
			}
			return;
		}

		const tryList = global.INPUT2.listTryActions
			? global.INPUT2.listTryActions(entry, avail)
			: (entry.actions || []);

		for (let i = 0; i < tryList.length; i++) {
			const raw = tryList[i];
			const action = (global.INPUT2.normalizeAction
				? global.INPUT2.normalizeAction(raw)
				: (typeof raw === 'string' ? { name: raw } : raw));
			if (!action || !action.name) continue;
			const name = action.name;
			const val = action.val;

			if (global.INPUT2.isBuiltinAction && global.INPUT2.isBuiltinAction(name)) {
				if (name === 'toggleSelect' || name === 'select') {
					toggleSelect(intent);
					return;
				}
				if (name === 'selectSiblings' || name === 'selectMultiple') {
					selectSiblings(intent.targets || []);
					return;
				}
				if (name === 'applyDnD') {
					applyDnD(intent.source, intent.target);
					return;
				}
				runBuiltin(name);
				return;
			}

			// dichiarate ma non risolte: salta (warning già emesso in refresh)
			const resolvers = buildResolverFns();
			if (!resolvers.isRegistered(name)) {
				if (!unresolvedWarned[name]) {
					unresolvedWarned[name] = true;
					console.warn('INPUT2: azione dichiarata ma non risolta nel registry:', name);
				}
				continue;
			}

			const $target = resolveTargets(entry, intent, name);
			if (!$target || $target.length === 0) continue;

			const PActx = TryOnePropertyByName(name, $target, val);
			if (PActx && PActx.matchedTF === true) {
				conclude2(PActx);
				return;
			}
		}
	}
	global.INPUT2.dispatchIntent = dispatchIntent;

	function isEditableTarget(el) {
		if (!el || !el.tagName) return false;
		const tag = el.tagName.toLowerCase();
		if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
		if (el.isContentEditable) return true;
		return false;
	}

	function formatActionsCell(actions) {
		if (!actions || !actions.length) return '—';
		return actions.map(function (a) {
			if (typeof a === 'string') return a;
			if (!a || !a.name) return '?';
			return a.val ? (a.name + '(' + a.val + ')') : a.name;
		}).join(', ');
	}

	function ensureDebugPanel() {
		let panel = document.getElementById && document.getElementById('input2DebugPanel');
		if (panel) return panel;
		// Sandbox unit test: document minimale senza createElement
		if (typeof document.createElement !== 'function') {
			return { hidden: true, querySelector: function () { return null; } };
		}
		panel = document.createElement('div');
		panel.id = 'input2DebugPanel';
		panel.setAttribute('aria-label', 'Debug FrontEnd2 — tabella gesture/azioni');
		panel.innerHTML =
			'<header class="input2-debug-header">' +
			'<strong>FrontEnd2 debug</strong>' +
			'<span class="input2-debug-meta" id="input2DebugMeta"></span>' +
			'<button type="button" class="input2-debug-close" title="Chiudi (Maiusc+D)">×</button>' +
			'</header>' +
			'<div class="input2-debug-body">' +
			'<table class="input2-debug-table">' +
			'<thead><tr>' +
			'<th>Trigger</th><th>Alias</th><th>Target</th><th>System</th>' +
			'<th>Untied</th><th>Tied</th>' +
			'</tr></thead>' +
			'<tbody id="input2DebugTableBody"></tbody>' +
			'</table>' +
			'</div>';
		document.body.appendChild(panel);
		const closeBtn = panel.querySelector('.input2-debug-close');
		if (closeBtn) {
			closeBtn.addEventListener('click', function () {
				if (typeof debugMode !== 'undefined' && debugMode) debugToggle();
			});
		}
		return panel;
	}

	function refreshDebugPanel() {
		const panel = document.getElementById('input2DebugPanel');
		if (!panel || panel.hidden) return;
		const tbody = document.getElementById('input2DebugTableBody');
		const meta = document.getElementById('input2DebugMeta');
		if (!tbody) return;
		const tied = isCanvasTied();
		if (meta) {
			meta.textContent = 'stato: ' + (tied ? 'tied' : 'untied') +
				' · Maiusc+D per chiudere';
		}
		const rows = getActiveTable();
		let html = '';
		for (let i = 0; i < rows.length; i++) {
			const r = rows[i];
			const activeCol = tied ? 'tied' : 'untied';
			html += '<tr class="input2-debug-row' + (r.system ? ' is-system' : '') + '">';
			html += '<td>' + (r.trigger || '—') + '</td>';
			html += '<td>' + (r.alias || '—') + '</td>';
			html += '<td>' + (r.targetSource || '—') + '</td>';
			html += '<td>' + (r.system ? 'yes' : '') + '</td>';
			html += '<td class="col-untied' + (activeCol === 'untied' ? ' is-active' : '') + '">' +
				formatActionsCell(r.actionsUntied) + '</td>';
			html += '<td class="col-tied' + (activeCol === 'tied' ? ' is-active' : '') + '">' +
				formatActionsCell(r.actionsTied) + '</td>';
			html += '</tr>';
		}
		tbody.innerHTML = html;
	}

	/**
	 * Come MAIN.js debugToggle: Maiusc+D. Su index2 apre anche il pannello tabella.
	 */
	function debugToggle() {
		if (typeof debugMode === 'undefined') {
			console.warn('INPUT2: debugMode non definito (state.js)');
			return;
		}
		debugMode = !debugMode;
		const panel = ensureDebugPanel();
		if (debugMode) {
			document.body.classList.add('debug');
			const palette = document.getElementById('palette');
			if (palette) palette.classList.add('hidden');
			panel.hidden = false;
			refreshDebugPanel();
		} else {
			document.body.classList.remove('debug');
			const palette = document.getElementById('palette');
			if (palette) palette.classList.remove('hidden');
			panel.hidden = true;
		}
	}
	global.INPUT2.debugToggle = debugToggle;
	global.INPUT2.refreshDebugPanel = refreshDebugPanel;

	function onKeyDown(e) {
		if (isEditableTarget(e.target)) return;

		// Maiusc+D — come MAIN.js (prima della tabella gesture→azioni)
		if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey &&
			(e.key === 'd' || e.key === 'D')) {
			e.preventDefault();
			debugToggle();
			return;
		}

		const intent = {
			type: 'key',
			key: e.key,
			metaKey: !!e.metaKey,
			ctrlKey: !!e.ctrlKey,
			shiftKey: !!e.shiftKey,
			altKey: !!e.altKey
		};

		const entry = global.INPUT2.resolveIntent
			? global.INPUT2.resolveIntent(intent, getActiveTable(), { tied: isCanvasTied() })
			: null;
		if (!entry) {
			// Fallback legacy: tasti definiti solo nella sezione events del .mmls
			// (ricette esercizio, es. 'f'), come keyboardEvToFC in index.html.
			if (!e.ctrlKey && !e.metaKey && !e.altKey &&
				typeof tryEventActionsOnNode === 'function' && $('.selected').length > 0) {
				const PActx = tryEventActionsOnNode($('.selected'), e.key);
				if (PActx && PActx.matchedTF === true) conclude2(PActx);
			}
			return;
		}
		// Riga presente ma lista vuota per lo stato tied/untied corrente → no-op
		if (!entry.actions || entry.actions.length === 0) return;

		// Evita scroll frecce / comportamento browser su Mod+z
		if (entry.alias === 'Mod+z' || (entry.trigger && String(entry.trigger).indexOf('slash') === 0) ||
			entry.alias === 'ArrowUp' || entry.alias === 'ArrowDown' ||
			entry.alias === 'ArrowLeft' || entry.alias === 'ArrowRight') {
			e.preventDefault();
		}
		if (entry.alias === 'Mod+z') e.preventDefault();

		dispatchIntent(intent);
	}

	/** Change su #fileToLoad — stesso path di MAIN.js (SaveLoad.loadFileConvert). */
	function bindFileToLoad() {
		const $input = $('#fileToLoad');
		if (!$input.length) return;
		$input.off('change.input2').on('change.input2', function () {
			const fileToLoad = this.files && this.files[0];
			if (!fileToLoad) return;
			const $target = $('#canvasRole');
			const fileName = fileToLoad.name;
			const parts = fileName.split('.');
			const fileSuffix = parts[parts.length - 1];
			// Backend esistente (SaveLoad): async → injectAllMMLS → GLBsettingsToInterface
			// (wrappata) → reloadMmlsOverrides (v1→tied o v2 JSON). Non rileggere qui.
			loadFileConvert(fileToLoad, $($target[0]), fileSuffix);
			this.value = '';
		});
	}

	function boot() {
		// Prima di preload/settings: setTable da console o da reload aggiorna recognizer+debug
		installSetTableHook();
		hookSettingsToInterface();

		// Init undo (come MAIN.js)
		ssnapshot();
		// Preload asincrono (state.js ha già letto ?preloadPath=)
		preloadAll(preloadPath);
		ssnapshot.take();

		// Tied/untied e tastiera anche se il recognizer manca (test / degradazione)
		document.addEventListener('keydown', onKeyDown, false);
		document.addEventListener('pointerdown', lockPointerDownCapture, true);
		document.addEventListener('click', clickHandler, false);
		bindFileToLoad();
		ensureDebugPanel().hidden = true;
		invalidateAvailability();

		if (typeof global.INPUT2.bindGestureRecognizer !== 'function') {
			console.error('INPUT2: gestures.js non caricato');
			return;
		}
		const initialEnabled = global.INPUT2.enabledRecognizerIntents
			? global.INPUT2.enabledRecognizerIntents(getActiveTable(), { tied: isCanvasTied() })
			: undefined;
		global.INPUT2._recognizer = global.INPUT2.bindGestureRecognizer({
			root: '#centralColumn',
			onIntent: dispatchIntent,
			isValidDnDTarget: isValidDnDTarget,
			enabledIntents: initialEnabled
		});
		// Tabella può essere già stata aggiornata dal preload async: riallinea i flag
		syncRecognizerEnabledIntents();

		console.log('INPUT2 boot ok — preloadPath=', preloadPath);
	}

	global.INPUT2.dispatchIntent = dispatchIntent;
	global.INPUT2._selectionHelpers = {
		toggleSelect: toggleSelect,
		selectSiblings: selectSiblings
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})(typeof window !== 'undefined' ? window : globalThis);
