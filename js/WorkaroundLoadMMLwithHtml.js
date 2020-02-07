
//that's a workaround, search for "workaround for jquery parsing" document

function insertHtmlByRef($toBeAppended){
	//
	var $tgt=$toBeAppended.find('tgtref')
	$tgt.each(function(i,e){
		var tref = e.getAttribute('tref')
		var $replacer = $toBeAppended.find('[ref='+ tref +']')
		if( $replacer ){
			$(e).replaceWith($replacer) //replaceWith
			$replacer.removeAttr('ref')
		}
	})
}

function XXX(){
    // workaround when loading
    	
}
