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


function $getDiscendenceRecursive($startNode,selectFunc,$excluded){//criterium can be a selector string or function()
//mode:fast structure is acyclic criterium excludes start node adds elements one step away
//mode:safe structure can be cyclic 
	if(typeof(s)=="string"){
		selectFunc =  function($startNode){return $startNode.find(selectFunc)}
	}
	let $directChildren =  selectFunc($startNode).not($excluded);
	let i=0
	let $discendence = $directChildren
	while($directChildren[i]){
		lineAB($startNode,$directChildren.eq(i))
		//---recursive
		$discendence = $discendence.add($getDiscendenceRecursive( $directChildren.eq(i),selectFunc,$startNode));
	i++}
	return $discendence
}
/*
function $AtomChildren($startNode){
	return $startNode.find('>*>[data-atom]')
}
*/
function $SameOpUpstream($startRole){
	let $startAtom = ATOMparent($startRole);
	let op = $startAtom.attr("data-atom");
	let $parentATOM = ATOMparent($startAtom);
	if( $parentATOM.attr("data-atom") == op ){
		return $parentATOM[0].ATOM_getRoles()
	}
	else{
		return $()
	}
}
function $SameOpDownStream($startRole){
	let $startAtom = ATOMparent($startRole);
	let op = $startAtom.attr("data-atom");
	return $startRole.find('>[data-atom='+op+']>.ul_role');
}

function NEWimmediateAssValid(mouseDownNode){
	var $mouseDownNode=$(mouseDownNode);
	var $parent = ATOMparent($mouseDownNode);
	let op = undefined;
	if ($parent !== undefined){op = $parent.attr("data-atom")}
	var validTargets = $();
	if( OpIsAssociative(op)){//parent is a target-associative?
		let $downstream = $getDiscendenceRecursive($mouseDownNode.parent(),$SameOpDownStream);
		let $upstream = $getDiscendenceRecursive($mouseDownNode.parent(),$SameOpUpstream);
		return $downstream.add($upstream)
	}
	else{
		return $()
	}	
}
