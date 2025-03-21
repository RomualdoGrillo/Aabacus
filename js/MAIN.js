//************************Init*******************************
let GLBsettings
let debugMode = false
//debug,normal
let canvas = document.getElementById('canvasRole');
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
	preloadPath = './Data/Preload/PRELOAD.mmls'
}
preloadAll(preloadPath);//ATTENTION contains asinchronous functions
//initialize lock icons??
//RefreshEmptyInfixBraketsGlued();
ssnapshot.take();
document.addEventListener("click", clickHandler);
document.addEventListener("dblclick", dblclickHandler);
//document.querySelectorAll('[data-atom]').forEach(function(i,e){ refreshAsymmEq($(e))})
//***********************************************************
$(document).on('mousedown', MakeSortableAndInjectMouseDown);
$(document).on('touchstart', MakeSortableAndInjectMouseDown);
$(document).on('mouseup', MouseUpCleanup);
$(document).on('touchend', MouseUpCleanup);//not tested


$(document).on('keydown', function (e) {
	var keyPressed = keyToCharacter(e.which).toLowerCase();
	console.log('key pressed:' + keyPressed + ' code: ' + e.which)

	if (e.which == 16 || e.which == 17) { }//console.log("filter ctrl and Maiusc if alone")
	//TAB 
	else if (keyPressed === '\t') {
		changeTool();
	}// change tool
	//ctrl+a 
	else if (e.ctrlKey && (keyPressed === 'a')) {
		$('#canvasRole *').removeClass('selected');
		$('#canvasRole>[data-atom]').addClass('selected');
		// select all: all the atoms in canvasRole
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
		let fileExtension
		let stringToBeSaved

		if ($('.selected').length == 0) {//se nulla in particolare è selezionato salva tutto
			stringToBeSaved = AlltoMMLSstring();
			fileExtension = '.mmls';
		}
		else {
			let $toBeSaved = $('.selected');
			$('.selected').removeClass('selected');
			let contentString = MNODEcreateMathmlString($toBeSaved, true);
			stringToBeSaved = '<math xmlns="http://www.w3.org/1998/Math/MathML">' + contentString + '</math>';
			fileExtension = '.mml';
		}
		; if (stringToBeSaved) {
			var fileName = prompt('Save as... Attenzione: Il file verrà salvato nella cartella "Download" !! non è possibile salvare in altre cartelle', 'noname')
			if (fileName !== null) {
				saveTextAsFile(stringToBeSaved, fileName + fileExtension);
			}
		}
	}//shift+l load file
	else if (e.shiftKey && (keyPressed === 'l')) {
		console.log("Shift + l");
		//if(confirm("Load will overwrite existing content")){
		$('#fileToLoad').trigger('click');
		// #fileToLoad: ad esso è associato un evento vedi sotto	
		//}
	} else if ($('.selected').length != 0) {
		//****************applica proprietà***********
		var $selected = $('.selected')
		var PActx = newPActx();

		PActx = keyboardEvToFC($selected, keyPressed, e);

		//*************** operazioni conclusive (dopo tutti i tentativi)*******************
		cleanupDnD()
		PActxConclude(PActx)
	}
});


//************ Help button**************
$("#help-link").click(function (event) {
	window.open('./Help/Help.html');
});
//***** auto load file after a file is choosen***************
$('#fileToLoad').change(function (e) {
	//console.log(e);
	//passa di qui dopo che l'utente ha selezionato un nuovo file, non se l'utente preme annulla
	//console.log('fileTOLoad change');
	var fileToLoad = jQuery('#fileToLoad')[0].files[0];
	var $target = $('#canvasRole');
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
	//*************** Lock unlock ********
	if ($(event.target).parent().is(function() { return isDefinition(this); }) && $(event.target).is('.firstMember')) {
		let $atom = $(event.target).parent();
		if ($atom.is('#canvas')) {
			// canvas fa eccezione perchè determina anche lo stato delle sezioni result e events
			if (!GLBsettings.lockCanvas) {
				GLBsettings.lockCanvas = true;
				$('#canvas,#result,#events').removeClass('unlocked');
			} else {
				GLBsettings.lockCanvas = false;
				$('#canvas,#result,#events').addClass('unlocked');
			}
		} else {
			$atom.toggleClass('unlocked');
		}
		refreshAsymmEq($atom);
		ssnapshot.take();
	}

}
function selectionManager($clickedMNODE, ctrl, shift, deselectAll) {
	if (deselectAll) {
		//clear selected unselected
		$('[data-atom]').removeClass('selected').removeClass('unselected');
	}
	//***selection of declared "yellow" tool
	else if (($clickedMNODE.attr('data-atom') == 'forAll' || $clickedMNODE.attr('data-atom') == 'eq' || $clickedMNODE.attr('data-tag'))
		&& $clickedMNODE.attr('data-tag')
		&& GLBsettings.tool == "declare") {
		//solo se è effettivamente una proprietà e non un container
		if ($clickedMNODE.hasClass('selectedTool')) {
			$clickedMNODE.removeClass('selectedTool')
		}
		else {
			$('[data-atom]').removeClass('selectedTool')
			$clickedMNODE.addClass('selectedTool');
			console.log('Selected tool: ' + $clickedMNODE.attr('data-tag'))
		}
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
		$toBeSpecified = parameterInHeader($atomDblclicked, $identifierSpanForAll($atomDblclicked))
	}
	if ($toBeSpecified && $toBeSpecified.length != 0) {
		var newVal = prompt('Specify a value')
		if (newVal != null) {
			var $newNode
			let $operation = dummyParser(newVal)
			if ($operation) {//dummy parser to parse x>0 etc...
				$newNode = $operation;
			}
			else {
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
	/*
	else if (closed && atomClass === 'cn') {
		let n = Number( MNODENumericCdsAsText($atomDblclicked) );
		if(Number.isInteger(n) && n>0){
			let $plus =wrapWithOperation($atomDblclicked,'plus');
			$plus.attr('data-vis','resizable');
			$atomDblclicked.remove()
			//crea il numero 1
			var One = {type:"cn", val:1, sign:1, exp:1}
			for(i=0;i<n;i++){
				//clona atom 1
				$plus[0].MNODE_getRoles().append(ValToAtoms(One))
			}	
		}
	}
	else if ($atomDblclicked.is('[data-vis=resizable]')){
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
				wrapIfNeeded($atomDblclicked,'times')
				let $factor_r = ValToAtoms({type:"cn", val:n_rows, sign:1, exp:1})
				let $factor_c = ValToAtoms({type:"cn", val:n_columns, sign:1, exp:1})
				let $factors = $factor_r.add($factor_c); 
				$atomDblclicked.replaceWith($factors);
				$role.css('width', '');
				$role.css('height', '');
								
			}
			else{
				//sum in one numeber
				let $composed = ValToAtoms({type:"cn", val:n_children, sign:1, exp:1})
				$atomDblclicked.replaceWith($composed)
			}
	}//closed or opened
	*/
	//******** expand collapse ***********
	//else if (atomClass != 'ci' && atomClass != 'cn' && atomClass != 'plus') {
	else if (atomClass == 'forAll' || atomClass == 'and') {
		if ($atomDblclicked.is('[data-vis=collapsed]')) { $atomDblclicked.attr('data-vis', '') }
		else { $atomDblclicked.attr('data-vis', 'collapsed') }
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
		$('body').addClass('debug');
		$('#palette').addClass('hidden');
	} else {
		$('body').removeClass('debug');
		$('#palette').removeClass('hidden');
	}
}

function ExtendAndInitializeTree($startElement) {
	MNODEapplyFunctToTree($startElement, true, ExtendAndInitialize)
}

function ExtendAndInitialize($Atom) {
	MNODEextend($Atom, true)
	//initialize lock icon
	if ($Atom.is('[data-atom]') && isDefinition($Atom[0])) {
		refreshAsymmEq($Atom)
	}
}



function cancelSelected() {
	toBeCancelled = $('.selected').filter(function (index) {
		return !MNODEclosedDef(this);
	})
	if (toBeCancelled.length != 0) {
		toBeCancelled.each(function (i, element) {
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
		if (debugMode) { console.log('CONCLUDE') }
		refreshAndReplace(PActx);
		if (PActx.$transform) {
			RepeatedRefine_c(PActx.$transform, 'c', '.Refine_c');//Apply "c" to every Node in the branch marked with '.Refine_c'
		}
		RefreshEmptyInfixBraketsGlued($('body'), true);
		ssnapshot.take();
		if (GLBsettings.movesCounter != undefined) { GLBsettings.movesCounter++ };
		displayMoves(GLBsettings.movesCounter);
		lookForResultAndCelebrate(GLBsettings.movesCounter, GLBsettings.movesMinNumber)
		PActxVisualize(PActx);
	}
}

function PActxVisualize(PActx) {
	let visContent
	if (!PActx.visualization) {
		visContent = PActx.msg
	} else {
		visContent = '<img src="' + PActx.visualization + '">';
	}
	removeVisualization()
	let $visualization = $('<div class="visualization">' + visContent + '</div>')
	if (PActx.$transform && PActx.$transform.is('body *')) {//if the trasform exixts an is still in canvas
		$visualization.insertAfter(PActx.$transform)
		PActx.$transform.append($visualization);
	} else {
		$(canvas).append($visualization)
		$visualization.css('position', 'relative');
		$visualization.css('top', '0px');
	}
	setTimeout(removeVisualization, 3000);
}
function VisualizeCelebration(imagePath, timeout) {
	// VisualizeCelebration('images/properties/zero.svg',PActx.$transform,3000) 
	if (!imagePath) { return } //nothing to visualize
	let visContent = '<img src="' + imagePath + '">';
	let $visualization = $('<div class="celebration">' + visContent + '</div>')
	$('#result').append($visualization)
	if (timeout) {
		setTimeout(removeCelebration, timeout);
	}
}


function removeVisualization() {
	$('.visualization').remove()
}
function removeCelebration() {
	$('.celebration').remove()
}

const tools = ["", "copy", "autoAdapt", "declare"];
function changeTool() {
	let currToolIndex = tools.indexOf(GLBsettings.tool)
	let newToolIndex = ((currToolIndex + 1) % tools.length)// start over when the list is over
	GLBsettings.tool = tools[newToolIndex]//update tool in GLB
	$('body').attr('tool', GLBsettings.tool);//update tool as class of <body> 
	console.log('GLBsettings.tool<=' + GLBsettings.tool)
}

function displayMoves(moves) {
	// Update the text content with the moves
	let displayedText
	if (moves) {
		displayedText = `Moves:${moves}`;
	}
	else {
		displayedText = ``;
	}
	// Select the <span> element and put the text there
	const movesSpan = document.querySelector('#statusDisplay');
	if (movesSpan) {
		movesSpan.textContent = displayedText;
	}
}
