function MNODEfactorizeMinus($startNode) {
	//translate from (-(a)) to (-1)(a)
	//**** condizioni necessarie per applicare la funzione *****
	if ($startNode.attr("data-atom") !== "minus") {
		return
	}
	//è circondato un meno?
	$extOp = encaseIfNeeded($startNode, "times");
	//se necessario crea una operazione container
	//aggiungi un fattore "-1"
	var prototype = prototypeSearch("ci", "num");
	var prototypeMinus = prototypeSearch("minus");
	var $clone = MNODEclone(prototype);
	var $cloneMinus = MNODEclone(prototypeMinus);
	$clone.attr('data-atom', 'cn');
	$clone[0].MNODE_setName("1");
	$cloneMinus.insertAfter($startNode);
	$cloneMinus[0].MNODE_getRoles().append($clone);
	$startNode[0].MNODE_dissolveContainer()
	//remove minus from $startNode  
	refreshInfix($extOp);
	RefreshEmptyInfixBraketsGlued($('body'));
	ssnapshot.take();
}

function signsAsClassesSubtree($startNode, mode) {
	//trova tutti i sotto nodi
	$startNode.find('[data-atom]').each(function(index) {
		// tutti gli HTML nodes con classe .MNODE
		signsAsClasses($(this), mode);
	})
}

function signsAsClasses($atom, mode /* SignsInNames_to_SignsAsClasses SignsAsClasses_to_SignsInNames SignsAsClasses_to_MinusOp MinusOp_to_SignsAsClasses*/
) {
	// <>-a<> to <class="minus">a<>
	// nota: non possono coesistere segni meno all'interno del nome e "minus" come classi
	var name = $atom[0].MNODE_getName()
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
			encaseWithOperation($atom, "minus")
		}
	} else if (mode == "MinusOp_to_SignsAsClasses") {
		var $MNODEchildren = $atom[0].MNODE_getRoles().children().filter('[data-atom]')
		if ($atom.attr('data-atom') === "minus" && $MNODEchildren.length == 1) {
			// i minus che hanno un solo children
			$atom[0].MNODE_dissolveContainer();
			$MNODEchildren.filter(':first').addClass('minus');
		}
	}

	$atom[0].MNODE_setName(name);
	$atom.attr("data-atom", (isNaN(name)) ? "ci" : "cn")
	// se numero allora classe "cn"
}

//**** glued
var glueFunctions = ["minus", "m_inverse", "not"]
function refreshGlued($startNode) {
	//marca con classe glued gli atomi contenuti in un "minus" ecc..
	//get starting point
	if ($startNode == undefined) {
		$containerNode = $("#canvasRole");
	} else {
		$containerNode = MNODEparent($startNode);
	}
	//Clear previous Glued
	$containerNode.find(".glued").removeClass("glued")
	//search for Gluing elements
	//
	//var $stickyParents = $containerNode.parent().find( "[data-atom='"+ glueFunctions[j] +"']" );
	var $stickyParents = $containerNode.parent().find("[data-atom]").filter(function(i, e) {
		let op = e.getAttribute("data-atom");
		if (glueFunctions.indexOf(op) != -1) {
			return true
		} else if (op = 'eq' && e.classList.contains('asymmetric')) {
			return true
		}
	});

	$stickyParents.each(function(i, val) {
		var $toBeGlued = this.MNODE_getRoles().children().filter('[data-atom]');
		//get the MNODE contained to be Glued
		$toBeGlued.addClass('glued')
		/*if( $toBeGlued.length == 1){
						$toBeGlued[0].MNODE_getNodes().addClass("glued");	
					}*/

	});

	var $stickyParents = $containerNode.find("[data-atom=eq].asymmetric:not(#canvas)");
	$stickyParents.each(function(i, val) {
		var $toBeGlued = this.MNODE_getRoles().children().filter('[data-atom]');
		//get the MNODE contained to be Glued
		if ($toBeGlued.length == 1) {
			$toBeGlued[0].MNODE_getNodes().addClass("glued");
		}
	});
}

/*
function MNODEtranslateFormat(mode,$startNode,applyToSubtreeAlso){//translate from (-a) minus as class to (-1)(a)
    //todo: implementare applyToSubtreeAlso
    //**** condizioni necessarie per applicare la funzione *****
    if(  $startNode.attr("data-type") !=="num" ){return} //deve essere di tipo numerico
	if(  $startNode.attr("data-atom") == "cn" &&  $startNode[0].MNODE_getName() === "1" ){return} // se 1 o -1 non vascomposto ulteriormente
    if($startNode.hasClass('minus')){
        var op = "times";
		$extOp = encaseIfNeeded($startNode,op);//se necessario crea una operazione container
		var prototype=prototypeSearch("ci","num");//aggiungi un fattore "-1"
		$clone = MNODEclone(prototype);
		$clone.attr('data-atom','cn');
		$clone[0].MNODE_setName("1");
		$clone.addClass('minus');
		$clone.insertAfter($startNode);
		$startNode.removeClass('minus');//togli il segno meno dall'elemento da scomporre
		refreshInfix($extOp);
		ssnapshot.take();
	}

}
*/
