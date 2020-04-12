
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
	let $expressions = $('#telaRole>*');
	let found = false;
	let i;
	for (i = 0; i < $expressions.length; i++) {
		found = compareWithResult($expressions.eq(i), $('#result>*'))
		if (found) {
			break
		}
	}
	if (found) {
		victorySound.play();
		$('body').removeClass('gameModeSurpriseRes');
		//alert('esattooooo!!!!')
	}
	return found
}

function compareWithResult($expression, $result) {
	var MyPActx = newPActx();
	MyPActx.$operand = $expression;
	MyPActx.$pattern = $result;
	return cloneOrderMatch(MyPActx, true, false, true).matchedTF
}

function getCol(matrix, col) {
	var column = [];
	for (var i = 0; i < matrix.length; i++) {
		column.push(matrix[i][col]);
	}
	return column;
}
