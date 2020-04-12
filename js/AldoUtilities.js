$(document).on('mousedown', MakeSortableAndInjectMouseDown);
$(document).on('touchstart', MakeSortableAndInjectMouseDown);

function MakeSortableAndInjectMouseDown(event) {
	clearTargetsMouseDown()
	let $atomTarget
	if (ATOMclosedDef($(event.target))) {
		$atomTarget = $(event.target).closest('[data-atom]:not(.undraggable):not(.glued)');
	} else {
		$atomTarget = $(event.target).closest('[data-atom]:not(.undraggable)');
	}
	//let $atomTarget = $(event.target).closest('[data-atom]:not(.undraggable)');
	if ($atomTarget.length && $atomTarget.parent()) {
		//console.log('closest role from mousedown')
		//console.log($atomTarget.parent()[0]);
		//make targets sortables
		//*********from opened****************
		if (event.ctrlKey || !ATOMclosedDef($atomTarget) || $atomTarget.is('#tavolozza>*')) {
			//make targets sortable
			let $validTgT = validTargetsFromOpened($atomTarget);
			$validTgT.toArray().forEach(function(el) {
				el.setAttribute('target', 'opened')
			});
			makeSortableMouseDown($validTgT.toArray(), true);
		} else {
			//apply properties
			let i = 0
			while (propertiesDnD[i]) {
				let classname = 'target-' + propertiesDnD[i].name
				let targets = propertiesDnD[i].findTgt($atomTarget);
				let j = 0;
				while (targets[j]) {
					targets[j].setAttribute('target', propertiesDnD[i].name)
					makeSortableMouseDown([targets[j]])
					j++;
				}
				i++
			}
		}
		//make source sortable
		let sort = $atomTarget[0].parentElement.matches('.ul_role') || !ATOMclosedDef($atomTarget);
		$atomTarget[0].parentElement.setAttribute('from', 'fromNode')
		let fromSortable = makeSortableMouseDown([$atomTarget[0].parentElement], sort)[0]
		fromSortable._onTapStart(event);
	}
}

function startHandlerMouseDown(event, AtomDragged) {
	//debug
	//********select*****************
	//clickHandler(event)
	//********clear all targets*****************
	//if (debugMode) {
	//	clearTragets()
	//}
	if (event.originalEvent.ctrlKey || event.from.matches('#tavolozza')) {
		//clone!
		event.item.classList.add('toBeCloned');
		cloning = true
		//event.item.classList.remove('showAsPlaceholder');
	} else {
		//move!
		event.item.classList.add('showAsPlaceholder');
		//will be removed in onEndHandler

	}

}

function onEndHandlerMouseDown(event) {//console.log('end!')
	//console.log(event)
	let myClone = ATOMclone($(event.item))[0]//
	attachEventsAndExtend($(myClone))
	event.clone.replaceWith(myClone)
//disable all draggables
//clearTargetsMouseDown()
}

function clearTargetsMouseDown() {
	let sortableRoles = document.querySelectorAll('[target],[from]')
	let i = 0
	while (sortableRoles[i]) {
		sortableRoles[i].removeAttribute("target");
		sortableRoles[i].removeAttribute("from");
		let sortable = Sortable.get(sortableRoles[i]);
		//if(sortable){sortable.destroy()};
		if (sortable) {
			sortable.option('disabled', true);
		}
		;i++
	}

}

function makeSortableMouseDown(roles, sort) {
	let sortables = []
	for (var i = 0; i < roles.length; i++) {
		sortables[i] = Sortable.get(roles[i])
		if (sortables[i]) {
			sortables[i].option('disabled', false);
			sortables[i].option('sort', sort);
		} else {
			sortables[i] = new Sortable(roles[i],{

				group: {
					name: 'shared',
					pull: 'clone',
				},
				sort: sort,
				onStart: startHandlerMouseDown,
				onEnd: onEndHandlerMouseDown,
				animation: 150,
				fallbackOnBody: true,
				swapThreshold: 0.65,
				animation: 150,
				//onClone:onCloneHandler,
			});
		}
	}
	return sortables
}
function onCloneHandler(evt) {
	var origEl = evt.item;
	if(origEl.matches('[data-atom]')){
		evt.clone = ATOMclone($(evt.item))[0];
		attachEventsAndExtend($(evt.clone));
		evt.clone.classList.add('AtomClone')
	}
}
/*
let event
$(document).on('mousedown', function(e) {
	console.log(e);
	event = e;
	console.log('closest atom of clicked')
	let $atomTarget = $(event.target).closest('[data-atom]');
	if ($atomTarget.length && $atomTarget.parent()) {

		console.log($atomTarget.parent());
		// set connected sortables starting from $atomTarget.parentElement 
		StartHandler(undefined, $atomTarget[0], event.ctrlKey)

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
