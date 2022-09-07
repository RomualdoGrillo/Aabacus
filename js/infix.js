
function refreshInfix($startNode,rootAndSubTree){//todo:obsoleta, sostituita con generalrefresh()
	//if($startNode.length != 0){
		refreshOneInfix($startNode)
		if(rootAndSubTree){
			$startNode.find('[data-atom]').each(function(i,element){refreshOneInfix($(element))})
		}
	//}

}

function refreshOneInfix($MNODEnode){
	if($MNODEnode[0].MNODE_getRoles === undefined){return}// invalid parameter
	var $role=$MNODEnode[0].MNODE_getRoles();
	var $MNODEchildren = $role.children().filter('[data-atom]');
	var $InfixChildren = $role.children().filter('.infix:not(.proto)');
	var $infixProto = $role.find('>.infix.proto');
	//procedura "cambia solo il necessario"
	//per ogni elemento "infix: se non sei preceduto e seguito da atom remove!
	$InfixChildren.each(function(i,e){
		if( !($(e).prev().is('[data-atom]') && $(e).next().is('[data-atom]'))  ){
			//console.log(i);
			$(e).remove();
		}
	})
	//per ogni elemento atom tranne il primo: se non sei preceduto da infix, aggiungine uno
	$MNODEchildren.each(function(i,e){
		if(i>0){
			if(!$(e).prev().is('.infix:not(.proto)')){
				//console.log(i);
				//$('<span class="infix">*</span>').insertBefore($(e))
				$infixProto.clone().removeClass('proto').insertBefore($(e))
			}
		}
	})
}

function refreshEmpty($startNode){
	$startNode.find('[class*="_role"]').each(function(i,e){
	    if( $(e).children().filter('[data-atom]').length===0 ){$(e).addClass('empty')}
	    else{ $(e).removeClass('empty')}
	})
}

//let acceptString = $role.attr('accept')
function attrAcceptToMinMax(acceptString){
	let min
	let max  
	if(acceptString==undefined){
		return [NaN,NaN]
	}
	let acceptLimits = acceptString.split(':')
	if (acceptLimits.length==1){// "5"   precisely 5 elements
		let fixed = parseInt(acceptLimits[0]);
		min = fixed;
		max = fixed;
	}
	else{//"2:3"
		min = parseInt(acceptLimits[0]);
		max = parseInt(acceptLimits[1]);
	}
	return [min,max]
}

