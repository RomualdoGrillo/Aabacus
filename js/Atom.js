// atoms.js dovrebbe costituire lo strato di comunicazione tra 
//l'albero degli ATOMS ed il resto del software

/*
Nota: non sempre � comodo usare ATOMobject.ATOMmethod()
Il risultato di un select $('selector'), � un oggetto jQuery contenente n altri oggetti. Quindi non si pu� chiamare $('selector').ATOMmethod
Si pu� chiamare in uno dei modi seguenti:  
1)  $('selector')[0].ATOMmethod
	$('selector').each(function(index) {this.ATOMmethod})
2) oppure chiamare la funzione corrispondente al metodo, per come � costruito atom ATOMmethod(ATOMobject)
*/

/*
Nota:
ATOMnomefunzione possono essere usati sia come metodi che come funzioni
ATOM_nomemetodo possono essere chiamati solo come metodi
ad esempio ATOMparent può essere invocato come metodo di un ATOM oppure come
funzione su un qualsiasi elemento html anche se non è un ATOM 
*/
atom = {
	ATOMparent : ATOMparent ,
	ATOMcleanIfPointless : ATOMcleanIfPointless,
	ATOMclosedDef :ATOMclosedDef,
	ATOMCreateDefinition:ATOMCreateDefinition ,
	ATOM_replaceWith:ATOM_replaceWith,
	ATOM_getNodes:ATOM_getNodes,
	ATOM_getRoles:ATOM_getRoles,
	ATOM_getChildren:ATOM_getChildren,
	ATOM_getName:ATOM_getName,
	ATOM_setName:ATOM_setName,
	ATOM_createMathmlString:ATOM_createMathmlString,
	ATOM_addRole: ATOM_addRole,
	ATOM_checkIfPointlessSingleNode:ATOM_checkIfPointlessSingleNode,
	ATOM_dissolveContainer:ATOM_dissolveContainer,
	ATOM_overlay: ATOM_overlay,	
}

function ATOMextend($startNode,applyToSubtreeAlso){//add methods from object "atom" 
	var $toBeExtended
	if( !applyToSubtreeAlso ){
		$toBeExtended = $startNode.filter('[data-atom]')//in ogni caso estendo solo i '[data-atom]'
	}
	else{
		$toBeExtended = $startNode.filter('[data-atom]').add( $startNode.find('[data-atom]') )
	}
	
	$toBeExtended.each(function(index) {// tutti gli HTML nodes con classe .ATOM
		$.extend(this,atom);//pare non si possa fare altrimenti non riesco a estendere $(this)
	})
}

function ATOMparent($startNode){
	//per poter chiamare sia come funzione che come metodo
	if($startNode == undefined){$startNode=$(this)}
	//risali passo passo la struttura DOM fino a trovare un elemento ATOM
	return $startNode.parent().closest('[data-atom]')
}

/*
//funzione inutile da sostituita con closest()
function LookForAncestor($startNode,selector)
{
	//cerca un elemento che soddisfa la stringa selector, controlla $startNode e poi risale gli antenati.
	//Termina Esplorazione se:
	//limite1: fermati dopo  n passi (depthLimit=10) 
	var depthLimit=30;
	var currNode=$startNode;
	for (i=0; i<depthLimit; i++)
	{
	if(currNode.is(selector)) // il nodo corrente ha la caratteristica cercata?
		{
			return currNode
		}
	else // al prossimo giro analizza il padre
		{
		currNode=currNode.parent()
		}
	}
}
*/

//todo:funzione inutile da sostituire con parents()
/*
function LookForAncCdsEveryGeneration($ATOMnode,selector)
{
	//cerca un elemento che soddisfa la stringa selector, controlla $startNode e poi risale gli antenati.
	//Termina Esplorazione se:
	//limite1: fermati dopo  n passi (depthLimit=10) 
	var depthLimit=30;
	var currNode=$ATOMnode;
	for (i=0; i<depthLimit; i++)
	{
	if( !ATOMparent(currNode).is(selector) || !ATOMclosedDef(currNode) ) // il prox nodo non ha la caratteristica cercata?
		{
			return currNode
		}
	else // al prossimo giro analizza il ATOMpadre
		{
		currNode=ATOMparent(currNode)
		}
	}
}
*/


function ATOMclosedDef(Node){
	//stabilisci se l'elemento "Node" � aperto e si puo modificare liberamente
	return $(Node).closest('.unlocked').length == 0
}


function ATOM_dissolveContainer(){
	if( this.ATOM_getChildren().length > 0){
		var $children = this.ATOM_getRoles().children().filter('[data-atom]')
		$(this).replaceWith($children)
	}
	else{
		$(this).remove()	
	}
	return  $children
}

//per creazione automatica def: $(".SelectedDef")[0]ATOMCreateDefinition()
function ATOMCreateDefinition(startNode){
	if(startNode == undefined){startNode=this}
	var outType=$(startNode).attr('data-type')
	var $newDef=ATOMclone(prototypeSearch('eq')) //crea una nuova definizine  
	//*********************** definendum **********************
	var $definendum=ATOMclone(prototypeSearch('function'))
	$definendum.attr('data-type',outType)
	m1=$newDef.find(".firstMember")//trova primo membro
	newName=prompt('Enter a new name')
	$definendum.attr("data-atom",newName)
	$definendum.append(newName)
	m1.append($definendum)//aggiungi contenuto al primo membro ed inseriscilo
	//*********************** definens **********************
	$definens=ATOMclone($(startNode));
	//$definens.find("#MyOverlay").remove()//togli l'overlay violetto dal clone
	m2=$newDef.find(".secondMember")//trova secondo membro todo
	m2.append($definens)//aggiungi contenuto al secondo membro
	var $parList = $definens.find(".unselected")
	
	if($parList.length>0){
		$newforAll = ATOMclone(prototypeSearch('forAll'));//clona for each
		ATOMextend($newforAll);
		$('#telaRole').append($newforAll);//todo:scegliere dove deve essere visibile la nuova definizione
		GetforAllContent($newforAll).append($newDef);
		$parList.each(function(i,val){
			var node=this;
			var thisType=$(node).attr('data-type')
			var $newNode=ATOMclone(prototypeSearch('ci')).attr('data-type',thisType)//data() e' un casino
			$newNode.append("p" + i)
			$(this).replaceWith($newNode)
			var $Clone1=ATOMclone($newNode)//clone da inserire in definendum
			var $Clone2=ATOMclone($newNode)//clone da inserire in forAll header
			var $newRole=$('<span class="s_role" data-accept="1"></span>')
			$newRole.attr('data-type',thisType);
			$definendum.append($newRole);
			$newRole.append($Clone1);
			GetforAllHeader($newforAll).append($Clone2);
		})
	}

	//*******************inserisci la nuova definizione
	$newDef.find('*').removeClass('selected').removeClass('unselected');//clear selected unselected
	attachEventsAndExtend($newforAll);
	return startNode
}



function ATOMReplace($replaced,$replacer){
	var $clone = ATOMclone($replacer)
	ATOMextend($clone);//mi serve subito che sia esteso, gli eventi sono attivati in seguito
	//sostituisci
	var mark = ATOMSmarkUnmark($replaced);
	if(mark !== undefined){
		ATOMSmarkUnmark($clone,mark)//$replaced---->$replacer sostituisci ma conserva il titolo se presente
	}
	$replaced.replaceWith($clone)
	$clone.css({display:""});
	attachEventsAndExtend($clone)	
}
 
function ATOMLinkReplace($link,$replaced){
	//changed argument order to comply with 1Dragged 2Target
	 ATOMReplaceLink($replaced,$link) }

function ATOMReplaceLink($replaced,$link){
	//get the other member of the link, futuribile: uguaglianza tra molti membri, necessario sistema per scegliere tra membri
	var $replacer
	if($link.parent().hasClass('firstMember')){$replacer=ATOMclone(ATOMparent($link)[0].ATOM_getRoles('.secondMember').children())}
	else if($link.parent().hasClass('secondMember')){$replacer=ATOMclone( ATOMparent($link)[0].ATOM_getRoles('.firstMember').children() )}
	else { console.log('dragged ne primo ne secondo membro')}
	//determina se reciproco o inverso
	var opposite = ( $link.hasClass('minus') !== $replaced.hasClass('minus') );
	if(opposite){$replacer.toggleClass('minus')};
	var inverse = ( $link.hasClass('inverse') !== $replaced.hasClass('inverse') );
	if(inverse){$replacer.toggleClass('inverse')};
	//sostituisci
	$replaced.replaceWith($replacer)
	attachEventsAndExtend($replacer)
}

// ottenere HTMLElement: d=Object.getPrototypeOf( una div o altro );h=Object.getPrototypeOf(d)
// e' possibile estendere l'oggetto HTMLElement {} con $.extend(h,addToJQ)
//no! cos� lo aggiungo alla funzione jQuery()  $.extend(addToJQ)
//metodo da aggiungere a HTMLElement

function typeOk($ATOMdragged,$role){
	return classA_in_classB($ATOMdragged.attr("data-type"),$role.attr("data-type"))
}



//if($ATOMdragged.attr(data-type))verifica datatype e numero di elementi accettati
function classA_in_classB(classNameA,classNameB){// futuribile: stabilire se una classe ne estende un'altra anche con ereditariet� multipla
	return classNameB === 'obj' || classNameA === classNameB
}

function ATOMCreateSpaceForDeduction($hypothesis){
	var spaceForDeduction
	if(ATOMparent($hypothesis).attr('data-atom')==='and'){//parent external to enclosure is 'and'?
		spaceForDeduction = $hypothesis.parent()
	}
	else{// create an 'and'
		var newAnd = ATOMclone(prototypeSearch("and"))
		attachEventsAndExtend(newAnd)
		$hypothesis.parent().append(newAnd)
		spaceForDeduction = newAnd.find('>[class*="_role"]')
		spaceForDeduction.append($hypothesis)//
	}
	return spaceForDeduction
}


//todo: questa ricerca non distingue le variabili interne "Bvar".
// Ad esempio     x+1= integrale( x^2 in dx)   x compare sia a destra che a sinistra ma non è la stessa variabile 
function $ATOMParameterSearch($startNode,$atom_param){// cerca nodi uguali al parametro dato
	var result = $startNode.find('[data-atom]').filter(function( index ) {
    	//return ATOMEqual($atom_param[0],this)
    	 return compareExtATOM($atom_param,$(this),true,false);
    	})
	return result
}

function ATOMReplaceAll($startNode,replaced/*HTMLnode atom */,replacer/*HTMLnode atom */){
	var $replaced=$(replaced);
	var $replacer=$(replacer);
	$startNode=$($startNode)//se per caso passo uno start node non $
	var $occurrences = $ATOMParameterSearch($startNode,replaced);
	var result = $.each($occurrences,function(i,o){
		ATOMReplace($(o),$replacer);
		})
	return + $occurrences.length +' replaced'
}

function GetforAllContent($forAll){return $forAll[0].ATOM_getRoles(".forAllContent")}
function GetforAllHeader($forAll){return $forAll[0].ATOM_getRoles(".forAllHeader")}

function ATOMForThis_Par_newVal($newVal,$parameter){return ATOMForThisPar($parameter,$newVal)}
function ATOMForThisPar($parameter,$newVal){// atom 
	//$newVal può essere anche un vettore vuoto
	//in tal caso il parametro doverebbe essere di tipo x___ ma per ora non faccio controlli
	var $f= $parameter.parent().closest('[data-atom="forAll"]');//
	var $h=GetforAllHeader($f);// get header
	var $c=GetforAllContent($f);
	var $root = $f;//l'elemento più esterno Root può cambiare
	//************stabilisci se c'è conflitto con i nomi delle Bvar******
	//il nome della variabile specificata nel forThis è per caso già presente tra i parametri del forall?
	if($newVal.length!=0){
		var newValName = $newVal[0].ATOM_getName()
		var $toBeRenamed = $h.children().filter(function(){ return this.ATOM_getName() == newValName })
		$toBeRenamed.each(function(){ formatForall( $f , $(this) )})	
	}
	//var mark = $parameter[0].ATOM_getName()
	//ATOMSmarkUnmark($newVal,mark)//se sostituisci il paramtro di nome xxx sarai marcato xxx
	//sostituisci
	ATOMReplaceAll($c,$parameter,$newVal);
	$parameter.remove()
	//se non ci sono più parametri, "dissolvi" il forAll esterno e metti al suo posto il contenuto 
	if($h.children().length == 0){
		var $content = $c.children()
		//metti il sostituto nella stessa posizione del sostituito
		if($f.css('position')=="absolute"){
			ATOMappendInABSPosition($content,$f,"superposed")
		}
		else{
			$content.insertBefore($f)
		}
		$f.remove()
		$root = $content //se si dissolve il forall, ilpiù esterno rimane il suo contenuto
	}
	removeClassStartNodeAndDiscendence('selected',$root);
	return $root
}

function formatForall($forall,$toBeRenamed){
    var oldName = $toBeRenamed[0].ATOM_getName()
    var newName = "(" + oldName + ")"
    //cerca le occorrenze e marca ciascuna occorrenza
    var $occurrences = $ATOMParameterSearch( $forall , $toBeRenamed );
    $occurrences.each(function(){ this.ATOM_setName(newName) })
}

function ATOM_replaceWith(replacer){ //replacer must be atom 
	$(this.ATOM_getEnclIfPresent()).replaceWith(ATOM_getEnclIfPresent(replacer))
	return this // return replaced
}

function ATOM_getNodes(selector){
	$(this).addClass('gettingNodes') 
	var $subnodes = $(this).find('*').not('.gettingNodes [data-atom], .gettingNodes [data-atom] *');//subnodes in this atom
	var $Nodes = $(this).add($subnodes);// root node + subnodes
	if( selector != undefined){// se viene passato un "selector", filtra i Nodes
		$Nodes = $Nodes.filter(selector)
	}
	$(this).removeClass('gettingNodes')
	return $Nodes
}

function ATOM_getRoles(selector){
	var $roles = this.ATOM_getNodes(selector).filter('[class*="_role"]');
	$roles.sort(function(a,b){
		if($(a).hasClass("bVar_role") && !$(b).hasClass("bVar_role")){// bVar_role always before other roles
			return -1
		}
		if($(b).hasClass("bVar_role") && !$(a).hasClass("bVar_role")){// bVar_role always before other roles
			return 1
		}
		else if(  parseInt($(a).attr("data-roleOrder")) > parseInt($(b).attr("data-roleOrder"))  ){
			return 1
		}
		else if(  parseInt($(b).attr("data-roleOrder")) > parseInt($(a).attr("data-roleOrder"))  ){
			return -1
		}
		else{
			return 0
		}
 	})
	return $roles
}

function ATOM_getChildren(selector){
	var $children = this.ATOM_getRoles().children('[data-atom]');
	if( selector != undefined){// se viene passato un "selector", filtra
		$children = $children.filter(selector)
	}
	return $children
}


function ATOM_getName(considerSuffix){
	var nameWithSuffix = $(this).find('>.name').text()
	if (considerSuffix){
		return nameWithSuffix
	}
	else{
		return nameWithSuffix.match(/[^_]*/)[0]
	}

}

function ATOM_setName(newName){ $(this).find('>.name').text(newName) }


function ATOM_addRole(dataType,content){
var $newNode
$newNode=$('<span class="role">'+ content +'</span>').attr('data-type',dataType)//data() e' un casino
$(this).append($newNode)
return $newNode
}//da usare quando si crea una nuova funzione o definizione


function validTargetsFromOpened($ATOMdragged){
		var numOfPlaces
		var valids = $('#telaRole:visible, #telaRole [class*="_role"]:visible').filter(function( index ) {
			//*****determine number of places********
			numOfPlaces = getNumOfPlaces($(this));
			//*****valid?***********
			var result =(
				//if $dragged is not a new definition, target must be opened or boolPtototype todo: check the dragged prototype really has value true 
				( !ATOMclosedDef(this) || $ATOMdragged.is('#asymmeqPrototype') || $ATOMdragged.is('#boolPrototype') )
				&& 
				//datatype is compatible
				typeOk($ATOMdragged,$(this))
				&& 
				//is there place for another? 
				(numOfPlaces === -1 || $(this).children().filter('[data-atom]').length < numOfPlaces )
			)
			
			return result
		})
	  	return valids.not($ATOMdragged.parent())
}

function getNumOfPlaces($role){
	//*****determine number of places********
	if($role.hasClass("s_role")){
		numOfPlaces = 1
	}
	else if($role.attr("data-accept") === undefined || parseInt($role.attr("data-accept")) === -1 ){
		numOfPlaces = -1 //-1 means infinite
	}
	else{
		numOfPlaces = parseInt($role.attr("data-accept"))	   		
	}
	return numOfPlaces
}


function overflowExsists(node){
	return (node.offsetHeight < node.scrollHeight ||
    node.offsetWidth < node.scrollWidth )
}

function ATOMclone($node,removeID){// di default rimuove ID
	$clone = $node.clone();//clona
	$toBeCleaned = $clone.add($clone.find('*'))//clean discendence too
	//$toBeCleaned = $clone//clean just the start Node
	if(removeID !== false){
		$toBeCleaned.removeAttr("id");//ripulisci id	
		$toBeCleaned.removeClass("hide");
		$toBeCleaned.removeClass("fundamental");
	}
	$toBeCleaned.removeClass (function (index, css) {
		return (css.match (/(^|\s)ui-\S+/g) || []).join(' ');
	});//ripulisci classi: ui-
		$toBeCleaned.removeClass (function (index, css) {
		return (css.match (/(^|\s)target-\S+/g) || []).join(' ');
	});//ripulisci classi: target-
	$toBeCleaned.removeClass('born');//ripulisci classe born
	return $clone
}


function prototypeSearch(className,dataType){//alcune classi, ad esempio "ci", possono avere vari datatype 
	//search in dom
	var dataTypeString = (dataType === undefined )?  "[data-type]"  :  "[data-type=" + dataType + "]"
	var $prototype = $("#tavolozza").find("#" + className.toLowerCase() + "Prototype" + dataTypeString );
	
	//if not found adapt generic prototype 
	if ($prototype.length === 0 ){
		//console.warn('ATOM prototype not found:className:' + className + ", dataType:" + dataType);//Warning!!
		$prototype = ATOMclone($("#Prototype"));
		$prototype.attr("data-atom",className);
		$prototype.attr("data-type",dataType);
		//addTypeDecorations($prototype);
	}
	return $prototype.last()//in case you find more prototypes
}
/*
function prototypeSearch(className,dataType,loadedFile){//alcune classi, ad esempio "ci", possono avere vari datatype 
	//search in dom
	var dataTypeString = (dataType === undefined )?  "[data-type]"  :  "[data-type=" + dataType + "]"
	var $prototype = $("#" + className.toLowerCase() + "Prototype" + dataTypeString );
	//search in document to be loaded

	//if not found adapt generic prototype 
	if ($prototype.length === 0 ){
		//console.warn('ATOM prototype not found:className:' + className + ", dataType:" + dataType);//Warning!!
		$prototype = ATOMclone($("#Prototype"));
		$prototype.attr("data-atom",className);
		$prototype.attr("data-type",dataType);
		//addTypeDecorations($prototype);
	}
	return $prototype
}*/
var symbols=["ci","cn","csymbol"]
function prototypeSearch2(className,symbolname,dataType,loadedFile){//alcune classi, ad esempio "ci", possono avere vari datatype 
	//search in dom
	var dataTypeString = (dataType === undefined )?  "[data-type]"  :  "[data-type=" + dataType + "]"
    var $prototypes = $("#" + className.toLowerCase() + "Prototype" + dataTypeString );
	if($prototypes.length=0){
	    	//use generic prototype 
	}
	if(symbols.indexOf(className) != -1){//is it a symbol?(ci,cs,csymbol)
	    if( className==="cn" !== (!isNaN(symbolname)) ){//se la classe cn non combacia coll'essere un numero 
			throw("incoerenza cn symbolname")
		}
	    if ($prototypes.length>1){
		    //if more than one found, search for prototype with the exact same name
		    var i=0;
		    while($prototypes[i]){
		    	i++
		    	if($prototypes[i].text() == symbolname){//found!
		    	    $prototype = $($prototypes[i]);
                    i=-1 //

		    	}
		    	
                
		    }
		}
	}
	if ($prototype){
	    	//if prototype still not found: not a failed to find a prototype with right nameor not a symbol
	    	//use the first availableonly available prototype
	    	$prototype = $($prototypes[0]); 
	}
	return $prototype
}



function encaseWithOperation($ATOMelement,op){
	//create external operation to $ATOMelement, $ATOMelement is 1 element or a list of adjacent elements 
	var $prototype = prototypeSearch(op);
	var $clone = ATOMclone($prototype)
	attachEventsAndExtend($clone);// dai vita a clone ed al suo albero
	//ATOMparent($ATOMelement).replaceWith($clone);//replace provoca la distruzione degli eventi nel replaced
	$clone.insertBefore($ATOMelement.eq(0));
	$ATOMelement.appendTo($clone[0].ATOM_getRoles());
	return $clone
}

function encaseIfNeeded($ATOMelement,op){
	if(ATOMparent($ATOMelement).attr("data-atom") === op){
		//no need to cteate external op
		return ATOMparent($ATOMelement);
	}
	else{
		return encaseWithOperation($ATOMelement,op)
	}
}


function checkCn($s){//controlla che siano numeri e siano siblings
	var allCnOk = true
	for (var i = 0, len = $s.length; i < len; i++){
		//console.log(s[i]);
		if( isNaN($($s[i]).text()) ){
			allCnOk = false;
			break
		}
	}
	return allCnOk
}

function checkSiblings($s){//controlla che siano numeri e siano siblings
	var allSiblingsOk = true
	var $parent = ATOMparent($($s[0])) //to check if nodes are siblings
	for (var i = 0, len = $s.length; i < len; i++){
		if( !ATOMparent($($s[i])).is($parent) ){
			allSiblingsOk = false;
			break
		}
	}
	return allSiblingsOk
}


function addTypeDecorations($atom){ //get the "type" of the prototype and complete it with decoration
	var dataType= $atom.attr("data-type");
	var b = $atom;
	if(dataType === "num" && b.find(".leftDecoration").length == 0 ){//is decoration present already?
			b.append($('<span class="leftDecoration"></span>'))
	}
	if( (dataType === "num" || dataType === "bool") && b.find(".topDecoration").length == 0 ){
		var b = $atom;
		b.append($('<span class="topDecoration"></span>'))
	}
}

function ATOMrenamePrompt($atom,newName){//
	var oldName = $atom[0].ATOM_getName()
	if( $atom.hasClass('minus')  ){
		oldName = "-" + oldName ;
	}
	if( $atom.hasClass('inverse') ){
		oldName = "/" + oldName ;
	}
	var newName=prompt('Enter a new name, / for inverse, /- for opposite and inverse do not use "-" or "/" in names es: x-xxx ', oldName )
	if(newName != null){
		if(newName[0] === "/"){
			newName = newName.substr(1) //nome privato del segno meno
			$atom.addClass('inverse')
		}// attenzione: / va inserito prime del meno
		else{
			$atom.removeClass('inverse')
		}
		if(newName[0] === "-"){
			newName = newName.substr(1) //nome privato del segno meno
			$atom.addClass('minus')
		}//todo: cosa succede se input = ---2  ?
		else{
			$atom.removeClass('minus')
		}
		$atom[0].ATOM_setName( newName );
		$atom.attr("data-atom", (isNaN(newName))?"ci":"cn" )// se numero allora classe "cn"
		ssnapshot.take()
	}
}


function createForThis($forall,$placeHolder){
//Modus Ponens deduce a special case from a forall
	var $clone= ATOMclone($forall);
	exclusiveFocus = $clone.addClass('exclusiveFocus'); //metti il clone in stato exclusiveFocus
	attachEventsAndExtend($clone);
	//****inserit the new proposition*****
	if( ATOMparent($forall).attr('data-atom') == 'and'){
		$clone.insertAfter($forall);
	}
	else{
		//enclosure needed
		ATOMCreateSpaceForDeduction($forall).append($clone);	
	}				
	return $clone
}




//start to peel Onion($currAtom)
function AtomsToVal($currAtom,res){//espressioni tipo (-(/(-(a)))) funzione ricorsiva
	//res = {type:"NotAnumber", val:1, sign:1, exp:1, computedVal:NaN, canBeReplaced:true}
	//debug colors
	if(debugMode){
		$('*').removeClass("input");
        ATOMnodesAddClass($currAtom,"input");//add colors
	}

	//se non vengono passati segni precedenti essi sono inizializzati a 1
	if(res == undefined){res = {type:"NotAnumber", val:1, sign:1, exp:1, computedVal:NaN, canBeReplaced:true};};
	var op = $currAtom.attr('data-atom');
	if(op === "minus" || op === "m_inverse"){
		//------------------> recursive
		var newRes = AtomsToVal($currAtom[0].ATOM_getChildren(),res)
		//<------------------
		if(op === "minus"){res.sign = newRes.sign * -1}
		else{res.exp = newRes.exp * -1}
	}
	else if(op === "cn" || op === "ci"){//todo: per ora gestisce solo cn e ci
		res.type = op ;
		res.val = $currAtom[0].ATOM_getName()}
	else{res.val = NaN; res.canBeReplaced = false }
	res.computedVal = Math.pow((res.sign * res.val),res.exp)
	return res
}

function isAsymbol($atom){
	var className = $atom.attr('data-atom')
	return (symbols.indexOf(className) != -1)//is it a symbol?(ci,cs,csymbol)
}

function ValToAtoms(partial){
 	var $newAtom
	var $clone
	var $target
	if( partial.sign === -1 ){//segno meno?
		$clone = ATOMclone( prototypeSearch("minus") )
		attachEventsAndExtend($clone);
		$newAtom = $clone
		$target = $clone[0].ATOM_getRoles() 
	}
	if( partial.exp === -1 ){//inverso?
		$clone = ATOMclone( prototypeSearch("m_inverse") )
		attachEventsAndExtend($clone);
		if($target !== undefined){
			$target.append($clone)
		}
		else{
			$newAtom = $clone
		}
		$target = $clone[0].ATOM_getRoles()
	}
	$clone = ATOMclone( prototypeSearch("num") )
	attachEventsAndExtend($clone);
	$clone[0].ATOM_setName(partial.val);
	$clone.attr('data-atom', partial.type);//uso un generico prototipo num e qui specifico se cn o ci
	if($target !== undefined){
		$target.append($clone)
	}
	else{
		$newAtom = $clone
	}
	return $newAtom
}



function AtomBesideGiven($startAtom){
		//Attualmente il contenuto dei role si dispone leftRight e topDown mentre comporre è visto come left e down.
		//di conseguenza per decidere qual'è l'elemento con cui comporre devo distiguere a seconda dell'orientazione.'
		if( $toBeComp.css('display') === "inline-block"){
			return $startAtom.prevAll('[data-atom]:first');
		}
		else{
			return $startAtom.nextAll('[data-atom]:first');
		}
}


function ATOMneedsBracket($ATOM)
{
	var ATOMclass= $ATOM.attr('data-atom')  //
	var parentClass = ATOMparent($ATOM).attr('data-atom')//
	//var parentRole = da completare per poter distinguere se in quale "role" è contenuto
	//la stringa che identifica la posizione dovrebbe diventare <ATOMtype>.<role>
	var classRow = 
	["plus",
	"times",
	"minus"
	];
	
	var MatrixBaracketNeeded = [ // container
	  ["plus","times","power"],
	  ["times","power"],
	  []
	];
	var ATOMclassIndex = classRow.indexOf(ATOMclass)
	if ( ATOMclassIndex != -1 )
	{
			var row = MatrixBaracketNeeded [ATOMclassIndex];
			return row.indexOf(parentClass) != -1; // found in matrix
	}
	return false // if not found, bracket not needed
}

function refreshOneBracket($ATOM){
	if ( ATOMneedsBracket($ATOM) ){ $ATOM.addClass("brackets")}
	else {$ATOM.removeClass("brackets") }	
}

function generalRefreshInfixEmptyBrakets($startNode,STinfix,STempty,STBrackets){//ST means subtree
	//if($startNode.length != 0){
		var $Atoms //lista degli atomi "da trattare"
		if(STinfix||STempty||STBrackets){//se qualche procedura va estesa al subtree, cerca tutta la progenie
			$Atoms = $startNode.add($startNode.find('[data-atom]'));
		}
		else {
			$Atoms = $startNode
		};
		$Atoms.each(function(i,element){
				if( i==0 || STinfix ){//(primo giro) o (tratta anche il subtree) 
					refreshOneInfix($(element));//refresh infix	
				}
				if( i==0 || STempty ){ 
					refreshEmpty($(element))//refresh empty	
				}
				if( i==0 || STBrackets ){ 
					refreshOneBracket($(element));	
				}
				})
	//}

}
 
// RefreshEmptyInfixBraketsGlued($("#telaRole"),true,"eibg")
function RefreshEmptyInfixBraketsGlued($startNode,tree,options){
	//if($startNode.length != 0){
		var $Atoms //lista degli atomi "da trattare"
		if(tree!=false){
			$Atoms = $startNode.add($startNode.find('[data-atom]'));
		}
		else {
			$Atoms = $startNode
		};
		$Atoms.each(function(i,element){
				if( options==undefined  || options.indexOf("e")!=-1 ){ 
					refreshEmpty($(element));	
				}
				if( options==undefined  || options.indexOf("i")!=-1 ){ 
					refreshOneInfix($(element));	
				}
				if( options==undefined  || options.indexOf("b")!=-1 ){ 
					refreshOneBracket($(element));
				}
		})
		if( options==undefined  || options.indexOf("g")!=-1 ){//nota: refresh è sempre applicato a tutto l'albero 
				refreshGlued($startNode);
		}
				
				
	//}

}

function ATOMshowMarks($atom, showPath){//se showPath=true allora mostra anche il path 
	var labelString;
	var mark = $atom.attr("title");
	if(mark==undefined){mark=""};
	var path=$atom.attr("data-path");
	if( !showPath || path==undefined){path=""};//se non è da visualizzare, oppure è indefinito
	if($atom.find(".label").length==0){$atom.append('<div class="label"></div>')}
	$atom.find(".label").text(mark +  "_" + path )
}
function showAllMarks(showPath){
	$('body [data-atom]:visible').each(function(i,element){
		ATOMshowMarks($(element),showPath);
	})
	
}


function hideAllMarks(){
	$('.label').remove()	
}


function ATOMEqual(node1,node2,checkType,neglectRootSign){ //node1/2 HTMLnode. Flat to simil mathml e paragona
	if( node1 == undefined || node2 == undefined ){ return false};
	return (node1.ATOM_createMathmlString(checkType , neglectRootSign) === node2.ATOM_createMathmlString(checkType, neglectRootSign));
	//return adaptMatch(undefined,$(node1),$(node2),$(node2))//sostituita comparazione "grezza" con comparazione ricorsiva
}

function compareExtATOM($input,$pattern,checkAtomTypeAndName/*defaul=true*/,checkMarks){
    var res
    if(checkMarks){
       if( !checkMarksOkForPattern($input,$pattern) ){
           return false //Marks do not match
       }
    }
    if( !($input.attr("data-type") === $pattern.attr("data-type")) /*notSameType*/){ return false}
    else if( checkAtomTypeAndName == false){ return true}// no deeper tests required
    else if( $input.attr("data-atom") !== $pattern.attr("data-atom") /*notSameClass*/){ return false} 
    else if( symbols.indexOf($input.attr("data-atom")) != -1 /*is a symbol*/ ){
       res = $input[0].ATOM_getName() === $pattern[0].ATOM_getName()  
    }
    else{
        res = true//no more tests required
    }  
    return res
}

function ATOMcleanIfPointless(startNode,applyToSubtree){//per applicarlo all'albero applica prima a subtree e poi a root
	let $extOp = $(startNode);
	if(applyToSubtree){
		for(i=0;i<100;i++){//messo un limite solo per evitare loop infiniti in caso di errori nel codice
			//trova i contenitori da rimuovere: vuoti o con un solo figlio
			var $pointlessElements = $extOp.parent().find('[data-atom].cleanifpointless').filter(function(){ 
				return this.ATOM_checkIfPointlessSingleNode() 
				 })
			//agisci sul primo trovato, poi ripeti la ricerca.
			if($pointlessElements.length > 0){
				let $children = $pointlessElements[0].ATOM_dissolveContainer()
				if($pointlessElements.eq(0).is($extOp)){
				$extOp=$children
				} 	
			}
			else{
			//console.log('no more pointless subnodes')
			return $extOp
			}
		}
	}
	else{
		if( $extOp.is('[data-atom].cleanifpointless')  &&  $extOp[0].ATOM_checkIfPointlessSingleNode()){
			return $extOp[0].ATOM_dissolveContainer();
		}

	}
}
/*

function ATOM_checkIfPointlessSingleNode(){
	return ($(this).is('[data-atom="plus"],[data-atom="times"],[data-atom="or"],[data-atom="and"]') 
			&&
			this.ATOM_getChildren().length == 1)
}*/


function ATOM_checkIfPointlessSingleNode(){
	let op = $(this).attr('data-atom')
	if( !OpIsAssociative(op) ){return false}
	if(this.ATOM_getChildren().length <= 1){return true}
	let opP = ATOMparent($(this)).attr('data-atom')
	if( opP == op ){return true}
}





/*
function ATOMassociativeTargets($ATOMNode,selector){//example '[data-atom="or"]'
	var ancestor = LookForAncCdsEveryGeneration($ATOMNode,selector)[0].ATOM_getRoles().addClass('target-associative')
	$(selector).each(function(){
	if(LookForAncCdsEveryGeneration($ATOMNode,selector)[0].ATOM_getRoles().hasClass('target-associative')){
		this.ATOM_getRoles().addClass('target-associative')}
	})
}
*/


/*
$('*').removeClass('test')
immediatePropositionTarget($('.selected')).addClass('test').length
*/
function PropositionValidSpan($source,moveDistCopy){
//determina l'area di validità di una proposizione, più complesso del calcolo di arre collegate con prop associativa
// moveDistCopy=true(default) restituisce tutti i target raggiungibili in qualche modo
//             =false restituisci solo i target in cui è possibile spostare, è la modalità più restrittiva 
// 		
//todo: questa funzione tratta gli ATOMS senza distinguerne i Roles, va bene per gli atomi che hanno un solo role 
////nota: add() aggiunge elementi a meno che siano già presenti
	//***********DOWN: leaaf to root*****
	if(moveDistCopy == undefined){moveDistCopy=true}
	var $rootValid = $source //se non trovo radici più profonde parto dal source per risalire
	var $ATOMparents = $source.parents('[data-atom]');
	var i=0
	while($ATOMparents[i]){
		//todo: per risalire prova anche a raccogliere
		if($($ATOMparents[i]).attr('data-atom')=="and"){// se è "valido" cerca più a fondo
		$rootValid=$($ATOMparents[i])
		i++	
		}
		else{break}
	}
	//**********UP: root to leafs*****
	return validPropDiscendence($rootValid,moveDistCopy) 
}

function validPropDiscendence($sources,moveDistCopy){
	var $newTargets = $();
	$sources.each(function(){
		var atomType = $(this).attr("data-atom");
		//add children
		var $thisChildren = this.ATOM_getChildren();
		if($thisChildren){
			if(atomType=="and" || moveDistCopy!=false ){//nel caso di un or vale la proprietà distributiva
				//todo:lo span si dovrebbe arrestare quando la variabile viene ridefinita 
				$newTargets = $newTargets.add($thisChildren)//.not($sources);
				$newTargets = $newTargets.add( validPropDiscendence($thisChildren,moveDistCopy) );
			}
		}
	})
	return $newTargets//altri elementi immediatamente raggiungibili dai $source
}

function ATOM_overlay(mode){
	// aggiunge/rimuove un overlay ad un ATOM 
	if(mode == undefined){
		$(this).append('<div id="overlay">');
	}
	else{
		$("#overlay").remove();
	}
}

function ATOMnodesAddClass($atom,newClass,mode/* true = remove*/){
    if(!mode){
        $atom.each(function(){
            this.ATOM_getNodes().addClass(newClass)
        })    
    }
    else{
        $atom.each(function(){
            this.ATOM_getNodes().removeClass(newClass)
        })
    }
}

