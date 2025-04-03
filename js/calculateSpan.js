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
		$secondMember = $startENODE[0].ENODE_getRoles('.secondMember');
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
		$secondMember = $startENODE[0].ENODE_getRoles('.secondMember');
		$stepStoneORtarget = $stepStoneORtarget.add($secondMember);
	}
	return $stepStoneORtarget
}

function $ImmediateAssociativeENODE($starAssociativeOperation) {
	//test: $ImmediateAssociativeENODE($('.selected')) selected should be associative operation
	let op = $starAssociativeOperation.attr("data-enode");
	let $result = $();
	//upstream if it's same operation
	let $parent = ENODEparent($starAssociativeOperation)
	if ($parent.attr("data-enode") === op) {
		$result = $result.add($parent);
	} ENODEparent($starAssociativeOperation).filter('[data-enode=' + op + ']');
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
 * Determines the scope (span) of a given identifier by searching upwards in the DOM tree.
 * It looks for the closest ancestor element representing a 'forAll' quantifier
 * that declares the identifier as a bound variable (Bvar) in its header.
 *
 * @param {jQuery} $identifier - The jQuery object representing the identifier element.
 * @returns {jQuery} The closest ancestor 'forAll' element that binds the identifier,
 *                   or the element with ID 'canvasAnd' if no such binding ancestor is found (representing the global scope).
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


function $findOccurrences($wanted, $span, $candidates) {
	// example use:
	// $findOccurrences($identifier,$identifierSpanForAll($identifier))
	if (!$candidates) {
		if (!$span) {
			$span = $identifierSpanForAll($wanted);
		}
		$candidates = $span.find("[data-enode]")
	}
	//todo: questa ricerca non distingue le variabili interne "Bvar".
	// Ad esempio     x+1= integrale( x^2 in dx)   x compare sia a destra che a sinistra ma non è la stessa variabile
	let $occurrences = $candidates.filter(function () {
		//return ENODEEqual($ENODE_param[0],this)
		return compareExtENODE($wanted, $(this), true, false);
	});
	return $occurrences
}


function $calculateJurisdictionUpstream($startRole) {
	// .addClass('mu_Downstream1').filter('[data-enode]:visible')
	return $RecursiveTreeExplorerCriterium($startRole, $immediateJurisdictionRoleUpstream)
}


function $PropositionsAffectedByStartPropositionROLES($startProposition) {
	//test: $PropositionsAffectedByStartPropositionROLES($('.selected')).each(function(){ENODEparent($(this)).addClass('selected')});
	let $roles = $RolesAffectedByStartPropositionROLES($startProposition)
	//from roles to targets:
	return $targets = $roles.map(function () {
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
		if ((startENODE_op == 'implies') && $role)
			$startRole = $propositionParent[0].ENODE_getRoles('.secondMember');
	}
	if ($startRole) {
		//propagate all Roles excluding start Node //note: apply to yourself?
		$roles = $RecursiveTreeExplorerCriteriumROLES($startRole, $immediateJurisdictionRolesNEW, $excludedRoles)
		$roles = $roles.add($startRole);
	}
	return $roles
}

function $calculateTargetsAddRedundantROLES($startProposition) {
	//test: $validAddRedundantROLES($('.selected')).each(function(){ENODEparent($(this)).addClass('selected')});
	//propagate all Roles excluding start ENODE //note: apply to yourself?
	let $roles = $RolesAffectedByStartPropositionROLES($startProposition)
	//from roles to targets:
	// two types of boolean roles exist:1) those with TRUE as neutral elements 2) OTHERS
	// OR belongs to the second group!!!
	return $targets = $roles.map(function () {
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