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
		var $cloneCanvas = exprNodeclone( $("#canvas>.secondMember"),false,false )
		FILO.push($cloneCanvas)
		
		//----test------------------inserire due span in "index.html" per vedere i risultati
		//var snap= $.trim($("#test").html())
		//var SnapshotName = prompt('SnapshotName')
		//testSnapshotNames.push(SnapshotName)
		//$("#test").html(SnapshotName)
		//$("#undoNames").html(testSnapshotNames.toString())
		//----------------------------
		//console.log('Stored snapshot. Number of snapshots= '+ FILO.length  )
		//console.log($cloneCanvas)
}

,  ssnapshot.undo = function(){
		if (FILO.length > 1){
			$(FILO.pop()).remove() // butta via l'ultima snapshot
			var toBeRestored = FILO[FILO.length - 1].clone()// ripristina la penultima, in FILO devono essere presenti i cloni degli stati, non gli stati, altrimenti FILO.pop() distrugge stato
			$("#canvas>.secondMember").replaceWith(toBeRestored)
			ExtendAndInitializeTree(toBeRestored)
			//----------test-----------------------
			//$("#test").html(toBeRestored)
			//var poppedName = testSnapshotNames.pop()
			//console.log('popped snapshot ' + poppedName )
			//$("#test").html(testSnapshotNames[testSnapshotNames.length - 1])
			//$("#undoNames").html(testSnapshotNames.toString())
			//-------------------------------------
			ExtendAndInitializeTree(toBeRestored)
			//console.log('restored canvas')
			//console.log(toBeRestored)
		}
		else {
			console.log('no older status')
		}
		return toBeRestored
}

ssnapshot.copy = function(){
	ssnapshot.clipBoard = exprNodeclone($(".selected"),false,false);
}
ssnapshot.paste = function(){
	if(ssnapshot.clipBoard.length != 0){
		var $newCds = exprNodeclone( ssnapshot.clipBoard,true,false ); //extend, do not removeID
		$(".selected").replaceWith( $newCds );
	}
}
