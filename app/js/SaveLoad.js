//Modulo IIFE (passo 8, software-modules.md §4.1): helper privati nello scope del modulo,
//interfaccia esportata su Aabacus.persistence + alias globali di compatibilità (index2, newPM, test).
(function (/** @type {any} */ global) {

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
 * @param {File} fileToLoadPar - Il file da leggere; se assente si usa il primo di #fileToLoad.
 * @param {JQuery} [$targetNode] - Destinazione dell'iniezione, usata solo per i file "mml".
 * @param {string} [fileSuffix] - Estensione del file ("mml"|"mmls"|"json"|"prt"); se sconosciuta logga e non inietta.
 * @returns {void}
 */
function loadFileConvert(fileToLoadPar,$targetNode,fileSuffix)
{
	const fileToLoad = fileToLoadPar || document.getElementById("fileToLoad").files[0];
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
 * Risolve gli import: cerca nell'ambito dato (default: tutto il body) gli ENODE
 * con [data-import] non ancora importati né falliti, li marca con importStatus e
 * carica/inietta il file riferito via loadAjaxAndInject (filtrando per l'eventuale
 * data-tag). Ripete la ricerca a passate successive finché non restano import da
 * risolvere (i file appena caricati possono contenere import annidati), fino a
 * IMPORT_MAX_PASSES (anti-loop su import circolari).
 * @param {JQuery} [$startNode] - Ambito della ricerca (incluso il nodo stesso); se assente si cerca in tutto il body.
 * @returns {void}
 */
function importAll($startNode){
	const IMPORT_MAX_PASSES = 10;
	const pendingSelector = '[data-import]:not([importStatus=imported]):not([importStatus=failed])';
	const $scope = ($startNode && $startNode.length) ? $startNode : $('body');
	for (let pass = 0; pass < IMPORT_MAX_PASSES; pass++) {
		const $pending = $scope.find(pendingSelector).addBack(pendingSelector);
		if ($pending.length === 0) { return }
		$pending.each(function(i,el){//search for import
			const $el = $(el)
			try{
				const path = $el.attr('data-import')
				if(path){
					const tag = $el.attr('data-tag')
					//marca come imported!
					$el.attr('importStatus','imported')
					loadAjaxAndInject(path,$el,tag); //will load and inject or mark the node as ImportFail or ImportSuccess
				}
				else{//data-import vuoto: marca failed per non riesaminarlo alle passate successive
					$el.attr('importStatus','failed')
				}
			}
			catch{
				//failed to import!
				$el.attr('importStatus','failed')
			}
		})
	}
	console.warn('importAll: raggiunto IMPORT_MAX_PASSES (' + IMPORT_MAX_PASSES + ') con import ancora irrisolti');
}

/**
 * Serializza la sessione corrente in una stringa .mmls a sezioni: palette (senza i
 * prototipi fondamentali), canvas, events, result e settings (GLBsettings come
 * JSON inline, stesso formato letto da injectAllMMLS al ricaricamento).
 * @returns {string} Stringa MMLS composta dalle <section data-section=...>.
 */
function AlltoMMLSstring(){
	//palette
	let paletteString = ENODEcreateMathmlString($('#palette').children(':not(.fundamental)'),true);
	//canvas
	let canvasString = ENODEcreateMathmlString(ENODE_getChildren($('#canvasAnd')),true);
	//events
	let eventsString = ENODEcreateMathmlString($('#events').children(),true);
	//result
	let resultString = ENODEcreateMathmlString($('#result').children(),true);
	//settings: GLBsettings inline (al caricamento injectAllMMLS fa JSON.parse dell'html della sezione)
	let settingsString = (typeof GLBsettings === 'object' && GLBsettings !== null)
		? JSON.stringify(GLBsettings)
		: '';
	let MMLSString =
	'<section data-section="palette">' + paletteString + '</section>'+
	'<section data-section="canvas">' + canvasString + '</section>'+
	'<section data-section="events">' + eventsString + '</section>'+
	'<section data-section="result">' + resultString + '</section>'
	if(settingsString){
		MMLSString += '<section data-section="settings">' + settingsString + '</section>'
	}
	return MMLSString
}

//--- interfaccia del modulo (software-modules.md §2.4) ---
var api = {
	saveTextAsFile: saveTextAsFile,
	loadFileConvert: loadFileConvert,
	inject: inject,
	importAll: importAll,
	AlltoMMLSstring: AlltoMMLSstring
};
global.Aabacus = global.Aabacus || {};
Object.assign(global.Aabacus.persistence = global.Aabacus.persistence || {}, api);
Object.assign(global, api);//alias globali di compatibilità

})(window);
