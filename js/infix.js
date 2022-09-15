
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
				//$('<div class="infix">*</div>').insertBefore($(e))
				$infixProto.clone().removeClass('proto').insertBefore($(e))
			}
		}
	})
}


function refreshOneEmpty($MNODE){
	if($MNODE[0].MNODE_getRoles==undefined){return};
	$MNODE[0].MNODE_getRoles().each(function(i,e){
	    $(this).addClass('refreshed')
		let childrenNum = $(e).children().filter('[data-atom],.dummyrole').length
		let minPlaces=getNumOfPlaces($(this))[0]
		if(minPlaces>1){//manage dummies to ensure minimum places
			let deltaDummies = minPlaces- childrenNum
			if(deltaDummies>0){
			//add dummies
				for (var i = 0; i<deltaDummies; i++){
					$(this).append($('<div class="dummyrole"></div>'))
				}
			}
			else if(deltaDummies<0){
				//remove dummies
				for (var i = 0; i<-deltaDummies; i++){
					$(this).find('.dummyrole:first').remove()
				}
			}
		}
		else{//manage "empty" class
			if( minPlaces==0 && childrenNum == 0 ){$(e).addClass('empty')}
	    	else{ $(e).removeClass('empty')}
		}
	})
}
/*
function refreshEmpty($startNode){
	$startNode.find('[class*="_role"]:not(.dummyrole)').each(function(i,e){
	    let childrenNum = $(e).children().filter('[data-atom],.dummyrole').length
		let minPlaces=getNumOfPlaces($(this))[0]
		if(minPlaces!=0){//manage dummies to ensure minimum places
			let deltaDummies = minPlaces- childrenNum
			if(deltaDummies>0){
			//add dummies
				for (var i = 0; i<deltaDummies; i++){
					$(this).append($('<div class="dummyrole"></div>'))
				}
			}
			else if(deltaDummies<0){
				//remove dummies
				for (var i = 0; i<-deltaDummies; i++){
					$(this).find('.dummyrole:first').remove()
				}
			}
		}
		else{//manage "empty" class
			if( childrenNum === 0 ){$(e).addClass('empty')}
	    	else{ $(e).removeClass('empty')}
		}
	})
}*/