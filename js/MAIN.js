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
let sortablesExcluded = '[data-ENODE=minus]>*,[data-ENODE=m_inverse]>*,[data-ENODE=not]>*'
//glued
ENODEextend($('body'), true);
//************ Preload  ************
//preload will extend new ENODEs 
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
		$('#canvasRole>[data-ENODE]').addClass('selected');
		// select all: all the ENODEs in canvasRole
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
		ENODECreateDefinition($('.selected')[0])
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
			let contentString = ENODEcreateMathmlString($toBeSaved, true);
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


function clickHandler(event) {
	//*************** Lock unlock ********
	if ($(event.target).parent().is(function() { return isDefinition(this); }) && $(event.target).is('.firstMember')) {
		let $ENODE = $(event.target).parent();
		if ($ENODE.is('#canvas')) {
			// canvas fa eccezione perchè determina anche lo stato delle sezioni result e events
			if (!GLBsettings.lockCanvas) {
				GLBsettings.lockCanvas = true;
				$('#canvas,#result,#events').removeClass('unlocked');
			} else {
				GLBsettings.lockCanvas = false;
				$('#canvas,#result,#events').addClass('unlocked');
			}
		} else {
			$ENODE.toggleClass('unlocked');
		}
		ENODERefreshAsymmEq($ENODE);
		ssnapshot.take();
	}

}
function selectionManager($clickedENODE, ctrl, shift, deselectAll) {
	if (deselectAll) {
		//clear selected unselected
		$('[data-ENODE]').removeClass('selected').removeClass('unselected');
	}
	//***selection of declared "yellow" tool
	else if (($clickedENODE.attr('data-ENODE') == 'forAll' || $clickedENODE.attr('data-ENODE') == 'eq' || $clickedENODE.attr('data-tag'))
		&& $clickedENODE.attr('data-tag')
		&& GLBsettings.tool == "declare") {
		//solo se è effettivamente una proprietà e non un container
		if ($clickedENODE.hasClass('selectedTool')) {
			$clickedENODE.removeClass('selectedTool')
		}
		else {
			$('[data-ENODE]').removeClass('selectedTool')
			$clickedENODE.addClass('selectedTool');
			console.log('Selected tool: ' + $clickedENODE.attr('data-tag'))
		}
	}
	else if (ctrl) {
		//click +ctrl on .ENODE   ---multi select---
		if ($clickedENODE.hasClass('selected')) {
			$clickedENODE.find('[data-ENODE]').removeClass('selected').removeClass('unselected');
		} else if ($clickedENODE.closest('.selected').length != 0) {//if an ancestor is selected already, ignore click
		} else {
			$clickedENODE.addClass('selected');
		}
	} else if (shift) {
		//click +shift on [data-ENODE]   ---unselect---
		if ($clickedENODE.hasClass('selected')) {
			$clickedENODE.removeClass('selected');
			$clickedENODE.find('[data-ENODE]').removeClass('selected').removeClass('unselected');
		} else if ($clickedENODE.hasClass('unselected')) {
			$clickedENODE.removeClass('unselected');
			$clickedENODE.find('[data-ENODE]').removeClass('selected').removeClass('unselected');
		} else if (($clickedENODE.closest('.selected').length != 0) && ($clickedENODE.closest('.unselected').length == 0)) {
			//se è selected, a meno che non sia unselected		

			$clickedENODE.addClass('unselected');
			$clickedENODE.find('[data-ENODE]').removeClass('selected').removeClass('unselected');
		}
	} else {
		//click on [data-ENODE]   ---select---

		if ($clickedENODE.hasClass('selected')) {
			$('[data-ENODE]').removeClass('selected').removeClass('unselected');
			//clear selected unselected
		} else {
			$('[data-ENODE]').removeClass('selected').removeClass('unselected');
			//clear selected unselected
			$clickedENODE.addClass('selected');
		}
	}
}









function dblclickHandler(event) {
	let target = ENODEselectable(event.target);
	let $ENODEDblclicked = $(target)
	let ENODEClass = $ENODEDblclicked.attr('data-ENODE');
	let closed = ENODEclosedDef($ENODEDblclicked)
	console.log('dblclick');
	//closed
	//******** forThis prompt ***********
	let $toBeSpecified
	if (closed && ENODEClass === 'ci') {
		$toBeSpecified = parameterInHeader($ENODEDblclicked, $identifierSpanForAll($ENODEDblclicked))
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
				$newNode = ENODEclone(prototypeSearch((isNaN(newVal)) ? "ci" : "cn"))
				$newNode[0].ENODE_setName(newVal);
				$newNode.attr('data-type', type)
			}
			forThisPar_focus_nofocus($newNode, $toBeSpecified);
			RefreshEmptyInfixBraketsGlued();
			ssnapshot.take();
		}
	}
	//******** remove "exclusiveFocus" ***********
	/*
	else if (closed && ENODEClass === 'forAll') {
		if ($ENODEDblclicked.hasClass('exclusiveFocus')) {
			$ENODEDblclicked.removeClass('exclusiveFocus')
			// togli exclusiveFocus
			exclusiveFocus = ""
		}
	}
	*/
	/********closed still not handled **********/
	/*
	else if (closed && ENODEClass === 'cn') {
		let n = Number( ENODENumericCdsAsText($ENODEDblclicked) );
		if(Number.isInteger(n) && n>0){
			let $plus =wrapWithOperation($ENODEDblclicked,'plus');
			$plus.attr('data-vis','resizable');
			$ENODEDblclicked.remove()
			//crea il numero 1
			var One = {type:"cn", val:1, sign:1, exp:1}
			for(i=0;i<n;i++){
				//clona ENODE 1
				$plus[0].ENODE_getRoles().append(ValToENODEs(One))
			}	
		}
	}
	else if ($ENODEDblclicked.is('[data-vis=resizable]')){
			let $role=$ENODEDblclicked[0].ENODE_getRoles().eq(0);
			let firstChild = $role.find('>[data-ENODE]')[0]
			let fcWidth = firstChild.offsetWidth
			//var fcstyle = element.currentStyle || window.getComputedStyle(firstChild);
			var fcstyle = window.getComputedStyle(firstChild);
			let fcMargins = parseFloat(fcstyle.marginLeft) + parseFloat(fcstyle.marginRight)
			let n_columns = Math.floor( $role[0].offsetWidth/(fcWidth+fcMargins) )
			let n_children = $ENODEDblclicked[0].ENODE_getChildren().length
			if(n_children % n_columns == 0){
				let n_rows = n_children / n_columns;
				console.log('decoposed!!!')
				wrapIfNeeded($ENODEDblclicked,'times')
				let $factor_r = ValToENODEs({type:"cn", val:n_rows, sign:1, exp:1})
				let $factor_c = ValToENODEs({type:"cn", val:n_columns, sign:1, exp:1})
				let $factors = $factor_r.add($factor_c); 
				$ENODEDblclicked.replaceWith($factors);
				$role.css('width', '');
				$role.css('height', '');
								
			}
			else{
				//sum in one numeber
				let $composed = ValToENODEs({type:"cn", val:n_children, sign:1, exp:1})
				$ENODEDblclicked.replaceWith($composed)
			}
	}//closed or opened
	*/
	//******** expand collapse ***********
	//else if (ENODEClass != 'ci' && ENODEClass != 'cn' && ENODEClass != 'plus') {
	else if (ENODEClass == 'forAll' || ENODEClass == 'and') {
		if ($ENODEDblclicked.is('[data-vis=collapsed]')) { $ENODEDblclicked.attr('data-vis', '') }
		else { $ENODEDblclicked.attr('data-vis', 'collapsed') }
	}//opened
	//******** dblclick on ci ***********
	else if (!closed && (ENODEClass == 'ci' || ENODEClass == 'cn')) {
		ENODErenamePrompt($ENODEDblclicked);
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
		$toBeRefreshed = ENODEparent(PActx.$transform)
	} else {
		$toBeRefreshed = ENODEparent(PActx.$operand)
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
	ENODEapplyFunctToTree($startElement, true, ExtendAndInitialize)
}

function ExtendAndInitialize($ENODE) {
	ENODEextend($ENODE, true)
	//initialize lock icon
	if ($ENODE.is('[data-ENODE]') && isDefinition($ENODE[0])) {
		ENODERefreshAsymmEq($ENODE)
	}
}



function cancelSelected() {
	toBeCancelled = $('.selected').filter(function (index) {
		return !ENODEclosedDef(this);
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
