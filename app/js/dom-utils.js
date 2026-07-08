//Utilità generiche su DOM, stringhe e array, senza logica applicativa.
//Estratte da AldoUtilities.js (passo 5 del piano in project/specs/software-modules.md).

function removeClassStartNodeAndDiscendence(Class, $startNode) {
	let $toBeCleaned
	if ($startNode == undefined) {
		$toBeCleaned = $('*')
	} else {
		$toBeCleaned = $startNode.find('*').addBack()
	}
	$toBeCleaned.removeClass(Class);
}

function removeClassByPrefix($startNode,prefix,tree) {
//example:  removeClassByPrefix(undefined,'temp') //remove all temporary classes
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

//from  https://stackoverflow.com/questions/14780350/convert-relative-path-to-absolute-using-javascript
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

function wrapUnwrapUrlString(string, unwrap) {
	//wrap wrapUnwrapUrlString("../Aabacus/images/a.png")
	//unwrap wrapUnwrapUrlString("url(../Aabacus/images/a.png)",true)
	//cutFirstDir wrapUnwrapUrlString("url(../Aabacus/images/a.png)",'cutFirstDir')
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

function getCol(matrix, col) {
	var column = [];
	for (var i = 0; i < matrix.length; i++) {
		column.push(matrix[i][col]);
	}
	return column;
}

//arr=[a,y,x]
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

//write a data object into attributes of an html element
function writeData($node,dataObject){
	//writeData($('.selected'),{'a':'acont','b':'bcont'})
	for (const property in dataObject) {
		//console.log(`${property}: ${dataObject[property]}`);
		$node.attr('data-'+ property,dataObject[property]);
	  }
}

//comparatori per ordinare elementi DOM in base al contenimento (usati da DnD)
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
