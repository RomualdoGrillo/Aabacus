// @ts-check
//Modulo IIFE (passo 8, software-modules.md §4.1): helper privati nello scope del modulo,
//interfaccia esportata su Aabacus.props + alias globali di compatibilità (index2, newPM, test).
(function (/** @type {any} */ global) {

// Post-applicazione proprietà (Property Application Mode): replace + refine.
// Strato properties (software-modules.md).
//
// Modello semplice: si marca cosa raffinare (lettere / REFINE_KINDS), non "quanto".
// Percorsi tipizzati: oggi solo "c" (ricetta #events "c").
// Per aggiungerne uno: registrare kind → markerClass + eventKey oppure recipe esplicita
// [{prop, arg}], poi markNeedsRefine($n, kind) (o post-mark PM con la stessa lettera).
// Non riusare "n" (già = non riordinare in orderUL).
//
// Cascade refining: una proprietà di refine può a sua volta markNeedsRefine altri nodi;
// la passata successiva li riprende, fino a esaurimento o a REFINE_MAX_STEPS (anti-loop).

/**
 * Percorsi di raffinamento disponibili.
 * markerClass: classe DOM sui nodi da trattare
 * eventKey: evento in #events la cui lista azioni è la ricetta (dipende dall'esercizio)
 * recipe: in alternativa, ricetta esplicita indipendente da #events; ogni voce è
 *   {prop, arg} e viene tentata in ordine (prima che va a segno vince)
 * @type {Object.<string, {markerClass: string, eventKey?: string, recipe?: Array<{prop: string, arg?: string}>}>}
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

/**
 * @param {string} kind chiave in REFINE_KINDS
 * @returns {string} classe marker del percorso
 */
function refineMarkerClass(kind) {
	const def = REFINE_KINDS[kind]
	if (!def) {
		console.warn('refine: unknown kind "' + kind + '"')
		return 'Refine_' + kind
	}
	return def.markerClass
}

/**
 * @param {string} kind chiave in REFINE_KINDS
 * @returns {string} selettore CSS del marker
 */
function refineMarkerSelector(kind) {
	return '.' + refineMarkerClass(kind)
}

/**
 * Marca uno o più ENODE come da raffinare dopo PActxConclude.
 * @param {JQuery|Element|string} $nodes
 * @param {string} [kind='c'] chiave in REFINE_KINDS
 * @returns {JQuery} i nodi marcati
 */
function markNeedsRefine($nodes, kind) {
	if (kind == null) { kind = 'c' }
	return $(/** @type {JQuery} */ ($nodes)).addClass(refineMarkerClass(kind));
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
 * Prova in ordine le voci di una ricetta esplicita {prop, arg} su un nodo,
 * fermandosi alla prima che va a segno (via TryOnePropertyByName).
 * @param {JQuery} $ENODE
 * @param {Array<{prop: string, arg?: string}>} recipe
 * @returns {PActx}
 */
function tryRecipeOnNode($ENODE, recipe) {
	let PActx
	for (let i = 0; i < recipe.length; i++) {
		PActx = TryOnePropertyByName(recipe[i].prop, $ENODE, recipe[i].arg)
		if (PActx && PActx.matchedTF) {
			PActx.msg = recipe[i].prop + (recipe[i].arg != null ? ' ' + recipe[i].arg : '')
			break
		}
	}
	if (PActx == undefined) { PActx = newPActx() }
	return PActx
}

/**
 * Prova le proprietà del percorso `kind` su un nodo: ricetta esplicita (recipe)
 * se il kind la definisce, altrimenti le azioni #events dell'eventKey (per un
 * eventKey non registrato in REFINE_KINDS la stringa è usata direttamente).
 * Non passa da keyboardEvToFC: usa tryRecipeOnNode / tryEventActionsOnNode.
 * @param {JQuery} $ENODE
 * @param {string} [kindOrEventKey] chiave in REFINE_KINDS oppure eventKey esplicito (default 'c')
 * @returns {PActx|undefined}
 */
function trySimplifyNode($ENODE, kindOrEventKey) {
	const kind = kindOrEventKey == null ? 'c' : kindOrEventKey
	const def = REFINE_KINDS[kind]
	if (def && def.recipe) {
		return tryRecipeOnNode($ENODE, def.recipe)
	}
	return tryEventActionsOnNode($ENODE, def ? def.eventKey : kind)
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
		ENODEinsertBefore(/** @type {JQuery} */ (PActx.$transform), /** @type {JQuery} */ (PActx.$operand)[0]);
		ENODEremove(/** @type {JQuery} */ (PActx.$operand))
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
 * @param {{kind: string, selector: string}} pass kind del percorso e selettore dei nodi marcati
 */
function runRefinePass($transform, pass) {
	const key = pass.kind
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
						') con ancora match possibili; kind=' + key + ' selector=' + selector
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
 * @param {{kinds?: string[]}} [options]
 *   - kinds: elenco ordinato di kind da eseguire (default: chiavi di REFINE_KINDS)
 */
function refineAfterProperty($transform, options) {
	if (!$transform || !$transform.length) { return }
	options = options || {}

	const kinds = options.kinds || Object.keys(REFINE_KINDS)
	for (let i = 0; i < kinds.length; i++) {
		const kind = kinds[i]
		if (!REFINE_KINDS[kind]) { continue }
		runRefinePass($transform, {
			kind: kind,
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

//--- interfaccia del modulo (software-modules.md §2.2/§2.3) ---
var api = {
	REFINE_KINDS: REFINE_KINDS,
	markNeedsRefine: markNeedsRefine,
	clearRefineMarkers: clearRefineMarkers,
	trySimplifyNode: trySimplifyNode,
	refreshAndReplace: refreshAndReplace,
	refineAfterProperty: refineAfterProperty,
	postApplyAfterProperty: postApplyAfterProperty
};
global.Aabacus = global.Aabacus || {};
Object.assign(global.Aabacus.props = global.Aabacus.props || {}, api);
Object.assign(global, api);//alias globali di compatibilità

})(window);
