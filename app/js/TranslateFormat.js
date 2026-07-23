function ENODEfactorizeMinus($startNode) {
	//translate from (-(a)) to (-1)(a)
	//**** condizioni necessarie per applicare la funzione *****
	if ($startNode.attr("data-enode") !== "minus") {
		return
	}
	//è circondato un meno?
	let $extOp = wrapIfNeeded($startNode, "times");
	//se necessario crea una operazione container
	//aggiungi un fattore "-1"
	const prototype = prototypeSearch("ci", "num");
	const prototypeMinus = prototypeSearch("minus");
	const $clone = ENODEclone(prototype);
	const $cloneMinus = ENODEclone(prototypeMinus);
	$clone.attr('data-enode', 'cn');
	ENODE_setName($clone[0], "1");
	$cloneMinus.insertAfter($startNode);
	ENODE_getRoles($cloneMinus[0]).append($clone);
	ENODE_dissolveContainer($startNode[0])
	//remove minus from $startNode  
	RefreshEmptyInfixBraketsGlued($('body'));//rinfresca anche gli infix di $extOp
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
	let name = ENODE_getName($ENODE[0])
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
		const $ENODEchildren = ENODE_getRoles($ENODE[0]).children().filter('[data-enode]')
		if ($ENODE.attr('data-enode') === "minus" && $ENODEchildren.length == 1) {
			// i minus che hanno un solo children
			ENODE_dissolveContainer($ENODE[0]);
			$ENODEchildren.filter(':first').addClass('minus');
		}
	}

	ENODE_setName($ENODE[0], name);
	$ENODE.attr("data-enode", (isNaN(name)) ? "ci" : "cn")
	// se numero allora classe "cn"
}

/**
 * Array di funzioni che richiedono l'effetto "glued" sui loro elementi figli
 * Include operatori come minus, m_inverse, not
 */
const glueFunctions = ["minus", "m_inverse", "not"];

/**
 * Aggiorna gli elementi che devono essere "incollati" (glued) nel DOM:
 * rimuove la classe `glued` dagli elementi precedentemente marcati e la
 * riapplica ai figli ENODE degli operatori elencati in `glueFunctions`
 * (minus, m_inverse, not).
 * Usata da `ExpressionManager.js`.
 * @param {JQuery} [$startNode] nodo di partenza opzionale: se fornito il
 *   contenitore di lavoro è il suo parent ENODE, altrimenti `#canvasRole`
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
        const $toBeGlued = ENODE_getRoles(this).children().filter('[data-enode]');
        $toBeGlued.addClass('glued');
    });
}
