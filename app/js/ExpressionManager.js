// In questo file dovrebbero comparire tutte le funzioni che manipolano l'espressione matematica
//todo: in teoria tutte le operazioni sull'espressione dovrebbero avvenire tramite queste funzioni, anche se per ora questa riformattazione del codice non è ancora avvenuta
//todo: cercare,tutti i punti in cui il codice  al di fuori di questo file e sostituire la manipolazione diretta di elementi html che costituiscono l'espressione matematica con chiamate a questo file 

/* ---- Il tipo ENode ----
DEFINIZIONE: un ENODE è un elemento HTML con attributo `data-enode`; è il nodo
dell'albero dell'espressione matematica (il DOM è il modello dati, vedi
project/specs/software-modules.md §1).

Il typedef qui sotto dichiara il tipo per il motore dei tipi dell'IDE: le
funzioni concepite per agire su un ENODE lo dichiarano nella firma con
`@param {ENode}` / `@returns {JQuery<ENode>}`. Il "brand" `__enodeBrand`
esiste solo per il type-checker e rende ENode non intercambiabile con un
Element qualunque; a runtime un ENode è un normale Element. Il modo corretto
di ottenere un ENode da un Element generico è passare da asENode(), che
verifica davvero l'attributo (controllo statico e controllo a runtime si
incontrano lì). */

/**
 * Elemento HTML con attributo `data-enode`: nodo dell'albero dell'espressione.
 * @typedef {Element & { __enodeBrand: 'ENode' }} ENode
 */

/**
 * true se el è un ENODE (elemento HTML con attributo data-enode).
 * @param {Element|null|undefined} el
 * @returns {el is ENode}
 */
function isENode(el) {
	return !!el && el.nodeType === 1 && el.hasAttribute('data-enode');
}

/**
 * "Dogana" del tipo ENode: verifica a runtime che el sia un ENODE e lo
 * restituisce tipato; lancia TypeError altrimenti. Da usare ai confini
 * (selezioni generiche, input utente), non dove l'ENODE è già garantito.
 * @param {Element|null|undefined} el
 * @returns {ENode}
 */
function asENode(el) {
	if (!isENode(el)) { throw new TypeError('asENode: elemento senza data-enode'); }
	return el;
}

/* ---- Expression Global Utilities ---- */

/**
 * Restituisce il nodo radice dell'espressione matematica principale
 * (il primo figlio [data-enode] dentro #canvas>.secondMember).
 * @returns {ENode|undefined} Il nodo radice, o undefined se non trovato.
 */
function getExpressionRootNode() {
    // Trova il primo figlio con [data-enode] all'interno del contenitore principale
    return $("#canvas>.secondMember").children("[data-enode]")[0];
}

/* ---- Primitive di manipolazione strutturale ----
Ogni modifica strutturale all'espressione (inserimento, rimozione, sostituzione, spostamento di ENODE)
effettuata al di fuori di questo file deve passare da queste funzioni.
Accettano indifferentemente oggetti jQuery o elementi HTML. */

/**
 * Rimuove uno o più nodi dall'espressione.
 * @param {JQuery|Element} ENODEs - Nodo o nodi da rimuovere.
 */
function ENODEremove(ENODEs) {
	//rimuove uno o più nodi dall'espressione
	$(ENODEs).remove();
}

/**
 * Inserisce uno o più nodi prima del nodo di riferimento.
 * @param {JQuery|Element} ENODEs - Nodo o nodi da inserire.
 * @param {JQuery|Element} refNode - Nodo di riferimento.
 * @returns {JQuery} I nodi inseriti.
 */
function ENODEinsertBefore(ENODEs, refNode) {
	//inserisce uno o più nodi prima del nodo di riferimento
	return $(ENODEs).insertBefore(refNode);
}

/**
 * Inserisce uno o più nodi dopo il nodo di riferimento.
 * @param {JQuery|Element} ENODEs - Nodo o nodi da inserire.
 * @param {JQuery|Element} refNode - Nodo di riferimento.
 * @returns {JQuery} I nodi inseriti.
 */
function ENODEinsertAfter(ENODEs, refNode) {
	//inserisce uno o più nodi dopo il nodo di riferimento
	return $(ENODEs).insertAfter(refNode);
}

/**
 * Aggiunge contenuto in coda a un role/contenitore dell'espressione.
 * @param {JQuery|Element} container - Il role/contenitore di destinazione.
 * @param {JQuery|Element|string} content - Il contenuto da aggiungere.
 * @returns {JQuery} Il contenitore.
 */
function ENODEappend(container, content) {
	//aggiunge contenuto in coda a un role/contenitore dell'espressione
	return $(container).append(content);
}

/**
 * Aggiunge contenuto in testa a un role/contenitore dell'espressione.
 * @param {JQuery|Element} container - Il role/contenitore di destinazione.
 * @param {JQuery|Element|string} content - Il contenuto da aggiungere.
 * @returns {JQuery} Il contenitore.
 */
function ENODEprepend(container, content) {
	//aggiunge contenuto in testa a un role/contenitore dell'espressione
	return $(container).prepend(content);
}

/**
 * Sostituzione diretta di un nodo senza clonazione (cfr. ENODEReplace che clona ed estende).
 * @param {JQuery|Element} replaced - Il nodo da sostituire.
 * @param {JQuery|Element} replacer - Il nodo sostituto.
 * @returns {JQuery} Il nodo sostituito (rimosso dal DOM).
 */
function ENODEreplaceNode(replaced, replacer) {
	//sostituzione diretta senza clonazione (cfr. ENODEReplace che clona ed estende)
	return $(replaced).replaceWith(replacer);
}

/**
 * Scambia il contenuto di primo e secondo membro di un'equazione.
 * @param {JQuery} $equation - L'ENODE equazione (deve avere role .firstMember e .secondMember).
 * @returns {JQuery} L'equazione stessa, con i membri scambiati.
 */
function ENODEswapEqMembers($equation) {
	//scambia il contenuto di primo e secondo membro di una equazione
	const $firstMember = ENODE_getRoles($equation[0], '.firstMember');
	const $secondMember = ENODE_getRoles($equation[0], '.secondMember');
	const $firstMemberContent = $firstMember.children().remove();
	const $secondMemberContent = $secondMember.children().remove();
	$firstMember.append($secondMemberContent);
	$secondMember.append($firstMemberContent);
	return $equation;
}

/**
 * Crea un nuovo simbolo clonando il prototipo adatto: cn se il nome è numerico,
 * ci altrimenti, con l'eventuale data-type indicato.
 * @param {string|number} name - Nome del simbolo (se numerico viene creato un cn).
 * @param {string} [dataType] - Valore da assegnare all'attributo data-type.
 * @returns {JQuery} Il nuovo ENODE simbolo (clone esteso, staccato dal DOM).
 */
function ENODEcreateSymbol(name, dataType) {
	//crea un nuovo simbolo (ci o cn a seconda del nome) con l'eventuale data-type indicato
	const $newNode = ENODEclone(prototypeSearch((isNaN(name)) ? "ci" : "cn"));
	ENODE_setName($newNode[0], name);
	if (dataType != undefined) { $newNode.attr('data-type', dataType); }
	return $newNode;
}

/**
 * Converte una stringa in un ENODE foglia: clona il generico prototipo cn/num e
 * imposta data-enode a 'cn' se la stringa è numerica, 'ci' altrimenti.
 * @param {string} string - Il nome/valore dell'identificatore o del numero.
 * @returns {JQuery} Il nuovo ENODE foglia (staccato dal DOM).
 */
function identifierToENODE(string){
	let ENODEType 
	if(isNaN(parseInt(string))){
		ENODEType = 'ci'
	}
	else{
		ENODEType = 'cn'
	}
	let $clone = ENODEclone( prototypeSearch("cn","num") )
	ENODE_setName($clone[0], string);
	$clone.attr('data-enode', ENODEType);//uso un generico prototipo num e qui specifico se cn o ci
	return	$clone
}

/**
 * Parser minimale per stringhe tipo "x=1", "x>0", "x>=2": riconosce gli
 * operatori >=, > e = e costruisce il corrispondente ENODE binario (geq/gt/eq)
 * con i due membri convertiti da identifierToENODE.
 * @param {string} string - La stringa da interpretare.
 * @returns {JQuery|undefined} L'ENODE operazione costruito, oppure undefined se nessun operatore è riconosciuto.
 */
function dummyParser(string){
	//parser minimale per stringhe tipo "x=1", "x>0", "x>=2"
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
		ENODE_getRoles($operation[0], '.firstMember').append(first)
		ENODE_getRoles($operation[0], '.secondMember').append(second)
		return $operation
	}
}

/* ---- ENODE Methods/Functions ---- */

/**
 * Restituisce l'ENODE genitore, risalendo la struttura DOM fino al primo
 * antenato con attributo [data-enode].
 * @param {JQuery} [$startNode] - Elemento di partenza (anche non ENODE);
 *   se undefined restituisce un jQuery vuoto (alcuni chiamanti, es.
 *   refreshAndReplace con $transform assente, contano su questo).
 * @returns {JQuery<ENode>} L'ENODE antenato più vicino (eventualmente vuoto).
 */
function ENODEparent($startNode) {
	if ($startNode == undefined) { return $() }
	//risali passo passo la struttura DOM fino a trovare un elemento ENODE
	return $startNode.parent().closest("[data-enode]");
}

/**
 * Indica se il nodo è "tied": true se nessun antenato (o il nodo stesso) ha la classe .untied.
 * @param {JQuery|Element} Node - Il nodo da verificare.
 * @returns {boolean} true se il nodo è tied.
 */
function ENODEtiedDef(Node) {
	// true se Node è tied: nessun antenato untied
	return $(Node).closest(".untied").length == 0;
}
/** @deprecated use ENODEtiedDef */
function ENODEclosedDef(Node) {
	return ENODEtiedDef(Node);
}

/**
 * Controlla se l'elemento è una definizione, verificando la presenza
 * dell'attributo data-viseq="asymmetric".
 * @param {JQuery|Element} Node - Il nodo da verificare.
 * @returns {boolean} true se il nodo è una definizione.
 */
function isDefinition(Node) {
	//controlla se l'elemento è una definizione verificando se ha l'attributo data-viseq="asymmetric"
	return $(Node).is('[data-viseq="asymmetric"]');
}

/**
 * Restituisce il più vicino antenato (incluso il nodo stesso) con attributo
 * [data-tag], cioè la definizione "congelata" che contiene il nodo.
 * Nota nel codice: "to be refined" (implementazione da raffinare).
 * @param {JQuery|Element} Node - Il nodo di partenza.
 * @returns {JQuery} L'antenato [data-tag] più vicino (eventualmente vuoto).
 */
function ENODEfrozenDef(Node) {
	//!! to be refined
	return $(Node).closest("[data-tag]");
}

/**
 * "Dissolve" il contenitore sostituendolo con gli ENODE figli contenuti nei
 * suoi role; se non ha figli ENODE, rimuove semplicemente il nodo.
 * Attenzione: la variabile $children è dichiarata dentro il ramo if, quindi il
 * `return $children` finale non è raggiungibile senza errore (anomalia nota).
 * @param {ENode} node - Il nodo contenitore da dissolvere.
 * @returns {JQuery<ENode>} Gli ENODE figli che hanno preso il posto del contenitore.
 */
function ENODE_dissolveContainer(node) {
	if (ENODE_getChildren(node).length > 0) {
		const $children = ENODE_getRoles(node).children().filter("[data-enode]");
		$(node).replaceWith($children);
	} else {
		$(node).remove();
	}
	return $children;
}

/**
 * Crea una nuova definizione (equazione asimmetrica) per il nodo indicato:
 * clona il prototipo eq/bool, mette nel primo membro un nuovo definendum con il
 * nome dato e nel secondo un clone del nodo; se il nodo contiene elementi
 * .unselected li trasforma in parametri, avvolgendo la definizione in un forAll
 * e popolando definendum e header con i cloni dei parametri.
 * @param {JQuery|Element} startNode - Nodo da cui creare la definizione.
 * @param {string} newName - Nome del definendum; se assente la funzione termina senza fare nulla.
 * @returns {JQuery|Element|undefined} Il nodo di partenza, oppure undefined se manca il nome.
 */
//per creazione automatica def: ENODECreateDefinition($(".selected"), "nome")
function ENODECreateDefinition(startNode, newName) {
	if (!newName) { return }//no name given
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
	$definendum.attr("data-enode", newName);
	$definendum.find(".name").append(newName);
	m1.append($definendum); //aggiungi contenuto al primo membro ed inseriscilo
	//*********************** definens **********************
	const $definens = ENODEclone($(startNode));
	const m2 = $newDef.find(".secondMember"); //trova secondo membro todo
	m2.append($definens); //aggiungi contenuto al secondo membro
	const $parList = $definens.find(".unselected");
	$("#canvasRole").append($newDef);
	if ($parList.length > 0) {
		let paramDefNames = ["x", "y", "z", "t", "k", "p", "q", "a", "b", "c", "d", "e", "f", "g", "h", "i", "l", "m", "n", "o", "q", "r", "s", "u", "v", "z",];
		const $newforAll = ENODEclone(prototypeSearch("forall")); //clona for each
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
			ENODE_setName($newNode[0], paramDefNames[i]);
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
	//sostituisci
	const mark = ENODESmarkUnmark($replaced);
	if (mark !== undefined) {
		ENODESmarkUnmark($clone, mark); //$replaced---->$replacer sostituisci ma conserva il titolo se presente
	}
	$replaced.replaceWith($clone);
	$clone.css({ display: "" });
	ExtendAndInitializeTree($clone);
}



/**
 * Sostituisce un ENODE con un clone dell'"altro membro" dell'equazione a cui
 * appartiene $link: se $link è nel primo membro usa il secondo e viceversa.
 * Applica al sostituto le classi 'minus'/'inverse' se link e sostituito
 * differiscono per segno o reciprocità. (Futuribile: uguaglianza tra molti
 * membri, servirebbe un sistema per scegliere il membro.)
 * @param {JQuery} $replaced - L'ENODE da sostituire.
 * @param {JQuery} $link - L'ENODE dentro un membro dell'equazione che fa da collegamento.
 */
function ENODEReplaceLink($replaced, $link) {
	//get the other member of the link, futuribile: uguaglianza tra molti membri, necessario sistema per scegliere tra membri
	let $replacer;
	if ($link.parent().hasClass("firstMember")) {
		$replacer = ENODEclone(
			ENODE_getRoles(ENODEparent($link)[0], ".secondMember").children()
		);
	} else if ($link.parent().hasClass("secondMember")) {
		$replacer = ENODEclone(
			ENODE_getRoles(ENODEparent($link)[0], ".firstMember").children()
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

/**
 * Verifica la compatibilità di data-type tra un ENODE trascinato e un role di
 * destinazione (via classA_in_classB: compatibile se i tipi coincidono o se il
 * role accetta il tipo generico "obj").
 * @param {JQuery} $ENODEdragged - L'ENODE trascinato.
 * @param {JQuery} $role - Il role di destinazione.
 * @returns {boolean} true se il data-type è compatibile.
 */
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



/**
 * Sostituisce tutte le occorrenze di un ENODE all'interno di un sottoalbero:
 * trova le occorrenze con $findOccurrences e per ciascuna esegue ENODEReplace
 * (clone esteso del sostituto).
 * @param {JQuery|Element} $startNode - Radice del sottoalbero in cui cercare.
 * @param {JQuery|Element} replaced - ENODE di cui sostituire le occorrenze.
 * @param {JQuery|Element} replacer - ENODE sostituto (viene clonato per ogni occorrenza).
 * @returns {string} Stringa riassuntiva "N replaced" con il numero di occorrenze sostituite.
 */
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

/**
 * Restituisce il role contenuto (.forAllContent) di un ENODE forAll.
 * @param {JQuery} $forAll - L'ENODE forAll.
 * @returns {JQuery} Il role .forAllContent.
 */
function GetforAllContentRole($forAll) {
	return ENODE_getRoles($forAll[0], ".forAllContent");
}
/**
 * Restituisce il role header (.forAllHeader, che elenca le variabili legate) di un ENODE forAll.
 * @param {JQuery} $forAll - L'ENODE forAll.
 * @returns {JQuery} Il role .forAllHeader.
 */
function GetforAllHeader($forAll) {
	return ENODE_getRoles($forAll[0], ".forAllHeader");
}

function ENODEForThis_Par_newVal($newVal, $parameter) {
	return ENODEForThisPar($parameter, $newVal);
}
/**
 * Specializza un forAll sostituendo un suo parametro con un valore ("for this"):
 * rinomina le eventuali variabili legate omonime del nuovo valore, sostituisce
 * tutte le occorrenze del parametro nel contenuto con $newVal e rimuove il
 * parametro dall'header; se l'header resta vuoto il forAll viene "dissolto" e
 * al suo posto rimane il contenuto (rispettandone la posizione, anche assoluta).
 * @param {JQuery} $parameter - Il parametro (nell'header del forAll) da specializzare.
 * @param {JQuery} $newVal - Il valore sostitutivo; può essere anche una collezione vuota (in tal caso il parametro dovrebbe essere di tipo x___, ma non vengono fatti controlli).
 * @returns {JQuery} L'elemento più esterno risultante: il forAll stesso, oppure il suo contenuto se il forAll è stato dissolto.
 */
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
		const newValName = ENODE_getName($newVal[0]);
		const $toBeRenamed = $h.children().filter(function () {
			return ENODE_getName(this) == newValName;
		});
		$toBeRenamed.each(function () {
			formatForall($f, $(this));
		});
	}
	//var mark = ENODE_getName($parameter[0])
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
	const oldName = ENODE_getName($toBeRenamed[0]);
	const newName = "(" + oldName + ")";
	//cerca le occorrenze e marca ciascuna occorrenza
	const $occurrences = $findOccurrences($toBeRenamed, $forall);
	$occurrences.each(function () {
		ENODE_setName(this, newName);
	});
}

/**
 * Restituisce il nodo stesso più tutti i suoi sotto-elementi interni,
 * esclusi gli ENODE annidati e il loro contenuto.
 * @param {ENode} node - Il nodo ENODE radice.
 * @param {string} [selector] - Selettore jQuery per filtrare i risultati.
 * @returns {JQuery} Il nodo e i suoi sotto-elementi propri (non solo ENODE).
 */
function ENODE_getNodes(node, selector) {
	$(node).addClass("gettingNodes");
	const $subnodes = $(node)
		.find("*")
		.not(".gettingNodes [data-enode], .gettingNodes [data-enode] *"); //subnodes in this ENODE
	let $Nodes = $(node).add($subnodes); // root node + subnodes
	if (selector != undefined) {
		// se viene passato un "selector", filtra i Nodes
		$Nodes = $Nodes.filter(selector);
	}
	$(node).removeClass("gettingNodes");
	return $Nodes;
}

/**
 * Restituisce i role del nodo (elementi con classe *_role interni al nodo,
 * esclusi quelli di ENODE annidati), ordinati con i bVar_role per primi e poi
 * per data-roleOrder.
 * @param {ENode} node - Il nodo ENODE.
 * @param {string} [selector] - Selettore jQuery per filtrare i role.
 * @returns {JQuery} I role del nodo, ordinati (i role non sono ENODE).
 */
function ENODE_getRoles(node, selector) {
	let $roles = ENODE_getNodes(node, selector).filter('[class*="_role"]');
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

/**
 * Restituisce gli ENODE figli diretti, cioè i [data-enode] contenuti nei role
 * del nodo.
 * @param {ENode} node - Il nodo ENODE.
 * @param {string} [selector] - Selettore jQuery per filtrare i figli.
 * @returns {JQuery<ENode>} Gli ENODE figli.
 */
function ENODE_getChildren(node, selector) {
	let $children = ENODE_getRoles(node).children("[data-enode]");
	if (selector != undefined) {
		// se viene passato un "selector", filtra
		$children = $children.filter(selector);
	}
	return $children;
}

/**
 * Restituisce il nome del nodo, cioè il testo dell'elemento figlio .name; di
 * default il nome viene troncato al primo underscore (i suffissi _ / __ / ___
 * codificano il tipo di parametro).
 * @param {ENode} node - Il nodo ENODE.
 * @param {boolean} [considerSuffix] - Se true restituisce il nome completo, suffisso incluso.
 * @returns {string} Il nome del nodo (senza suffisso, salvo considerSuffix).
 */
function ENODE_getName(node, considerSuffix) {
	const nameWithSuffix = $(node).find(">.name").text();
	if (considerSuffix) {
		return nameWithSuffix;
	} else {
		return nameWithSuffix.match(/[^_]*/)[0];
	}
}

/**
 * Imposta il nome del nodo scrivendo il testo nell'elemento figlio .name.
 * @param {ENode} node - Il nodo ENODE.
 * @param {string|number} newName - Il nuovo nome.
 */
function ENODE_setName(node, newName) {
	$(node).find(">.name").text(newName);
}

/**
 * Aggiunge al nodo un nuovo role (div.role) con il data-type e la classe
 * indicati; da usare quando si crea una nuova funzione o definizione.
 * @param {ENode} node - Il nodo ENODE a cui aggiungere il role.
 * @param {string} [dataType] - Valore per l'attributo data-type del nuovo role.
 * @param {string} [roleClass] - Classe del role; default 'ol_role' (adatta alle chiamate di funzione).
 * @param {string} [content] - Contenuto HTML iniziale del role; default ''.
 * @returns {JQuery} Il nuovo role appena aggiunto.
 */
function ENODE_addRole(node, dataType, roleClass, content) {
	let $newNode;
	if (content == undefined) { content = '' }//default content = ''
	if (roleClass == undefined) { roleClass = 'ol_role' }//default ol_role ok for function calls
	$newNode = $('<div class="role">' + content + "</div>").attr(
		"data-type", dataType); //data() e' un casino
	$newNode.addClass(roleClass);
	$(node).append($newNode);
	return $newNode;
} //da usare quando si crea una nuova funzione o definizione

/**
 * Calcola i target validi per il drop di un ENODE: #canvasRole e tutti i role
 * visibili del canvas in cui il drop è possibile (direttamente o previo wrap,
 * secondo canDraggedBeDroopedInRoleYesWrapNo), escluso il role di provenienza.
 * @param {JQuery} $ENODEdragged - L'ENODE trascinato.
 * @returns {JQuery} I role (e/o #canvasRole) validi come destinazione.
 */
function validTargetsFromOpened($ENODEdragged) {

	const valids = $('#canvasRole, #canvasRole [class*="_role"]:visible').filter(function(i,e){
		return canDraggedBeDroopedInRoleYesWrapNo($ENODEdragged,$(this))!='no'})

	return valids.not($ENODEdragged.parent());
}

function canDraggedBeDroopedInRoleYesWrapNo($ENODEdragged,$role){
	//******target is OPENED and there is space for another
	if(!ENODEtiedDef($role[0]) && isTherePlaceForAnother($role) ){  
		if( typeOk($ENODEdragged, $role)){//datatype is compatible
			return 'yes'
		}
		else{
			return 'needsWrap'
		}
	}
	//******target is CLOSED 
	else if(ENODEparent($role).attr('data-enode')=='and' &&
			$ENODEdragged.is("[data-proto=asymmeq]") || ENODE_getName($ENODEdragged[0]) == "true"){
			// parent is 'And' and dragged is new definition or 'true' 
			//New definition and neutral element of conjunction are properties constituent of the environment, so fundamental the environment can't work without it.	
		return 'yes'
	}
	else{
		return 'no'
	}
}

/**
 * Determina il numero di posti (min e max) accettati da un role: [1,1] per gli
 * s_role, altrimenti interpreta l'attributo data-accept ("5" oppure "min:max");
 * max = -1 significa nessun limite superiore.
 * @param {JQuery} $role - Il role da esaminare.
 * @returns {number[]} Coppia [min, max]; max vale -1 se non c'è limite superiore.
 */
function getNumOfPlaces($role) {
	//*****determine number of places********
	if ($role.hasClass("s_role")) {
		return [1, 1]; //[min,max]
	}
	let acceptString = $role.attr('data-accept')
	return attrAcceptToMinMax(acceptString)
}

/**
 * Indica se nel role c'è posto per un altro ENODE, confrontando il numero di
 * figli [data-enode] con il massimo restituito da getNumOfPlaces.
 * @param {JQuery} $role - Il role da esaminare.
 * @returns {boolean} true se c'è posto (o se il role non ha limite superiore).
 */
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

/**
 * Clona uno o più ENODE: di default il clone viene inizializzato
 * (ExtendAndInitializeTree, oggi solo icone lucchetto) e ripulito, su tutta la
 * discendenza, da id e attributi/classi da prototipo (data-proto, data-tag,
 * data-import, importStatus, hide, fundamental, CouldBeCollected).
 * @param {JQuery} $node - Il nodo (o i nodi) da clonare.
 * @param {boolean} [Extend] - Se === false salta l'inizializzazione del clone; default true.
 * @param {boolean} [removeID] - Se === false salta la pulizia di id e attributi da prototipo; default true.
 * @returns {JQuery<ENode>} Il clone (staccato dal DOM).
 */
function ENODEclone($node, Extend, removeID) {//default: Extend and RemoveID
	let $clone = $node.clone(); //clona
	let $toBeCleaned = $clone.add($clone.find("*")); //clean discendence too
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
/**
 * Cerca nella #palette il prototipo ([data-enode][data-proto]) corrispondente ai
 * criteri dati. Alcune classi (es. "ci") possono avere vari data-type; per cn/ci
 * con più candidati prova a raffinare per nome. Se non trova nulla adatta il
 * prototipo generico [data-proto=''] impostandogli data-enode, data-type e nome.
 * @param {string} className - Valore di data-enode cercato (confronto case-insensitive).
 * @param {string} [dataType] - Valore di data-type richiesto; se omesso qualsiasi tipo va bene.
 * @param {string} [selector] - Selettore jQuery aggiuntivo per filtrare i prototipi.
 * @param {string} [name] - Nome del simbolo, usato per raffinare la scelta tra più cn/ci.
 * @returns {JQuery<ENode>} Il prototipo trovato (l'ultimo, se più di uno), il prototipo generico adattato, oppure una collezione vuota se in palette non c'è alcun prototipo.
 */
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
			return ENODE_getName(this) == name;
		});
		if ($specificProto.length != 0) {
			return $specificProto.eq(0);
		} //found specific proto
		else {
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
		ENODE_setName($prototype[0], className)
		return $prototype;
	}
	return $prototypes.last(); //in case you find more prototypes
}

/**
 * Avvolge l'elemento ENODE con un'operazione, se necessario: se il genitore
 * dell'elemento è già l'operazione indicata restituisce semplicemente il
 * genitore; altrimenti delega a wrapWithOperation (clona il prototipo
 * dell'operazione, lo inserisce al posto dell'elemento e vi sposta dentro
 * l'elemento).
 * @param {JQuery} $ENODEelement - L'elemento ENODE da avvolgere.
 * @param {string} op - L'operazione (data-enode) con cui avvolgerlo.
 * @returns {JQuery} L'ENODE operazione che contiene l'elemento (il genitore esistente o il nuovo clone).
 */
function wrapIfNeeded($ENODEelement, op) {
	if (ENODEparent($ENODEelement).attr("data-enode") === op) {
		//no need to cteate external op
		return ENODEparent($ENODEelement);
	} else {
		return wrapWithOperation($ENODEelement, op);
	}
}

/**
 * Crea un'operazione esterna attorno a $ENODEelement: clona il prototipo
 * dell'operazione, lo inserisce prima dell'elemento e vi sposta dentro
 * l'elemento (o la lista di elementi adiacenti). Caso speciale op="def": usa il
 * prototipo eq/bool asimmetrico e inserisce l'espressione nel secondo membro.
 * @param {JQuery} $ENODEelement - Un elemento o una lista di elementi adiacenti da avvolgere.
 * @param {string} op - L'operazione (data-enode) con cui avvolgere, oppure "def" per una nuova definizione.
 * @returns {JQuery} Il nuovo ENODE operazione che contiene l'elemento.
 */
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
	$ENODEelement.appendTo(ENODE_getRoles($clone[0], roleSelector));
	return $clone;
}

/**
 * Se il drop richiede un wrap (canDraggedBeDroopedInRoleYesWrapNo → 'needsWrap'),
 * avvolge l'elemento da inserire in una nuova definizione (wrapWithOperation
 * "def") e restituisce come target il secondo membro della definizione;
 * altrimenti restituisce il target originale.
 * @param {JQuery} $targetNode - Il role/target su cui si vorrebbe fare il drop.
 * @param {JQuery} $toBeInserted - L'ENODE da inserire.
 * @param {boolean} [untied] - Se true la nuova definizione viene marcata .untied, altrimenti la classe viene rimossa.
 * @returns {JQuery} Il target effettivo in cui inserire: il .secondMember della nuova definizione oppure $targetNode.
 */
function wrapWithDefIfNeededreturnTarget($targetNode,$toBeInserted,untied){
	
	//if(  $targetNode.is('#canvasRole') && (ENODEtiedDef( $targetNode )  || $toBeInserted.attr("data-type") !== "bool") ){
	if(  canDraggedBeDroopedInRoleYesWrapNo($toBeInserted,$targetNode)=='needsWrap' ) {
		const $newDef = wrapWithOperation($toBeInserted, "def");
		if(untied){$newDef.addClass("untied")}
		else{$newDef.removeClass("untied")}
		ExtendAndInitialize($newDef);// il contenuto è già stato esteso
		return $newDef.find(".secondMember");
	}
	else{
		return $targetNode
	}
}


/**
 * Controlla che tutti i nodi della collezione siano fratelli, cioè abbiano lo
 * stesso ENODE genitore del primo elemento.
 * @param {JQuery} $s - La collezione di nodi da verificare.
 * @returns {boolean} true se tutti i nodi hanno lo stesso ENODE genitore.
 */
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

/**
 * Restituisce il nome del simbolo con gli eventuali prefissi "-" (opposto, per
 * la classe .minus) e "/" (inverso, per la classe .inverse).
 * @param {JQuery} $ENODE - Il simbolo di cui leggere il nome.
 * @returns {string} Il nome, con prefissi "-" e/o "/" se il nodo ha le classi corrispondenti.
 */
function ENODEgetNameWithSign($ENODE) {
	//nome del simbolo con gli eventuali prefissi "-" (opposto) e "/" (inverso)
	let name = ENODE_getName($ENODE[0]);
	if ($ENODE.hasClass("minus")) {
		name = "-" + name;
	}
	if ($ENODE.hasClass("inverse")) {
		name = "/" + name;
	}
	return name;
}

/**
 * Rinomina un simbolo interpretando i prefissi "/" (inverso) e "-" (opposto):
 * i prefissi vengono tolti dal nome e tradotti nelle classi .inverse / .minus
 * (attenzione: "/" va scritto prima del "-"); aggiorna anche data-enode a "cn"
 * se il nuovo nome è numerico, "ci" altrimenti.
 * @param {JQuery} $ENODE - Il simbolo da rinominare.
 * @param {string} newName - Il nuovo nome, con eventuali prefissi "/" e "-".
 */
function ENODErename($ENODE, newName) {
	//rinomina un simbolo interpretando i prefissi "/" (inverso) e "-" (opposto)
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
	ENODE_setName($ENODE[0], newName);
	$ENODE.attr("data-enode", isNaN(newName) ? "ci" : "cn"); // se numero allora classe "cn"
}

/**
 * Crea un caso particolare da un forAll (usato nel Modus Ponens): clona il
 * forAll, mette il clone in stato .exclusiveFocus e lo inserisce accanto
 * all'originale (dopo di esso se il genitore è un 'and', altrimenti dentro un
 * nuovo spazio di deduzione creato da ENODECreateSpaceForDeduction).
 * @param {JQuery} $forall - L'ENODE forAll da cui dedurre il caso particolare.
 * @param {JQuery} [$placeHolder] - Parametro dichiarato ma non utilizzato nel corpo attuale.
 * @returns {JQuery} Il clone del forAll inserito nel DOM.
 */
function createForThis($forall, $placeHolder) {
	//Modus Ponens deduce a special case from a forall
	const $clone = ENODEclone($forall);
	$clone.addClass("exclusiveFocus"); //metti il clone in stato exclusiveFocus
	//****inserit the new proposition*****
	if (ENODEparent($forall).attr("data-enode") == "and") {
		$clone.insertAfter($forall);
	} else {
		//enclosure needed
		ENODECreateSpaceForDeduction($forall).append($clone);
	}
	return $clone;
}

/**
 * Valutazione numerica parziale ("peel the onion"): scende ricorsivamente in
 * espressioni tipo (-(/(-(a)))) accumulando segno, esponente e valore; gestisce
 * minus, m_inverse, power (solo con esponente cn), cn e ci; per gli altri
 * operatori marca il risultato come non sostituibile.
 * @param {JQuery} $currENODE - L'ENODE da valutare.
 * @param {Object} [res] - Accumulatore usato dalle chiamate ricorsive; se omesso viene inizializzato a {type:"NotAnumber", val:1, sign:1, exp:1, computedVal:NaN, canBeReplaced:true}.
 * @returns {Object} L'accumulatore aggiornato: {type, val, sign, exp, computedVal, canBeReplaced}, con computedVal = (sign*val)^exp.
 */
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
		const newRes = ENODEsToVal(ENODE_getChildren($currENODE[0]), res);
		//<------------------
		if (op === "minus") {
			res.sign = newRes.sign * -1;
		} else {
			res.exp = newRes.exp * -1;
		}
	} else if (op === "power") {
		let $exponent = ENODE_getChildren($currENODE[0], ':last');//:first child is exponent\
		if ($exponent.attr("data-enode") == "cn") {
			//------>
			let resExp = ENODEsToVal($exponent);
			//<-----
			res.exp = res.exp * resExp.val;
			let $base = ENODE_getChildren($currENODE[0], ':first');//:first child is base
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
		res.val = ENODE_getName($currENODE[0]);
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

/**
 * Operazione inversa di ENODEsToVal: da un risultato parziale {type, val, sign,
 * exp, ...} ricostruisce l'albero ENODE corrispondente, avvolgendo il simbolo
 * in minus (se sign === -1), m_inverse (se exp === -1) o power (per altri
 * esponenti diversi da 1).
 * @param {Object} partial - Risultato parziale con campi type ('cn'|'ci'), val, sign, exp.
 * @returns {JQuery} La radice del nuovo albero ENODE (staccata dal DOM).
 */
function ValToENODEs(partial) {
	let $newENODE;
	let $clone;
	let $target;
	if (partial.sign === -1) {
		//segno meno?
		$clone = ENODEclone(prototypeSearch("minus"));
		$newENODE = $clone;
		$target = ENODE_getRoles($clone[0]);
	}
	if (partial.exp === -1) {
		//inverso?
		$clone = ENODEclone(prototypeSearch("m_inverse"));
		if ($target !== undefined) {
			$target.append($clone);
		} else {
			$newENODE = $clone;
		}
		$target = ENODE_getRoles($clone[0]);
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
		ENODE_setName($exponent[0], partial.exp);
		ENODE_getRoles($clone[0], '.exponent').append($exponent);
		$target = ENODE_getRoles($clone[0], '.base');

	}
	$clone = ENODEclone(prototypeSearch(partial.type, "num", undefined, partial.val));
	ENODE_setName($clone[0], partial.val);
	$clone.attr("data-enode", partial.type); //uso un generico prototipo num e qui specifico se cn o ci
	if ($target !== undefined) {
		$target.append($clone);
	} else {
		$newENODE = $clone;
	}
	return $newENODE;
}

function ENODEneedsBracket($ENODE) {
	const ENODEclass = $ENODE.attr('data-enode')  //
	const parentClass = ENODEparent($ENODE).attr('data-enode')//
	// futuribile:
	//var parentRole = da completare per poter distinguere se in quale "role" è contenuto
	//la stringa che identifica la posizione dovrebbe diventare <ENODEtype>.<role>


	//in each row: first element needs bracket if contained in itself or one of the elements in his row
	const MatrixBaracketNeeded = [
		["plus", "times", "power"],// first container
		["times", "power"],
		["minus"],
		["m_inverse"],
		["and"],
		["or"]
	];
	//check PEMDAS order of operations 
	const ENODEclassIndex = getCol(MatrixBaracketNeeded, 0).indexOf(ENODEclass)
	if (ENODEclassIndex != -1) {
		const row = MatrixBaracketNeeded[ENODEclassIndex];
		if (row.indexOf(parentClass) != -1) {// found in matrix
			return true
		}
	}
	//check if plus timess etc.. have one or zero children
	let needMoreThanOneChild = ["plus", "times", "power"]
	if (needMoreThanOneChild.indexOf(ENODEclass) != -1 &&
		ENODE_getChildren($ENODE[0]).length < 2) {
		return true //highlight 0 or one child
	}
	return false // bracket not needed
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





/**
 * Refresh visivo completo degli ENODE: aggiorna segnaposto vuoti (refreshOneEmpty),
 * separatori infissi (refreshOneInfix), parentesi (refreshOneBracket),
 * disposizione dei times (refreshOneTimesDisp) e figli "glued" (refreshGlued).
 * Va chiamata dopo ogni modifica strutturale dell'espressione.
 * @param {JQuery} [$startNode] - Radice del refresh; se omesso o vuoto usa $("#result,#canvasAnd,#palette").
 * @param {boolean} [tree] - Se !== false il refresh include tutta la discendenza [data-enode]; se false solo i nodi passati.
 * @param {string} [options] - Sottoinsieme dei refresh da eseguire, come lettere nella stringa: 'e' empty, 'i' infix, 'b' brackets, 't' times, 'g' glued; se omesso li esegue tutti.
 * @example RefreshEmptyInfixBraketsGlued($("#canvasRole"), true, "eibgt")
 */
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

/**
 * Uguaglianza strutturale tra due ENODE: serializza entrambi in MathML
 * (ENODEcreateMathmlString) e confronta le stringhe ("flat" e paragona).
 * @param {Element} node1 - Primo nodo DOM ENODE (esteso).
 * @param {Element} node2 - Secondo nodo DOM ENODE (esteso).
 * @param {boolean} [checkType] - Se true confronta anche i data-type (serializzazione con tipi).
 * @param {boolean} [neglectRootSign] - Se true ignora il segno del nodo radice nel confronto.
 * @returns {boolean} true se le serializzazioni coincidono; false anche se uno dei nodi è undefined.
 */
function ENODEEqual(node1, node2, checkType, neglectRootSign) {
	//node1/2 HTMLnode. Flat to simil mathml e paragona
	if (node1 == undefined || node2 == undefined) {
		return false;
	}
	return (
		ENODEcreateMathmlString($(node1), checkType, neglectRootSign) ===
		ENODEcreateMathmlString($(node2), checkType, neglectRootSign)
	);
	//return adaptMatch(undefined,$(node1),$(node2),$(node2))//sostituita comparazione "grezza" con comparazione ricorsiva
}

/**
 * Confronto "shallow" tra un ENODE di input e un ENODE di pattern (cuore del
 * pattern matching): verifica in ordine le marcature (se richiesto), il
 * data-type, il data-enode e — solo per i simboli — il nome. Non scende nei figli.
 * @param {JQuery} $input - L'ENODE di input da confrontare.
 * @param {JQuery} $pattern - L'ENODE del pattern.
 * @param {boolean} [checkENODETypeAndName] - Default true; se false si ferma al confronto del data-type.
 * @param {boolean} [checkMarks] - Se true verifica prima la compatibilità delle marcature (checkMarksOkForPattern).
 * @returns {boolean} true se input e pattern sono compatibili secondo i criteri richiesti.
 */
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
		res = ENODE_getName($input[0]) === ENODE_getName($pattern[0]);
	} else {
		res = true; //no more tests required
	}
	return res;
}


/**
 * Verifica se il nodo è un contenitore associativo "inutile": con al più un
 * figlio, oppure con la stessa operazione del genitore.
 * @param {ENode} node - Il nodo ENODE da verificare.
 * @returns {boolean|undefined} true se il contenitore è inutile.
 */
function ENODE_checkIfPointlessSingleNode(node) {
	let op = $(node).attr("data-enode");
	if (!OpIsAssociative(op)) {
		return false;
	}
	if (ENODE_getChildren(node).length <= 1) {
		return true;
	}
	let opP = ENODEparent($(node)).attr("data-enode");
	if (opP == op) {
		return true;
	}
}

/**
 * Risale la struttura DOM fino a trovare l'ENODE selezionabile più vicino
 * (escludendo .undraggable e [data-undraggable]; se il nodo è tied esclude
 * anche .unselectable e .glued).
 * @param {JQuery} startElement - L'elemento di partenza.
 * @returns {JQuery} L'ENODE selezionabile più vicino (eventualmente vuoto).
 */
function ENODEselectable(startElement) {
	//risali passo passo la struttura DOM fino a trovare un elemento ENODE
	if (ENODEtiedDef(startElement)) {
		return startElement.closest('[data-enode]:not(.unselectable):not(.undraggable):not([data-undraggable]):not(.glued)');
	} else {
		return startElement.closest('[data-enode]:not(.undraggable):not([data-undraggable])');
	}
}

/**
 * Adegua l'icona del primo membro di un'equazione asimmetrica allo stato
 * untied/tied (glifo legacy: lucchetto aperto per untied, bullet per tied).
 * @param {JQuery} $ENODE - L'ENODE equazione asimmetrica (definizione).
 */
function ENODERefreshAsymmEq($ENODE) {
	// adegua l'icona allo stato untied/tied (glifo legacy: lucchetto aperto / bullet)
	const $firstMember = $ENODE.find('>.firstMember')
	$firstMember.addClass("ui-icon");
	if ($ENODE.hasClass('untied')) {
		$firstMember.addClass("ui-icon-unlocked");
		$firstMember.removeClass("ui-icon-bullet");
	} else {
		$firstMember.addClass("ui-icon-bullet");
		$firstMember.removeClass("ui-icon-unlocked");
	}
}

/**
 * Aggiunge (o rimuove) una classe CSS a tutti i nodi propri di ciascun ENODE
 * della collezione (via ENODE_getNodes: il nodo e i suoi sotto-elementi non
 * appartenenti a ENODE annidati).
 * @param {JQuery} $ENODE - Gli ENODE su cui operare.
 * @param {string} newClass - La classe da aggiungere o rimuovere.
 * @param {boolean} [mode] - Se true la classe viene rimossa anziché aggiunta.
 */
function ENODEnodesAddClass($ENODE, newClass, mode /* true = remove*/) {
	if (!mode) {
		$ENODE.each(function () {
			ENODE_getNodes(this).addClass(newClass);
		});
	} else {
		$ENODE.each(function () {
			ENODE_getNodes(this).removeClass(newClass);
		});
	}
}

/**
 * Applica una funzione a tutti i discendenti [data-enode] di $StartENODE
 * (e, se richiesto, anche alla radice), passando a ciascuno fino a tre
 * parametri aggiuntivi: funct($ENODE, parameterA, parameterB, parameterC).
 * @param {JQuery} $StartENODE - La radice del sottoalbero.
 * @param {boolean} includeRoot - Se true la funzione viene applicata anche a $StartENODE.
 * @param {function(JQuery, *, *, *): void} funct - La funzione da applicare a ogni ENODE.
 * @param {*} [parameterA] - Primo parametro aggiuntivo passato a funct.
 * @param {*} [parameterB] - Secondo parametro aggiuntivo passato a funct.
 * @param {*} [parameterC] - Terzo parametro aggiuntivo passato a funct.
 * @example ENODEapplyFunctToTree($('.selected'), true, ALDOtest, 'a', 'b', 'c')
 */
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

/************** ENODE UTILITIES  not API ***********************/

function reorderTimes($startTimes, brRemove) {
	//select a times ENODE
	//reorderTimes($('.selected'))  
	//reorderTimes($('.selected'),true)  te remove br
	try {

		let role = ENODE_getRoles($startTimes[0])[0];
		$(role).find('br').remove();
		if (brRemove) { return }
		let brExist = false;
		let numeratorFound = false;
		let childrenArr = ENODE_getChildren($startTimes[0]).toArray()
		/**metti i reciproci al per ultimi preceduti da br */
		for (let i = 0; childrenArr[i]; i++) {
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

/**
 * Restituisce il tool di default: il primo elemento [data-defaultprop] oppure,
 * se non esiste un elemento esplicitamente marcato come default, il primo [data-tag].
 * @returns {JQuery} Il tool di default (eventualmente vuoto).
 */
function getDefaultTool(){
	let $defaultTool = $('[data-defaultprop]').first();
	if($defaultTool.length==0){//se non si trova un elemnto esplicitamente marcato come default
		$defaultTool = $('[data-tag]').first()//utilizza il primo dei tool;
	}
	return $defaultTool;
}
