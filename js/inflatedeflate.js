var leafTags = ["cn", "ci", "csymbol"];


function ENODEcreateMathmlString($startNodes,describeDataType, neglectRootSign) {
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
	var $containerForClone = $('<div></div>')
	//$('#canvasRole').html("") ;var $containerForClone = $('#canvasRole');// debug
	//var $thisClone = $($.parseXML(startNode).firstElementChild)
	let $startNodeOrMML = $(startNodeOrMML)// problema con file misti mml con html vedi Quaderno Aprile Giugno Agosto settembre ottobre 2022
	//let $startNodeOrMML=$($.parseXML(startNodeOrMML)).children(':first')
	//try to rebuild the here??
	if (from_to === "aab_mml" || from_to === "aab_mmlWithType") {
		let $thisClone = $startNodeOrMML.clone()
		$containerForClone.append($thisClone)
		//deflate todo: completare distinzione tra mml e mml + type

		//estendi tutti i nodi ENODE
		$thisClone.parent().find('[data-enode]').each(function(i, node) {
			$.extend(node, ENODE)
		})
		//rimuovi il contenuto importato da altri files
		$thisClone.parent().find('[data-import]').each(function(i, node){node.ENODE_getChildren().remove()});
	

		//signsAsClassesSubtree($thisClone,"SignsAsClasses_to_MinusOp")// converti in modo che il segno meno sia una operazione applicata al nodo
		//sostituisci tutti i nodi ENODE excluding prototypes
		$thisClone.parent().find('[data-enode]').not('[data-proto]').not('.saveAsHtml').each(function(i, node) {
			if (i == 0) {
				ReplaceOneENODE(node, from_to, neglectRootSign);
			} else {
				ReplaceOneENODE(node, from_to, false);
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
			ReplaceOneENODE(node, from_to);
		})
		//signsAsClasses($containerForClone.children(),"MinusOp_to_SignsAsClasses"); // converti root node
		//signsAsClassesSubtree($containerForClone.children(),"MinusOp_to_SignsAsClasses");	// converti il resto dell'albero'	
	}
	return $containerForClone.children()
}

function ReplaceOneENODE(node, from_to, neglectSign) {
	//node is HTML node
	let $node = $(node);
	var $newNode
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
		if (leafTags.indexOf(originalData.enode.toLowerCase()) !== -1) {
			//if [cn;ci;csymbol] then the content is the text, else some role must be present
			nodeText = node.ENODE_getName(true);
			$newNode = $('<' + originalData.enode.toLowerCase() + '/>');
			$newNode.text(nodeText)
		} else {
			/*
			var $role= node.ENODE_getRoles();
			var $bVarChildren=$role.filter('.bVar_role').children().filter('[data-enode]')// se un role è di tipo bvar, viene elencato per primo, e va trattato in modo speciale
			var $nobBvarchildren=$role.not('.bVar_role').children().filter('[data-enode]')
			*/
			var $bVarChildren = node.ENODE_getRoles('.bVar_role').children().filter('[data-enode]')
			// se un role è di tipo bvar, viene elencato per primo, e va trattato in modo speciale
			var $nobBvarchildren = node.ENODE_getRoles(':not(.bVar_role)').children().filter('[data-enode]')
			var $htmlDivChildren = node.ENODE_getRoles(':not(.bVar_role)').children().filter(':not([data-enode])').filter('.saveAsHtml')
			//salvo ciò che è .saveAsHtmlL
			$newNode = $('<apply></apply>')
			$newNode.text(nodeText)
			$newNode.append('<' + originalData.enode + '/>')
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
		delete newData.ENODE//data-enode is manged above
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
		var ENODE;
		//string
		if (node.tagName.toLowerCase() === "apply" || node.tagName === "bind") {
			ENODE = $node.children().filter(':first')[0].tagName.toLowerCase()
		} else {
			////todo!!! devo distinguere e trattare diversamente saveAsHtml 
			ENODE = node.tagName.toLowerCase()
		}
		if (ENODE === "math") {
			$newNode = $node.children()
			//unwrap "math"
		} else {
			var $children = $node.children().not(':first')
			//search for prototype
			//console.log(ENODE)
			let dataType= $node.attr("type");//for compatibility with older format
			if(!dataType){dataType=$node.attr("data-type")};
			var $prototype = prototypeSearch(ENODE, dataType,undefined,nodeText)
			if($prototype.length==0){console.log('prototype not found prototypeSearch()');console.log([ENODE, $node.attr("type"),undefined,nodeText])}
			$newNode = ENODEclone($prototype)
			ENODEextend($newNode)
			// extend the new node
			if (leafTags.indexOf(ENODE.toLowerCase()) !== -1) {
				//todo: eccezione if leafTag with children
				try {
					$newNode[0].ENODE_setName($node.text());
				} catch (err) {
					console.log('error on prototype '+ENODE+" "+ $node.attr("type"))
				}
				//signsAsClasses($newNode,"SignsInNames_to_SignsAsClasses"); //convert to_signs_as_classes 
			} else {
				//append children in roles
				var $tgtRoles = $newNode[0].ENODE_getRoles();
				if($tgtRoles.length==0){
					$newNode[0].ENODE_addRole();
					$tgtRoles = $newNode[0].ENODE_getRoles();
				}
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
					var places = getNumOfPlaces($(e))[1]
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
				noBVarChildren.removeAttr('processed')
			}
		}
		newData=originalData;
		//data.ENODE=xxx is already cloned from prototype
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


function $parserForMixedMMLHTML(toBeParsed){
	// $(string) gives strange results when div or img are present
	//$parserForMixedMMLHTML('<math xmlns="http://www.w3.org/1998/Math/MathML"><apply data-type="num"><plus></plus><cn data-type="num">2</cn><div data-enode="times" data-type="num" class="ENODE saveAsHtml" draggable="false" style="background-color: red;"><div class="ul_role" data-type="num"><cn data-type="num">6</cn><cn data-type="num">2</cn></div></div><apply data-type="num"><minus></minus><cn data-type="num">1</cn></apply></apply></math>')
	let string
	if (toBeParsed instanceof jQuery){string=toBeParsed[0].outerHTML}
	else{string = toBeParsed};
	let stringDix = string.replace(/<div>/g, "<dix>").replace(/<div /g, "<dix ").replace(/div>/g, "dix>");
	let $workTree = $(stringDix);
	//$('#canvasRole').append($workTree)// debug
	//replace one <dix> node with <div> 
	let len = $workTree.find('dix').length
	for(i=0;i<len;i++){
		let $dix = $workTree.find('dix:first');
		if($dix.length == 0){break}
		let $children = $dix.children();
		$children.remove();
		let outer = $dix[0].outerHTML.replace(/<dix>/g, "<div>").replace(/<dix /g, "<div ").replace(/dix>/g, "div>");;
		let $outer = $(outer);
		$dix.replaceWith($outer);
		$outer.append($children);
	}
	return $workTree
}