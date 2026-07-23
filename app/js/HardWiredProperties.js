//newPActx è definita in PMTutilities.js: punto comune per proprietà hard-wired e pattern-based
// Le proprietà DnD si registrano in fondo al file (dopo le implementazioni) via registerHardWired.

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




/**
 * Dice se l'operazione è associativa (plus, times, or, and).
 * Usata da `ExpressionManager.js` e `calculateSpan.js`.
 * @param {string} op nome dell'operazione, es. "plus", "times"
 * @returns {boolean}
 */
function OpIsAssociative(op/* string ex: plus times*/) {
	const associatives = ["plus", "times", "or", "and"]
	return associatives.indexOf(op) !== -1 //class is in list of associatives?
}


/**
 * findTgt di `forThisDnD`: cerca tra gli header dei forAll visibili (escluso
 * il forAll che lega il dragged) i parametri (bvar) con tipo compatibile con
 * il nodo trascinato (`typeOk`).
 * @param {JQuery} mouseDownNode nodo trascinato (valore da specificare)
 * @returns {JQuery} parametri validi come target
 */
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
			$validTargetRoles = $validTargetRoles.add(ENODE_getRoles(e));
		});
		if ($alreadyClaimed && $alreadyClaimed.length) {
			$validTargetRoles = $validTargetRoles.not($alreadyClaimed)
		}
	}
	return $validTargetRoles
}

/**
 * findTgt di `associativeDnD`: ruoli della sola coppia parent/figlio con la
 * stessa operazione associativa (v. `associativeValid` con recursive=false).
 * @param {JQuery} $mouseDownENODE nodo trascinato
 * @param {boolean} [ctrlOrMeta] ignorato
 * @param {boolean} [altKey] ignorato
 * @param {JQuery} [$alreadyClaimed] ruoli già rivendicati da proprietà HW
 *   precedenti, esclusi dal risultato
 * @returns {JQuery} ruoli target validi
 */
function immediateAssValid($mouseDownENODE, ctrlOrMeta, altKey, $alreadyClaimed) {
	return associativeValid($mouseDownENODE, false, $alreadyClaimed)
}

/**
 * findTgt di `associativeGenDnD`: ruoli dell'intero cluster di operazioni con
 * la stessa operazione associativa (v. `associativeValid` con recursive=true).
 * @param {JQuery} $mouseDownENODE nodo trascinato
 * @param {boolean} [ctrlOrMeta] ignorato
 * @param {boolean} [altKey] ignorato
 * @param {JQuery} [$alreadyClaimed] ruoli già rivendicati da proprietà HW
 *   precedenti, esclusi dal risultato
 * @returns {JQuery} ruoli target validi
 */
function associativeGenValid($mouseDownENODE, ctrlOrMeta, altKey, $alreadyClaimed) {
	return associativeValid($mouseDownENODE, true, $alreadyClaimed)
}

/**
 * apply di `associativeDnD`/`associativeGenDnD`: il dropped è già stato
 * inserito da Sortable, quindi rimuove il dragged se non si sta clonando
 * (classe `toBeCloned`) e marca per il refine le operazioni di partenza e di
 * arrivo.
 * @param {JQuery} dragged nodo trascinato originale
 * @param {JQuery} target nodo/ruolo di destinazione
 * @param {JQuery} dropped clone già inserito nel punto di drop
 * @returns {PActx} matchedTF e replacedAlready true; `$transform` = antenato
 *   comune delle operazioni di partenza e arrivo
 */
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



/**
 * findTgt di `partDistributDnD` (distribuzione parziale): valido quando il
 * parent del dragged (es. un plus con altri fratelli) sta dentro l'operazione
 * che distribuisce su di lui (es. times); il target è la `ul_role` del
 * livello ancora superiore.
 * @param {JQuery} $mouseDownENODE nodo trascinato
 * @param {boolean} [ctrlOrMeta] se premuto la proprietà è disattivata
 * @returns {JQuery|Array} ruoli target validi (vuoto se non applicabile)
 */
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



/**
 * findTgt di `distributiveDnD`: il dragged deve essere argomento di
 * un'operazione distributiva (times, power, and); i target sono i suoi
 * siblings del tipo su cui essa distribuisce (opD, es. i plus fratelli).
 * @param {JQuery} $mouseDownENODE nodo trascinato
 * @param {boolean} [ctrlOrMeta] se premuto la proprietà è disattivata
 * @param {boolean} [altKey] se premuto la proprietà è disattivata
 * @returns {JQuery|Array} ENODE target validi (array vuoto se non applicabile)
 */
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
			$validTargets = $validTargets.add(ENODE_getRoles($validENODEs[i])[0])
		i++	
		} 	
		return $validTargets*/
		return $validENODEs
	}
	return [] //empty array
}

/**
 * apply di `partDistributDnD`: distribuzione parziale: nel punto del drop
 * crea un clone dell'operazione interna con le copie dei fattori fratelli e
 * vi reinserisce il dragged nella sua posizione originale; il dropped serve
 * solo come riferimento di inserimento e viene poi rimosso.
 * @param {JQuery} $dragged addendo trascinato
 * @param {JQuery} target ignorato
 * @param {JQuery} dropped clone inserito da Sortable nella posizione di drop
 *   (riferimento di inserimento, rimosso alla fine)
 * @returns {PActx}
 */
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
		ENODEappend(ENODE_getRoles($clone), $siblingClone);
	});
	const previous = ENODE_getRoles($clone).children().eq(childrenIndex - 1);
	ENODEinsertAfter($dragged, previous);
	markNeedsRefine($parent);
	ENODEremove(dropped);
	PActx.$transform = $parent;
	PActx.matchedTF = true
	return PActx
}

/**
 * apply di `distributiveDnD`: distribuisce il dragged su ogni argomento del
 * target (es. a·(b+c) → a·b + a·c) clonandolo per ciascun termine, poi
 * rimuove l'originale e marca per il refine le operazioni coinvolte.
 * @param {JQuery} $dragged fattore trascinato
 * @param {JQuery} target operazione (es. plus) sui cui argomenti distribuire
 * @param {JQuery} [dropped] ignorato
 * @returns {PActx}
 */
function ENODEdistribute($dragged, target, dropped) {
	const PActx = newPActx();
	PActx.replacedAlready = true;
	let $parent = ENODEparent($dragged);
	let op = undefined;
	if ($parent !== undefined) { op = $parent.attr("data-enode") }
	let opD = opIsDistDop(op);
	const $prototype = prototypeSearch(op)// for example search for times proto
	ENODE_getChildren($(target)).each(function (i, e) {
		markNeedsRefine(e);
		const $clone = ENODEclone($prototype)//create times
		const $cloneDragged = ENODEclone($dragged)// clone dragged
		ENODEinsertBefore($clone, $(this));
		ENODEappend(ENODE_getRoles($clone), $cloneDragged);
		if ($dragged.index() > target.index()) {
			ENODEprepend(ENODE_getRoles($clone), $(this));
		}
		else {
			ENODEappend(ENODE_getRoles($clone), $(this));
		}
		//$cloneDragged.css({display:""})
	})
	const $draggedParent = ENODEparent($dragged);
	markNeedsRefine($draggedParent);//mark external operation as remove if pointless
	markNeedsRefine(target);//mark target operation as remove if pointless
	ENODEremove($dragged);
	PActx.$transform = $parent;
	PActx.matchedTF = true
	return PActx
}

/**
 * findTgt di `collectDnD` (raccoglimento totale): valido se ogni termine
 * dell'operazione esterna contiene un fattore uguale al dragged (o è esso
 * stesso uguale); i fattori trovati vengono marcati con la classe
 * `CouldBeCollected` (usata poi da `ENODEcollect`). Il target è la `ul_role`
 * dell'ENODE esterno.
 * @param {JQuery} $mouseDownENODE fattore trascinato
 * @returns {JQuery} ruolo target (collezione vuota se non applicabile)
 */
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
	const $terms = ENODE_getChildren($parentParent) // ottieni la lista degli addendi
	for (let i = 0; i < $terms.length; i++) {
		const term = $terms[i]
		let okForThisTerm = false;
		if ($(term).attr('data-enode') == op) {// se l'addendo è di tipo times controlla ogni fattore
			const $factors = ENODE_getChildren(term)
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
	//return ENODE_getRoles($parentParent)
	return ENODEparent($parentParent).find('>.ul_role')//target is the external ENODE	
}

/**
 * findTgt di `partCollectDnD` (raccoglimento parziale): cerca tra i termini
 * fratelli (rispetto all'operazione distributiva in cui il dragged si trova)
 * i fattori uguali al dragged, oppure i termini stessi uguali al dragged.
 * @param {JQuery} $mouseDownENODE fattore/termine trascinato
 * @returns {JQuery} occorrenze uguali al dragged utilizzabili come target
 *   (collezione vuota se non applicabile)
 */
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
			const $factors = ENODE_getChildren(term)
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

/**
 * apply di `partCollectDnD`: raccoglie il fattore comune tra i soli due
 * termini coinvolti, costruendo (o riusando) il contenitore "plus" con i
 * restanti fattori dei due termini; l'ordine dei due addendi eredita quello
 * dei termini di partenza.
 * @param {JQuery} $dragged fattore trascinato
 * @param {JQuery} $target fattore uguale nel termine di destinazione
 * @returns {PActx} fallito (matchedTF=false) se i due parent non hanno la
 *   stessa operazione distributiva
 */
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
				$termT = ENODE_getChildren($siblingsT)
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
				$termD = ENODE_getChildren($siblingsD)
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
		const $plusRole = ENODE_getRoles($opPlus)
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
	return PActx//guardia fallita: PActx con matchedTF=false (contratto §3.1)
}

/**
 * apply di `collectDnD`: raccoglie il fattore comune: rimuove il dragged e le
 * occorrenze marcate `CouldBeCollected` (imbastite da `validForColl`),
 * avvolgendo se necessario l'operazione esterna in un contenitore del tipo
 * giusto.
 * @param {JQuery} $dragged fattore trascinato
 * @param {JQuery} $target ignorato (si affida alla classe `CouldBeCollected`
 *   già presente nel DOM)
 * @returns {PActx}
 */
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
			const name = ENODE_getName($toBeComp)
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
				const $minusContent = ENODE_getChildren($minus);
				$extOp = $minusParent;
				if ($minusParent.attr('data-enode') == 'times') {//aggiungi il -1 all'interno del minus parent
					ENODEinsertBefore($minusOne, $minus);
				}
				else {
					if ($minusContent.attr('data-enode') !== 'times') {//è necessario aggiungere una enclosure di tipo "times"
						$minusContent = wrapWithOperation($minusContent, 'times')
					}
					ENODEprepend(ENODE_getRoles($minusContent), $minusOne);
				}
				//******Rimuovi il MINUS
				ENODEinsertAfter($minusContent, $minus);
				markNeedsRefine($minusContent);//if the content was a "times" it may by dissolved if the parent is also times
				ENODEremove($minus);

				//var $roleContainingFactors = ENODE_getRoles($minusContent);
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
		else if( ENODE_getName($toBeDec) === "true"){
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


/**
 * findTgt di `replaceDnD`: il dragged deve essere membro di un'equazione (non
 * di una definizione); i target sono le occorrenze uguali al dragged nelle
 * proposizioni a valle (v. `findvalidReplacedOrPremise`).
 * @param {JQuery} $mouseDownENODE membro di equazione trascinato
 * @returns {JQuery|Array} occorrenze sostituibili (array vuoto se non applicabile)
 */
function validReplaced($mouseDownENODE) {
	if (!($mouseDownENODE.parent().parent().is("[data-enode=eq]") && !isDefinition($mouseDownENODE.parent().parent()[0]))) {
		return []//not from an equation	or implies
	}
	if (!($mouseDownENODE.parent().hasClass('firstMember') || $mouseDownENODE.parent().hasClass('secondMember'))) {
		return []
	}// dragged is not a membrer of equation 
	return findvalidReplacedOrPremise($mouseDownENODE)
}

/**
 * findTgt di `modusPonensDnD`: il dragged deve essere il primo membro
 * (premessa) di un `implies`; i target sono le occorrenze uguali al dragged
 * nelle proposizioni a valle (v. `findvalidReplacedOrPremise`).
 * @param {JQuery} $mouseDownENODE premessa trascinata
 * @returns {JQuery|Array} occorrenze della premessa (array vuoto se non applicabile)
 */
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

/**
 * apply di `replaceDnD`: sostituisce l'occorrenza target con un link al
 * membro dell'equazione trascinato (delega a `ENODEReplaceLink`).
 * @param {JQuery} $link membro di equazione trascinato (sorgente del link)
 * @param {JQuery} $replaced occorrenza da sostituire
 * @returns {PActx}
 */
function ENODELinkReplace($link, $replaced) {
	const PActx = newPActx();
	PActx.replacedAlready = true;
	ENODEReplaceLink($replaced, $link);
	PActx.matchedTF = true
	return PActx
}
/**
 * apply di `modusPonensDnD` (incompleta, v. TODO in software-modules.md):
 * clona la conclusione dell'implicazione e la inserisce dopo l'occorrenza
 * della premessa; il wrap in `and` della premessa è solo abbozzato in un
 * commento.
 * @param {JQuery} $premiseInProperty premessa trascinata (primo membro dell'implies)
 * @param {JQuery} $premise occorrenza della premessa nel documento
 * @returns {PActx} con replacedAlready=true ma matchedTF mai impostato
 *   (resta false: anomalia)
 */
function ENODEModusPonens($premiseInProperty, $premise){
	const PActx = newPActx();
	PActx.replacedAlready = true;
	if(!ENODEparent($premise).is('[data-enode=and]')){
		//wrap with AND
	}
	//create clone
	
	let $clone = ENODEclone(
		ENODE_getRoles(ENODEparent($premiseInProperty), ".secondMember").children()
	);
	//isert deduction after $premise
	ENODEinsertAfter($clone, $premise);
	return PActx
}

/**
 * findTgt di `removeRedundantDnD`: attivo solo con Alt premuto e dragged
 * booleano; cerca nodi uguali al mousedown node tra le proposizioni a valle
 * visibili (es. `validRedundant($('.selected'))`).
 * @param {JQuery} $mouseDownENODE espressione booleana trascinata
 * @param {boolean} [ctrlOrMeta] ignorato
 * @param {boolean} [altKey] richiesto true, altrimenti lista vuota
 * @returns {JQuery|Array} occorrenze ridondanti (array vuoto se non applicabile)
 */
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

/**
 * findTgt di `addRedundantDnD`: attivo solo con Ctrl/Meta premuto e dragged
 * booleano; i target sono i ruoli calcolati da
 * `$calculateTargetsAddRedundantROLES` (dove il termine ridondante può essere
 * aggiunto).
 * @param {JQuery} $mouseDownENODE espressione booleana trascinata
 * @param {boolean} [ctrlOrMeta] richiesto true, altrimenti lista vuota
 * @returns {JQuery|Array} ruoli target validi (array vuoto se non applicabile)
 */
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


/**
 * Target validi per il drop di un elemento di pattern: gli ENODE visibili
 * nelle proposizioni raggiungibili dalla proprietà originale (esclusi la
 * proprietà stessa e i suoi discendenti) con data-type compatibile con il
 * dragged (`typeOk`) e non congelati da una definizione (`ENODEfrozenDef`).
 * Usata da `DnD.js`.
 * @param {JQuery} $mouseDownENODE nodo trascinato (elemento del pattern)
 * @param {JQuery} $originalProperty proprietà da cui il pattern proviene,
 *   esclusa dai target
 * @returns {JQuery} candidati validi
 */
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

/**
 * findTgt di `hanoiMoveDnD`: il dragged deve essere il disco in cima a
 * un'asta (`hanoirod`) di un `hanoi`; i target sono le aste vuote o con in
 * cima un disco più grande del dragged.
 * @param {JQuery} $mouseDownENODE disco trascinato
 * @returns {JQuery|Array} aste valide (array vuoto se non applicabile)
 */
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
	let draggedDiscNum = parseInt(ENODE_getName($mouseDownENODE));
	let $filterdSiblings = $parentRod.siblings().filter(function () {
		let $topDisc = ENODE_getChildren(this, ':first');
		if ($topDisc.length == 0) { return true };
		let topDiscNum = parseInt(ENODE_getName($topDisc))
		return topDiscNum > draggedDiscNum;
	});
	return $filterdSiblings
}
/**
 * apply di `hanoiMoveDnD`: sposta il disco trascinato in cima all'asta di
 * destinazione.
 * @param {JQuery} dragged disco trascinato
 * @param {JQuery} target asta di destinazione
 * @param {JQuery} [dropped] ignorato
 * @returns {PActx}
 */
function hanoiMove(dragged, target, dropped) {
	const PActx = newPActx();
	ENODEprepend(ENODE_getRoles(target), $(dragged));
	PActx.matchedTF = true;
	PActx.replacedAlready = true;
	PActx.msg = "moved";
	//PActx.$transform = target.parent().parent()//not optimized, should update the older closest common parent
	return PActx;
}





/**
 * apply di `removeRedundantDnD`: rimuove il termine ridondante: se è
 * contenuto in un `and` lo elimina semplicemente, altrimenti lo sostituisce
 * con `true`.
 * @param {JQuery} $dragged ignorato
 * @param {JQuery} $target occorrenza ridondante da rimuovere
 * @returns {PActx}
 */
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
		ENODE_setName($clone, 'true');
		ENODEreplaceNode($target, $clone);
	}
	PActx.matchedTF = true
	PActx.$transform = $parent
	PActx.msg = "removed Redundant"
	return PActx
}

/**
 * apply di `addRedundantDnD`: aggiunge il termine ridondante (o la
 * deduzione): se il target è un ENODE lo avvolge in un `and` e vi appende il
 * dropped; se è già un ruolo il dropped è già al suo posto.
 * @param {JQuery} $dragged ignorato
 * @param {JQuery} $target ruolo o ENODE di destinazione
 * @param {JQuery} $dropped clone del dragged già inserito da Sortable
 * @returns {PActx}
 */
function addRedundant($dragged, $target, $dropped) {
	let PActx = newPActx();
	$($dropped).removeClass('toBeCloned');//in case class 'toBeCloned' is present rempve it
	if ($target.attr('data-enode')) {//if target is an ENODE, create an AND around it
		let $extOp = wrapWithOperation($target, 'and')
		$target = ENODE_getRoles($extOp)
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
		const $firstMember = ENODE_getRoles($exp, '.firstMember').children();
		const firstMember = ENODEsToVal($firstMember);
		const $secondMember = ENODE_getRoles($exp, '.secondMember').children();
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
			ENODE_setName($clone, stringResult)
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

/**
 * Specifica un parametro di un forAll con un valore concreto ("forThis"),
 * delegando a `ENODEForThisPar` sul forAll parent del parametro.
 * Usata da `MAIN.js` e come apply della voce DnD `forThisDnD`
 * (dragged = valore concreto, target = parametro nell'header).
 * @param {JQuery} $specificValue valore concreto da sostituire al parametro
 * @param {JQuery} $parameter parametro (bvar) nell'header del forAll
 * @returns {PActx} con replacedAlready=true e `$transform` = risultato di
 *   `ENODEForThisPar`
 */
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

// Proprietà HW unary (tastiera / #events) e DnD.
// DnD: PRIORITY first-wins = ordine di registrazione (stesso ordine della vecchia propertiesDnD).
registerHardWiredMap({
	compose: compose,
	decomposeInAProduct: decomposeInAProduct,
	decomposeInASum: decomposeInASum,
	evaluateComparison: evaluateComparison
})

;[
	{ name: 'hanoiMoveDnD', findTgt: validhanoiMove, apply: hanoiMove },
	{ name: 'addRedundantDnD', findTgt: validAddRedundant, apply: addRedundant },
	{ name: 'removeRedundantDnD', findTgt: validRedundant, apply: removeRedundant },
	{ name: 'forThisDnD', findTgt: forThisValid, apply: forThisPar_focus_nofocus },
	{ name: 'modusPonensDnD', findTgt: validModusPonens, apply: ENODEModusPonens },
	{ name: 'replaceDnD', findTgt: validReplaced, apply: ENODELinkReplace, requiresCanvasCi: false },
	{ name: 'partCollectDnD', findTgt: validForPartColl, apply: ENODEpartCollect },
	{ name: 'collectDnD', findTgt: validForColl, apply: ENODEcollect },
	{ name: 'partDistributDnD', findTgt: validForPartDist, apply: ENODEPartDistribute },
	{ name: 'distributiveDnD', findTgt: validForDist, apply: ENODEdistribute },
	{ name: 'associativeGenDnD', findTgt: associativeGenValid, apply: ENODEassociate },
	{ name: 'associativeDnD', findTgt: immediateAssValid, apply: ENODEassociate }
].forEach(function (d) {
	registerHardWired({
		name: d.name,
		kind: 'dnd',
		findTgt: d.findTgt,
		apply: d.apply,
		requiresCanvasCi: d.requiresCanvasCi !== false
	})
})
