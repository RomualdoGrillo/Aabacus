// In questo file dovrebbero comparire tutte le funzioni che manipolano l'espressione matematica
//todo: in teoria tutte le operazioni sull'espressione dovrebbero avvenire tramite queste funzioni, anche se per ora questa riformattazione del codice non è ancora avvenuta
//todo: cercare,tutti i punti in cui il codice  al di fuori di questo file e sostituire la manipolazione diretta di elementi html che costituiscono l'espressione matematica con chiamate a questo file 

/*
Nota: non sempre � comodo usare enodeobject.enodemethod()
Il risultato di un select $('selector'), � un oggetto jQuery contenente n altri oggetti. Quindi non si pu� chiamare $('selector').enodemethod
Si pu� chiamare in uno dei modi seguenti:  
1)  $('selector')[0].enodemethod
	$('selector').each(function(index) {this.enodemethod})
2) oppure chiamare la funzione corrispondente al metodo, per come � costruito enode enodemethod(enodeobject)
*/

/*
Nota:
enodenomefunzione possono essere usati sia come metodi che come funzioni
enode_nomemetodo possono essere chiamati solo come metodi
ad esempio enodeparent può essere invocato come metodo di un enode oppure come
funzione su un qualsiasi elemento html anche se non è un enode 
*/
/* ---- Expression Global Utilities ---- */

/**
 * Restituisce il nodo radice dell'espressione matematica principale.
 * @returns {HTMLElement|null} L'elemento HTML (DOM element) che rappresenta il nodo radice con attributo [data-enode],
 *                            o null se non trovato.
 */
function getExpressionRootNode() {
    // Trova il primo figlio con [data-enode] all'interno del contenitore principale
    return $("#canvas>.secondMember").children("[data-enode]")[0];
}

enode = {
	enodeparent: enodeparent,
	enodecreateMathmlString: enodecreateMathmlString,
	enodeclosedDef: enodeclosedDef,
	isDefinition: isDefinition,
	enodeCreateDefinition: enodeCreateDefinition,
	enode_replaceWith: enode_replaceWith,
	enode_getNodes: enode_getNodes,
	enode_getRoles: enode_getRoles,
	enode_getChildren: enode_getChildren,
	enode_getName: enode_getName,
	enode_setName: enode_setName,
	enode_addRole: enode_addRole,
	enode_checkIfPointlessSingleNode: enode_checkIfPointlessSingleNode,
	enode_dissolveContainer: enode_dissolveContainer,
	enode_overlay: enode_overlay,
};
/* ---- enode Methods/Functions ---- */

function enodeparent($startNode) {
	//per poter chiamare sia come funzione che come metodo
	if ($startNode == undefined) {
		$startNode = $(this);
	}
	//risali passo passo la struttura DOM fino a trovare un elemento enode
	return $startNode.parent().closest("[data-enode]");
}

function enodeclosedDef(Node) {
	//stabilisci se l'elemento "Node" e' aperto e si puo modificare liberamente
	return $(Node).closest(".unlocked").length == 0;
}

function isDefinition(Node) {
	//controlla se l'elemento è una definizione verificando se ha l'attributo data-viseq="asymmetric"
	return $(Node).is('[data-viseq="asymmetric"]');
}

function enodefrozenDef(Node) {
	//!! to be refined
	return $(Node).closest("[data-tag]");
}

function enode_dissolveContainer() {
	if (this.enode_getChildren().length > 0) {
		var $children = this.enode_getRoles().children().filter("[data-enode]");
		$(this).replaceWith($children);
	} else {
		$(this).remove();
	}
	return $children;
}

//per creazione automatica def: $(".selected")[0].enodeCreateDefinition()
//return enodeEqual(this,$mouseDownenode[0])
function enodeCreateDefinition(startNode) {
	if (startNode == undefined) {
		startNode = this;
	}
	var outType = $(startNode).attr("data-type");
	var $newDef = enodeclone(
		// prototypeSearch('eq','bool','[data-viseq=asymmetric]');
		prototypeSearch("eq", "bool",)
	); //crea una nuova definizine
	//*********************** definendum **********************
	//attuale)al momento vengono inseriti n ruoli singoli quanti sono i parametri
	//rimane da fare todo!!: separare con , 
	//alternativa)in altermnativa si potrebbe una lista ordinata, ma si dovrebbe introdurre un modo
	//per specificare separatamente il datatype di ogni elemento della lista (cluster)
	var $definendum = enodeclone(prototypeSearch(""));//search for generic prototype
	$definendum.attr("data-type", outType);
	m1 = $newDef.find(".firstMember"); //trova primo membro
	newName = prompt("Enter a name for the new definition");
	if (newName == null) { return }//prompt cancelled
	if (!newName) { return }//empty name
	$definendum.attr("data-enode", newName);
	$definendum.find(".name").append(newName);
	m1.append($definendum); //aggiungi contenuto al primo membro ed inseriscilo
	//*********************** definens **********************
	$definens = enodeclone($(startNode));
	//$definens.find("#MyOverlay").remove()//togli l'overlay colorato dal clone
	m2 = $newDef.find(".secondMember"); //trova secondo membro todo
	m2.append($definens); //aggiungi contenuto al secondo membro
	var $parList = $definens.find(".unselected");
	$("#canvasRole").append($newDef);
	if ($parList.length > 0) {
		let paramDefNames = ["x", "y", "z", "t", "k", "p", "q", "a", "b", "c", "d", "e", "f", "g", "h", "i", "l", "m", "n", "o", "q", "r", "s", "u", "v", "z",];
		$newforAll = enodeclone(prototypeSearch("forall")); //clona for each
		enodeextend($newforAll);
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
			var $newNode = enodeclone(prototypeSearch("ci")).attr(
				"data-type",
				thisType
			); //data() e' un casino
			$newNode[0].enode_setName(paramDefNames[i]);
			$(this).replaceWith($newNode);
			var $Clone1 = enodeclone($newNode); //clone da inserire in definendum
			var $Clone2 = enodeclone($newNode); //clone da inserire in forAll header
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

function enodeReplace($replaced, $replacer) {
	var $clone = enodeclone($replacer);
	enodeextend($clone); //mi serve subito che sia esteso, gli eventi sono attivati in seguito
	//sostituisci
	var mark = enodeSmarkUnmark($replaced);
	if (mark !== undefined) {
		enodeSmarkUnmark($clone, mark); //$replaced---->$replacer sostituisci ma conserva il titolo se presente
	}
	$replaced.replaceWith($clone);
	$clone.css({ display: "" });
	ExtendAndInitializeTree($clone);
}



function enodeReplaceLink($replaced, $link) {
	//get the other member of the link, futuribile: uguaglianza tra molti membri, necessario sistema per scegliere tra membri
	var $replacer;
	if ($link.parent().hasClass("firstMember")) {
		$replacer = enodeclone(
			enodeparent($link)[0].enode_getRoles(".secondMember").children()
		);
	} else if ($link.parent().hasClass("secondMember")) {
		$replacer = enodeclone(
			enodeparent($link)[0].enode_getRoles(".firstMember").children()
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

function typeOk($enodedragged, $role) {
	return classA_in_classB(
		$enodedragged.attr("data-type"),
		$role.attr("data-type")
	);
}

//if($enodedragged.attr(data-type))verifica datatype e numero di elementi accettati
function classA_in_classB(classNameA, classNameB) {
	// futuribile: stabilire se una classe ne estende un'altra anche con ereditariet� multipla
	return classNameB === "obj" || classNameA === classNameB;
}

function enodeCreateSpaceForDeduction($hypothesis) {
	var spaceForDeduction;
	if (enodeparent($hypothesis).attr("data-enode") === "and") {
		//parent external to enclosure is 'and'?
		spaceForDeduction = $hypothesis.parent();
	} else {
		// create an 'and'
		var newAnd = enodeclone(prototypeSearch("and"));
		$hypothesis.parent().append(newAnd);
		spaceForDeduction = newAnd.find('>[class*="_role"]');
		spaceForDeduction.append($hypothesis); //
	}
	return spaceForDeduction;
}



function enodeReplaceAll(
	$startNode,
	replaced /*HTMLnode enode */,
	replacer /*HTMLnode enode */
) {
	var $replaced = $(replaced);
	var $replacer = $(replacer);
	$startNode = $($startNode); //se per caso passo uno start node non $
	var $occurrences = $findOccurrences($replaced, $startNode)
	var result = $.each($occurrences, function (i, o) {
		enodeReplace($(o), $replacer);
	});
	return +$occurrences.length + " replaced";
}

function GetforAllContentRole($forAll) {
	return $forAll[0].enode_getRoles(".forAllContent");
}
function GetforAllHeader($forAll) {
	return $forAll[0].enode_getRoles(".forAllHeader");
}

function enodeForThis_Par_newVal($newVal, $parameter) {
	return enodeForThisPar($parameter, $newVal);
}
function enodeForThisPar($parameter, $newVal) {
	// enode
	//$newVal può essere anche un vettore vuoto
	//in tal caso il parametro doverebbe essere di tipo x___ ma per ora non faccio controlli
	var $f = $parameter.parent().closest('[data-enode="forAll"]'); //
	var $h = GetforAllHeader($f);// get header
	var $c = GetforAllContentRole($f);
	var $root = $f; //l'elemento più esterno Root può cambiare
	//************stabilisci se c'è conflitto con i nomi delle Bvar******
	//il nome della variabile specificata nel forThis è per caso già presente tra i parametri del forall?
	if ($newVal.length != 0) {
		var newValName = $newVal[0].enode_getName();
		var $toBeRenamed = $h.children().filter(function () {
			return this.enode_getName() == newValName;
		});
		$toBeRenamed.each(function () {
			formatForall($f, $(this));
		});
	}
	//var mark = $parameter[0].enode_getName()
	//enodeSmarkUnmark($newVal,mark)//se sostituisci il paramtro di nome xxx sarai marcato xxx
	//sostituisci
	enodeReplaceAll($c, $parameter, $newVal);
	$parameter.remove();
	//se non ci sono più parametri, "dissolvi" il forAll esterno e metti al suo posto il contenuto
	if ($h.children().length == 0) {
		var $content = $c.children();
		//metti il sostituto nella stessa posizione del sostituito
		if ($f.css("position") == "absolute") {
			enodeappendInABSPosition($content, $f, "superposed");
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
	var oldName = $toBeRenamed[0].enode_getName();
	var newName = "(" + oldName + ")";
	//cerca le occorrenze e marca ciascuna occorrenza
	var $occurrences = $findOccurrences($toBeRenamed, $forall);
	$occurrences.each(function () {
		this.enode_setName(newName);
	});
}

function enode_replaceWith(replacer) {
	//replacer must be enode
	$(this.enode_getEnclIfPresent()).replaceWith(enode_getEnclIfPresent(replacer));
	return this; // return replaced
}

function enode_getNodes(selector) {
	$(this).addClass("gettingNodes");
	var $subnodes = $(this)
		.find("*")
		.not(".gettingNodes [data-enode], .gettingNodes [data-enode] *"); //subnodes in this enode
	var $Nodes = $(this).add($subnodes); // root node + subnodes
	if (selector != undefined) {
		// se viene passato un "selector", filtra i Nodes
		$Nodes = $Nodes.filter(selector);
	}
	$(this).removeClass("gettingNodes");
	return $Nodes;
}

function enode_getRoles(selector) {
	var $roles = this.enode_getNodes(selector).filter('[class*="_role"]');
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

function enode_getChildren(selector) {
	var $children = this.enode_getRoles().children("[data-enode]");
	if (selector != undefined) {
		// se viene passato un "selector", filtra
		$children = $children.filter(selector);
	}
	return $children;
}

function enode_getName(considerSuffix) {
	var nameWithSuffix = $(this).find(">.name").text();
	if (considerSuffix) {
		return nameWithSuffix;
	} else {
		return nameWithSuffix.match(/[^_]*/)[0];
	}
}

function enode_setName(newName) {
	$(this).find(">.name").text(newName);
}

function enode_addRole(dataType, roleClass, content) {
	var $newNode;
	if (content == undefined) { content = '' }//default content = ''
	if (roleClass == undefined) { roleClass = 'ol_role' }//default ol_role ok for function calls
	$newNode = $('<div class="role">' + content + "</div>").attr(
		"data-type", dataType); //data() e' un casino
	$newNode.addClass(roleClass);
	$(this).append($newNode);
	return $newNode;
} //da usare quando si crea una nuova funzione o definizione

function validTargetsFromOpened($enodedragged) {

	var valids = $('#canvasRole, #canvasRole [class*="_role"]:visible').filter(function(i,e){
		return canDraggedBeDroopedInRoleYesWrapNo($enodedragged,$(this))!='no'})

	return valids.not($enodedragged.parent());
}

/*
function canDraggedBeDroopedInThisRole($enodedragged,$role){
	//datatype is compatible
	if(!typeOk($enodedragged, $role)){return false}
	//******target is OPENED 
	if(!enodeclosedDef($role[0])){  
		//is there place for another?
		return isTherePlaceForAnother($role)
	}
	//******target is CLOSED 
	else{
		//New definition and neutral element of conjunction is are properties constituent of the environment, so fundamental the environment can't work without it.
		// parent is 'And' and dragged is new definition or 'true' 
		enodeparent($(this)).attr('data-enode')=='and' &&
		$enodedragged.is("[data-proto=asymmeq]") ||
		$enodedragged[0].enode_getName() == "true"
	}
}
*/

function canDraggedBeDroopedInRoleYesWrapNo($enodedragged,$role){
	//******target is OPENED and there is space for another
	if(!enodeclosedDef($role[0]) && isTherePlaceForAnother($role) ){  
		if( typeOk($enodedragged, $role)){//datatype is compatible
			return 'yes'
		}
		else{
			return 'needsWrap'
		}
	}
	//******target is CLOSED 
	else if(enodeparent($role).attr('data-enode')=='and' &&
			$enodedragged.is("[data-proto=asymmeq]") || $enodedragged[0].enode_getName() == "true"){
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
	var numOfChildren = $role.children().filter("[data-enode]").length
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

function enodeclone($node, Extend, removeID) {//default: Extend and RemoveID
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
	var $prototypes = $("#palette").find("[data-enode][data-proto]");
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
			this.getAttribute("data-enode").toLowerCase() == className &&
			(type == undefined ||
				this.getAttribute("data-type").toLowerCase() == type)
		);
	}); //not case sensitive
	if ($prototypes.length > 1 && (className === "cn" || className === "ci")) {
		//if many candidates refine research
		let $specificProto = $prototypes.filter(function () {
			return this.enode_getName() == name;
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
		//console.warn('enode prototype not found:className:' + className + ", dataType:" + dataType);//Warning!!
		let $prototype = enodeclone($("[data-proto='']"));
		$prototype.attr("data-enode", className);
		$prototype.attr("data-type", dataType);
		// add enodetype name as decoration name 
		//Duplication the prototype is extended outside this function
		//I nee to extend in order to use _setName
		enodeextend($prototype);
		$prototype[0].enode_setName(className)
		//addTypeDecorations($prototype);
		return $prototype;
	}
	return $prototypes.last(); //in case you find more prototypes
}

/**
 * wraps the given enode element with an operation.
 *
 * If the parent of the enode element already has the specified operation, this function
 * simply returns the parent element. Otherwise, it creates a new clone of the prototype
 * for the operation, inserts it before the enode element, and moves the enode element
 * to be a child of the new clone.
 *
 * @param {jQuery} $enodeelement - The enode element to wrap with the operation.
 * @param {string} op - The operation to wrap the enode element with.
 * @returns {jQuery} The new clone element that wraps the enode element.
 */
function wrapIfNeeded($enodeelement, op) {
	if (enodeparent($enodeelement).attr("data-enode") === op) {
		//no need to cteate external op
		return enodeparent($enodeelement);
	} else {
		return wrapWithOperation($enodeelement, op);
	}
}
function wrapWithOperation($enodeelement, op) {
	//create external operation to $enodeelement, $enodeelement is 1 element or a list of adjacent elements
	var $prototype = prototypeSearch(op);
	var $clone = enodeclone($prototype);
	//enodeparent($enodeelement).replaceWith($clone);//replace provoca la distruzione degli eventi nel replaced
	$clone.insertBefore($enodeelement.eq(0));
	$enodeelement.appendTo($clone[0].enode_getRoles());
	return $clone;
}

function wrapWithDefIfNeededreturnTarget($targetNode,$toBeInserted,unlocked){
	
	//if(  $targetNode.is('#canvasRole') && (enodeclosedDef( $targetNode )  || $toBeInserted.attr("data-type") !== "bool") ){
	if(  canDraggedBeDroopedInRoleYesWrapNo($toBeInserted,$targetNode)=='needsWrap' ) {
		var $newDef = enodeclone(prototypeSearch('eq','bool','[data-viseq=asymmetric]'));
		if(unlocked){$newDef.addClass("unlocked")}
		else{$newDef.removeClass("unlocked")}
		$newDef.insertBefore($toBeInserted.eq(0));
		$target = $newDef.find(".secondMember")
		ExtendAndInitialize($newDef);// il contenuto è già stato esteso
		$target.append($toBeInserted);
		return $target
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
	var $parent = enodeparent($($s[0])); //to check if nodes are siblings
	for (var i = 0, len = $s.length; i < len; i++) {
		if (!enodeparent($($s[i])).is($parent)) {
			allSiblingsOk = false;
			break;
		}
	}
	return allSiblingsOk;
}

function addTypeDecorations($enode) {
	//get the "type" of the prototype and complete it with decoration
	var dataType = $enode.attr("data-type");
	var b = $enode;
	if (dataType === "num" && b.find(".leftDecoration").length == 0) {
		//is decoration present already?
		b.append($('<div class="leftDecoration"></div>'));
	}
	if (
		(dataType === "num" || dataType === "bool") &&
		b.find(".topDecoration").length == 0
	) {
		var b = $enode;
		b.append($('<div class="topDecoration"></div>'));
	}
}

function enoderenamePrompt($enode, newName) {
	//
	var oldName = $enode[0].enode_getName();
	if ($enode.hasClass("minus")) {
		oldName = "-" + oldName;
	}
	if ($enode.hasClass("inverse")) {
		oldName = "/" + oldName;
	}
	var newName = prompt(
		'Enter a new name, / for inverse, /- for opposite and inverse do not use "-" or "/" in names es: x-xxx ',
		oldName
	);
	if (newName != null) {
		if (newName[0] === "/") {
			newName = newName.substr(1); //nome privato del segno meno
			$enode.addClass("inverse");
		} // attenzione: / va inserito prime del meno
		else {
			$enode.removeClass("inverse");
		}
		if (newName[0] === "-") {
			newName = newName.substr(1); //nome privato del segno meno
			$enode.addClass("minus");
		} //todo: cosa succede se input = ---2  ?
		else {
			$enode.removeClass("minus");
		}
		$enode[0].enode_setName(newName);
		$enode.attr("data-enode", isNaN(newName) ? "ci" : "cn"); // se numero allora classe "cn"
		ssnapshot.take();
	}
}

function createForThis($forall, $placeHolder) {
	//Modus Ponens deduce a special case from a forall
	var $clone = enodeclone($forall);
	exclusiveFocus = $clone.addClass("exclusiveFocus"); //metti il clone in stato exclusiveFocus
	//****inserit the new proposition*****
	if (enodeparent($forall).attr("data-enode") == "and") {
		$clone.insertAfter($forall);
	} else {
		//enclosure needed
		enodeCreateSpaceForDeduction($forall).append($clone);
	}
	return $clone;
}

//start to peel Onion($currenode)
function enodesToVal($currenode, res) {
	//espressioni tipo (-(/(-(a)))) funzione ricorsiva
	//res = {type:"NotAnumber", val:1, sign:1, exp:1, computedVal:NaN, canBeReplaced:true}
	//debug colors
	if (debugMode) {
		$("*").removeClass("input");
		enodenodesAddClass($currenode, "input"); //add colors
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
	var op = $currenode.attr("data-enode");
	if (op === "minus" || op === "m_inverse") {
		//------------------> recursive
		var newRes = enodesToVal($currenode[0].enode_getChildren(), res);
		//<------------------
		if (op === "minus") {
			res.sign = newRes.sign * -1;
		} else {
			res.exp = newRes.exp * -1;
		}
	} else if (op === "power") {
		let $exponent = $currenode[0].enode_getChildren(':last');//:first child is exponent\
		if ($exponent.attr("data-enode") == "cn") {
			//------>
			let resExp = enodesToVal($exponent);
			//<-----
			res.exp = res.exp * resExp.val;
			let $base = $currenode[0].enode_getChildren(':first');//:first child is base
			//------>
			res.val = enodesToVal($base).val;
			//<-----
		}
		else {
			//can't manage x^y 
		}
		res.type = op;
	} else if (op === "cn" || op === "ci") {
		//todo: per ora gestisce solo cn e ci
		res.type = op;
		res.val = $currenode[0].enode_getName();
	} else {
		res.val = NaN;
		res.canBeReplaced = false;
	}
	res.computedVal = Math.pow(res.sign * res.val, res.exp);
	return res;
}

function isAsymbol($enode) {
	var className = $enode.attr("data-enode");
	return symbols.indexOf(className) != -1; //is it a symbol?(ci,cs,csymbol)
}

function ValToenodes(partial) {
	var $newenode;
	var $clone;
	var $target;
	if (partial.sign === -1) {
		//segno meno?
		$clone = enodeclone(prototypeSearch("minus"));
		$newenode = $clone;
		$target = $clone[0].enode_getRoles();
	}
	if (partial.exp === -1) {
		//inverso?
		$clone = enodeclone(prototypeSearch("m_inverse"));
		if ($target !== undefined) {
			$target.append($clone);
		} else {
			$newenode = $clone;
		}
		$target = $clone[0].enode_getRoles();
	}
	else if (partial.exp != 1) {
		//power
		$clone = enodeclone(prototypeSearch("power"));
		if ($target !== undefined) {
			$target.append($clone);
		} else {
			$newenode = $clone;
		}
		let $exponent = enodeclone(prototypeSearch("cn", "num"));
		$exponent[0].enode_setName(partial.exp);
		$clone[0].enode_getRoles('.exponent').append($exponent);
		$target = $clone[0].enode_getRoles('.base');

	}
	$clone = enodeclone(prototypeSearch(partial.type, "num", undefined, partial.val));
	$clone[0].enode_setName(partial.val);
	$clone.attr("data-enode", partial.type); //uso un generico prototipo num e qui specifico se cn o ci
	if ($target !== undefined) {
		$target.append($clone);
	} else {
		$newenode = $clone;
	}
	return $newenode;
}

function enodeBesideGiven($startenode) {
	//Attualmente il contenuto dei role si dispone leftRight e topDown mentre comporre è visto come left e down.
	//di conseguenza per decidere qual'è l'elemento con cui comporre devo distiguere a seconda dell'orientazione.'
	if ($toBeComp.css("display") === "inline-block") {
		return $startenode.prevAll("[data-enode]:first");
	} else {
		return $startenode.nextAll("[data-enode]:first");
	}
}

function refreshOneBracket($enode) {
	if (enodeneedsBracket($enode)) {
		$enode.addClass("brackets");
	} else {
		$enode.removeClass("brackets");
	}
}

function refreshOneTimesDisp($enode, timesDisposition) {
	if (!$enode.is('[data-enode=times]')) { return }//procedi solo se è un enode di tipo times
	if (timesDisposition == "brTimes") {
		reorderTimes($enode)
	}
	else {
		reorderTimes($enode, true)//remove br, do not reorder
	}
}





// RefreshEmptyInfixBraketsGlued($("#canvasRole"),true,"eibgt")
function RefreshEmptyInfixBraketsGlued($startNode, tree, options) {
	//console.log('refreshed opt:' + options);
	//console.log($startNode);
	if ($startNode == undefined || $startNode.length == 0) {
		$startNode = $("#result,#canvasAnd,#palette")
	}
	var $enodes; //lista degli enodei "da trattare"
	if (tree != false) {
		$enodes = $startNode.add($startNode.find("[data-enode]"));
	} else {
		$enodes = $startNode;
	}
	$enodes.each(function (i, element) {
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

function enodeshowMarks($enode, showPath) {
	//se showPath=true allora mostra anche il path
	var labelString;
	var mark = $enode.attr("title");
	if (mark == undefined) {
		mark = "";
	}
	var path = $enode.attr("data-path");
	if (!showPath || path == undefined) {
		path = "";
	} //se non è da visualizzare, oppure è indefinito
	if ($enode.find(".label").length == 0) {
		$enode.append('<div class="label"></div>');
	}
	$enode.find(".label").text(mark + "_" + path);
}
function showAllMarks(showPath) {
	$("body [data-enode]:visible").each(function (i, element) {
		enodeshowMarks($(element), showPath);
	});
}

function hideAllMarks() {
	$(".label").remove();
}

function enodeEqual(node1, node2, checkType, neglectRootSign) {
	//node1/2 HTMLnode. Flat to simil mathml e paragona
	if (node1 == undefined || node2 == undefined) {
		return false;
	}
	return (
		node1.enodecreateMathmlString(undefined, checkType, neglectRootSign) ===
		node2.enodecreateMathmlString(undefined, checkType, neglectRootSign)
	);
	//return adaptMatch(undefined,$(node1),$(node2),$(node2))//sostituita comparazione "grezza" con comparazione ricorsiva
}

function compareExtenode(
	$input,
	$pattern,
	checkenodeTypeAndName /*defaul=true*/,
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
	} else if (checkenodeTypeAndName == false) {
		return true;
	} // no deeper tests required
	else if (
		$input.attr("data-enode") !== $pattern.attr("data-enode") /*notSameClass*/
	) {
		return false;
	} else if (symbols.indexOf($input.attr("data-enode")) != -1 /*is a symbol*/) {
		res = $input[0].enode_getName() === $pattern[0].enode_getName();
	} else {
		res = true; //no more tests required
	}
	return res;
}


function enode_checkIfPointlessSingleNode() {
	let op = $(this).attr("data-enode");
	if (!OpIsAssociative(op)) {
		return false;
	}
	if (this.enode_getChildren().length <= 1) {
		return true;
	}
	let opP = enodeparent($(this)).attr("data-enode");
	if (opP == op) {
		return true;
	}
}

function enode_overlay(mode) {
	// aggiunge/rimuove un overlay ad un enode
	if (mode == undefined) {
		$(this).append('<div id="overlay">');
	} else {
		$("#overlay").remove();
	}
}

function enodenodesAddClass($enode, newClass, mode /* true = remove*/) {
	if (!mode) {
		$enode.each(function () {
			this.enode_getNodes().addClass(newClass);
		});
	} else {
		$enode.each(function () {
			this.enode_getNodes().removeClass(newClass);
		});
	}
}

// enodeapplyFunctToTree($('.selected'),true,ALDOtest,'a','b','c')
function enodeapplyFunctToTree(
	$Startenode,
	includeRoot,
	funct,
	parameterA,
	parameterB,
	parameterC
) {
	//given Funct($enode), it is applied to the discendants of $startNode
	let $tree = $();
	if (includeRoot) {
		$tree = $tree.add($Startenode);
	}
	$tree = $tree.add($Startenode.find("[data-enode]"));
	//$tree.each(funct(parameterA,parameterB))
	$tree.each(function (i, e) {
		funct($(e), parameterA, parameterB, parameterC);
	});
}

/*
function enodefrozenDef(Node){
	//!! to be refined 
	return $(Node).closest('[data-tag]')
}
*/

/************** enode UTILITIES  not API ***********************/
function enodeextend($startNode, applyToSubtreeAlso) {
	//add methods from object "enode"
	var $toBeExtended;
	if (!applyToSubtreeAlso) {
		$toBeExtended = $startNode.filter("[data-enode]"); //in ogni caso estendo solo i '[data-enode]'
	} else {
		$toBeExtended = $startNode
			.filter("[data-enode]")
			.add($startNode.find("[data-enode]"));
	}

	$toBeExtended.each(function (index) {
		// tutti gli HTML nodes con classe .enode
		$.extend(this, enode); //pare non si possa fare altrimenti non riesco a estendere $(this)
	});
}

function reorderTimes($startTimes, brRemove) {
	//select a times enode
	//reorderTimes($('.selected'))  
	//reorderTimes($('.selected'),true)  te remove br
	try {

		let role = $startTimes[0].enode_getRoles()[0];
		$(role).find('br').remove();
		if (brRemove) { return }
		let brExist = false;
		let numeratorFound = false;
		let childrenArr = $startTimes[0].enode_getChildren().toArray()
		/**metti i reciproci al per ultimi preceduti da br */
		for (i = 0; childrenArr[i]; i++) {
			if ($(childrenArr[i]).is('[data-enode=m_inverse]')) {
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
