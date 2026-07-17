function preloadAll(myUrl) {
	//preloadAll('./Data/Preload/preload.json')
	$.ajax({
		type: "GET",
		url: myUrl,
		dataType: "text",
		error: function(e) {
			alert("AJAX/ errore nel caricare:" + myUrl);
			console.log("Ajax/GET fallita : ", e);
		},
		//success: function(response){injectAll(response,myUrl)}
		//Al momento quando scelgo un file da file explorer non viene passato l'url
		//quindi tutti i path in file JSON sono a partire dal root dell'applicazione
		success: function(response){
			injectAllMMLS(response);
		}
	});
}
function injectAll(response,rootUrl){
	//console.log(response);
	let all = JSON.parse(response);
	ENODEremove($('#canvasRole').children());
	if(all.palette_html && all.palette_html.string){//string data
		//inject(all.palette_html.string, $("#palette"))
		}
	else if(all.palette_html){//url
		loadAjaxAndInject(buildPath(rootUrl,all.palette_html),$("#palette"))
	}
	if(all.foundation_mml && all.foundation_mml.string){//string data
		$('#canvas').addClass('untied');
		ENODERefreshAsymmEq($('#canvas'));
		inject(all.content_mml.string, $("#canvasRole"),true);
		}
	else if(all.foundation_mml){//url
		$('#canvas').addClass('untied');
		ENODERefreshAsymmEq($('#canvas'));
		loadAjaxAndInject(buildPath(rootUrl,all.foundation_mml),$("#canvasRole"));
	}
	if(all.content_mml && all.content_mml.string){//string data
		$('#canvas').addClass('untied');
		ENODERefreshAsymmEq($('#canvas'));
		inject(all.content_mml.string, $("#canvasRole"),true);
		}
	else if(all.content_mml){//url
		$('#canvas').addClass('untied');
		ENODERefreshAsymmEq($('#canvas'));
		loadAjaxAndInject(buildPath(rootUrl,all.content_mml),$("#canvasRole"));
	}
	if(all.result_mml && all.result_mml.string){//string data
		ENODEremove($('#result').children());
		inject(all.result_mml.string, $('#result'));
	}
	else if(all.result_mml){//url
		ENODEremove($('#result').children());
		loadAjaxAndInject(buildPath(rootUrl,all.result_mml),$('#result'))
	}
	if(all.gestToAction_mml && all.gestToAction_mml.string){//string data
		ENODEremove($('#events').children());
		inject(all.gestToAction_mml.string, $('#events'))
		}
	else if(all.gestToAction_mml){//url
		ENODEremove($('#events').children());
		loadAjaxAndInject(buildPath(rootUrl,all.gestToAction_mml),$('#events'))
	}
	
	if(all.settings_json && all.settings_json.string){//string data
			GLBsettings = JSON.parse(all.settings_json.string);
			GLBsettingsToInterface();
			RefreshEmptyInfixBraketsGlued($("#canvasRole"))
		}
	else if(all.settings_json){//url
		$.getJSON(buildPath(rootUrl,all.settings_json), function(parsedJSON){
			//console.log(parsedJSON);
			GLBsettings = parsedJSON
			GLBsettingsToInterface();
			RefreshEmptyInfixBraketsGlued($("#canvasRole"))
		});
	}
	
}

function injectAllMMLS(response,rootUrl){
	//let $MML = $(response)
	let $MML = $parserForMixedMMLHTML(response)
	let $sections=$MML.filter('section')
	ENODEremove($('#canvasRole').children());
	//**** palette
	let $paletteContent = $sections.filter('[data-section=palette]').children();
	ENODEremove($('#palette').children(':not(.fundamental)'));
	if($paletteContent.length!=0){
		inject($paletteContent, $("#palette"));
		if (!debugMode){importAll($("#palette"))};
		//setTimeout(importAll($("#palette")), 3000);
		//all prototypes must be ready before rendering other sections

	}
	//**** events
	let $eventsContent = $sections.filter('[data-section=events]').children();
	ENODEremove($('#events').children());
	if($eventsContent.length!=0){
		//$('#events').children('').remove();
		inject($eventsContent, $('#events'));
	}
	//**** content
	let $canvasContent =  $sections.filter('[data-section=canvas]').children();
	if($canvasContent.length!=0){
		//$('#canvas').addClass('untied');
		ENODERefreshAsymmEq($('#canvas'));
		inject($canvasContent,$('#canvasRole'),'boolean');
	}
	//**** result
	let $resultContent = $sections.filter('[data-section=result]').children();
	if($resultContent.length!=0){
		ENODEremove($('#result').children());
		inject($resultContent, $('#result'),'boolean');
	}
	//************import all**********
	if (!debugMode){importAll()}
	//setTimeout(importAll(), 5000);

	let $settingsSection = $sections.filter('[data-section=settings]')
	if ($settingsSection.length != 0) {
		let all = JSON.parse($settingsSection.html());
		if (all.import_json_settings) {//url
			$.getJSON(buildPath(rootUrl, all.import_json_settings), function (parsedJSON) {
				//console.log(parsedJSON);
				GLBsettings = parsedJSON
				GLBsettingsToInterface();
				//RefreshEmptyInfixBraketsGlued($("#canvasRole"))
			});
		}
		else {//string data
			GLBsettings = all;
			GLBsettingsToInterface();
			RefreshEmptyInfixBraketsGlued($("#canvasRole"))
		}
	}
	RefreshEmptyInfixBraketsGlued();
	getDefaultTool().addClass('selectedTool');

}

function loadAjaxAndInject(myUrl,target,toBeImported) {
	//loadAjaxAndInject('./Data/Preload/preload.mml')
	let res
	if(myUrl){
	//altrimenti un url vuoto verrebbe interpretato come path relativo,
	//col risultato di caricare index.html
		res= $.ajax({
			type: "GET",
			url: myUrl,
			async: false,
			dataType: "text",
			error: function(e) {
				//alert("AJAX/ errore nel caricare:" + myUrl);
				console.log("Ajax/GET fallita : ", e);
			},
			success: function(response){
			//alert("lettura file " + myUrl + " tramite Ajax OK - risposta : " + response);
			if(!target){target=$("#canvasRole")}
			inject(response, target, undefined ,toBeImported)
			}
		});
	}
	return res
}

//La parte settings-UI (GLBsettingsToInterface, populateDropdown, listener su #settings)
//vive in settings.js: preload.js resta solo loader.
