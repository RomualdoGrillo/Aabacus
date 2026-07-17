//Ponte impostazioni <-> interfaccia: applica GLBsettings ai controlli della colonna destra
//e riflette le modifiche dell'utente su GLBsettings.
//Estratto da preload.js (passo 5 del piano in project/specs/software-modules.md).

let dd_colors = $('#select_colors')[0]
let $dd_visSelection = $('#visSettingSelected');
function GLBsettingsToInterface() {
	
	if(GLBsettings.tiedCanvas != undefined){
		if(GLBsettings.tiedCanvas){$('#canvas').removeClass('untied')}
		else{$('#canvas').addClass('untied')}
		ENODERefreshAsymmEq($('#canvas'));
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
		//**************************************
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
