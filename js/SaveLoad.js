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
			injectAllMMLS(textFromFileLoaded);
			//injectAll(textFromFileLoaded);
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
function inject(MMLstring,$targetRoleOrAtom,doNotWrap,toBeImported)
{
	var $convertedTree = createConvertedTree(MMLstring,"mml_aab",undefined,toBeImported);
	
	// if ( target accept booleans) al momento l'unico target è #canvasrole, in futuro si dovrà distinguere
	if($targetRoleOrAtom.is('[data-atom]')){
		
		//get all data attributes
		let originalImportData = $targetRoleOrAtom.data().import;
		let originalImportAndVis = $targetRoleOrAtom.data().and;
		if(originalImportData){
			if($convertedTree.length>1){
				// Needs "and" container if multiple items? 
				$convertedTree=wrapWithOperation($convertedTree,'and')		
			}
			$convertedTree.attr('data-import',originalImportData);
			$convertedTree.attr('data-and',originalImportAndVis);
		}
		let importStatus= $targetRoleOrAtom.attr('importStatus');
		if(importStatus){
			$convertedTree.attr('importStatus',importStatus)
		}
		$targetRoleOrAtom.replaceWith($convertedTree);
	}
	else{
		if(doNotWrap=!true){//la classe :unlock messa via jquery sembra sia aggiornata dopo la chiamata asincrona
			$target = WrapWithDefIfNeededreturnTarget($targetRoleOrAtom,$convertedTree)
		}
	
		$targetRoleOrAtom.append($convertedTree);
	}
	
	
	ExtendAndInitializeTree($convertedTree);
	//var $refreshStartPoint = MNODEparent($convertedTree);
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
	let paletteString = MNODEcreateMathmlString($('#palette').children(':not(.fundamental)'),true);
	//canvas
	let canvasString = MNODEcreateMathmlString($('#canvasAnd')[0].MNODE_getChildren(),true);
	//events
	let eventsString = MNODEcreateMathmlString($('#events').children(),true);
	//result
	let resultString = MNODEcreateMathmlString($('#result').children(),true);
	//save settings
	let MMLSString =
	'<section data-section="palette">' + paletteString + '</section>'+
	'<section data-section="canvas">' + canvasString + '</section>'+
	'<section data-section="events">' + eventsString + '</section>'+
	'<section data-section="result">' + resultString + '</section>'

	return MMLSString
}
