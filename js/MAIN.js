//************************Init*******************************
let GLBsettings
let GLBtool =''
let debugMode = false
//debug,normal
let tela = document.getElementById('telaRole');
let exclusiveFocus
let sorting = false;
//usato solo per gestire gli eventi di dragover
//************ inizializza UNDO  ************
ssnapshot()
//inizializza snapshot manager che gestisce UNDO
//***********************
//all elements that can be dragged around are initiated by making their container Sortable
let sortablesSelectorString = '.ul_role,.ol_role,.s_role:not(.unsortable),.bVar_role'
let sortablesExcluded = '[data-atom=minus]>*,[data-atom=m_inverse]>*,[data-atom=not]>*'
//glued
MNODEextend($('body'), true);
//************ Preload  ************
//preload will extend new atoms 
let preloadPath = window.location.href.split('preloadPath=')[1]
if (!preloadPath) {
	preloadPath = './Data/Preload/preload.json'
}
preloadAll(preloadPath);
//initialize lock icons??
RefreshEmptyInfixBraketsGlued();
ssnapshot.take();
document.addEventListener("click", clickHandler);
document.addEventListener("dblclick", dblclickHandler);
//document.querySelectorAll('[data-atom]').forEach(function(i,e){ refreshAsymmEq($(e))})
//***********************************************************
$(document).on('mousedown', MakeSortableAndInjectMouseDown);
$(document).on('touchstart', MakeSortableAndInjectMouseDown);
$(document).on('mouseup', MouseUpCleanup);
$(document).on('touchend', MouseUpCleanup);//not tested


$(document).on('keydown', function(e) {
	var keyPressed = keyToCharacter(e.which).toLowerCase();
	console.log('key pressed:' + keyPressed + ' code: ' + e.which)
	
	if (e.which == 16 || e.which == 17){}//console.log("filter ctrl and Maiusc if alone")
	//TAB 
	else if(keyPressed === '\t'){
		changeTool();}// change tool
	//ctrl+a 
	else if (e.ctrlKey && (keyPressed === 'a')) {
		$('#telaRole *').removeClass('selected');
		$('#telaRole>[data-atom]').addClass('selected');
		// select all: all the atoms in telaRole
	}//ctrl+c
	else if (e.ctrlKey && (keyPressed === 'c')) {
		ssnapshot.copy();
		console.log("control + c")
	}//ctrl+v
	else if (e.ctrlKey && (keyPressed === 'v')) {
		ssnapshot.paste();
		console.log("control + v")
		RefreshEmptyInfixBraketsGlued();
	}//ctrl+z
	else if (e.ctrlKey && (keyPressed === 'z')) {
		ssnapshot.undo();
		console.log("control + z")
	}//ctrl+x
	else if (e.ctrlKey && (keyPressed === 'x')) {
		ssnapshot.copy();
		cancelSelected();
		console.log("control + x")
	}//auto create function definition
	else if (e.ctrlKey && (keyPressed === 'b')) { //baptize
		MNODECreateDefinition($('.selected')[0])
		console.log("control + b")
	}//canc or del  code of "cancel" = 46 code of "del" = 8
	else if (e.which === 46 || e.which === 8) {
		cancelSelected();
		console.log("canc or del")
	}//shift+d   toggle Debug
	else if (e.shiftKey && (keyPressed === 'd')) {
		debugToggle();
		console.log("control + d");
	}//shift+s salva contenuto (ctrl+s è già associato al salvataggio della pagina da parte del browser)
	else if (e.shiftKey && (keyPressed === 's')) {
		console.log("Shift + s")
		var $toBeSaved
		if ($('.selected').length == 0) {
			$toBeSaved = $('#telaAnd')[0].MNODE_getChildren()
		}//se nulla in particolare è selezionato salva tutto
		else {
			$toBeSaved = $('.selected')
		}
		;if ($toBeSaved.length != 0) {
			var contentString = createMathmlString($toBeSaved, true)
			var stringToBeSaved = '<math xmlns="http://www.w3.org/1998/Math/MathML">' + contentString + '</math>'
			var fileName = prompt('Save as... Attenzione: Il file verrà salvato nella cartella "Download" !! non è possibile salvare in altre cartelle')
			if (fileName !== null) {
				saveTextAsFile(stringToBeSaved, fileName + ".mml");
			}
		}
	}//shift+l load file
	else if (e.shiftKey && (keyPressed === 'l')) {
		console.log("Shift + l");
		//if(confirm("Load will overwrite existing content")){
		$('#fileToLoad').trigger('click');
		// #fileToLoad: ad esso è associato un evento vedi sotto	
		//}
	} else if($('.selected').length != 0){
		//****************applica proprietà***********
		var $selected = $('.selected')
		var PActx = newPActx();
		//code of "arrowup" = 38 
		if (e.which === 38) {
			//console.log("decompose up")
			PActx = decompose($selected, "up");
			//up for factorize
		}//code of "arrowright" = 39
		else if (e.which === 39) {
			//console.log("decompose right")
			PActx = decompose($selected, "right");
		}//code of "arrowdown" = 40 or "arrowleft" = 37 
		else if (e.which === 40 || e.which === 37) {
			//console.log("compose")
			PActx = compose($selected)
		}

		// ogni volta che si preme un tasto cerca se c'è prop applicabile
		if (!PActx.matchedTF) {

			PActx = keyboardEvToFC($selected, keyPressed);

		}
		//*************** operazioni conclusive (dopo tutti i tentativi)*******************
		PActxConclude(PActx)
	}
});

//************  Create! button **************
$('#create-link').click(function() {
	$(".selected")[0].MNODECreateDefinition()
})

//************ Help button**************
$("#help-link").click(function(event) {
	window.open('./Help/Help.html');
});
//***** auto load file after a file is choosen***************
$('#fileToLoad').change(function(e) {
	//console.log(e);
	//passa di qui dopo che l'utente ha selezionato un nuovo file, non se l'utente preme annulla
	//console.log('fileTOLoad change');
	var fileToLoad = jQuery('#fileToLoad')[0].files[0];
	var $target = $('#telaRole');
	var fileName = fileToLoad.name;
	var fileSuffix = fileName.split(".")[fileName.split(".").length - 1]
	loadFileConvert(fileToLoad, $($target[0]), fileSuffix);
	//forse la chiamata sopra è asincrona? ssnapshot scatta prima dell'effettivo caricamento
	this.value = "";//cancella il vecchio path altrimenti se carico due volte lo stesso file non si accorge del cambiamento
});

//***********************************************************

function MNODENselectable(startElement) {
	//risali passo passo la struttura DOM fino a trovare un elemento MNODE
	if (MNODEclosedDef(startElement)) {
		return startElement.closest('[data-atom]:not(.unselectable):not(.glued)');
	} else {
		return startElement.closest('[data-atom]');
	}
}

function clickHandler(event) {
	let $thisMNODE = MNODENselectable($(event.target));
	//*************** Lock unlock ********
	if ($(event.target).is('.asymmetric>.firstMember')) {
		let $atom = $(event.target).parent();
		if ($atom.is('#tela')) {
			// tela fa eccezione perchè determina lo anche lo stato delle sezioni result e events
			if(!GLBsettings.lockTela){
				GLBsettings.lockTela=true;
				$('#tela,#result,#events').removeClass('unlocked');
			} else {
				GLBsettings.lockTela=false;
				$('#tela,#result,#events').addClass('unlocked');
			}
		} else {
			$atom.toggleClass('unlocked');
		}
		refreshAsymmEq($atom);
		ssnapshot.take();
	} 
	else if($thisMNODE.hasClass('unselectable')){
		selectionManager("","","",true)//deselectAll
	}
	else if(!$thisMNODE.hasClass('unselectable')){
		selectionManager($thisMNODE,event.ctrlKey,event.shiftKey)
	}
}
function selectionManager($clickedMNODE,ctrl,shift,deselectAll){
	if(deselectAll){
		//clear selected unselected
		$('[data-atom]').removeClass('selected').removeClass('unselected');
	}
	else if (ctrl) {
		//click +ctrl on .MNODE   ---multi select---
		if ($clickedMNODE.hasClass('selected')) {
			$clickedMNODE.find('[data-atom]').removeClass('selected').removeClass('unselected');
		} else if ($clickedMNODE.closest('.selected').length != 0) {//if an ancestor is selected already, ignore click
		} else {
			$clickedMNODE.addClass('selected');
		}
	} else if (shift) {
		//click +shift on [data-atom]   ---unselect---
		if ($clickedMNODE.hasClass('selected')) {
			$clickedMNODE.removeClass('selected');
			$clickedMNODE.find('[data-atom]').removeClass('selected').removeClass('unselected');
		} else if ($clickedMNODE.hasClass('unselected')) {
			$clickedMNODE.removeClass('unselected');
			$clickedMNODE.find('[data-atom]').removeClass('selected').removeClass('unselected');
		} else if (($clickedMNODE.closest('.selected').length != 0) && ($clickedMNODE.closest('.unselected').length == 0)) {
			//se è selected, a meno che non sia unselected		

			$clickedMNODE.addClass('unselected');
			$clickedMNODE.find('[data-atom]').removeClass('selected').removeClass('unselected');
		}
	} else {
		//click on [data-atom]   ---select---

		if ($clickedMNODE.hasClass('selected')) {
			$('[data-atom]').removeClass('selected').removeClass('unselected');
			//clear selected unselected
		} else {
			$('[data-atom]').removeClass('selected').removeClass('unselected');
			//clear selected unselected
			$clickedMNODE.addClass('selected');
		}
	}
}









function dblclickHandler(event) {
	let target = MNODENselectable(event.target);
	let $atomDblclicked = $(target)
	let atomClass = $atomDblclicked.attr('data-atom');
	let closed = MNODEclosedDef($atomDblclicked)
	console.log('dblclick');
	//closed
	//******** forThis prompt ***********
	let $toBeSpecified
	if (closed && atomClass === 'ci') {
		$toBeSpecified = parameterInHeader($atomDblclicked,$identifierSpan($atomDblclicked))}
	if ($toBeSpecified && $toBeSpecified.length!=0) {
		var newVal = prompt('Specify a value')
		if (newVal != null) {
			var $newNode
			let $operation = dummyParser(newVal)
			if($operation){//dummy parser to parse x>0 etc...
				$newNode=$operation;
			}
			else{
				var type = $toBeSpecified.attr('data-type')
				$newNode = MNODEclone(prototypeSearch((isNaN(newVal)) ? "ci" : "cn"))
				$newNode[0].MNODE_setName(newVal);
				$newNode.attr('data-type', type)
			}
			forThisPar_focus_nofocus($newNode, $toBeSpecified);
			RefreshEmptyInfixBraketsGlued();
			ssnapshot.take();
		}
	}
	//******** remove "exclusiveFocus" ***********
	/*
	else if (closed && atomClass === 'forAll') {
		if ($atomDblclicked.hasClass('exclusiveFocus')) {
			$atomDblclicked.removeClass('exclusiveFocus')
			// togli exclusiveFocus
			exclusiveFocus = ""
		}
	}
	*/
	/********closed still not handled **********/
	else if (closed && atomClass === 'cn') {
		let n = Number( MNODENumericCdsAsText($atomDblclicked) );
		if(Number.isInteger(n) && n>0){
			let $plus =encaseWithOperation($atomDblclicked,'plus');
			$plus.addClass('resizable');
			$atomDblclicked.remove()
			//crea il numero 1
			var One = {type:"cn", val:1, sign:1, exp:1}
			for(i=0;i<n;i++){
				//clona atom 1
				$plus[0].MNODE_getRoles().append(ValToAtoms(One))
			}	
		}
	}
	else if ($atomDblclicked.hasClass('resizable')){
			let $role=$atomDblclicked[0].MNODE_getRoles().eq(0);
			let firstChild = $role.find('>[data-atom]')[0]
			let fcWidth = firstChild.offsetWidth
			//var fcstyle = element.currentStyle || window.getComputedStyle(firstChild);
			var fcstyle = window.getComputedStyle(firstChild);
			let fcMargins = parseFloat(fcstyle.marginLeft) + parseFloat(fcstyle.marginRight)
			let n_columns = Math.floor( $role[0].offsetWidth/(fcWidth+fcMargins) )
			let n_children = $atomDblclicked[0].MNODE_getChildren().length
			if(n_children % n_columns == 0){
				let n_rows = n_children / n_columns;
				console.log('decoposed!!!')
				encaseIfNeeded($atomDblclicked,'times')
				let $factor_r = ValToAtoms({type:"cn", val:n_rows, sign:1, exp:1})
				let $factor_c = ValToAtoms({type:"cn", val:n_columns, sign:1, exp:1})
				let $factors = $factor_r.add($factor_c); 
				$atomDblclicked.replaceWith($factors);
				$atomDblclicked.hasClass('resizable');
				$role.css('width', '');
				$role.css('height', '');
								
			}
			else{
				//sum in one numeber
				let $composed = ValToAtoms({type:"cn", val:n_children, sign:1, exp:1})
				$atomDblclicked.replaceWith($composed)
			}
	}//closed or opened
	//******** expand collapse ***********
	else if (atomClass === 'deftrue') {
		$atomDblclicked.toggleClass('expanded');
	} else if (atomClass != 'ci' && atomClass != 'cn' && atomClass != 'plus') {
		$atomDblclicked.toggleClass('collapsed');
		//??todo: uniformare con expanded
	}//opened
	//******** dblclick on ci ***********
	else if (!closed && (atomClass == 'ci' || atomClass == 'cn')) {
		MNODErenamePrompt($atomDblclicked);
	}

}

function refreshAsymmEq($atom) {
	// adegua l'icona del lucchetto allo stato unlocked/non unlocked
	var $firstMember = $atom.find('>.firstMember')
	$firstMember.addClass("ui-icon");
	if ($atom.hasClass('unlocked')) {
		$firstMember.addClass("ui-icon-unlocked");
		$firstMember.removeClass("ui-icon-bullet");
	} else {
		$firstMember.addClass("ui-icon-bullet");
		$firstMember.removeClass("ui-icon-unlocked");
	}
}

function keyToCharacter(key) {
	if (key === 37) {
		return "←"
	} else if (key === 38) {
		return "↑"
	} else if (key === 39) {
		return "→"
	} else if (key === 40) {
		return "↓"
	} else {
		return String.fromCharCode(key)
	}
}

function refreshAndReplace(PActx) {
	console.log("Applied property: " + PActx.msg)
	//**** determina l'operazione più esterna su cui fare il refresh
	var $toBeRefreshed

	if (PActx.replacedAlready == true) {
		// sostituzione già effettuano internamente alla proprietà
		$toBeRefreshed = MNODEparent(PActx.$transform)
	} else {
		$toBeRefreshed = MNODEparent(PActx.$operand)
		PActx.$transform.insertBefore(PActx.$operand[0]);
		PActx.$operand.remove()
		//********select on exit
		//$('*').removeClass('selected')
		//$(PActx.$transform[0]).addClass('selected')	
	}
	//********Refresh***************

	if ($toBeRefreshed !== undefined && $toBeRefreshed.length != 0) {

		RefreshEmptyInfixBraketsGlued();
	}
	return PActx
}

function debugToggle() {
	debugMode = !debugMode
	//toggle debugMode
	if (debugMode) {
		$('#telaRole').addClass('debug');
		$('#tavolozza').addClass('hidden');
	} else {
		$('#telaRole').removeClass('debug');
		$('#tavolozza').removeClass('hidden');
	}
}

function ExtendAndInitializeTree($startElement){
    MNODEapplyFunctToTree($startElement,true,ExtendAndInitialize)
}

function ExtendAndInitialize($Atom){
	MNODEextend($Atom, true)
	//initialize lock icon
	if($Atom.is('[data-atom].asymmetric')){
		refreshAsymmEq($Atom)
	}
}



function cancelSelected() {
	toBeCancelled = $('.selected').filter(function(index) {
		return !MNODEclosedDef(this);
	})
	if (toBeCancelled.length != 0) {
		toBeCancelled.each(function(i, element) {
			$(element).remove()
		});
		RefreshEmptyInfixBraketsGlued();
		ssnapshot.take();
	}
}

function swapElements(obj1, obj2) {
	// create marker element and insert it where obj1 is
	var temp = document.createElement("div");
	obj1.parentNode.insertBefore(temp, obj1);

	// move obj1 to right before obj2
	obj2.parentNode.insertBefore(obj1, obj2);

	// move obj2 to right before where obj1 used to be
	temp.parentNode.insertBefore(obj2, temp);

	// remove temporary marker node
	temp.parentNode.removeChild(temp);
}

function PActxConclude(PActx) {
	if (PActx.matchedTF == true) {
		//********** Post *************
		refreshAndReplace(PActx);
		if (PActx.$transform) {
			RefineRepeatedOfMArked(PActx);
			$children = MNODEcleanIfPointless(PActx.$transform, true);
			if ($children) {
				//in case the $transform "dissolved" you need to consider his child 
				PActx.$transform = $children
			}
		}
		ssnapshot.take();
		RefreshEmptyInfixBraketsGlued($('body'),true);
		lookForResultAndCelebrate();
		PActxVisualize(PActx);
	}
}

function PActxVisualize(PActx) {
	let visContet
	if (!PActx.visualization ) {
		visContet = PActx.msg
	} else {
		visContet = '<img src="' + PActx.visualization + '">';
	}
	removeVisualization()
	let $visualization = $('<div class="visualization">' + visContet + '</div>')
	if (PActx.$transform) {
		$visualization.insertAfter(PActx.$transform)
		PActx.$transform.append($visualization);
	} else {
		$(tela).append($visualization)
		$visualization.css('position', 'relative');
		$visualization.css('top', '0px');
	}
	setTimeout(removeVisualization, 3000);
}

function removeVisualization() {
	$('.visualization').remove()
}

const tools = ["", "copy", "autoAdapt"];
function changeTool(){
	let currToolIndex = tools.indexOf(GLBtool)
	let newToolIndex = ((currToolIndex + 1) % tools.length)// start over when the list is over
	GLBtool = tools[newToolIndex]//update tool in GLB
	$('body').attr('tool',GLBtool);//update tool as class of <body> 
    console.log('GLBtool<='+ GLBtool)
}