function newPActx(){
	//msg: in caso data di matchedTF=true contiene il nome della proprietà applicata
	//in caso contrario dovrebbe contenere il motivo del noMatch.
	//$transform deve contenere il più grande elemento trasformato
	return {matchedTF:false,
		msg:"",visualization:"",
		$cloneProp: undefined ,
		$pattern: undefined,
		$operand: undefined,
		$transform: undefined,//must be the the biggest element changed, his parent will be considered when upadating infix ecc..
		$equation: undefined,
		replacedAlready: false ,
		lineList:$()}
}

class PropertyDnD  {
  constructor(name,findTgt,apply,onAdd) {
    this.name = name
    this.findTgt = findTgt//return valid target roles
    this.apply = apply	// in onEndHandler when an element is dropped on a valid target apply($dropped,$target) 
    this.onAdd = onAdd //handler of event fired when a valid dragged is added to a valid role
  }
}

let propertiesDnD = [
//new PropertyDnD('openedDnD',validTargetsFromOpened,),  // come gestisco il +ctrl?
new PropertyDnD('associativeDnD',immediateAssValid,ATOMassociate,""),
new PropertyDnD('distributiveDnD',validForDist,ATOMdistribute,""),
new PropertyDnD('partDistributDnD',validForPartDist,ATOMPartDistribute,""),
new PropertyDnD('collectDnD',validForColl,ATOMcollect,""),
new PropertyDnD('partCollectDnD',validForPartColl,ATOMpartCollect,""),
new PropertyDnD('replaceDnD',validReplaced,ATOMLinkReplace,""),
new PropertyDnD('forThisDnD',forThisValid,forThisPar_focus_nofocus,""),
new PropertyDnD('removeRedundantDnD',validRedundant,removeDropped,"")
]



function ATOMneedsBracket($ATOM)
{
	var ATOMclass= $ATOM.attr('data-atom')  //
	var parentClass = ATOMparent($ATOM).attr('data-atom')//
	// futuribile:
	//var parentRole = da completare per poter distinguere se in quale "role" è contenuto
	//la stringa che identifica la posizione dovrebbe diventare <ATOMtype>.<role>
	
	
	//in each row: first element needs bracket if contained in itself or one of the elements in his row
	var MatrixBaracketNeeded = [ 
		["plus","times","power"],// first container
		["times","power"],
		["minus"],
		["m_inverse"],
		["and"],
		["or"]
	];
	
	var ATOMclassIndex = getCol(MatrixBaracketNeeded,0).indexOf(ATOMclass)
	if ( ATOMclassIndex != -1 )
	{
		var row = MatrixBaracketNeeded [ATOMclassIndex];
		return row.indexOf(parentClass) != -1; // found in matrix
	}
	return false // if not found, bracket not needed
}





function opIsDistDop(op,opD){// string ex: plus times 
	//opIsDistDop('times') cerca su chi si distribuicse times
	//opIsDistDop('','plus') cerca quale operazione è distributiva su plus
	let key_distributesOver_Val = {'times':'plus','power':'times','and':'or'}
	if(op != ""){
		return key_distributesOver_Val[op]	
	}
	else if(opD){
		return getKeyByValue(key_distributesOver_Val,opD)
	}
	
}




function OpIsAssociative(op/* string ex: plus times*/){
	var associatives=["plus","times","or","and"]
	return associatives.indexOf(op) !== -1 //class is in list of associatives?
}



function openOnSort(event){//default onAdd
	if(event.item.classList.contains('toBeCloned')){
		if(event.from.isSameNode(event.to)){
			let nextChildren = event.from.children[event.oldIndex]
			let clone = ATOMclone($(event.item))[0];
			ExtendAndInitializeTree($(clone));
			if(nextChildren){
				//copy back to starting role with ctrl+DnD
				event.from.insertBefore(clone, nextChildren);	
			}
			else{
				event.from.append( clone );
			}
		}
	}	
}






function revert(event){//revert a sortablejs onAdd event
	let nextChildren = event.from.children[event.oldIndex]
	if(nextChildren){
	event.from.insertBefore(event.item, nextChildren);	
	}
	else{
		event.from.append(event.item)
	}
	event.clone.remove();
}
function forThisValid(mouseDownNode){
	let dataType = mouseDownNode[0].getAttribute('data-type');
	let $excludedForall = $identifierSpan($(mouseDownNode)).filter('[data-atom=forAll]');
	console.log($excludedForall[0]);
	let forAlls = $('[data-atom=forAll]:visible').not($excludedForall).toArray();//querySelectAll does not work with :visible?
	let $parameters = $()
	let i=0
	while(forAlls[i]){
		$parameters = $parameters.add(GetforAllHeader($(forAlls[i])).find('[data-atom]'));
	i++
}

let $valids=$parameters.filter(function(i,el){return typeOk(mouseDownNode,$(el))});
return $valids
}






function immediateAssValid($mouseDownAtom){
	const $parent = ATOMparent($mouseDownAtom);
	let op;
	if ($parent !== undefined){op = $parent.attr("data-atom")}
	let validTargets = $();
	if( OpIsAssociative(op)){
		//parent is a target-associative?
		if(ATOMparent($parent).attr("data-atom") === op ){
			validTargets = validTargets.add( ATOMparent($parent)[0].ATOM_getRoles());
		}
		//children are validTargets?
		var ATOMchildren = $parent[0].ATOM_getChildren();
		ATOMchildren.each(function(i,e){
			 if( $(e).attr("data-atom") === op ){
			validTargets = validTargets.add(e.ATOM_getRoles());
			 }
		});
	}
	return validTargets
}

function ATOMassociate(dragged,target,dropped){
	var PActx = newPActx();
	if($(dropped).hasClass('toBeCloned')){
			$(dropped).removeClass('toBeCloned');
		}
	else{
		$(dragged).remove(); // if not cloning, clone was useful to visualize the starting point 	
	}
	PActx.visualization = "images/properties/associate.png"	
	PActx.matchedTF=true;
	PActx.replacedAlready = true;
	PActx.msg = "associated";
	//PActx.$transform = target.parent().parent()//not optimized, should update the older closest common parent
	return PActx;
}



function getKeyByValue(dictionary,value ) {
    for( var prop in dictionary ) {
        if( dictionary.hasOwnProperty( prop ) ) {
             if( dictionary[ prop ] === value )
                 return prop;
        }
    }
}




function validForPartDist($mouseDownAtom){
	let $parent = ATOMparent($mouseDownAtom);
	var $siblings = $parent.siblings('[data-atom]');
	if($siblings.length == 0){return $()}//nothing to distribute
	let opD = undefined;
	if ($parent !== undefined){opD = $parent.attr("data-atom")}
	let op = opIsDistDop("",opD);
	if(op && ATOMparent($parent).attr("data-atom")==op){
		return ATOMparent(ATOMparent($parent)).find('>.ul_role')
	}
	/*
	if(op && ATOMparent($parent).attr("data-atom") === op){//check if parent of parent is the right op
		if(ATOMparent(ATOMparent($parent))){
			return ATOMparent(ATOMparent($parent))
		}
		else{
			return encaseWithOperation($siblingsT,op)
		}
	}
	*/
	return $()
}



function validForDist($mouseDownAtom){//op2 è il tipo di operazione sulla quale si distribuisce
	var $parent = ATOMparent($mouseDownAtom);
	let op = undefined;
	if ($parent !== undefined){op = $parent.attr("data-atom")}
	let opD = opIsDistDop(op);
	
	if ( opD !== undefined ){
		//return $mouseDownAtom.siblings().filter("[data-atom="+opD+"]")	
		$validAtoms = $mouseDownAtom.siblings().filter("[data-atom="+opD+"]")
		/*
		let $validTargets = $()
		let i=0;
		
		while($validAtoms[i]){
			$validTargets = $validTargets.add($validAtoms[i].ATOM_getRoles()[0])
		i++	
		} 	
		return $validTargets*/
		return $validAtoms
	}
	return [] //empty array
}

function ATOMPartDistribute(dragged,target,dropped){
	var PActx = newPActx();
	PActx.replacedAlready = true;
	PActx.visualization = "images/properties/distributive.png"
	let $dragged = $(dragged)
	let childrenIndex = ATOMparent($dragged).index()
	let $parent = ATOMparent($dragged);
	let opD ;
	if ($parent !== undefined){opD = $parent.attr("data-atom")}
	let op = opIsDistDop("",opD);
	var $siblings = $parent.siblings('[data-atom]'); // ottieni la lista degli altri fattori
	$extOp = encaseIfNeeded( ATOMparent($parent),opD);//se necessario crea una operazione container
	let $prototype = prototypeSearch(op);
	let $clone = ATOMclone($prototype)//create times
	ExtendAndInitializeTree($clone);
	$clone.insertBefore(dropped);
	$siblings.each(function(i,e){
		var $siblingClone = ATOMclone($(e));
		ExtendAndInitializeTree($siblingClone);
		$clone[0].ATOM_getRoles().append($siblingClone);
	});
	let previous = $clone[0].ATOM_getRoles().children().eq(childrenIndex-1);
	$dragged.insertAfter(previous);
	$parent.addClass("cleanifpointless");
	dropped.remove();
	PActx.$transform =  $parent;
	PActx.matchedTF=true
	return PActx
}

function ATOMdistribute(dragged,target,dropped){
	var PActx = newPActx();
	PActx.replacedAlready = true;
	PActx.visualization = "images/properties/distributive.png"
	let $dragged = $(dragged)
	let $parent = ATOMparent($dragged);
	let op = undefined;
	if ($parent !== undefined){op = $parent.attr("data-atom")}
	let opD = opIsDistDop(op);
	var $prototype = prototypeSearch(op)// for example search for "#timesPrototype"
	$(target)[0].ATOM_getChildren().each(function(i,e){
		e.classList.add("cleanifpointless");
		var $clone = ATOMclone($prototype)//create times
		var $cloneDragged = ATOMclone($dragged)// clone dragged
		ExtendAndInitializeTree($clone);// dai vita a clone ed al suo albero
		ExtendAndInitializeTree($cloneDragged);
		$clone.insertBefore($(this));
		$clone[0].ATOM_getRoles().append($cloneDragged);
		if(dragged.index()>target.index()){ 
			$clone[0].ATOM_getRoles().prepend($(this));
		}
		else{
			$clone[0].ATOM_getRoles().append($(this));	
		}
		//$cloneDragged.css({display:""})
	})
	var $draggedParent = dragged[0].ATOMparent(); 
	$draggedParent.addClass("cleanifpointless");//mark external operation as remove if pointless
	dragged.remove();
	PActx.$transform =  $parent;
	PActx.matchedTF=true
	return PActx
}

function validForColl($mouseDownAtom){
	var $parent = ATOMparent($mouseDownAtom);
	var op = undefined
	if($parent !== undefined){op = $parent.attr("data-atom")};//look for targets
	var opD = opIsDistDop(op);
	//$('*').removeClass('toBeCollected').removeClass('couldBeCollected');//evidenziore l'imbastitura e rimuoverla in unica funzione
	//*******test preliminari
	if ($parent == undefined){
		return $() //empty $ array
	}
	var $parentParent = ATOMparent($parent);
	if ( 
		opD == undefined
		||
		$parentParent == undefined
		||
		$parentParent.attr('data-atom') !== opD
		){
		return $() //empty $ array
	}
	//***** test su ciascun termine
	var $terms = $parentParent[0].ATOM_getChildren() // ottieni la lista degli addendi
	for (i = 0; i < $terms.length ; i++){
		var term=$terms[i]
		var okForThisTerm = false;
		if($(term).attr('data-atom')==op){// se l'addendo è di tipo times controlla ogni fattore
			var $factors = term.ATOM_getChildren()
			for (j = 0; j < $factors.length ; j++){
				var factor=$factors[j]
				//console.log("controllo factor");
				//console.log(factor);
				if(ATOMEqual(factor,$mouseDownAtom[0])){
					$(factor).addClass("couldBeCollected")
					okForThisTerm = true;
					break
				}
			}
		}
		else{// altrimenti controlla lui stesso
			if(ATOMEqual(term,$mouseDownAtom[0])){
					$(term).addClass("couldBeCollected")
					okForThisTerm = true;
				}
		}
		if(okForThisTerm === false){
			//console.log("term without such factor");
			//console.log(term);
			return $()
		}
	};
	console.log('okForCollection')
	//return $parentParent[0].ATOM_getRoles()
	return ATOMparent($parentParent).find('>.ul_role')//target is the external atom	
}

function validForPartColl($mouseDownAtom){
	var $parent = ATOMparent($mouseDownAtom);
	if ($parent == undefined){
		return $() //empty $ array
	}
	var $valids = $();
	var $plusParent ;
	var opP;
	var opT;
	var op = $parent.attr("data-atom");
	var opP = opIsDistDop(op);
	if(opP){// dragged is into a "times"
		$plusParent = ATOMparent($parent);//candidate plus parent will be checked later
		opT=op
	}
	else{
		//check if the dragged is directrly into a "plus"
		opT = opIsDistDop("",op);
		if(opT !== undefined){
			opP=op;
			$plusParent = $parent;
			$parent = $mouseDownAtom;
		}
	}
	
	//$('*').removeClass('toBeCollected').removeClass('couldBeCollected');//evidenziore l'imbastitura e rimuoverla in unica funzione
	//*******test preliminari
	
	if ( 
		opP == undefined //if no distributive operation is found
		||
		$plusParent == undefined
		||
		$plusParent.attr('data-atom') !== opP
		){
		return $() //empty $ array
	}
	//***** test su ciascun termine
	var $siblings = $parent.siblings('[data-atom]')
	for (i = 0; i < $siblings.length ; i++){
		var term=$siblings[i]
		var okForThisTerm = false;
		if($(term).attr('data-atom')==opT){// se l'addendo è di tipo times controlla ogni fattore
			var $factors = term.ATOM_getChildren()
			for (j = 0; j < $factors.length ; j++){
				var factor=$factors[j]
				//console.log("controllo factor");
				//console.log(factor);
				if(ATOMEqual(factor,$mouseDownAtom[0])){
					$valids = $valids.add(factor);
				}
			}
		}
		else{// altrimenti controlla lui stesso
			if(ATOMEqual(term,$mouseDownAtom[0])){
					$valids = $valids.add(term);
				}
		}
	};
	return $valids	
}

function ATOMpartCollect($dragged,$target){
	var PActx = newPActx();
	PActx.replacedAlready = true;
	PActx.visualization = "images/properties/collect.png"
	let $targetParent = ATOMparent($target);
	let $siblingsT = $target.siblings('[data-atom]')
	let opt = $targetParent.attr("data-atom")
		
	let $draggedParent = ATOMparent($dragged);
	let $siblingsD = $dragged.siblings('[data-atom]')
	let opd = $draggedParent.attr("data-atom")
		
	let $commonGranParent = ATOMparent($targetParent);
	$commonGranParent.addClass("cleanifpointless");


	if(opt==opd && opIsDistDop(opt)){//both have same distributable op
		var opPlus = opIsDistDop(opt)//opPlus may be plus,or, other operation over wich you distribute 
		var $prototype = prototypeSearch(opPlus)// for example search for "#timesPrototype"
		var $opPlus
		var $termT
		var $termD
		if($siblingsT.length==1){
			if($siblingsT.eq(0).attr("data-atom")==opPlus){//if 'plus' ther's no need to create a new plus container
				$opPlus = $siblingsT
				$termT = $siblingsT[0].ATOM_getChildren()
				$termT.remove();//svuoto il target plus e poi lo riempio ordinatamente
				//il plus si trova già all'interno del target, quindi non lo sposto
			}
			else{
				$termT = $siblingsT;
			}
		}
		else{
			$termT =(encaseWithOperation($siblingsT,opt));	
		}
		if($siblingsD.length==1){
			if(!$opPlus && $siblingsD.eq(0).attr("data-atom")==opPlus){//if 'plus' ther's no need to create a new plus container
				$opPlus = $siblingsD
				$termD = $siblingsD[0].ATOM_getChildren()
				$termD.remove();//svuoto il target plus e poi lo riempio ordinatamente
				$opPlus.insertBefore($termT);//preferisco mettere sempre il plus all'interno del target 
				$termT.remove();
			}
			else{
				$termD= $siblingsD;
			}
		}
		else{
			$termD=(encaseWithOperation($siblingsD,opt));	
		}
		if(!$opPlus){//if a suitable "plus" container has not been found create a new one
			$opPlus= ATOMclone($prototype)//create times
			ExtendAndInitializeTree($opPlus);
			$opPlus.insertBefore($termT);
			$termT.remove();
		}
		var $plusRole = $opPlus[0].ATOM_getRoles() 
		if($targetParent.index()>$draggedParent.index()){//order of terms is inherited from order of oarents
			$plusRole.append($termD);
			$plusRole.append($termT);	
		}
		else{
			$plusRole.append($termT);
			$plusRole.append($termD);
		}
		PActx.$transform =  ATOMparent($draggedParent);
		$draggedParent.remove()
		PActx.matchedTF=true
		return PActx
	}
}

function ATOMcollect($dragged,$target){
	var PActx = newPActx();
	PActx.replacedAlready = true;
	PActx.visualization = "images/properties/collect.png"
	let $parent = ATOMparent($dragged);
	let $parentParent = ATOMparent($parent);
	let op = undefined;
	if ($parent !== undefined){op = $parent.attr("data-atom")}
	var extOp 
	extOp = encaseIfNeeded($parentParent,op)
	ATOMparent($dragged).addClass("cleanifpointless")
	ATOMparent($(".couldBeCollected")).addClass("cleanifpointless")
	//$dragged.insertBefore($parentParent);
	$dragged.remove();
	$(".couldBeCollected").remove()
	$parentParent.addClass("cleanifpointless");
	PActx.$transform =  extOp;
	PActx.matchedTF=true
	return PActx
}



function compose($toBeComp){
	var $originaltoBeComp = $toBeComp //per poter ripristinare lo stato iniziale
	var PActx = newPActx();
	//**** la funzione può essere applicata?
	var $parent=ATOMparent($toBeComp);
	var op = $parent.attr('data-atom');
	if($toBeComp.length == 0){PActx.msg = ("nothing selected"); return PActx}
	//se 1 solo selezionato cerca di comporlo con l'antecedente'
	if($toBeComp.length == 1){
		//controlla se si tratta di elemento neutro, in tal caso fallo semplicemente sparire.
		var tBcClass = $toBeComp.attr("data-atom"); 
		if( tBcClass === "cn" || tBcClass === "ci"){
			var name = $toBeComp[0].ATOM_getName()
			/*
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
			*/

		}
		var $AtomBesideSelected

		//Attualmente il contenuto dei role si dispone leftRight e topDown mentre comporre è visto come left e down.
		//di conseguenza per decidere qual'è l'elemento con cui comporre devo distiguere a seconda dell'orientazione.'
		if( $toBeComp.parent().css('flex-direction') === "row"){
			$AtomBesideSelected = $(".selected").prevAll('[data-atom]:first');
		}
		else{
			$AtomBesideSelected = $(".selected").nextAll('[data-atom]:first');
		}
		$AtomBesideSelected.addClass("selected");
		$toBeComp = $toBeComp.add($AtomBesideSelected);
		//debug colors
		$('*').removeClass("toBeComposed");
    	//Debug add colors
    	ATOMnodesAddClass($toBeComp,"toBeComposed");	
	}
	if( !checkSiblings($toBeComp)){PActx.msg = ("not siblings"); return PActx}
	//*** calcolo generale 
	//Pattern Matching
	ATOMSmarkUnmark($toBeComp,"d")
	//calcolo via algoritmi specifici
	if( op !== "plus" && op !== "times" && op !== "or"){PActx.msg = ("no composition defined for: " + op); return PActx};
	//**** calcolo via algoritmo ****
		
	var partial = undefined
	for (var i = 0, len = $toBeComp.length; i < len; i++){//for perchè potrebbe sommare o moltiplicare una lista di n elementi
		var currRes = AtomsToVal( $($toBeComp[i]));
		if(currRes.val == 0 && currRes.exp == -1){// trovato elemento "indigesto" /0
			console.warn("1/0 is meaningless")
			PActx.matchedTF=false;//non procedere alla sostituzione
			break
		}
		if( currRes.type !== "cn" && currRes.type !== "ci"){// trovato elemento "indigesto"
			partial = currRes
			PActx.matchedTF=false;
			break
		}
		if( partial == undefined){//*** prima iterazione, il risultato parziale coincide con il primo operando
			partial = currRes;
		}
		else{
			if( op === "times" ){
				//conteggia segni
				partial.sign = partial.sign * currRes.sign;
				//conteggia il valore
				if( partial.val == 1){//se il parziale ha valore 1
					partial.val = currRes.val;
					partial.exp = currRes.exp;
					partial.type = currRes.type;
					PActx.matchedTF = true;//composed!!
				}
				else if( currRes.val == 1){
					//se valore currRes ha valore 1, non è necessario modificare altro oltre il segno che è già stato computato
					PActx.matchedTF = true;//composed!!
				}
				else if( partial.val === currRes.val && (partial.exp == currRes.exp * -1) ){//reciproci? C.E. se ha senso l’esp iniziale lo ha anche questa operazione
					partial.exp = 1;
					partial.val  = 1;
					partial.type = "cn";
					PActx.matchedTF = true;//composed!!
				}
				else if( currRes.type === "cn" && partial.type === "cn" && (partial.exp == currRes.exp)){//esponenti concordi
					partial.val = partial.val * currRes.val;
					PActx.matchedTF = true;//composed!!
				}
				else if(false){
					var num
					var den
					if(partial.exp == 1){
						num = partial.val;
						den = currRes.val;
					}
					else{
						num = currRes.val;
						den = partial.val;
						}
					if( num%den == 0){//divisione tra interi ?? tarpare ??
						partial.val = num/den;
					}
					else{
						//partial.canBeReplaced = false;
						PActx.matchedTF=false;//se nessun tentativo è andato a buon fine...
						break	
					}
				}
				else{
					//partial.canBeReplaced = false;
					PActx.matchedTF=false;//se nessun tentativo è andato a buon fine...
					break
				}
			}
			else if( op === "plus"){

				if( partial.val == 0){//se il parziale ha valore 0
					partial = currRes;
					PActx.matchedTF = true;//composed!!
				}
				else if( currRes.val == 0){//se valore currRes ha valore 0, non è necessario modificare 
					PActx.matchedTF = true;//composed!!
				}
				else if( currRes.type === "cn" && partial.type === "cn"){//numerici
					//compute algebric val
					var algRes = currRes.val * currRes.sign + partial.val * partial.sign;
					partial.val = Math.abs(algRes);
					partial.sign = Math.sign(algRes)
					PActx.matchedTF = true;//composed!!
				}
				else if(currRes.type === "ci" && partial.type === "ci" && (currRes.exp == partial.exp) && (currRes.sign == partial.sign * -1) ){//opposti?
							partial.val = 0;
							partial.exp = 1;
							partial.sign = 1;
							PActx.matchedTF = true;//composed!!
				}
				else{
						//partial.canBeReplaced = false;
						break
				}
			
			}
			else if(op === "and"){
				partial = currRes
				//partial.canBeReplaced = false;
				break

			}
		}
	}
	//if( partial.canBeReplaced){ 
	if( PActx.matchedTF == true){
		///****Create Result********
		
		$composed= ValToAtoms(partial);

		$composed = ValToAtoms(partial);
		$composed.addClass('selected');//selezione in uscita
		PActx.$operand = $toBeComp;
		PActx.visualization = "images/properties/compose.png";
		PActx.msg = "compose";
		
		
		PActx.replacedAlready=true;
		$composed.insertBefore(PActx.$operand[0]);
		PActx.$operand.remove()
		ExtendAndInitializeTree($composed);
		$parent.addClass('cleanifpointless');
		PActx.$transform = $parent; 
	}
	else {//rimetti le cose come stavano tranne le semplificazioni iniziali
		$('.selected').removeClass('selected')
		$originaltoBeComp.addClass('selected')
		ATOMSmarkUnmark($toBeComp,"")	
	}
	return PActx
}

function decompose($toBeDec,direction){//"up" for factorize
	var PActx = newPActx();
	PActx.$operand = $toBeDec;
	var op = ""
	var $extOp = ""
	//var $toBeDec=$('.selected')
	var TBDdataType = $toBeDec.attr("data-type")
	//**** la funzione può essere applicata?
	if($toBeDec.length !== 1){console.log("cant decompose " + $toBeDec.length + " elements"); return}
	//**** applica la funzione
	var toBeDec = AtomsToVal($toBeDec)
	if(TBDdataType === "num"){
		//scomposizione di un numero in verticale è fattorizzazione : op = times
		if(direction === "up"){
			op = "times";
			if( $toBeDec.attr('data-atom')==='minus' ){
				var $minus = $toBeDec 
				//******crea nuovo Atomo
				var minusOne = {type:"cn", val:1, sign:-1, exp:1}
				var $minusOne = ValToAtoms(minusOne);
				
				//stabilisci dove va aggiunto il -1
				var $minusParent = ATOMparent( $minus );
				var $minusContent = $minus[0].ATOM_getChildren();
				$extOp = $minusParent;
				if( $minusParent.attr('data-atom')=='times' ){//aggiungi il -1 all'interno del minus parent
					$minusOne.insertBefore($minus);
				}
				else{
					if( $minusContent.attr('data-atom')!=='times' ){//è necessario aggiungere una enclosure di tipo "times"
						$minusContent = encaseWithOperation($minusContent,'times')
					}
					$minusContent[0].ATOM_getRoles().prepend($minusOne);
				}
				//******Rimuovi il MINUS
				$minusContent.insertAfter($minus);
				$minus.remove();
				
				//var $roleContainingFactors = $minusContent[0].ATOM_getRoles();
				//$roleContainingFactors.prepend($minusOne);
				
				$toBeDec = $minusContent;
				$minusOne.addClass('selected');
				PActx.matchedTF = true;
			}
			/*
			else if( toBeDec.sign === -1 ){
				$extOp = encaseIfNeeded($toBeDec,op);//se necessario crea una operazione container
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
			else if( toBeDec.type === "cn" ){//se l'elemento da scomporre è un numero'
				var number = Number( ATOMNumericCdsAsText($toBeDec) )
				var primeFactors = primeFactorization(number);
				
				if(primeFactors.length >1){// se numero primo non fare nulla
					$extOp = encaseIfNeeded($toBeDec,op);//se necessario crea una operazione container
					var prototype=prototypeSearch("cn","num")
					primeFactors.forEach(function(e,i){
						$clone = ATOMclone(prototype);
						$clone.attr('data-atom','cn');
						ExtendAndInitializeTree($clone);
						$clone[0].ATOM_setName(e)
						$clone.insertAfter($toBeDec);
						if(i == (primeFactors.length -1)){
							$clone.addClass('selected');// l'ultimo fattore rimane selezionato
						}
					})
					$toBeDec.remove();
					PActx.matchedTF = true;
				}
			}
			//non scomporre l'uno, creazione di coppie gestita altrove
			if( !PActx.matchedTF && number!=1 ){//se le altre scomposizioni non sono applicabili fai comparire l'elemento neutro
				$extOp = encaseIfNeeded($toBeDec,op);//se necessario crea una operazione container
				//crea nuovo Atomo
				var One = {type:"cn", val:1, sign:1, exp:1}
				var $One = ValToAtoms(One);
				$One.insertAfter($toBeDec);
				PActx.matchedTF = true;	
			}
				
		}
		else if(direction === "right"){
			op = "plus";
			if( toBeDec.type === "cn" && toBeDec.val%1 == 0 && toBeDec.val>1 && toBeDec.exp==1 ){//controllare che il numero sia intero?
				
				$extOp = encaseIfNeeded($toBeDec,op);//se necessario crea una operazione container
				//crea nuovo Atomo
				var plusMinusOne = {type:"cn", val:1, sign:toBeDec.sign, exp:1}//il segno di toBeDec passa a +-1 
				// scompongo in (n-1)+1
				var $minusOne = ValToAtoms(plusMinusOne);
				$minusOne.insertBefore($toBeDec);
				toBeDec.val=toBeDec.val - 1;
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
			$extOp = encaseIfNeeded($toBeDec,op);//se necessaro crea una operazione container
			var prototype=prototypeSearch("ci","bool")
			$clone = ATOMclone(prototype);
			$clone.text("true");
			ExtendAndInitializeTree($clone);
			$clone.insertAfter($toBeDec);
			$clone.css({display:""});
		}
		else if( $toBeDec[0].ATOM_getName() === "true"){
			op = "or";
			var $X_or_NotX = searchForProperty("name","X_or_NotX");// trova la definizione della proprietà da applicare
			createForThis($X_or_NotX,$toBeDec);
		}		
	}
	*/
	if(PActx.matchedTF){
		//RefreshEmptyInfixBraketsGlued($extOp,true,"eibg")
		PActx.$transform = ATOMparent( $extOp )
		//ssnapshot.take();
		//elementi sostituiti internamente
		PActx.replacedAlready = true;
		PActx.visualization = "images/properties/decompose.png"
		PActx.msg = "decompose" 	
	}
	return PActx	
}

function validReplaced($mouseDownAtom){
	// cerca nodi uguali a mousedown node 
	var $equation = ATOMparent($mouseDownAtom)
	var $excludedMembers=$equation.find('>.firstMember * , >.secondMember *');
	if( !$mouseDownAtom.parent().parent().is("[data-atom=eq]:not(.asymmetric)") ){
		return []//not from an equation	
	}
	if(!($mouseDownAtom.parent().hasClass('firstMember')||$mouseDownAtom.parent().hasClass('secondMember'))){
	return []}// dragged is not a membrer of equation
	//ricerca limitata ad elementi visibili
	//var $candidates = PropositionValidSpan($equation).filter(':visible')
	var $candidates = $PropositionDownstreamRec($equation).find('[data-atom]:visible')
	var valids = $candidates.not($excludedMembers).filter(function( index ) {//escludi mousedownnode stesso dai possibili risultati
		return ATOMEqual(this,$mouseDownAtom[0],false,true/* trascura il segno root quindi -<esp> può essere sostituita con <esp> a patto che poi si cambi il segno*/)
	})
	valids.each(function(){
		// crea linee
		lineAB($mouseDownAtom,$(this));	
	})	 
	return valids
}


function validRedundant($mouseDownAtom){
	//validRedundant($('.selected'))
	// cerca nodi uguali a mousedown node 
	if( !$mouseDownAtom.is("[data-type=bool]") ){
		return []//not a boolean expression	
	}
	var $candidates = $PropositionDownstreamRec($mouseDownAtom).find('[data-atom]:visible').not($mouseDownAtom);
	var valids = $candidates.filter(function( index ) {//escludi mousedownnode stesso dai possibili risultati
		return ATOMEqual(this,$mouseDownAtom[0],false,true/* trascura il segno root quindi -<esp> può essere sostituita con <esp> a patto che poi si cambi il segno*/)
	})
	valids.each(function(){
		// crea linee
		lineAB($mouseDownAtom,$(this));	
	})	 
	return valids
}

function validCandidatesForPatternDrop($mouseDownAtom){
	var valids = $('#telaRole [data-atom]:visible').filter(function( index ) {
		//*****valid?***********
		var result =(
			//datatype is compatible
			typeOk($mouseDownAtom,$(this))
			&&
			ATOMfrozenDef($(this)).length == 0
			)
		return result
	})
	return valids//.not($mouseDownAtom.parent())
}


function removeDropped($dragged,$target){
	var PActx = newPActx();
	var $parent = ATOMparent($target)
	PActx.replacedAlready = true;
	PActx.visualization = "images/properties/collect.png"
	if($parent.attr("data-atom")=="and"){
		$target.remove();//if contained in an and simply remove the redundant term		
		$parent.addClass("cleanifpointless");
	}
	else{
		var $clone = ATOMclone( prototypeSearch("ci","bool") )
		ExtendAndInitializeTree($clone);
		$clone[0].ATOM_setName('true');
		$target.replaceWith($clone);
	}
	PActx.matchedTF=true
	return PActx
}

function evaluateComparison($exp){
	var PActx = newPActx();
	var comparisons = ["eq","gt","lt","geq","leq"];//todo: gestire geq e leq
	PActx.$operand = $exp;
	var atomClass = $exp.attr('data-atom');
	if( comparisons.indexOf(atomClass)!=-1 ){
		var $firstMember = $exp[0].ATOM_getRoles('.firstMember').children();
		var firstMember = AtomsToVal($firstMember);
		var $secondMember = $exp[0].ATOM_getRoles('.secondMember').children();
		var secondMember = AtomsToVal($secondMember);
		if(  !isNaN(firstMember.computedVal) && !isNaN(secondMember.computedVal) ){
			var prototype=prototypeSearch("ci","bool")
			var result
			if(atomClass="eq"){
				result = firstMember.computedVal == secondMember.computedVal;
			}
			else if(atomClass="gt"){
				result = firstMember.computedVal > secondMember.computedVal;
			}
			else if(atomClass="geq"){
				result = firstMember.computedVal >= secondMember.computedVal;
			}
			else if(atomClass="lt"){
				result = firstMember.computedVal < secondMember.computedVal;
			}
			else if(atomClass="leq"){
				result = firstMember.computedVal <= secondMember.computedVal;
			}
			var stringResult
			if(result){stringResult="true"} else{stringResult="false"}
			var $clone = ATOMclone(prototype);
			// $clone.attr('data-atom','cn');
			ExtendAndInitializeTree($clone);
			$clone[0].ATOM_setName(stringResult)
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

function forThisPar_focus_nofocus($specificValue,$parameter){
		var PActx = newPActx();
		
		//a parameter in a forall is specific by a $specificValue
		let $forall
		//if(ATOMparent($parameter).hasClass('exclusiveFocus')){//the forall is in focus
			$forall= ATOMparent($parameter)
		/*}
		else{//the forall is not in focus -> create a clone
			let index=$parameter.index();
			$forall=createForThis(ATOMparent($parameter),ATOMparent($parameter));
			$parameter=$(GetforAllHeader($forall).children()[index])
		}*/
		PActx.$transform = ATOMForThisPar($parameter,$specificValue)
		PActx.matchedTF = true;		
		PActx.replacedAlready = true;
		PActx.msg = "forThis"
		return PActx
}

function clearTragets(){
	clearTarget(["toBeCloned"]);//debug 
	document.querySelectorAll(sortablesSelectorString).forEach(function(el){el.setAttribute('target','')});
	document.querySelectorAll('[data-atom]').forEach(function(el){el.setAttribute('target','')});
}
