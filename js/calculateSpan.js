function $immediateJurisdictionRoleUpstream($role) {
	let $startAtom = exprNodeparent($role)
	let $result = $()
	//upstream if it's ans AND
	if ($startAtom.is('[data-atom=and]')) {
		$result = $result.add($startAtom.parent())
	}
	return $result
}

function $immediateJurisdictionRolesNEW($role) {
	//excluded is used to avoid exploring into startProposition when looking for for consequences of such proposition
	let $startAtom = exprNodeparent($role)
	let startAtom_op = $startAtom.attr("data-atom");
	let $immediateDiscendence = $()
	let $parentAtom = exprNodeparent($startAtom);
	//-immediate propagate roles, excluding start node
	//-upstream: And
	if ($parentAtom.is('[data-atom=and]')) {
		$immediateDiscendence = $immediateDiscendence.add($parentAtom[0].exprNode_getRoles())
	}
	//-sameLevel: implies firstMember to secondMember
	if ((startAtom_op == 'implies') && $role.hasClass('firstMember')) {
		$secondMember = $startAtom[0].exprNode_getRoles('.secondMember');
		$immediateDiscendence = $immediateDiscendence.add($secondMember);
	}
	//-downstream: all boolean roles
	let $children = $role.children('[data-atom]');
	$children.each(function () {
		$immediateDiscendence = $immediateDiscendence.add(this.exprNode_getRoles('[data-type=bool]'))//add roles
		//let op = $(this).attr("data-atom");
		//if( op == 'and' || op == 'or' || op == 'implies'){
		//	$immediateDiscendence = $immediateDiscendence.add(this.exprNode_getRoles()[0])//add roles
		//}
		//else if(op == 'forAll'){
		//	$immediateDiscendence = $immediateDiscendence.add(this.exprNode_getRoles('.forAllContent')[0])//add roles
		//}
	})
	return $immediateDiscendence
}





function $immediateJurisdictionRolesForAddRedundant($role) {
	//excluded is used to avoid exploring into startProposition when looking for for consequences of such proposition
	if ($role.is('[data-atom]')) {
		return $() // Target atoms are just proxy for underlyng role.
		//recursive exploration happens jumping fron role to upstream and downstrem role.
	}
	let $startAtom = exprNodeparent($role)
	let startNode_op = $startAtom.attr("data-atom");
	let $stepStoneORtarget = $()
	let $children = $role.children('[data-atom]');
	if (startNode_op == 'and') {
		//upstream if it's an AND
		if (exprNodeparent($startAtom).is('[data-atom=and]')) {
			$stepStoneORtarget = $stepStoneORtarget.add($startAtom.parent())
		}
	}//downstream
	$stepStoneORtarget = $stepStoneORtarget.add($children);
	$children.each(function () {
		let op = $(this).attr("data-atom");
		if (op == 'and' || op == 'or' || op == 'implies') {
			$stepStoneORtarget = $stepStoneORtarget.add(this.exprNode_getRoles()[0])//add roles
		}
		else if (op == 'forAll') {
			$stepStoneORtarget = $stepStoneORtarget.add(this.exprNode_getRoles('.forAllContent')[0])//add roles
		}
		//else if(op == 'not'){ this is a target for DeMorgan}
	})
	//downstream implies firstMember
	if ((startNode_op == 'implies') && $role.hasClass('firstMember')) {
		$secondMember = $startAtom[0].exprNode_getRoles('.secondMember');
		$stepStoneORtarget = $stepStoneORtarget.add($secondMember);
	}
	return $stepStoneORtarget
}

function $ImmediateAssociativeAtom($starAssociativeOperation) {
	//test: $ImmediateAssociativeAtom($('.selected')) selected should be associative operation
	let op = $starAssociativeOperation.attr("data-atom");
	let $result = $();
	//upstream if it's same operation
	let $parent = exprNodeparent($starAssociativeOperation)
	if ($parent.attr("data-atom") === op) {
		$result = $result.add($parent);
	} exprNodeparent($starAssociativeOperation).filter('[data-atom=' + op + ']');
	//downstream same operation
	let exprNodechildren = $starAssociativeOperation[0].exprNode_getChildren();
	exprNodechildren.each(function (i, e) {
		if ($(e).attr("data-atom") === op) {
			//$result = $result.add(e.exprNode_getRoles());
			$result = $result.add($(e));
		}
	});
	return $result
}

function $PropositionUpstreamRec($startAtom, $outerRoleLimit) {
	//testing
	//$PropositionUpstreamRec($('.selected')).each(function(){exprNodeparent($(this)).addClass('selected')});

	let op = $startAtom.attr("data-atom");
	let $validRoles = $()
	let $parentRoles = $startAtom.parents('[class*="_role"]');
	if ($outerRoleLimit) {
		let index = $parentRoles.index($outerRoleLimit);
		if (index != -1) {
			$parentRoles = $parentRoles.slice(0, index);
		}
	}
	$validRoles = $parentRoles.map(function () {
		if (this.matches('[data-atom=implies]>.s_role:nth-child(2)')) {
			return exprNodeparent($(this))[0].exprNode_getRoles()[0]//return the first role of the implies  	
		}
		else if (this.matches('[data-atom=and]>.ul_role')) {
			let $roles = $AssRolesRec(undefined, false, $(this)).add($(this))
			return $roles.toArray()
		}
		else { return null }
	})
	return $validRoles

}

function $AssRolesRec($startAtom, immediate, $startRole) {
	//testing
	//$AssRolesRec($('.selected')).each(function(){exprNodeparent($(this)).addClass('selected')})
	if (!$startRole) {
		$startRole = $startAtom.parent();
	}
	let $ParentAtom = exprNodeparent($startAtom);
	let op = $ParentAtom.attr("data-atom");
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
	//test:  $RecursiveTreeExplorerCriterium($('.selected'),'[data-atom]')  
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
	//test:  $RecursiveTreeExplorerCriterium($('.selected'),'[data-atom]')  
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
function $AtomChildren($startNode){
	return $startNode.find('>*>[data-atom]')
}
*/
function $SameOpInOut($startRole) {
	let $startAtom = exprNodeparent($startRole);
	let op = $startAtom.attr("data-atom");
	let $validRoles = $startRole.find('>[data-atom=' + op + ']>.ul_role');
	let $parentexprNode = exprNodeparent($startAtom);
	if ($parentexprNode.attr("data-atom") == op) {//parent
		$validRoles = $validRoles.add($parentexprNode[0].exprNode_getRoles())//children
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
	const $potentialScopes = $identifier.parents('[data-atom=forAll]');

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
		$candidates = $span.find("[data-atom]")
	}
	//todo: questa ricerca non distingue le variabili interne "Bvar".
	// Ad esempio     x+1= integrale( x^2 in dx)   x compare sia a destra che a sinistra ma non è la stessa variabile
	let $occurrences = $candidates.filter(function () {
		//return exprNodeEqual($atom_param[0],this)
		return compareExtexprNode($wanted, $(this), true, false);
	});
	return $occurrences
}


function $calculateJurisdictionUpstream($startRole) {
	// .addClass('mu_Downstream1').filter('[data-atom]:visible')
	return $RecursiveTreeExplorerCriterium($startRole, $immediateJurisdictionRoleUpstream)
}


function $PropositionsAffectedByStartPropositionROLES($startProposition) {
	//test: $PropositionsAffectedByStartPropositionROLES($('.selected')).each(function(){exprNodeparent($(this)).addClass('selected')});
	let $roles = $RolesAffectedByStartPropositionROLES($startProposition)
	//from roles to targets:
	return $targets = $roles.map(function () {
		return $(this).children('[data-atom]').not('[data-atom=and]').toArray()
	})
}

function $RolesAffectedByStartPropositionROLES($startProposition) {
	//test: $RolesAffectedByStartPropositionROLES($('.selected')).each(function(){exprNodeparent($(this)).addClass('selected')});
	//if startAtom parent is AND or imply, get starting role from start node:  
	let $propositionParent = exprNodeparent($startProposition)
	let propParentOp = $propositionParent.attr('data-atom')
	let $startRole
	let $excludedRoles = $startProposition[0].exprNode_getRoles();
	let $roles = $()
	if (propParentOp == 'and') {
		$startRole = $startProposition.parent()
	}
	else if (propParentOp == 'implies' && $startProposition.hasClass('firstMember')) {
		if ((startAtom_op == 'implies') && $role)
			$startRole = $propositionParent[0].exprNode_getRoles('.secondMember');
	}
	if ($startRole) {
		//propagate all Roles excluding start Node //note: apply to yourself?
		$roles = $RecursiveTreeExplorerCriteriumROLES($startRole, $immediateJurisdictionRolesNEW, $excludedRoles)
		$roles = $roles.add($startRole);
	}
	return $roles
}

function $calculateTargetsAddRedundantROLES($startProposition) {
	//test: $validAddRedundantROLES($('.selected')).each(function(){exprNodeparent($(this)).addClass('selected')});
	//propagate all Roles excluding start Atom //note: apply to yourself?
	let $roles = $RolesAffectedByStartPropositionROLES($startProposition)
	//from roles to targets:
	// two types of boolean roles exist:1) those with TRUE as neutral elements 2) OTHERS
	// OR belongs to the second group!!!
	return $targets = $roles.map(function () {
		let op = exprNodeparent($(this)).attr("data-atom");
		if (op == 'or') {
			//---OR roles are replaced with contained atoms if they are not ANDs.
			//---OR empty roles are removed
			return $(this).children('[data-atom]').not('[data-atom=and]').toArray()
		}
		else if (!isTherePlaceForAnother($(this))) {
			//---full boolean roles are replaced with contained atom if it's not an AND.
			return $(this).children('[data-atom]').not('[data-atom=and]')[0]
		}
		else {
			//---empty boolean roles are targets
			//---AND roles are targets
			return this
		}
	})
}