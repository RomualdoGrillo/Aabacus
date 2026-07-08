function tabelline($toBeComp,firstVal,img){
	//limit to times
	let op = $toBeComp.attr('data-enode');
	if(op == "times"){
		//if a times operation is selected, operate on his children
		$toBeComp = $toBeComp[0].ENODE_getChildren()
	}
	else{
		const $parent=ENODEparent($toBeComp);
		op = $parent.attr('data-enode');
		if(op !== "times"){
			return 
			//return newPActx()
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
			if(  separateTensHundreds(value).length != 1 ){return}
		i++}
	return compose($toBeComp,firstVal,img);	
	}
	
}




function composePlusOnly($toBeComp,firstVal,img){
	const $parent=ENODEparent($toBeComp);
	const op = $parent.attr('data-enode');
	if(op !== "plus"){
		return 
		//return newPActx()
	}
	return compose($toBeComp,firstVal,img);
}

 
function decomposeTens($toBeDec,undefined,img){
	const PActx = newPActx();
	PActx.$operand = $toBeDec;
	let op = ""
	let $extOp = ""
	//var $toBeDec=$('.selected')
	//**** la funzione può essere applicata?
	if($toBeDec.length !== 1){console.log("cant decompose " + $toBeDec.length + " elements"); return}
	let TBDType = $toBeDec.attr("data-enode");
	if( TBDType != "cn" ){//se l'elemento da scomporre è un numero'
	console.log("can only decompose a cn not a" + TBDType ); return}
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
