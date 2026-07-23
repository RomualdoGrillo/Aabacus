// Post-applicazione proprietà (Property Application Mode): replace + refine.
// Strato properties (software-modules.md).
//
// Modello semplice: si marca cosa raffinare (lettere / REFINE_KINDS), non "quanto".
// Percorsi tipizzati: oggi solo "c" (ricetta #events "c").
// Per aggiungerne uno: registrare kind → markerClass + eventKey, poi markNeedsRefine($n, kind)
// (o post-mark PM con la stessa lettera). Non riusare "n" (già = non riordinare in orderUL).
//
// Cascade refining: una proprietà di refine può a sua volta markNeedsRefine altri nodi;
// la passata successiva li riprende, fino a esaurimento o a REFINE_MAX_STEPS (anti-loop).
//
// Prossimi passi:
// - ricetta esplicita (lista proprietà) oltre alla sola chiave evento

/**
 * Percorsi di raffinamento disponibili.
 * markerClass: classe DOM sui nodi da trattare
 * eventKey: evento in #events la cui lista azioni è la ricetta
 */
const REFINE_KINDS = {
	c: {
		// dissolve / neutri / associate leggeri — gestToAction evento "c"
		markerClass: 'Refine_c',
		eventKey: 'c'
	}
};

/** Tetto di passi riusciti per cascade refining (un kind / una runRefinePass) */
const REFINE_MAX_STEPS = 20;

/** Alias retrocompatibili del percorso "c" */
const REFINE_MARKER_CLASS = REFINE_KINDS.c.markerClass;
const REFINE_MARKER_SELECTOR = '.' + REFINE_MARKER_CLASS;
const REFINE_EVENT_KEY = REFINE_KINDS.c.eventKey;

function refineMarkerClass(kind) {
	const def = REFINE_KINDS[kind]
	if (!def) {
		console.warn('refine: unknown kind "' + kind + '"')
		return 'Refine_' + kind
	}
	return def.markerClass
}

function refineMarkerSelector(kind) {
	return '.' + refineMarkerClass(kind)
}

function refineEventKey(kind) {
	const def = REFINE_KINDS[kind]
	if (!def) {
		console.warn('refine: unknown kind "' + kind + '"')
		return kind
	}
	return def.eventKey
}

/**
 * Marca uno o più ENODE come da raffinare dopo PActxConclude.
 * @param {JQuery|Element|string} $nodes
 * @param {string} [kind='c'] chiave in REFINE_KINDS
 * @returns {JQuery} i nodi marcati
 */
function markNeedsRefine($nodes, kind) {
	if (kind == null) { kind = 'c' }
	return $($nodes).addClass(refineMarkerClass(kind));
}

/**
 * Rimuove tutte le classi marker dei percorsi registrati (e opzionalmente da un sottoalbero).
 * @param {JQuery} [$root] se assente pulisce l'intero documento
 * @returns {JQuery} l'ambito ripulito
 */
function clearRefineMarkers($root) {
	const $scope = $root && $root.length ? $root.find('[data-enode]').addBack('[data-enode]') : $('*')
	const kinds = Object.keys(REFINE_KINDS)
	for (let i = 0; i < kinds.length; i++) {
		$scope.removeClass(refineMarkerClass(kinds[i]))
	}
	return $scope
}

/**
 * Prova le proprietà del percorso `kind` (o eventKey esplicito) su un nodo.
 * Non passa da keyboardEvToFC: usa tryEventActionsOnNode.
 * @param {JQuery} $ENODE
 * @param {string} [kindOrEventKey] chiave in REFINE_KINDS oppure eventKey esplicito
 * @returns {PActx|undefined}
 */
function trySimplifyNode($ENODE, kindOrEventKey) {
	let eventKey = REFINE_EVENT_KEY
	if (kindOrEventKey != null) {
		eventKey = REFINE_KINDS[kindOrEventKey]
			? REFINE_KINDS[kindOrEventKey].eventKey
			: kindOrEventKey
	}
	return tryEventActionsOnNode($ENODE, eventKey)
}

/**
 * Sostituisce l'operando con il transform (se non già fatto) e aggiorna infix/empty/brackets.
 * Usata sia dal conclude esterno sia da ogni passo di refine.
 * @param {PActx} PActx
 * @returns {PActx}
 */
function refreshAndReplace(PActx) {
	console.log("Applied property: " + PActx.msg)
	let $toBeRefreshed

	if (PActx.replacedAlready == true) {
		$toBeRefreshed = ENODEparent(PActx.$transform)
	} else {
		$toBeRefreshed = ENODEparent(PActx.$operand)
		ENODEinsertBefore(PActx.$transform, PActx.$operand[0]);
		ENODEremove(PActx.$operand)
	}

	if ($toBeRefreshed !== undefined && $toBeRefreshed.length != 0) {
		RefreshEmptyInfixBraketsGlued();
	}
	return PActx
}

/**
 * Cascade refining: ripete trySimplifyNode sui nodi che matchano selector
 * finché non ci sono più match, al più REFINE_MAX_STEPS volte (anti-loop).
 * @param {JQuery} $transform ramo trasformato da cui partire
 * @param {{key: string, selector: string}} pass eventKey e selettore dei nodi marcati
 */
function runRefinePass($transform, pass) {
	const key = pass.key
	const selector = pass.selector
	let steps = 0
	let madeProgress = true
	let $transformParentRole = $transform.parent()
	while (madeProgress) {
		let $toBesemplified = $transformParentRole.find('[data-enode]')
		if (selector) {
			$toBesemplified = $toBesemplified.filter(selector)
		}
		madeProgress = false
		for (let j = $toBesemplified.length - 1; j >= 0; j--) {
			const refinementPActx = trySimplifyNode($($toBesemplified[j]), key)
			if (refinementPActx && refinementPActx.matchedTF) {
				if (steps >= REFINE_MAX_STEPS) {
					console.warn(
						'cascade refining: raggiunto REFINE_MAX_STEPS (' + REFINE_MAX_STEPS +
						') con ancora match possibili; key=' + key + ' selector=' + selector
					)
					return
				}
				refreshAndReplace(refinementPActx)
				madeProgress = true
				steps++
				break
			}
		}
	}
}

/**
 * Cascade refining sul ramo trasformato. Di default esegue tutti i percorsi in REFINE_KINDS
 * (oggi solo "c"). Non richiama PActxConclude (niente snapshot/celebrate intermedi).
 *
 * @param {JQuery} $transform
 * @param {{kinds?: string[], key?: string, selector?: string}} [options]
 *   - kinds: elenco ordinato di kind da eseguire (default: chiavi di REFINE_KINDS)
 *   - key + selector: una sola passata legacy (RepeatedRefine_c)
 */
function refineAfterProperty($transform, options) {
	if (!$transform || !$transform.length) { return }
	options = options || {}

	// Retrocompat: key/selector espliciti → una passata
	if (options.key != null || options.selector != null) {
		runRefinePass($transform, {
			key: options.key != null ? options.key : REFINE_EVENT_KEY,
			selector: options.selector != null ? options.selector : REFINE_MARKER_SELECTOR
		})
		return
	}

	const kinds = options.kinds || Object.keys(REFINE_KINDS)
	for (let i = 0; i < kinds.length; i++) {
		const kind = kinds[i]
		if (!REFINE_KINDS[kind]) { continue }
		runRefinePass($transform, {
			key: refineEventKey(kind),
			selector: refineMarkerSelector(kind)
		})
	}
}

/**
 * Post immediato dopo una proprietà riuscita: replace/refresh, poi cascade refining
 * sui nodi marcati (REFINE_KINDS). Snapshot/celebrate/visualize restano in PActxConclude.
 * @param {PActx} PActx
 * @returns {PActx}
 */
function postApplyAfterProperty(PActx) {
	refreshAndReplace(PActx)
	if (PActx.$transform && PActx.$transform.length) {
		refineAfterProperty(PActx.$transform)
	}
	return PActx
}

/** @deprecated usare refineAfterProperty — alias per compatibilità */
function RepeatedRefine_c($transform, key, selector) {
	return refineAfterProperty($transform, { key: key, selector: selector })
}
