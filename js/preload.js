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
	$('#canvasRole').children().remove();
	if(all.palette_html && all.palette_html.string){//string data
		//inject(all.palette_html.string, $("#palette"))
		}
	else if(all.palette_html){//url
		loadAjaxAndInject(buildPath(rootUrl,all.palette_html),$("#palette"))
	}
	if(all.foundation_mml && all.foundation_mml.string){//string data
		$('#canvas').addClass('unlocked');
		refreshAsymmEq($('#canvas'));
		inject(all.content_mml.string, $("#canvasRole"),true);
		}
	else if(all.foundation_mml){//url
		$('#canvas').addClass('unlocked');
		refreshAsymmEq($('#canvas'));
		loadAjaxAndInject(buildPath(rootUrl,all.foundation_mml),$("#canvasRole"));
	}
	if(all.content_mml && all.content_mml.string){//string data
		$('#canvas').addClass('unlocked');
		refreshAsymmEq($('#canvas'));
		inject(all.content_mml.string, $("#canvasRole"),true);
		}
	else if(all.content_mml){//url
		$('#canvas').addClass('unlocked');
		refreshAsymmEq($('#canvas'));
		loadAjaxAndInject(buildPath(rootUrl,all.content_mml),$("#canvasRole"));
	}
	if(all.result_mml && all.result_mml.string){//string data
		$('#result').children().remove();
		inject(all.result_mml.string, $('#result'));
	}
	else if(all.result_mml){//url
		$('#result').children().remove();
		loadAjaxAndInject(buildPath(rootUrl,all.result_mml),$('#result'))
	}
	if(all.gestToAction_mml && all.gestToAction_mml.string){//string data
		$('#events').children().remove();
		inject(all.gestToAction_mml.string, $('#events'))
		}
	else if(all.gestToAction_mml){//url
		$('#events').children().remove();
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
	$sections=$MML.filter('section')
	$('#canvasRole').children().remove();
	//**** palette
	let $paletteContent = $sections.filter('[data-section=palette]').children();
	$('#palette').children(':not(.fundamental)').remove();
	if($paletteContent.length!=0){
		inject($paletteContent, $("#palette"),true);
		if (!debugMode){importAll($("#palette"))};
		//setTimeout(importAll($("#palette")), 3000);
		//all prototypes must be ready before rendering other sections

	}
	//**** events
	let $eventsContent = $sections.filter('[data-section=events]').children();
	$('#events').children().remove();
	if($eventsContent.length!=0){
		//$('#events').children('').remove();
		inject($eventsContent, $('#events'),true);
	}
	//**** content
	let $canvasContent =  $sections.filter('[data-section=canvas]').children();
	if($canvasContent.length!=0){
		//$('#canvas').addClass('unlocked');
		refreshAsymmEq($('#canvas'));
		inject($canvasContent,$('#canvasRole'),false);
	}
	//**** result
	let $resultContent = $sections.filter('[data-section=result]').children();
	if($resultContent.length!=0){
		$('#result').children().remove();
		inject($resultContent, $('#result'),true);
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
	RefreshEmptyInfixBraketsGlued()
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

let dd_colors = $('#select_colors')[0]
let $dd_visSelection = $('#visSettingSelected');
function GLBsettingsToInterface() {
	
	if(GLBsettings.lockCanvas != undefined){
		if(GLBsettings.lockCanvas){$('#canvas').removeClass('unlocked')}
		else{$('#canvas').addClass('unlocked')}
		refreshAsymmEq($('#canvas'));
	}
	let tool = GLBsettings.tool
	if(tool==undefined){tool=''}
	$('body').attr('tool',tool);//update tool as class of <body> 
	//console.log('GLBsettings.tool<='+ tool)
	//**************** sections SHOW/HIDE  **************
	//palette
	if(GLBsettings.visPalette)
	{$('#paletteRow').attr('vis',GLBsettings.visPalette)}
	//left column
	if(GLBsettings.hideLeftColumn)
	{$('#leftColumn').addClass('sectionHide')}
	else
	{$('#leftColumn').removeClass('sectionHide')}
	//right column
	if(GLBsettings.hideRightColumn)
	{$('#rightColumn').addClass('sectionHide')}
	else
	{$('#rightColumn').removeClass('sectionHide')}
	//**************** settings in Right column **************
	$('#BUTT_gameMode')[0].checked = GLBsettings.gameMode;
	updateBodyClass('gameMode',GLBsettings.gameMode);
	$('#BUTT_gameModeSurpriseRes')[0].checked = GLBsettings.gameModeSurpriseRes;
	$('#result').attr('title',GLBsettings.resultString);
	updateBodyClass('gameModeSurpriseRes',GLBsettings.gameModeSurpriseRes);
	populateDropdown(GLBsettings.visSettings);
	let visIndex = GLBsettings.visSettingSelected;
	$dd_visSelection[0].selectedIndex = visIndex;
	if (GLBsettings.visSettings[visIndex]) {
		let visSetting = GLBsettings.visSettings[visIndex];
		$dd_visSelection[0].selectedIndex = GLBsettings.visSettingSelected;
		$('#cb_showPar')[0].checked = visSetting.brackets;
		updateBodyClass('showPar',visSetting.brackets);
		//*********times disposition************
		$('#timesDisposition')[0].selectedIndex = visSetting.timesDisposition;
		let varDisposition = $('#timesDisposition').val();
		$('body').attr('timesDisposition',varDisposition);
		/*
		//reorder terms and add or remove <br>
		let onlyRemoveBr = varDisposition!='brTimes'
		let arr= $('#canvasRole [data-atom=times]').toArray()
		let i = 0;
		for(i=0;arr[i];i++){
			reorderTimes($(arr[i]),onlyRemoveBr)
		}
		*/
		//**************************************
		cb_showNumerator1
		$('#cb_showNumerator1')[0].checked = visSetting.showNumerator1;
		updateBodyClass('showNumerator1',visSetting.showNumerator1);

		$('#cb_fixBorders')[0].checked = visSetting.fixBorders;
		updateBodyClass('fixBorders',visSetting.fixBorders);

		$('#cb_hidePlus')[0].checked = visSetting.hidePlus;
		updateBodyClass('hidePlus',visSetting.hidePlus);
		
		$('#cb_eforall')[0].checked = visSetting.eforall;
		updateBodyClass('eforall',visSetting.eforall);

		if (dd_colors && dd_colors.namedItem(visSetting.colors) != null) {
			let index = dd_colors.namedItem(visSetting.colors).index;
			dd_colors.selectedIndex = index;
			$('body').removeClass('whiteBorders greyBorders coloredBorders');//ripulisci valori precedenti
			$('body').addClass(visSetting.colors)

		}
	}
	
}

/*
$('input[type=radio][name=color]').change(function() {
console.log(this.value);
$('body').removeClass('whiteBorders greyBorders coloredBorders');//ripulisci valori precedenti
$('body').addClass(this.value)//aggiungi la nuova classe
});
*/
function updateBodyClass(myClass,bool){
	if(bool){
			$('body').addClass(myClass);	
		}
		else{
			$('body').removeClass(myClass);
		}
}

function populateDropdown(visSettings) {
	$dd_visSelection.children().remove();
	$.each(visSettings, function(key, entry) {
		$dd_visSelection.append($('<option></option>').attr('value', entry.abbreviation).text(entry.name));
	})
}

var mySettings = document.getElementById('settings');
mySettings.addEventListener('change', function(event) {
	if (event.target.matches('#visSettingSelected')) {
		console.log('changed visSettingSelected');
		GLBsettings.visSettingSelected = $dd_visSelection[0].selectedIndex
	} else {
		console.log('changed settings');
		let visIndex = GLBsettings.visSettingSelected;
		if (GLBsettings.visSettings[visIndex]) {
			let visSetting = GLBsettings.visSettings[visIndex];
			GLBsettings.gameMode = $('#BUTT_gameMode')[0].checked;
			GLBsettings.gameModeSurpriseRes = $('#BUTT_gameModeSurpriseRes')[0].checked;		
			visSetting.brackets = $('#cb_showPar')[0].checked;
			visSetting.timesDisposition = $('#timesDisposition')[0].selectedIndex
			visSetting.fixBorders = $('#cb_fixBorders')[0].checked;
			visSetting.showNumerator1 = $('#cb_showNumerator1')[0].checked;
			visSetting.hidePlus = $('#cb_hidePlus')[0].checked;
			visSetting.eforall = $('#cb_eforall')[0].checked;
			let index = dd_colors.selectedIndex
			visSetting.colors=dd_colors.selectedOptions[0].id
		}
	}
	GLBsettingsToInterface();
	RefreshEmptyInfixBraketsGlued($("#canvasRole"))
});
