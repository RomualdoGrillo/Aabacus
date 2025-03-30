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
	new PropertyDnD('associativeDnD', immediateAssValid, exprNodeassociate, ""),
	new PropertyDnD('distributiveDnD', validForDist, exprNodedistribute, ""),
	new PropertyDnD('partDistributDnD', validForPartDist, exprNodePartDistribute, ""),
	new PropertyDnD('collectDnD', validForColl, exprNodecollect, ""),
	new PropertyDnD('partCollectDnD', validForPartColl, exprNodepartCollect, ""),
	new PropertyDnD('replaceDnD', validReplaced, exprNodeLinkReplace, ""),
	new PropertyDnD('modusPonensDnD', validModusPonens, exprNodeModusPonens, ""),
	new PropertyDnD('forThisDnD', forThisValid, forThisPar_focus_nofocus, ""),
	new PropertyDnD('removeRedundantDnD', validRedundant, removeRedundant, ""),
	new PropertyDnD('addRedundantDnD', validAddRedundant, addRedundant, ""),
	new PropertyDnD('hanoiMoveDnD', validhanoiMove, hanoiMove, "")
]




function exprNodeneedsBracket($exprNode) {
	var exprNodeclass = $exprNode.attr('data-atom')  //
	var parentClass = exprNodeparent($exprNode).attr('data-atom')//
	// futuribile:
	//var parentRole = da completare per poter distinguere se in quale "role" è contenuto
	//la stringa che identifica la posizione dovrebbe diventare <exprNodetype>.<role>


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
	var exprNodeclassIndex = getCol(MatrixBaracketNeeded, 0).indexOf(exprNodeclass)
	if (exprNodeclassIndex != -1) {
		var row = MatrixBaracketNeeded[exprNodeclassIndex];
		if (row.indexOf(parentClass) != -1) {// found in matrix
			return true
		}
	}
	//check if plus timess etc.. have one or zero children
	let needMoreThanOneChild = ["plus", "times", "power"]
	if (needMoreThanOneChild.indexOf(exprNodeclass) != -1 &&
		$exprNode[0].exprNode_getChildren().length < 2) {
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
	let $excludedForall = $identifierSpanForAll($(mouseDownNode)).filter('[data-atom=forAll]');
	let forAlls = $('[data-atom=forAll]:visible').not($excludedForall).toArray();//querySelectAll does not work with :visible?
	let $parameters = $()
	let i = 0
	while (forAlls[i]) {
		$parameters = $parameters.add(GetforAllHeader($(forAlls[i])).find('[data-atom]'));
		i++
	}

	let $valids = $parameters.filter(function (i, el) { return typeOk(mouseDownNode, $(el)) });
	return $valids
}

function immediateAssValid($mouseDownAtom) {
	const $parent = exprNodeparent($mouseDownAtom);
	let op;
	if ($parent !== undefined) { op = $parent.attr("data-atom") }
	let $validTargetRoles = $();
	if (OpIsAssociative(op)) {
		let $validTgtAtoms = $ImmediateAssociativeAtom($parent)
		// to get every associative target (not just immediate):
		//let $validTgtAtoms = $RecursiveTreeExplorerCriterium($parent,$ImmediateAssociativeAtom)
		$validTgtAtoms.each(function (i, e) {
			$validTargetRoles = $validTargetRoles.add(e.exprNode_getRoles());
		});
	}
	return $validTargetRoles
}

function exprNodeassociate(dragged, target, dropped) {
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



function validForPartDist($mouseDownAtom, ctrlOrMeta) {
	if (ctrlOrMeta) {
		return []
	}
	let $parent = exprNodeparent($mouseDownAtom);
	var $siblings = $parent.siblings('[data-atom]');
	if ($siblings.length == 0) { return $() }//nothing to distribute
	let opD = undefined;
	if ($parent !== undefined) { opD = $parent.attr("data-atom") }
	let op = opIsDistDop("", opD);
	if (op && exprNodeparent($parent).attr("data-atom") == op) {
		return exprNodeparent(exprNodeparent($parent)).find('>.ul_role')
		//return exprNodeparent($parent).find('>.ul_role')
	}
	/*
	if(op && exprNodeparent($parent).attr("data-atom") === op){//check if parent of parent is the right op
		if(exprNodeparent(exprNodeparent($parent))){
			return exprNodeparent(exprNodeparent($parent))
		}
		else{
			return wrapWithOperation($siblingsT,op)
		}
	}
	*/
	return $()
}



function validForDist($mouseDownAtom, ctrlOrMeta, altKey) {//op2 è il tipo di operazione sulla quale si distribuisce
	if (ctrlOrMeta || altKey) {
		return []
	}
	var $parent = exprNodeparent($mouseDownAtom);
	let op = undefined;
	if ($parent !== undefined) { op = $parent.attr("data-atom") }
	let opD = opIsDistDop(op);

	if (opD !== undefined) {
		//return $mouseDownAtom.siblings().filter("[data-atom="+opD+"]")	
		$validAtoms = $mouseDownAtom.siblings().filter("[data-atom=" + opD + "]")
		/*
		let $validTargets = $()
		let i=0;
		
		while($validAtoms[i]){
			$validTargets = $validTargets.add($validAtoms[i].exprNode_getRoles()[0])
		i++	
		} 	
		return $validTargets*/
		return $validAtoms
	}
	return [] //empty array
}

function exprNodePartDistribute($dragged, target, dropped) {
	var PActx = newPActx();
	PActx.replacedAlready = true;
	let childrenIndex = exprNodeparent($dragged).index()
	let $parent = exprNodeparent($dragged);
	let opD;
	if ($parent !== undefined) { opD = $parent.attr("data-atom") }
	let op = opIsDistDop("", opD);
	var $siblings = $parent.siblings('[data-atom]'); // ottieni la lista degli altri fattori
	$extOp = wrapIfNeeded(exprNodeparent($parent), opD);//se necessario crea una operazione container
	let $prototype = prototypeSearch(op);
	let $clone = exprNodeclone($prototype)//create times
	$clone.insertBefore(dropped);
	$siblings.each(function (i, e) {
		var $siblingClone = exprNodeclone($(e));
		$clone[0].exprNode_getRoles().append($siblingClone);
	});
	let previous = $clone[0].exprNode_getRoles().children().eq(childrenIndex - 1);
	$dragged.insertAfter(previous);
	$parent.addClass("Refine_c");
	dropped.remove();
	PActx.$transform = $parent;
	PActx.matchedTF = true
	return PActx
}

function exprNodedistribute($dragged, target, dropped) {
	var PActx = newPActx();
	PActx.replacedAlready = true;
	let $parent = exprNodeparent($dragged);
	let op = undefined;
	if ($parent !== undefined) { op = $parent.attr("data-atom") }
	let opD = opIsDistDop(op);
	var $prototype = prototypeSearch(op)// for example search for times proto
	$(target)[0].exprNode_getChildren().each(function (i, e) {
		e.classList.add("Refine_c");
		var $clone = exprNodeclone($prototype)//create times
		var $cloneDragged = exprNodeclone($dragged)// clone dragged
		$clone.insertBefore($(this));
		$clone[0].exprNode_getRoles().append($cloneDragged);
		if ($dragged.index() > target.index()) {
			$clone[0].exprNode_getRoles().prepend($(this));
		}
		else {
			$clone[0].exprNode_getRoles().append($(this));
		}
		//$cloneDragged.css({display:""})
	})
	var $draggedParent = $dragged[0].exprNodeparent();
	$draggedParent.addClass("Refine_c");//mark external operation as remove if pointless
	$(target).addClass("Refine_c");//mark target operation as remove if pointless
	$dragged.remove();
	PActx.$transform = $parent;
	PActx.matchedTF = true
	return PActx
}

function validForColl($mouseDownAtom) {
	var $parent = exprNodeparent($mouseDownAtom);
	var op = undefined
	if ($parent !== undefined) { op = $parent.attr("data-atom") };//look for targets
	var opD = opIsDistDop(op);
	//$('*').removeClass('ToBeCollected').removeClass('CouldBeCollected');//evidenziore l'imbastitura e rimuoverla in unica funzione
	//*******test preliminari
	if ($parent == undefined) {
		return $() //empty $ array
	}
	var $parentParent = exprNodeparent($parent);
	if (
		opD == undefined
		||
		$parentParent == undefined
		||
		$parentParent.attr('data-atom') !== opD
	) {
		return $() //empty $ array
	}
	//***** test su ciascun termine
	var $terms = $parentParent[0].exprNode_getChildren() // ottieni la lista degli addendi
	for (i = 0; i < $terms.length; i++) {
		var term = $terms[i]
		var okForThisTerm = false;
		if ($(term).attr('data-atom') == op) {// se l'addendo è di tipo times controlla ogni fattore
			var $factors = term.exprNode_getChildren()
			for (j = 0; j < $factors.length; j++) {
				var factor = $factors[j]
				//console.log("controllo factor");
				//console.log(factor);
				if (exprNodeEqual(factor, $mouseDownAtom[0])) {
					$(factor).addClass("CouldBeCollected")
					okForThisTerm = true;
					break
				}
			}
		}
		else {// altrimenti controlla lui stesso
			if (exprNodeEqual(term, $mouseDownAtom[0])) {
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
	//return $parentParent[0].exprNode_getRoles()
	return exprNodeparent($parentParent).find('>.ul_role')//target is the external atom	
}

function validForPartColl($mouseDownAtom) {
	var $parent = exprNodeparent($mouseDownAtom);
	if ($parent == undefined) {
		return $() //empty $ array
	}
	var $valids = $();
	var $plusParent;
	var opP;
	var opT;
	var op = $parent.attr("data-atom");
	var opP = opIsDistDop(op);
	if (opP) {// dragged is into a "times"
		$plusParent = exprNodeparent($parent);//candidate plus parent will be checked later
		opT = op
	}
	else {
		//check if the dragged is directrly into a "plus"
		opT = opIsDistDop("", op);
		if (opT !== undefined) {
			opP = op;
			$plusParent = $parent;
			$parent = $mouseDownAtom;
		}
	}

	//$('*').removeClass('ToBeCollected').removeClass('CouldBeCollected');//evidenziore l'imbastitura e rimuoverla in unica funzione
	//*******test preliminari

	if (
		opP == undefined //if no distributive operation is found
		||
		$plusParent == undefined
		||
		$plusParent.attr('data-atom') !== opP
	) {
		return $() //empty $ array
	}
	//***** test su ciascun termine
	var $siblings = $parent.siblings('[data-atom]')
	for (i = 0; i < $siblings.length; i++) {
		var term = $siblings[i]
		var okForThisTerm = false;
		if ($(term).attr('data-atom') == opT) {// se l'addendo è di tipo times controlla ogni fattore
			var $factors = term.exprNode_getChildren()
			for (j = 0; j < $factors.length; j++) {
				var factor = $factors[j]
				//console.log("controllo factor");
				//console.log(factor);
				if (exprNodeEqual(factor, $mouseDownAtom[0])) {
					$valids = $valids.add(factor);
				}
			}
		}
		else {// altrimenti controlla lui stesso
			if (exprNodeEqual(term, $mouseDownAtom[0])) {
				$valids = $valids.add(term);
			}
		}
	};
	return $valids
}

function exprNodepartCollect($dragged, $target) {
	var PActx = newPActx();
	PActx.replacedAlready = true;
	let $targetParent = exprNodeparent($target);
	let $siblingsT = $target.siblings('[data-atom]')
	let opt = $targetParent.attr("data-atom")

	let $draggedParent = exprNodeparent($dragged);
	let $siblingsD = $dragged.siblings('[data-atom]')
	let opd = $draggedParent.attr("data-atom")

	let $commonGranParent = exprNodeparent($targetParent);
	$commonGranParent.addClass("Refine_c");


	if (opt == opd && opIsDistDop(opt)) {//both have same distributable op
		var opPlus = opIsDistDop(opt)//opPlus may be plus,or, other operation over wich you distribute 
		var $prototype = prototypeSearch(opPlus)
		var $opPlus
		var $termT
		var $termD
		if ($siblingsT.length == 1) {
			if ($siblingsT.eq(0).attr("data-atom") == opPlus) {//if 'plus' ther's no need to create a new plus container
				$opPlus = $siblingsT
				$termT = $siblingsT[0].exprNode_getChildren()
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
			if (!$opPlus && $siblingsD.eq(0).attr("data-atom") == opPlus) {//if 'plus' ther's no need to create a new plus container
				$opPlus = $siblingsD
				$termD = $siblingsD[0].exprNode_getChildren()
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
			$opPlus = exprNodeclone($prototype)//create times
			$opPlus.insertBefore($termT);
			$termT.remove();
		}
		var $plusRole = $opPlus[0].exprNode_getRoles()
		if ($targetParent.index() > $draggedParent.index()) {//order of terms is inherited from order of oarents
			$plusRole.append($termD);
			$plusRole.append($termT);
		}
		else {
			$plusRole.append($termT);
			$plusRole.append($termD);
		}
		PActx.$transform = exprNodeparent($draggedParent);
		$draggedParent.remove()
		PActx.matchedTF = true
		return PActx
	}
}

function exprNodecollect($dragged, $target) {
	var PActx = newPActx();
	PActx.replacedAlready = true;
	let $parent = exprNodeparent($dragged);
	let $parentParent = exprNodeparent($parent);
	let op = undefined;
	if ($parent !== undefined) { op = $parent.attr("data-atom") }
	var extOp
	extOp = wrapIfNeeded($parentParent, op)
	exprNodeparent($dragged).addClass("Refine_c")
	exprNodeparent($(".CouldBeCollected")).addClass("Refine_c")
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
	var $parent = exprNodeparent($toBeComp);
	var op = $parent.attr('data-atom');
	if ($toBeComp.length == 0) { PActx.msg = ("nothing selected"); return PActx }
	//se 1 solo selezionato cerca di comporlo con l'antecedente'
	if ($toBeComp.length == 1) {
		//---tenta semplificazioni banali
		//controlla se si tratta di elemento neutro, in tal caso fallo semplicemente sparire.
		/*
		var tBcClass = $toBeComp.attr("data-atom"); 
		if( tBcClass === "cn" || tBcClass === "ci"){
			var name = $toBeComp[0].exprNode_getName()
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
	exprNodeSmarkUnmark($toBeComp, "d")
	//calcolo via algoritmi specifici
	if (op !== "plus" && op !== "times" && op !== "or") { PActx.msg = ("no composition defined for: " + op); return PActx };
	//**** calcolo via algoritmo ****

	var partial = undefined
	for (var i = 0, len = $toBeComp.length; i < len; i++) {//for perchè potrebbe sommare o moltiplicare una lista di n elementi
		var currToBeComp = AtomsToVal($($toBeComp[i]));
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
		$composed = ValToAtoms(partial);
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
		exprNodeSmarkUnmark($toBeComp, "")
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
	var toBeDec = AtomsToVal($toBeDec)
	if (TBDdataType === "num") {
		//scomposizione di un numero in verticale è fattorizzazione : op = times
		if (direction === "up") {
			op = "times";
			if ($toBeDec.attr('data-atom') === 'minus') {
				var $minus = $toBeDec
				//******crea nuovo Atomo
				var minusOne = { type: "cn", val: 1, sign: -1, exp: 1 }
				var $minusOne = ValToAtoms(minusOne);

				//stabilisci dove va aggiunto il -1
				var $minusParent = exprNodeparent($minus);
				var $minusContent = $minus[0].exprNode_getChildren();
				$extOp = $minusParent;
				if ($minusParent.attr('data-atom') == 'times') {//aggiungi il -1 all'interno del minus parent
					$minusOne.insertBefore($minus);
				}
				else {
					if ($minusContent.attr('data-atom') !== 'times') {//è necessario aggiungere una enclosure di tipo "times"
						$minusContent = wrapWithOperation($minusContent, 'times')
					}
					$minusContent[0].exprNode_getRoles().prepend($minusOne);
				}
				//******Rimuovi il MINUS
				$minusContent.insertAfter($minus);
				$minusContent.addClass("Refine_c");//if the content was a "times" it may by dissolved if the parent is also times
				$minus.remove();

				//var $roleContainingFactors = $minusContent[0].exprNode_getRoles();
				//$roleContainingFactors.prepend($minusOne);

				$toBeDec = $minusContent;
				$minusOne.addClass('selected');
				PActx.matchedTF = true;
			}
			/*
			else if( toBeDec.sign === -1 ){
				$extOp = wrapIfNeeded($toBeDec,op);//se necessario crea una operazione container
				//crea nuovo Atomo
				var minusOne = {type:"cn", val:1, sign:-1, exp:1}
				var $minusOne = ValToAtoms(minusOne);
				$minusOne.insertAfter($toBeDec);
				//togli il segno meno dall'elemento da scomporre
				toBeDec.sign=1;
				var $NewToBeDec = ValToAtoms(toBeDec);
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
						$clone = exprNodeclone(prototype);
						$clone.attr('data-atom', 'cn');
						$clone[0].exprNode_setName(e)
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
				//crea nuovo Atomo
				var One = { type: "cn", val: 1, sign: 1, exp: 1 }
				var $One = ValToAtoms(One);
				$One.insertAfter($toBeDec);
				PActx.matchedTF = true;
			}

		}
		else if (direction === "right") {
			op = "plus";
			if (toBeDec.type === "cn" && toBeDec.val % 1 == 0 && toBeDec.val > 1 && toBeDec.exp == 1) {//controllare che il numero sia intero?

				$extOp = wrapIfNeeded($toBeDec, op);//se necessario crea una operazione container
				//crea nuovo Atomo
				var plusMinusOne = { type: "cn", val: 1, sign: toBeDec.sign, exp: 1 }//il segno di toBeDec passa a +-1 
				// scompongo in (n-1)+1
				var $minusOne = ValToAtoms(plusMinusOne);
				$minusOne.insertBefore($toBeDec);
				toBeDec.val = toBeDec.val - 1;
				var $NewToBeDec = ValToAtoms(toBeDec);
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
			$clone = exprNodeclone(prototype);
			$clone.text("true");
			$clone.insertAfter($toBeDec);
			$clone.css({display:""});
		}
		else if( $toBeDec[0].exprNode_getName() === "true"){
			op = "or";
			var $X_or_NotX = searchForProperty("name","X_or_NotX");// trova la definizione della proprietà da applicare
			createForThis($X_or_NotX,$toBeDec);
		}		
	}
	*/
	if (PActx.matchedTF) {
		//RefreshEmptyInfixBraketsGlued($extOp,true,"eibg")
		PActx.$transform = exprNodeparent($extOp)
		//ssnapshot.take();
		//elementi sostituiti internamente
		PActx.replacedAlready = true;
		PActx.visualization = img
		PActx.msg = "decompose"
	}
	return PActx
}


function isEquationMember($mouseDownAtom) {
	//  
	if (!($mouseDownAtom.parent().parent().is("[data-atom=eq]") && !isDefinition($mouseDownAtom.parent().parent()[0]))) {
		return []//not from an equation	
	}
	return exprNodeparent($mouseDownAtom)
}

function validReplaced($mouseDownAtom) {
	if (!($mouseDownAtom.parent().parent().is("[data-atom=eq]") && !isDefinition($mouseDownAtom.parent().parent()[0]))) {
		return []//not from an equation	or implies
	}
	if (!($mouseDownAtom.parent().hasClass('firstMember') || $mouseDownAtom.parent().hasClass('secondMember'))) {
		return []
	}// dragged is not a membrer of equation 
	return findvalidReplacedOrPremise($mouseDownAtom)
}

function validModusPonens($mouseDownAtom) {
	if (!$mouseDownAtom.parent().parent().is("[data-atom=implies]")) {
		return []//not from an implies
	}
	if (!$mouseDownAtom.parent().hasClass('firstMember')) {
		return []
	}// dragged is not a membrer of equation 
	return findvalidReplacedOrPremise($mouseDownAtom)
}


function findvalidReplacedOrPremise($mouseDownAtom) {
	let $equation = exprNodeparent($mouseDownAtom)
	let $excludedMembers = $equation.find('[data-atom]');
	// cerca nodi uguali a mousedown node
	let $candidates = $PropositionsAffectedByStartPropositionROLES($equation).find('[data-atom]').addBack().filter(':visible').addClass('mu_Downstream1').not($excludedMembers)
	let $occurrences = $findOccurrences($mouseDownAtom, undefined, $candidates)//ricerca limitata ad elementi visibili
	let $valids = $occurrences
	$valids.each(function () {
		// crea linee
		lineAB($mouseDownAtom, $(this), 'arrow');
	})
	return $valids
}

function exprNodeLinkReplace($link, $replaced) {
	var PActx = newPActx();
	PActx.replacedAlready = true;
	exprNodeReplaceLink($replaced, $link);
	PActx.matchedTF = true
	return PActx
}
function exprNodeModusPonens($premiseInProperty, $premise){
	var PActx = newPActx();
	PActx.replacedAlready = true;
	if(!exprNodeparent($premise).is('[data-atom=and]')){
		//wrap with AND
	}
	//create clone
	
	let $clone = exprNodeclone(
		exprNodeparent($premiseInProperty)[0].exprNode_getRoles(".secondMember").children()
	);
	//isert deduction after $premise
	$clone.insertAfter($premise);
	return PActx
}

function validRedundant($mouseDownAtom, ctrlOrMeta, altKey) {
	//validRedundant($('.selected'))
	// cerca nodi uguali a mousedown node 
	if (!altKey) {
		return []
	}
	if (!$mouseDownAtom.is("[data-type=bool]")) {
		return []//not a boolean expression	
	}
	let $candidates = $PropositionsAffectedByStartPropositionROLES($mouseDownAtom).filter(':visible').addClass('mu_Downstream1')
	let $valids = $candidates.not($mouseDownAtom).filter(function () {//escludi mousedownnode stesso dai possibili risultati
		return exprNodeEqual(this, $mouseDownAtom[0], false, true)
	})
	return $valids
}

function validAddRedundant($mouseDownAtom, ctrlOrMeta) {
	//validRedundant($('.selected'))
	// cerca nodi uguali a mousedown node 
	if (!ctrlOrMeta) {
		return []
	}
	if (!$mouseDownAtom.is("[data-type=bool]")) {
		return []//not a boolean expression	
	}
	let $targets = $calculateTargetsAddRedundantROLES($mouseDownAtom).filter(':visible').addClass('mu_Downstream1')
	return $targets
}


function validCandidatesForPatternDrop($mouseDownAtom, $originalProperty) {
	//exclude the $originalProperty
	let $excludedexprNodeS = $originalProperty.find('[data-atom]').addBack();
	//let $excludedexprNodeS= $mouseDownAtom.closest('[data-atom=forAll]').find('[data-atom]').addBack();
	//let $jurisdictionRoles = $calculateJurisdictionRoles($originalProperty).addClass('mu_Downstream1').filter('[data-atom]:visible')
	//let $candidates = $jurisdictionRoles.find('[data-atom]:visible')
	let $candidates = $PropositionsAffectedByStartPropositionROLES($originalProperty).filter(':visible').addClass('mu_Downstream1');
	let $valids = $candidates.not($excludedexprNodeS).filter(function (index) {
		//*****valid?***********
		var result = (
			//datatype is compatible
			typeOk($mouseDownAtom, $(this))
			&&
			exprNodefrozenDef($(this)).length == 0
		)
		return result
	})
	return $valids//.not($mouseDownAtom.parent())
}

function validhanoiMove($mouseDownAtom) {
	//dragged must be top element in hanoi rod
	let $parentRod = exprNodeparent($mouseDownAtom)
	if (!($parentRod.is("[data-atom=hanoirod]") && $mouseDownAtom.is(':first-child'))) {
		return []
	}
	//parent parent must be hanoi
	if (!exprNodeparent($parentRod).is("[data-atom=hanoi]")) {
		return []
	}
	//check if the las element of each road is smaller than dragged
	let draggedDiscNum = parseInt($mouseDownAtom[0].exprNode_getName());
	let $filterdSiblings = $parentRod.siblings().filter(function () {
		let $topDisc = this.exprNode_getChildren(':first');
		if ($topDisc.length == 0) { return true };
		let topDiscNum = parseInt($topDisc[0].exprNode_getName())
		return topDiscNum > draggedDiscNum;
	});
	return $filterdSiblings
}
function hanoiMove(dragged, target, dropped) {
	var PActx = newPActx();
	target[0].exprNode_getRoles().prepend($(dragged));
	PActx.matchedTF = true;
	PActx.replacedAlready = true;
	PActx.msg = "moved";
	//PActx.$transform = target.parent().parent()//not optimized, should update the older closest common parent
	return PActx;
}





function removeRedundant($dragged, $target) {
	var PActx = newPActx();
	var $parent = exprNodeparent($target)
	PActx.replacedAlready = true;
	if ($parent.attr("data-atom") == "and") {
		$target.remove();//if contained in an and simply remove the redundant term		
		$parent.addClass("Refine_c");
	}
	else {
		var $clone = exprNodeclone(prototypeSearch("ci", "bool"))
		$clone[0].exprNode_setName('true');
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
	if ($target.attr('data-atom')) {//if target is an atom, create an AND around it
		let $extOp = wrapWithOperation($target, 'and')
		$target = $extOp[0].exprNode_getRoles()
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
	var atomClass = $exp.attr('data-atom');
	if (comparisons.indexOf(atomClass) != -1) {
		var $firstMember = $exp[0].exprNode_getRoles('.firstMember').children();
		var firstMember = AtomsToVal($firstMember);
		var $secondMember = $exp[0].exprNode_getRoles('.secondMember').children();
		var secondMember = AtomsToVal($secondMember);
		if (!isNaN(firstMember.computedVal) && !isNaN(secondMember.computedVal)) {
			var prototype = prototypeSearch("ci", "bool")
			var result
			if (atomClass = "eq") {
				result = firstMember.computedVal == secondMember.computedVal;
			}
			else if (atomClass = "gt") {
				result = firstMember.computedVal > secondMember.computedVal;
			}
			else if (atomClass = "geq") {
				result = firstMember.computedVal >= secondMember.computedVal;
			}
			else if (atomClass = "lt") {
				result = firstMember.computedVal < secondMember.computedVal;
			}
			else if (atomClass = "leq") {
				result = firstMember.computedVal <= secondMember.computedVal;
			}
			var stringResult
			if (result) { stringResult = "true" } else { stringResult = "false" }
			var $clone = exprNodeclone(prototype);
			// $clone.attr('data-atom','cn');
			$clone[0].exprNode_setName(stringResult)
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
	//if(exprNodeparent($parameter).hasClass('exclusiveFocus')){//the forall is in focus
	$forall = exprNodeparent($parameter)
	/*}
	else{//the forall is not in focus -> create a clone
		let index=$parameter.index();
		$forall=createForThis(exprNodeparent($parameter),exprNodeparent($parameter));
		$parameter=$(GetforAllHeader($forall).children()[index])
	}*/
	PActx.$transform = exprNodeForThisPar($parameter, $specificValue)
	PActx.matchedTF = true;
	PActx.replacedAlready = true;
	PActx.msg = "forThis"
	return PActx
}

function clearTragets() {
	clearTarget(["toBeCloned"]);//debug 
	document.querySelectorAll(sortablesSelectorString).forEach(function (el) { el.setAttribute('target', '') });
	document.querySelectorAll('[data-atom]').forEach(function (el) { el.setAttribute('target', '') });
}
