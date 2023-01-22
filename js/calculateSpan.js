
function $immediateJurisdictionRoleUpstream($role) {
	let $startAtom = MNODEparent($role)
	let $result = $()
	//upstream if it's ans AND
	if ($startAtom.is('[data-atom=and]')) {
		$result = $result.add($startAtom.parent())
	}
	return $result
}

function $immediateJurisdictionRolesNEW($role) {
	//excluded is used to avoid exploring into startProposition when looking for for consequences of such proposition
	let $startAtom = MNODEparent($role)
	let startAtom_op = $startAtom.attr("data-atom");
	let $immediateDiscendence = $()
	let $parentAtom = MNODEparent($startAtom);
	//-immediate propagate roles, excluding start node
	//-upstream: And
	if ($parentAtom.is('[data-atom=and]')) {
		$immediateDiscendence = $immediateDiscendence.add($parentAtom[0].MNODE_getRoles())
	}
	//-sameLevel: implies firstMember to secondMember
	if ((startAtom_op == 'implies') && $role.hasClass('firstMember')) {
		$secondMember = $startAtom[0].MNODE_getRoles('.secondMember');
		$immediateDiscendence = $immediateDiscendence.add($secondMember);
	}
	//-downstream: all boolean roles
	let $children = $role.children('[data-atom]');
	$children.each(function () {
		$immediateDiscendence = $immediateDiscendence.add(this.MNODE_getRoles('[data-type=bool]'))//add roles
		//let op = $(this).attr("data-atom");
		//if( op == 'and' || op == 'or' || op == 'implies'){
		//	$immediateDiscendence = $immediateDiscendence.add(this.MNODE_getRoles()[0])//add roles
		//}
		//else if(op == 'forAll'){
		//	$immediateDiscendence = $immediateDiscendence.add(this.MNODE_getRoles('.forAllContent')[0])//add roles
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
	let $startAtom = MNODEparent($role)
	let startNode_op = $startAtom.attr("data-atom");
	let $stepStoneORtarget = $()
	let $children = $role.children('[data-atom]');
	if (startNode_op == 'and') {
		//upstream if it's an AND
		if (MNODEparent($startAtom).is('[data-atom=and]')) {
			$stepStoneORtarget = $stepStoneORtarget.add($startAtom.parent())
		}
	}//downstream
	$stepStoneORtarget = $stepStoneORtarget.add($children);
	$children.each(function () {
		let op = $(this).attr("data-atom");
		if (op == 'and' || op == 'or' || op == 'implies') {
			$stepStoneORtarget = $stepStoneORtarget.add(this.MNODE_getRoles()[0])//add roles
		}
		else if (op == 'forAll') {
			$stepStoneORtarget = $stepStoneORtarget.add(this.MNODE_getRoles('.forAllContent')[0])//add roles
		}
		//else if(op == 'not'){ this is a target for DeMorgan}
	})
	//downstream implies firstMember
	if ((startNode_op == 'implies') && $role.hasClass('firstMember')) {
		$secondMember = $startAtom[0].MNODE_getRoles('.secondMember');
		$stepStoneORtarget = $stepStoneORtarget.add($secondMember);
	}
	return $stepStoneORtarget
}

function $ImmediateAssociativeAtom($starAssociativeOperation) {
	//test: $ImmediateAssociativeAtom($('.selected')) selected should be associative operation
	let op = $starAssociativeOperation.attr("data-atom");
	let $result = $();
	//upstream if it's same operation
	let $parent = MNODEparent($starAssociativeOperation)
	if ($parent.attr("data-atom") === op) {
		$result = $result.add($parent);
	} MNODEparent($starAssociativeOperation).filter('[data-atom=' + op + ']');
	//downstream same operation
	let MNODEchildren = $starAssociativeOperation[0].MNODE_getChildren();
	MNODEchildren.each(function (i, e) {
		if ($(e).attr("data-atom") === op) {
			//$result = $result.add(e.MNODE_getRoles());
			$result = $result.add($(e));
		}
	});
	return $result
}

function $PropositionUpstreamRec($startAtom, $outerRoleLimit) {
	//testing
	//$PropositionUpstreamRec($('.selected')).each(function(){MNODEparent($(this)).addClass('selected')});

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
			return MNODEparent($(this))[0].MNODE_getRoles()[0]//return the first role of the implies  	
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
	//$AssRolesRec($('.selected')).each(function(){MNODEparent($(this)).addClass('selected')})
	if (!$startRole) {
		$startRole = $startAtom.parent();
	}
	let $ParentAtom = MNODEparent($startAtom);
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
	let $startAtom = MNODEparent($startRole);
	let op = $startAtom.attr("data-atom");
	let $validRoles = $startRole.find('>[data-atom=' + op + ']>.ul_role');
	let $parentMNODE = MNODEparent($startAtom);
	if ($parentMNODE.attr("data-atom") == op) {//parent
		$validRoles = $validRoles.add($parentMNODE[0].MNODE_getRoles())//children
	}
	return $validRoles
}

function $identifierSpanForAll($identifier) {
	//determina il campo di validità dell'identificatore
	//risali fino a trovare un container che può avere Bvar 
	//controlla se l'identifier è tra quelle bvar
	var $containingForAlls = $identifier.parents('[data-atom=forAll]');
	//todo: andrebbero considrati tutti i parents che contengono Bvar, non solo i forAll
	var i = 0
	while ($containingForAlls[i]) {
		if (parameterInHeader($identifier, $($containingForAlls[i]))) {
			// l'$identifier si trova tra i paramettri del forall
			return $($containingForAlls[i])
		}
		i++
	}
	return $('#canvasAnd'); //se non hai trovato nulla, lo span è l'intera canvas
}

function highlightOccurrences($identifier, addClass) {
	//evidenzia lo span e le occorrenze dell'identificatore
	let $span = $identifierSpanForAll($identifier);
	$span.not('#canvasAnd').addClass('mu_span')//highlight span unless it's the whole canvas
	let $occurrences = $findOccurrences($identifier, undefined, true)
	$occurrences.addClass(addClass);
	/*$occurrences.each(function(){
		// crea linee
		lineAB($(this),$identifier,addClass)	
	})*/
}

// example use:
// $findOccurrences($identifier,$identifierSpanForAll($identifier))
function $findOccurrences($wanted, $span, excludeHidden) {
	if (!$span) { $span = $identifierSpanForAll($wanted); }
	//todo: questa ricerca non distingue le variabili interne "Bvar".
	// Ad esempio     x+1= integrale( x^2 in dx)   x compare sia a destra che a sinistra ma non è la stessa variabile
	let $candidates
	if (excludeHidden) {
		$candidates = $span.find("[data-atom]:visible")
	}
	else {//default
		$candidates = $span.find("[data-atom]")
	}
	let $occurrences = $candidates.filter(function () {
		//return MNODEEqual($atom_param[0],this)
		return compareExtMNODE($wanted, $(this), true, false);
	});
	return $occurrences
}


function $calculateJurisdictionUpstream($startRole) {
	// .addClass('mu_Downstream1').filter('[data-atom]:visible')
	return $RecursiveTreeExplorerCriterium($startRole, $immediateJurisdictionRoleUpstream)
}


function $PropositionsAffectedByStartProposition($startProposition) {
	let $propositionParent = MNODEparent($startProposition)
	let propParentOp = $propositionParent.attr('data-atom')
	let $excludedRoles = $startProposition[0].MNODE_getRoles();
	if (propParentOp == 'and' || propParentOp == 'implies') {
		let $startRole = $startProposition.parent()
		let $allTargets = $RecursiveTreeExplorerCriterium($startRole, $immediateJurisdictionRolesForAddRedundant, $excludedRoles).filter(':visible');
		return $allTargets.filter('[data-atom]').filter(function () { return !this.contains($startProposition[0]) })//filter out ancestors	
	}
	else {
		return $()// there's no start role if the proposition parent is or etc...
	}
}

function $PropositionsAffectedByStartPropositionROLES($startProposition) {
	//test: $PropositionsAffectedByStartPropositionROLES($('.selected')).each(function(){MNODEparent($(this)).addClass('selected')});
	let $roles = $RolesAffectedByStartPropositionROLES($startProposition)
	//from roles to targets:
	return $targets = $roles.map(function () {
		return $(this).children('[data-atom]').not('[data-atom=and]').toArray()
	})
}

function $RolesAffectedByStartPropositionROLES($startProposition) {
	//test: $RolesAffectedByStartPropositionROLES($('.selected')).each(function(){MNODEparent($(this)).addClass('selected')});
	//if startAtom parent is AND or imply, get starting role from start node:  
	let $propositionParent = MNODEparent($startProposition)
	let propParentOp = $propositionParent.attr('data-atom')
	let $startRole
	let $excludedRoles = $startProposition[0].MNODE_getRoles();
	let $roles = $()
	if (propParentOp == 'and') {
		$startRole = $startProposition.parent()
	}
	else if (propParentOp == 'implies' && $startProposition.hasClass('firstMember')) {
		if ((startAtom_op == 'implies') && $role)
			$startRole = $propositionParent[0].MNODE_getRoles('.secondMember');
	}
	if ($startRole) {
		//propagate all Roles excluding start Node //note: apply to yourself?
		$roles = $RecursiveTreeExplorerCriteriumROLES($startRole, $immediateJurisdictionRolesNEW, $excludedRoles)
		$roles = $roles.add($startRole);
	}
	return $roles
}

function $calculateTargetsAddRedundantROLES($startProposition) {
	//test: $validAddRedundantROLES($('.selected')).each(function(){MNODEparent($(this)).addClass('selected')});
	//propagate all Roles excluding start Atom //note: apply to yourself?
	let $roles = $RolesAffectedByStartPropositionROLES($startProposition)
	//from roles to targets:
		// two types of boolean roles exist:1) those with TRUE as neutral elements 2) OTHERS
		// OR belongs to the second group!!!
	return $targets = $roles.map(function () {
		let op = MNODEparent($(this)).attr("data-atom");
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