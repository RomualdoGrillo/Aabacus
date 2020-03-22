function associativeValid($mouseDownNode){
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