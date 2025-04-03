function enodefactorizeMinus($startNode) {
	//translate from (-(a)) to (-1)(a)
	//**** condizioni necessarie per applicare la funzione *****
	if ($startNode.attr("data-enode") !== "minus") {
		return
	}
	//è circondato un meno?
	$extOp = wrapIfNeeded($startNode, "times");
	//se necessario crea una operazione container
	//aggiungi un fattore "-1"
	var prototype = prototypeSearch("ci", "num");
	var prototypeMinus = prototypeSearch("minus");
	var $clone = enodeclone(prototype);
	var $cloneMinus = enodeclone(prototypeMinus);
	$clone.attr('data-enode', 'cn');
	$clone[0].enode_setName("1");
	$cloneMinus.insertAfter($startNode);
	$cloneMinus[0].enode_getRoles().append($clone);
	$startNode[0].enode_dissolveContainer()
	//remove minus from $startNode  
	refreshInfix($extOp);
	RefreshEmptyInfixBraketsGlued($('body'));
	ssnapshot.take();
}

function signsAsClassesSubtree($startNode, mode) {
	//trova tutti i sotto nodi
	$startNode.find('[data-enode]').each(function(index) {
		// tutti gli HTML nodes con classe .enode
		signsAsClasses($(this), mode);
	})
}

function signsAsClasses($enode, mode /* SignsInNames_to_SignsAsClasses SignsAsClasses_to_SignsInNames SignsAsClasses_to_MinusOp MinusOp_to_SignsAsClasses*/
) {
	// <>-a<> to <class="minus">a<>
	// nota: non possono coesistere segni meno all'interno del nome e "minus" come classi
	var name = $enode[0].enode_getName()
	if (mode == "SignsInNames_to_SignsAsClasses") {
		if (name[0] === "/") {
			name = name.substr(1)
			//nome privato del segno meno
			$enode.addClass('inverse')
		}// attenzione: / va inserito prima del meno
		else {
			$enode.removeClass('inverse')
		}
		if (name[0] === "-") {
			name = name.substr(1)
			//nome privato del segno meno
			$enode.addClass('minus')
		}//todo: cosa succede se input = ---2  ?
		else {
			$enode.removeClass('minus')
		}

	} else if (mode == "SignsAsClasses_to_SignsInNames") {
		if ($enode.hasClass('minus')) {
			name = "-" + name;
			$enode.removeClass('minus');
		}
		if ($enode.hasClass('inverse')) {
			name = "/" + name;
			$enode.removeClass('inverse');
		}
	}
	else if (mode == "SignsAsClasses_to_MinusOp") {
		if ($enode.hasClass('minus')) {
			$enode.removeClass('minus');
			wrapWithOperation($enode, "minus")
		}
	} else if (mode == "MinusOp_to_SignsAsClasses") {
		var $enodechildren = $enode[0].enode_getRoles().children().filter('[data-enode]')
		if ($enode.attr('data-enode') === "minus" && $enodechildren.length == 1) {
			// i minus che hanno un solo children
			$enode[0].enode_dissolveContainer();
			$enodechildren.filter(':first').addClass('minus');
		}
	}

	$enode[0].enode_setName(name);
	$enode.attr("data-enode", (isNaN(name)) ? "ci" : "cn")
	// se numero allora classe "cn"
}

/**
 * Array di funzioni che richiedono l'effetto "glued" sui loro elementi figli
 * Include operatori come minus, m_inverse, not
 */
var glueFunctions = ["minus", "m_inverse", "not"];

/**
 * Aggiorna gli elementi che devono essere "incollati" (glued) nel DOM
 * @param {jQuery|undefined} $startNode - Nodo di partenza opzionale
 */
function refreshGlued($startNode) {
    // Determina il nodo contenitore da cui iniziare la ricerca
    const $containerNode = $startNode ? enodeparent($startNode) : $("#canvasRole");
    
    // Rimuove la classe "glued" da tutti gli elementi precedentemente marcati
    $containerNode.find(".glued").removeClass("glued");
    
    // Trova tutti gli elementi con attributo data-enode che corrispondono ai criteri
    const $stickyParents = $containerNode.parent().find("[data-enode]").filter(function(i, element) {
        const operatorType = element.getAttribute("data-enode");
        
        // Verifica se l'operatore è nella lista delle funzioni "glued"
        if (glueFunctions.indexOf(operatorType) !== -1) {
            return true;
        } 
        // Verifica se è un'equazione asimmetrica
        else if (operatorType === 'eq' && isDefinition(element)) {
            return true;
        }
        return false;
    });
    
    // Applica la classe "glued" ai figli degli elementi trovati
    $stickyParents.each(function() {
        const $toBeGlued = this.enode_getRoles().children().filter('[data-enode]');
        $toBeGlued.addClass('glued');
    });
}
