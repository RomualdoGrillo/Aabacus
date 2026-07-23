//UI Event to function call
//traduce i comandi dell'utente, in questo caso inpartiti via mouse e tastiera,
// in chiamate a funzioni del modulo ENODE



/**
 * Prova in ordine le azioni associate a un evento in #events (es. "c" = semplificazioni),
 * fermandosi alla prima che va a segno (via TryOnePropertyByName).
 * Usata dalla tastiera e dal refine post-proprietà (senza passare da keyboardEvToFC).
 * @param {JQuery} $ENODE - Nodo/i ENODE su cui tentare le azioni.
 * @param {string} eventKey - Chiave dell'evento da cercare in #events (case insensitive).
 * @returns {PActx} Il contesto dell'ultima proprietà tentata (matchedTF true se applicata), o un PActx nuovo/fallito se nessuna azione è definita.
 */
function tryEventActionsOnNode($ENODE, eventKey) {
	let PActx
	const $actions = searchEventHandler(eventKey)
	for (let i = 0; i < $actions.length; i++) {
		let actionString
		let firstValString
		try {
			actionString = ENODE_getName(ENODE_getRoles($actions[i], '.function').children()[0])
			firstValString = ENODE_getName(ENODE_getRoles($actions[i], '.values').children()[0])
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

/**
 * Traduce un tasto premuto in una chiamata di proprietà: in modalità "declare"
 * con Invio applica il tool selezionato (.selectedTool; Shift = direzione rtl),
 * altrimenti delega alle ricette di #events via tryEventActionsOnNode.
 * @param {JQuery} $ENODE - Nodo/i ENODE selezionati su cui applicare la proprietà.
 * @param {string} keyPressed - Carattere corrispondente al tasto premuto.
 * @param {JQuery.Event} [event] - Evento keydown originale; se undefined è una chiamata interna che ignora il selectedTool.
 * @returns {PActx} Il contesto della proprietà applicata, o un PActx nuovo/fallito se nessuna proprietà è stata applicata.
 */
function keyboardEvToFC($ENODE, keyPressed,event){
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


/**
 * Calcola le proprietà DnD abilitate: le always-on (requiresCanvasCi false) più
 * quelle gated presenti come ci[data-tag] in canvas (in modalità "declare" contano
 * solo i ci del tool selezionato). Legge listDnDProperties() e conserva l'ordine
 * di registrazione (priorità first-wins in DnD.js).
 * @param {string} [dataTag] - Se presente, filtra per il solo data-tag indicato.
 * @returns {Array<{name: string, findTgt: Function, apply: Function, icon: (string|undefined)}>} Descrittori abilitati; icon proviene dal data-tagimg del ci in canvas, se presente.
 */
function getDnDpropEnabled(dataTag){
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
        const $role = ENODE_getRoles(this, '.event');
        if($role.length !== 1){
            console.warn('Role not found for event: ' + event);
            res = $()
            return res
        }
        const ENODE = $role.children()[0]
        if( ENODE !== undefined){
            return ENODE_getName(ENODE).toLowerCase() === event.toLowerCase()//case insensitive
        }
        else{
        	res = $()
        	return res
        }
    })
    if ($found.length !== 0){
        res = ENODE_getRoles($found, '.actions').children()
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
		let $role = ENODE_getRoles(candidates[i]).filter('.' + field)
		if($role.length !== 1){
			console.warn('Role not found' + field);
		}
		let ENODEvalue = $role.children()[0]
		if(ENODEvalue !== undefined && ENODE_getName(ENODEvalue).toLowerCase() === value.toLowerCase() ){
		    //case insensitive
        	return   $( ENODE_getRoles(candidates[i]).filter("." + returnedField ).children()[0] ) 
		}	
	i++}
}




//refineAfterProperty / markNeedsRefine: app/js/refine.js (post-applicazione delle proprietà)
