//UI Event to function call
//traduce i comandi dell'utente, in questo caso inpartiti via mouse e tastiera,
// in chiamate a funzioni del modulo MNODE



function keyboardEvToFC($atom, keyPressed){
	var $actions = searchEventHandler(keyPressed);
	var PActx 
	//prova in ordine ogni azione
	for(var i=0;i<$actions.length;i++){
		var actionString
		var firstValString
		try {
    		actionString = $actions[i].MNODE_getRoles('.function').children()[0].MNODE_getName();
			firstValString = $actions[i].MNODE_getRoles('.values').children()[0].MNODE_getName();	
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
		PActx = TryOnePMTByName(actionString, $atom ,firstValString);
			}
		if( PActx && PActx.matchedTF ){//proprietà applicata con successo
			PActx.msg = actionString +" "+ firstValString
			break
		}
	}
	if(PActx == undefined){
		PActx = newPActx()//if no property was applied pass a dummy PActx
	}
	return PActx
}
function checkIfFoundation(){
	return $('#telaRole [data-tag="foundation"]').length != 0
}

function directCall(key){
	return $('#telaRole [data-rtl='+ key + ']')
}

function searchEventHandler(event){// trova la definizione della proprietà
   var res
   var $found = $('#events').find('[data-atom="eventtoaction"]').filter(function(index){
        var $role = this.MNODE_getRoles('.event');
        if($role.length !== 1){
            console.warn('Role not found' + field);
            res = $()
            return res
        }
        var MNODE = $role.children()[0]
        if( MNODE !== undefined){
            return MNODE.MNODE_getName().toLowerCase() === event.toLowerCase()//case insensitive
        }
        else{
        	res = $()
        	return res
        }
    })
    if ($found.length !== 0){
        res = $found[0].MNODE_getRoles('.actions').children()
    }
    else{ res = $()}
    return  res
}




//searchForProperty('firstMember','distTimes')
function searchForProperty(field,value,returnedField){
	// trova la definizione della proprietà
	if( value == undefined){ return undefined}
	let candidates = Array.from( tela.querySelectorAll('[data-atom=deftrue]') );
	let i=0;
	while(candidates[i]){
		let $role = candidates[i].MNODE_getRoles().filter('.' + field)
		if($role.length !== 1){
			console.warn('Role not found' + field);
		}
		let MNODEvalue = $role.children()[0]
		if(MNODEvalue !== undefined && MNODEvalue.MNODE_getName().toLowerCase() === value.toLowerCase() ){
		    //case insensitive
        	return   $( candidates[i].MNODE_getRoles().filter("." + returnedField ).children()[0] ) 
		}	
	i++}
}




function RefineRepeatedOfMArked(PActx){
	var i=0
	var semplificEffettuata = true; //la prima passata avviene come se la precedente avesse avuto successo.
	let $transformParentRole = PActx.$transform.parent()//se il transform viene sostituito, continua a cercare a partire da l suo parent
	while(semplificEffettuata == true && i<20){//limito il numero di tentativi per evitare loop infiniti
		//cerca atomi marcati "c"
		
		var $toBesemplified = $transformParentRole.find('[data-atom].cleanifpointless')
    	var j= ($toBesemplified.length - 1)
    	semplificEffettuata = false;
    	while( j>=0){//prova a semplificare il j-esimo atomo, parti dal fondo
    		var refinementPActx = keyboardEvToFC($($toBesemplified[j]),"c");
			if(refinementPActx && refinementPActx.matchedTF){//semplificazione applicata con successo
				refreshAndReplace(refinementPActx);
				semplificEffettuata = true;
				break
    		}
    		j--
    	}
    	i++
    		
	}
	
}