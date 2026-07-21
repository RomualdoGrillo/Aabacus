//newPActx è definita in PMTutilities.js: punto comune per proprietà hard-wired e pattern-based

class PropertyDnD {
	constructor(name, findTgt, apply, icon) {
		this.name = name
		this.findTgt = findTgt//return valid target roles
		this.apply = apply	// in onEndHandler when an element is dropped on a valid target apply($dropped,$target) 
		this.icon = icon //handler of event fired when a valid dragged is added to a valid role
	}
}

let propertiesDnD = [
	// PRIORITY (first-wins): earlier entry claims a target; DnD.js excludes it for later entries.
	// List order is the reverse of the old last-wins order, so relative priorities are unchanged.
	// associativeGenDnD sits above associativeDnD (as when it was inserted after it under last-wins).
	new PropertyDnD('hanoiMoveDnD', validhanoiMove, hanoiMove, ""),
	new PropertyDnD('addRedundantDnD', validAddRedundant, addRedundant, ""),
	new PropertyDnD('removeRedundantDnD', validRedundant, removeRedundant, ""),
	new PropertyDnD('forThisDnD', forThisValid, forThisPar_focus_nofocus, ""),
	new PropertyDnD('modusPonensDnD', validModusPonens, ENODEModusPonens, ""),
	new PropertyDnD('replaceDnD', validReplaced, ENODELinkReplace, ""),
	new PropertyDnD('partCollectDnD', validForPartColl, ENODEpartCollect, ""),
	new PropertyDnD('collectDnD', validForColl, ENODEcollect, ""),
	new PropertyDnD('partDistributDnD', validForPartDist, ENODEPartDistribute, ""),
	new PropertyDnD('distributiveDnD', validForDist, ENODEdistribute, ""),
	new PropertyDnD('associativeGenDnD', associativeGenValid, ENODEassociate, ""),
	new PropertyDnD('associativeDnD', immediateAssValid, ENODEassociate, "")
]






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
	const associatives = ["plus", "times", "or", "and"]
	return associatives.indexOf(op) !== -1 //class is in list of associatives?
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

/**
 * Target roles for associative DnD (same-op cluster).
 * @param {jQuery} $mouseDownENODE - dragged ENODE
 * @param {boolean} recursive - false: only immediate parent/child same-op (associativeDnD);
 *   true: whole same-op cluster via tree explorer (associativeGenDnD)
 * @param {jQuery} [$alreadyClaimed] - roles already claimed by earlier HW properties; skipped
 */
function associativeValid($mouseDownENODE, recursive, $alreadyClaimed) {
	const $parent = ENODEparent($mouseDownENODE);
	let op;
	if ($parent !== undefined) { op = $parent.attr("data-enode") }
	let $validTargetRoles = $();
	if (OpIsAssociative(op)) {
		let $validTgtENODEs = recursive
			? $RecursiveTreeExplorerCriterium($parent, $ImmediateAssociativeENODE)
			: $ImmediateAssociativeENODE($parent)
		$validTgtENODEs.each(function (i, e) {
			$validTargetRoles = $validTargetRoles.add(e.ENODE_getRoles());
		});
		if ($alreadyClaimed && $alreadyClaimed.length) {
			$validTargetRoles = $validTargetRoles.not($alreadyClaimed)
		}
	}
	return $validTargetRoles
}

function immediateAssValid($mouseDownENODE, ctrlOrMeta, altKey, $alreadyClaimed) {
	return associativeValid($mouseDownENODE, false, $alreadyClaimed)
}

function associativeGenValid($mouseDownENODE, ctrlOrMeta, altKey, $alreadyClaimed) {
	return associativeValid($mouseDownENODE, true, $alreadyClaimed)
}

function ENODEassociate(dragged, target, dropped) {
	//dropped has been inserted already, just remove dragged if not cloning
	const PActx = newPActx();
	const $sourceOp = ENODEparent($(dragged));
	const $destOp = ENODEparent($(target));
	if ($(dropped).hasClass('toBeCloned')) {
		$(dropped).removeClass('toBeCloned');
	}
	else {
		ENODEremove($(dragged)); // if not cloning, clone was useful to visualize the starting point 	
	}
	// post: ripulisci ops di partenza/arrivo (es. PlusSingleTerm, *Associate in ricetta "c")
	if ($sourceOp && $sourceOp.length) { markNeedsRefine($sourceOp); }
	if ($destOp && $destOp.length) { markNeedsRefine($destOp); }
	let $transform = $destOp;
	if ($sourceOp && $sourceOp.length && $destOp && $destOp.length) {
		const common = commonParent([$sourceOp[0], $destOp[0]]);
		if (common) { $transform = $(common); }
	}
	PActx.$transform = $transform;
	PActx.matchedTF = true;
	PActx.replacedAlready = true;
	PActx.msg = "associated";
	return PActx;
}



function getKeyByValue(dictionary, value) {
	for (const prop in dictionary) {
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
	const $siblings = $parent.siblings('[data-enode]');
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
	const $parent = ENODEparent($mouseDownENODE);
	let op = undefined;
	if ($parent !== undefined) { op = $parent.attr("data-enode") }
	const opD = opIsDistDop(op);

	if (opD !== undefined) {
		//return $mouseDownENODE.siblings().filter("[data-enode="+opD+"]")	
		const $validENODEs = $mouseDownENODE.siblings().filter("[data-enode=" + opD + "]")
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
	const PActx = newPActx();
	PActx.replacedAlready = true;
	const childrenIndex = ENODEparent($dragged).index()
	const $parent = ENODEparent($dragged);
	let opD;
	if ($parent !== undefined) { opD = $parent.attr("data-enode") }
	const op = opIsDistDop("", opD);
	const $siblings = $parent.siblings('[data-enode]'); // ottieni la lista degli altri fattori
	const $extOp = wrapIfNeeded(ENODEparent($parent), opD);//se necessario crea una operazione container
	const $prototype = prototypeSearch(op);
	const $clone = ENODEclone($prototype)//create times
	ENODEinsertBefore($clone, dropped);
	$siblings.each(function (i, e) {
		const $siblingClone = ENODEclone($(e));
		ENODEappend($clone[0].ENODE_getRoles(), $siblingClone);
	});
	const previous = $clone[0].ENODE_getRoles().children().eq(childrenIndex - 1);
	ENODEinsertAfter($dragged, previous);
	markNeedsRefine($parent);
	ENODEremove(dropped);
	PActx.$transform = $parent;
	PActx.matchedTF = true
	return PActx
}

function ENODEdistribute($dragged, target, dropped) {
	const PActx = newPActx();
	PActx.replacedAlready = true;
	let $parent = ENODEparent($dragged);
	let op = undefined;
	if ($parent !== undefined) { op = $parent.attr("data-enode") }
	let opD = opIsDistDop(op);
	const $prototype = prototypeSearch(op)// for example search for times proto
	$(target)[0].ENODE_getChildren().each(function (i, e) {
		markNeedsRefine(e);
		const $clone = ENODEclone($prototype)//create times
		const $cloneDragged = ENODEclone($dragged)// clone dragged
		ENODEinsertBefore($clone, $(this));
		ENODEappend($clone[0].ENODE_getRoles(), $cloneDragged);
		if ($dragged.index() > target.index()) {
			ENODEprepend($clone[0].ENODE_getRoles(), $(this));
		}
		else {
			ENODEappend($clone[0].ENODE_getRoles(), $(this));
		}
		//$cloneDragged.css({display:""})
	})
	const $draggedParent = $dragged[0].ENODEparent();
	markNeedsRefine($draggedParent);//mark external operation as remove if pointless
	markNeedsRefine(target);//mark target operation as remove if pointless
	ENODEremove($dragged);
	PActx.$transform = $parent;
	PActx.matchedTF = true
	return PActx
}

function validForColl($mouseDownENODE) {
	const $parent = ENODEparent($mouseDownENODE);
	let op = undefined
	if ($parent !== undefined) { op = $parent.attr("data-enode") };//look for targets
	const opD = opIsDistDop(op);
	//$('*').removeClass('ToBeCollected').removeClass('CouldBeCollected');//evidenziore l'imbastitura e rimuoverla in unica funzione
	//*******test preliminari
	if ($parent == undefined) {
		return $() //empty $ array
	}
	const $parentParent = ENODEparent($parent);
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
	const $terms = $parentParent[0].ENODE_getChildren() // ottieni la lista degli addendi
	for (let i = 0; i < $terms.length; i++) {
		const term = $terms[i]
		let okForThisTerm = false;
		if ($(term).attr('data-enode') == op) {// se l'addendo è di tipo times controlla ogni fattore
			const $factors = term.ENODE_getChildren()
			for (let j = 0; j < $factors.length; j++) {
				const factor = $factors[j]
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
	let $parent = ENODEparent($mouseDownENODE);
	if ($parent == undefined) {
		return $() //empty $ array
	}
	let $valids = $();
	let $plusParent;
	let opP;
	let opT;
	const op = $parent.attr("data-enode");
	opP = opIsDistDop(op);
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
	const $siblings = $parent.siblings('[data-enode]')
	for (let i = 0; i < $siblings.length; i++) {
		const term = $siblings[i]
		let okForThisTerm = false;
		if ($(term).attr('data-enode') == opT) {// se l'addendo è di tipo times controlla ogni fattore
			const $factors = term.ENODE_getChildren()
			for (let j = 0; j < $factors.length; j++) {
				const factor = $factors[j]
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
	const PActx = newPActx();
	PActx.replacedAlready = true;
	let $targetParent = ENODEparent($target);
	let $siblingsT = $target.siblings('[data-enode]')
	let opt = $targetParent.attr("data-enode")

	let $draggedParent = ENODEparent($dragged);
	let $siblingsD = $dragged.siblings('[data-enode]')
	let opd = $draggedParent.attr("data-enode")

	let $commonGranParent = ENODEparent($targetParent);
	markNeedsRefine($commonGranParent);


	if (opt == opd && opIsDistDop(opt)) {//both have same distributable op
		const opPlus = opIsDistDop(opt)//opPlus may be plus,or, other operation over wich you distribute 
		const $prototype = prototypeSearch(opPlus)
		let $opPlus
		let $termT
		let $termD
		if ($siblingsT.length == 1) {
			if ($siblingsT.eq(0).attr("data-enode") == opPlus) {//if 'plus' ther's no need to create a new plus container
				$opPlus = $siblingsT
				$termT = $siblingsT[0].ENODE_getChildren()
				ENODEremove($termT);//svuoto il target plus e poi lo riempio ordinatamente
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
				ENODEremove($termD);//svuoto il target plus e poi lo riempio ordinatamente
				ENODEinsertBefore($opPlus, $termT);//preferisco mettere sempre il plus all'interno del target 
				ENODEremove($termT);
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
			ENODEinsertBefore($opPlus, $termT);
			ENODEremove($termT);
		}
		const $plusRole = $opPlus[0].ENODE_getRoles()
		if ($targetParent.index() > $draggedParent.index()) {//order of terms is inherited from order of oarents
			ENODEappend($plusRole, $termD);
			ENODEappend($plusRole, $termT);
		}
		else {
			ENODEappend($plusRole, $termT);
			ENODEappend($plusRole, $termD);
		}
		PActx.$transform = ENODEparent($draggedParent);
		ENODEremove($draggedParent)
		PActx.matchedTF = true
		return PActx
	}
}

function ENODEcollect($dragged, $target) {
	const PActx = newPActx();
	PActx.replacedAlready = true;
	let $parent = ENODEparent($dragged);
	let $parentParent = ENODEparent($parent);
	let op = undefined;
	if ($parent !== undefined) { op = $parent.attr("data-enode") }
	let extOp
	extOp = wrapIfNeeded($parentParent, op)
	markNeedsRefine(ENODEparent($dragged))
	markNeedsRefine(ENODEparent($(".CouldBeCollected")))
	//$dragged.insertBefore($parentParent);
	ENODEremove($dragged);
	//$(".CouldBeCollected").remove()
	ENODEremove($parentParent.find(".CouldBeCollected"))
	markNeedsRefine($parentParent);
	PActx.$transform = extOp;
	PActx.matchedTF = true
	return PActx
}

function compose($toBeComp, firstVal, img) {
	const $originaltoBeComp = $toBeComp //per poter ripristinare lo stato iniziale
	const PActx = newPActx();
	//**** la funzione può essere applicata?
	const $parent = ENODEparent($toBeComp);
	const op = $parent.attr('data-enode');
	if ($toBeComp.length == 0) { PActx.msg = ("nothing selected"); return PActx }
	//se 1 solo selezionato cerca di comporlo con l'antecedente'
	if ($toBeComp.length == 1) {
		//---tenta semplificazioni banali
		//controlla se si tratta di elemento neutro, in tal caso fallo semplicemente sparire.
		/*
		const tBcClass = $toBeComp.attr("data-enode"); 
		if( tBcClass === "cn" || tBcClass === "ci"){
			const name = $toBeComp[0].ENODE_getName()
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

	let partial = undefined
	for (let i = 0, len = $toBeComp.length; i < len; i++) {//for perchè potrebbe sommare o moltiplicare una lista di n elementi
		const currToBeComp = ENODEsToVal($($toBeComp[i]));
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
					let num
					let den
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
					const algRes = currToBeComp.val * currToBeComp.sign + partial.val * partial.sign;
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
		let $composed = ValToENODEs(partial);
		$composed.addClass('selected');//selezione in uscita
		PActx.$operand = $toBeComp;
		PActx.msg = "compose";


		PActx.replacedAlready = true;
		ENODEinsertBefore($composed, PActx.$operand[0]);
		ENODEremove(PActx.$operand)
		//ExtendAndInitializeTree($composed);
		markNeedsRefine($parent);
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
	const PActx = newPActx();
	PActx.$operand = $toBeDec;
	let op = ""
	let $extOp = ""
	//var $toBeDec=$('.selected')
	const TBDdataType = $toBeDec.attr("data-type")
	//**** la funzione può essere applicata?
	if ($toBeDec.length !== 1) { console.log("cant decompose " + $toBeDec.length + " elements"); return }
	//**** applica la funzione
	const toBeDec = ENODEsToVal($toBeDec)
	if (TBDdataType === "num") {
		//scomposizione di un numero in verticale è fattorizzazione : op = times
		if (direction === "up") {
			op = "times";
			if ($toBeDec.attr('data-enode') === 'minus') {
				const $minus = $toBeDec
				//******crea nuovo ENODEo
				const minusOne = { type: "cn", val: 1, sign: -1, exp: 1 }
				const $minusOne = ValToENODEs(minusOne);

				//stabilisci dove va aggiunto il -1
				const $minusParent = ENODEparent($minus);
				const $minusContent = $minus[0].ENODE_getChildren();
				$extOp = $minusParent;
				if ($minusParent.attr('data-enode') == 'times') {//aggiungi il -1 all'interno del minus parent
					ENODEinsertBefore($minusOne, $minus);
				}
				else {
					if ($minusContent.attr('data-enode') !== 'times') {//è necessario aggiungere una enclosure di tipo "times"
						$minusContent = wrapWithOperation($minusContent, 'times')
					}
					ENODEprepend($minusContent[0].ENODE_getRoles(), $minusOne);
				}
				//******Rimuovi il MINUS
				ENODEinsertAfter($minusContent, $minus);
				markNeedsRefine($minusContent);//if the content was a "times" it may by dissolved if the parent is also times
				ENODEremove($minus);

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
				const minusOne = {type:"cn", val:1, sign:-1, exp:1}
				const $minusOne = ValToENODEs(minusOne);
				$minusOne.insertAfter($toBeDec);
				//togli il segno meno dall'elemento da scomporre
				toBeDec.sign=1;
				const $NewToBeDec = ValToENODEs(toBeDec);
				$toBeDec.replaceWith($NewToBeDec);
				$toBeDec = $NewToBeDec
				$toBeDec.addClass('selected')
				PActx.matchedTF = true;
			}
			*/
			else if (toBeDec.type === "cn") {//se l'elemento da scomporre è un numero'

				const primeFactors = primeFactorization(toBeDec.val);

				if (primeFactors.length > 1) {// se numero primo non fare nulla
					$extOp = wrapIfNeeded($toBeDec, op);//se necessario crea una operazione container
					primeFactors.forEach(function (e, i) {
						let $clone = identifierToENODE(e);
						ENODEinsertAfter($clone, $toBeDec);
						if (i == (primeFactors.length - 1)) {
							$clone.addClass('selected');// l'ultimo fattore rimane selezionato
						}
					})
					ENODEremove($toBeDec);
					PActx.matchedTF = true;
				}
			}
			//non scomporre l'uno, creazione di coppie gestita altrove
			if (!PActx.matchedTF && toBeDec.val != 1) {//se le altre scomposizioni non sono applicabili fai comparire l'elemento neutro
				$extOp = wrapIfNeeded($toBeDec, op);//se necessario crea una operazione container
				//crea nuovo ENODEo
				const One = { type: "cn", val: 1, sign: 1, exp: 1 }
				const $One = ValToENODEs(One);
				ENODEinsertAfter($One, $toBeDec);
				PActx.matchedTF = true;
			}

		}
		else if (direction === "right") {
			op = "plus";
			if (toBeDec.type === "cn" && toBeDec.val % 1 == 0 && toBeDec.val > 1 && toBeDec.exp == 1) {//controllare che il numero sia intero?

				$extOp = wrapIfNeeded($toBeDec, op);//se necessario crea una operazione container
				//crea nuovo ENODEo
				const plusMinusOne = { type: "cn", val: 1, sign: toBeDec.sign, exp: 1 }//il segno di toBeDec passa a +-1 
				// scompongo in (n-1)+1
				const $minusOne = ValToENODEs(plusMinusOne);
				ENODEinsertBefore($minusOne, $toBeDec);
				toBeDec.val = toBeDec.val - 1;
				const $NewToBeDec = ValToENODEs(toBeDec);
				ENODEreplaceNode($toBeDec, $NewToBeDec)
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
			const prototype=prototypeSearch("ci","bool")
			$clone = ENODEclone(prototype);
			$clone.text("true");
			$clone.insertAfter($toBeDec);
			$clone.css({display:""});
		}
		else if( $toBeDec[0].ENODE_getName() === "true"){
			op = "or";
			const $X_or_NotX = searchForProperty("name","X_or_NotX");// trova la definizione della proprietà da applicare
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
	let $candidates = $PropositionsAffectedByStartPropositionROLES($equation).find('[data-enode]').addBack().filter(':visible').addClass('mu_Downstream').not($excludedMembers)
	let $occurrences = $findOccurrences($mouseDownENODE, undefined, $candidates)//ricerca limitata ad elementi visibili
	let $valids = $occurrences
	$valids.each(function () {
		// crea linee
		lineAB($mouseDownENODE, $(this), 'arrow');
	})
	return $valids
}

function ENODELinkReplace($link, $replaced) {
	const PActx = newPActx();
	PActx.replacedAlready = true;
	ENODEReplaceLink($replaced, $link);
	PActx.matchedTF = true
	return PActx
}
function ENODEModusPonens($premiseInProperty, $premise){
	const PActx = newPActx();
	PActx.replacedAlready = true;
	if(!ENODEparent($premise).is('[data-enode=and]')){
		//wrap with AND
	}
	//create clone
	
	let $clone = ENODEclone(
		ENODEparent($premiseInProperty)[0].ENODE_getRoles(".secondMember").children()
	);
	//isert deduction after $premise
	ENODEinsertAfter($clone, $premise);
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
	let $candidates = $PropositionsAffectedByStartPropositionROLES($mouseDownENODE).filter(':visible').addClass('mu_Downstream')
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
	let $targets = $calculateTargetsAddRedundantROLES($mouseDownENODE).filter(':visible').addClass('mu_Downstream')
	return $targets
}


function validCandidatesForPatternDrop($mouseDownENODE, $originalProperty) {
	//exclude the $originalProperty
	let $excludedENODES = $originalProperty.find('[data-enode]').addBack();
	//let $excludedENODES= $mouseDownENODE.closest('[data-enode=forAll]').find('[data-enode]').addBack();
	//let $jurisdictionRoles = $calculateJurisdictionRoles($originalProperty).addClass('mu_Downstream').filter('[data-enode]:visible')
	//let $candidates = $jurisdictionRoles.find('[data-enode]:visible')
	let $candidates = $PropositionsAffectedByStartPropositionROLES($originalProperty).filter(':visible').addClass('mu_Downstream');
	let $valids = $candidates.not($excludedENODES).filter(function (index) {
		//*****valid?***********
		const result = (
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
	const PActx = newPActx();
	ENODEprepend(target[0].ENODE_getRoles(), $(dragged));
	PActx.matchedTF = true;
	PActx.replacedAlready = true;
	PActx.msg = "moved";
	//PActx.$transform = target.parent().parent()//not optimized, should update the older closest common parent
	return PActx;
}





function removeRedundant($dragged, $target) {
	const PActx = newPActx();
	const $parent = ENODEparent($target)
	PActx.replacedAlready = true;
	if ($parent.attr("data-enode") == "and") {
		ENODEremove($target);//if contained in an and simply remove the redundant term		
		markNeedsRefine($parent);
	}
	else {
		const $clone = ENODEclone(prototypeSearch("ci", "bool"))
		$clone[0].ENODE_setName('true');
		ENODEreplaceNode($target, $clone);
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
		ENODEappend($target, $dropped);
	}
	else {
		PActx.msg = "added Redundant or deduction"
	}
	PActx.matchedTF = true;
	PActx.replacedAlready = true;
	return PActx
}

function evaluateComparison($exp) {
	const PActx = newPActx();
	const comparisons = ["eq", "gt", "lt", "geq", "leq"];//todo: gestire geq e leq
	PActx.$operand = $exp;
	const ENODEClass = $exp.attr('data-enode');
	if (comparisons.indexOf(ENODEClass) != -1) {
		const $firstMember = $exp[0].ENODE_getRoles('.firstMember').children();
		const firstMember = ENODEsToVal($firstMember);
		const $secondMember = $exp[0].ENODE_getRoles('.secondMember').children();
		const secondMember = ENODEsToVal($secondMember);
		if (!isNaN(firstMember.computedVal) && !isNaN(secondMember.computedVal)) {
			const prototype = prototypeSearch("ci", "bool")
			let result
			if (ENODEClass === "eq") {
				result = firstMember.computedVal == secondMember.computedVal;
			}
			else if (ENODEClass === "gt") {
				result = firstMember.computedVal > secondMember.computedVal;
			}
			else if (ENODEClass === "geq") {
				result = firstMember.computedVal >= secondMember.computedVal;
			}
			else if (ENODEClass === "lt") {
				result = firstMember.computedVal < secondMember.computedVal;
			}
			else if (ENODEClass === "leq") {
				result = firstMember.computedVal <= secondMember.computedVal;
			}
			let stringResult
			if (result) { stringResult = "true" } else { stringResult = "false" }
			const $clone = ENODEclone(prototype);
			// $clone.attr('data-enode','cn');
			$clone[0].ENODE_setName(stringResult)
			ENODEinsertAfter($clone, $exp);
			$clone.addClass('selected');// il risultato rimane selezionato
			ENODEremove($exp);
			PActx.matchedTF = true;
			PActx.replacedAlready = true;
			PActx.msg = "composeInequation"
		}
	}
	return PActx
}

function forThisPar_focus_nofocus($specificValue, $parameter) {
	const PActx = newPActx();

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

// Proprietà HW invocabili da tastiera / #events via TryOnePropertyByName (ci[data-tag]).
// Il DnD resta su propertiesDnD (stesso file); unificazione futura nello stesso registro.
registerHardWiredMap({
	compose: compose,
	decomposeInAProduct: decomposeInAProduct,
	decomposeInASum: decomposeInASum,
	evaluateComparison: evaluateComparison
})
