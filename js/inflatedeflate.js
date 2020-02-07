var leafTags = ["cn","ci","csymbol"];

function createMathmlString($ATOMs,describeDataType,neglectRootSign){
	var from_to
	if(describeDataType){
		from_to="aab_mmlWithType"
	}
	else{
		from_to="aab_mml"
	}
	var $convertedTree = createConvertedTree($ATOMs,from_to,neglectRootSign);
	return $.trim($convertedTree.parent().html())
	//return formatXml($convertedTree.parent().html())

}

function ATOM_createMathmlString(describeDataType, neglectRootSign){
	var from_to
	if(describeDataType){
		from_to="aab_mmlWithType"
	}
	else{
		from_to="aab_mml"
	}
	var $convertedTree = createConvertedTree(this,from_to,neglectRootSign);
	//return $.trim($convertedTree.parent().html())
	return formatXml($convertedTree.parent().html())

}

function createConvertedTree(startNode,from_to,neglectRootSign){
	var $containerForClone = $('<span></span>')
	//$('#testSpan').html("") ;var $containerForClone = $('#testSpan');// debug
	//var $thisClone = $($.parseXML(startNode).firstElementChild)
	var $thisClone = $(startNode).clone()
	//try to rebuild the here??
	$containerForClone.append($thisClone)
	if( from_to === "aab_mml" || from_to === "aab_mmlWithType"){//deflate todo: completare distinzione tra mml e mml + type
		
		//estendi tutti i nodi ATOM
		$thisClone.parent().find('[data-atom]').each(function( i, node ){
			$.extend(node,atom)
		})
		
		//signsAsClassesSubtree($thisClone,"SignsAsClasses_to_MinusOp")// converti in modo che il segno meno sia una operazione applicata al nodo
		//sostituisci tutti i nodi ATOM
		$thisClone.parent().find('[data-atom]').each(function( i, node ){
			if( i==0 ){
				ReplaceOneATOM(node,from_to,neglectRootSign);
			}
			else{
				ReplaceOneATOM(node,from_to,false);//never neglect sign if not root 
			}
		})
	}
	else if(from_to === "mml_aab"){//inflate
		//ottieni l'elenco dei nodi' da sostituire
		$thisClone.parent().find('apply,cn,ci,bind,math').each(function( i, node ){
			//console.log(node);
			ReplaceOneATOM(node,from_to);
		})
		//signsAsClasses($containerForClone.children(),"MinusOp_to_SignsAsClasses"); // converti root node
		//signsAsClassesSubtree($containerForClone.children(),"MinusOp_to_SignsAsClasses");	// converti il resto dell'albero'	
	}
	return $containerForClone.children()
}

function ReplaceOneATOM(node,from_to,neglectSign){//node is HTML node
	var $newNode
	var dataType
	var ATOMtype
	var isMinimized
	var title
	if( from_to === "aab_mml" || from_to === "aab_mmlWithType"){
		dataType = $(node).attr('data-type')
		ATOMtype = $(node).attr('data-atom')
		title = $(node).attr('title')//
		isMinimized = $(node).hasClass('minimized')
		if(!neglectSign){
			//signsAsClasses($(node),"SignsAsClasses_to_MinusOp") // converti   	
		}
		var nodeText = ""
		if(  leafTags.indexOf(ATOMtype.toLowerCase()) !== -1   ){//if [cn;ci;csymbol] then the content is the text, else some role must be present
			nodeText = node.ATOM_getName(true);
			$newNode = $('<'+ ATOMtype.toLowerCase() +'/>');
			$newNode.text(nodeText)
		} 
		else{
			/*
			var $role= node.ATOM_getRoles();
			var $bVarChildren=$role.filter('.bVar_role').children().filter('[data-atom]')// se un role è di tipo bvar, viene elencato per primo, e va trattato in modo speciale
			var $nobBvarchildren=$role.not('.bVar_role').children().filter('[data-atom]')
			*/
			var $bVarChildren=node.ATOM_getRoles('.bVar_role').children().filter('[data-atom]')// se un role è di tipo bvar, viene elencato per primo, e va trattato in modo speciale
			var $nobBvarchildren=node.ATOM_getRoles(':not(.bVar_role)').children().filter('[data-atom]')
			var $htmlDivChildren = node.ATOM_getRoles(':not(.bVar_role)').children().filter(':not([data-atom])').filter('.saveAsHtml')//salvo ciò che è .saveAsHtmlL
			$newNode = $('<apply></apply>')
			$newNode.text(nodeText)
			$newNode.append('<'+ ATOMtype +'/>')
			$newNode.append( $bVarChildren.wrap('<bvar>').parent());
			$newNode.append($nobBvarchildren);
			$newNode.append($htmlDivChildren);
		}
		if(isMinimized){	$newNode.attr("minimized","True")}
		//if(title != undefined){	$newNode.attr('title',title)}//se presente salva anche il titolo
		if(title){	$newNode.attr('title',title)}//se presente e diverso da "" salva anche il titolo
		if( from_to === "aab_mmlWithType"){
			$newNode.attr('type',dataType)// from MathML 3.0 specifications: The type attribute can be interpreted to provide rendering information.
		}
	}
	else if(from_to === "mml_aab"){//inflate: =first child tag; if tag==csymbol or ci or cn allora considera il contenuto
		dataType = $(node).attr('type')
		isMinimized = ( $(node).attr('minimized')=="True")
		title = $(node).attr('title')
		var nodeText = $(node)
			.clone()    //clone the element
			.children() //select all the children
			.remove()   //remove all the children
			.end()  //again go back to selected element
			.text();
		var tag;//string
		if(node.tagName.toLowerCase() === "apply" || node.tagName === "bind"){
		tag = $(node).children().filter(':first')[0].tagName.toLowerCase()			
		}
		else{
			////todo!!! devo distinguere e trattare diversamente saveAsHtml 
			tag = node.tagName.toLowerCase()
		}
		if( tag === "math"){
			$newNode=$(node).children() //unwrap "math"
			}
		else if (tag === "saveAsHtml") {//gestire qui 
               //non sostituire e non fare nulla
		}
		else{
			var $children = $(node).children().not(':first')
			//search for prototype
			//console.log(tag)
			var $prototype = prototypeSearch(tag, $(node).attr("type"))
			$newNode = ATOMclone($prototype)
			ATOMextend($newNode)// extend the new node
			if( leafTags.indexOf(tag.toLowerCase()) !== -1 ){//todo: eccezione if leafTag with children
				$newNode[0].ATOM_setName($(node).text());
				//signsAsClasses($newNode,"SignsInNames_to_SignsAsClasses"); //convert to_signs_as_classes 
			}
			else{		
				//append children in roles
				var $tgtRoles= $newNode[0].ATOM_getRoles()
				var $bVarRole = $tgtRoles.filter('.bVar_role');
				var $noBVarRole = $tgtRoles.not('.bVar_role');
				$newNode.prepend(nodeText);
				if( $bVarRole.length > 0 ){
					$children.filter('bvar').each(function(i,e){ $(e).children().appendTo($bVarRole)})	
				}
				noBVarChildren = $children.not('bvar')// globale per renderlo disponibile in each
				$noBVarRole.each(function(i,e){
					var places = getNumOfPlaces($(e))
					if(places===-1){places = undefined} // splice(x,undefined) means splice until the end
					var toBeAppended = noBVarChildren.not('[processed]').slice(0,places);//splice appears to behave not as expected
					//noBVarChildren.slice(0,places).attr("processed","")
					toBeAppended.attr("processed","")
					$(e).append(toBeAppended);
				})
			}
		}
		if( dataType !== undefined ){
			$newNode.attr('data-type',dataType)// from MathML 3.0 specifications: The type attribute can be interpreted to provide rendering information.
		}
		if(isMinimized){$newNode.addClass("minimized")}		
		if( title !== undefined ){
			$newNode.attr('title', title)//
		}	
	}
	$(node).replaceWith($newNode)	
}
