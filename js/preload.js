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
			injectAll(response)
		}
	});
}
function injectAll(response,rootUrl){
	//console.log(response);
	let all = JSON.parse(response);
	$('#telaRole').children().remove();
	if(all.tavolozza_html && all.tavolozza_html.string){//string data
		//inject(all.tavolozza_html.string, $("#tavolozza"))
		}
	else if(all.tavolozza_html){//url
		preloadAjax(buildPath(rootUrl,all.tavolozza_html),$("#tavolozza"))
	}
	if(all.foundation_mml && all.foundation_mml.string){//string data
		$('#tela').addClass('unlocked');
		refreshAsymmEq($('#tela'));
		inject(all.content_mml.string, $("#telaRole"),true);
		}
	else if(all.foundation_mml){//url
		$('#tela').addClass('unlocked');
		refreshAsymmEq($('#tela'));
		preloadAjax(buildPath(rootUrl,all.foundation_mml),$("#telaRole"));
	}
	if(all.content_mml && all.content_mml.string){//string data
		$('#tela').addClass('unlocked');
		refreshAsymmEq($('#tela'));
		inject(all.content_mml.string, $("#telaRole"),true);
		}
	else if(all.content_mml){//url
		$('#tela').addClass('unlocked');
		refreshAsymmEq($('#tela'));
		preloadAjax(buildPath(rootUrl,all.content_mml),$("#telaRole"));
	}
	if(all.result_mml && all.result_mml.string){//string data
		$('#result').children().remove();
		inject(all.result_mml.string, $('#result'));
	}
	else if(all.result_mml){//url
		$('#result').children().remove();
		preloadAjax(buildPath(rootUrl,all.result_mml),$('#result'))
	}
	if(all.gestToAction_mml && all.gestToAction_mml.string){//string data
		$('#events').children(':not(input)').remove();
		inject(all.gestToAction_mml.string, $('#events'))
		}
	else if(all.gestToAction_mml){//url
		$('#events').children(':not(input)').remove();
		preloadAjax(buildPath(rootUrl,all.gestToAction_mml),$('#events'))
	}
	
	if(all.settings_json && all.settings_json.string){//string data
			GLBsettings = JSON.parse(all.settings_json.string);
			GLBsettingsToInterface();
			RefreshEmptyInfixBraketsGlued($("#telaRole"))
		}
	else if(all.settings_json){//url
		$.getJSON(buildPath(rootUrl,all.settings_json), function(parsedJSON){
			//console.log(parsedJSON);
			GLBsettings = parsedJSON
			GLBsettingsToInterface();
			RefreshEmptyInfixBraketsGlued($("#telaRole"))
		});
	}
	
}


function preloadAjax(myUrl,target) {
	//preloadAjax('./Data/Preload/preload.mml')
	if(myUrl){
	//altrimenti un url vuoto verrebbe interpretato come path relativo,
	//col risultato di caricare index.html
		$.ajax({
			type: "GET",
			url: myUrl,
			async: false,
			dataType: "text",
			error: function(e) {
				alert("AJAX/ errore nel caricare:" + myUrl);
				console.log("Ajax/GET fallita : ", e);
			},
			success: function(response) {
			//alert("lettura file " + myUrl + " tramite Ajax OK - risposta : " + response);
			if(!target){target=$("#telaRole")}
			inject(response, target)
			}
		});
	}
}

let dd_colors = $('#select_colors')[0]
let $dd_visSelection = $('#visSettingSelected');
function GLBsettingsToInterface() {
	$('#BUTT_gameMode')[0].checked = GLBsettings.gameMode;
	updateBodyClass('gameMode',GLBsettings.gameMode);
	$('#BUTT_gameModeSurpriseRes')[0].checked = GLBsettings.gameModeSurpriseRes;
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
		let arr= $('#telaRole [data-atom=times]').toArray()
		let i = 0;
		for(i=0;arr[i];i++){
			reorderTimes($(arr[i]),onlyRemoveBr)
		}
		*/
		//**************************************
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
	if(GLBsettings.lockTela != undefined){
				if(GLBsettings.lockTela){$('#tela').removeClass('unlocked')}
				else{$('#tela').addClass('unlocked')}
				refreshAsymmEq($('#tela'));
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
			visSetting.hidePlus = $('#cb_hidePlus')[0].checked;
			visSetting.eforall = $('#cb_eforall')[0].checked;
			let index = dd_colors.selectedIndex
			visSetting.colors=dd_colors.selectedOptions[0].id
		}
	}
	GLBsettingsToInterface();
	RefreshEmptyInfixBraketsGlued($("#telaRole"))
});
