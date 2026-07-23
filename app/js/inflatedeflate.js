//i tag foglia sono definiti nella costante "symbols" (ExpressionManager.js)


/**
 * Serializza uno o più alberi ENODE in una stringa MathML formattata (deflate).
 * @param {JQuery} $startNodes - Nodi ENODE di partenza.
 * @param {boolean} [describeDataType] - Se true serializza anche i data-type (formato "aab_mmlWithType" anziché "aab_mml").
 * @param {boolean} [neglectRootSign] - Se true ignora il segno del nodo radice nella serializzazione.
 * @returns {string} La stringa MathML formattata (via formatXml), oppure "" se la conversione non produce nodi.
 */
function ENODEcreateMathmlString($startNodes,describeDataType, neglectRootSign) {
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

/**
 * Conversione bidirezionale albero ENODE ⇄ MathML: clona l'input in un
 * contenitore di lavoro e sostituisce nodo per nodo (via ReplaceOneENODE)
 * nella direzione indicata da from_to.
 * @param {JQuery|Element|string} startNodeOrMML - Albero ENODE di partenza (deflate) oppure markup/nodi MathML (inflate).
 * @param {string} from_to - Direzione di conversione: "aab_mml" o "aab_mmlWithType" (ENODE → MathML, con o senza data-type) oppure "mml_aab" (MathML → ENODE).
 * @param {boolean} [neglectRootSign] - Solo in deflate: se true ignora il segno del nodo radice.
 * @param {string} [toBeImported] - Solo in inflate: se indicato converte soltanto i nodi con [data-tag=toBeImported], altrimenti tutto l'input.
 * @returns {JQuery} I nodi convertiti (figli del contenitore di lavoro, staccati dal DOM).
 */
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

		//rimuovi il contenuto importato da altri files
		$thisClone.parent().find('[data-import]').each(function(i, node){ENODE_getChildren(node).remove()});
	

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
		if (symbols.indexOf(originalData.enode.toLowerCase()) !== -1) {
			//if [cn;ci;csymbol] then the content is the text, else some role must be present
			nodeText = ENODE_getName(node, true);
			$newNode = $('<' + originalData.enode.toLowerCase() + '/>');
			$newNode.text(nodeText)
		} else {
			/*
			var $role= ENODE_getRoles(node);
			var $bVarChildren=$role.filter('.bVar_role').children().filter('[data-enode]')// se un role è di tipo bvar, viene elencato per primo, e va trattato in modo speciale
			var $nobBvarchildren=$role.not('.bVar_role').children().filter('[data-enode]')
			*/
			var $bVarChildren = ENODE_getRoles(node, '.bVar_role').children().filter('[data-enode]')
			// se un role è di tipo bvar, viene elencato per primo, e va trattato in modo speciale
			var $nobBvarchildren = ENODE_getRoles(node, ':not(.bVar_role)').children().filter('[data-enode]')
			var $htmlDivChildren = ENODE_getRoles(node, ':not(.bVar_role)').children().filter(':not([data-enode])').filter('.saveAsHtml')
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
			if (symbols.indexOf(ENODE.toLowerCase()) !== -1) {
				//todo: eccezione if leafTag with children
				try {
					ENODE_setName($newNode, $node.text());
				} catch (err) {
					console.log('error on prototype '+ENODE+" "+ $node.attr("type"))
				}
				//signsAsClasses($newNode,"SignsInNames_to_SignsAsClasses"); //convert to_signs_as_classes 
			} else {
				//append children in roles
				var $tgtRoles = ENODE_getRoles($newNode);
				if($tgtRoles.length==0){
					ENODE_addRole($newNode);
					$tgtRoles = ENODE_getRoles($newNode);
				}
				var $bVarRole = $tgtRoles.filter('.bVar_role');
				var $noBVarRole = $tgtRoles.not('.bVar_role');
				$newNode.prepend(nodeText);
				if ($bVarRole.length > 0) {
					$children.filter('bvar').each(function(i, e) {
						$(e).children().appendTo($bVarRole)
					})
				}
				let noBVarChildren = $children.not('bvar')
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


/**
 * Parser per markup misto MathML + HTML: $(string) dà risultati inattesi quando
 * nel MathML sono presenti div o img, quindi i tag div vengono temporaneamente
 * rinominati in "dix" per il parsing e poi ricostruiti uno a uno come veri div.
 * @param {JQuery|string} toBeParsed - Markup da interpretare (stringa) o nodo jQuery di cui usare l'outerHTML.
 * @returns {JQuery} L'albero jQuery risultante, con i div ripristinati.
 */
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
	for(let i=0;i<len;i++){
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