// Post-applicazione proprietà (Property Application Mode): replace + refine.
// Strato properties (software-modules.md).
//
// Prossimi passi:
// - ricetta di semplificazione esplicita (lista proprietà) invece della sola chiave evento "c"
// - intensità di post (light / standard / full) su PActx

/** Classe DOM: nodo candidato al refine dopo una proprietà */
const REFINE_MARKER_CLASS = 'Refine_c';
const REFINE_MARKER_SELECTOR = '.' + REFINE_MARKER_CLASS;
/** Evento in #events (gestToAction) la cui lista azioni è la ricetta di semplificazione automatica */
const REFINE_EVENT_KEY = 'c';

/**
 * Marca uno o più ENODE come da raffinare dopo PActxConclude.
 * Unifica HW e PM (post-mark "c").
 */
function markNeedsRefine($nodes) {
	return $($nodes).addClass(REFINE_MARKER_CLASS);
}

/**
 * Prova le proprietà di semplificazione su un nodo (ricetta evento REFINE_EVENT_KEY / options.key).
 * Non passa da keyboardEvToFC: usa tryEventActionsOnNode.
 */
function trySimplifyNode($ENODE, eventKey) {
	return tryEventActionsOnNode($ENODE, eventKey != null ? eventKey : REFINE_EVENT_KEY)
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
 * Raffinamento iterativo sul ramo trasformato: prova trySimplifyNode
 * su ogni nodo marcato finché non ci sono più match (max 20 passate).
 * Non richiama PActxConclude (niente snapshot/celebrate intermedi).
 *
 * @param {jQuery} $transform - più grande elemento trasformato
 * @param {{key?: string, selector?: string}} [options]
 */
function refineAfterProperty($transform, options) {
	if (!$transform || !$transform.length) { return }
	options = options || {}
	const key = options.key != null ? options.key : REFINE_EVENT_KEY
	const selector = options.selector != null ? options.selector : REFINE_MARKER_SELECTOR

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

/** @deprecated usare refineAfterProperty — alias per compatibilità */
function RepeatedRefine_c($transform, key, selector) {
	return refineAfterProperty($transform, { key: key, selector: selector })
}
