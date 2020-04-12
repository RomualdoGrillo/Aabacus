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