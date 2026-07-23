//snapshot manager — FILO dichiarato in state.js

/**
 * Inizializza lo snapshot manager dell'undo: azzera lo stack FILO (dichiarato in
 * state.js) e la clipboard interna. Attenzione: chiamare ssnapshot() per creare
 * l'oggetto prima di invocare qualsiasi metodo (take/undo/copy/paste).
 * @returns {void}
 */
function ssnapshot() {
		FILO = new Array;
    	ssnapshot.clipBoard = ""
}

/**
 * Prende uno snapshot: clona la radice dell'espressione corrente
 * (getExpressionRootNode) e impila il clone su FILO; se la radice non esiste
 * logga un errore. La politica (quando fotografare) è dei chiamanti.
 * @returns {void}
 */
ssnapshot.take = function(){
		const rootElement = getExpressionRootNode(); // Ottiene HTMLElement
		if (rootElement) {
			// Converte in jQuery prima di passarlo a ENODEclone
			const $cloneRoot = ENODEclone( $(rootElement), false, false ); // Passa e riceve jQuery
			FILO.push($cloneRoot); // Salva l'oggetto jQuery clonato
		} else {
			console.error("Cannot take snapshot: root node not found.");
		}
}

/**
 * Ripristina l'ultimo snapshot: sostituisce la radice corrente con un clone della
 * cima dello stack FILO, ri-estende/inizializza il nuovo albero e rimuove lo
 * stato dallo stack.
 * @returns {JQuery|null} Il nodo radice ripristinato, o null se lo stack è vuoto o la radice corrente non esiste.
 */
ssnapshot.undo = function(){
		let $toBeRestored = null; // Inizializza per restituire null se l'undo fallisce
		const currentRootElement = getExpressionRootNode(); // Ottiene HTMLElement

		if (currentRootElement && FILO.length > 0) { // Controlla elemento e stack
			const $currentRoot = $(currentRootElement); // Converte in jQuery

			// Clona l'oggetto jQuery salvato in cima allo stack
			$toBeRestored = FILO[FILO.length - 1].clone(); // Clona jQuery. Questa è la variabile da restituire.

			// Sostituisci tramite ExpressionManager
			ENODEreplaceNode($currentRoot, $toBeRestored);

			// Estendi e inizializza il *nuovo* nodo radice (jQuery)
			ExtendAndInitializeTree($toBeRestored); 

			// Rimuovi lo stato dallo stack
			FILO.pop();
		}
		else {
			if (!currentRootElement) console.error("Cannot perform undo: current expression root node not found.");
        	if (FILO.length === 0) console.log("Undo stack empty.");
		}
		return $toBeRestored; // Restituisce l'oggetto jQuery ripristinato o null
}

/**
 * Copia nella clipboard interna (ssnapshot.clipBoard) un clone degli elementi
 * .selected (non esteso, con ID conservati).
 * @returns {void}
 */
ssnapshot.copy = function(){
	ssnapshot.clipBoard = ENODEclone($(".selected"),false,false);
}
/**
 * Incolla: se la clipboard non è vuota, sostituisce gli elementi .selected con
 * un clone (esteso, con ID conservati) del contenuto copiato.
 * @returns {void}
 */
ssnapshot.paste = function(){
	if(ssnapshot.clipBoard.length != 0){
		const $newCds = ENODEclone( ssnapshot.clipBoard,true,false ); //extend, do not removeID
		ENODEreplaceNode( $(".selected"), $newCds );
	}
}
