
function $immediateJurisdictionRoleUpstream($role) {
	let $startAtom = MNODEparent($role)
	let $result = $()
	//upstream if it's ans AND
	if ($startAtom.is('[data-atom=and]')) {
		$result = $result.add($startAtom.parent())
	}
	return $result
}

	if($role.is('[data-atom]')){
		return $() // Target atoms are just proxy for underlyng role.
		//recursive exploration happens jumping fron role to upstream and downstrem role.
	}
	let $startAtom = MNODEparent($role)
	let startNode_op = $startAtom.attr("data-atom");
	let $stepStoneORtarget = $()
	if (startNode_op == 'and'){
		//upstream if it's an AND
		if (MNODEparent($startAtom).is('[data-atom=and]')) {
			$stepStoneORtarget = $stepStoneORtarget.add($startAtom.parent())
		}
	}//downstream
	$stepStoneORtarget = $stepStoneORtarget.add($children);
	$children.each(function(){
		let op = $(this).attr("data-atom");
		if( op == 'and' || op == 'or' || op == 'implies'){
			$stepStoneORtarget = $stepStoneORtarget.add(this.MNODE_getRoles()[0])//add roles
		}
		else if(op == 'forAll'){
			$stepStoneORtarget = $stepStoneORtarget.add(this.MNODE_getRoles('.forAllContent')[0])//add roles
		}
		//else if(op == 'not'){ this is a target for DeMorgan}
	})
	//downstream implies firstMember
	if ( (startNode_op == 'implies') && $role.hasClass('firstMember')) {
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
function $RecursiveTreeExplorerCriterium($startNode, selectionStringOrFunction, $foundAlready) {
	//test:  $RecursiveTreeExplorerCriterium($('.selected'),'[data-atom]')  
	//criterium:selector string or function() return items at distace 1 from $startNode and fitered with some criteria  
	//futuribile
	//safeMode:false fast search structure is acyclic criterium excludes start node adds elements one step away
	//        :true safe structure can be cyclic 
	//currentResults are passed via $foundAlready
	let selectionFunction
	if (typeof (selectionStringOrFunction) == "string") {
		selectionFunction = function ($startNode) { return $startNode.find(selectionStringOrFunction) }
	}
	else {
		selectionFunction = selectionStringOrFunction
	}
	if (!$foundAlready) { $foundAlready = $() }
	$foundAlready = $foundAlready.add($startNode)
	let $directChildren = selectionFunction($startNode).not($foundAlready);
	let i = 0
	$foundAlready = $foundAlready.add($directChildren)
	let $discendence = $directChildren;
	while ($directChildren[i]) {
		//lineAB($startNode,$directChildren.eq(i))
		//---recursive
		$discendence = $discendence.add($RecursiveTreeExplorerCriterium($directChildren.eq(i), selectionFunction, $foundAlready));
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

function $calculateTargetsAddRedundantAtomsAndRoles($startRole) {
	//staring point must be a role!!
	let $allTargets = $RecursiveTreeExplorerCriterium($startRole, $immediateJurisdictionRolesForAddRedundant).filter(':visible');
	//1)) filter out atoms, some atom will be added back in 2))
	return $allTargets.not('[data-atom]').map(function(){
		//2))if this role can't accept a drop, make the children atom his proxy
		let op =	MNODEparent($(this)).attr("data-atom");
		if( op == 'or'){
			return $(this).children('[data-atom]').not('[data-atom=and]').toArray()
		}
		else if( op == 'implies' && !isTherePlaceForAnother($(this))){
			return $(this).children('[data-atom]')[0]
		}
		else{
			return this
		}
	})
}

function $PropositionsAffectedByStartProposition($startProposition) {
	let $propositionParent = MNODEparent($startProposition)
	let propParentOp = $propositionParent.attr('data-atom') 
	if(propParentOp=='and' || propParentOp=='implies'){
		let $startRole = $startProposition.parent()
		let $allTargets = $RecursiveTreeExplorerCriterium($startRole, $immediateJurisdictionRolesForAddRedundant).filter(':visible');
		//1)) filter out roles
		return $allTargets.filter('[data-atom]')	
	}
	else{
		return $()//there's no start role if the proposition parent is or etc...
	}
}
