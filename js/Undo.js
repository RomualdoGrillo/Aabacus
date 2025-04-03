//snapshot manager

function ssnapshot() {
	//nonappena si inizia un drag viene preso uno snapshot
	//se il drag non determina un cambiamento, si toglie dal FILO l'ultimo snapshot
	// Attenzione	prima di invocare qualsiasi metodo, chiamare ssnapshot per creare oggetto
    
	
		FILO = new Array;
		testSnapshotNames = new Array;
    	ssnapshot.clipBoard = ""
}

ssnapshot.take = function(){
		var rootElement = getExpressionRootNode(); // Ottiene HTMLElement
		if (rootElement) {
			// Converte in jQuery prima di passarlo a ENODEclone
			var $cloneRoot = ENODEclone( $(rootElement), false, false ); // Passa e riceve jQuery
			FILO.push($cloneRoot); // Salva l'oggetto jQuery clonato
		} else {
			console.error("Cannot take snapshot: root node not found.");
		}
		
		//----test------------------inserire due span in "index.html" per vedere i risultati
		//var snap= $.trim($("#test").html())
		//var SnapshotName = prompt('SnapshotName')
		//testSnapshotNames.push(SnapshotName)
		//$("#test").html(SnapshotName)
		//$("#undoNames").html(testSnapshotNames.toString())
		//----------------------------
		//console.log('Stored snapshot. Number of snapshots= '+ FILO.length  )
		//console.log($cloneRoot)
}

ssnapshot.undo = function(){
		var toBeRestored = null; // Inizializza per restituire null se l'undo fallisce
		var currentRootElement = getExpressionRootNode(); // Ottiene HTMLElement

		if (currentRootElement && FILO.length > 0) { // Controlla elemento e stack
			var $currentRoot = $(currentRootElement); // Converte in jQuery

			// Clona l'oggetto jQuery salvato in cima allo stack
			$toBeRestored = FILO[FILO.length - 1].clone(); // Clona jQuery. Questa è la variabile da restituire.

			// Sostituisci usando jQuery
			$currentRoot.replaceWith($toBeRestored);

			// Estendi e inizializza il *nuovo* nodo radice (jQuery)
			ExtendAndInitializeTree($toBeRestored); 

			// Rimuovi lo stato dallo stack
			FILO.pop();
			
			//----------test-----------------------
			// $("#test").html(toBeRestored) // Questo probabilmente non funzionerà bene con oggetto jQuery
			// var poppedName = testSnapshotNames.pop()
			// console.log('popped snapshot ' + poppedName )
			// $("#test").html(testSnapshotNames[testSnapshotNames.length - 1])
			// $("#undoNames").html(testSnapshotNames.toString())
			//-------------------------------------
			// ExtendAndInitializeTree($toBeRestored) // Era duplicato
			// console.log('restored canvas')
			// console.log(toBeRestored)
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
		var $newCds = ENODEclone( ssnapshot.clipBoard,true,false ); //extend, do not removeID
		$(".selected").replaceWith( $newCds );
	}
}
