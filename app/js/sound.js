//Modulo IIFE (passo 8, software-modules.md §4.1): helper privati nello scope del modulo,
//interfaccia esportata su Aabacus.session + alias globali di compatibilità (index2, newPM, test).
(function (/** @type {any} */ global) {

//no login download
//https://www.fesliyanstudios.com/royalty-free-sound-effects-download/mouse-click-2


var clickSound = new Audio('./sounds/click.mp3');
var victorySound = new Audio('./sounds/Magic-Spell.mp3');

//audio.play()

//--- interfaccia del modulo (software-modules.md §2.6) ---
var api = {
	clickSound: clickSound,
	victorySound: victorySound
};
global.Aabacus = global.Aabacus || {};
Object.assign(global.Aabacus.session = global.Aabacus.session || {}, api);
Object.assign(global, api);//alias globali di compatibilità

})(window);
