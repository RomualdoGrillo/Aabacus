//Load/Save from https://thiscouldbebetter.wordpress.com/2012/12/18/loading-editing-and-saving-a-text-file-in-html5-using-javascrip/

function saveTextAsFile(textToWrite,fileNameToSaveAs)
{
	var textFileAsBlob = new Blob([  formatXml(textToWrite) ], {type:'text/plain'});
	
	var downloadLink = document.createElement("a");
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

function loadFileConvert(fileToLoadPar,$targetNode,fileSuffix)
{
	var fileToLoad = document.getElementById("fileToLoad").files[0];
	var fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent) 
	{
		var textFromFileLoaded = fileLoadedEvent.target.result;
		if(fileSuffix === "mml"){
			let $loaded = $parserForMixedMMLHTML(textFromFileLoaded);

			inject($loaded,$targetNode);
		}
		else if(fileSuffix === "mmls"){
			if(confirm('This will discart the existing canvas and replace it with the new one. Are you sure?')){
				$('#canvas').addClass('unlocked');
				injectAllMMLS(textFromFileLoaded);
			}
		}
		else if(fileSuffix === "json"){
			injectAll(textFromFileLoaded);
			//injectAll(textFromFileLoaded);
		}
		else if(fileSuffix === "prt"){
			if(confirm('replace existing list of prototypes?')){
				$('#palette').children(':not(.fundamental)').remove();
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



//inject(MMLstring,$('#canvasRole'))
/**
 * Injects an MML string into a target element, handling various cases such as wrapping the content and preserving existing data attributes.
 *
 * @param {string} MMLstring - The MML string to be injected.
 * @param {jQuery} $targetRoleOrenode - The target element to inject the MML string into.
 * @param {boolean} containerRequirements - A flag indicating whether the content should not be wrapped.
 * @param {boolean} toBeImported - A flag indicating whether the content is being imported.
 * @returns {void}
 */
function inject(MMLstring, $targetRoleOrenode, containerRequirements, toBeImported)
{
	var $convertedTree = createConvertedTree(MMLstring,"mml_aab",undefined,toBeImported);
	ExtendAndInitializeTree($convertedTree);
	// if ( target accept booleans) al momento l'unico target è #canvasrole, in futuro si dovrà distinguere
	if($targetRoleOrenode.is('[data-enode]')){
		
		//get all data attributes
		let originalImportData = $targetRoleOrenode.data().import;
		let originalImportAndVis = $targetRoleOrenode.data().and;
		if(originalImportData){
			if($convertedTree.length>1){
				// Needs "and" container if multiple items? 
				$convertedTree=wrapWithOperation($convertedTree,'and')		
			}
			$convertedTree.attr('data-import',originalImportData);
			$convertedTree.attr('data-and',originalImportAndVis);
		}
		let importStatus= $targetRoleOrenode.attr('importStatus');
		if(importStatus){
			$convertedTree.attr('importStatus',importStatus)
		}
		$targetRoleOrenode.replaceWith($convertedTree);
	}
	else{
		$targetRoleOrenode.append($convertedTree);
		if(containerRequirements='bool'){//la classe :unlock messa via jquery sembra sia aggiornata dopo la chiamata asincrona
			$convertedTree.each(function() {
				wrapWithDefIfNeededreturnTarget($targetRoleOrenode,$(this))
			});
		}
	}
	
	
	//var $refreshStartPoint = enodeparent($convertedTree);
	//if( $refreshStartPoint.length==0){ $refreshStartPoint=$convertedTree }
	ssnapshot.take(); 
}

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

function AlltoMMLSstring(){
	//palette
	let paletteString = enodecreateMathmlString($('#palette').children(':not(.fundamental)'),true);
	//canvas
	let canvasString = enodecreateMathmlString($('#canvasAnd')[0].enode_getChildren(),true);
	//events
	let eventsString = enodecreateMathmlString($('#events').children(),true);
	//result
	let resultString = enodecreateMathmlString($('#result').children(),true);
	//save settings
	let MMLSString =
	'<section data-section="palette">' + paletteString + '</section>'+
	'<section data-section="canvas">' + canvasString + '</section>'+
	'<section data-section="events">' + eventsString + '</section>'+
	'<section data-section="result">' + resultString + '</section>'

	return MMLSString
}
