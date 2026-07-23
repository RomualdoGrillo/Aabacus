
/**
 * Aggiorna i separatori infissi (`.infix`) tra gli operandi di un ENODE con la
 * strategia "cambia solo il necessario": rimuove i separatori non più
 * circondati da due ENODE e clona il prototipo `.infix.proto` davanti a ogni
 * figlio ENODE (tranne il primo) che ne è privo.
 * Usata da `ExpressionManager.js` dentro `RefreshEmptyInfixBraketsGlued`.
 * @param {JQuery} $ENODEnode nodo ENODE esteso (deve avere `ENODE_getRoles`);
 *   se il nodo non è esteso la funzione esce senza fare nulla
 */
function refreshOneInfix($ENODEnode){
	if($ENODEnode[0].ENODE_getRoles === undefined){return}// invalid parameter
	var $role=$ENODEnode[0].ENODE_getRoles();
	var $ENODEchildren = $role.children().filter('[data-enode]');
	var $InfixChildren = $role.children().filter('.infix:not(.proto)');
	var $infixProto = $role.find('>.infix.proto');
	//procedura "cambia solo il necessario"
	//per ogni elemento "infix: se non sei preceduto e seguito da ENODE remove!
	$InfixChildren.each(function(i,e){
		if( !($(e).prev().is('[data-enode]') && $(e).next().is('[data-enode]'))  ){
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


/**
 * Aggiorna i segnaposto dei ruoli di un ENODE: per i ruoli con minimo posti
 * maggiore di 1 aggiunge/rimuove i `.dummyrole` necessari a garantire il
 * numero minimo; per gli altri applica/toglie la classe `empty` a seconda che
 * il ruolo sia rimasto senza figli ENODE.
 * Usata da `ExpressionManager.js` dentro `RefreshEmptyInfixBraketsGlued`.
 * @param {JQuery} $ENODE nodo ENODE esteso (deve avere `ENODE_getRoles`);
 *   se il nodo non è esteso la funzione esce senza fare nulla
 */
function refreshOneEmpty($ENODE){
	if($ENODE[0].ENODE_getRoles==undefined){return};
	$ENODE[0].ENODE_getRoles().each(function(i,e){
		let childrenNum = $(e).children().filter('[data-enode],.dummyrole').length
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