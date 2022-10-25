function composePlusOnly($toBeComp,firstVal,img){
	var $parent=MNODEparent($toBeComp);
	var op = $parent.attr('data-atom');
	if(op !== "plus"){
		return 
		//return newPActx()
	}
	compose($toBeComp,firstVal,img);
}


function decomposeTens($toBeDec,undefined,img){
	var PActx = newPActx();
	PActx.$operand = $toBeDec;
	var op = ""
	var $extOp = ""
	//var $toBeDec=$('.selected')
	var TBDdataType = $toBeDec.attr("data-type")
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