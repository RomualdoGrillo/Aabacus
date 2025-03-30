function exprNodefactorizeMinus($startNode) {
	//translate from (-(a)) to (-1)(a)
	//**** condizioni necessarie per applicare la funzione *****
	if ($startNode.attr("data-atom") !== "minus") {
		return
	}
	//è circondato un meno?
	$extOp = wrapIfNeeded($startNode, "times");
	//se necessario crea una operazione container
	//aggiungi un fattore "-1"
	var prototype = prototypeSearch("ci", "num");
	var prototypeMinus = prototypeSearch("minus");
	var $clone = exprNodeclone(prototype);
	var $cloneMinus = exprNodeclone(prototypeMinus);
	$clone.attr('data-atom', 'cn');
	$clone[0].exprNode_setName("1");
	$cloneMinus.insertAfter($startNode);
	$cloneMinus[0].exprNode_getRoles().append($clone);
	$startNode[0].exprNode_dissolveContainer()
	//remove minus from $startNode  
	refreshInfix($extOp);
	RefreshEmptyInfixBraketsGlued($('body'));
	ssnapshot.take();
}

function signsAsClassesSubtree($startNode, mode) {
	//trova tutti i sotto nodi
	$startNode.find('[data-atom]').each(function(index) {
		// tutti gli HTML nodes con classe .exprNode
		signsAsClasses($(this), mode);
	})
}

function signsAsClasses($atom, mode /* SignsInNames_to_SignsAsClasses SignsAsClasses_to_SignsInNames SignsAsClasses_to_MinusOp MinusOp_to_SignsAsClasses*/
) {
	// <>-a<> to <class="minus">a<>
	// nota: non possono coesistere segni meno all'interno del nome e "minus" come classi
	var name = $atom[0].exprNode_getName()
	if (mode == "SignsInNames_to_SignsAsClasses") {
		if (name[0] === "/") {
			name = name.substr(1)
			//nome privato del segno meno
			$atom.addClass('inverse')
		}// attenzione: / va inserito prima del meno
		else {
			$atom.removeClass('inverse')
		}
		if (name[0] === "-") {
			name = name.substr(1)
			//nome privato del segno meno
			$atom.addClass('minus')
		}//todo: cosa succede se input = ---2  ?
		else {
			$atom.removeClass('minus')
		}

	} else if (mode == "SignsAsClasses_to_SignsInNames") {
		if ($atom.hasClass('minus')) {
			name = "-" + name;
			$atom.removeClass('minus');
		}
		if ($atom.hasClass('inverse')) {
			name = "/" + name;
			$atom.removeClass('inverse');
		}
	}
	else if (mode == "SignsAsClasses_to_MinusOp") {
		if ($atom.hasClass('minus')) {
			$atom.removeClass('minus');
			wrapWithOperation($atom, "minus")
		}
	} else if (mode == "MinusOp_to_SignsAsClasses") {
		var $exprNodechildren = $atom[0].exprNode_getRoles().children().filter('[data-atom]')
		if ($atom.attr('data-atom') === "minus" && $exprNodechildren.length == 1) {
			// i minus che hanno un solo children
			$atom[0].exprNode_dissolveContainer();
			$exprNodechildren.filter(':first').addClass('minus');
		}
	}

	$atom[0].exprNode_setName(name);
	$atom.attr("data-atom", (isNaN(name)) ? "ci" : "cn")
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
    const $containerNode = $startNode ? exprNodeparent($startNode) : $("#canvasRole");
    
    // Rimuove la classe "glued" da tutti gli elementi precedentemente marcati
    $containerNode.find(".glued").removeClass("glued");
    
    // Trova tutti gli elementi con attributo data-atom che corrispondono ai criteri
    const $stickyParents = $containerNode.parent().find("[data-atom]").filter(function(i, element) {
        const operatorType = element.getAttribute("data-atom");
        
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
        const $toBeGlued = this.exprNode_getRoles().children().filter('[data-atom]');
        $toBeGlued.addClass('glued');
    });
}
