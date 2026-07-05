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
 * @returns {HTMLElement|null} L'elemento HTML (DOM element) che rappresenta il nodo radice con attributo [data-enode],
 *                            o null se non trovato.
 */
function getExpressionRootNode() {
    // Trova il primo figlio con [data-enode] all'interno del contenitore principale
    return $("#canvas>.secondMember").children("[data-enode]")[0];
}

/* ---- Primitive di manipolazione strutturale ----
Ogni modifica strutturale all'espressione (inserimento, rimozione, sostituzione, spostamento di ENODE)
effettuata al di fuori di questo file deve passare da queste funzioni.
Accettano indifferentemente oggetti jQuery o elementi HTML. */

function ENODEremove(ENODEs) {
	//rimuove uno o più nodi dall'espressione
	$(ENODEs).remove();
}

function ENODEinsertBefore(ENODEs, refNode) {
	//inserisce uno o più nodi prima del nodo di riferimento
	return $(ENODEs).insertBefore(refNode);
}

function ENODEinsertAfter(ENODEs, refNode) {
	//inserisce uno o più nodi dopo il nodo di riferimento
	return $(ENODEs).insertAfter(refNode);
}

function ENODEappend(container, content) {
	//aggiunge contenuto in coda a un role/contenitore dell'espressione
	return $(container).append(content);
}

function ENODEprepend(container, content) {
	//aggiunge contenuto in testa a un role/contenitore dell'espressione
	return $(container).prepend(content);
}

function ENODEreplaceNode(replaced, replacer) {
	//sostituzione diretta senza clonazione (cfr. ENODEReplace che clona ed estende)
	return $(replaced).replaceWith(replacer);
}

function ENODEswapEqMembers($equation) {
	//scambia il contenuto di primo e secondo membro di una equazione
	const $firstMember = $equation[0].ENODE_getRoles('.firstMember');
	const $secondMember = $equation[0].ENODE_getRoles('.secondMember');
	const $firstMemberContent = $firstMember.children().remove();
	const $secondMemberContent = $secondMember.children().remove();
	$firstMember.append($secondMemberContent);
	$secondMember.append($firstMemberContent);
	return $equation;
}

function ENODEcreateSymbol(name, dataType) {
	//crea un nuovo simbolo (ci o cn a seconda del nome) con l'eventuale data-type indicato
	const $newNode = ENODEclone(prototypeSearch((isNaN(name)) ? "ci" : "cn"));
	$newNode[0].ENODE_setName(name);
	if (dataType != undefined) { $newNode.attr('data-type', dataType); }
	return $newNode;
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
	ENODE_checkIfPointlessSingleNode: ENODE_checkIfPointlessSingleNode,
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
	return $startNode.parent().closest("[data-enode]");
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
		const $children = this.ENODE_getRoles().children().filter("[data-enode]");
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
	const outType = $(startNode).attr("data-type");
	const $newDef = ENODEclone(
		// prototypeSearch('eq','bool','[data-viseq=asymmetric]');
		prototypeSearch("eq", "bool",)
	); //crea una nuova definizine
	//*********************** definendum **********************
	//attuale)al momento vengono inseriti n ruoli singoli quanti sono i parametri
	//rimane da fare todo!!: separare con , 
	//alternativa)in altermnativa si potrebbe una lista ordinata, ma si dovrebbe introdurre un modo
	//per specificare separatamente il datatype di ogni elemento della lista (cluster)
	const $definendum = ENODEclone(prototypeSearch(""));//search for generic prototype
	$definendum.attr("data-type", outType);
	const m1 = $newDef.find(".firstMember"); //trova primo membro
	const newName = prompt("Enter a name for the new definition");
	if (newName == null) { return }//prompt cancelled
	if (!newName) { return }//empty name
	$definendum.attr("data-enode", newName);
	$definendum.find(".name").append(newName);
	m1.append($definendum); //aggiungi contenuto al primo membro ed inseriscilo
	//*********************** definens **********************
	const $definens = ENODEclone($(startNode));
	//$definens.find("#MyOverlay").remove()//togli l'overlay colorato dal clone
	const m2 = $newDef.find(".secondMember"); //trova secondo membro todo
	m2.append($definens); //aggiungi contenuto al secondo membro
	const $parList = $definens.find(".unselected");
	$("#canvasRole").append($newDef);
	if ($parList.length > 0) {
		let paramDefNames = ["x", "y", "z", "t", "k", "p", "q", "a", "b", "c", "d", "e", "f", "g", "h", "i", "l", "m", "n", "o", "q", "r", "s", "u", "v", "z",];
		const $newforAll = ENODEclone(prototypeSearch("forall")); //clona for each
		ENODEextend($newforAll);
		$newDef.replaceWith($newforAll); //todo:scegliere dove deve essere visibile la nuova definizione
		GetforAllContentRole($newforAll).append($newDef);
		//***create arguments container in definendum, that's a way to show brackets
		//discarded alternative: ahow brackets on the first and last roles:
		// would not adapt to the bigger role in th elist
		const $rolescontainer = $('<div class="rolescontainer" ></div>');
		$definendum.append($rolescontainer);
		//*** add each parameter
		$parList.each(function (i, val) {
			const node = this;
			const thisType = $(node).attr("data-type");
			const $newNode = ENODEclone(prototypeSearch("ci")).attr(
				"data-type",
				thisType
			); //data() e' un casino
			$newNode[0].ENODE_setName(paramDefNames[i]);
			$(this).replaceWith($newNode);
			const $Clone1 = ENODEclone($newNode); //clone da inserire in definendum
			const $Clone2 = ENODEclone($newNode); //clone da inserire in forAll header
			const $newRole = $('<div class="s_role" ></div>');
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
	const $clone = ENODEclone($replacer);
	ENODEextend($clone); //mi serve subito che sia esteso, gli eventi sono attivati in seguito
	//sostituisci
	const mark = ENODESmarkUnmark($replaced);
	if (mark !== undefined) {
		ENODESmarkUnmark($clone, mark); //$replaced---->$replacer sostituisci ma conserva il titolo se presente
	}
	$replaced.replaceWith($clone);
	$clone.css({ display: "" });
	ExtendAndInitializeTree($clone);
}



function ENODEReplaceLink($replaced, $link) {
	//get the other member of the link, futuribile: uguaglianza tra molti membri, necessario sistema per scegliere tra membri
	let $replacer;
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
	const opposite = $link.hasClass("minus") !== $replaced.hasClass("minus");
	if (opposite) {
		$replacer.toggleClass("minus");
	}
	const inverse = $link.hasClass("inverse") !== $replaced.hasClass("inverse");
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
	let spaceForDeduction;
	if (ENODEparent($hypothesis).attr("data-enode") === "and") {
		//parent external to enclosure is 'and'?
		spaceForDeduction = $hypothesis.parent();
	} else {
		// create an 'and'
		const newAnd = ENODEclone(prototypeSearch("and"));
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
	const $replaced = $(replaced);
	const $replacer = $(replacer);
	$startNode = $($startNode); //se per caso passo uno start node non $
	const $occurrences = $findOccurrences($replaced, $startNode)
	const result = $.each($occurrences, function (i, o) {
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
	const $f = $parameter.parent().closest('[data-enode="forAll"]'); //
	const $h = GetforAllHeader($f);// get header
	const $c = GetforAllContentRole($f);
	let $root = $f; //l'elemento più esterno Root può cambiare
	//************stabilisci se c'è conflitto con i nomi delle Bvar******
	//il nome della variabile specificata nel forThis è per caso già presente tra i parametri del forall?
	if ($newVal.length != 0) {
		const newValName = $newVal[0].ENODE_getName();
		const $toBeRenamed = $h.children().filter(function () {
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
		const $content = $c.children();
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
	const oldName = $toBeRenamed[0].ENODE_getName();
	const newName = "(" + oldName + ")";
	//cerca le occorrenze e marca ciascuna occorrenza
	const $occurrences = $findOccurrences($toBeRenamed, $forall);
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
	const $subnodes = $(this)
		.find("*")
		.not(".gettingNodes [data-enode], .gettingNodes [data-enode] *"); //subnodes in this ENODE
	let $Nodes = $(this).add($subnodes); // root node + subnodes
	if (selector != undefined) {
		// se viene passato un "selector", filtra i Nodes
		$Nodes = $Nodes.filter(selector);
	}
	$(this).removeClass("gettingNodes");
	return $Nodes;
}

function ENODE_getRoles(selector) {
	let $roles = this.ENODE_getNodes(selector).filter('[class*="_role"]');
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
	let $children = this.ENODE_getRoles().children("[data-enode]");
	if (selector != undefined) {
		// se viene passato un "selector", filtra
		$children = $children.filter(selector);
	}
	return $children;
}

function ENODE_getName(considerSuffix) {
	const nameWithSuffix = $(this).find(">.name").text();
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
	let $newNode;
	if (content == undefined) { content = '' }//default content = ''
	if (roleClass == undefined) { roleClass = 'ol_role' }//default ol_role ok for function calls
	$newNode = $('<div class="role">' + content + "</div>").attr(
		"data-type", dataType); //data() e' un casino
	$newNode.addClass(roleClass);
	$(this).append($newNode);
	return $newNode;
} //da usare quando si crea una nuova funzione o definizione

function validTargetsFromOpened($ENODEdragged) {

	const valids = $('#canvasRole, #canvasRole [class*="_role"]:visible').filter(function(i,e){
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
		ENODEparent($(this)).attr('data-enode')=='and' &&
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
	else if(ENODEparent($role).attr('data-enode')=='and' &&
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
	const numOfPlaces = getNumOfPlaces($role)[1];
	const numOfChildren = $role.children().filter("[data-enode]").length
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

const symbols = ["ci", "cn", "csymbol"];
function prototypeSearch(className, dataType, selector, name) {
	//alcune classi, ad esempio "ci", possono avere vari datatype
	//get all prototypes  (futuribile: preindex prototypes)
	let $prototypes = $("#palette").find("[data-enode][data-proto]");
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
	const type = dataType; //per poter usare questo valore nell 'each'

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
		$prototype.attr("data-enode", className);
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
	if (ENODEparent($ENODEelement).attr("data-enode") === op) {
		//no need to cteate external op
		return ENODEparent($ENODEelement);
	} else {
		return wrapWithOperation($ENODEelement, op);
	}
}

function wrapWithOperation($ENODEelement, op){
	//create external operation to $ENODEelement, $ENODEelement is 1 element or a list of adjacent elements
	let $prototype;
	let roleSelector = undefined //the wrapping operation may have more roles a selector may be needed  
	if (op=="def"){
		$prototype = prototypeSearch("eq","bool","[data-viseq=asymmetric]");//special case for definition
		roleSelector = ".secondMember"; //the expression must be insertend in the definendum witch is the second member
	}
	else{
		$prototype = prototypeSearch(op);
	}
	const $clone = ENODEclone($prototype);
	//ENODEparent($ENODEelement).replaceWith($clone);//replace provoca la distruzione degli eventi nel replaced
	$clone.insertBefore($ENODEelement.eq(0));
	$ENODEelement.appendTo($clone[0].ENODE_getRoles(roleSelector));
	return $clone;
}

function wrapWithDefIfNeededreturnTarget($targetNode,$toBeInserted,unlocked){
	
	//if(  $targetNode.is('#canvasRole') && (ENODEclosedDef( $targetNode )  || $toBeInserted.attr("data-type") !== "bool") ){
	if(  canDraggedBeDroopedInRoleYesWrapNo($toBeInserted,$targetNode)=='needsWrap' ) {
		const $newDef = wrapWithOperation($toBeInserted, "def");
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
	let allCnOk = true;
	for (let i = 0, len = $s.length; i < len; i++) {
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
	let allSiblingsOk = true;
	const $parent = ENODEparent($($s[0])); //to check if nodes are siblings
	for (let i = 0, len = $s.length; i < len; i++) {
		if (!ENODEparent($($s[i])).is($parent)) {
			allSiblingsOk = false;
			break;
		}
	}
	return allSiblingsOk;
}

function addTypeDecorations($ENODE) {
	//get the "type" of the prototype and complete it with decoration
	const dataType = $ENODE.attr("data-type");
	let b = $ENODE;
	if (dataType === "num" && b.find(".leftDecoration").length == 0) {
		//is decoration present already?
		b.append($('<div class="leftDecoration"></div>'));
	}
	if (
		(dataType === "num" || dataType === "bool") &&
		b.find(".topDecoration").length == 0
	) {
		const b = $ENODE;
		b.append($('<div class="topDecoration"></div>'));
	}
}

function ENODErenamePrompt($ENODE) {
	//
	let oldName = $ENODE[0].ENODE_getName();
	if ($ENODE.hasClass("minus")) {
		oldName = "-" + oldName;
	}
	if ($ENODE.hasClass("inverse")) {
		oldName = "/" + oldName;
	}
	let newName = prompt(
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
		$ENODE.attr("data-enode", isNaN(newName) ? "ci" : "cn"); // se numero allora classe "cn"
		ssnapshot.take();
	}
}

function createForThis($forall, $placeHolder) {
	//Modus Ponens deduce a special case from a forall
	const $clone = ENODEclone($forall);
	exclusiveFocus = $clone.addClass("exclusiveFocus"); //metti il clone in stato exclusiveFocus
	//****inserit the new proposition*****
	if (ENODEparent($forall).attr("data-enode") == "and") {
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
	const op = $currENODE.attr("data-enode");
	if (op === "minus" || op === "m_inverse") {
		//------------------> recursive
		const newRes = ENODEsToVal($currENODE[0].ENODE_getChildren(), res);
		//<------------------
		if (op === "minus") {
			res.sign = newRes.sign * -1;
		} else {
			res.exp = newRes.exp * -1;
		}
	} else if (op === "power") {
		let $exponent = $currENODE[0].ENODE_getChildren(':last');//:first child is exponent\
		if ($exponent.attr("data-enode") == "cn") {
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
	const className = $ENODE.attr("data-enode");
	return symbols.indexOf(className) != -1; //is it a symbol?(ci,cs,csymbol)
}

function ValToENODEs(partial) {
	let $newENODE;
	let $clone;
	let $target;
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
	$clone.attr("data-enode", partial.type); //uso un generico prototipo num e qui specifico se cn o ci
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
		return $startENODE.prevAll("[data-enode]:first");
	} else {
		return $startENODE.nextAll("[data-enode]:first");
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
	if (!$ENODE.is('[data-enode=times]')) { return }//procedi solo se è un ENODE di tipo times
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
	let $ENODEs; //lista degli ENODEs "da trattare"
	if (tree != false) {
		$ENODEs = $startNode.add($startNode.find("[data-enode]"));
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
	let labelString;
	let mark = $ENODE.attr("title");
	if (mark == undefined) {
		mark = "";
	}
	let path = $ENODE.attr("data-path");
	if (!showPath || path == undefined) {
		path = "";
	} //se non è da visualizzare, oppure è indefinito
	if ($ENODE.find(".label").length == 0) {
		$ENODE.append('<div class="label"></div>');
	}
	$ENODE.find(".label").text(mark + "_" + path);
}
function showAllMarks(showPath) {
	$("body [data-enode]:visible").each(function (i, element) {
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
	let res;
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
		$input.attr("data-enode") !== $pattern.attr("data-enode") /*notSameClass*/
	) {
		return false;
	} else if (symbols.indexOf($input.attr("data-enode")) != -1 /*is a symbol*/) {
		res = $input[0].ENODE_getName() === $pattern[0].ENODE_getName();
	} else {
		res = true; //no more tests required
	}
	return res;
}


function ENODE_checkIfPointlessSingleNode() {
	let op = $(this).attr("data-enode");
	if (!OpIsAssociative(op)) {
		return false;
	}
	if (this.ENODE_getChildren().length <= 1) {
		return true;
	}
	let opP = ENODEparent($(this)).attr("data-enode");
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
		return startElement.closest('[data-enode]:not(.unselectable):not(.glued)');
	} else {
		return startElement.closest('[data-enode]');
	}
}

function ENODERefreshAsymmEq($ENODE) {
	// adegua l'icona del lucchetto allo stato unlocked/non unlocked
	const $firstMember = $ENODE.find('>.firstMember')
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
	$tree = $tree.add($StartENODE.find("[data-enode]"));
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
	let $toBeExtended;
	if (!applyToSubtreeAlso) {
		$toBeExtended = $startNode.filter("[data-enode]"); //in ogni caso estendo solo i '[data-enode]'
	} else {
		$toBeExtended = $startNode
			.filter("[data-enode]")
			.add($startNode.find("[data-enode]"));
	}

	$toBeExtended.each(function (index) {
		// tutti gli HTML nodes con attributo data-enode
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

function getDefaultTool(){
	let $defaultTool = $('[data-defaultprop]').first();
	if($defaultTool.length==0){//se non si trova un elemnto esplicitamente marcato come default
		$defaultTool = $('[data-tag]').first()//utilizza il primo dei tool;
	}
	return $defaultTool;
}

/************** Estensione e inizializzazione degli alberi ENODE (da MAIN.js) ***********************/

function ExtendAndInitializeTree($startElement) {
	ENODEapplyFunctToTree($startElement, true, ExtendAndInitialize)
}

function ExtendAndInitialize($ENODE) {
	ENODEextend($ENODE, true)
	//initialize lock icon
	if ($ENODE.is('[data-enode]') && isDefinition($ENODE[0])) {
		ENODERefreshAsymmEq($ENODE)
	}
}

/************** Creazione di ENODE a partire da stringhe (da AldoUtilities.js) ***********************/

function dummyParser(string){
	let op 
	let splitted
	let splittedgeq = string.split('>=')
	let splittedgt = string.split('>')
	let splittedeq = string.split('=')
	if(splittedgeq.length==2){splitted=splittedgeq; op='geq'}
	else if(splittedgt.length==2){splitted=splittedgt; op='gt'}
	else if(splittedeq.length==2){splitted=splittedeq; op='eq'}
	if(op){
		let $operation = ENODEclone( prototypeSearch(op) )
		let first = identifierToENODE(splitted[0]);
		let second = identifierToENODE(splitted[1]);
		$operation[0].ENODE_getRoles('.firstMember').append(first)
		$operation[0].ENODE_getRoles('.secondMember').append(second)
		return $operation
	}
}

function identifierToENODE(string){
	let num = parseInt(string)
	let ENODEType 
	if(isNaN(parseInt(string))){
		ENODEType = 'ci'
	}
	else{
		ENODEType = 'cn'
	}
	$clone = ENODEclone( prototypeSearch("cn","num") )
	$clone[0].ENODE_setName(string);
	$clone.attr('data-enode', ENODEType);//uso un generico prototipo num e qui specifico se cn o ci
	return	$clone
}

/************** Marcature degli ENODE e posizionamento assoluto (da PMTutilities.js) ***********************/

function moveOrClearMarksInTree($startENODE,clear){//copy marks from persistent "data-mark" to volatile mark 
	$subtree = $startENODE.add( $startENODE.find('[data-enode]') )
	$subtree.each(function(index) {
		if(clear){//clearVolatile
			$(this).removeAttr('mark')
		}
		else{//moveFromPersistentToVolatile 
			var value = $(this).attr('title');
			$(this).attr('mark',value);
			$(this).removeAttr('title')
		}
	})
}

function ENODESmarkUnmark($ENODE,value,attrName,usePermanentMark){
//la funzione scrive o legge marcature ENODEs in modo permanente: le marcature passano nel file mml. 
//attrname può assumere i valori m,l,p corrispondenti al formato della stringa mark-link-post
//mark: marcature che devono apparire anche nell'input perchè ci sia un match
//Attenzione: le marcature sono intese come singoli caratteri
//ad esempio "s" per selected o "d" per dragged.
//Un marcatura "sp" va intesa come marcato "s" e marcato "p"
//link:per associare ENODEs in pattern e transform
//post: c=semplifica n=nonRiordinare
	let markAttName ='mark'
	if(usePermanentMark)(markAttName='title')
	var mark = $ENODE.attr(markAttName);
	if ( mark == undefined ){mark=""}
	var markArray = mark.split("-")
	//********************mode: READ*************************
	if(value == undefined){
		if(attrName=="all"){
			return mark 
		}
		else if(attrName=="p"){
			if(markArray[2]){ return markArray[2]}
			else{return""}
		}
		else if(attrName=="l"){
			if(markArray[1]){ return markArray[1]}
			else{return""}
		}
		else{
			return markArray[0] //non e' mai undefined
		}
	}
	//********************mode: WRITE**************************
	// ENODESmarkUnmark($ENODE,"","all"); cancella tutte le marcature
	if( attrName=="all" ){//scrivi tutto in una volta
		$ENODE.attr(markAttName,value);
		return value
	}
	else if( attrName=="p"){
		markArray[2] = value
	}
	else if( attrName=="l"){
		markArray[1] = value
	}
	else if( attrName=="undefined" ||attrName=="m"){//per mantenere compatibilita con vechie chiamate
		markArray[0] = value
	}
	else{
		markArray = [value]
	}
	var str=""
	str=markArray[0]
	i=1
	while( i< markArray.length ){
		if(markArray[i]){
			str= str + "-" + markArray[i]
		}
		else{
			str= str + "-"
		}
		i++
	}
	if(str){$ENODE.attr(markAttName,str);}
	else{$ENODE.removeAttr(markAttName)}
	return str
}

function ENODEappendInABSPosition($ENODE,$refENODE,relativePosition){
//posiziona in modo assoluto $ENODE vicino a un ENODE di riferimento $refENODE
//Se si tratta di forall piazzare il pattern circondato dal suo forall.
	$('#divOverlay').append($ENODE);
    $ENODE.css('position', 'absolute');
	if($refENODE.is('#canvasAnd')){
		//put it on the right
		$ENODE.css('right', 200);
    	$ENODE.css('top', 100);	
	}
    else if(relativePosition=="beside"){
	//Se è il clone di un clone fallo comparire sovrapposto al "clonato" solo spostato di qualche pixel.
		$ENODE.css('left', $refENODE.offset().left + $refENODE.width() + 12);
    	$ENODE.css('top', $refENODE.offset().top - 75);
    }
    else{//superposed
    	$ENODE.css('left', $refENODE.offset().left + 4);
    	$ENODE.css('top', $refENODE.offset().top + 4);	
    }
} 

/************** Refresh infix e ruoli vuoti (da infix.js) ***********************/

function refreshInfix($startNode,rootAndSubTree){//todo:obsoleta, sostituita con generalrefresh()
	//if($startNode.length != 0){
		refreshOneInfix($startNode)
		if(rootAndSubTree){
			$startNode.find('[data-enode]').each(function(i,element){refreshOneInfix($(element))})
		}
	//}

}

function refreshOneInfix($ENODEnode){
	if($ENODEnode[0].ENODE_getRoles === undefined){return}// invalid parameter
	var $role=$ENODEnode[0].ENODE_getRoles();
	var $ENODEchildren = $role.children().filter('[data-enode]');
	var $InfixChildren = $role.children().filter('.infix:not(.proto)');
	var $infixProto = $role.find('>.infix.proto');
	//procedura "cambia solo il necessario"
	//per ogni elemento "infix: se non sei preceduto e seguito da ENODE remove!
	$InfixChildren.each(function(i,e){
		if( !($(e).prev().is('[data-enode]') && $(e).next().is('[data-enode]'))  ){
			//console.log(i);
			$(e).remove();
		}
	})
	//per ogni elemento ENODE tranne il primo: se non sei preceduto da infix, aggiungine uno
	$ENODEchildren.each(function(i,e){
		if(i>0){
			if(!$(e).prev().is('.infix:not(.proto)')){
				//console.log(i);
				//$('<div class="infix">*</div>').insertBefore($(e))
				$infixProto.clone().removeClass('proto').insertBefore($(e))
			}
		}
	})
}


function refreshOneEmpty($ENODE){
	if($ENODE[0].ENODE_getRoles==undefined){return};
	$ENODE[0].ENODE_getRoles().each(function(i,e){
		let childrenNum = $(e).children().filter('[data-enode],.dummyrole').length
		let minPlaces=getNumOfPlaces($(this))[0]
		if(minPlaces>1){//manage dummies to ensure minimum places
			let deltaDummies = minPlaces- childrenNum
			if(deltaDummies>0){
			//add dummies
				for (var i = 0; i<deltaDummies; i++){
					$(this).append($('<div class="dummyrole"></div>'))
				}
			}
			else if(deltaDummies<0){
				//remove dummies
				for (var i = 0; i<-deltaDummies; i++){
					$(this).find('.dummyrole:first').remove()
				}
			}
		}
		else{//manage "empty" class
			if( minPlaces==0 && childrenNum == 0 ){$(e).addClass('empty')}
	    	else{ $(e).removeClass('empty')}
		}
	})
}

/************** Gestione dei segni e degli elementi "glued" (da TranslateFormat.js) ***********************/

function ENODEfactorizeMinus($startNode) {
	//translate from (-(a)) to (-1)(a)
	//**** condizioni necessarie per applicare la funzione *****
	if ($startNode.attr("data-enode") !== "minus") {
		return
	}
	//è circondato un meno?
	$extOp = wrapIfNeeded($startNode, "times");
	//se necessario crea una operazione container
	//aggiungi un fattore "-1"
	const prototype = prototypeSearch("ci", "num");
	const prototypeMinus = prototypeSearch("minus");
	const $clone = ENODEclone(prototype);
	const $cloneMinus = ENODEclone(prototypeMinus);
	$clone.attr('data-enode', 'cn');
	$clone[0].ENODE_setName("1");
	$cloneMinus.insertAfter($startNode);
	$cloneMinus[0].ENODE_getRoles().append($clone);
	$startNode[0].ENODE_dissolveContainer()
	//remove minus from $startNode  
	refreshInfix($extOp);
	RefreshEmptyInfixBraketsGlued($('body'));
	ssnapshot.take();
}

function signsAsClassesSubtree($startNode, mode) {
	//trova tutti i sotto nodi
	$startNode.find('[data-enode]').each(function(index) {
		// tutti gli HTML nodes con attributo data-enode
		signsAsClasses($(this), mode);
	})
}

function signsAsClasses($ENODE, mode /* SignsInNames_to_SignsAsClasses SignsAsClasses_to_SignsInNames SignsAsClasses_to_MinusOp MinusOp_to_SignsAsClasses*/
) {
	// <>-a<> to <class="minus">a<>
	// nota: non possono coesistere segni meno all'interno del nome e "minus" come classi
	let name = $ENODE[0].ENODE_getName()
	if (mode == "SignsInNames_to_SignsAsClasses") {
		if (name[0] === "/") {
			name = name.substr(1)
			//nome privato del segno meno
			$ENODE.addClass('inverse')
		}// attenzione: / va inserito prima del meno
		else {
			$ENODE.removeClass('inverse')
		}
		if (name[0] === "-") {
			name = name.substr(1)
			//nome privato del segno meno
			$ENODE.addClass('minus')
		}//todo: cosa succede se input = ---2  ?
		else {
			$ENODE.removeClass('minus')
		}

	} else if (mode == "SignsAsClasses_to_SignsInNames") {
		if ($ENODE.hasClass('minus')) {
			name = "-" + name;
			$ENODE.removeClass('minus');
		}
		if ($ENODE.hasClass('inverse')) {
			name = "/" + name;
			$ENODE.removeClass('inverse');
		}
	}
	else if (mode == "SignsAsClasses_to_MinusOp") {
		if ($ENODE.hasClass('minus')) {
			$ENODE.removeClass('minus');
			wrapWithOperation($ENODE, "minus")
		}
	} else if (mode == "MinusOp_to_SignsAsClasses") {
		const $ENODEchildren = $ENODE[0].ENODE_getRoles().children().filter('[data-enode]')
		if ($ENODE.attr('data-enode') === "minus" && $ENODEchildren.length == 1) {
			// i minus che hanno un solo children
			$ENODE[0].ENODE_dissolveContainer();
			$ENODEchildren.filter(':first').addClass('minus');
		}
	}

	$ENODE[0].ENODE_setName(name);
	$ENODE.attr("data-enode", (isNaN(name)) ? "ci" : "cn")
	// se numero allora classe "cn"
}

/**
 * Array di funzioni che richiedono l'effetto "glued" sui loro elementi figli
 * Include operatori come minus, m_inverse, not
 */
const glueFunctions = ["minus", "m_inverse", "not"];

/**
 * Aggiorna gli elementi che devono essere "incollati" (glued) nel DOM
 * @param {jQuery|undefined} $startNode - Nodo di partenza opzionale
 */
function refreshGlued($startNode) {
    // Determina il nodo contenitore da cui iniziare la ricerca
    const $containerNode = $startNode ? ENODEparent($startNode) : $("#canvasRole");
    
    // Rimuove la classe "glued" da tutti gli elementi precedentemente marcati
    $containerNode.find(".glued").removeClass("glued");
    
    // Trova tutti gli elementi con attributo data-enode che corrispondono ai criteri
    const $stickyParents = $containerNode.parent().find("[data-enode]").filter(function(i, element) {
        const operatorType = element.getAttribute("data-enode");
        
        // Verifica se l'operatore è nella lista delle funzioni "glued"
        if (glueFunctions.indexOf(operatorType) !== -1) {
            return true;
        } 
        // Verifica se è una definizione
        /*
		else if (operatorType === 'eq' && isDefinition(element)) {
            return true;
        }
		*/
        return false;
    });
    
    // Applica la classe "glued" ai figli degli elementi trovati
    $stickyParents.each(function() {
        const $toBeGlued = this.ENODE_getRoles().children().filter('[data-enode]');
        $toBeGlued.addClass('glued');
    });
}

/************** Serializzazione/deserializzazione MathML <-> ENODE (da inflatedeflate.js) ***********************/

var leafTags = ["cn", "ci", "csymbol"];


function ENODEcreateMathmlString($startNodes,describeDataType, neglectRootSign) {
	//per poter chiamare sia come funzione che come metodo
	if ($startNodes == undefined) {
		$startNodes = $(this);
	}
	var from_to
	if (describeDataType) {
		from_to = "aab_mmlWithType"
	} else {
		from_to = "aab_mml"
	}
	var $convertedTree = createConvertedTree($startNodes, from_to, neglectRootSign);
	let returnString = ""
	if($convertedTree.length!=0){
		//returnString = $.trim($convertedTree.parent().html())
		returnString = formatXml($convertedTree.parent().html())
	}
	//return $.trim($convertedTree.parent().html())
	return returnString

}

function createConvertedTree(startNodeOrMML, from_to, neglectRootSign,toBeImported) {
	var $containerForClone = $('<div></div>')
	//$('#canvasRole').html("") ;var $containerForClone = $('#canvasRole');// debug
	//var $thisClone = $($.parseXML(startNode).firstElementChild)
	let $startNodeOrMML = $(startNodeOrMML)// problema con file misti mml con html vedi Quaderno Aprile Giugno Agosto settembre ottobre 2022
	//let $startNodeOrMML=$($.parseXML(startNodeOrMML)).children(':first')
	//try to rebuild the here??
	if (from_to === "aab_mml" || from_to === "aab_mmlWithType") {
		let $thisClone = $startNodeOrMML.clone()
		$containerForClone.append($thisClone)
		//deflate todo: completare distinzione tra mml e mml + type

		//estendi tutti i nodi ENODE
		$thisClone.parent().find('[data-enode]').each(function(i, node) {
			$.extend(node, ENODE)
		})
		//rimuovi il contenuto importato da altri files
		$thisClone.parent().find('[data-import]').each(function(i, node){node.ENODE_getChildren().remove()});
	

		//signsAsClassesSubtree($thisClone,"SignsAsClasses_to_MinusOp")// converti in modo che il segno meno sia una operazione applicata al nodo
		//sostituisci tutti i nodi ENODE excluding prototypes
		$thisClone.parent().find('[data-enode]').not('[data-proto]').not('.saveAsHtml').each(function(i, node) {
			if (i == 0) {
				ReplaceOneENODE(node, from_to, neglectRootSign);
			} else {
				ReplaceOneENODE(node, from_to, false);
				//never neglect sign if not root 
			}
		})
	} else if (from_to === "mml_aab") {
		//filtra solo le tag da importare
		let $mmlTagSubset
		if(toBeImported){
			$mmlTagSubset = $startNodeOrMML.find('[data-tag=' + toBeImported + ']')
		}
		else{//if no item is specified import all
			$mmlTagSubset = $startNodeOrMML
			//wrap
		}
		$containerForClone.append($mmlTagSubset)
		//inflate
		//ottieni l'elenco dei nodi' da sostituire
		$mmlTagSubset.parent().find('apply,cn,ci,bind,math').each(function(i, node) {
			//console.log(node);
			ReplaceOneENODE(node, from_to);
		})
		//signsAsClasses($containerForClone.children(),"MinusOp_to_SignsAsClasses"); // converti root node
		//signsAsClassesSubtree($containerForClone.children(),"MinusOp_to_SignsAsClasses");	// converti il resto dell'albero'	
	}
	return $containerForClone.children()
}

function ReplaceOneENODE(node, from_to, neglectSign) {
	//node is HTML node
	let $node = $(node);
	var $newNode
	var originalData
	var title
	if (from_to === "aab_mml" || from_to === "aab_mmlWithType") {
		//get all data attributes
		originalData = $node.data()
		title = $node.attr('title')
		
		if( $node.attr('data-tag') ) {
			if($node[0].style.backgroundImage){ 
				originalData.tagimg = wrapUnwrapUrlString( $node[0].style.backgroundImage , true );
			}
		}
		if (!neglectSign) {//signsAsClasses($node,"SignsAsClasses_to_MinusOp") // converti   	
		}
		var nodeText = ""
		if (leafTags.indexOf(originalData.enode.toLowerCase()) !== -1) {
			//if [cn;ci;csymbol] then the content is the text, else some role must be present
			nodeText = node.ENODE_getName(true);
			$newNode = $('<' + originalData.enode.toLowerCase() + '/>');
			$newNode.text(nodeText)
		} else {
			/*
			var $role= node.ENODE_getRoles();
			var $bVarChildren=$role.filter('.bVar_role').children().filter('[data-enode]')// se un role è di tipo bvar, viene elencato per primo, e va trattato in modo speciale
			var $nobBvarchildren=$role.not('.bVar_role').children().filter('[data-enode]')
			*/
			var $bVarChildren = node.ENODE_getRoles('.bVar_role').children().filter('[data-enode]')
			// se un role è di tipo bvar, viene elencato per primo, e va trattato in modo speciale
			var $nobBvarchildren = node.ENODE_getRoles(':not(.bVar_role)').children().filter('[data-enode]')
			var $htmlDivChildren = node.ENODE_getRoles(':not(.bVar_role)').children().filter(':not([data-enode])').filter('.saveAsHtml')
			//salvo ciò che è .saveAsHtmlL
			$newNode = $('<apply></apply>')
			$newNode.text(nodeText)
			$newNode.append('<' + originalData.enode + '/>')
			$newNode.append($bVarChildren.wrap('<bvar>').parent());
			$newNode.append($nobBvarchildren);
			$newNode.append($htmlDivChildren);
		}
		//if(title != undefined){	$newNode.attr('title',title)}//se presente salva anche il titolo
		if (title) {//se presente e diverso da "" salva anche il titolo
			$newNode.attr('title', title)
		}
		// from MathML 3.0 specifications: The type attribute can be interpreted to provide rendering information.
		let newData = originalData
		delete newData.ENODE//data-enode is manged above
		writeData($newNode,newData)

		
	} else if (from_to === "mml_aab") {
		//inflate: =first child tag; if tag==csymbol or ci or cn allora considera il contenuto
		originalData = $node.data();
		title = $node.attr('title');
		
		var nodeText = $node.clone()//clone the element
		.children()//select all the children
		.remove()//remove all the children
		.end()//again go back to selected element
		.text();
		var ENODE;
		//string
		if (node.tagName.toLowerCase() === "apply" || node.tagName === "bind") {
			ENODE = $node.children().filter(':first')[0].tagName.toLowerCase()
		} else {
			////todo!!! devo distinguere e trattare diversamente saveAsHtml 
			ENODE = node.tagName.toLowerCase()
		}
		if (ENODE === "math") {
			$newNode = $node.children()
			//unwrap "math"
		} else {
			var $children = $node.children().not(':first')
			//search for prototype
			//console.log(ENODE)
			let dataType= $node.attr("type");//for compatibility with older format
			if(!dataType){dataType=$node.attr("data-type")};
			var $prototype = prototypeSearch(ENODE, dataType,undefined,nodeText)
			if($prototype.length==0){console.log('prototype not found prototypeSearch()');console.log([ENODE, $node.attr("type"),undefined,nodeText])}
			$newNode = ENODEclone($prototype)
			ENODEextend($newNode)
			// extend the new node
			if (leafTags.indexOf(ENODE.toLowerCase()) !== -1) {
				//todo: eccezione if leafTag with children
				try {
					$newNode[0].ENODE_setName($node.text());
				} catch (err) {
					console.log('error on prototype '+ENODE+" "+ $node.attr("type"))
				}
				//signsAsClasses($newNode,"SignsInNames_to_SignsAsClasses"); //convert to_signs_as_classes 
			} else {
				//append children in roles
				var $tgtRoles = $newNode[0].ENODE_getRoles();
				if($tgtRoles.length==0){
					$newNode[0].ENODE_addRole();
					$tgtRoles = $newNode[0].ENODE_getRoles();
				}
				var $bVarRole = $tgtRoles.filter('.bVar_role');
				var $noBVarRole = $tgtRoles.not('.bVar_role');
				$newNode.prepend(nodeText);
				if ($bVarRole.length > 0) {
					$children.filter('bvar').each(function(i, e) {
						$(e).children().appendTo($bVarRole)
					})
				}
				noBVarChildren = $children.not('bvar')
				// globale per renderlo disponibile in each
				$noBVarRole.each(function(i, e) {
					var places = getNumOfPlaces($(e))[1]
					if (places === -1) {
						places = undefined
					}
					// splice(x,undefined) means splice until the end
					var toBeAppended = noBVarChildren.not('[processed]').slice(0, places);
					//splice appears to behave not as expected
					//noBVarChildren.slice(0,places).attr("processed","")
					toBeAppended.attr("processed", "")
					$(e).append(toBeAppended);
				})
				noBVarChildren.removeAttr('processed')
			}
		}
		newData=originalData;
		//data.ENODE=xxx is already cloned from prototype
		if (newData.tag !== undefined) {
			if(originalData.tagimg){
				$newNode.css('background-image',wrapUnwrapUrlString(originalData.tagimg))	
			}
		}
		writeData($newNode,newData)
		// from MathML 3.0 specifications: The type attribute can be interpreted to provide rendering information.
		if (title !== undefined) {
			$newNode.attr('title', title)
			//
		}
	}
	$node.replaceWith($newNode)
}


function $parserForMixedMMLHTML(toBeParsed){
	// $(string) gives strange results when div or img are present
	//$parserForMixedMMLHTML('<math xmlns="http://www.w3.org/1998/Math/MathML"><apply data-type="num"><plus></plus><cn data-type="num">2</cn><div data-enode="times" data-type="num" class="ENODE saveAsHtml" draggable="false" style="background-color: red;"><div class="ul_role" data-type="num"><cn data-type="num">6</cn><cn data-type="num">2</cn></div></div><apply data-type="num"><minus></minus><cn data-type="num">1</cn></apply></apply></math>')
	let string
	if (toBeParsed instanceof jQuery){string=toBeParsed[0].outerHTML}
	else{string = toBeParsed};
	let stringDix = string.replace(/<div>/g, "<dix>").replace(/<div /g, "<dix ").replace(/div>/g, "dix>");
	let $workTree = $(stringDix);
	//$('#canvasRole').append($workTree)// debug
	//replace one <dix> node with <div> 
	let len = $workTree.find('dix').length
	for(i=0;i<len;i++){
		let $dix = $workTree.find('dix:first');
		if($dix.length == 0){break}
		let $children = $dix.children();
		$children.remove();
		let outer = $dix[0].outerHTML.replace(/<dix>/g, "<div>").replace(/<dix /g, "<div ").replace(/dix>/g, "div>");;
		let $outer = $(outer);
		$dix.replaceWith($outer);
		$outer.append($children);
	}
	return $workTree
}
