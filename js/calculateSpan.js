//move

//move with distribute_collect

//copy from    //copy to
function copyFrom($proposition){
	//you just get all parents?
}

function associativeValid($mouseDownNode){//move
	let $parent = ATOMparent($mouseDownNode);
	let op = $parent.attr("data-atom");
	//upstreamSpan
	let $upstremValids = $() 
	if(OpIsAssociative(op)){
		let OPselector = '[data-atom='+op+']'
		$upstremValids = $parent.parents(OPselector)
	}
	//downstreamSpan
	let downstreamValids = getAssocitiveValids($parent,op);	
	return $upstremValids.add(downstreamValids)
}

function getAssocitiveValids($startPoints,op){
	let i=0;
	let $newStartingPoints = $()
	while($startPoints[i]){
		$newStartingPoints = $newStartingPoints.add( $startPoints[i].ATOM_getChildren('[data-atom='+op+']') ) 
	i++}
	let $newValids = $();
	//**************recursive
	if($newStartingPoints.length>0){$newValids=getAssocitiveValids($newStartingPoints,op)};  
	return $newStartingPoints.add($newValids)
}

function upstreamSpan(mouseDownNode){
	var $mouseDownNode=$(mouseDownNode);
	var $parent = ATOMparent($mouseDownNode);
	let op = undefined;
	if ($parent !== undefined){op = $parent.attr("data-atom")}
	var validTargets = $();
	if( OpIsAssociative(op)){
		//parent is a target-associative?
		if(ATOMparent($parent).attr("data-atom") === op ){
			validTargets = validTargets.add( ATOMparent($parent)[0].ATOM_getRoles());
		}
		//children are validTargets?
		var ATOMchildren = $parent[0].ATOM_getChildren();
		ATOMchildren.each(function(i,e){
			 if( $(e).attr("data-atom") === op ){
			validTargets = validTargets.add(e.ATOM_getRoles());
			 }
		});
	}
	return validTargets
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
l}
*/
function $PropositionDownstreamRec($startAtom){
//testing
//$PropositionDownstreamRec($('.selected')).each(function(){ATOMparent($(this)).addClass('selected')})

	let op = $startAtom.attr("data-atom");
	let $startRole  = $startAtom.parent(); 
	let $validRoles = $()
	$validRoles =   $getDiscendenceRec($startRole,$PropositionLevelAndDownstream);
	return $validRoles
}

function $AssRolesRec($startAtom,immediate){
//testing
//$AssRoles($('.selected')).each(function(){ATOMparent($(this)).addClass('selected')})
	let op = $startAtom.attr("data-atom");
	let $startRole  = $startAtom.parent(); 
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
	let $ParentAtom = ATOMparent($startRole);
	let opP = $startAtom.attr("data-atom");
	if(opP=="and" || opP=="implies"){$validRoles=$ParentAtom[0].ATOM_getRoles()}
	return $validRoles
}


function  	$identifierSpan($identifier){
	//determina il campo di validità dell'identificatore
	//risali fino a trovare un container che può avere Bvar 
	//controlla se l'identifier è tra quelle bvar
	var $span
	var $containingForAlls = $('.selected').parents('[data-atom=forAll]');
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