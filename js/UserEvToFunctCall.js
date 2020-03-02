//UI Event to function call
//traduce i comandi dell'utente, in questo caso inpartiti via mouse e tastiera,
// in chiamate a funzioni del modulo ATOM


function DropEvToFC($draggable,$target){
	//drop event to function call
	//if($target.hasClass('forEachHeader')){return ATOMforThis($draggable,$target)}
	//if(	($draggable.parent().hasClass('firstMember')||$draggable.parent().hasClass('secondMember'))&& ( $.trim(JumpEnclosure($draggable).html()) == $.trim(JumpEnclosure($target).html()) ) ){//2)Uguali al rimpiazzando
	var $dropTarget
	//if ($target.hasClass('role')){ $dropTarget = $target.parent()}
	//else{ $dropTarget = $target}
	$dropTarget = $target	
	if(	
		($draggable.parent().hasClass('firstMember')||$draggable.parent().hasClass('secondMember'))// dragged membro di una equazione?
		&& 
		( ATOMEqual(JumpEnclosure($draggable)[0] , JumpEnclosure($dropTarget)[0]) ) //dragged e target sono uguali?
	){
		
		//todo:Devono essere in "And" con il rimpiazzando todo: se non sono direttamente in and si posso distribuire inesso ma questo e' non fondamentale
		//console.log('qui ci vuole un replace!!!!!!!')
		ATOMReplaceLink($dropTarget,$draggable)
		return 'replace'
	} 
	//fratelli? hanno un common parent?
	else if ($draggable.parent()[0] == $target.parent()[0]){
		var $commonParent = $draggable.parent()
		//---------propriet� distributiva prodotto rispetto somma ?---------------
		if($commonParent.hasClass('times') && $target.hasClass('plus') ){
		ATOMdistribute($draggable,$target)
		return 'ATOMdistribute($draggable,$target)'
		}
		//---------propriet� associativa della somma?---------------
		else if($commonParent.hasClass('plus') && $target.hasClass('plus') ){
		ATOMassociate($draggable,$target)
		return 'ATOMassociate($draggable,$target)'
		}
		//---------propriet� associativa del prodotto?---------------
		else if($commonParent.hasClass('times') && $target.hasClass('times') ){
		ATOMassociate($draggable,$target)
		return 'ATOMassociate($draggable,$target)'
		}
		//---------calcolabile?---------------
		else if($draggable.hasClass('cn') && $target.hasClass('cn') ){
		ATOMcalculate($draggable,$target)
		return 'ATOMcalculate($draggable,$target)'
		}
		
		//si puo riscrivere con un solo termine, ad esempio:
		//1) si puo calcolare risultato numerico, 
		//2) si puo semplificare con opposto/con reciproco. 
		
		console.log('same parent but no appliable property')
		return 'noProp'
	}
	else{
		console.log('not same parent')
		return 'noProp'
	}
}


function keyboardEvToFC($atom, keyPressed){
	var $actions = searchEventHandler(keyPressed);
	var PActx = newPActx()
	//prova in ordine ogni azione
	for(var i=0;i<$actions.length;i++){
		var actionString
		var firstValString
		try {
    		actionString = $actions[i].ATOM_getRoles('.function').children()[0].ATOM_getName();
			firstValString = $actions[i].ATOM_getRoles('.values').children()[0].ATOM_getName();	
		}
		catch(err) {}
		if( firstValString === "int" ){	//chiamata ad una funzione interna
			console.log("auto call: " + actionString );
			var result
			result = window[actionString](  $atom ) //todo: gestire errore 
			if(result){
				PActx = result
			}//usa il risultato a meno che non sia "undefined"
			}
		else{//chiamata a funzione configurabile
		PActx = TryPropByName("name",actionString, $atom ,firstValString);
			}
		if( PActx.matchedTF ){//proprietà applicata con successo
			PActx.msg = actionString +" "+ firstValString
			//************RemoveMarksFromTransform*****************************************
    		PActx.$transform.find('.taken').removeClass('taken');// "taken" non dovrebbe passare al transform, provvisoriamente lo ripulisco quì
			PMclean(PActx);
			break
		}
	}
	return PActx
}


function searchEventHandler(event){// trova la definizione della proprietà
   var res
   var $found = $('#telaRole').find('[data-atom="eventToAction"]').filter(function(index){
        var $role = this.ATOM_getRoles('.event');
        if($role.length !== 1){
            console.warn('Role not found' + field);
            res = $()
            return res
        }
        var ATOM = $role.children()[0]
        if( ATOM !== undefined){
            return ATOM.ATOM_getName().toLowerCase() === event.toLowerCase()//case insensitive
        }
        else{
        	res = $()
        	return res
        }
    })
    if ($found.length !== 0){
        res = $found[0].ATOM_getRoles('.actions').children()
    }
    else{ res = $()}
    return  res
}




//searchForProperty('firstMember','distTimes')
function searchForProperty(field,value,returnedField){
	// trova la definizione della proprietà
	if( value == undefined){ return undefined}
	let candidates = Array.from( tela.querySelectorAll('[data-atom=defTrue]') );
	let i=0;
	while(candidates[i]){
		let $role = candidates[i].ATOM_getRoles().filter('.' + field)
		if($role.length !== 1){
			console.warn('Role not found' + field);
		}
		let ATOMvalue = $role.children()[0]
		if(ATOMvalue !== undefined && ATOMvalue.ATOM_getName().toLowerCase() === value.toLowerCase() ){
		    //case insensitive
        	return   $( candidates[i].ATOM_getRoles().filter("." + returnedField ).children()[0] ) 
		}	
	i++}
}




function RefineRepeatedOfMArked(PActx){
	var i=0
	var semplificEffettuata = true; //la prima passata avviene come se la precedente avesse avuto successo.
	while(semplificEffettuata == true && i<20){//limito il numero di tentativi per evitare loop infiniti
		//cerca atomi marcati "c"
		var $toBesemplified = PActx.$transform.find('[data-atom]').addBack().filter('.cleanifpointless')
    	var j= ($toBesemplified.length - 1)
    	semplificEffettuata = false;
    	while( j>=0){//prova a semplificare il j-esimo atomo, parti dal fondo
    		var PActx = keyboardEvToFC($($toBesemplified[j]),"c");
			if(PActx.matchedTF){//semplificazione applicata con successo
				refreshAndReplace(PActx);
				semplificEffettuata = true;
				break
    		}
    		j--
    	}
    	i++
    		
	}
	
}