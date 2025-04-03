//UI Event to function call
//traduce i comandi dell'utente, in questo caso inpartiti via mouse e tastiera,
// in chiamate a funzioni del modulo ENODE



function keyboardEvToFC($ENODE, keyPressed,event){
	//if event is undefined, this is an internal call: use the property disregarding selectedTool
	var PActx 
	if(event && GLBsettings.tool=="declare" ){
		var actionString = $('.selectedTool').attr('data-tag');
		var direction = "ltr"
		if( event.shiftKey){ direction = "rtl"}
		
		if(keyPressed==='\r' && actionString){
			PActx = TryOnePropertyByName(actionString, $ENODE ,direction);
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
				actionString = $actions[i].ENODE_getRoles('.function').children()[0].ENODE_getName();
				firstValString = $actions[i].ENODE_getRoles('.values').children()[0].ENODE_getName();	
			}
			catch(err) {}
			
			PActx = TryOnePropertyByName(actionString, $ENODE ,firstValString);
			if( PActx && PActx.error){$($actions[i]).addClass('error').attr('error',PActx.msg)}
			else if( PActx && PActx.matchedTF ){//proprietà applicata con successo
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


function getDnDpropEnabled(dataTag){
	//get the list of hardwired DnD properties and return just the enabled ones
	//example: an element must be in canvas with data-tag="associativeDnD".  
	let $propInCanvas = $('#canvasRole [data-enode=ci][data-tag]') 
	if (GLBsettings.tool=='declare'){$propInCanvas = $propInCanvas.filter('.selectedTool,.selectedTool *')}
	if(dataTag){$propInCanvas = $propInCanvas.filter('[data-tag=' + dataTag + ']')}
	let propInCanvasEnabled = $propInCanvas.toArray()
	let namelist = propInCanvasEnabled.map(function(e){return e.getAttribute('data-tag')})
	// same name "associativeDnD" must be in  propertiesDnD
	//Adding a new DnD internal property:
	//add an element to the array, add a ci to the canvas with data-tag...
	let propertiesKnokedOut = propertiesDnD.map(function(e){
		let index = namelist.indexOf(e.name)
		if(index != -1){
			//get the icon from the reference element in the canvas
			e.icon = propInCanvasEnabled[index].getAttribute('data-tagimg')
			return e
		}
		else if(e.name=="replaceDnD"){
			e.icon = undefined
			return e
		}
		else{
			return undefined
		} 
	})

	let filtered = propertiesKnokedOut.filter(function(e){ return e!=undefined})
	return filtered
}

function searchEventHandler(event){// trova la definizione della proprietà
   var res
   var $found = $('#events').find('[data-enode="eventtoaction"]').filter(function(index){
        var $role = this.ENODE_getRoles('.event');
        if($role.length !== 1){
            console.warn('Role not found' + field);
            res = $()
            return res
        }
        var ENODE = $role.children()[0]
        if( ENODE !== undefined){
            return ENODE.ENODE_getName().toLowerCase() === event.toLowerCase()//case insensitive
        }
        else{
        	res = $()
        	return res
        }
    })
    if ($found.length !== 0){
        res = $found[0].ENODE_getRoles('.actions').children()
    }
    else{ res = $()}
    return  res
}




//searchForProperty('firstMember','distTimes')
function searchForProperty(field,value,returnedField){
	// trova la definizione della proprietà
	if( value == undefined){ return undefined}
	let candidates = Array.from( canvas.querySelectorAll('[data-enode=deftrue]') );
	let i=0;
	while(candidates[i]){
		let $role = candidates[i].ENODE_getRoles().filter('.' + field)
		if($role.length !== 1){
			console.warn('Role not found' + field);
		}
		let ENODEvalue = $role.children()[0]
		if(ENODEvalue !== undefined && ENODEvalue.ENODE_getName().toLowerCase() === value.toLowerCase() ){
		    //case insensitive
        	return   $( candidates[i].ENODE_getRoles().filter("." + returnedField ).children()[0] ) 
		}	
	i++}
}




function RepeatedRefine_c($transform,key,selector){
	var i=0
	var semplificEffettuata = true; //la prima passata avviene come se la precedente avesse avuto successo.
	let $transformParentRole = $transform.parent()//se il transform viene sostituito, continua a cercare a partire da l suo parent
	while(semplificEffettuata == true && i<20){//limito il numero di tentativi per evitare loop infiniti
		var $toBesemplified = $transformParentRole.find('[data-enode]')
		if(selector){
			$toBesemplified = $toBesemplified.filter(selector)
		}
		var j= ($toBesemplified.length - 1)
    	semplificEffettuata = false;
    	while( j>=0){//prova a semplificare il j-esimo ENODEo, parti dal fondo
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