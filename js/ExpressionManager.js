// In questo file dovrebbero comparire tutte le funzioni che manipolano l'espressione matematica
//todo: in teoria tutte le operazioni sull'espressione dovrebbero avvenire tramite queste funzioni, anche se per ora questa riformattazione del codice non è ancora avvenuta
//todo: cercare,tutti i punti in cui il codice  al di fuori di questo file e sostituire la manipolazione diretta di elementi html che costituiscono l'espressione matematica con chiamate a questo file 

/*
Nota: non sempre � comodo usare ENODEobject.ENODEmethod()
Il risultato di un select $('selector'), � un oggetto jQuery contenente n altri oggetti. Quindi non si pu� chiamare $('selector').ENODEmethod
Si pu� chiamare in uno dei modi seguenti:  
1)  $('selector')[0].ENODEmethod
	$('selector').each(function(index) {this.ENODEmethod})
2) oppure chiamare la funzione corrispondente al metodo, per come � costruito ENODE ENODEmethod(ENODEobject)
*/

/*
Nota:
ENODEnomefunzione possono essere usati sia come metodi che come funzioni
ENODE_nomemetodo possono essere chiamati solo come metodi
ad esempio ENODEparent può essere invocato come metodo di un ENODE oppure come
funzione su un qualsiasi elemento html anche se non è un ENODE 
*/
/* ---- Expression Global Utilities ---- */

/**
 * Restituisce il nodo radice dell'espressione matematica principale.
 * @returns {HTMLElement|null} L'elemento HTML (DOM element) che rappresenta il nodo radice con attributo [data-ENODE],
 *                            o null se non trovato.
 */
function getExpressionRootNode() {
    // Trova il primo figlio con [data-ENODE] all'interno del contenitore principale
    return $("#canvas>.secondMember").children("[data-ENODE]")[0];
}

ENODE = {
	ENODEparent: ENODEparent,
	ENODEcreateMathmlString: ENODEcreateMathmlString,
	ENODEclosedDef: ENODEclosedDef,
	isDefinition: isDefinition,
	ENODECreateDefinition: ENODECreateDefinition,
	ENODEselectable: ENODEselectable,
	ENODERefreshAsymmEq: ENODERefreshAsymmEq,
	ENODE_replaceWith: ENODE_replaceWith,
	ENODE_getNodes: ENODE_getNodes,
	ENODE_getRoles: ENODE_getRoles,
	ENODE_getChildren: ENODE_getChildren,
	ENODE_getName: ENODE_getName,
	ENODE_setName: ENODE_setName,
	ENODE_addRole: ENODE_addRole,
	ENODE_checkIfPointlessSinglENODE: ENODE_checkIfPointlessSinglENODE,
	ENODE_dissolveContainer: ENODE_dissolveContainer,
	ENODE_overlay: ENODE_overlay,
};
/* ---- ENODE Methods/Functions ---- */

function ENODEparent($startNode) {
	//per poter chiamare sia come funzione che come metodo
	if ($startNode == undefined) {
		$startNode = $(this);
	}
	//risali passo passo la struttura DOM fino a trovare un elemento ENODE
	return $startNode.parent().closest("[data-ENODE]");
}

function ENODEclosedDef(Node) {
	//stabilisci se l'elemento "Node" e' aperto e si puo modificare liberamente
	return $(Node).closest(".unlocked").length == 0;
}

function isDefinition(Node) {
	//controlla se l'elemento è una definizione verificando se ha l'attributo data-viseq="asymmetric"
	return $(Node).is('[data-viseq="asymmetric"]');
}

function ENODEfrozenDef(Node) {
	//!! to be refined
	return $(Node).closest("[data-tag]");
}

function ENODE_dissolveContainer() {
	if (this.ENODE_getChildren().length > 0) {
		var $children = this.ENODE_getRoles().children().filter("[data-ENODE]");
		$(this).replaceWith($children);
	} else {
		$(this).remove();
	}
	return $children;
}

//per creazione automatica def: $(".selected")[0].ENODECreateDefinition()
//return ENODEEqual(this,$mouseDownENODE[0])
function ENODECreateDefinition(startNode) {
	if (startNode == undefined) {
		startNode = this;
	}
	var outType = $(startNode).attr("data-type");
	var $newDef = ENODEclone(
		// prototypeSearch('eq','bool','[data-viseq=asymmetric]');
		prototypeSearch("eq", "bool",)
	); //crea una nuova definizine
	//*********************** definendum **********************
	//attuale)al momento vengono inseriti n ruoli singoli quanti sono i parametri
	//rimane da fare todo!!: separare con , 
	//alternativa)in altermnativa si potrebbe una lista ordinata, ma si dovrebbe introdurre un modo
	//per specificare separatamente il datatype di ogni elemento della lista (cluster)
	var $definendum = ENODEclone(prototypeSearch(""));//search for generic prototype
	$definendum.attr("data-type", outType);
	m1 = $newDef.find(".firstMember"); //trova primo membro
	newName = prompt("Enter a name for the new definition");
	if (newName == null) { return }//prompt cancelled
	if (!newName) { return }//empty name
	$definendum.attr("data-ENODE", newName);
	$definendum.find(".name").append(newName);
	m1.append($definendum); //aggiungi contenuto al primo membro ed inseriscilo
	//*********************** definens **********************
	$definens = ENODEclone($(startNode));
	//$definens.find("#MyOverlay").remove()//togli l'overlay colorato dal clone
	m2 = $newDef.find(".secondMember"); //trova secondo membro todo
	m2.append($definens); //aggiungi contenuto al secondo membro
	var $parList = $definens.find(".unselected");
	$("#canvasRole").append($newDef);
	if ($parList.length > 0) {
		let paramDefNames = ["x", "y", "z", "t", "k", "p", "q", "a", "b", "c", "d", "e", "f", "g", "h", "i", "l", "m", "n", "o", "q", "r", "s", "u", "v", "z",];
		$newforAll = ENODEclone(prototypeSearch("forall")); //clona for each
		ENODEextend($newforAll);
		$newDef.replaceWith($newforAll); //todo:scegliere dove deve essere visibile la nuova definizione
		GetforAllContentRole($newforAll).append($newDef);
		//***create arguments container in definendum, that's a way to show brackets
		//discarded alternative: ahow brackets on the first and last roles:
		// would not adapt to the bigger role in th elist
		var $rolescontainer = $('<div class="rolescontainer" ></div>');
		$definendum.append($rolescontainer);
		//*** add each parameter
		$parList.each(function (i, val) {
			var node = this;
			var thisType = $(node).attr("data-type");
			var $newNode = ENODEclone(prototypeSearch("ci")).attr(
				"data-type",
				thisType
			); //data() e' un casino
			$newNode[0].ENODE_setName(paramDefNames[i]);
			$(this).replaceWith($newNode);
			var $Clone1 = ENODEclone($newNode); //clone da inserire in definendum
			var $Clone2 = ENODEclone($newNode); //clone da inserire in forAll header
			var $newRole = $('<div class="s_role" ></div>');
			$newRole.attr("data-type", thisType);
			//prepend comma
			if (i > 0) {
				$rolescontainer.append(",");
			}
			$rolescontainer.append($newRole);
			$newRole.append($Clone1);
			GetforAllHeader($newforAll).append($Clone2);
		});
	}

	//*******************inserisci la nuova definizione
	$newDef.find("*").removeClass("selected").removeClass("unselected"); //clear selected unselected
	return startNode;
}

function ENODEReplace($replaced, $replacer) {
	var $clone = ENODEclone($replacer);
	ENODEextend($clone); //mi serve subito che sia esteso, gli eventi sono attivati in seguito
	//sostituisci
	var mark = ENODESmarkUnmark($replaced);
	if (mark !== undefined) {
		ENODESmarkUnmark($clone, mark); //$replaced---->$replacer sostituisci ma conserva il titolo se presente
	}
	$replaced.replaceWith($clone);
	$clone.css({ display: "" });
	ExtendAndInitializeTree($clone);
}



function ENODEReplaceLink($replaced, $link) {
	//get the other member of the link, futuribile: uguaglianza tra molti membri, necessario sistema per scegliere tra membri
	var $replacer;
	if ($link.parent().hasClass("firstMember")) {
		$replacer = ENODEclone(
			ENODEparent($link)[0].ENODE_getRoles(".secondMember").children()
		);
	} else if ($link.parent().hasClass("secondMember")) {
		$replacer = ENODEclone(
			ENODEparent($link)[0].ENODE_getRoles(".firstMember").children()
		);
	} else {
		console.log("dragged ne primo ne secondo membro");
	}
	//determina se reciproco o inverso
	var opposite = $link.hasClass("minus") !== $replaced.hasClass("minus");
	if (opposite) {
		$replacer.toggleClass("minus");
	}
	var inverse = $link.hasClass("inverse") !== $replaced.hasClass("inverse");
	if (inverse) {
		$replacer.toggleClass("inverse");
	}
	//sostituisci
	$replaced.replaceWith($replacer);
}

// ottenere HTMLElement: d=Object.getPrototypeOf( una div o altro );h=Object.getPrototypeOf(d)
// e' possibile estendere l'oggetto HTMLElement {} con $.extend(h,addToJQ)
//no! cos� lo aggiungo alla funzione jQuery()  $.extend(addToJQ)
//metodo da aggiungere a HTMLElement

function typeOk($ENODEdragged, $role) {
	return classA_in_classB(
		$ENODEdragged.attr("data-type"),
		$role.attr("data-type")
	);
}

//if($ENODEdragged.attr(data-type))verifica datatype e numero di elementi accettati
function classA_in_classB(classNameA, classNameB) {
	// futuribile: stabilire se una classe ne estende un'altra anche con ereditariet� multipla
	return classNameB === "obj" || classNameA === classNameB;
}

function ENODECreateSpaceForDeduction($hypothesis) {
	var spaceForDeduction;
	if (ENODEparent($hypothesis).attr("data-ENODE") === "and") {
		//parent external to enclosure is 'and'?
		spaceForDeduction = $hypothesis.parent();
	} else {
		// create an 'and'
		var newAnd = ENODEclone(prototypeSearch("and"));
		$hypothesis.parent().append(newAnd);
		spaceForDeduction = newAnd.find('>[class*="_role"]');
		spaceForDeduction.append($hypothesis); //
	}
	return spaceForDeduction;
}



function ENODEReplaceAll(
	$startNode,
	replaced /*HTMLnode ENODE */,
	replacer /*HTMLnode ENODE */
) {
	var $replaced = $(replaced);
	var $replacer = $(replacer);
	$startNode = $($startNode); //se per caso passo uno start node non $
	var $occurrences = $findOccurrences($replaced, $startNode)
	var result = $.each($occurrences, function (i, o) {
		ENODEReplace($(o), $replacer);
	});
	return +$occurrences.length + " replaced";
}

function GetforAllContentRole($forAll) {
	return $forAll[0].ENODE_getRoles(".forAllContent");
}
function GetforAllHeader($forAll) {
	return $forAll[0].ENODE_getRoles(".forAllHeader");
}

function ENODEForThis_Par_newVal($newVal, $parameter) {
	return ENODEForThisPar($parameter, $newVal);
}
function ENODEForThisPar($parameter, $newVal) {
	// ENODE
	//$newVal può essere anche un vettore vuoto
	//in tal caso il parametro doverebbe essere di tipo x___ ma per ora non faccio controlli
	var $f = $parameter.parent().closest('[data-ENODE="forAll"]'); //
	var $h = GetforAllHeader($f);// get header
	var $c = GetforAllContentRole($f);
	var $root = $f; //l'elemento più esterno Root può cambiare
	//************stabilisci se c'è conflitto con i nomi delle Bvar******
	//il nome della variabile specificata nel forThis è per caso già presente tra i parametri del forall?
	if ($newVal.length != 0) {
		var newValName = $newVal[0].ENODE_getName();
		var $toBeRenamed = $h.children().filter(function () {
			return this.ENODE_getName() == newValName;
		});
		$toBeRenamed.each(function () {
			formatForall($f, $(this));
		});
	}
	//var mark = $parameter[0].ENODE_getName()
	//ENODESmarkUnmark($newVal,mark)//se sostituisci il paramtro di nome xxx sarai marcato xxx
	//sostituisci
	ENODEReplaceAll($c, $parameter, $newVal);
	$parameter.remove();
	//se non ci sono più parametri, "dissolvi" il forAll esterno e metti al suo posto il contenuto
	if ($h.children().length == 0) {
		var $content = $c.children();
		//metti il sostituto nella stessa posizione del sostituito
		if ($f.css("position") == "absolute") {
			ENODEappendInABSPosition($content, $f, "superposed");
		} else {
			$content.insertBefore($f);
		}
		$f.remove();
		$root = $content; //se si dissolve il forall, ilpiù esterno rimane il suo contenuto
	}
	removeClassStartNodeAndDiscendence("selected", $root);
	return $root;
}

function formatForall($forall, $toBeRenamed) {
	var oldName = $toBeRenamed[0].ENODE_getName();
	var newName = "(" + oldName + ")";
	//cerca le occorrenze e marca ciascuna occorrenza
	var $occurrences = $findOccurrences($toBeRenamed, $forall);
	$occurrences.each(function () {
		this.ENODE_setName(newName);
	});
}

function ENODE_replaceWith(replacer) {
	//replacer must be ENODE
	$(this.ENODE_getEnclIfPresent()).replaceWith(ENODE_getEnclIfPresent(replacer));
	return this; // return replaced
}

function ENODE_getNodes(selector) {
	$(this).addClass("gettingNodes");
	var $subnodes = $(this)
		.find("*")
		.not(".gettingNodes [data-ENODE], .gettingNodes [data-ENODE] *"); //subnodes in this ENODE
	var $Nodes = $(this).add($subnodes); // root node + subnodes
	if (selector != undefined) {
		// se viene passato un "selector", filtra i Nodes
		$Nodes = $Nodes.filter(selector);
	}
	$(this).removeClass("gettingNodes");
	return $Nodes;
}

function ENODE_getRoles(selector) {
	var $roles = this.ENODE_getNodes(selector).filter('[class*="_role"]');
	$roles.sort(function (a, b) {
		if ($(a).hasClass("bVar_role") && !$(b).hasClass("bVar_role")) {
			// bVar_role always before other roles
			return -1;
		}
		if ($(b).hasClass("bVar_role") && !$(a).hasClass("bVar_role")) {
			// bVar_role always before other roles
			return 1;
		} else if (
			parseInt($(a).attr("data-roleOrder")) >
			parseInt($(b).attr("data-roleOrder"))
		) {
			return 1;
		} else if (
			parseInt($(b).attr("data-roleOrder")) >
			parseInt($(a).attr("data-roleOrder"))
		) {
			return -1;
		} else {
			return 0;
		}
	});
	return $roles;
}

function ENODE_getChildren(selector) {
	var $children = this.ENODE_getRoles().children("[data-ENODE]");
	if (selector != undefined) {
		// se viene passato un "selector", filtra
		$children = $children.filter(selector);
	}
	return $children;
}

function ENODE_getName(considerSuffix) {
	var nameWithSuffix = $(this).find(">.name").text();
	if (considerSuffix) {
		return nameWithSuffix;
	} else {
		return nameWithSuffix.match(/[^_]*/)[0];
	}
}

function ENODE_setName(newName) {
	$(this).find(">.name").text(newName);
}

function ENODE_addRole(dataType, roleClass, content) {
	var $newNode;
	if (content == undefined) { content = '' }//default content = ''
	if (roleClass == undefined) { roleClass = 'ol_role' }//default ol_role ok for function calls
	$newNode = $('<div class="role">' + content + "</div>").attr(
		"data-type", dataType); //data() e' un casino
	$newNode.addClass(roleClass);
	$(this).append($newNode);
	return $newNode;
} //da usare quando si crea una nuova funzione o definizione

function validTargetsFromOpened($ENODEdragged) {

	var valids = $('#canvasRole, #canvasRole [class*="_role"]:visible').filter(function(i,e){
		return canDraggedBeDroopedInRoleYesWrapNo($ENODEdragged,$(this))!='no'})

	return valids.not($ENODEdragged.parent());
}

/*
function canDraggedBeDroopedInThisRole($ENODEdragged,$role){
	//datatype is compatible
	if(!typeOk($ENODEdragged, $role)){return false}
	//******target is OPENED 
	if(!ENODEclosedDef($role[0])){  
		//is there place for another?
		return isTherePlaceForAnother($role)
	}
	//******target is CLOSED 
	else{
		//New definition and neutral element of conjunction is are properties constituent of the environment, so fundamental the environment can't work without it.
		// parent is 'And' and dragged is new definition or 'true' 
		ENODEparent($(this)).attr('data-ENODE')=='and' &&
		$ENODEdragged.is("[data-proto=asymmeq]") ||
		$ENODEdragged[0].ENODE_getName() == "true"
	}
}
*/

function canDraggedBeDroopedInRoleYesWrapNo($ENODEdragged,$role){
	//******target is OPENED and there is space for another
	if(!ENODEclosedDef($role[0]) && isTherePlaceForAnother($role) ){  
		if( typeOk($ENODEdragged, $role)){//datatype is compatible
			return 'yes'
		}
		else{
			return 'needsWrap'
		}
	}
	//******target is CLOSED 
	else if(ENODEparent($role).attr('data-ENODE')=='and' &&
			$ENODEdragged.is("[data-proto=asymmeq]") || $ENODEdragged[0].ENODE_getName() == "true"){
			// parent is 'And' and dragged is new definition or 'true' 
			//New definition and neutral element of conjunction are properties constituent of the environment, so fundamental the environment can't work without it.	
		return 'yes'
	}
	else{
		return 'no'
	}
}

function getNumOfPlaces($role) {
	//*****determine number of places********
	if ($role.hasClass("s_role")) {
		return [1, 1]; //[min,max]
	}
	let acceptString = $role.attr('data-accept')
	return attrAcceptToMinMax(acceptString)
}

function isTherePlaceForAnother($role) {
	var numOfPlaces = getNumOfPlaces($role)[1];
	var numOfChildren = $role.children().filter("[data-ENODE]").length
	return (numOfPlaces == -1 ||
		numOfChildren < numOfPlaces)
}


//let acceptString = $role.attr('string_accept')
function attrAcceptToMinMax(acceptString) {
	let min = 0
	let max = -1 //default value -1 means ther's not upper limit 
	if (acceptString == undefined) {
		return [min, max]//with default values
	}
	let acceptLimits = acceptString.split(':')
	if (acceptLimits.length == 1) {// "5"   precisely 5 elements return [5,5]
		let fixed = parseInt(acceptLimits[0]);
		if (!isNaN(fixed)) {
			min = fixed;
			max = fixed;
		}
	}
	else {//"2:3"
		let attrMin = parseInt(acceptLimits[0]);
		if (!isNaN(attrMin)) {//overwrite default only if not NaN
			min = attrMin;
		}
		let attrMax = parseInt(acceptLimits[1]);
		if (!isNaN(attrMax)) {//overwrite default only if not NaN
			max = attrMax;
		}
	}
	return [min, max]
}

function overflowExsists(node) {
	return (
		node.offsetHeight < node.scrollHeight || node.offsetWidth < node.scrollWidth
	);
}

function ENODEclone($node, Extend, removeID) {//default: Extend and RemoveID
	$clone = $node.clone(); //clona
	$toBeCleaned = $clone.add($clone.find("*")); //clean discendence too
	if (Extend !== false) {
		ExtendAndInitializeTree($clone);
	}
	if (removeID !== false) {
		$toBeCleaned.removeAttr("id");
		$toBeCleaned.removeAttr("data-proto");
		$toBeCleaned.removeAttr("data-tag");
		$toBeCleaned.removeAttr("data-import");
		$toBeCleaned.removeAttr("importStatus");
		$toBeCleaned.removeClass("hide");
		$toBeCleaned.removeClass("fundamental");
		$toBeCleaned.removeClass("CouldBeCollected");
	}
	return $clone;
}

var symbols = ["ci", "cn", "csymbol"];
function prototypeSearch(className, dataType, selector, name) {
	//alcune classi, ad esempio "ci", possono avere vari datatype
	//get all prototypes  (futuribile: preindex prototypes)
	var $prototypes = $("#palette").find("[data-ENODE][data-proto]");
	//filter for required
	if (selector) {
		$prototypes = $prototypes.filter(selector);
	}
	if ($prototypes.length == 0) {
		console.log("prototype not found:" + className + selector);
		return $();
	}
	//if(found 1 tag){return}
	//if(found >1 tag){return}
	var type = dataType; //per poter usare questo valore nell 'each'

	$prototypes = $prototypes.filter(function () {
		return (
			this.getAttribute("data-ENODE").toLowerCase() == className &&
			(type == undefined ||
				this.getAttribute("data-type").toLowerCase() == type)
		);
	}); //not case sensitive
	if ($prototypes.length > 1 && (className === "cn" || className === "ci")) {
		//if many candidates refine research
		let $specificProto = $prototypes.filter(function () {
			return this.ENODE_getName() == name;
		});
		if ($specificProto.length != 0) {
			return $specificProto.eq(0);
		} //found specific proto
		else {
			/*
				  let $genericPrototype = $prototypes.filter("#" + className.toLowerCase() + "Prototype" + dataTypeString);
				  if($genericPrototype.length!=0){
					  return $genericPrototype.eq(0);//found generic proto
				  }
				  else{ return $prototypes.eq(0);}//csn't refine return the firs with the right tag
				  */
			return $prototypes.eq(0);
		}
	}
	//if not found adapt generic prototype
	if ($prototypes.length === 0) {
		//console.warn('ENODE prototype not found:className:' + className + ", dataType:" + dataType);//Warning!!
		let $prototype = ENODEclone($("[data-proto='']"));
		$prototype.attr("data-ENODE", className);
		$prototype.attr("data-type", dataType);
		// add ENODEtype name as decoration name 
		//Duplication the prototype is extended outside this function
		//I nee to extend in order to use _setName
		ENODEextend($prototype);
		$prototype[0].ENODE_setName(className)
		//addTypeDecorations($prototype);
		return $prototype;
	}
	return $prototypes.last(); //in case you find more prototypes
}

/**
 * wraps the given ENODE element with an operation.
 *
 * If the parent of the ENODE element already has the specified operation, this function
 * simply returns the parent element. Otherwise, it creates a new clone of the prototype
 * for the operation, inserts it before the ENODE element, and moves the ENODE element
 * to be a child of the new clone.
 *
 * @param {jQuery} $ENODEelement - The ENODE element to wrap with the operation.
 * @param {string} op - The operation to wrap the ENODE element with.
 * @returns {jQuery} The new clone element that wraps the ENODE element.
 */
function wrapIfNeeded($ENODEelement, op) {
	if (ENODEparent($ENODEelement).attr("data-ENODE") === op) {
		//no need to cteate external op
		return ENODEparent($ENODEelement);
	} else {
		return wrapWithOperation($ENODEelement, op);
	}
}

function wrapWithOperation($ENODEelement, op){
	//create external operation to $ENODEelement, $ENODEelement is 1 element or a list of adjacent elements
	var $prototype;
	var roleSelector = "" //the wrapping operation may have more roles a selector may be needed  
	if (op=="def"){
		$prototype = prototypeSearch("eq","bool","[data-viseq=asymmetric]");//special case for definition
		roleSelector = ".secondMember"; //the expression must be insertend in the definendum witch is the second member
	}
	else{
		$prototype = prototypeSearch(op);
	}
	var $clone = ENODEclone($prototype);
	//ENODEparent($ENODEelement).replaceWith($clone);//replace provoca la distruzione degli eventi nel replaced
	$clone.insertBefore($ENODEelement.eq(0));
	$ENODEelement.appendTo($clone[0].ENODE_getRoles().eq(roleSelector));
	return $clone;
}

function wrapWithDefIfNeededreturnTarget($targetNode,$toBeInserted,unlocked){
	
	//if(  $targetNode.is('#canvasRole') && (ENODEclosedDef( $targetNode )  || $toBeInserted.attr("data-type") !== "bool") ){
	if(  canDraggedBeDroopedInRoleYesWrapNo($toBeInserted,$targetNode)=='needsWrap' ) {
		var $newDef = wrapWithOperation($toBeInserted, "def");
		if(unlocked){$newDef.addClass("unlocked")}
		else{$newDef.removeClass("unlocked")}
		ExtendAndInitialize($newDef);// il contenuto è già stato esteso
		return $newDef.find(".secondMember");
	}
	else{
		return $targetNode
	}
}


function checkCn($s) {
	//controlla che siano numeri e siano siblings
	var allCnOk = true;
	for (var i = 0, len = $s.length; i < len; i++) {
		//console.log(s[i]);
		if (isNaN($($s[i]).text())) {
			allCnOk = false;
			break;
		}
	}
	return allCnOk;
}

function checkSiblings($s) {
	//controlla che siano numeri e siano siblings
	var allSiblingsOk = true;
	var $parent = ENODEparent($($s[0])); //to check if nodes are siblings
	for (var i = 0, len = $s.length; i < len; i++) {
		if (!ENODEparent($($s[i])).is($parent)) {
			allSiblingsOk = false;
			break;
		}
	}
	return allSiblingsOk;
}

function addTypeDecorations($ENODE) {
	//get the "type" of the prototype and complete it with decoration
	var dataType = $ENODE.attr("data-type");
	var b = $ENODE;
	if (dataType === "num" && b.find(".leftDecoration").length == 0) {
		//is decoration present already?
		b.append($('<div class="leftDecoration"></div>'));
	}
	if (
		(dataType === "num" || dataType === "bool") &&
		b.find(".topDecoration").length == 0
	) {
		var b = $ENODE;
		b.append($('<div class="topDecoration"></div>'));
	}
}

function ENODErenamePrompt($ENODE, newName) {
	//
	var oldName = $ENODE[0].ENODE_getName();
	if ($ENODE.hasClass("minus")) {
		oldName = "-" + oldName;
	}
	if ($ENODE.hasClass("inverse")) {
		oldName = "/" + oldName;
	}
	var newName = prompt(
		'Enter a new name, / for inverse, /- for opposite and inverse do not use "-" or "/" in names es: x-xxx ',
		oldName
	);
	if (newName != null) {
		if (newName[0] === "/") {
			newName = newName.substr(1); //nome privato del segno meno
			$ENODE.addClass("inverse");
		} // attenzione: / va inserito prime del meno
		else {
			$ENODE.removeClass("inverse");
		}
		if (newName[0] === "-") {
			newName = newName.substr(1); //nome privato del segno meno
			$ENODE.addClass("minus");
		} //todo: cosa succede se input = ---2  ?
		else {
			$ENODE.removeClass("minus");
		}
		$ENODE[0].ENODE_setName(newName);
		$ENODE.attr("data-ENODE", isNaN(newName) ? "ci" : "cn"); // se numero allora classe "cn"
		ssnapshot.take();
	}
}

function createForThis($forall, $placeHolder) {
	//Modus Ponens deduce a special case from a forall
	var $clone = ENODEclone($forall);
	exclusiveFocus = $clone.addClass("exclusiveFocus"); //metti il clone in stato exclusiveFocus
	//****inserit the new proposition*****
	if (ENODEparent($forall).attr("data-ENODE") == "and") {
		$clone.insertAfter($forall);
	} else {
		//enclosure needed
		ENODECreateSpaceForDeduction($forall).append($clone);
	}
	return $clone;
}

//start to peel Onion($currENODE)
function ENODEsToVal($currENODE, res) {
	//espressioni tipo (-(/(-(a)))) funzione ricorsiva
	//res = {type:"NotAnumber", val:1, sign:1, exp:1, computedVal:NaN, canBeReplaced:true}
	//debug colors
	if (debugMode) {
		$("*").removeClass("input");
		ENODEnodesAddClass($currENODE, "input"); //add colors
	}

	//se non vengono passati segni precedenti essi sono inizializzati a 1
	if (res == undefined) {
		res = {
			type: "NotAnumber",
			val: 1,
			sign: 1,
			exp: 1,
			computedVal: NaN,
			canBeReplaced: true,
		};
	}
	var op = $currENODE.attr("data-ENODE");
	if (op === "minus" || op === "m_inverse") {
		//------------------> recursive
		var newRes = ENODEsToVal($currENODE[0].ENODE_getChildren(), res);
		//<------------------
		if (op === "minus") {
			res.sign = newRes.sign * -1;
		} else {
			res.exp = newRes.exp * -1;
		}
	} else if (op === "power") {
		let $exponent = $currENODE[0].ENODE_getChildren(':last');//:first child is exponent\
		if ($exponent.attr("data-ENODE") == "cn") {
			//------>
			let resExp = ENODEsToVal($exponent);
			//<-----
			res.exp = res.exp * resExp.val;
			let $base = $currENODE[0].ENODE_getChildren(':first');//:first child is base
			//------>
			res.val = ENODEsToVal($base).val;
			//<-----
		}
		else {
			//can't manage x^y 
		}
		res.type = op;
	} else if (op === "cn" || op === "ci") {
		//todo: per ora gestisce solo cn e ci
		res.type = op;
		res.val = $currENODE[0].ENODE_getName();
	} else {
		res.val = NaN;
		res.canBeReplaced = false;
	}
	res.computedVal = Math.pow(res.sign * res.val, res.exp);
	return res;
}

function isAsymbol($ENODE) {
	var className = $ENODE.attr("data-ENODE");
	return symbols.indexOf(className) != -1; //is it a symbol?(ci,cs,csymbol)
}

function ValToENODEs(partial) {
	var $newENODE;
	var $clone;
	var $target;
	if (partial.sign === -1) {
		//segno meno?
		$clone = ENODEclone(prototypeSearch("minus"));
		$newENODE = $clone;
		$target = $clone[0].ENODE_getRoles();
	}
	if (partial.exp === -1) {
		//inverso?
		$clone = ENODEclone(prototypeSearch("m_inverse"));
		if ($target !== undefined) {
			$target.append($clone);
		} else {
			$newENODE = $clone;
		}
		$target = $clone[0].ENODE_getRoles();
	}
	else if (partial.exp != 1) {
		//power
		$clone = ENODEclone(prototypeSearch("power"));
		if ($target !== undefined) {
			$target.append($clone);
		} else {
			$newENODE = $clone;
		}
		let $exponent = ENODEclone(prototypeSearch("cn", "num"));
		$exponent[0].ENODE_setName(partial.exp);
		$clone[0].ENODE_getRoles('.exponent').append($exponent);
		$target = $clone[0].ENODE_getRoles('.base');

	}
	$clone = ENODEclone(prototypeSearch(partial.type, "num", undefined, partial.val));
	$clone[0].ENODE_setName(partial.val);
	$clone.attr("data-ENODE", partial.type); //uso un generico prototipo num e qui specifico se cn o ci
	if ($target !== undefined) {
		$target.append($clone);
	} else {
		$newENODE = $clone;
	}
	return $newENODE;
}

function ENODEBesideGiven($startENODE) {
	//Attualmente il contenuto dei role si dispone leftRight e topDown mentre comporre è visto come left e down.
	//di conseguenza per decidere qual'è l'elemento con cui comporre devo distiguere a seconda dell'orientazione.'
	if ($toBeComp.css("display") === "inline-block") {
		return $startENODE.prevAll("[data-ENODE]:first");
	} else {
		return $startENODE.nextAll("[data-ENODE]:first");
	}
}

function refreshOneBracket($ENODE) {
	if (ENODEneedsBracket($ENODE)) {
		$ENODE.addClass("brackets");
	} else {
		$ENODE.removeClass("brackets");
	}
}

function refreshOneTimesDisp($ENODE, timesDisposition) {
	if (!$ENODE.is('[data-ENODE=times]')) { return }//procedi solo se è un ENODE di tipo times
	if (timesDisposition == "brTimes") {
		reorderTimes($ENODE)
	}
	else {
		reorderTimes($ENODE, true)//remove br, do not reorder
	}
}





// RefreshEmptyInfixBraketsGlued($("#canvasRole"),true,"eibgt")
function RefreshEmptyInfixBraketsGlued($startNode, tree, options) {
	//console.log('refreshed opt:' + options);
	//console.log($startNode);
	if ($startNode == undefined || $startNode.length == 0) {
		$startNode = $("#result,#canvasAnd,#palette")
	}
	var $ENODEs; //lista degli ENODEi "da trattare"
	if (tree != false) {
		$ENODEs = $startNode.add($startNode.find("[data-ENODE]"));
	} else {
		$ENODEs = $startNode;
	}
	$ENODEs.each(function (i, element) {
		if (options == undefined || options.indexOf("e") != -1) {
			refreshOneEmpty($(element));
		}
		if (options == undefined || options.indexOf("i") != -1) {
			refreshOneInfix($(element));
		}
		if (options == undefined || options.indexOf("b") != -1) {
			refreshOneBracket($(element));
		}
		if (options == undefined || options.indexOf("t") != -1) {
			refreshOneTimesDisp($(element), $('body').attr('timesDisposition'));
		}
	});
	if (options == undefined || options.indexOf("g") != -1) {
		refreshGlued($startNode);
	}
}

function ENODEshowMarks($ENODE, showPath) {
	//se showPath=true allora mostra anche il path
	var labelString;
	var mark = $ENODE.attr("title");
	if (mark == undefined) {
		mark = "";
	}
	var path = $ENODE.attr("data-path");
	if (!showPath || path == undefined) {
		path = "";
	} //se non è da visualizzare, oppure è indefinito
	if ($ENODE.find(".label").length == 0) {
		$ENODE.append('<div class="label"></div>');
	}
	$ENODE.find(".label").text(mark + "_" + path);
}
function showAllMarks(showPath) {
	$("body [data-ENODE]:visible").each(function (i, element) {
		ENODEshowMarks($(element), showPath);
	});
}

function hideAllMarks() {
	$(".label").remove();
}

function ENODEEqual(node1, node2, checkType, neglectRootSign) {
	//node1/2 HTMLnode. Flat to simil mathml e paragona
	if (node1 == undefined || node2 == undefined) {
		return false;
	}
	return (
		node1.ENODEcreateMathmlString(undefined, checkType, neglectRootSign) ===
		node2.ENODEcreateMathmlString(undefined, checkType, neglectRootSign)
	);
	//return adaptMatch(undefined,$(node1),$(node2),$(node2))//sostituita comparazione "grezza" con comparazione ricorsiva
}

function compareExtENODE(
	$input,
	$pattern,
	checkENODETypeAndName /*defaul=true*/,
	checkMarks
) {
	var res;
	if (checkMarks) {
		if (!checkMarksOkForPattern($input, $pattern)) {
			return false; //Marks do not match
		}
	}
	if (
		!($input.attr("data-type") === $pattern.attr("data-type")) /*notSameType*/
	) {
		return false;
	} else if (checkENODETypeAndName == false) {
		return true;
	} // no deeper tests required
	else if (
		$input.attr("data-ENODE") !== $pattern.attr("data-ENODE") /*notSameClass*/
	) {
		return false;
	} else if (symbols.indexOf($input.attr("data-ENODE")) != -1 /*is a symbol*/) {
		res = $input[0].ENODE_getName() === $pattern[0].ENODE_getName();
	} else {
		res = true; //no more tests required
	}
	return res;
}


function ENODE_checkIfPointlessSinglENODE() {
	let op = $(this).attr("data-ENODE");
	if (!OpIsAssociative(op)) {
		return false;
	}
	if (this.ENODE_getChildren().length <= 1) {
		return true;
	}
	let opP = ENODEparent($(this)).attr("data-ENODE");
	if (opP == op) {
		return true;
	}
}

function ENODE_overlay(mode) {
	// aggiunge/rimuove un overlay ad un ENODE
	if (mode == undefined) {
		$(this).append('<div id="overlay">');
	} else {
		$("#overlay").remove();
	}
}


function ENODEselectable(startElement) {
	//risali passo passo la struttura DOM fino a trovare un elemento ENODE
	if (ENODEclosedDef(startElement)) {
		return startElement.closest('[data-ENODE]:not(.unselectable):not(.glued)');
	} else {
		return startElement.closest('[data-ENODE]');
	}
}

function ENODERefreshAsymmEq($ENODE) {
	// adegua l'icona del lucchetto allo stato unlocked/non unlocked
	var $firstMember = $ENODE.find('>.firstMember')
	$firstMember.addClass("ui-icon");
	if ($ENODE.hasClass('unlocked')) {
		$firstMember.addClass("ui-icon-unlocked");
		$firstMember.removeClass("ui-icon-bullet");
	} else {
		$firstMember.addClass("ui-icon-bullet");
		$firstMember.removeClass("ui-icon-unlocked");
	}
}

function ENODEnodesAddClass($ENODE, newClass, mode /* true = remove*/) {
	if (!mode) {
		$ENODE.each(function () {
			this.ENODE_getNodes().addClass(newClass);
		});
	} else {
		$ENODE.each(function () {
			this.ENODE_getNodes().removeClass(newClass);
		});
	}
}

// ENODEapplyFunctToTree($('.selected'),true,ALDOtest,'a','b','c')
function ENODEapplyFunctToTree(
	$StartENODE,
	includeRoot,
	funct,
	parameterA,
	parameterB,
	parameterC
) {
	//given Funct($ENODE), it is applied to the discendants of $startNode
	let $tree = $();
	if (includeRoot) {
		$tree = $tree.add($StartENODE);
	}
	$tree = $tree.add($StartENODE.find("[data-ENODE]"));
	//$tree.each(funct(parameterA,parameterB))
	$tree.each(function (i, e) {
		funct($(e), parameterA, parameterB, parameterC);
	});
}

/*
function ENODEfrozenDef(Node){
	//!! to be refined 
	return $(Node).closest('[data-tag]')
}
*/

/************** ENODE UTILITIES  not API ***********************/
function ENODEextend($startNode, applyToSubtreeAlso) {
	//add methods from object "ENODE"
	var $toBeExtended;
	if (!applyToSubtreeAlso) {
		$toBeExtended = $startNode.filter("[data-ENODE]"); //in ogni caso estendo solo i '[data-ENODE]'
	} else {
		$toBeExtended = $startNode
			.filter("[data-ENODE]")
			.add($startNode.find("[data-ENODE]"));
	}

	$toBeExtended.each(function (index) {
		// tutti gli HTML nodes con classe .ENODE
		$.extend(this, ENODE); //pare non si possa fare altrimenti non riesco a estendere $(this)
	});
}

function reorderTimes($startTimes, brRemove) {
	//select a times ENODE
	//reorderTimes($('.selected'))  
	//reorderTimes($('.selected'),true)  te remove br
	try {

		let role = $startTimes[0].ENODE_getRoles()[0];
		$(role).find('br').remove();
		if (brRemove) { return }
		let brExist = false;
		let numeratorFound = false;
		let childrenArr = $startTimes[0].ENODE_getChildren().toArray()
		/**metti i reciproci al per ultimi preceduti da br */
		for (i = 0; childrenArr[i]; i++) {
			if ($(childrenArr[i]).is('[data-ENODE=m_inverse]')) {
				//aggiungi br se ancora non esiste
				if (!brExist) {
					$('<br>').appendTo($(role))
					brExist = true;
				}
				//mettilo in coda
				role.appendChild(childrenArr[i])
			}
			else {
				numeratorFound = true;
			}
		}
		//** se però non c'è numeratore, allora togli il br*/
		if (!numeratorFound) {
			$(role).find('br').remove();
		}
	} catch (error) {
		console.error(error);
	}

}
