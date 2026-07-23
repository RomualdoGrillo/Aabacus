function $immediateJurisdictionRoleUpstream($role) {
	let $startENODE = ENODEparent($role)
	let $result = $()
	//upstream if it's ans AND
	if ($startENODE.is('[data-enode=and]')) {
		$result = $result.add($startENODE.parent())
	}
	return $result
}

function $immediateJurisdictionRolesNEW($role) {
	//excluded is used to avoid exploring into startProposition when looking for for consequences of such proposition
	let $startENODE = ENODEparent($role)
	let startENODE_op = $startENODE.attr("data-enode");
	let $immediateDiscendence = $()
	let $parentENODE = ENODEparent($startENODE);
	//-immediate propagate roles, excluding start node
	//-upstream: And
	if ($parentENODE.is('[data-enode=and]')) {
		$immediateDiscendence = $immediateDiscendence.add($parentENODE[0].ENODE_getRoles())
	}
	//-sameLevel: implies firstMember to secondMember
	if ((startENODE_op == 'implies') && $role.hasClass('firstMember')) {
		let $secondMember = $startENODE[0].ENODE_getRoles('.secondMember');
		$immediateDiscendence = $immediateDiscendence.add($secondMember);
	}
	//-downstream: all boolean roles
	let $children = $role.children('[data-enode]');
	$children.each(function () {
		$immediateDiscendence = $immediateDiscendence.add(this.ENODE_getRoles('[data-type=bool]'))//add roles
		//let op = $(this).attr("data-enode");
		//if( op == 'and' || op == 'or' || op == 'implies'){
		//	$immediateDiscendence = $immediateDiscendence.add(this.ENODE_getRoles()[0])//add roles
		//}
		//else if(op == 'forAll'){
		//	$immediateDiscendence = $immediateDiscendence.add(this.ENODE_getRoles('.forAllContent')[0])//add roles
		//}
	})
	return $immediateDiscendence
}





function $immediateJurisdictionRolesForAddRedundant($role) {
	//excluded is used to avoid exploring into startProposition when looking for for consequences of such proposition
	if ($role.is('[data-enode]')) {
		return $() // Target ENODEs are just proxy for underlyng role.
		//recursive exploration happens jumping fron role to upstream and downstrem role.
	}
	let $startENODE = ENODEparent($role)
	let startNode_op = $startENODE.attr("data-enode");
	let $stepStoneORtarget = $()
	let $children = $role.children('[data-enode]');
	if (startNode_op == 'and') {
		//upstream if it's an AND
		if (ENODEparent($startENODE).is('[data-enode=and]')) {
			$stepStoneORtarget = $stepStoneORtarget.add($startENODE.parent())
		}
	}//downstream
	$stepStoneORtarget = $stepStoneORtarget.add($children);
	$children.each(function () {
		let op = $(this).attr("data-enode");
		if (op == 'and' || op == 'or' || op == 'implies') {
			$stepStoneORtarget = $stepStoneORtarget.add(this.ENODE_getRoles()[0])//add roles
		}
		else if (op == 'forAll') {
			$stepStoneORtarget = $stepStoneORtarget.add(this.ENODE_getRoles('.forAllContent')[0])//add roles
		}
		//else if(op == 'not'){ this is a target for DeMorgan}
	})
	//downstream implies firstMember
	if ((startNode_op == 'implies') && $role.hasClass('firstMember')) {
		let $secondMember = $startENODE[0].ENODE_getRoles('.secondMember');
		$stepStoneORtarget = $stepStoneORtarget.add($secondMember);
	}
	return $stepStoneORtarget
}

/**
 * Trova gli ENODE adiacenti (cluster associativo immediato) con la stessa
 * operazione del nodo di partenza: il genitore, se è la stessa operazione,
 * e i figli diretti con lo stesso data-enode.
 * @param {JQuery} $starAssociativeOperation - ENODE di partenza; deve essere un'operazione associativa.
 * @returns {JQuery} Gli ENODE (genitore e/o figli) con la stessa operazione, eventualmente vuoto.
 * @example $ImmediateAssociativeENODE($('.selected')) // il selezionato deve essere un'operazione associativa
 */
function $ImmediateAssociativeENODE($starAssociativeOperation) {
	//test: $ImmediateAssociativeENODE($('.selected')) selected should be associative operation
	let op = $starAssociativeOperation.attr("data-enode");
	let $result = $();
	//upstream if it's same operation
	let $parent = ENODEparent($starAssociativeOperation)
	if ($parent.length && $parent.attr("data-enode") === op) {
		$result = $result.add($parent);
	}
	//downstream same operation
	let ENODEchildren = $starAssociativeOperation[0].ENODE_getChildren();
	ENODEchildren.each(function (i, e) {
		if ($(e).attr("data-enode") === op) {
			//$result = $result.add(e.ENODE_getRoles());
			$result = $result.add($(e));
		}
	});
	return $result
}

function $PropositionUpstreamRec($startENODE, $outerRoleLimit) {
	//testing
	//$PropositionUpstreamRec($('.selected')).each(function(){ENODEparent($(this)).addClass('selected')});

	let op = $startENODE.attr("data-enode");
	let $validRoles = $()
	let $parentRoles = $startENODE.parents('[class*="_role"]');
	if ($outerRoleLimit) {
		let index = $parentRoles.index($outerRoleLimit);
		if (index != -1) {
			$parentRoles = $parentRoles.slice(0, index);
		}
	}
	$validRoles = $parentRoles.map(function () {
		if (this.matches('[data-enode=implies]>.s_role:nth-child(2)')) {
			return ENODEparent($(this))[0].ENODE_getRoles()[0]//return the first role of the implies  	
		}
		else if (this.matches('[data-enode=and]>.ul_role')) {
			let $roles = $AssRolesRec(undefined, false, $(this)).add($(this))
			return $roles.toArray()
		}
		else { return null }
	})
	return $validRoles

}

function $AssRolesRec($startENODE, immediate, $startRole) {
	//testing
	//$AssRolesRec($('.selected')).each(function(){ENODEparent($(this)).addClass('selected')})
	if (!$startRole) {
		$startRole = $startENODE.parent();
	}
	let $ParentENODE = ENODEparent($startENODE);
	let op = $ParentENODE.attr("data-enode");
	let $validRoles = $()
	if (OpIsAssociative(op)) {
		if (immediate) {
			$validRoles = $SameOpInOut($startRole)
		}
		else {//
			$validRoles = $RecursiveTreeExplorerCriterium($startRole, $SameOpInOut);
		}
	}
	return $validRoles
}
function $RecursiveTreeExplorerCriteriumROLES($startRole, selectionStringOrFunction, $exploredAlreadyROLES) {
	//test:  $RecursiveTreeExplorerCriterium($('.selected'),'[data-enode]')  
	//criterium:selector string or function() return items at distace 1 from $startRole and fitered with some criteria  
	//futuribile
	//safeMode:false fast search structure is acyclic criterium excludes start node adds elements one step away
	//        :true safe structure can be cyclic 
	//currentResults are passed via $exploredAlreadyROLES
	let selectionFunction
	if (typeof (selectionStringOrFunction) == "string") {
		selectionFunction = function ($startRole) { return $startRole.find(selectionStringOrFunction) }
	}
	else {
		selectionFunction = selectionStringOrFunction
	}
	if (!$exploredAlreadyROLES) { $exploredAlreadyROLES = $() }
	$exploredAlreadyROLES = $exploredAlreadyROLES.add($startRole)
	let $immediateDiscendence = selectionFunction($startRole).not($exploredAlreadyROLES);
	let i = 0
	$exploredAlreadyROLES = $exploredAlreadyROLES.add($immediateDiscendence)
	let $discendence = $immediateDiscendence;
	while ($immediateDiscendence[i]) {
		//lineAB($startRole,$immediateDiscendence.eq(i))
		//---recursive
		$discendence = $discendence.add($RecursiveTreeExplorerCriteriumROLES($immediateDiscendence.eq(i), selectionFunction, $exploredAlreadyROLES));
		i++
	}
	return $discendence
}

/**
 * Esploratore ricorsivo generico: a partire da $startNode applica il criterio
 * per ottenere gli elementi a distanza 1, poi ricorre su ciascuno di essi
 * accumulando i risultati; gli elementi già visitati non vengono riesplorati
 * (sicuro anche su strutture cicliche).
 * @param {JQuery} $startNode - Elemento di partenza dell'esplorazione (escluso dal risultato).
 * @param {string|function(JQuery): JQuery} selectionStringOrFunction - Criterio: selettore (usato con .find) oppure funzione che dato un elemento restituisce gli elementi a distanza 1 già filtrati.
 * @param {JQuery} [$exploredAlready] - Elementi già visitati; usato internamente dalle chiamate ricorsive, i chiamanti di norma lo omettono.
 * @returns {JQuery} Tutta la discendenza raggiunta secondo il criterio.
 * @example $RecursiveTreeExplorerCriterium($('.selected'), '[data-enode]')
 */
function $RecursiveTreeExplorerCriterium($startNode, selectionStringOrFunction, $exploredAlready) {
	//test:  $RecursiveTreeExplorerCriterium($('.selected'),'[data-enode]')  
	//criterium:selector string or function() return items at distace 1 from $startNode and fitered with some criteria  
	//futuribile
	//safeMode:false fast search structure is acyclic criterium excludes start node adds elements one step away
	//        :true safe structure can be cyclic 
	//currentResults are passed via $exploredAlready
	let selectionFunction
	if (typeof (selectionStringOrFunction) == "string") {
		selectionFunction = function ($startNode) { return $startNode.find(selectionStringOrFunction) }
	}
	else {
		selectionFunction = selectionStringOrFunction
	}
	if (!$exploredAlready) { $exploredAlready = $() }
	$exploredAlready = $exploredAlready.add($startNode)
	let $immediateDiscendence = selectionFunction($startNode).not($exploredAlready);
	let i = 0
	$exploredAlready = $exploredAlready.add($immediateDiscendence)
	let $discendence = $immediateDiscendence;
	while ($immediateDiscendence[i]) {
		//lineAB($startNode,$immediateDiscendence.eq(i))
		//---recursive
		$discendence = $discendence.add($RecursiveTreeExplorerCriterium($immediateDiscendence.eq(i), selectionFunction, $exploredAlready));
		i++
	}
	return $discendence
}
/*
function $ENODEChildren($startNode){
	return $startNode.find('>*>[data-enode]')
}
*/
function $SameOpInOut($startRole) {
	let $startENODE = ENODEparent($startRole);
	let op = $startENODE.attr("data-enode");
	let $validRoles = $startRole.find('>[data-enode=' + op + ']>.ul_role');
	let $parentENODE = ENODEparent($startENODE);
	if ($parentENODE.attr("data-enode") == op) {//parent
		$validRoles = $validRoles.add($parentENODE[0].ENODE_getRoles())//children
	}
	return $validRoles
}

/**
 * Determina il campo di validità (span) di un identificatore risalendo l'albero DOM:
 * cerca l'antenato 'forAll' più vicino che dichiara l'identificatore come
 * variabile legata (Bvar) nel proprio header (verifica via parameterInHeader).
 *
 * @param {JQuery} $identifier - L'elemento identificatore (ci) di cui determinare lo span.
 * @returns {JQuery} L'antenato 'forAll' più vicino che lega l'identificatore,
 *                   oppure l'elemento #canvasAnd (scope globale) se nessun antenato lo lega.
 */
function $identifierSpanForAll($identifier) {
	// Determina il campo di validità dell'identificatore
	// Risali fino a trovare un container ('forAll') che può avere Bvar (Bound Variables)
	// Controlla se l'identifier è tra quelle bvar nel header del container.

	// Get all ancestor elements marked as 'forAll' quantifiers, ordered from closest to furthest.
	// TODO: Consider other parent node types that can contain Bound Variables (Bvar), not just 'forAll'.
	const $potentialScopes = $identifier.parents('[data-enode=forAll]');

	// Iterate through the potential scopes, starting from the closest one.
	for (let i = 0; i < $potentialScopes.length; i++) {
		const $currentScope = $($potentialScopes[i]);
		// Check if the identifier is declared as a parameter within the header of this scope.
		if (parameterInHeader($identifier, $currentScope)) {
			// Found the innermost scope that binds the identifier.
			return $currentScope;
		}
	}

	// If no specific binding scope ('forAll') was found among the ancestors,
	// assume the identifier's scope is the entire canvas (global scope).
	return $('#canvasAnd');
}

/**
 * Evidenzia lo span e le occorrenze visibili di un identificatore: aggiunge la
 * classe 'mu_span' allo span (a meno che non sia l'intero canvas #canvasAnd)
 * e la classe indicata alle occorrenze trovate con $findOccurrences.
 * @param {JQuery} $identifier - L'identificatore di cui evidenziare span e occorrenze.
 * @param {string} addClass - Classe CSS da aggiungere alle occorrenze visibili.
 */
function highlightOccurrences($identifier, addClass) {
	//evidenzia lo span e le occorrenze dell'identificatore
	let $span = $identifierSpanForAll($identifier);
	$span.not('#canvasAnd').addClass('mu_span')//highlight span unless it's the whole canvas
	let $occurrences = $findOccurrences($identifier, undefined).filter(':visible');
	$occurrences.addClass(addClass);
	/*$occurrences.each(function(){
		// crea linee
		lineAB($(this),$identifier,addClass)	
	})*/
}

/**
 * Cerca le occorrenze di un ENODE tra i candidati: confronta ogni candidato con
 * $wanted usando ENODEEqual (uguaglianza strutturale) oppure, se asParameter è
 * true, compareExtENODE (confronto shallow per data-type). Nota (todo nel codice):
 * la ricerca non distingue le variabili interne legate (Bvar) omonime.
 * @param {JQuery} $wanted - L'ENODE di cui cercare le occorrenze.
 * @param {JQuery} [$span] - Ambito di ricerca; se omesso (e senza $candidates) viene calcolato con $identifierSpanForAll($wanted).
 * @param {JQuery} [$candidates] - Candidati espliciti; se omesso si usano tutti i [data-enode] dentro $span.
 * @param {boolean} [asParameter] - Se true confronta come parametro (compareExtENODE con solo data-type) anziché con ENODEEqual.
 * @returns {JQuery} I candidati che risultano occorrenze di $wanted.
 * @example $findOccurrences($identifier, $forAll, undefined, true)
 */
function $findOccurrences($wanted, $span, $candidates,asParameter) {
	if (!$candidates) {
		if (!$span) {
			$span = $identifierSpanForAll($wanted);
		}
		$candidates = $span.find("[data-enode]")
	}
	//todo: questa ricerca non distingue le variabili interne "Bvar".
	// Ad esempio     x+1= integrale( x^2 in dx)   x compare sia a destra che a sinistra ma non è la stessa variabile
	let $occurrences = $candidates.filter(function () {
		if(asParameter){return compareExtENODE($wanted, $(this), true, false);}
		else{return ENODEEqual($wanted[0],this)}
	});
	return $occurrences
}


/**
 * Calcola la giurisdizione logica verso l'alto di un role: esplora
 * ricorsivamente gli antenati risalendo solo attraverso i nodi 'and'
 * (criterio $immediateJurisdictionRoleUpstream).
 * @param {JQuery} $startRole - Il role di partenza.
 * @returns {JQuery} I role/contenitori raggiunti risalendo attraverso gli 'and'.
 */
function $calculateJurisdictionUpstream($startRole) {
	// .addClass('mu_Downstream').filter('[data-enode]:visible')
	return $RecursiveTreeExplorerCriterium($startRole, $immediateJurisdictionRoleUpstream)
}


/**
 * Trova le proposizioni (ENODE) contenute nei role raggiunti dalla propagazione
 * logica della proposizione di partenza (attraverso 'and' e 'implies', via
 * $RolesAffectedByStartPropositionROLES), escludendo gli 'and' stessi.
 * @param {JQuery} $startProposition - La proposizione (ENODE) di partenza.
 * @returns {JQuery} Gli ENODE figli dei role raggiunti, esclusi quelli [data-enode=and].
 * @example $PropositionsAffectedByStartPropositionROLES($('.selected')).each(function(){ENODEparent($(this)).addClass('selected')});
 */
function $PropositionsAffectedByStartPropositionROLES($startProposition) {
	//test: $PropositionsAffectedByStartPropositionROLES($('.selected')).each(function(){ENODEparent($(this)).addClass('selected')});
	let $roles = $RolesAffectedByStartPropositionROLES($startProposition)
	//from roles to targets:
	return $roles.map(function () {
		return $(this).children('[data-enode]').not('[data-enode=and]').toArray()
	})
}

function $RolesAffectedByStartPropositionROLES($startProposition) {
	//test: $RolesAffectedByStartPropositionROLES($('.selected')).each(function(){ENODEparent($(this)).addClass('selected')});
	//if startENODE parent is AND or imply, get starting role from start node:  
	let $propositionParent = ENODEparent($startProposition)
	let propParentOp = $propositionParent.attr('data-enode')
	let $startRole
	let $excludedRoles = $startProposition[0].ENODE_getRoles();
	let $roles = $()
	if (propParentOp == 'and') {
		$startRole = $startProposition.parent()
	}
	else if (propParentOp == 'implies' && $startProposition.hasClass('firstMember')) {
		$startRole = $propositionParent[0].ENODE_getRoles('.secondMember');
	}
	if ($startRole) {
		//propagate all Roles excluding start Node //note: apply to yourself?
		$roles = $RecursiveTreeExplorerCriteriumROLES($startRole, $immediateJurisdictionRolesNEW, $excludedRoles)
		$roles = $roles.add($startRole);
	}
	return $roles
}

/**
 * Calcola i target validi per la proprietà "add redundant": parte dai role
 * raggiunti dalla propagazione logica della proposizione e li rimappa secondo
 * il tipo di role booleano (i role 'or' e i role pieni vengono sostituiti
 * dagli ENODE contenuti non-'and'; i role vuoti e i role di 'and' restano target).
 * @param {JQuery} $startProposition - La proposizione (ENODE) di partenza.
 * @returns {JQuery} I target validi (role oppure ENODE contenuti, a seconda del caso).
 * @example $calculateTargetsAddRedundantROLES($('.selected')).each(function(){ENODEparent($(this)).addClass('selected')});
 */
function $calculateTargetsAddRedundantROLES($startProposition) {
	//test: $validAddRedundantROLES($('.selected')).each(function(){ENODEparent($(this)).addClass('selected')});
	//propagate all Roles excluding start ENODE //note: apply to yourself?
	let $roles = $RolesAffectedByStartPropositionROLES($startProposition)
	//from roles to targets:
	// two types of boolean roles exist:1) those with TRUE as neutral elements 2) OTHERS
	// OR belongs to the second group!!!
	return $roles.map(function () {
		let op = ENODEparent($(this)).attr("data-enode");
		if (op == 'or') {
			//---OR roles are replaced with contained ENODEs if they are not ANDs.
			//---OR empty roles are removed
			return $(this).children('[data-enode]').not('[data-enode=and]').toArray()
		}
		else if (!isTherePlaceForAnother($(this))) {
			//---full boolean roles are replaced with contained ENODE if it's not an AND.
			return $(this).children('[data-enode]').not('[data-enode=and]')[0]
		}
		else {
			//---empty boolean roles are targets
			//---AND roles are targets
			return this
		}
	})
}