
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
		part = arr[1]
		for (i = 2; i < arr.length; i++) {
			part = part + '/' + arr[i]
		}
		return part
	} else if (unwrap != undefined) {
		return string.replace('url(', '').replace(')', '').replace(/"/g, '');
	} else {
		return "url(" + string + ")";
	}
}

/*
var count = 0
function serialNumber(mode){
    if(mode ==="init"){
        count = -1 //in questo modo alla prima richiesta il SN sarà 0     
    }
    else{
        count++
    }
    return count
}
*/

function lookForResultAndCelebrate() {
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
		//alert('esattooooo!!!!')
	}
	return found
}

function compareWithResult($expression, $result,strictOrder) {
	var MyPActx = newPActx();
	MyPActx.$operand = $expression;
	//compare with a clone of the result
	MyPActx.$pattern = MNODEclone($result);
	MNODEextend(MyPActx.$pattern, true);
	return orderMatch(MyPActx, false, true, strictOrder).matchedTF
}

function getCol(matrix, col) {
	var column = [];
	for (var i = 0; i < matrix.length; i++) {
		column.push(matrix[i][col]);
	}
	return column;
}
/*
var width = 960,
    height = 500;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
var hull = svg.append("path")
    .attr("class", "hull");

$('svg').css('position','absolute')
arr = getPositionsOfChildren($('[data-vis=resizable]'))
hull.datum(d3.geom.hull(arr)).attr("d", function(d) { return "M" + d.join("L") + "Z"; })
*/
function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return [_x,_y]
}
function getPositionsOfChildren($parentAtom){
	let arr =[]
	arr = $parentAtom[0].MNODE_getChildren().toArray()
	for(i=0;arr[i];i++){
		arr[i]=getOffset(arr[i])
	}
	return arr
}
function createHullTo(){
	var width = 960;
    var height = 500;
	var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
	var hull = svg.append("path")
    .attr("class", "hull");
    svg.attr('id','svgHull');
	$('#svgHull').css('position','absolute');
	return hull
}
function redrawHull($resizable,hull){
	var arr = getPositionsOfChildren($resizable)
	if(arr.length>2){
		hull.datum(d3.geom.hull(arr)).attr("d", function(d) { return "M" + d.join("L") + "Z"; });
	}
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
		let $operation = MNODEclone( prototypeSearch(op) )
		let first = identifierToAtom(splitted[0]);
		let second = identifierToAtom(splitted[1]);
		$operation[0].MNODE_getRoles('.firstMember').append(first)
		$operation[0].MNODE_getRoles('.secondMember').append(second)
		return $operation
	}
}

function identifierToAtom(string){
	let num = parseInt(string)
	let atomType 
	if(isNaN(parseInt(string))){
		atomType = 'ci'
	}
	else{
		atomType = 'cn'
	}
	$clone = MNODEclone( prototypeSearch("cn","num") )
	$clone[0].MNODE_setName(string);
	$clone.attr('data-atom', atomType);//uso un generico prototipo num e qui specifico se cn o ci
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


function gradeInMonomial($MNODE, varName) {
	let $factors
	let totalGrade = 0
	if ($MNODE.attr('data-atom') == 'times') {//multiple factors?
		$factors = $MNODE[0].MNODE_getChildren()
	}
	else {
		$factors = $MNODE
	}
	for(let i=0;$factors[i];i++){
		let type=$factors.eq(i).attr('data-atom')
		if(type=="ci"||type=="power"){
			digested=AtomsToVal($factors.eq(i));
			//xyz=$($factors[i]){} //translate to values
			if(varName==undefined || digested.val==varName){//add the exponent
				totalGrade= totalGrade + digested.exp;
			}
		} 
		 
	}
	return totalGrade
}

function sortByGrade(array,varName) {
    return array.sort(function (a,b) {
        return gradeInMonomial($(a),varName)-gradeInMonomial($(b),varName);
    });
}

function updateContainerView($MNODE,view,par){
	if(view=='grid'){
		//set parent
		$MNODE[0].MNODE_getRoles().css('display','grid').css('grid-auto-flow','column').css('justify-items','center') //(data-view,"viewAsGrid");
		//set children
		let $children = $MNODE[0].MNODE_getChildren()
		//childrenArr = sortByGrade(childrenArr);
		for(i=0;$children[i];i++){
			console.log(i)
			let column_index=gradeInMonomial($children.eq(i),par)+1;
			$children.eq(i).css('grid-column', column_index);//column index starts from 1
		}
		//set column for each children
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