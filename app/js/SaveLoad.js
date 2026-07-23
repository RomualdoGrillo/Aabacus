//Load/Save from https://thiscouldbebetter.wordpress.com/2012/12/18/loading-editing-and-saving-a-text-file-in-html5-using-javascrip/

/**
 * Fa scaricare al browser un file di testo col contenuto dato,
 * formattato con formatXml, tramite un link di download temporaneo.
 * @param {string} textToWrite - Testo (XML/MML) da salvare; viene passato da formatXml prima del download.
 * @param {string} fileNameToSaveAs - Nome del file proposto per il download.
 * @returns {void}
 */
function saveTextAsFile(textToWrite,fileNameToSaveAs)
{
	const textFileAsBlob = new Blob([  formatXml(textToWrite) ], {type:'text/plain'});
	
	const downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	if (window.webkitURL != null)
	{
		// Chrome allows the link to be clicked
		// without actually adding it to the DOM.
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
	}
	else
	{
		// Firefox requires the link to be added to the DOM
		// before it can be clicked.
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}

	downloadLink.click();
}

function destroyClickedElement(event)
{
	document.body.removeChild(event.target);
}

/**
 * Legge il file scelto nell'input #fileToLoad e lo inietta secondo l'estensione:
 * "mml" → parsing e inject nel $targetNode; "mmls" → injectAllMMLS previa conferma
 * (sostituisce il canvas); "json" → injectAll (manifest legacy); "prt" → iniezione
 * in #palette (con conferma per rimpiazzare i prototipi non fondamentali).
 * Al termine esegue RefreshEmptyInfixBraketsGlued. La lettura è asincrona (FileReader).
 * @param {File} fileToLoadPar - (attualmente ignorato) il file letto è sempre il primo di #fileToLoad.
 * @param {JQuery} [$targetNode] - Destinazione dell'iniezione, usata solo per i file "mml".
 * @param {string} [fileSuffix] - Estensione del file ("mml"|"mmls"|"json"|"prt"); se sconosciuta logga e non inietta.
 * @returns {void}
 */
function loadFileConvert(fileToLoadPar,$targetNode,fileSuffix)
{
	const fileToLoad = document.getElementById("fileToLoad").files[0];
	const fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent) 
	{
		const textFromFileLoaded = fileLoadedEvent.target.result;
		if(fileSuffix === "mml"){
			let $loaded = $parserForMixedMMLHTML(textFromFileLoaded);

			inject($loaded,$targetNode);
		}
		else if(fileSuffix === "mmls"){
			if(confirm('This will discart the existing canvas and replace it with the new one. Are you sure?')){
				$('#canvas').addClass('untied');
				injectAllMMLS(textFromFileLoaded);
			}
		}
		else if(fileSuffix === "json"){
			injectAll(textFromFileLoaded);
			//injectAll(textFromFileLoaded);
		}
		else if(fileSuffix === "prt"){
			if(confirm('replace existing list of prototypes?')){
				ENODEremove($('#palette').children(':not(.fundamental)'));
			}
			inject(textFromFileLoaded,$('#palette'))
		}
		else{
			console.log('unknown file extension');
			return
		}
		RefreshEmptyInfixBraketsGlued()
	};
	fileReader.readAsText(fileToLoad, "UTF-8");
}



/**
 * Primitiva di iniezione MML nel DOM: converte la stringa in albero ENODE
 * (createConvertedTree), lo estende/inizializza e lo inserisce nel target,
 * gestendo i vari casi (wrap del contenuto, conservazione degli attributi di
 * import esistenti) e prendendo lo snapshot undo alla fine.
 * Esempio: inject(MMLstring, $('#canvasRole')).
 * @param {string|JQuery} MMLstring - Stringa MML da iniettare, o collezione jQuery già parsata (es. da $parserForMixedMMLHTML).
 * @param {JQuery} $targetRoleOrENODE - Destinazione: se è un ENODE ([data-enode]) viene sostituito dal contenuto (ereditando data-import/importStatus), altrimenti il contenuto è appeso al ruolo.
 * @param {string|boolean} [containerRequirements] - Se 'boolean' o true, i nodi appesi vengono avvolti in una definizione se necessario (wrapWithDefIfNeededreturnTarget).
 * @param {string} [toBeImported] - data-tag da filtrare durante la conversione (inoltrato a createConvertedTree); se assente importa tutto.
 * @returns {void}
 */
function inject(MMLstring, $targetRoleOrENODE, containerRequirements, toBeImported)
{
	let $convertedTree = createConvertedTree(MMLstring,"mml_aab",undefined,toBeImported);
	ExtendAndInitializeTree($convertedTree);
	// if ( target accept booleans) al momento l'unico target è #canvasrole, in futuro si dovrà distinguere
	if($targetRoleOrENODE.is('[data-enode]')){
		
		//get all data attributes
		let originalImportData = $targetRoleOrENODE.data().import;
		let originalImportAndVis = $targetRoleOrENODE.data().and;
		if(originalImportData){
			if($convertedTree.length>1){
				// Needs "and" container if multiple items? 
				$convertedTree=wrapWithOperation($convertedTree,'and')		
			}
			$convertedTree.attr('data-import',originalImportData);
			$convertedTree.attr('data-and',originalImportAndVis);
		}
		let importStatus= $targetRoleOrENODE.attr('importStatus');
		if(importStatus){
			$convertedTree.attr('importStatus',importStatus)
		}
		ENODEreplaceNode($targetRoleOrENODE, $convertedTree);
	}
	else{
		ENODEappend($targetRoleOrENODE, $convertedTree);
		if(containerRequirements === 'boolean' || containerRequirements === true){//lo stato untied/tied via jquery sembra sia aggiornato dopo la chiamata asincrona
			$convertedTree.each(function() {
				wrapWithDefIfNeededreturnTarget($targetRoleOrENODE,$(this))
			});
		}
	}
	//var $refreshStartPoint = ENODEparent($convertedTree);
	//if( $refreshStartPoint.length==0){ $refreshStartPoint=$convertedTree }
	ssnapshot.take(); 
}

/**
 * Risolve gli import: cerca in tutto il body gli ENODE con [data-import] non ancora
 * importati né falliti, li marca con importStatus e carica/inietta il file riferito
 * via loadAjaxAndInject (filtrando per l'eventuale data-tag). Passata singola:
 * import annidati nei file appena caricati possono restare irrisolti.
 * @param {JQuery} [$startNode] - (attualmente ignorato) la ricerca avviene sempre in body; se assente viene valorizzato a #canvasRole ma senza effetto sulla ricerca.
 * @returns {void}
 */
function importAll($startNode){
	//futuribile for()//fino a che c’è qualcosa da importare
	if(!$startNode){
		$startNode=$("#canvasRole");
	}
	$('body').find('[data-import]:not([importStatus=imported]):not([importStatus=failed])').each(function(i,el){//search for import

		try{
			let $el = $(el)
			let path = $el.attr('data-import')
			if(path){
				let tag = $el.attr('data-tag')
				//marca come imported! 
				$el.attr('importStatus','imported')
				loadAjaxAndInject(path,$el,tag); //will load and inject or mark the node as ImportFail or ImportSuccess
			}
		}
		catch{
			//failed to import!
			$el.attr('importStatus','failed')
		}
	})
	
}

/**
 * Serializza la sessione corrente in una stringa .mmls a sezioni: palette (senza i
 * prototipi fondamentali), canvas, events e result. Nota: la sezione settings non
 * viene serializzata (il commento "save settings" nel corpo è senza seguito).
 * @returns {string} Stringa MMLS composta dalle <section data-section=...>.
 */
function AlltoMMLSstring(){
	//palette
	let paletteString = ENODEcreateMathmlString($('#palette').children(':not(.fundamental)'),true);
	//canvas
	let canvasString = ENODEcreateMathmlString(ENODE_getChildren($('#canvasAnd')[0]),true);
	//events
	let eventsString = ENODEcreateMathmlString($('#events').children(),true);
	//result
	let resultString = ENODEcreateMathmlString($('#result').children(),true);
	//save settings
	let MMLSString =
	'<section data-section="palette">' + paletteString + '</section>'+
	'<section data-section="canvas">' + canvasString + '</section>'+
	'<section data-section="events">' + eventsString + '</section>'+
	'<section data-section="result">' + resultString + '</section>'

	return MMLSString
}
