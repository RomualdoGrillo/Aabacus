// Stato condiviso dell'applicazione (passo 6, project/specs/software-modules.md).
// Caricato per primo tra gli script dell'app (dopo jQuery). Tutti i campi sono
// globali intenzionali fino al passo 8 (namespace / ES modules).
//
// GLBsettings — configurazione esercizio/sessione
//   Scrittura: preload.js (caricamento .mmls / .json), settings.js (pannello
//     destro), MAIN.js (tiedCanvas al click sull'angolo definizione,
//     movesCounter in PActxConclude, tool in changeTool).
//   Lettura:  settings.js, MAIN.js, DnD.js, UserEvToFunctCall.js, game.js.
//   Campi principali: tool, tiedCanvas, gameMode, gameModeSurpriseRes,
//     visSettings, visSettingSelected, visPalette, hideLeftColumn,
//     hideRightColumn, resultString, movesCounter, movesMinNumber.
//   tiedCanvas true  = canvas tied (vincolato); false = untied (costruzione).
//
// debugMode — modalità debug (marcature visibili, palette nascosta, skip import)
//   Scrittura: MAIN.js (debugToggle, Shift+D).
//   Lettura:  preload.js, PMTutilities.js, ExpressionManager.js, DnD.js,
//     PatternMatchingTrasform.js, MAIN.js.
//
// preloadPath — URL del file .mmls da caricare al boot
//   Scrittura: qui (query string ?preloadPath=..., default PRELOAD.mmls).
//   Lettura:  MAIN.js (preloadAll).
//
// tools — elenco ciclico dei tool disponibili ("", copy, autoAdapt, declare)
//   Scrittura: nessuna (costante).
//   Lettura:  MAIN.js (changeTool, Tab).
//
// FILO — stack LIFO di cloni jQuery dell'albero radice per undo
//   Scrittura: Undo.js (ssnapshot(), ssnapshot.take, ssnapshot.undo).
//   Lettura:  Undo.js.
//
// ssnapshot — manager undo/copy/paste (funzione factory + metodi take/undo/
//   copy/paste definiti in Undo.js; clipBoard è proprietà di ssnapshot)
//   Scrittura: Undo.js; invocazione: MAIN.js, SaveLoad.js, TranslateFormat.js.
//   Lettura:  MAIN.js (scorciatoie tastiera, PActxConclude, rename, tie).

let GLBsettings;
let debugMode = false;

let preloadPath = window.location.href.split('preloadPath=')[1];
if (!preloadPath) {
	preloadPath = './Data/Preload/PRELOAD.mmls';
}

const tools = ["", "copy", "autoAdapt", "declare"];

let FILO;
