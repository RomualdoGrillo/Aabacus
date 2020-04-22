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
			inject(textFromFileLoaded,$targetNode);
		}
		else if(fileSuffix === "json"){
			injectAll(textFromFileLoaded);
		}
		else if(fileSuffix === "prt"){
			if(confirm('replace existing list of prototypes?')){
				$('#tavolozza').children(':not(.fundamental)').remove();
			}
			inject(textFromFileLoaded,$('#tavolozza'))

		}
	};
	fileReader.readAsText(fileToLoad, "UTF-8");
}

function returnTargetWrappedIfNeeded($targetNode,$toBeInserted){
	if(  $targetNode.is('#telaRole') && (ATOMclosedDef( $targetNode )  || $toBeInserted.attr("data-type") !== "bool") ){
		// se il target è closed o l'espressione caricata non è booleana è necessario incapsulare con una nuova definizione 
		var $newDef = ATOMclone(prototypeSearch('eq','bool','asymmetric'));
		$newDef.removeClass("unlocked")//cio' che viene caticato e' di default unlocked
		$newDef.insertBefore($toBeInserted.eq(0));
		$target = $newDef.find(".secondMember")
		attachEventsAndExtend($newDef,false);//attacco eventi al solo container, gli eventi del contenuto sono attaccati nel load file. il contenusocollegare più volte gli eventi provoca errori
		$target.append($toBeInserted);
		return $target
	}
	else{
		return $targetNode
	}
}

//inject(MMLstring,$('#telaRole'))
function inject(MMLstring,$targetNode,doNotWrap)
{
	var $convertedTree = createConvertedTree(MMLstring,"mml_aab");
	
	// if ( target accept booleans) al momento l'unico target è #telarole, in futuro si dovrà distinguere
	$targetNode.append($convertedTree);
	if(doNotWrap=!true){//la classe :unlock messa via jquery sembra sia aggiornata dopo la chiamata asincrona
		$target = returnTargetWrappedIfNeeded($targetNode,$convertedTree)
	}
	attachEventsAndExtend($convertedTree,true);
	RefreshEmptyInfixBraketsGlued(ATOMparent($convertedTree),true,"eibg")
	//insertHtmlByRef($targetNode)
	ssnapshot.take(); 
}