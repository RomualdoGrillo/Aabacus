/**
 * Proprietà unary `tabelline`: `compose` limitato alle moltiplicazioni tra
 * due numeri "semplici" (una sola cifra significativa: 4, 90, 300...). Se è
 * selezionata un'operazione times opera sui suoi figli; se è selezionato un
 * solo elemento prova a comporlo con il fratello adiacente.
 * @param {JQuery} $toBeComp operazione times oppure fattore/i da comporre
 * @param {string} [firstVal] inoltrato a `compose`
 * @param {string} [img] path dell'immagine di feedback, inoltrato a `compose`
 * @returns {PActx} PActx fallito (`newPActx()`) se le precondizioni non valgono
 */
function tabelline($toBeComp,firstVal,img){
	//limit to times
	let op = $toBeComp.attr('data-enode');
	if(op == "times"){
		//if a times operation is selected, operate on his children
		$toBeComp = ENODE_getChildren($toBeComp[0])
	}
	else{
		const $parent=ENODEparent($toBeComp);
		op = $parent.attr('data-enode');
		if(op !== "times"){
			return newPActx()
		}
	}
	if($toBeComp.length==1){//in case you have 1 only item to be composed try to add a sibling
		$toBeComp = $toBeComposedWithSiblings($toBeComp)
	}
	if($toBeComp.length==2){
		//limit to simple numbers 4 , 90, 300 no nambers with multiple non zero digits
		let i=0;
		while($toBeComp[i]){
			let value = ENODEsToVal( $($toBeComp[i])).val
			if(  separateTensHundreds(value).length != 1 ){return newPActx()}
		i++}
	return compose($toBeComp,firstVal,img);	
	}
	return newPActx()
}




/**
 * Proprietà unary `composePlusOnly`: `compose` limitato agli addendi di un
 * `plus`.
 * @param {JQuery} $toBeComp addendo/i da comporre (il parent deve essere plus)
 * @param {string} [firstVal] inoltrato a `compose`
 * @param {string} [img] path dell'immagine di feedback, inoltrato a `compose`
 * @returns {PActx} PActx fallito (`newPActx()`) se il parent non è un plus
 */
function composePlusOnly($toBeComp,firstVal,img){
	const $parent=ENODEparent($toBeComp);
	const op = $parent.attr('data-enode');
	if(op !== "plus"){
		return newPActx()
	}
	return compose($toBeComp,firstVal,img);
}

 
/**
 * Proprietà unary `decomposeTens`: scompone un numero (`cn`) nella somma di
 * unità/decine/centinaia via `separateTensHundreds`, avvolgendolo se
 * necessario in un `plus`; l'ultimo termine resta selezionato.
 * @param {JQuery} $toBeDec numero da scomporre (esattamente un elemento `cn`)
 * @param {*} [undefined] secondo parametro ignorato (nel sorgente è
 *   dichiarato letteralmente con nome `undefined`)
 * @param {string} [img] path dell'immagine di feedback
 * @returns {PActx} fallito se le precondizioni non valgono o se il numero non
 *   è scomponibile
 */
function decomposeTens($toBeDec,undefined,img){
	const PActx = newPActx();
	PActx.$operand = $toBeDec;
	let op = ""
	let $extOp = ""
	//var $toBeDec=$('.selected')
	//**** la funzione può essere applicata?
	if($toBeDec.length !== 1){console.log("cant decompose " + $toBeDec.length + " elements"); return PActx}
	let TBDType = $toBeDec.attr("data-enode");
	if( TBDType != "cn" ){//se l'elemento da scomporre è un numero'
	console.log("can only decompose a cn not a" + TBDType ); return PActx}
	//**** applica la funzione
	const toBeDec = ENODEsToVal($toBeDec)
	//var primeFactors = primeFactorization(number);
	let terms = separateTensHundreds(toBeDec.val);	
	if(terms.length >1){
		let $extOp = wrapIfNeeded($toBeDec,'plus');//se necessario crea una operazione container
		terms.forEach(function(e,i){
			let $clone = identifierToENODE(e);
			ENODEinsertAfter($clone, $toBeDec);
			if(i == (terms.length -1)){
				$clone.addClass('selected');// l'ultimo fattore rimane selezionato
			}
		})
		ENODEremove($toBeDec);
		PActx.matchedTF = true;
		PActx.replacedAlready = true;
		PActx.visualization = img;
		PActx.msg = "decomposeTens" 	
	}
	return PActx
}

function $toBeComposedWithSiblings($selected){
	let $ENODEBesideSelected
	//Attualmente il contenuto dei role si dispone leftRight e topDown mentre comporre è visto come left e down.
	//di conseguenza per decidere qual'è l'elemento con cui comporre devo distiguere a seconda dell'orientazione.'
	if( $selected.parent().css('flex-direction') === "row"){
		$ENODEBesideSelected = $selected.prevAll('[data-enode]:first');
	}
	else{
		$ENODEBesideSelected = $selected.nextAll('[data-enode]:first');
	}
	$selected = $selected.add($ENODEBesideSelected);
	//debug colors
	$('*').removeClass("toBeComposed");
	//Debug add colors
	ENODEnodesAddClass($selected,"toBeComposed");
	return 	$selected
}

registerHardWiredMap({
	tabelline: tabelline,
	composePlusOnly: composePlusOnly,
	decomposeTens: decomposeTens
})
