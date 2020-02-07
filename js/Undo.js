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
		var $cloneTela = ATOMclone( $("#tela>.secondMember"),false )
		FILO.push($cloneTela)
		//----test------------------inserire due span in "index.html" per vedere i risultati
		//var snap= $.trim($("#test").html())
		//var SnapshotName = prompt('SnapshotName')
		//testSnapshotNames.push(SnapshotName)
		//$("#test").html(SnapshotName)
		//$("#undoNames").html(testSnapshotNames.toString())
		//----------------------------
		console.log('Stored snapshot. Number of snapshots= '+ FILO.length  )
		console.log($cloneTela)
}

ssnapshot.undo = function(){
		if (FILO.length > 1){
			$(FILO.pop()).remove() // butta via l'ultima snapshot
			var toBeRestored = FILO[FILO.length - 1].clone()// ripristina la penultima, in FILO devono essere presenti i cloni degli stati, non gli stati, altrimenti FILO.pop() distrugge stato
			$("#tela>.secondMember").replaceWith(toBeRestored)
			attachEventsAndExtend(toBeRestored,true,false)//process discendence, no need to extend
			//----------test-----------------------
			//$("#test").html(toBeRestored)
			//var poppedName = testSnapshotNames.pop()
			//console.log('popped snapshot ' + poppedName )
			//$("#test").html(testSnapshotNames[testSnapshotNames.length - 1])
			//$("#undoNames").html(testSnapshotNames.toString())
			//-------------------------------------
			attachEventsAndExtend(toBeRestored)
			console.log('restored tela')
			console.log(toBeRestored)
		}
		else {
			console.log('no older status')
		}
		return toBeRestored
}

ssnapshot.copy = function(){
	ssnapshot.clipBoard = ATOMclone($(".selected"));
}
ssnapshot.paste = function(){
	if(ssnapshot.clipBoard.length != 0){
		var $newCds = ATOMclone( ssnapshot.clipBoard );
		$(".selected").replaceWith( $newCds );
		attachEventsAndExtend( $newCds );
	}
}
