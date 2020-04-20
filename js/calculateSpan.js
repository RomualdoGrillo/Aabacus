//move

//move with distribute_collect

//copy from    //copy to


function $PropositionDownstreamRec($startAtom){
//testing
//$PropositionDownstreamRec($('.selected')).each(function(){ATOMparent($(this)).addClass('selected')})
	let op = $startAtom.attr("data-atom");
	let $startRole  = $startAtom.parent(); 
	let $ParentAtom = ATOMparent($startAtom);
	let $validRoles = $()
	if( $ParentAtom.is('[data-atom=and]')){
		$validRoles = $startRole;
	}
	$validRoles = $validRoles.add($getDiscendenceRec($startRole,$PropositionLevelAndDownstream) );
	return $validRoles
}

function $PropositionUpstreamRec($startAtom,$outerRoleLimit){
//testing
//$PropositionUpstreamRec($('.selected')).each(function(){ATOMparent($(this)).addClass('selected')});

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
			return ATOMparent($(this))[0].ATOM_getRoles()[0]//return the first role of the implies  	
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
//$AssRolesRec($('.selected')).each(function(){ATOMparent($(this)).addClass('selected')})
	if(!$startRole){
		$startRole  = $startAtom.parent();	
	}
	let $ParentAtom = ATOMparent($startAtom);
	let op = $ParentAtom.attr("data-atom");
	let $validRoles = $()
	if( OpIsAssociative(op)){
		if(immediate){
			$validRoles = $SameOpInOut($startRole)
		}
		else{//recursive
			$validRoles =   $getDiscendenceRec($startRole,$SameOpInOut);	
		}
	}
	return $validRoles
}
function $getDiscendenceRec($startNode,selectFunc,$excluded){
//criterium:selector string or function() return items at distace 1 from $startNode and fitered with some criteria  
//futuribile
//safeMode:false fast search structure is acyclic criterium excludes start node adds elements one step away
//        :true safe structure can be cyclic 
//currentResults are passed via excluded
	if(typeof(s)=="string"){
		selectFunc =  function($startNode){return $startNode.find(selectFunc)}
	}
	let $directChildren =  selectFunc($startNode).not($excluded);
	let i=0
	let $discendence = $directChildren
	while($directChildren[i]){
		//lineAB($startNode,$directChildren.eq(i))
		//---recursive
		$discendence = $discendence.add($getDiscendenceRec( $directChildren.eq(i),selectFunc,$startNode));
	i++}
	return $discendence
}
/*
function $AtomChildren($startNode){
	return $startNode.find('>*>[data-atom]')
}
*/
function $SameOpInOut($startRole){
	let $startAtom = ATOMparent($startRole);
	let op = $startAtom.attr("data-atom");
	let $validRoles = $startRole.find('>[data-atom='+op+']>.ul_role');
	let $parentATOM = ATOMparent($startAtom);
		if( $parentATOM.attr("data-atom") == op ){//parent
		$validRoles = $validRoles.add($parentATOM[0].ATOM_getRoles())//children
	}
	return $validRoles
}
function $PropositionLevelAndDownstream($startRole,limitTomove){
	//move:true limit to roles you can move into (and associative)
	let $validRoles = $();
	if(!limitTomove && $startRole.is('[data-atom=implies]>:first-child') ){
		$validRoles = ATOMparent($startRole).find('>.s_role:last')  
	}
	else{
		let $atoms = $startRole.find('[data-atom=and]')
		if(!limitTomove){
			$atoms = $atoms.add($startRole.find('[data-atom=or],[data-atom=eq].asymmetric,[data-atom=implies]')).filter(':visible')	
		}
	$validRoles = $atoms.map(function(){
		if(this.matches('[data-atom=implies]')){
			return this.ATOM_getRoles().toArray()	
		}
		else{
			return this.ATOM_getRoles().last()[0]}//last role is ok for forall an definition	
		})	
	}
	return $validRoles
}
function $PropositionUpstream($startRole){
	//proposition written in $validRoles are  also valid in $startRole
	//if you look for proposition that can be moved (not cloned) in $startRole
	//that's not the right function 
	let $validRoles = $();
	let $startAtom = ATOMparent($startRole);
	let op = $startAtom.attr("data-atom");
	let $ParentAtom = ATOMparent($startAtom);
	let opP = $startAtom.attr("data-atom");
	if(opP=="and" || opP=="implies"){$validRoles=$ParentAtom[0].ATOM_getRoles()}
	return $validRoles
}



function  	$identifierSpan($identifier){
	//determina il campo di validità dell'identificatore
	//risali fino a trovare un container che può avere Bvar 
	//controlla se l'identifier è tra quelle bvar
	var $span
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
	return $('#telaRole'); //se non hai trovato nulla, lo span è l'intera tela
}

function highlightOccurrences($identifier){
	//evidenzia lo span e le occorrenze dell'identificatore
	var $span = $identifierSpan($identifier);
	//todo: evidenzia lo span
	var $occurrences = $ATOMParameterSearch($span,$identifier).not($identifier);
	$occurrences.each(function(){
		// crea linee
		lineAB($(this),$identifier)	
	})	 
}

