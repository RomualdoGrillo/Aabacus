//snapshot manager
let FILO;

function ssnapshot() {
	// Attenzione	prima di invocare qualsiasi metodo, chiamare ssnapshot per creare oggetto
		FILO = new Array;
    	ssnapshot.clipBoard = ""
}

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

ssnapshot.copy = function(){
	ssnapshot.clipBoard = ENODEclone($(".selected"),false,false);
}
ssnapshot.paste = function(){
	if(ssnapshot.clipBoard.length != 0){
		const $newCds = ENODEclone( ssnapshot.clipBoard,true,false ); //extend, do not removeID
		ENODEreplaceNode( $(".selected"), $newCds );
	}
}
