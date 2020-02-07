
function refreshInfix($startNode,rootAndSubTree){//todo:obsoleta, sostituita con generalrefresh()
	//if($startNode.length != 0){
		refreshOneInfix($startNode)
		if(rootAndSubTree){
			$startNode.find('[data-atom]').each(function(i,element){refreshOneInfix($(element))})
		}
	//}

}

function refreshOneInfix($ATOMnode){
	if($ATOMnode[0].ATOM_getRoles === undefined){return}// invalid parameter
	var $role=$ATOMnode[0].ATOM_getRoles();
	var $ATOMchildren = $role.children().filter('[data-atom]');
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
	$ATOMchildren.each(function(i,e){
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



