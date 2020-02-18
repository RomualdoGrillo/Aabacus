//************************Init*******************************
let debugMode = false//debug,normal
let tela = document.getElementById('telaRole');
let exclusiveFocus
let sorting = false;//usato solo per gestire gli eventi di dragover
//************preload***********
//inject(preload,$('#telaRole'))
//************ radio Buttons  ************
$('input[type=radio][name=color]').change(function() {
console.log(this.value);
$('body').removeClass('whiteBorders greyBorders coloredBorders');//ripulisci valori precedenti
$('body').addClass(this.value)//aggiungi la nuova classe
});
//************ inizializza UNDO  ************
ssnapshot() //inizializza snapshot manager che gestisce UNDO
//***********************
//all elements that can be dragged around are initiated by making their container Sortable
let sortablesSelectorString='.ul_role,.ol_role,.s_role:not(.unsortable)'
//let sortablesSelectorString='.ul_role,.ol_role,.s_role:not(.unsortable),[data-atom=ci]';
let initialSortables = document.querySelectorAll(sortablesSelectorString)
makeSortable(initialSortables);
$('[data-atom].asymmetric').each(function(i,e){ refreshAsymmEq($(e))})//initialize lock icons??
ATOMextend($('body'),true);
RefreshEmptyInfixBraketsGlued($('body'),true,"eib");
ssnapshot.take();
document.addEventListener("click",clickHandler);
document.addEventListener("dblclick",dblclickHandler);
//document.querySelectorAll('[data-atom]').forEach(function(i,e){ refreshAsymmEq($(e))})
//***********************************************************


$(document).on('keydown', function ( e ) {
	var keyPressed = keyToCharacter(e.which).toLowerCase();
	console.log('key pressed:' + keyPressed + ' code: ' + e.which )
   	//ctrl+a 
   	if ( e.ctrlKey && (  keyPressed === 'a'   ) ) {
		$('#telaRole *').removeClass('selected');
		$('#telaRole>[data-atom]').addClass('selected');// select all: all the atoms in telaRole
	}
   	//ctrl+c
   	else if ( e.ctrlKey && (  keyPressed === 'c'  ) ) {
		ssnapshot.copy();
		console.log("control + c")
	}
   	//ctrl+v
   	else if ( e.ctrlKey && (  keyPressed === 'v'  ) ) {
		ssnapshot.paste();
		console.log("control + v")
	}
   	//ctrl+z
   	else if ( e.ctrlKey && (  keyPressed === 'z'   ) ) {
		ssnapshot.undo();
		console.log("control + z")
	}
	//ctrl+x
   	else if ( e.ctrlKey && (  keyPressed === 'x'  ) ) {
		ssnapshot.copy();
		cancelSelected();
		console.log("control + x")
	}
	//canc or del  code of "cancel" = 46 code of "del" = 8
	else if ( e.which === 46 || e.which === 8  ) {
		cancelSelected();
		console.log("canc or del")
	}
	//shift+d   toggle Debug
   	else if ( e.shiftKey && (  keyPressed === 'd' ) ) {
		debugToggle();
		console.log("control + d");	
	}
	//shift+s salva contenuto (ctrl+s è già associato al salvataggio della pagina da parte del browser)
	else if ( e.shiftKey && (  keyPressed === 's' ) ) {
		console.log("Shift + s")
		var $toBeSaved 
		if( $('.selected').length == 0 ){ $toBeSaved = $('#telaAnd')[0].ATOM_getChildren() }//se nulla in particolare è selezionato salva tutto
		else{$toBeSaved = $('.selected')};
		if( $toBeSaved.length !=0 ){
			var contentString = createMathmlString($toBeSaved,true)
			var stringToBeSaved = '<math xmlns="http://www.w3.org/1998/Math/MathML">' + contentString + '</math>'
			var fileName = prompt('Save as... Attenzione: Il file verrà salvato nella cartella "Download" !! non è possibile salvare in altre cartelle') 
			if(fileName !== null){
				saveTextAsFile(stringToBeSaved,fileName + ".mml");
			}
		}
	}
	//shift+l load file
	else if ( e.shiftKey && (  keyPressed === 'l' ) ) {
		console.log("Shift + l");
		$('#fileToLoad').trigger('click');// #fileToLoad: ad esso è associato un evento
	}
	else{//****************applica proprietà***********
		var PActx =  newPActx();
		var $selected = $('.selected')
		//code of "arrowup" = 38 
		if ( e.which === 38) {
			//console.log("decompose up")
			PActx = decompose($selected,"up"/*up for factorize*/);
		}
		//code of "arrowright" = 39
		else if ( e.which === 39) {
			//console.log("decompose right")
			PActx = decompose($selected , "right");
		}
		//code of "arrowdown" = 40 or "arrowleft" = 37 
		else if ( e.which === 40 || e.which === 37 ) {
			//console.log("compose")
			PActx = compose($selected)
		}
		
		// ogni volta che si preme un tasto cerca se c'è prop applicabile
		if(!PActx.matchedTF){
		
			PActx = keyboardEvToFC($selected, keyPressed);
						
		}
		//*************** operazioni conclusive (dopo tutti i tentativi)*******************
		PActxConclude(PActx)				
	}
});

//************  Create! button **************
$('#create-link').click(function(){ $(".selected")[0].ATOMCreateDefinition() })

//************ Help button**************
$( "#help-link" ).click(function( event ) {
	window.open('./Help/Help.html');
});
	//***** auto load file after a file is choosen***************
$('#fileToLoad').change(function() {
	//passa di qui dopo che l'utente ha selezionato un nuovo file, non se l'utente preme annulla
	console.log('fileTOLoad change');
	var fileToLoad = jQuery('#fileToLoad')[0].files[0];
	var $target = $('#telaRole');
	loadFileConvert(fileToLoad, $($target[0]),"mml_aab");
	//forse la chiamata sopra è asincrona? ssnapshot scatta prima dell'effettivo caricamento
	//ssnapshot.take(); //todo: snapshot solo in base a risultato di loadFileConvert()
	this.value = "";//cancella il vecchio path altrimenti se carico due volte lo stesso file non si accorge del cambiamento
});


//***********************************************************

    



function ATOMNselectable(startElement){
	//risali passo passo la struttura DOM fino a trovare un elemento ATOM
	return ATOMtarget = startElement.closest('[data-atom]:not(.unselectable):not(.glued)');	
}




function clickHandler(event){
    let $thisATOM= ATOMNselectable($(event.target));
    //*************** drag start is seen as select click ********
	if(event.type=='start'){
    	$('[data-atom]').removeClass('selected').removeClass('unselected');//clear selected unselected
		$(event.item).addClass('selected');
		if(event.clone){$(event.clone).addClass('selected')};
	}
    //*************** Lock unlock ******** 
	else if($(event.target).is('.asymmetric>.firstMember')){
		 let $atom = $(event.target).parent();
		 $atom.toggleClass('unlocked');
 		 refreshAsymmEq($atom);
		 ssnapshot.take();
	}
	else if(event.ctrlKey){//click +ctrl on .ATOM   ---multi select---
		if($thisATOM.hasClass('selected')){
		$thisATOM.find('[data-atom]').removeClass('selected').removeClass('unselected');
		}
		else if( $thisATOM.closest('.selected').length != 0 ){
		//if an ancestor is selected already, ignore click
		}
		else{
			$thisATOM.addClass('selected');
		}
	}
	else if(event.shiftKey){//click +shift on [data-atom]   ---unselect---
		if($thisATOM.hasClass('selected')){
			$thisATOM.removeClass('selected');
			$thisATOM.find('[data-atom]').removeClass('selected').removeClass('unselected');
		}
		else if($thisATOM.hasClass('unselected')){
			$thisATOM.removeClass('unselected');
			$thisATOM.find('[data-atom]').removeClass('selected').removeClass('unselected');
		}
		else if(   ( $thisATOM.closest('.selected').length != 0 )   && ( $thisATOM.closest('.unselected').length == 0) ){//se è selected, a meno che non sia unselected		
		
			$thisATOM.addClass('unselected');
			$thisATOM.find('[data-atom]').removeClass('selected').removeClass('unselected');
		}
	}
	else{//click on [data-atom]   ---select---
		
		if($thisATOM.hasClass('selected')){
			$('[data-atom]').removeClass('selected').removeClass('unselected');//clear selected unselected
		}
		else{
			$('[data-atom]').removeClass('selected').removeClass('unselected');//clear selected unselected
			$thisATOM.addClass('selected');
		}
	}
}
    
    

function dblclickHandler(event){
	let target= ATOMNselectable(event.target);
	let $atomDblclicked = $(target) 
	let atomClass = $atomDblclicked.attr('data-atom');
	let closed = ATOMclosedDef($atomDblclicked)
	console.log('dblclick');
	//closed
		//******** forThis prompt ***********
		if( closed && atomClass ==='ci' && ATOMparent($atomDblclicked).attr('data-atom') == 'forAll'){
			var newVal=prompt('Specify a value')
			if(newVal != null){
				var type = $atomDblclicked.attr('data-type')
				var $newNode  = ATOMclone(prototypeSearch(  (isNaN(newVal))?"ci":"cn") )
				attachEventsAndExtend($newNode);
				$newNode[0].ATOM_setName( newVal );
				$newNode.attr('data-type',type)
				forThisPar_focus_nofocus($newNode,$atomDblclicked)
				ssnapshot.take()
			}
		}
		//******** remove "exclusiveFocus" ***********
		else if(closed && atomClass === 'forAll'){
			if( $atomDblclicked.hasClass('exclusiveFocus') ){
				$atomDblclicked.removeClass('exclusiveFocus')// togli exclusiveFocus
				exclusiveFocus = ""	
			}	
		}
		
		/********closed still not handled **********/
		else if(closed && atomClass === 'plus'){//experimental
			if($atomDblclicked.hasClass('resizable')){
				$atomDblclicked[0].ATOM_getRoles().css('width','');
				$atomDblclicked[0].ATOM_getRoles().css('height','');
			}
			$atomDblclicked.toggleClass('resizable');
		}

	//closed or opened
		//******** expand collapse ***********
		else if(atomClass === 'defTrue'){
			$atomDblclicked.toggleClass('expanded');
		}
		else if( atomClass != 'ci' && atomClass != 'cn' && atomClass != 'plus'){
			$atomDblclicked.toggleClass('minimized');//??todo: uniformare con expanded
		}
	//opened
	//******** dblclick on ci ***********
		else if(!closed && (atomClass=='ci'||atomClass=='cn')){
			ATOMrenamePrompt($atomDblclicked);
		}	 
		
}


/*function clearClass(Classes){// for example clearClass(['selected','unselected'])   or clearClass(['unselected')
	if (typeof(Classes)=="string"){Classes=[Classes]}//if input is a srting, create a one element array
	nestedSortablesBool.forEach(function(e){e.classList.remove(...Classes)});//clear an array of classes
}*/

function clearTarget(Classes){// for example clearTarget(['selected','unselected'])   or clearTarget(['unselected')
	if (typeof(Classes)=="string"){Classes=[Classes]}//if input is a srting, create a one element array
	document.querySelectorAll(sortablesSelectorString).forEach(function(e){e.classList.remove(...Classes)});//clear an array of classes
}




function refreshAsymmEq($atom){// adegua l'icona del lucchetto allo stato unlocked/non unlocked
	var $firstMember = $atom.find('>.firstMember')
		$firstMember.addClass("ui-icon");
	if($atom.hasClass('unlocked')){
			$firstMember.addClass("ui-icon-unlocked");
			$firstMember.removeClass("ui-icon-bullet");
		 }
		 else{
			$firstMember.addClass("ui-icon-bullet");
			$firstMember.removeClass("ui-icon-unlocked");
		 }
}

function keyToCharacter(key){
	if(key === 37){return "←"}
	else if(key === 38){return "↑"}
	else if(key === 39){return "→"}
	else if(key === 40){return "↓"}
	else{ return String.fromCharCode(key)}
}

function refreshAndReplace(PActx){
	console.log("Applied property: " + PActx.msg)
	//**** determina l'operazione più esterna su cui fare il refresh
	var $toBeRefreshed 
	
    if( PActx.replacedAlready == true){// sostituzione già effettuano internamente alla proprietà
	$toBeRefreshed = ATOMparent( PActx.$transform )
    }
    else{
    	$toBeRefreshed = ATOMparent( PActx.$operand )
    	PActx.$transform.insertBefore(PActx.$operand[0]);
		PActx.$operand.remove()
		attachEventsAndExtend(PActx.$transform,true,true);
    //********select on exit
	//$('*').removeClass('selected')
	//$(PActx.$transform[0]).addClass('selected')	
    }
	//********Refresh***************

	if( $toBeRefreshed !== undefined &&  $toBeRefreshed.length != 0 ){
				
		
		RefreshEmptyInfixBraketsGlued($toBeRefreshed,true,"egip");
	}
	return PActx
}

function debugToggle(){
	debugMode = !debugMode //toggle debugMode
	if(debugMode){
				$('#telaRole').addClass('debug');
				$('#tavolozza').addClass('hidden');
			}
	else{
		$('#telaRole').removeClass('debug');
		$('#tavolozza').removeClass('hidden');
	}
}



function attachEventsAndExtend($startElement,processDiscendence/*default is true*/,extend/*default is true*/){//di qui passano tutti, a seconda della classe: 1)estendi atom 2)attach events
	var $Elements
	if(processDiscendence !== false){
		if(extend != false){ATOMextend($startElement,true)}
		$Elements = $startElement.add($startElement.find('[data-atom],[class*="_role"]'));// order is important!	
	}
	else{
		if(extend != false){ATOMextend($startElement,true)}
		$Elements = $startElement[0].ATOM_getNodes();
	}
	
	//initialize lock icons
	$Elements.filter('[data-atom].asymmetric').each(function(i,e){ refreshAsymmEq($(e))})
	$Elements.filter('[data-atom].asymmetric').each(function(i,e){ refreshAsymmEq($(e))})
	let allSortables = $Elements.filter(sortablesSelectorString).toArray();
	makeSortable(allSortables);
}

function cancelSelected(){
	toBeCancelled = $('.selected').filter(function( index ) {
    	return !ATOMclosedDef(this);
  	})
  	if( toBeCancelled.length !=0 ){
		toBeCancelled.each(function(i,element){
			console.log(  $(element).remove()  )
		});
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


function PActxConclude(PActx){
	if(PActx.matchedTF == true ){		         		    
		//********** Post *************
		if(PActx.$transform){
			$children = ATOMcleanIfPointless(PActx.$transform,true)
			if($children){//in case the $transform "dissolved" you need to consider his child 
				PActx.$transform=$children
			}
			let $targetParent = ATOMparent(PActx.$transform)
			postPatternMatching(PActx.$transform)
			postRefine($targetParent)//repeated clenup may rplace the original target
		}
		refreshAndReplace(PActx);	
		ssnapshot.take();
		PActxVisualize(PActx);
	}
}


function PActxVisualize(PActx){
	if(PActx.visualization==""){
		PActx.visualization="images/Brackets.png"
	}
	removeVisualization()
	let $visualization = $('<div class="visualization"><img src="' + PActx.visualization + '"></div>')
	if(PActx.$transform){
		$visualization.insertAfter(PActx.$transform)
	}
	else{
		$(tela).append($visualization)
	}
	setTimeout(removeVisualization, 3000);
}

function removeVisualization(){
	$('.visualization').remove()
}

