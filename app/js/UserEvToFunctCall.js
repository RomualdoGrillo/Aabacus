//UI Event to function call
//traduce i comandi dell'utente, in questo caso inpartiti via mouse e tastiera,
// in chiamate a funzioni del modulo ENODE



/**
 * Prova in ordine le azioni associate a un evento in #events (es. "c" = semplificazioni).
 * Usata dalla tastiera e dal refine post-proprietà (senza passare da keyboardEvToFC).
 */
function tryEventActionsOnNode($ENODE, eventKey) {
	let PActx
	const $actions = searchEventHandler(eventKey)
	for (let i = 0; i < $actions.length; i++) {
		let actionString
		let firstValString
		try {
			actionString = $actions[i].ENODE_getRoles('.function').children()[0].ENODE_getName()
			firstValString = $actions[i].ENODE_getRoles('.values').children()[0].ENODE_getName()
		} catch (err) {}

		PActx = TryOnePropertyByName(actionString, $ENODE, firstValString)
		if (PActx && PActx.error) { $($actions[i]).addClass('error').attr('error', PActx.msg) }
		else if (PActx && PActx.matchedTF) {
			PActx.msg = actionString + " " + firstValString
			break
		}
	}
	if (PActx == undefined) {
		PActx = newPActx()
	}
	return PActx
}

function keyboardEvToFC($ENODE, keyPressed,event){
	//if event is undefined, this is an internal call: use the property disregarding selectedTool
	let PActx 
	if(event && GLBsettings.tool=="declare" ){
		const actionString = $('.selectedTool').attr('data-tag');
		let direction = "ltr"
		if( event.shiftKey){ direction = "rtl"}
		
		if(keyPressed==='\r' && actionString){
			PActx = TryOnePropertyByName(actionString, $ENODE ,direction);
			if( PActx && PActx.matchedTF ){//proprietà applicata con successo
				PActx.msg = actionString + " "
			}
		}
	}
	else{
		PActx = tryEventActionsOnNode($ENODE, keyPressed)
	}
	
	if(PActx == undefined){
		PActx = newPActx()//if no property was applied pass a dummy PActx
	}
	return PActx
}


function getDnDpropEnabled(dataTag){
	// DnD abilitate: always-on (requiresCanvasCi false) + gated presenti come ci in canvas.
	let $propInCanvas = $('#canvasRole [data-enode=ci][data-tag]')
	if (GLBsettings.tool=='declare'){$propInCanvas = $propInCanvas.filter('.selectedTool,.selectedTool *')}
	if(dataTag){$propInCanvas = $propInCanvas.filter('[data-tag=' + dataTag + ']')}
	let propInCanvasEnabled = $propInCanvas.toArray()
	let namelist = propInCanvasEnabled.map(function(e){return e.getAttribute('data-tag')})
	let allDnD = listDnDProperties()
	let enabled = []
	for (let i = 0; i < allDnD.length; i++) {
		const d = allDnD[i]
		if (dataTag && d.name !== dataTag) { continue }
		const index = namelist.indexOf(d.name)
		if (!d.requiresCanvasCi || index !== -1) {
			enabled.push({
				name: d.name,
				findTgt: d.findTgt,
				apply: d.apply,
				icon: index !== -1 ? propInCanvasEnabled[index].getAttribute('data-tagimg') : undefined
			})
		}
	}
	return enabled
}

function searchEventHandler(event){// trova la definizione della proprietà
   let res
   const $found = $('#events').find('[data-enode="eventtoaction"]').filter(function(index){
        const $role = this.ENODE_getRoles('.event');
        if($role.length !== 1){
            console.warn('Role not found for event: ' + event);
            res = $()
            return res
        }
        const ENODE = $role.children()[0]
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
	let candidates = Array.from( canvasRole.querySelectorAll('[data-enode=deftrue]') );
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




//refineAfterProperty / markNeedsRefine: app/js/refine.js (post-applicazione delle proprietà)
