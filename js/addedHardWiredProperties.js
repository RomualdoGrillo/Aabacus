function tabelline($toBeComp,firstVal,img){
	//limit to times
	var op = $toBeComp.attr('data-atom');
	if(op == "times"){
		//if a times operation is selected, operate on his children
		$toBeComp = $toBeComp[0].MNODE_getChildren()
	}
	else{
		var $parent=MNODEparent($toBeComp);
		op = $parent.attr('data-atom');
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
			let value = AtomsToVal( $($toBeComp[i])).val
			if(  separateTensHundreds(value).length != 1 ){return}
		i++}
	return compose($toBeComp,firstVal,img);	
	}
	
}




function composePlusOnly($toBeComp,firstVal,img){
	var $parent=MNODEparent($toBeComp);
	var op = $parent.attr('data-atom');
	if(op !== "plus"){
		return 
		//return newPActx()
	}
	return compose($toBeComp,firstVal,img);
}

 
function decomposeTens($toBeDec,undefined,img){
	var PActx = newPActx();
	PActx.$operand = $toBeDec;
	var op = ""
	var $extOp = ""
	//var $toBeDec=$('.selected')
	//**** la funzione può essere applicata?
	if($toBeDec.length !== 1){console.log("cant decompose " + $toBeDec.length + " elements"); return}
	let TBDType = $toBeDec.attr("data-atom");
	if( TBDType != "cn" ){//se l'elemento da scomporre è un numero'
	console.log("can only decompose a cn not a" + TBDType ); return}
	//**** applica la funzione
	var toBeDec = AtomsToVal($toBeDec)
	//var primeFactors = primeFactorization(number);
	let terms = separateTensHundreds(toBeDec.val);	
	if(terms.length >1){
		$extOp = encaseIfNeeded($toBeDec,'plus');//se necessario crea una operazione container
		var prototype=prototypeSearch("cn","num")
		terms.forEach(function(e,i){
			$clone = MNODEclone(prototype);
			$clone.attr('data-atom','cn');
			$clone[0].MNODE_setName(e)
			$clone.insertAfter($toBeDec);
			if(i == (terms.length -1)){
				$clone.addClass('selected');// l'ultimo fattore rimane selezionato
			}
		})
		$toBeDec.remove();
		PActx.matchedTF = true;
		PActx.replacedAlready = true;
		PActx.visualization = img;
		PActx.msg = "decomposeTens" 	
	}
	return PActx
}

function $toBeComposedWithSiblings($selected){
	var $AtomBesideSelected
	//Attualmente il contenuto dei role si dispone leftRight e topDown mentre comporre è visto come left e down.
	//di conseguenza per decidere qual'è l'elemento con cui comporre devo distiguere a seconda dell'orientazione.'
	if( $selected.parent().css('flex-direction') === "row"){
		$AtomBesideSelected = $selected.prevAll('[data-atom]:first');
	}
	else{
		$AtomBesideSelected = $selected.nextAll('[data-atom]:first');
	}
	$selected = $selected.add($AtomBesideSelected);
	//debug colors
	$('*').removeClass("toBeComposed");
	//Debug add colors
	MNODEnodesAddClass($selected,"toBeComposed");
	return 	$selected
}