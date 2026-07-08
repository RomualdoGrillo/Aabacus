
function removeClassStartNodeAndDiscendence(Class, $startNode) {
	let $toBeCleaned
	if ($startNode == undefined) {
		$toBeCleaned = $('*')
	} else {
		$toBeCleaned = $startNode.find('*').addBack()
	}
	$toBeCleaned.removeClass(Class);
}

function clearTarget(Classes) {
	// for example clearTarget(['selected','unselected'])   or clearTarget(['unselected')
	if (typeof (Classes) == "string") {
		Classes = [Classes]
	}
	//if input is a sting, create a one element array
	document.querySelectorAll(sortablesSelectorString).forEach(function(e) {
		e.classList.remove(...Classes)
	});
	//clear an array of classes
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


function lookForResultAndCelebrate(movesCounter,movesMinNumber) {
	let $expressions = $('#canvasRole>*');
	let found = false;
	let i;
	for (i = 0; i < $expressions.length; i++) {
		found = compareWithResult($expressions.eq(i), $('#result>*'),true)//Alwais look for a strict match: result must have same order
		if (found) {
			break
		}
	}
	if (found) {
		victorySound.play();
		$('body').removeClass('gameModeSurpriseRes');
		VisualizeCelebration('images/goal.svg');
		if(movesCounter && movesMinNumber && movesCounter<=movesMinNumber){
			VisualizeCelebration('images/goldMedal.png');
		}
		//alert('esattooooo!!!!')
	}
	return found
}

function compareWithResult($expression, $result,strictOrder) {
	var MyPActx = newPActx();
	MyPActx.$operand = $expression;
	//compare with a clone of the result
	MyPActx.$pattern = ENODEclone($result);
	ENODEextend(MyPActx.$pattern, true);
	return orderMatch(MyPActx, false, true, strictOrder).matchedTF
}

function getCol(matrix, col) {
	var column = [];
	for (var i = 0; i < matrix.length; i++) {
		column.push(matrix[i][col]);
	}
	return column;
}

function dummyParser(string){
	let op 
	let splitted
	let splittedgeq = string.split('>=')
	let splittedgt = string.split('>')
	let splittedeq = string.split('=')
	if(splittedgeq.length==2){splitted=splittedgeq; op='geq'}
	else if(splittedgt.length==2){splitted=splittedgt; op='gt'}
	else if(splittedeq.length==2){splitted=splittedeq; op='eq'}
	if(op){
		let $operation = ENODEclone( prototypeSearch(op) )
		let first = identifierToENODE(splitted[0]);
		let second = identifierToENODE(splitted[1]);
		$operation[0].ENODE_getRoles('.firstMember').append(first)
		$operation[0].ENODE_getRoles('.secondMember').append(second)
		return $operation
	}
}

function identifierToENODE(string){
	let num = parseInt(string)
	let ENODEType 
	if(isNaN(parseInt(string))){
		ENODEType = 'ci'
	}
	else{
		ENODEType = 'cn'
	}
	let $clone = ENODEclone( prototypeSearch("cn","num") )
	$clone[0].ENODE_setName(string);
	$clone.attr('data-enode', ENODEType);//uso un generico prototipo num e qui specifico se cn o ci
	return	$clone
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
	for ( property in dataObject) {
		//console.log(`${property}: ${dataObject[property]}`);
		$node.attr('data-'+ property,dataObject[property]);
	  }
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