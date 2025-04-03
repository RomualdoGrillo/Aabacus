
function refreshInfix($startNode,rootAndSubTree){//todo:obsoleta, sostituita con generalrefresh()
	//if($startNode.length != 0){
		refreshOneInfix($startNode)
		if(rootAndSubTree){
			$startNode.find('[data-ENODE]').each(function(i,element){refreshOneInfix($(element))})
		}
	//}

}

function refreshOneInfix($ENODEnode){
	if($ENODEnode[0].ENODE_getRoles === undefined){return}// invalid parameter
	var $role=$ENODEnode[0].ENODE_getRoles();
	var $ENODEchildren = $role.children().filter('[data-ENODE]');
	var $InfixChildren = $role.children().filter('.infix:not(.proto)');
	var $infixProto = $role.find('>.infix.proto');
	//procedura "cambia solo il necessario"
	//per ogni elemento "infix: se non sei preceduto e seguito da ENODE remove!
	$InfixChildren.each(function(i,e){
		if( !($(e).prev().is('[data-ENODE]') && $(e).next().is('[data-ENODE]'))  ){
			//console.log(i);
			$(e).remove();
		}
	})
	//per ogni elemento ENODE tranne il primo: se non sei preceduto da infix, aggiungine uno
	$ENODEchildren.each(function(i,e){
		if(i>0){
			if(!$(e).prev().is('.infix:not(.proto)')){
				//console.log(i);
				//$('<div class="infix">*</div>').insertBefore($(e))
				$infixProto.clone().removeClass('proto').insertBefore($(e))
			}
		}
	})
}


function refreshOneEmpty($ENODE){
	if($ENODE[0].ENODE_getRoles==undefined){return};
	$ENODE[0].ENODE_getRoles().each(function(i,e){
		let childrenNum = $(e).children().filter('[data-ENODE],.dummyrole').length
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
	    let childrenNum = $(e).children().filter('[data-ENODE],.dummyrole').length
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