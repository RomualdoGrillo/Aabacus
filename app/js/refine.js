// Post-applicazione proprietà (Property Application Mode): replace + refine.
// Strato properties (software-modules.md).
//
// Percorsi di refine tipizzati (REFINE_KINDS): oggi solo "c" (ricetta #events "c").
// Per aggiungerne uno: registrare kind → markerClass + eventKey, poi markNeedsRefine($n, kind).
// Non riusare la lettera post-mark "n" (già = non riordinare in orderUL).
//
// Prossimi passi:
// - ricetta esplicita (lista proprietà) oltre alla sola chiave evento
// - intensità di post (light / standard / full) su PActx

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
 * @param {jQuery|Element|string} $nodes
 * @param {string} [kind='c'] — chiave in REFINE_KINDS
 */
function markNeedsRefine($nodes, kind) {
	if (kind == null) { kind = 'c' }
	return $($nodes).addClass(refineMarkerClass(kind));
}

/** Rimuove tutte le classi marker dei percorsi registrati (e opzionalmente da un sottoalbero). */
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
 * Una passata di refine: ripete trySimplifyNode sui nodi che matchano selector
 * finché non ci sono più match (max 20).
 */
function runRefinePass($transform, pass) {
	const key = pass.key
	const selector = pass.selector
	let i = 0
	let semplificEffettuata = true
	let $transformParentRole = $transform.parent()
	while (semplificEffettuata == true && i < 20) {
		let $toBesemplified = $transformParentRole.find('[data-enode]')
		if (selector) {
			$toBesemplified = $toBesemplified.filter(selector)
		}
		let j = ($toBesemplified.length - 1)
		semplificEffettuata = false
		while (j >= 0) {
			const refinementPActx = trySimplifyNode($($toBesemplified[j]), key)
			if (refinementPActx && refinementPActx.matchedTF) {
				refreshAndReplace(refinementPActx)
				semplificEffettuata = true
				break
			}
			j--
		}
		i++
	}
}

/**
 * Raffinamento sul ramo trasformato. Di default esegue tutti i percorsi in REFINE_KINDS
 * (oggi solo "c"). Non richiama PActxConclude (niente snapshot/celebrate intermedi).
 *
 * @param {jQuery} $transform
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

/** @deprecated usare refineAfterProperty — alias per compatibilità */
function RepeatedRefine_c($transform, key, selector) {
	return refineAfterProperty($transform, { key: key, selector: selector })
}
