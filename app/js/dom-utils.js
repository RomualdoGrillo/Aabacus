//Utilità generiche su DOM, stringhe e array, senza logica applicativa.
//Estratte da AldoUtilities.js (passo 5 del piano in project/specs/software-modules.md).

/**
 * Rimuove una classe CSS dal nodo di partenza e da tutta la sua discendenza.
 * @param {string} Class - Nome della classe da rimuovere.
 * @param {JQuery} [$startNode] - Nodo di partenza (incluso); se assente pulisce tutti gli elementi del documento.
 * @returns {void}
 */
function removeClassStartNodeAndDiscendence(Class, $startNode) {
	let $toBeCleaned
	if ($startNode == undefined) {
		$toBeCleaned = $('*')
	} else {
		$toBeCleaned = $startNode.find('*').addBack()
	}
	$toBeCleaned.removeClass(Class);
}

/**
 * Rimuove da un sottoalbero tutte le classi CSS che iniziano con un prefisso.
 * Esempio: removeClassByPrefix(undefined, 'temp') rimuove tutte le classi temporanee.
 * @param {JQuery} [$startNode] - Radice della pulizia; se assente o vuota usa #result,#canvas,#palette.
 * @param {string} prefix - Prefisso delle classi da rimuovere; se falsy non fa nulla.
 * @param {boolean} [tree] - Se diverso da false include anche i div discendenti la cui classe contiene il prefisso.
 * @returns {void}
 */
function removeClassByPrefix($startNode,prefix,tree) {
	if(!prefix){return}

	if ($startNode == undefined || $startNode.length == 0) {
		$startNode = $("#result,#canvas,#palette")
	}
	var $elements; //list of elements to be cleaned
	if (tree != false) {
		$elements = $startNode.add($startNode.find('div[class*="' + prefix + '"]'));
	} else {
		$elements = $startNode;
	}
	$elements.map(function(){
		for(var i = this.classList.length - 1; i >= 0; i--) {
			if(this.classList[i].startsWith(prefix)) {
				this.classList.remove(this.classList[i]);
			}
		}
	
	})
}

/**
 * Risolve un path relativo rispetto a un URL base (il nome file finale del base
 * viene scartato; supporta "." e "..").
 * Da https://stackoverflow.com/questions/14780350/convert-relative-path-to-absolute-using-javascript
 * @param {string} base - URL base; se falsy viene restituito relative invariato.
 * @param {string} relative - Path relativo da risolvere.
 * @returns {string} Il path risolto.
 */
function buildPath(base, relative) {
	if (base) {
		var stack = base.split("/")
		  , parts = relative.split("/");
		stack.pop();
		// remove current file name (or empty string)
		// (omit if "base" is the current folder without trailing slash)
		for (var i = 0; i < parts.length; i++) {
			if (parts[i] == ".")
				continue;
			if (parts[i] == "..")
				stack.pop();
			else
				stack.push(parts[i]);
		}
		return stack.join("/");

	} else {
		return relative
	}
}

/**
 * Avvolge/spoglia una stringa nella forma CSS url(...).
 * - wrap: wrapUnwrapUrlString("../Aabacus/images/a.png") → "url(...)"
 * - unwrap: wrapUnwrapUrlString("url(../Aabacus/images/a.png)", true) → path senza url() e virgolette
 * - cutFirstDir: wrapUnwrapUrlString("url(../Aabacus/images/a.png)", 'cutFirstDir') → path senza la prima directory
 * @param {string} string - Stringa/URL di partenza.
 * @param {boolean|string} [unwrap] - undefined = wrap; 'cutFirstDir' = rimuove la prima directory; qualunque altro valore definito = unwrap.
 * @returns {string} La stringa trasformata.
 */
function wrapUnwrapUrlString(string, unwrap) {
	if (unwrap == 'cutFirstDir') {
		let arr = string.replace('../', '').split('/');
		let part = arr[1]
		for (let i = 2; i < arr.length; i++) {
			part = part + '/' + arr[i]
		}
		return part
	} else if (unwrap != undefined) {
		return string.replace('url(', '').replace(')', '').replace(/"/g, '');
	} else {
		return "url(" + string + ")";
	}
}

/**
 * Estrae una colonna da una matrice (array di array).
 * @param {Array<Array>} matrix - Matrice di partenza.
 * @param {number} col - Indice della colonna da estrarre.
 * @returns {Array} I valori della colonna.
 */
function getCol(matrix, col) {
	var column = [];
	for (var i = 0; i < matrix.length; i++) {
		column.push(matrix[i][col]);
	}
	return column;
}

/**
 * Trova il più vicino antenato comune (elementi inclusi) di un array di
 * elementi DOM. Esempio: commonParent([a, y, x]).
 * @param {Element[]} elArray - Elementi di cui cercare l'antenato comune.
 * @returns {Element|undefined} L'antenato comune, o undefined se non esiste.
 */
function commonParent(elArray){
    return elArray.reduce(commonParentOfTwo,elArray[0])
}
function commonParentOfTwo(a, b) {
    var ap = $(a).parents().addBack();
    var bp = $(b).parents().addBack();
    //odd: addBack revverts the array order!
    //i starts from maximun index and goes back
    for (var i = ap.length - 1; i >= 0; i--) {
        if (bp.index(ap[i]) != -1) {
            return ap[i] //found common parent
        }
    }
}

/**
 * Scrive un oggetto dati come attributi data-* di un elemento HTML.
 * Esempio: writeData($('.selected'), {'a':'acont','b':'bcont'}).
 * @param {JQuery} $node - Elemento/i su cui scrivere gli attributi.
 * @param {Object} dataObject - Coppie chiave→valore da scrivere come data-<chiave>.
 * @returns {void}
 */
function writeData($node,dataObject){
	for (const property in dataObject) {
		//console.log(`${property}: ${dataObject[property]}`);
		$node.attr('data-'+ property,dataObject[property]);
	  }
}

//comparatori per ordinare elementi DOM in base al contenimento (usati da DnD)
/**
 * Comparatore per Array.sort: ordina per contenimento DOM, genitori prima dei figli.
 * @param {Element} a
 * @param {Element} b
 * @returns {number} -1 se a contiene b, 1 se b contiene a, 0 altrimenti.
 */
function CriterionParentSon(a,b){
    if( a.contains(b) ){return -1}
    else if( b.contains(a) ){return 1}
    else { return 0}
}

function CriterionSonParent(a,b){
    if( a.contains(b) ){return 1}
    else if( b.contains(a) ){return -1}
    else { return 0}
}
