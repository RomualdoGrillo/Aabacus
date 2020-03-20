//makeSortableDEBUG( $(tela).find( sortablesSelectorString ).addBack().add($('#tavolozza')).toArray() );

function makeSortableDEBUG(sortables) {
	for (var i = 0; i < sortables.length; i++) {
		new Sortable(sortables[i],{

			group: {
				name: 'shared',
				//pull: 'clone',
			},
			fallbackOnBody: true,
			animation: 150,
		});
	}
}
/*
let event
$(document).on('mousedown', function(e) {
	console.log(e);
	event = e;
	console.log('closest atom of clicked')
	let atomTarget = $(event.target).closest('[data-atom]');
	if (atomTarget.length && atomTarget.parent()) {

		console.log(atomTarget.parent());
		// set connected sortables starting from atomTarget.parentElement 
		StartHandler(undefined, atomTarget[0], event.ctrlKey)

	}
})
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
/*
let timeout
$(document).mouseup(function(){
  clearTimeout(pressTimer);
  // Clear timeout
  return false;
}).mousedown(function(){
  // Set timeout
  pressTimer = window.setTimeout(function() { alert('long press!')},1000);
  return false; 
});
*/

function wrapUnwrapUrlString(string, unwrap){
	//wrap wrapUnwrapUrlString("../Aabacus/images/a.png")
	//unwrap wrapUnwrapUrlString("url(../Aabacus/images/a.png)",true)
	//cutFirstDir wrapUnwrapUrlString("url(../Aabacus/images/a.png)",'cutFirstDir')
	if (unwrap == 'cutFirstDir') {
		let arr = string.replace('../','').split('/');
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
function lookForResult(){
	let $expressions = $('#telaRole>*');
	let found = false;
	for(i=0;i<$expressions.length;i++){
		found = compareWithResult($expressions.eq(i),$('#result>*'))
		console.log(found)
		if(found){break} 
	}
	return found
}

function compareWithResult($expression,$result){
	var MyPActx = newPActx();
	MyPActx.$operand = $expression;
	MyPActx.$pattern = $result;
	return cloneOrderMatch(MyPActx,true,false,true).matchedTF
}