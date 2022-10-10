//UI Event to function call
//traduce i comandi dell'utente, in questo caso inpartiti via mouse e tastiera,
// in chiamate a funzioni del modulo MNODE



function keyboardEvToFC($atom, keyPressed,e){
	var PActx 
	if(GLBsettings.tool=="declare"){
		var actionString = $('.selectedTool').attr('data-tag');
		var direction = "ltr"
		if( e && e.shiftKey){ direction = "rtl"}
		
		if(keyPressed==='\r' && actionString){
			PActx = TryOnePropertyByName(actionString, $atom ,direction);
	
			if( PActx && PActx.matchedTF ){//proprietà applicata con successo
				PActx.msg = actionString +" "+ firstValString
			}
		}
	}
	else{

		var $actions = searchEventHandler(keyPressed);
		//prova in ordine ogni azione
		for(var i=0;i<$actions.length;i++){
			var actionString
			var firstValString
			try {
				actionString = $actions[i].MNODE_getRoles('.function').children()[0].MNODE_getName();
				firstValString = $actions[i].MNODE_getRoles('.values').children()[0].MNODE_getName();	
			}
			catch(err) {}
			
			PActx = TryOnePropertyByName(actionString, $atom ,firstValString);
		
			if( PActx && PActx.matchedTF ){//proprietà applicata con successo
				PActx.msg = actionString +" "+ firstValString
				break
			}
		}


	}
	
	if(PActx == undefined){
		PActx = newPActx()//if no property was applied pass a dummy PActx
	}
	return PActx
}

function DnDpropInCanvasEnabled(propertiesDnD){
	//example: an element ci must be in canvas with data-tag="associativeDnD".  
	let $propInCanvas = $('#canvasRole [data-atom=ci][data-tag]')
	let propInCanvasEnabled 
	if (GLBsettings.tool='declare'){propInCanvasEnabled = $propInCanvas.filter('.selectedTool').toArray()}
	else{propInCanvasEnabled = $propInCanvas.toArray()}
	let namelist = propInCanvasEnabled.map(function(e){return e.getAttribute('data-tag')})
	// same name "associativeDnD" must be in  propertiesDnD
	//Adding a new DnD internal property:
	//add an element to the array, add a ci to the canvas with data-tag...
	let propertiesKnokedOut = propertiesDnD.map(function(e){
		let index = namelist.indexOf(e.name)
		if(index != -1){
			e.icon = propInCanvasEnabled[index].getAttribute('data-tagimg')
			return e
		}
		else{
			return undefined
		} 
	})

	let filtered = propertiesKnokedOut.filter(function(e){ return e!=undefined})
	return filtered
}




function directCall(key){
	return $('#canvasRole [data-rtl='+ key + ']')
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
	let candidates = Array.from( canvas.querySelectorAll('[data-atom=deftrue]') );
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




function RepeatedRefine_c($transform,key,selector){
	var i=0
	var semplificEffettuata = true; //la prima passata avviene come se la precedente avesse avuto successo.
	let $transformParentRole = $transform.parent()//se il transform viene sostituito, continua a cercare a partire da l suo parent
	while(semplificEffettuata == true && i<20){//limito il numero di tentativi per evitare loop infiniti
		var $toBesemplified = $transformParentRole.find('[data-atom]')
		if(selector){
			$toBesemplified = $toBesemplified.filter(selector)
		}
		var j= ($toBesemplified.length - 1)
    	semplificEffettuata = false;
    	while( j>=0){//prova a semplificare il j-esimo atomo, parti dal fondo
    		var refinementPActx = keyboardEvToFC($($toBesemplified[j]),key);
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