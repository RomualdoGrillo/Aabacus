//move

//move with distribute_collect

//copy from    //copy to


function $PropositionDownstreamRec($startAtom) {
	//testing
	//$PropositionDownstreamRec($('.selected')).each(function(){MNODEparent($(this)).addClass('selected')})
	let op = $startAtom.attr("data-atom");
	let $startRole = $startAtom.parent();
	let $ParentAtom = MNODEparent($startAtom);
	let $validRoles = $()
	if ($ParentAtom.is('[data-atom=and]')) {
		$validRoles = $startRole;
	}
	$validRoles = $validRoles.add($RecursiveTreeExplorerCriterium($startRole, $PropositionLevelAndDownstream));
	return $validRoles
}
function $immediateJurisdictionRoleUpstream($role) {
	let $startAtom = MNODEparent($role)
	let $result = $()
	//upstream if it's ans AND
	if ($startAtom.is('[data-atom=and]')) {
		$result = $result.add($startAtom.parent())
	}
	return $result
}

function $immediateJurisdictionRoles($role) {
	let $startAtom = MNODEparent($role)
	let $ANDsORs = $()// ANDs and ORs whose roles must be added
	let $result = $()
	//upstream if it's ans AND
	if ($startAtom.is('[data-atom=and]')) {
		$result = $result.add($startAtom.parent())
	}
	//downstream implies firstMember
	if ($role.hasClass('firstMember') && $startAtom.is('[data-atom=implies]')) {
		$result = $result.add($startAtom[0].MNODE_getRoles('.secondMember'))
	}
	//downstream ANDs and OR
	$ANDsORs = $ANDsORs.add($role.children('[data-atom=and],[data-atom=or]'));
	let $ANDsRoles = $ANDsORs.map(function () { return this.MNODE_getRoles()[0] });
	return $result.add($ANDsRoles);
}


function $immediateJurisdictionRolesForAddRedundant($role) {
	if($role.is('[data-atom]')){
		return $() // Target atoms are just proxy for underlyng role.
		//recursive exploration happens jumping fron role to upstream and downstrem role.
	}
	let $startAtom = MNODEparent($role)
	let startNode_op = $startAtom.attr("data-atom");
	let $stepStoneORtarget = $()
	let $children = $role.children('[data-atom]');
	if (startNode_op == 'and'){
		//upstream if it's an AND
		if (MNODEparent($startAtom).is('[data-atom=and]')) {
			$stepStoneORtarget = $stepStoneORtarget.add($startAtom.parent())
		}
	}//downstream
	else{// $startNode is not an and
		$stepStoneORtarget = $stepStoneORtarget.add($children.not('[data-atom=and]'));
	}
	$children.each(function(){
		let op = $(this).attr("data-atom");
		if( op == 'and' || op == 'or' || op == 'implies'){
			$stepStoneORtarget = $stepStoneORtarget.add(this.MNODE_getRoles()[0])//add roles
		}
		//else if(op == 'not'){ this is a target for DeMorgan}
	})
	//downstream implies firstMember
	if ( (startNode_op == 'implies') && $role.hasClass('firstMember')) {
		$secondMember = $startAtom[0].MNODE_getRoles('.secondMember');
		$stepStoneORtarget = $stepStoneORtarget.add($secondMember);
	}
	//some filter out step stones: exclude OR roles, exclude full roles
	return $stepStoneORtarget
}









function $immediateTargetsAddRedundantAtomsAndRoles($roleORatom) {
	let $result = $()
	if (!$roleORatom.is('[data-atom]')) {
		let $startAtom = $roleORatom
		if ($startAtom.is('[data-atom=and]')) {
			//upstream if it's an AND
			if (MNODEparent($startAtom).is('[data-atom=and]')) {
				$result = $result.add($startAtom.parent())
			}
			let $children = $roleORatom.children('[data-atom]');
			//downstream ANDs 
			let $ANDs = $children.filter('[data-atom=and]');
			let $ANDsRoles = $ANDs.map(function () { return this.MNODE_getRoles()[0] });
			$result = $result.add($ANDsRoles);
			//downstream non ANDs
			let $others = $children.not('[data-atom=and]');
			$result = $result.add($others);

		}
		//downstream implies firstMember
		if ($startAtom.is('[data-atom=implies]') && $roleORatom.hasClass('firstMember')) {
			$secondMember = $startAtom[0].MNODE_getRoles('.secondMember');
			$result = $result.add($emptyRoleOrChildren($secondMember));
		}
	}
	else { //******** ATOM
		//upstream AND
		if (MNODEparent($roleORatom).is('[data-atom=and]')) {
			$result = $result.add($roleORatom.parent())
		}
		let atomType = $roleORatom.attr('data-atom')
		if (atomType == 'and') {
			$result = $result.add($roleORatom[0].MNODE_getRoles());
		}
		if (atomType == 'or') {
			$result = $result.add($roleORatom[0].MNODE_getChildren());
		}
		else if (atomType == 'implies') {
			let $roles = $roleORatom[0].MNODE_getRoles();
			$result = $result.add($roles.map(function () {
				return $emptyRoleOrChildren($(this))[0]
			}))
		}
	}
	return $result
}
function $emptyRoleOrChildren($role) {
	//if a children exists it is returned insted of his role 
	let $children = $role.children('[data-atom]');
	if ($children.length > 0) {
		return $children
	}
	else { return $role }
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
function $PropositionLevelAndDownstream($startRole, limitTomove) {
	//limitTomove:true limit to roles you can move into (and associative)
	let $validRoles = $();
	if (!limitTomove && $startRole.is('[data-atom=implies]>:first-child')) {
		$validRoles = MNODEparent($startRole).find('>.s_role:last')
	}
	else {
		let $atoms = $startRole.find('[data-atom=and]')
		if (!limitTomove) {
			$atoms = $atoms.add($startRole.find('[data-atom=or],[data-atom=eq].asymmetric,[data-atom=implies]')).filter(':visible')
		}
		$validRoles = $atoms.map(function () {
			if (this.matches('[data-atom=implies]')) {
				return this.MNODE_getRoles().toArray()
			}
			else {
				return this.MNODE_getRoles().last()[0]
			}//last role is ok for forall an definition	
		})
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

function $calculateJurisdictionRoles($startRole) {
	// .addClass('mu_Downstream1').filter('[data-atom]:visible')
	return $RecursiveTreeExplorerCriterium($startRole, $immediateJurisdictionRoles)
}

function $calculateJurisdictionUpstream($startRole) {
	// .addClass('mu_Downstream1').filter('[data-atom]:visible')
	return $RecursiveTreeExplorerCriterium($startRole, $immediateJurisdictionRoleUpstream)
}

function $calculateTargetsAddRedundantAtomsAndRoles($startRole) {
	let $allTargets = $RecursiveTreeExplorerCriterium($startRole, $immediateJurisdictionRolesForAddRedundant).filter(':visible');
	return $allTargets.filter(function(){
		if( $(this).is('[data-atom]')){
			return true}
		else{
			let op =	MNODEparent($(this)).attr("data-atom");
			if( op == 'or'){return false}
			if( op == 'implies'){
				return isTherePlaceForAnother($(this));
			}
			else{
				return true
			}
		}	
	})
}