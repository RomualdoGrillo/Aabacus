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
 * Smistamento gesture→action: funzioni pure in intentMap.js; qui solo cablaggio.
 * Non modifica file fuori perimetro. Nessun git commit da questo modulo.
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
	let activeTable = null;

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

	function getActiveTable() {
		if (!activeTable) {
			activeTable = global.INPUT2.getTable
				? global.INPUT2.getTable()
				: (global.INPUT2.DEFAULT_TABLE || []).slice();
		}
		return activeTable;
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
	 * Legge la sezione #events (iniettata dal preload .mmls) e trasforma gli
	 * eventtoaction in override della tabella (spec §7.4-7.5): l'evento può
	 * essere un nome di gesto (slashVert, pinchHor, …) o un alias tastiera.
	 * I nomi che non corrispondono a nessuna riga restano al path legacy
	 * (tryEventActionsOnNode) e qui vengono ignorati.
	 * @returns {Object} overrides per applyMmlsOverrides
	 */
	function readMmlsGestureOverrides() {
		const overrides = {};
		$('#events').find('[data-enode="eventtoaction"]').each(function () {
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
					// secondo argomento ltr/rtl/int (come tryEventActionsOnNode)
					try {
						const val = ENODE_getName(ENODE_getRoles($actions[j], '.values').children()[0]);
						if (val) action.val = val;
					} catch (errVal) { /* .values assente: ok */ }
					actions.push(action);
				} catch (err) { /* action malformata: ignora */ }
			}
			if (actions.length) overrides[eventName] = { actions: actions };
		});
		return overrides;
	}

	/**
	 * Ricostruisce la tabella attiva dagli override del .mmls corrente.
	 * Le righe system non sono sovrascrivibili: violazioni → warning.
	 * @returns {{table: Object[], violations: string[]}}
	 */
	function reloadMmlsOverrides() {
		if (typeof global.INPUT2.applyMmlsOverrides !== 'function') {
			return { table: getActiveTable(), violations: [] };
		}
		const overrides = readMmlsGestureOverrides();
		const res = global.INPUT2.applyMmlsOverrides(
			global.INPUT2.DEFAULT_TABLE, overrides);
		activeTable = res.table;
		for (let i = 0; i < res.violations.length; i++) {
			console.warn('INPUT2: il .mmls tenta di rimappare un gesto di sistema, ignorato:', res.violations[i]);
		}
		invalidateAvailability();
		return res;
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

	function toggleSelect(target) {
		if (!(target instanceof Element)) return;
		target.classList.toggle('selected');
	}

	/**
	 * Builtin selectSiblings: deseleziona tutto, poi addClass('selected') sui
	 * targets del lazo (fratelli già risolti dal recognizer).
	 */
	function selectSiblings(targets) {
		const list = targets || [];
		document.querySelectorAll('#canvasRole [data-enode].selected').forEach(function (el) {
			el.classList.remove('selected');
		});
		for (let i = 0; i < list.length; i++) {
			if (list[i] instanceof Element) list[i].classList.add('selected');
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

	function dispatchIntent(intent) {
		pushIntent(intent);
		const table = getActiveTable();
		const avail = ensureAvailability();
		const entry = global.INPUT2.resolveIntent
			? global.INPUT2.resolveIntent(intent, table)
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
				if (name === 'toggleSelect') {
					toggleSelect(intent.target);
					return;
				}
				if (name === 'selectSiblings') {
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

	function onKeyDown(e) {
		if (isEditableTarget(e.target)) return;

		const intent = {
			type: 'key',
			key: e.key,
			metaKey: !!e.metaKey,
			ctrlKey: !!e.ctrlKey,
			shiftKey: !!e.shiftKey,
			altKey: !!e.altKey
		};

		const entry = global.INPUT2.resolveIntent
			? global.INPUT2.resolveIntent(intent, getActiveTable())
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
			loadFileConvert(fileToLoad, $($target[0]), fileSuffix);
			this.value = '';
			// il file può ridefinire #events: riapplica override e disponibilità
			try { reloadMmlsOverrides(); } catch (err) { invalidateAvailability(); }
		});
	}

	function boot() {
		hookSettingsToInterface();

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
			onIntent: dispatchIntent,
			isValidDnDTarget: isValidDnDTarget
		});

		document.addEventListener('keydown', onKeyDown, false);
		bindFileToLoad();

		// availability lazy: se settings già applicati sync, prova subito
		invalidateAvailability();

		console.log('INPUT2 boot ok — preloadPath=', preloadPath);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})(typeof window !== 'undefined' ? window : globalThis);
