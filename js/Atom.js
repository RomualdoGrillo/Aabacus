// atoms.js dovrebbe costituire lo strato di comunicazione tra
//l'albero degli MNODES ed il resto del software

/*
Nota: non sempre � comodo usare MNODEobject.MNODEmethod()
Il risultato di un select $('selector'), � un oggetto jQuery contenente n altri oggetti. Quindi non si pu� chiamare $('selector').MNODEmethod
Si pu� chiamare in uno dei modi seguenti:  
1)  $('selector')[0].MNODEmethod
	$('selector').each(function(index) {this.MNODEmethod})
2) oppure chiamare la funzione corrispondente al metodo, per come � costruito atom MNODEmethod(MNODEobject)
*/

/*
Nota:
MNODEnomefunzione possono essere usati sia come metodi che come funzioni
MNODE_nomemetodo possono essere chiamati solo come metodi
ad esempio MNODEparent può essere invocato come metodo di un MNODE oppure come
funzione su un qualsiasi elemento html anche se non è un MNODE 
*/
atom = {
  MNODEparent: MNODEparent,
  MNODEcleanIfPointless: MNODEcleanIfPointless,
  MNODEclosedDef: MNODEclosedDef,
  MNODECreateDefinition: MNODECreateDefinition,
  MNODE_replaceWith: MNODE_replaceWith,
  MNODE_getNodes: MNODE_getNodes,
  MNODE_getRoles: MNODE_getRoles,
  MNODE_getChildren: MNODE_getChildren,
  MNODE_getName: MNODE_getName,
  MNODE_setName: MNODE_setName,
  MNODE_createMathmlString: MNODE_createMathmlString,
  MNODE_addRole: MNODE_addRole,
  MNODE_checkIfPointlessSingleNode: MNODE_checkIfPointlessSingleNode,
  MNODE_dissolveContainer: MNODE_dissolveContainer,
  MNODE_overlay: MNODE_overlay,
};

function MNODEparent($startNode) {
  //per poter chiamare sia come funzione che come metodo
  if ($startNode == undefined) {
    $startNode = $(this);
  }
  //risali passo passo la struttura DOM fino a trovare un elemento MNODE
  return $startNode.parent().closest("[data-atom]");
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
function LookForAncCdsEveryGeneration($MNODEnode,selector)
{
	//cerca un elemento che soddisfa la stringa selector, controlla $startNode e poi risale gli antenati.
	//Termina Esplorazione se:
	//limite1: fermati dopo  n passi (depthLimit=10) 
	var depthLimit=30;
	var currNode=$MNODEnode;
	for (i=0; i<depthLimit; i++)
	{
	if( !MNODEparent(currNode).is(selector) || !MNODEclosedDef(currNode) ) // il prox nodo non ha la caratteristica cercata?
		{
			return currNode
		}
	else // al prossimo giro analizza il MNODEpadre
		{
		currNode=MNODEparent(currNode)
		}
	}
}
*/

function MNODEclosedDef(Node) {
  //stabilisci se l'elemento "Node" e' aperto e si puo modificare liberamente
  return $(Node).closest(".unlocked").length == 0;
}
function MNODEfrozenDef(Node) {
  //!! to be refined
  return $(Node).closest("[data-tag]");
}

function MNODE_dissolveContainer() {
  if (this.MNODE_getChildren().length > 0) {
    var $children = this.MNODE_getRoles().children().filter("[data-atom]");
    $(this).replaceWith($children);
  } else {
    $(this).remove();
  }
  return $children;
}

//per creazione automatica def: $(".selected")[0].MNODECreateDefinition()
function MNODECreateDefinition(startNode) {
  if (startNode == undefined) {
    startNode = this;
  }
  var outType = $(startNode).attr("data-type");
  var $newDef = MNODEclone(
    prototypeSearch("eq", "bool", undefined, "asymmetric")
  ); //crea una nuova definizine
  //*********************** definendum **********************
  //attuale)al momento vengono inseriti n ruoli singoli quanti sono i parametri
  //rimane da fare todo!!: circondare la lista parametri con parentesi e separarli con, quando?
  //alternativa)in altermnativa si potrebbe una lista ordinata, ma si dovrebbe introdurre un modo
  //per specificare separatamente il datatype di ogni elemento della lista (cluster)
  var $definendum = MNODEclone(prototypeSearch("function"));
  $definendum.attr("data-type", outType);
  m1 = $newDef.find(".firstMember"); //trova primo membro
  newName = prompt("Enter a name for the new definition");
  $definendum.attr("data-atom",newName);
  $definendum.find(".name").append(newName);
  m1.append($definendum); //aggiungi contenuto al primo membro ed inseriscilo
  //*********************** definens **********************
  $definens = MNODEclone($(startNode));
  //$definens.find("#MyOverlay").remove()//togli l'overlay violetto dal clone
  m2 = $newDef.find(".secondMember"); //trova secondo membro todo
  m2.append($definens); //aggiungi contenuto al secondo membro
  var $parList = $definens.find(".unselected");

  if ($parList.length > 0) {
    let paramDefNames = ["x","y","z","t","k","p","q","a","b","c","d","e","f","g","h","i","l","m","n","o","q","r","s","u","v","z",];
    $newforAll = MNODEclone(prototypeSearch("forall")); //clona for each
    MNODEextend($newforAll);
    $("#telaRole").append($newforAll); //todo:scegliere dove deve essere visibile la nuova definizione
    GetforAllContent($newforAll).append($newDef);
    $parList.each(function (i, val) {
      var node = this;
      var thisType = $(node).attr("data-type");
      var $newNode = MNODEclone(prototypeSearch("ci")).attr(
        "data-type",
        thisType
      ); //data() e' un casino
      $newNode[0].MNODE_setName(paramDefNames[i]);
      $(this).replaceWith($newNode);
      var $Clone1 = MNODEclone($newNode); //clone da inserire in definendum
      var $Clone2 = MNODEclone($newNode); //clone da inserire in forAll header
      var $newRole = $('<span class="s_role" data-accept="1"></span>');
      $newRole.attr("data-type", thisType);
      $definendum.append($newRole);
      $newRole.append($Clone1);
      GetforAllHeader($newforAll).append($Clone2);
    });
  }

  //*******************inserisci la nuova definizione
  $newDef.find("*").removeClass("selected").removeClass("unselected"); //clear selected unselected
  return startNode;
}

function MNODEReplace($replaced, $replacer) {
  var $clone = MNODEclone($replacer);
  MNODEextend($clone); //mi serve subito che sia esteso, gli eventi sono attivati in seguito
  //sostituisci
  var mark = MNODESmarkUnmark($replaced);
  if (mark !== undefined) {
    MNODESmarkUnmark($clone, mark); //$replaced---->$replacer sostituisci ma conserva il titolo se presente
  }
  $replaced.replaceWith($clone);
  $clone.css({ display: "" });
  ExtendAndInitializeTree($clone);
}

function MNODELinkReplace($link, $replaced) {
  //changed argument order to comply with 1Dragged 2Target
  MNODEReplaceLink($replaced, $link);
}

function MNODEReplaceLink($replaced, $link) {
  //get the other member of the link, futuribile: uguaglianza tra molti membri, necessario sistema per scegliere tra membri
  var $replacer;
  if ($link.parent().hasClass("firstMember")) {
    $replacer = MNODEclone(
      MNODEparent($link)[0].MNODE_getRoles(".secondMember").children()
    );
  } else if ($link.parent().hasClass("secondMember")) {
    $replacer = MNODEclone(
      MNODEparent($link)[0].MNODE_getRoles(".firstMember").children()
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

function typeOk($MNODEdragged, $role) {
  return classA_in_classB(
    $MNODEdragged.attr("data-type"),
    $role.attr("data-type")
  );
}

//if($MNODEdragged.attr(data-type))verifica datatype e numero di elementi accettati
function classA_in_classB(classNameA, classNameB) {
  // futuribile: stabilire se una classe ne estende un'altra anche con ereditariet� multipla
  return classNameB === "obj" || classNameA === classNameB;
}

function MNODECreateSpaceForDeduction($hypothesis) {
  var spaceForDeduction;
  if (MNODEparent($hypothesis).attr("data-atom") === "and") {
    //parent external to enclosure is 'and'?
    spaceForDeduction = $hypothesis.parent();
  } else {
    // create an 'and'
    var newAnd = MNODEclone(prototypeSearch("and"));
    $hypothesis.parent().append(newAnd);
    spaceForDeduction = newAnd.find('>[class*="_role"]');
    spaceForDeduction.append($hypothesis); //
  }
  return spaceForDeduction;
}

//todo: questa ricerca non distingue le variabili interne "Bvar".
// Ad esempio     x+1= integrale( x^2 in dx)   x compare sia a destra che a sinistra ma non è la stessa variabile
function $MNODEParameterSearch($startNode, $atom_param) {
  // cerca nodi uguali al parametro dato
  var result = $startNode.find("[data-atom]").filter(function (index) {
    //return MNODEEqual($atom_param[0],this)
    return compareExtMNODE($atom_param, $(this), true, false);
  });
  return result;
}

function MNODEReplaceAll(
  $startNode,
  replaced /*HTMLnode atom */,
  replacer /*HTMLnode atom */
) {
  var $replaced = $(replaced);
  var $replacer = $(replacer);
  $startNode = $($startNode); //se per caso passo uno start node non $
  var $occurrences = $MNODEParameterSearch($startNode, replaced);
  var result = $.each($occurrences, function (i, o) {
    MNODEReplace($(o), $replacer);
  });
  return +$occurrences.length + " replaced";
}

function GetforAllContent($forAll) {
  return $forAll[0].MNODE_getRoles(".forAllContent");
}
function GetforAllHeader($forAll) {
  return $forAll[0].MNODE_getRoles(".forAllHeader");
}

function MNODEForThis_Par_newVal($newVal, $parameter) {
  return MNODEForThisPar($parameter, $newVal);
}
function MNODEForThisPar($parameter, $newVal) {
  // atom
  //$newVal può essere anche un vettore vuoto
  //in tal caso il parametro doverebbe essere di tipo x___ ma per ora non faccio controlli
  var $f = $parameter.parent().closest('[data-atom="forAll"]'); //
  var $h = GetforAllHeader($f); // get header
  var $c = GetforAllContent($f);
  var $root = $f; //l'elemento più esterno Root può cambiare
  //************stabilisci se c'è conflitto con i nomi delle Bvar******
  //il nome della variabile specificata nel forThis è per caso già presente tra i parametri del forall?
  if ($newVal.length != 0) {
    var newValName = $newVal[0].MNODE_getName();
    var $toBeRenamed = $h.children().filter(function () {
      return this.MNODE_getName() == newValName;
    });
    $toBeRenamed.each(function () {
      formatForall($f, $(this));
    });
  }
  //var mark = $parameter[0].MNODE_getName()
  //MNODESmarkUnmark($newVal,mark)//se sostituisci il paramtro di nome xxx sarai marcato xxx
  //sostituisci
  MNODEReplaceAll($c, $parameter, $newVal);
  $parameter.remove();
  //se non ci sono più parametri, "dissolvi" il forAll esterno e metti al suo posto il contenuto
  if ($h.children().length == 0) {
    var $content = $c.children();
    //metti il sostituto nella stessa posizione del sostituito
    if ($f.css("position") == "absolute") {
      MNODEappendInABSPosition($content, $f, "superposed");
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
  var oldName = $toBeRenamed[0].MNODE_getName();
  var newName = "(" + oldName + ")";
  //cerca le occorrenze e marca ciascuna occorrenza
  var $occurrences = $MNODEParameterSearch($forall, $toBeRenamed);
  $occurrences.each(function () {
    this.MNODE_setName(newName);
  });
}

function MNODE_replaceWith(replacer) {
  //replacer must be atom
  $(this.MNODE_getEnclIfPresent()).replaceWith(MNODE_getEnclIfPresent(replacer));
  return this; // return replaced
}

function MNODE_getNodes(selector) {
  $(this).addClass("gettingNodes");
  var $subnodes = $(this)
    .find("*")
    .not(".gettingNodes [data-atom], .gettingNodes [data-atom] *"); //subnodes in this atom
  var $Nodes = $(this).add($subnodes); // root node + subnodes
  if (selector != undefined) {
    // se viene passato un "selector", filtra i Nodes
    $Nodes = $Nodes.filter(selector);
  }
  $(this).removeClass("gettingNodes");
  return $Nodes;
}

function MNODE_getRoles(selector) {
  var $roles = this.MNODE_getNodes(selector).filter('[class*="_role"]');
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

function MNODE_getChildren(selector) {
  var $children = this.MNODE_getRoles().children("[data-atom]");
  if (selector != undefined) {
    // se viene passato un "selector", filtra
    $children = $children.filter(selector);
  }
  return $children;
}

function MNODE_getName(considerSuffix) {
  var nameWithSuffix = $(this).find(">.name").text();
  if (considerSuffix) {
    return nameWithSuffix;
  } else {
    return nameWithSuffix.match(/[^_]*/)[0];
  }
}

function MNODE_setName(newName) {
  $(this).find(">.name").text(newName);
}

function MNODE_addRole(dataType, content) {
  var $newNode;
  $newNode = $('<span class="role">' + content + "</span>").attr(
    "data-type",
    dataType
  ); //data() e' un casino
  $(this).append($newNode);
  return $newNode;
} //da usare quando si crea una nuova funzione o definizione

function validTargetsFromOpened($MNODEdragged) {
  var numOfPlaces;
  var valids = $('#telaRole,  [class*="_role"]:visible').filter(function (
    index
  ) {
    //*****determine number of places********
    numOfPlaces = getNumOfPlaces($(this));
    //*****valid?***********
    var result =
      //if $dragged is not a new definition, target must be opened or boolPtototype todo: check the dragged prototype really has value true
      (!MNODEclosedDef(this) ||
        $MNODEdragged.is("#asymmeqPrototype") ||
        $MNODEdragged.is("#boolPrototype")) &&
      //datatype is compatible
      typeOk($MNODEdragged, $(this)) &&
      //is there place for another?
      (numOfPlaces === -1 ||
        $(this).children().filter("[data-atom]").length < numOfPlaces);

    return result;
  });
  return valids.not($MNODEdragged.parent());
}

function validCandidatesForPatternDrop($MNODEdragged) {
  var valids = $("#telaRole [data-atom]:visible").filter(function (index) {
    //*****valid?***********
    var result =
      //datatype is compatible
      typeOk($MNODEdragged, $(this)) && MNODEfrozenDef($(this)).length == 0;
    return result;
  });
  return valids; //.not($MNODEdragged.parent())
}

function getNumOfPlaces($role) {
  //*****determine number of places********
  if ($role.hasClass("s_role")) {
    numOfPlaces = 1;
  } else if (
    $role.attr("data-accept") === undefined ||
    parseInt($role.attr("data-accept")) === -1
  ) {
    numOfPlaces = -1; //-1 means infinite
  } else {
    numOfPlaces = parseInt($role.attr("data-accept"));
  }
  return numOfPlaces;
}

function overflowExsists(node) {
  return (
    node.offsetHeight < node.scrollHeight || node.offsetWidth < node.scrollWidth
  );
}

function MNODEclone($node, doNotExtend, removeID) {
  // di default rimuove ID
  $clone = $node.clone(); //clona
  $toBeCleaned = $clone.add($clone.find("*")); //clean discendence too
  if (doNotExtend !== false) {
	ExtendAndInitializeTree($clone);
  }
  if (removeID !== false) {
    $toBeCleaned.removeAttr("id");
    $toBeCleaned.removeAttr("data-tag");
    $toBeCleaned.removeClass("hide");
    $toBeCleaned.removeClass("fundamental");
  }
  return $clone;
}

var symbols = ["ci", "cn", "csymbol"];
function prototypeSearch(className, dataType, requiredClass, name) {
  //alcune classi, ad esempio "ci", possono avere vari datatype
  //get all prototypes  (futuribile: preindex prototypes)
  var $prototypes = $("#tavolozza").find("[data-atom]");
  //filter for required
  if (requiredClass) {
    $prototypes = $prototypes.filter("." + requiredClass);
  }
  if ($prototypes.length == 0) {
    console.log("prototype not found:" + className + requiredClass);
    return $();
  }
  //if(found 1 tag){return}
  //if(found >1 tag){return}
  var type = dataType; //per poter usare questo valore nell 'each'
  var dataTypeString =
    dataType === undefined ? "[data-type]" : "[data-type=" + dataType + "]";
  $prototypes = $prototypes.filter(function () {
    return (
      this.getAttribute("data-atom").toLowerCase() == className &&
      (type == undefined ||
        this.getAttribute("data-type").toLowerCase() == type)
    );
  }); //not case sensitive
  if ($prototypes.length > 1 && (className === "cn" || className === "ci")) {
    //if many candidates refine research
    let $specificProto = $prototypes.filter(function () {
      return this.MNODE_getName() == name;
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
    //console.warn('MNODE prototype not found:className:' + className + ", dataType:" + dataType);//Warning!!
    let $prototype = MNODEclone($("#Prototype"));
    $prototype.attr("data-atom", className);
    $prototype.attr("data-type", dataType);
    //addTypeDecorations($prototype);
    return $prototype;
  }
  return $prototypes.last(); //in case you find more prototypes
}

function encaseWithOperation($MNODEelement, op) {
  //create external operation to $MNODEelement, $MNODEelement is 1 element or a list of adjacent elements
  var $prototype = prototypeSearch(op);
  var $clone = MNODEclone($prototype);
  //MNODEparent($MNODEelement).replaceWith($clone);//replace provoca la distruzione degli eventi nel replaced
  $clone.insertBefore($MNODEelement.eq(0));
  $MNODEelement.appendTo($clone[0].MNODE_getRoles());
  return $clone;
}

function encaseIfNeeded($MNODEelement, op) {
  if (MNODEparent($MNODEelement).attr("data-atom") === op) {
    //no need to cteate external op
    return MNODEparent($MNODEelement);
  } else {
    return encaseWithOperation($MNODEelement, op);
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
  var $parent = MNODEparent($($s[0])); //to check if nodes are siblings
  for (var i = 0, len = $s.length; i < len; i++) {
    if (!MNODEparent($($s[i])).is($parent)) {
      allSiblingsOk = false;
      break;
    }
  }
  return allSiblingsOk;
}

function addTypeDecorations($atom) {
  //get the "type" of the prototype and complete it with decoration
  var dataType = $atom.attr("data-type");
  var b = $atom;
  if (dataType === "num" && b.find(".leftDecoration").length == 0) {
    //is decoration present already?
    b.append($('<span class="leftDecoration"></span>'));
  }
  if (
    (dataType === "num" || dataType === "bool") &&
    b.find(".topDecoration").length == 0
  ) {
    var b = $atom;
    b.append($('<span class="topDecoration"></span>'));
  }
}

function MNODErenamePrompt($atom, newName) {
  //
  var oldName = $atom[0].MNODE_getName();
  if ($atom.hasClass("minus")) {
    oldName = "-" + oldName;
  }
  if ($atom.hasClass("inverse")) {
    oldName = "/" + oldName;
  }
  var newName = prompt(
    'Enter a new name, / for inverse, /- for opposite and inverse do not use "-" or "/" in names es: x-xxx ',
    oldName
  );
  if (newName != null) {
    if (newName[0] === "/") {
      newName = newName.substr(1); //nome privato del segno meno
      $atom.addClass("inverse");
    } // attenzione: / va inserito prime del meno
    else {
      $atom.removeClass("inverse");
    }
    if (newName[0] === "-") {
      newName = newName.substr(1); //nome privato del segno meno
      $atom.addClass("minus");
    } //todo: cosa succede se input = ---2  ?
    else {
      $atom.removeClass("minus");
    }
    $atom[0].MNODE_setName(newName);
    $atom.attr("data-atom", isNaN(newName) ? "ci" : "cn"); // se numero allora classe "cn"
    ssnapshot.take();
  }
}

function createForThis($forall, $placeHolder) {
  //Modus Ponens deduce a special case from a forall
  var $clone = MNODEclone($forall);
  exclusiveFocus = $clone.addClass("exclusiveFocus"); //metti il clone in stato exclusiveFocus
  //****inserit the new proposition*****
  if (MNODEparent($forall).attr("data-atom") == "and") {
    $clone.insertAfter($forall);
  } else {
    //enclosure needed
    MNODECreateSpaceForDeduction($forall).append($clone);
  }
  return $clone;
}

//start to peel Onion($currAtom)
function AtomsToVal($currAtom, res) {
  //espressioni tipo (-(/(-(a)))) funzione ricorsiva
  //res = {type:"NotAnumber", val:1, sign:1, exp:1, computedVal:NaN, canBeReplaced:true}
  //debug colors
  if (debugMode) {
    $("*").removeClass("input");
    MNODEnodesAddClass($currAtom, "input"); //add colors
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
  var op = $currAtom.attr("data-atom");
  if (op === "minus" || op === "m_inverse") {
    //------------------> recursive
    var newRes = AtomsToVal($currAtom[0].MNODE_getChildren(), res);
    //<------------------
    if (op === "minus") {
      res.sign = newRes.sign * -1;
    } else {
      res.exp = newRes.exp * -1;
    }
  } else if (op === "cn" || op === "ci") {
    //todo: per ora gestisce solo cn e ci
    res.type = op;
    res.val = $currAtom[0].MNODE_getName();
  } else {
    res.val = NaN;
    res.canBeReplaced = false;
  }
  res.computedVal = Math.pow(res.sign * res.val, res.exp);
  return res;
}

function isAsymbol($atom) {
  var className = $atom.attr("data-atom");
  return symbols.indexOf(className) != -1; //is it a symbol?(ci,cs,csymbol)
}

function ValToAtoms(partial) {
  var $newAtom;
  var $clone;
  var $target;
  if (partial.sign === -1) {
    //segno meno?
    $clone = MNODEclone(prototypeSearch("minus"));
    $newAtom = $clone;
    $target = $clone[0].MNODE_getRoles();
  }
  if (partial.exp === -1) {
    //inverso?
    $clone = MNODEclone(prototypeSearch("m_inverse"));
    if ($target !== undefined) {
      $target.append($clone);
    } else {
      $newAtom = $clone;
    }
    $target = $clone[0].MNODE_getRoles();
  }
  $clone = MNODEclone(prototypeSearch("cn", "num"));
  $clone[0].MNODE_setName(partial.val);
  $clone.attr("data-atom", partial.type); //uso un generico prototipo num e qui specifico se cn o ci
  if ($target !== undefined) {
    $target.append($clone);
  } else {
    $newAtom = $clone;
  }
  return $newAtom;
}

function AtomBesideGiven($startAtom) {
  //Attualmente il contenuto dei role si dispone leftRight e topDown mentre comporre è visto come left e down.
  //di conseguenza per decidere qual'è l'elemento con cui comporre devo distiguere a seconda dell'orientazione.'
  if ($toBeComp.css("display") === "inline-block") {
    return $startAtom.prevAll("[data-atom]:first");
  } else {
    return $startAtom.nextAll("[data-atom]:first");
  }
}

function refreshOneBracket($MNODE) {
  if (MNODEneedsBracket($MNODE)) {
    $MNODE.addClass("brackets");
  } else {
    $MNODE.removeClass("brackets");
  }
}

function generalRefreshInfixEmptyBrakets(
  $startNode,
  STinfix,
  STempty,
  STBrackets
) {
  //ST means subtree
  //if($startNode.length != 0){
  var $Atoms; //lista degli atomi "da trattare"
  if (STinfix || STempty || STBrackets) {
    //se qualche procedura va estesa al subtree, cerca tutta la progenie
    $Atoms = $startNode.add($startNode.find("[data-atom]"));
  } else {
    $Atoms = $startNode;
  }
  $Atoms.each(function (i, element) {
    if (i == 0 || STinfix) {
      //(primo giro) o (tratta anche il subtree)
      refreshOneInfix($(element)); //refresh infix
    }
    if (i == 0 || STempty) {
      refreshEmpty($(element)); //refresh empty
    }
    if (i == 0 || STBrackets) {
      refreshOneBracket($(element));
    }
  });
  //}
}

// RefreshEmptyInfixBraketsGlued($("#telaRole"),true,"eibg")
function RefreshEmptyInfixBraketsGlued($startNode, tree, options) {
  //if($startNode.length != 0){
  var $Atoms; //lista degli atomi "da trattare"
  if (tree != false) {
    $Atoms = $startNode.add($startNode.find("[data-atom]"));
  } else {
    $Atoms = $startNode;
  }
  $Atoms.each(function (i, element) {
    if (options == undefined || options.indexOf("e") != -1) {
      refreshEmpty($(element));
    }
    if (options == undefined || options.indexOf("i") != -1) {
      refreshOneInfix($(element));
    }
    if (options == undefined || options.indexOf("b") != -1) {
      refreshOneBracket($(element));
    }
  });
  if (options == undefined || options.indexOf("g") != -1) {
    //nota: refresh è sempre applicato a tutto l'albero
    refreshGlued($startNode);
  }
  //}
}

function MNODEshowMarks($atom, showPath) {
  //se showPath=true allora mostra anche il path
  var labelString;
  var mark = $atom.attr("title");
  if (mark == undefined) {
    mark = "";
  }
  var path = $atom.attr("data-path");
  if (!showPath || path == undefined) {
    path = "";
  } //se non è da visualizzare, oppure è indefinito
  if ($atom.find(".label").length == 0) {
    $atom.append('<div class="label"></div>');
  }
  $atom.find(".label").text(mark + "_" + path);
}
function showAllMarks(showPath) {
  $("body [data-atom]:visible").each(function (i, element) {
    MNODEshowMarks($(element), showPath);
  });
}

function hideAllMarks() {
  $(".label").remove();
}

function MNODEEqual(node1, node2, checkType, neglectRootSign) {
  //node1/2 HTMLnode. Flat to simil mathml e paragona
  if (node1 == undefined || node2 == undefined) {
    return false;
  }
  return (
    node1.MNODE_createMathmlString(checkType, neglectRootSign) ===
    node2.MNODE_createMathmlString(checkType, neglectRootSign)
  );
  //return adaptMatch(undefined,$(node1),$(node2),$(node2))//sostituita comparazione "grezza" con comparazione ricorsiva
}

function compareExtMNODE(
  $input,
  $pattern,
  checkAtomTypeAndName /*defaul=true*/,
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
  } else if (checkAtomTypeAndName == false) {
    return true;
  } // no deeper tests required
  else if (
    $input.attr("data-atom") !== $pattern.attr("data-atom") /*notSameClass*/
  ) {
    return false;
  } else if (symbols.indexOf($input.attr("data-atom")) != -1 /*is a symbol*/) {
    res = $input[0].MNODE_getName() === $pattern[0].MNODE_getName();
  } else {
    res = true; //no more tests required
  }
  return res;
}

function MNODEcleanIfPointless(startNode, applyToSubtree) {
  //per applicarlo all'albero applica prima a subtree e poi a root
  let $extOp = $(startNode);
  if (applyToSubtree) {
    for (i = 0; i < 100; i++) {
      //messo un limite solo per evitare loop infiniti in caso di errori nel codice
      //trova i contenitori da rimuovere: vuoti o con un solo figlio
      var $pointlessElements = $extOp
        .parent()
        .find("[data-atom].cleanifpointless")
        .filter(function () {
          return this.MNODE_checkIfPointlessSingleNode();
        });
      //agisci sul primo trovato, poi ripeti la ricerca.
      if ($pointlessElements.length > 0) {
        let $children = $pointlessElements[0].MNODE_dissolveContainer();
        if ($pointlessElements.eq(0).is($extOp)) {
          $extOp = $children;
        }
      } else {
        //console.log('no more pointless subnodes')
        return $extOp;
      }
    }
  } else {
    if (
      $extOp.is("[data-atom].cleanifpointless") &&
      $extOp[0].MNODE_checkIfPointlessSingleNode()
    ) {
      return $extOp[0].MNODE_dissolveContainer();
    }
  }
}

function MNODE_checkIfPointlessSingleNode() {
  let op = $(this).attr("data-atom");
  if (!OpIsAssociative(op)) {
    return false;
  }
  if (this.MNODE_getChildren().length <= 1) {
    return true;
  }
  let opP = MNODEparent($(this)).attr("data-atom");
  if (opP == op) {
    return true;
  }
}

function MNODE_overlay(mode) {
  // aggiunge/rimuove un overlay ad un MNODE
  if (mode == undefined) {
    $(this).append('<div id="overlay">');
  } else {
    $("#overlay").remove();
  }
}

function MNODEnodesAddClass($atom, newClass, mode /* true = remove*/) {
  if (!mode) {
    $atom.each(function () {
      this.MNODE_getNodes().addClass(newClass);
    });
  } else {
    $atom.each(function () {
      this.MNODE_getNodes().removeClass(newClass);
    });
  }
}

// MNODEapplyFunctToTree($('.selected'),true,ALDOtest,'a','b','c')
function MNODEapplyFunctToTree(
  $StartAtom,
  includeRoot,
  funct,
  parameterA,
  parameterB,
  parameterC
) {
  //given Funct($Atom), it is applied to the discendants of $startNode
  let $tree = $();
  if (includeRoot) {
    $tree = $tree.add($StartAtom);
  }
  $tree = $tree.add($StartAtom.find("[data-atom]"));
  //$tree.each(funct(parameterA,parameterB))
  $tree.each(function (i, e) {
    funct($(e), parameterA, parameterB, parameterC);
  });
}
/*
function ALDOtest($Atom,parameterA){
	console.log('Atom:')
	console.log($Atom)
	console.log('parameterA:')
	console.log(parameterA)
}
*/
/*
function MNODEfrozenDef(Node){
	//!! to be refined 
	return $(Node).closest('[data-tag]')
}
*/

/************** MNODE UTILITIES  not API ***********************/
function MNODEextend($startNode, applyToSubtreeAlso) {
  //add methods from object "atom"
  var $toBeExtended;
  if (!applyToSubtreeAlso) {
    $toBeExtended = $startNode.filter("[data-atom]"); //in ogni caso estendo solo i '[data-atom]'
  } else {
    $toBeExtended = $startNode
      .filter("[data-atom]")
      .add($startNode.find("[data-atom]"));
  }

  $toBeExtended.each(function (index) {
    // tutti gli HTML nodes con classe .MNODE
    $.extend(this, atom); //pare non si possa fare altrimenti non riesco a estendere $(this)
  });
}
