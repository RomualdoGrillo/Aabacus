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

function loadFileConvert(fileToLoadPar,$targetNode,from_to)
{
	var fileToLoad = document.getElementById("fileToLoad").files[0];
	var fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent) 
	{
		var textFromFileLoaded = fileLoadedEvent.target.result;
		if(from_to === "mml_aab"){
			inject(textFromFileLoaded,$targetNode)

		}
		else{
			$(targetNode).html(textFromFileLoaded)
		}
	};
	fileReader.readAsText(fileToLoad, "UTF-8");
}

//inject(MMLstring,$('#telaRole'))
function inject(MMLstring,$targetNode)
{
	var $convertedTree = createConvertedTree(MMLstring,"mml_aab");
	// if ( target accept booleans) al momento l'unico target è #telarole, in futuro si dovrà distinguere
	if(  ATOMclosedDef( $targetNode )  || $convertedTree.attr("data-type") !== "bool" ){
		// se il target è closed o l'espressione caricata non è booleana è necessario incapsulare con una nuova definizione 
		var $newDef = ATOMclone(prototypeSearch('asymmEq'));
		$newDef.removeClass("unlocked")//cio' che viene caticato e' di default unlocked
		$targetNode.append($newDef);
		$target = $newDef.find(".secondMember")
		attachEventsAndExtend($newDef,false);//attacco eventi al solo container, gli eventi del contenuto sono attaccati nel load file. il contenusocollegare più volte gli eventi provoca errori
	}
	else{
		$target = $targetNode
	}
	$target.append($convertedTree);
	attachEventsAndExtend($convertedTree,true);
	RefreshEmptyInfixBraketsGlued($convertedTree,true,"eibg")
	insertHtmlByRef($targetNode)
	ssnapshot.take(); 
}