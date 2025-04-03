function newPActx() {
	//msg: in caso data di matchedTF=true contiene il nome della proprietà applicata
	//in caso contrario dovrebbe contenere il motivo del noMatch.
	//$transform deve contenere il più grande elemento trasformato
	return {
		matchedTF: false,
		msg: "", visualization: "",
		$cloneProp: undefined,
		$pattern: undefined,
		$operand: undefined,
		$transform: undefined,//must be the the biggest element changed, his parent will be considered when upadating infix ecc..
		$equation: undefined,
		replacedAlready: false,
		lineList: $(),
		error: false
	}
}

class PropertyDnD {
	constructor(name, findTgt, apply, icon) {
		this.name = name
		this.findTgt = findTgt//return valid target roles
		this.apply = apply	// in onEndHandler when an element is dropped on a valid target apply($dropped,$target) 
		this.icon = icon //handler of event fired when a valid dragged is added to a valid role
	}
}

let propertiesDnD = [
	//PRIORITY: last property overwrites previous targets
	new PropertyDnD('associativeDnD', immediateAssValid, ENODEassociate, ""),
	new PropertyDnD('distributiveDnD', validForDist, ENODEdistribute, ""),
	new PropertyDnD('partDistributDnD', validForPartDist, ENODEPartDistribute, ""),
	new PropertyDnD('collectDnD', validForColl, ENODEcollect, ""),
	new PropertyDnD('partCollectDnD', validForPartColl, ENODEpartCollect, ""),
	new PropertyDnD('replaceDnD', validReplaced, ENODELinkReplace, ""),
	new PropertyDnD('modusPonensDnD', validModusPonens, ENODEModusPonens, ""),
	new PropertyDnD('forThisDnD', forThisValid, forThisPar_focus_nofocus, ""),
	new PropertyDnD('removeRedundantDnD', validRedundant, removeRedundant, ""),
	new PropertyDnD('addRedundantDnD', validAddRedundant, addRedundant, ""),
	new PropertyDnD('hanoiMoveDnD', validhanoiMove, hanoiMove, "")
]




function ENODEneedsBracket($ENODE) {
	var ENODEclass = $ENODE.attr('data-enode')  //
	var parentClass = ENODEparent($ENODE).attr('data-enode')//
	// futuribile:
	//var parentRole = da completare per poter distinguere se in quale "role" è contenuto
	//la stringa che identifica la posizione dovrebbe diventare <ENODEtype>.<role>


	//in each row: first element needs bracket if contained in itself or one of the elements in his row
	var MatrixBaracketNeeded = [
		["plus", "times", "power"],// first container
		["times", "power"],
		["minus"],
		["m_inverse"],
		["and"],
		["or"]
	];
	//check PEMDAS order of operations 
	var ENODEclassIndex = getCol(MatrixBaracketNeeded, 0).indexOf(ENODEclass)
	if (ENODEclassIndex != -1) {
		var row = MatrixBaracketNeeded[ENODEclassIndex];
		if (row.indexOf(parentClass) != -1) {// found in matrix
			return true
		}
	}
	//check if plus timess etc.. have one or zero children
	let needMoreThanOneChild = ["plus", "times", "power"]
	if (needMoreThanOneChild.indexOf(ENODEclass) != -1 &&
		$ENODE[0].ENODE_getChildren().length < 2) {
		return true //highlight 0 or one child
	}
	return false // bracket not needed
}





function opIsDistDop(op, opD) {// string ex: plus times 
	//opIsDistDop('times') cerca su chi si distribuicse times
	//opIsDistDop('','plus') cerca quale operazione è distributiva su plus
	let key_distributesOver_Val = { 'times': 'plus', 'power': 'times', 'and': 'or' }
	if (op != "") {
		return key_distributesOver_Val[op]
	}
	else if (opD) {
		return getKeyByValue(key_distributesOver_Val, opD)
	}

}




function OpIsAssociative(op/* string ex: plus times*/) {
	var associatives = ["plus", "times", "or", "and"]
	return associatives.indexOf(op) !== -1 //class is in list of associatives?
}


function revert(event) {//revert a sortablejs onAdd event
	let nextChildren = event.from.children[event.oldIndex]
	if (nextChildren) {
		event.from.insertBefore(event.item, nextChildren);
	}
	else {
		event.from.append(event.item)
	}
	event.clone.remove();
}

function forThisValid(mouseDownNode) {
	let dataType = mouseDownNode[0].getAttribute('data-type');
	let $excludedForall = $identifierSpanForAll($(mouseDownNode)).filter('[data-enode=forAll]');
	let forAlls = $('[data-enode=forAll]:visible').not($excludedForall).toArray();//querySelectAll does not work with :visible?
	let $parameters = $()
	let i = 0
	while (forAlls[i]) {
		$parameters = $parameters.add(GetforAllHeader($(forAlls[i])).find('[data-enode]'));
		i++
	}

	let $valids = $parameters.filter(function (i, el) { return typeOk(mouseDownNode, $(el)) });
	return $valids
}

function immediateAssValid($mouseDownENODE) {
	const $parent = ENODEparent($mouseDownENODE);
	let op;
	if ($parent !== undefined) { op = $parent.attr("data-enode") }
	let $validTargetRoles = $();
	if (OpIsAssociative(op)) {
		let $validTgtENODEs = $ImmediateAssociativeENODE($parent)
		// to get every associative target (not just immediate):
		//let $validTgtENODEs = $RecursiveTreeExplorerCriterium($parent,$ImmediateAssociativeENODE)
		$validTgtENODEs.each(function (i, e) {
			$validTargetRoles = $validTargetRoles.add(e.ENODE_getRoles());
		});
	}
	return $validTargetRoles
}

function ENODEassociate(dragged, target, dropped) {
	//dropped has been inserted already, just remove dragged if not cloning
	var PActx = newPActx();
	if ($(dropped).hasClass('toBeCloned')) {
		$(dropped).removeClass('toBeCloned');
	}
	else {
		$(dragged).remove(); // if not cloning, clone was useful to visualize the starting point 	
	}
	PActx.matchedTF = true;
	PActx.replacedAlready = true;
	PActx.msg = "associated";
	//PActx.$transform = target.parent().parent()//not optimized, should update the older closest common parent
	return PActx;
}



function getKeyByValue(dictionary, value) {
	for (var prop in dictionary) {
		if (dictionary.hasOwnProperty(prop)) {
			if (dictionary[prop] === value)
				return prop;
		}
	}
}



function validForPartDist($mouseDownENODE, ctrlOrMeta) {
	if (ctrlOrMeta) {
		return []
	}
	let $parent = ENODEparent($mouseDownENODE);
	var $siblings = $parent.siblings('[data-enode]');
	if ($siblings.length == 0) { return $() }//nothing to distribute
	let opD = undefined;
	if ($parent !== undefined) { opD = $parent.attr("data-enode") }
	let op = opIsDistDop("", opD);
	if (op && ENODEparent($parent).attr("data-enode") == op) {
		return ENODEparent(ENODEparent($parent)).find('>.ul_role')
		//return ENODEparent($parent).find('>.ul_role')
	}
	/*
	if(op && ENODEparent($parent).attr("data-enode") === op){//check if parent of parent is the right op
		if(ENODEparent(ENODEparent($parent))){
			return ENODEparent(ENODEparent($parent))
		}
		else{
			return wrapWithOperation($siblingsT,op)
		}
	}
	*/
	return $()
}



function validForDist($mouseDownENODE, ctrlOrMeta, altKey) {//op2 è il tipo di operazione sulla quale si distribuisce
	if (ctrlOrMeta || altKey) {
		return []
	}
	var $parent = ENODEparent($mouseDownENODE);
	let op = undefined;
	if ($parent !== undefined) { op = $parent.attr("data-enode") }
	let opD = opIsDistDop(op);

	if (opD !== undefined) {
		//return $mouseDownENODE.siblings().filter("[data-enode="+opD+"]")	
		$validENODEs = $mouseDownENODE.siblings().filter("[data-enode=" + opD + "]")
		/*
		let $validTargets = $()
		let i=0;
		
		while($validENODEs[i]){
			$validTargets = $validTargets.add($validENODEs[i].ENODE_getRoles()[0])
		i++	
		} 	
		return $validTargets*/
		return $validENODEs
	}
	return [] //empty array
}

function ENODEPartDistribute($dragged, target, dropped) {
	var PActx = newPActx();
	PActx.replacedAlready = true;
	let childrenIndex = ENODEparent($dragged).index()
	let $parent = ENODEparent($dragged);
	let opD;
	if ($parent !== undefined) { opD = $parent.attr("data-enode") }
	let op = opIsDistDop("", opD);
	var $siblings = $parent.siblings('[data-enode]'); // ottieni la lista degli altri fattori
	$extOp = wrapIfNeeded(ENODEparent($parent), opD);//se necessario crea una operazione container
	let $prototype = prototypeSearch(op);
	let $clone = ENODEclone($prototype)//create times
	$clone.insertBefore(dropped);
	$siblings.each(function (i, e) {
		var $siblingClone = ENODEclone($(e));
		$clone[0].ENODE_getRoles().append($siblingClone);
	});
	let previous = $clone[0].ENODE_getRoles().children().eq(childrenIndex - 1);
	$dragged.insertAfter(previous);
	$parent.addClass("Refine_c");
	dropped.remove();
	PActx.$transform = $parent;
	PActx.matchedTF = true
	return PActx
}

function ENODEdistribute($dragged, target, dropped) {
	var PActx = newPActx();
	PActx.replacedAlready = true;
	let $parent = ENODEparent($dragged);
	let op = undefined;
	if ($parent !== undefined) { op = $parent.attr("data-enode") }
	let opD = opIsDistDop(op);
	var $prototype = prototypeSearch(op)// for example search for times proto
	$(target)[0].ENODE_getChildren().each(function (i, e) {
		e.classList.add("Refine_c");
		var $clone = ENODEclone($prototype)//create times
		var $cloneDragged = ENODEclone($dragged)// clone dragged
		$clone.insertBefore($(this));
		$clone[0].ENODE_getRoles().append($cloneDragged);
		if ($dragged.index() > target.index()) {
			$clone[0].ENODE_getRoles().prepend($(this));
		}
		else {
			$clone[0].ENODE_getRoles().append($(this));
		}
		//$cloneDragged.css({display:""})
	})
	var $draggedParent = $dragged[0].ENODEparent();
	$draggedParent.addClass("Refine_c");//mark external operation as remove if pointless
	$(target).addClass("Refine_c");//mark target operation as remove if pointless
	$dragged.remove();
	PActx.$transform = $parent;
	PActx.matchedTF = true
	return PActx
}

function validForColl($mouseDownENODE) {
	var $parent = ENODEparent($mouseDownENODE);
	var op = undefined
	if ($parent !== undefined) { op = $parent.attr("data-enode") };//look for targets
	var opD = opIsDistDop(op);
	//$('*').removeClass('ToBeCollected').removeClass('CouldBeCollected');//evidenziore l'imbastitura e rimuoverla in unica funzione
	//*******test preliminari
	if ($parent == undefined) {
		return $() //empty $ array
	}
	var $parentParent = ENODEparent($parent);
	if (
		opD == undefined
		||
		$parentParent == undefined
		||
		$parentParent.attr('data-enode') !== opD
	) {
		return $() //empty $ array
	}
	//***** test su ciascun termine
	var $terms = $parentParent[0].ENODE_getChildren() // ottieni la lista degli addendi
	for (i = 0; i < $terms.length; i++) {
		var term = $terms[i]
		var okForThisTerm = false;
		if ($(term).attr('data-enode') == op) {// se l'addendo è di tipo times controlla ogni fattore
			var $factors = term.ENODE_getChildren()
			for (j = 0; j < $factors.length; j++) {
				var factor = $factors[j]
				//console.log("controllo factor");
				//console.log(factor);
				if (ENODEEqual(factor, $mouseDownENODE[0])) {
					$(factor).addClass("CouldBeCollected")
					okForThisTerm = true;
					break
				}
			}
		}
		else {// altrimenti controlla lui stesso
			if (ENODEEqual(term, $mouseDownENODE[0])) {
				$(term).addClass("CouldBeCollected")
				okForThisTerm = true;
			}
		}
		if (okForThisTerm === false) {
			//console.log("term without such factor");
			//console.log(term);
			return $()
		}
	};
	console.log('okForCollection')
	//return $parentParent[0].ENODE_getRoles()
	return ENODEparent($parentParent).find('>.ul_role')//target is the external ENODE	
}

function validForPartColl($mouseDownENODE) {
	var $parent = ENODEparent($mouseDownENODE);
	if ($parent == undefined) {
		return $() //empty $ array
	}
	var $valids = $();
	var $plusParent;
	var opP;
	var opT;
	var op = $parent.attr("data-enode");
	var opP = opIsDistDop(op);
	if (opP) {// dragged is into a "times"
		$plusParent = ENODEparent($parent);//candidate plus parent will be checked later
		opT = op
	}
	else {
		//check if the dragged is directrly into a "plus"
		opT = opIsDistDop("", op);
		if (opT !== undefined) {
			opP = op;
			$plusParent = $parent;
			$parent = $mouseDownENODE;
		}
	}

	//$('*').removeClass('ToBeCollected').removeClass('CouldBeCollected');//evidenziore l'imbastitura e rimuoverla in unica funzione
	//*******test preliminari

	if (
		opP == undefined //if no distributive operation is found
		||
		$plusParent == undefined
		||
		$plusParent.attr('data-enode') !== opP
	) {
		return $() //empty $ array
	}
	//***** test su ciascun termine
	var $siblings = $parent.siblings('[data-enode]')
	for (i = 0; i < $siblings.length; i++) {
		var term = $siblings[i]
		var okForThisTerm = false;
		if ($(term).attr('data-enode') == opT) {// se l'addendo è di tipo times controlla ogni fattore
			var $factors = term.ENODE_getChildren()
			for (j = 0; j < $factors.length; j++) {
				var factor = $factors[j]
				//console.log("controllo factor");
				//console.log(factor);
				if (ENODEEqual(factor, $mouseDownENODE[0])) {
					$valids = $valids.add(factor);
				}
			}
		}
		else {// altrimenti controlla lui stesso
			if (ENODEEqual(term, $mouseDownENODE[0])) {
				$valids = $valids.add(term);
			}
		}
	};
	return $valids
}

function ENODEpartCollect($dragged, $target) {
	var PActx = newPActx();
	PActx.replacedAlready = true;
	let $targetParent = ENODEparent($target);
	let $siblingsT = $target.siblings('[data-enode]')
	let opt = $targetParent.attr("data-enode")

	let $draggedParent = ENODEparent($dragged);
	let $siblingsD = $dragged.siblings('[data-enode]')
	let opd = $draggedParent.attr("data-enode")

	let $commonGranParent = ENODEparent($targetParent);
	$commonGranParent.addClass("Refine_c");


	if (opt == opd && opIsDistDop(opt)) {//both have same distributable op
		var opPlus = opIsDistDop(opt)//opPlus may be plus,or, other operation over wich you distribute 
		var $prototype = prototypeSearch(opPlus)
		var $opPlus
		var $termT
		var $termD
		if ($siblingsT.length == 1) {
			if ($siblingsT.eq(0).attr("data-enode") == opPlus) {//if 'plus' ther's no need to create a new plus container
				$opPlus = $siblingsT
				$termT = $siblingsT[0].ENODE_getChildren()
				$termT.remove();//svuoto il target plus e poi lo riempio ordinatamente
				//il plus si trova già all'interno del target, quindi non lo sposto
			}
			else {
				$termT = $siblingsT;
			}
		}
		else {
			$termT = (wrapWithOperation($siblingsT, opt));
		}
		if ($siblingsD.length == 1) {
			if (!$opPlus && $siblingsD.eq(0).attr("data-enode") == opPlus) {//if 'plus' ther's no need to create a new plus container
				$opPlus = $siblingsD
				$termD = $siblingsD[0].ENODE_getChildren()
				$termD.remove();//svuoto il target plus e poi lo riempio ordinatamente
				$opPlus.insertBefore($termT);//preferisco mettere sempre il plus all'interno del target 
				$termT.remove();
			}
			else {
				$termD = $siblingsD;
			}
		}
		else {
			$termD = (wrapWithOperation($siblingsD, opt));
		}
		if (!$opPlus) {//if a suitable "plus" container has not been found create a new one
			$opPlus = ENODEclone($prototype)//create times
			$opPlus.insertBefore($termT);
			$termT.remove();
		}
		var $plusRole = $opPlus[0].ENODE_getRoles()
		if ($targetParent.index() > $draggedParent.index()) {//order of terms is inherited from order of oarents
			$plusRole.append($termD);
			$plusRole.append($termT);
		}
		else {
			$plusRole.append($termT);
			$plusRole.append($termD);
		}
		PActx.$transform = ENODEparent($draggedParent);
		$draggedParent.remove()
		PActx.matchedTF = true
		return PActx
	}
}

function ENODEcollect($dragged, $target) {
	var PActx = newPActx();
	PActx.replacedAlready = true;
	let $parent = ENODEparent($dragged);
	let $parentParent = ENODEparent($parent);
	let op = undefined;
	if ($parent !== undefined) { op = $parent.attr("data-enode") }
	var extOp
	extOp = wrapIfNeeded($parentParent, op)
	ENODEparent($dragged).addClass("Refine_c")
	ENODEparent($(".CouldBeCollected")).addClass("Refine_c")
	//$dragged.insertBefore($parentParent);
	$dragged.remove();
	//$(".CouldBeCollected").remove()
	$parentParent.find(".CouldBeCollected").remove()
	$parentParent.addClass("Refine_c");
	PActx.$transform = extOp;
	PActx.matchedTF = true
	return PActx
}

function compose($toBeComp, firstVal, img) {
	var $originaltoBeComp = $toBeComp //per poter ripristinare lo stato iniziale
	var PActx = newPActx();
	//**** la funzione può essere applicata?
	var $parent = ENODEparent($toBeComp);
	var op = $parent.attr('data-enode');
	if ($toBeComp.length == 0) { PActx.msg = ("nothing selected"); return PActx }
	//se 1 solo selezionato cerca di comporlo con l'antecedente'
	if ($toBeComp.length == 1) {
		//---tenta semplificazioni banali
		//controlla se si tratta di elemento neutro, in tal caso fallo semplicemente sparire.
		/*
		var tBcClass = $toBeComp.attr("data-enode"); 
		if( tBcClass === "cn" || tBcClass === "ci"){
			var name = $toBeComp[0].ENODE_getName()
			if( (op === "times" && name === "1")||
				(op === "plus" && name === "0")||
				(op === "and" && name === "true")||
				(op === "or" && name === "false") ){
				//$toBeComp.remove()
				//PActx.replacedAlready=true;
				PActx.$operand = $toBeComp;
				PActx.$transform= $([]);
				PActx.matchedTF = true;
				return	PActx
			}
		}
		*/
		$toBeComp = $toBeComposedWithSiblings($toBeComp);//aventually add siblings to be composed
	}
	if (!checkSiblings($toBeComp)) { PActx.msg = ("not siblings"); return PActx }
	//*** calcolo generale 
	//Pattern Matching
	ENODESmarkUnmark($toBeComp, "d")
	//calcolo via algoritmi specifici
	if (op !== "plus" && op !== "times" && op !== "or") { PActx.msg = ("no composition defined for: " + op); return PActx };
	//**** calcolo via algoritmo ****

	var partial = undefined
	for (var i = 0, len = $toBeComp.length; i < len; i++) {//for perchè potrebbe sommare o moltiplicare una lista di n elementi
		var currToBeComp = ENODEsToVal($($toBeComp[i]));
		if (currToBeComp.val == 0 && currToBeComp.exp == -1) {// controlla che non sia /0
			console.warn("1/0 is meaningless")
			PActx.matchedTF = false;//non procedere alla sostituzione
			break
		}
		if (currToBeComp.type !== "cn" && currToBeComp.type !== "ci") {// trovato elemento "indigesto"
			partial = currToBeComp
			PActx.matchedTF = false;
			break
		}
		if (partial == undefined) {//*** prima iterazione, il risultato parziale coincide con il primo operando
			partial = currToBeComp;
		}
		else {
			if (op === "times") {
				//conteggia segni
				partial.sign = partial.sign * currToBeComp.sign;
				//conteggia il valore
				if (partial.val == 1) {//se il parziale ha valore 1
					partial.val = currToBeComp.val;
					partial.exp = currToBeComp.exp;
					partial.type = currToBeComp.type;
					PActx.matchedTF = true;//composed!!
				}
				else if (currToBeComp.val == 1) {
					//se valore currToBeComp ha valore 1, non è necessario modificare altro oltre il segno che è già stato computato
					PActx.matchedTF = true;//composed!!
				}
				else if (partial.val === currToBeComp.val && (partial.exp == currToBeComp.exp * -1)) {//reciproci? C.E. se ha senso l’esp iniziale lo ha anche questa operazione
					partial.exp = 1;
					partial.val = 1;
					partial.type = "cn";
					PActx.matchedTF = true;//composed!!
				}
				else if (currToBeComp.type === "cn" && partial.type === "cn" && (partial.exp == currToBeComp.exp)) {//esponenti concordi
					partial.val = partial.val * currToBeComp.val;
					PActx.matchedTF = true;//composed!!
				}
				else if (partial.val == 0 || currToBeComp.val == 0) {
					partial.val = 0;
					PActx.matchedTF = true;//composed!!
				}
				else if (false) {
					var num
					var den
					if (partial.exp == 1) {
						num = partial.val;
						den = currToBeComp.val;
					}
					else {
						num = currToBeComp.val;
						den = partial.val;
					}
					if (num % den == 0) {//divisione tra interi ?? tarpare ??
						partial.val = num / den;
					}
					else {
						//partial.canBeReplaced = false;
						PActx.matchedTF = false;//se nessun tentativo è andato a buon fine...
						break
					}
				}
				else if (partial.val === currToBeComp.val && partial.type == "ci") {//reciproci? C.E. se ha senso l’esp iniziale lo ha anche questa operazione
					partial.exp = partial.exp + currToBeComp.exp;
					PActx.matchedTF = true;//composed!!
				}
				else {
					//partial.canBeReplaced = false;
					PActx.matchedTF = false;//se nessun tentativo è andato a buon fine...
					break
				}
			}
			else if (op === "plus") {

				if (partial.val == 0) {//se il parziale ha valore 0
					partial = currToBeComp;
					PActx.matchedTF = true;//composed!!
				}
				else if (currToBeComp.val == 0) {//se valore currToBeComp ha valore 0, non è necessario modificare 
					PActx.matchedTF = true;//composed!!
				}
				else if (currToBeComp.type === "cn" && partial.type === "cn") {//numerici
					//compute algebric val
					var algRes = currToBeComp.val * currToBeComp.sign + partial.val * partial.sign;
					partial.val = Math.abs(algRes);
					partial.sign = Math.sign(algRes)
					PActx.matchedTF = true;//composed!!
				}
				else if (currToBeComp.type === "ci" && partial.type === "ci" && (currToBeComp.exp == partial.exp) && (currToBeComp.sign == partial.sign * -1)) {//opposti?
					partial.val = 0;
					partial.exp = 1;
					partial.sign = 1;
					PActx.matchedTF = true;//composed!!
				}
				else {
					//partial.canBeReplaced = false;
					break
				}

			}
			else if (op === "and") {
				partial = currToBeComp
				//partial.canBeReplaced = false;
				break

			}
		}
	}
	//if( partial.canBeReplaced){ 
	if (PActx.matchedTF == true) {
		///****Create Result********
		$composed = ValToENODEs(partial);
		$composed.addClass('selected');//selezione in uscita
		PActx.$operand = $toBeComp;
		PActx.msg = "compose";


		PActx.replacedAlready = true;
		$composed.insertBefore(PActx.$operand[0]);
		PActx.$operand.remove()
		//ExtendAndInitializeTree($composed);
		$parent.addClass('Refine_c');
		PActx.$transform = $parent;
		PActx.visualization = img
	}
	else {//rimetti le cose come stavano tranne le semplificazioni iniziali
		$('.selected').removeClass('selected')
		$originaltoBeComp.addClass('selected')
		ENODESmarkUnmark($toBeComp, "")
	}
	return PActx
}
function decomposeInAProduct($toBeDec, firstVal, img) {
	return decompose($toBeDec, "up", img);
}
function decomposeInASum($toBeDec, firstVal, img) {
	return decompose($toBeDec, "right", img);
}


function decompose($toBeDec, direction, img) {//"up" for factorize
	var PActx = newPActx();
	PActx.$operand = $toBeDec;
	var op = ""
	var $extOp = ""
	//var $toBeDec=$('.selected')
	var TBDdataType = $toBeDec.attr("data-type")
	//**** la funzione può essere applicata?
	if ($toBeDec.length !== 1) { console.log("cant decompose " + $toBeDec.length + " elements"); return }
	//**** applica la funzione
	var toBeDec = ENODEsToVal($toBeDec)
	if (TBDdataType === "num") {
		//scomposizione di un numero in verticale è fattorizzazione : op = times
		if (direction === "up") {
			op = "times";
			if ($toBeDec.attr('data-enode') === 'minus') {
				var $minus = $toBeDec
				//******crea nuovo ENODEo
				var minusOne = { type: "cn", val: 1, sign: -1, exp: 1 }
				var $minusOne = ValToENODEs(minusOne);

				//stabilisci dove va aggiunto il -1
				var $minusParent = ENODEparent($minus);
				var $minusContent = $minus[0].ENODE_getChildren();
				$extOp = $minusParent;
				if ($minusParent.attr('data-enode') == 'times') {//aggiungi il -1 all'interno del minus parent
					$minusOne.insertBefore($minus);
				}
				else {
					if ($minusContent.attr('data-enode') !== 'times') {//è necessario aggiungere una enclosure di tipo "times"
						$minusContent = wrapWithOperation($minusContent, 'times')
					}
					$minusContent[0].ENODE_getRoles().prepend($minusOne);
				}
				//******Rimuovi il MINUS
				$minusContent.insertAfter($minus);
				$minusContent.addClass("Refine_c");//if the content was a "times" it may by dissolved if the parent is also times
				$minus.remove();

				//var $roleContainingFactors = $minusContent[0].ENODE_getRoles();
				//$roleContainingFactors.prepend($minusOne);

				$toBeDec = $minusContent;
				$minusOne.addClass('selected');
				PActx.matchedTF = true;
			}
			/*
			else if( toBeDec.sign === -1 ){
				$extOp = wrapIfNeeded($toBeDec,op);//se necessario crea una operazione container
				//crea nuovo ENODEo
				var minusOne = {type:"cn", val:1, sign:-1, exp:1}
				var $minusOne = ValToENODEs(minusOne);
				$minusOne.insertAfter($toBeDec);
				//togli il segno meno dall'elemento da scomporre
				toBeDec.sign=1;
				var $NewToBeDec = ValToENODEs(toBeDec);
				$toBeDec.replaceWith($NewToBeDec);
				$toBeDec = $NewToBeDec
				$toBeDec.addClass('selected')
				PActx.matchedTF = true;
			}
			*/
			else if (toBeDec.type === "cn") {//se l'elemento da scomporre è un numero'

				var primeFactors = primeFactorization(toBeDec.val);

				if (primeFactors.length > 1) {// se numero primo non fare nulla
					$extOp = wrapIfNeeded($toBeDec, op);//se necessario crea una operazione container
					var prototype = prototypeSearch("cn", "num")
					primeFactors.forEach(function (e, i) {
						$clone = ENODEclone(prototype);
						$clone.attr('data-enode', 'cn');
						$clone[0].ENODE_setName(e)
						$clone.insertAfter($toBeDec);
						if (i == (primeFactors.length - 1)) {
							$clone.addClass('selected');// l'ultimo fattore rimane selezionato
						}
					})
					$toBeDec.remove();
					PActx.matchedTF = true;
				}
			}
			//non scomporre l'uno, creazione di coppie gestita altrove
			if (!PActx.matchedTF && toBeDec.val != 1) {//se le altre scomposizioni non sono applicabili fai comparire l'elemento neutro
				$extOp = wrapIfNeeded($toBeDec, op);//se necessario crea una operazione container
				//crea nuovo ENODEo
				var One = { type: "cn", val: 1, sign: 1, exp: 1 }
				var $One = ValToENODEs(One);
				$One.insertAfter($toBeDec);
				PActx.matchedTF = true;
			}

		}
		else if (direction === "right") {
			op = "plus";
			if (toBeDec.type === "cn" && toBeDec.val % 1 == 0 && toBeDec.val > 1 && toBeDec.exp == 1) {//controllare che il numero sia intero?

				$extOp = wrapIfNeeded($toBeDec, op);//se necessario crea una operazione container
				//crea nuovo ENODEo
				var plusMinusOne = { type: "cn", val: 1, sign: toBeDec.sign, exp: 1 }//il segno di toBeDec passa a +-1 
				// scompongo in (n-1)+1
				var $minusOne = ValToENODEs(plusMinusOne);
				$minusOne.insertBefore($toBeDec);
				toBeDec.val = toBeDec.val - 1;
				var $NewToBeDec = ValToENODEs(toBeDec);
				$toBeDec.replaceWith($NewToBeDec)
				$toBeDec = $NewToBeDec
				$toBeDec.addClass('selected')
				PActx.matchedTF = true;
			}

		}
	}
	/* booleani già gestiti altrove
	else if(  $toBeDec.attr("data-type")==="bool" ){
		//scomposizione di un numero in verticale è fattorizzazione : op = times
		if(direction == "up"){
			op = "and";
			$extOp = wrapIfNeeded($toBeDec,op);//se necessaro crea una operazione container
			var prototype=prototypeSearch("ci","bool")
			$clone = ENODEclone(prototype);
			$clone.text("true");
			$clone.insertAfter($toBeDec);
			$clone.css({display:""});
		}
		else if( $toBeDec[0].ENODE_getName() === "true"){
			op = "or";
			var $X_or_NotX = searchForProperty("name","X_or_NotX");// trova la definizione della proprietà da applicare
			createForThis($X_or_NotX,$toBeDec);
		}		
	}
	*/
	if (PActx.matchedTF) {
		//RefreshEmptyInfixBraketsGlued($extOp,true,"eibg")
		PActx.$transform = ENODEparent($extOp)
		//ssnapshot.take();
		//elementi sostituiti internamente
		PActx.replacedAlready = true;
		PActx.visualization = img
		PActx.msg = "decompose"
	}
	return PActx
}


function isEquationMember($mouseDownENODE) {
	//  
	if (!($mouseDownENODE.parent().parent().is("[data-enode=eq]") && !isDefinition($mouseDownENODE.parent().parent()[0]))) {
		return []//not from an equation	
	}
	return ENODEparent($mouseDownENODE)
}

function validReplaced($mouseDownENODE) {
	if (!($mouseDownENODE.parent().parent().is("[data-enode=eq]") && !isDefinition($mouseDownENODE.parent().parent()[0]))) {
		return []//not from an equation	or implies
	}
	if (!($mouseDownENODE.parent().hasClass('firstMember') || $mouseDownENODE.parent().hasClass('secondMember'))) {
		return []
	}// dragged is not a membrer of equation 
	return findvalidReplacedOrPremise($mouseDownENODE)
}

function validModusPonens($mouseDownENODE) {
	if (!$mouseDownENODE.parent().parent().is("[data-enode=implies]")) {
		return []//not from an implies
	}
	if (!$mouseDownENODE.parent().hasClass('firstMember')) {
		return []
	}// dragged is not a membrer of equation 
	return findvalidReplacedOrPremise($mouseDownENODE)
}


function findvalidReplacedOrPremise($mouseDownENODE) {
	let $equation = ENODEparent($mouseDownENODE)
	let $excludedMembers = $equation.find('[data-enode]');
	// cerca nodi uguali a mousedown node
	let $candidates = $PropositionsAffectedByStartPropositionROLES($equation).find('[data-enode]').addBack().filter(':visible').addClass('mu_Downstream1').not($excludedMembers)
	let $occurrences = $findOccurrences($mouseDownENODE, undefined, $candidates)//ricerca limitata ad elementi visibili
	let $valids = $occurrences
	$valids.each(function () {
		// crea linee
		lineAB($mouseDownENODE, $(this), 'arrow');
	})
	return $valids
}

function ENODELinkReplace($link, $replaced) {
	var PActx = newPActx();
	PActx.replacedAlready = true;
	ENODEReplaceLink($replaced, $link);
	PActx.matchedTF = true
	return PActx
}
function ENODEModusPonens($premiseInProperty, $premise){
	var PActx = newPActx();
	PActx.replacedAlready = true;
	if(!ENODEparent($premise).is('[data-enode=and]')){
		//wrap with AND
	}
	//create clone
	
	let $clone = ENODEclone(
		ENODEparent($premiseInProperty)[0].ENODE_getRoles(".secondMember").children()
	);
	//isert deduction after $premise
	$clone.insertAfter($premise);
	return PActx
}

function validRedundant($mouseDownENODE, ctrlOrMeta, altKey) {
	//validRedundant($('.selected'))
	// cerca nodi uguali a mousedown node 
	if (!altKey) {
		return []
	}
	if (!$mouseDownENODE.is("[data-type=bool]")) {
		return []//not a boolean expression	
	}
	let $candidates = $PropositionsAffectedByStartPropositionROLES($mouseDownENODE).filter(':visible').addClass('mu_Downstream1')
	let $valids = $candidates.not($mouseDownENODE).filter(function () {//escludi mousedownnode stesso dai possibili risultati
		return ENODEEqual(this, $mouseDownENODE[0], false, true)
	})
	return $valids
}

function validAddRedundant($mouseDownENODE, ctrlOrMeta) {
	//validRedundant($('.selected'))
	// cerca nodi uguali a mousedown node 
	if (!ctrlOrMeta) {
		return []
	}
	if (!$mouseDownENODE.is("[data-type=bool]")) {
		return []//not a boolean expression	
	}
	let $targets = $calculateTargetsAddRedundantROLES($mouseDownENODE).filter(':visible').addClass('mu_Downstream1')
	return $targets
}


function validCandidatesForPatternDrop($mouseDownENODE, $originalProperty) {
	//exclude the $originalProperty
	let $excludedENODES = $originalProperty.find('[data-enode]').addBack();
	//let $excludedENODES= $mouseDownENODE.closest('[data-enode=forAll]').find('[data-enode]').addBack();
	//let $jurisdictionRoles = $calculateJurisdictionRoles($originalProperty).addClass('mu_Downstream1').filter('[data-enode]:visible')
	//let $candidates = $jurisdictionRoles.find('[data-enode]:visible')
	let $candidates = $PropositionsAffectedByStartPropositionROLES($originalProperty).filter(':visible').addClass('mu_Downstream1');
	let $valids = $candidates.not($excludedENODES).filter(function (index) {
		//*****valid?***********
		var result = (
			//datatype is compatible
			typeOk($mouseDownENODE, $(this))
			&&
			ENODEfrozenDef($(this)).length == 0
		)
		return result
	})
	return $valids//.not($mouseDownENODE.parent())
}

function validhanoiMove($mouseDownENODE) {
	//dragged must be top element in hanoi rod
	let $parentRod = ENODEparent($mouseDownENODE)
	if (!($parentRod.is("[data-enode=hanoirod]") && $mouseDownENODE.is(':first-child'))) {
		return []
	}
	//parent parent must be hanoi
	if (!ENODEparent($parentRod).is("[data-enode=hanoi]")) {
		return []
	}
	//check if the las element of each road is smaller than dragged
	let draggedDiscNum = parseInt($mouseDownENODE[0].ENODE_getName());
	let $filterdSiblings = $parentRod.siblings().filter(function () {
		let $topDisc = this.ENODE_getChildren(':first');
		if ($topDisc.length == 0) { return true };
		let topDiscNum = parseInt($topDisc[0].ENODE_getName())
		return topDiscNum > draggedDiscNum;
	});
	return $filterdSiblings
}
function hanoiMove(dragged, target, dropped) {
	var PActx = newPActx();
	target[0].ENODE_getRoles().prepend($(dragged));
	PActx.matchedTF = true;
	PActx.replacedAlready = true;
	PActx.msg = "moved";
	//PActx.$transform = target.parent().parent()//not optimized, should update the older closest common parent
	return PActx;
}





function removeRedundant($dragged, $target) {
	var PActx = newPActx();
	var $parent = ENODEparent($target)
	PActx.replacedAlready = true;
	if ($parent.attr("data-enode") == "and") {
		$target.remove();//if contained in an and simply remove the redundant term		
		$parent.addClass("Refine_c");
	}
	else {
		var $clone = ENODEclone(prototypeSearch("ci", "bool"))
		$clone[0].ENODE_setName('true');
		$target.replaceWith($clone);
	}
	PActx.matchedTF = true
	PActx.$transform = $parent
	PActx.msg = "removed Redundant"
	return PActx
}

function addRedundant($dragged, $target, $dropped) {
	let PActx = newPActx();
	$($dropped).removeClass('toBeCloned');//in case class 'toBeCloned' is present rempve it
	if ($target.attr('data-enode')) {//if target is an ENODE, create an AND around it
		let $extOp = wrapWithOperation($target, 'and')
		$target = $extOp[0].ENODE_getRoles()
		PActx.msg = "created and, added Redundant or deduction"
		$target.append($dropped);
	}
	else {
		PActx.msg = "added Redundant or deduction"
	}
	PActx.matchedTF = true;
	PActx.replacedAlready = true;
	return PActx
}

function evaluateComparison($exp) {
	var PActx = newPActx();
	var comparisons = ["eq", "gt", "lt", "geq", "leq"];//todo: gestire geq e leq
	PActx.$operand = $exp;
	var ENODEClass = $exp.attr('data-enode');
	if (comparisons.indexOf(ENODEClass) != -1) {
		var $firstMember = $exp[0].ENODE_getRoles('.firstMember').children();
		var firstMember = ENODEsToVal($firstMember);
		var $secondMember = $exp[0].ENODE_getRoles('.secondMember').children();
		var secondMember = ENODEsToVal($secondMember);
		if (!isNaN(firstMember.computedVal) && !isNaN(secondMember.computedVal)) {
			var prototype = prototypeSearch("ci", "bool")
			var result
			if (ENODEClass = "eq") {
				result = firstMember.computedVal == secondMember.computedVal;
			}
			else if (ENODEClass = "gt") {
				result = firstMember.computedVal > secondMember.computedVal;
			}
			else if (ENODEClass = "geq") {
				result = firstMember.computedVal >= secondMember.computedVal;
			}
			else if (ENODEClass = "lt") {
				result = firstMember.computedVal < secondMember.computedVal;
			}
			else if (ENODEClass = "leq") {
				result = firstMember.computedVal <= secondMember.computedVal;
			}
			var stringResult
			if (result) { stringResult = "true" } else { stringResult = "false" }
			var $clone = ENODEclone(prototype);
			// $clone.attr('data-enode','cn');
			$clone[0].ENODE_setName(stringResult)
			$clone.insertAfter($exp);
			$clone.addClass('selected');// il risultato rimane selezionato
			$exp.remove();
			PActx.matchedTF = true;
			PActx.replacedAlready = true;
			PActx.msg = "composeInequation"
		}
	}
	return PActx
}

function forThisPar_focus_nofocus($specificValue, $parameter) {
	var PActx = newPActx();

	//a parameter in a forall is specific by a $specificValue
	let $forall
	//if(ENODEparent($parameter).hasClass('exclusiveFocus')){//the forall is in focus
	$forall = ENODEparent($parameter)
	/*}
	else{//the forall is not in focus -> create a clone
		let index=$parameter.index();
		$forall=createForThis(ENODEparent($parameter),ENODEparent($parameter));
		$parameter=$(GetforAllHeader($forall).children()[index])
	}*/
	PActx.$transform = ENODEForThisPar($parameter, $specificValue)
	PActx.matchedTF = true;
	PActx.replacedAlready = true;
	PActx.msg = "forThis"
	return PActx
}

function clearTragets() {
	clearTarget(["toBeCloned"]);//debug 
	document.querySelectorAll(sortablesSelectorString).forEach(function (el) { el.setAttribute('target', '') });
	document.querySelectorAll('[data-enode]').forEach(function (el) { el.setAttribute('target', '') });
}
