var leafTags = ["cn", "ci", "csymbol"];


function MNODEcreateMathmlString($startNodes,describeDataType, neglectRootSign) {
	//per poter chiamare sia come funzione che come metodo
	if ($startNodes == undefined) {
		$startNodes = $(this);
	}
	var from_to
	if (describeDataType) {
		from_to = "aab_mmlWithType"
	} else {
		from_to = "aab_mml"
	}
	var $convertedTree = createConvertedTree($startNodes, from_to, neglectRootSign);
	let returnString = ""
	if($convertedTree.length!=0){
		//returnString = $.trim($convertedTree.parent().html())
		returnString = formatXml($convertedTree.parent().html())
	}
	//return $.trim($convertedTree.parent().html())
	return returnString

}

function createConvertedTree(startNodeOrMML, from_to, neglectRootSign,toBeImported) {
	var $containerForClone = $('<span></span>')
	//$('#testSpan').html("") ;var $containerForClone = $('#testSpan');// debug
	//var $thisClone = $($.parseXML(startNode).firstElementChild)
	let $startNodeOrMML = $(startNodeOrMML)
	//try to rebuild the here??
	if (from_to === "aab_mml" || from_to === "aab_mmlWithType") {
		let $thisClone = $startNodeOrMML.clone()
		$containerForClone.append($thisClone)
		//deflate todo: completare distinzione tra mml e mml + type

		//estendi tutti i nodi MNODE
		$thisClone.parent().find('[data-atom]').each(function(i, node) {
			$.extend(node, atom)
		})
		//rimuovi il contenuto importato da altri files
		$thisClone.parent().find('[data-import]').each(function(i, node){node.MNODE_getChildren().remove()});
	

		//signsAsClassesSubtree($thisClone,"SignsAsClasses_to_MinusOp")// converti in modo che il segno meno sia una operazione applicata al nodo
		//sostituisci tutti i nodi MNODE excluding prototypes
		$thisClone.parent().find('[data-atom]').not('[data-proto]').each(function(i, node) {
			if (i == 0) {
				ReplaceOneMNODE(node, from_to, neglectRootSign);
			} else {
				ReplaceOneMNODE(node, from_to, false);
				//never neglect sign if not root 
			}
		})
	} else if (from_to === "mml_aab") {
		//filtra solo le tag da importare
		let $mmlTagSubset
		if(toBeImported){
			$mmlTagSubset = $startNodeOrMML.find('[data-tag=' + toBeImported + ']')
		}
		else{//if no item is specified import all
			$mmlTagSubset = $startNodeOrMML
			//wrap
		}
		$containerForClone.append($mmlTagSubset)
		//inflate
		//ottieni l'elenco dei nodi' da sostituire
		$mmlTagSubset.parent().find('apply,cn,ci,bind,math').each(function(i, node) {
			//console.log(node);
			ReplaceOneMNODE(node, from_to);
		})
		//signsAsClasses($containerForClone.children(),"MinusOp_to_SignsAsClasses"); // converti root node
		//signsAsClassesSubtree($containerForClone.children(),"MinusOp_to_SignsAsClasses");	// converti il resto dell'albero'	
	}
	return $containerForClone.children()
}

function ReplaceOneMNODE(node, from_to, neglectSign) {
	//node is HTML node
	let $node = $(node);
	var $newNode
	var isMinimized
	var isMedium
	var originalData
	var title
	if (from_to === "aab_mml" || from_to === "aab_mmlWithType") {
		//get all data attributes
		originalData = $node.data()
		title = $node.attr('title')
		
		if( $node.attr('data-tag') ) {
			if($node[0].style.backgroundImage){ 
				originalData.tagimg = wrapUnwrapUrlString( $node[0].style.backgroundImage , true );
			}
		}
		if (!neglectSign) {//signsAsClasses($node,"SignsAsClasses_to_MinusOp") // converti   	
		}
		var nodeText = ""
		if (leafTags.indexOf(originalData.atom.toLowerCase()) !== -1) {
			//if [cn;ci;csymbol] then the content is the text, else some role must be present
			nodeText = node.MNODE_getName(true);
			$newNode = $('<' + originalData.atom.toLowerCase() + '/>');
			$newNode.text(nodeText)
		} else {
			/*
			var $role= node.MNODE_getRoles();
			var $bVarChildren=$role.filter('.bVar_role').children().filter('[data-atom]')// se un role è di tipo bvar, viene elencato per primo, e va trattato in modo speciale
			var $nobBvarchildren=$role.not('.bVar_role').children().filter('[data-atom]')
			*/
			var $bVarChildren = node.MNODE_getRoles('.bVar_role').children().filter('[data-atom]')
			// se un role è di tipo bvar, viene elencato per primo, e va trattato in modo speciale
			var $nobBvarchildren = node.MNODE_getRoles(':not(.bVar_role)').children().filter('[data-atom]')
			var $htmlDivChildren = node.MNODE_getRoles(':not(.bVar_role)').children().filter(':not([data-atom])').filter('.saveAsHtml')
			//salvo ciò che è .saveAsHtmlL
			$newNode = $('<apply></apply>')
			$newNode.text(nodeText)
			$newNode.append('<' + originalData.atom + '/>')
			$newNode.append($bVarChildren.wrap('<bvar>').parent());
			$newNode.append($nobBvarchildren);
			$newNode.append($htmlDivChildren);
		}
		//if(title != undefined){	$newNode.attr('title',title)}//se presente salva anche il titolo
		if (title) {//se presente e diverso da "" salva anche il titolo
			$newNode.attr('title', title)
		}
		// from MathML 3.0 specifications: The type attribute can be interpreted to provide rendering information.
		let newData = originalData
		delete newData.atom
		writeData($newNode,newData)

		
	} else if (from_to === "mml_aab") {
		//inflate: =first child tag; if tag==csymbol or ci or cn allora considera il contenuto
		originalData = $node.data();
		title = $node.attr('title');
		
		var nodeText = $node.clone()//clone the element
		.children()//select all the children
		.remove()//remove all the children
		.end()//again go back to selected element
		.text();
		var atom;
		//string
		if (node.tagName.toLowerCase() === "apply" || node.tagName === "bind") {
			atom = $node.children().filter(':first')[0].tagName.toLowerCase()
		} else {
			////todo!!! devo distinguere e trattare diversamente saveAsHtml 
			atom = node.tagName.toLowerCase()
		}
		if (atom === "math") {
			$newNode = $node.children()
			//unwrap "math"
		} else if (atom === "saveAsHtml") {//gestire qui 
		//non sostituire e non fare nulla
		} else {
			var $children = $node.children().not(':first')
			//search for prototype
			//console.log(atom)
			let dataType= $node.attr("type");//for compatibility with older format
			if(!dataType){dataType=$node.attr("data-type")};
			var $prototype = prototypeSearch(atom, dataType,undefined,nodeText)
			if($prototype.length==0){console.log('prototype not found prototypeSearch()');console.log([atom, $node.attr("type"),undefined,nodeText])}
			$newNode = MNODEclone($prototype)
			MNODEextend($newNode)
			// extend the new node
			if (leafTags.indexOf(atom.toLowerCase()) !== -1) {
				//todo: eccezione if leafTag with children
				try {
					$newNode[0].MNODE_setName($node.text());
				} catch (err) {
					console.log('error on prototype '+atom+" "+ $node.attr("type"))
				}
				//signsAsClasses($newNode,"SignsInNames_to_SignsAsClasses"); //convert to_signs_as_classes 
			} else {
				//append children in roles
				var $tgtRoles = $newNode[0].MNODE_getRoles()
				var $bVarRole = $tgtRoles.filter('.bVar_role');
				var $noBVarRole = $tgtRoles.not('.bVar_role');
				$newNode.prepend(nodeText);
				if ($bVarRole.length > 0) {
					$children.filter('bvar').each(function(i, e) {
						$(e).children().appendTo($bVarRole)
					})
				}
				noBVarChildren = $children.not('bvar')
				// globale per renderlo disponibile in each
				$noBVarRole.each(function(i, e) {
					var places = getNumOfPlaces($(e))
					if (places === -1) {
						places = undefined
					}
					// splice(x,undefined) means splice until the end
					var toBeAppended = noBVarChildren.not('[processed]').slice(0, places);
					//splice appears to behave not as expected
					//noBVarChildren.slice(0,places).attr("processed","")
					toBeAppended.attr("processed", "")
					$(e).append(toBeAppended);
				})
			}
		}
		newData=originalData;
		//data.atom=xxx is already cloned from prototype
		if (newData.tag !== undefined) {
			if(originalData.tagimg){
				$newNode.css('background-image',wrapUnwrapUrlString(originalData.tagimg))	
			}
		}
		writeData($newNode,newData)
		// from MathML 3.0 specifications: The type attribute can be interpreted to provide rendering information.
		if (title !== undefined) {
			$newNode.attr('title', title)
			//
		}
	}
	$node.replaceWith($newNode)
}
