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
		else{
			console.log('unknown file extension');
			return
		}
		RefreshEmptyInfixBraketsGlued()
	};
	fileReader.readAsText(fileToLoad, "UTF-8");
}

function WrapWithDefIfNeededreturnTarget($targetNode,$toBeInserted){
	if(  $targetNode.is('#telaRole') && (MNODEclosedDef( $targetNode )  || $toBeInserted.attr("data-type") !== "bool") ){
		// se il target è closed o l'espressione caricata non è booleana è necessario incapsulare con una nuova definizione 
		var $newDef = MNODEclone(prototypeSearch('eq','bool','asymmetric'));
		$newDef.removeClass("unlocked")//cio' che viene caticato e' di default unlocked
		$newDef.insertBefore($toBeInserted.eq(0));
		$target = $newDef.find(".secondMember")
		ExtendAndInitialize($newDef);// il contenuto è già stato esteso
		$target.append($toBeInserted);
		return $target
	}
	else{
		return $targetNode
	}
}

//inject(MMLstring,$('#telaRole'))
function inject(MMLstring,$targetRole,doNotWrap)
{
	var $convertedTree = createConvertedTree(MMLstring,"mml_aab");
	
	// if ( target accept booleans) al momento l'unico target è #telarole, in futuro si dovrà distinguere
	$targetRole.append($convertedTree);
	if(doNotWrap=!true){//la classe :unlock messa via jquery sembra sia aggiornata dopo la chiamata asincrona
		$target = WrapWithDefIfNeededreturnTarget($targetRole,$convertedTree)
	}
	ExtendAndInitializeTree($convertedTree);
	var $refreshStartPoint = MNODEparent($convertedTree);
	if( $refreshStartPoint.length==0){ $refreshStartPoint=$convertedTree }
	//insertHtmlByRef($targetRole)
	ssnapshot.take(); 
}

function importAll(){
	//futuribile for()//fino a che c’è qualcosa da importare
	$("#telaRole").find('[data-atom=and]:not(.ImportSuccess):not(.ImportFail)').filter(function(i,el){//search for import

		try{
			//***versione2: import statement è un and 
			//che specifica il path del file da importare e opzionalmente le definizioni da importare all'interno del file
			//se il il nodo contiene classe "ImportFail", non riprovare a caricarlo 
			//se l'importazione fallisce aggiungi classe "ImportFail"
			json = JSON.parse($(el).attr('title'));
			if(json.import){
				let $role=	el.MNODE_getRoles()
				loadAjaxAndInject(json.import,$role); //will load and inject or mark the node as ImportFail or ImportSuccess
			}
		}
		catch{}
	})
	
}