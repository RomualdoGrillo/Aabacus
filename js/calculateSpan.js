//move

//move with distribute_collect

//copy from    //copy to


function $PropositionDownstreamRec($startAtom){
//testing
//$PropositionDownstreamRec($('.selected')).each(function(){MNODEparent($(this)).addClass('selected')})
	let op = $startAtom.attr("data-atom");
	let $startRole  = $startAtom.parent(); 
	let $ParentAtom = MNODEparent($startAtom);
	let $validRoles = $()
	if( $ParentAtom.is('[data-atom=and]')){
		$validRoles = $startRole;
	}
	$validRoles = $validRoles.add($RecursiveTreeExplorerCriterium($startRole,$PropositionLevelAndDownstream) );
	return $validRoles
}
function $propositionImmediateJurisdiction($proposition){
	//upstream if it's ans AND
	let $result=MNODEparent($proposition).filter('[data-atom=and]');
	//downstream ANDs and OR
	return $result.add($proposition[0].MNODE_getChildren('[data-atom=and],[data-atom=or]'));
}
function $ImmediateAssociativeAtom($starAssociativeOperation){
	//test: $ImmediateAssociativeAtom($('.selected')) selected should be associative operation
	let op = $starAssociativeOperation.attr("data-atom");
	let $result = $();
	//upstream if it's same operation
	let $parent = MNODEparent($starAssociativeOperation)
	if($parent.attr("data-atom") === op){
		$result = $result.add( $parent );
	} MNODEparent($starAssociativeOperation).filter('[data-atom=' + op + ']');
	//downstream same operation
	let MNODEchildren = $starAssociativeOperation[0].MNODE_getChildren();
		MNODEchildren.each(function(i,e){
		if( $(e).attr("data-atom") === op ){
			//$result = $result.add(e.MNODE_getRoles());
			$result = $result.add($(e));
		}
	});
	return $result
}

function $PropositionUpstreamRec($startAtom,$outerRoleLimit){
//testing
//$PropositionUpstreamRec($('.selected')).each(function(){MNODEparent($(this)).addClass('selected')});

	let op = $startAtom.attr("data-atom");
	let $validRoles = $()
	let $parentRoles=$startAtom.parents('[class*="_role"]');
	if($outerRoleLimit){
		let index = $parentRoles.index($outerRoleLimit);
		if(index!=-1){
			$parentRoles = $parentRoles.slice(0,index);
		}
	}
	$validRoles = $parentRoles.map(function(){
		if( this.matches('[data-atom=implies]>.s_role:nth-child(2)') ){
			return MNODEparent($(this))[0].MNODE_getRoles()[0]//return the first role of the implies  	
		}
		else if(this.matches('[data-atom=and]>.ul_role')){
			let $roles = $AssRolesRec(undefined,false,$(this)).add($(this))
			return  $roles.toArray()
		} 
		else{return null} 
	})
	return $validRoles
	
}

function $AssRolesRec($startAtom,immediate,$startRole){
//testing
//$AssRolesRec($('.selected')).each(function(){MNODEparent($(this)).addClass('selected')})
	if(!$startRole){
		$startRole  = $startAtom.parent();	
	}
	let $ParentAtom = MNODEparent($startAtom);
	let op = $ParentAtom.attr("data-atom");
	let $validRoles = $()
	if( OpIsAssociative(op)){
		if(immediate){
			$validRoles = $SameOpInOut($startRole)
		}
		else{//
			$validRoles =   $RecursiveTreeExplorerCriterium($startRole,$SameOpInOut);	
		}
	}
	return $validRoles
}
function $RecursiveTreeExplorerCriterium($startNode,selectionStringOrFunction,$foundAlready){
//test:  $RecursiveTreeExplorerCriterium($('.selected'),'[data-atom]')  
//criterium:selector string or function() return items at distace 1 from $startNode and fitered with some criteria  
//futuribile
//safeMode:false fast search structure is acyclic criterium excludes start node adds elements one step away
//        :true safe structure can be cyclic 
//currentResults are passed via $foundAlready
	let selectionFunction
	if(typeof(selectionStringOrFunction)=="string"){
		selectionFunction =  function($startNode){return $startNode.find(selectionStringOrFunction)}
	}
	else{
		selectionFunction = selectionStringOrFunction 
	}
	if(!$foundAlready){$foundAlready=$()}
	$foundAlready = $foundAlready.add($startNode)
	let $directChildren =  selectionFunction($startNode).not($foundAlready);
	let i=0
	$foundAlready = $foundAlready.add($directChildren)
	let $discendence = $directChildren;
	while($directChildren[i]){
		//lineAB($startNode,$directChildren.eq(i))
		//---recursive
		$discendence = $discendence.add($RecursiveTreeExplorerCriterium( $directChildren.eq(i),selectionFunction,$foundAlready));
	i++}
	return $discendence
}
/*
function $AtomChildren($startNode){
	return $startNode.find('>*>[data-atom]')
}
*/
function $SameOpInOut($startRole){
	let $startAtom = MNODEparent($startRole);
	let op = $startAtom.attr("data-atom");
	let $validRoles = $startRole.find('>[data-atom='+op+']>.ul_role');
	let $parentMNODE = MNODEparent($startAtom);
		if( $parentMNODE.attr("data-atom") == op ){//parent
		$validRoles = $validRoles.add($parentMNODE[0].MNODE_getRoles())//children
	}
	return $validRoles
}
function $PropositionLevelAndDownstream($startRole,limitTomove){
	//limitTomove:true limit to roles you can move into (and associative)
	let $validRoles = $();
	if(!limitTomove && $startRole.is('[data-atom=implies]>:first-child') ){
		$validRoles = MNODEparent($startRole).find('>.s_role:last')  
	}
	else{
		let $atoms = $startRole.find('[data-atom=and]')
		if(!limitTomove){
			$atoms = $atoms.add($startRole.find('[data-atom=or],[data-atom=eq].asymmetric,[data-atom=implies]')).filter(':visible')	
		}
	$validRoles = $atoms.map(function(){
		if(this.matches('[data-atom=implies]')){
			return this.MNODE_getRoles().toArray()	
		}
		else{
			return this.MNODE_getRoles().last()[0]}//last role is ok for forall an definition	
		})	
	}
	return $validRoles
}




function  	$identifierSpanForAll($identifier){
	//determina il campo di validità dell'identificatore
	//risali fino a trovare un container che può avere Bvar 
	//controlla se l'identifier è tra quelle bvar
	var $containingForAlls = $identifier.parents('[data-atom=forAll]');
	//todo: andrebbero considrati tutti i parents che contengono Bvar, non solo i forAll
	var i=0
	while($containingForAlls[i]){
		if ( parameterInHeader($identifier,$($containingForAlls[i])  ) ){
			// l'$identifier si trova tra i paramettri del forall
		return $($containingForAlls[i])
		}
		i++
	}
	return $('#canvasAnd'); //se non hai trovato nulla, lo span è l'intera canvas
}

function highlightOccurrences($identifier,addClass){
	//evidenzia lo span e le occorrenze dell'identificatore
	let $span = $identifierSpanForAll($identifier);
	$span.not('#canvasAnd').addClass('mu_span')//highlight span unless it's the whole canvas
	let $occurrences =$findOccurrences($identifier,undefined,true)
	$occurrences.addClass(addClass);
	/*$occurrences.each(function(){
		// crea linee
		lineAB($(this),$identifier,addClass)	
	})*/	 
}

// example use:
// $findOccurrences($identifier,$identifierSpanForAll($identifier))
function $findOccurrences($wanted,$span,excludeHidden){
	if(!$span){$span = $identifierSpanForAll($wanted);}
	//todo: questa ricerca non distingue le variabili interne "Bvar".
	// Ad esempio     x+1= integrale( x^2 in dx)   x compare sia a destra che a sinistra ma non è la stessa variabile
	let $candidates
	if(excludeHidden){
		$candidates= $span.find("[data-atom]:visible")
	}
	else{//default
		$candidates = $span.find("[data-atom]")
	}
	let $occurrences = $candidates.filter(function () {
		//return MNODEEqual($atom_param[0],this)
		return compareExtMNODE($wanted, $(this), true, false);
	});
	return	 $occurrences
}

