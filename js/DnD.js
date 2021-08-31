//Passing data between DnD, write on the Drag and use data on dragStat..dragEnd
let GLBDnD = {toolWhenMousedown:""}
//at the moment ther's no clean whay to pass data between
// mousedown, sortablejs onstart, sortablejs onend etc.. 
//see discussion https://github.com/SortableJS/Sortable/issues/1196 


function MakeSortableAndInjectMouseDown(event) {
	GLBDnD.toolWhenMousedown=GLBtool;
	if (debugMode) {//that's just for debug mode, in normal mode targets are clened on mouseup
		cleanupDnD()
	}
	
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
		//make targets sortable
		//*********from opened****************
		if (GLBDnD.toolWhenMousedown =='copy' || !ATOMclosedDef($atomTarget) || $atomTarget.is('#tavolozza>*')) {
			//make targets sortable
			let $validTgT = validTargetsFromOpened($atomTarget);
			if ($atomTarget.is('#tavolozza>*')) {
				//add tela as target
				$validTgT = $validTgT.add('#telaRole');
			}
			$validTgT.toArray().forEach(function(el) {
				el.setAttribute('target', 'opened')
			});
			makeSortableMouseDown($validTgT.toArray(), true);
		}
		if (ATOMclosedDef($atomTarget) && !$atomTarget.is('#tavolozza>*')) {
			//create targets to apply properties
			let i = 0
			if (checkIfFoundation()) {//only if tag foundation is present in tela 

				while (propertiesDnD[i]) {
					let classname = 'target-' + propertiesDnD[i].name
					let targets = propertiesDnD[i].findTgt($atomTarget);
					let j = 0;
					while (targets[j]) {
						targets[j].setAttribute('target', propertiesDnD[i].name);
						if (targets[j].matches('.ul_role')) {
							//target is a role: for example associative property	
							makeSortableMouseDown([targets[j]])
						} else {
							//target is not a role: for example in replacement it is an atom 
							let tgt = $('<div class="tgt"></div>')[0]
							targets[j].append(tgt);
							makeSortableMouseDown([tgt])
						}
						j++;
					}
					i++
				}

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
	//*************** deselect ********
	if (event.type == 'start') {
		//clear selected unselected
		selectionManager("", "", "", true);
	}
	//********clear all targets*****************
	//if (debugMode) {
	//	clearTragets()
	//}
	if (/*event.originalEvent.ctrlKey*/GLBDnD.toolWhenMousedown =='copy' || event.from.matches('#tavolozza')) {
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

function onAdd(event) {
	console.log('onAdd')
	//replacing sortablejs defaul clone with myClone (removed id, extends ATOM etc..)
	//item stays in place myclone dropped in new place
	event.item.classList.remove('showAsPlaceholder');
	let myClone = ATOMclone($(event.item))[0]
	//
	event.item.classList.remove('toBeCloned');
	attachEventsAndExtend($(myClone))
	event.item.replaceWith(myClone)
	event.clone.replaceWith(event.item)
	//questo è l'elemento che rimane nella posizione di partenza
	let dropped = myClone
	//move or clone
	if (event.to.getAttribute('target') == 'opened') {
		if (event.to.matches('#telaRole')) {
			returnTargetWrappedIfNeeded($('#telaRole'), $(dropped));
		}

		if ($(dropped).hasClass('toBeCloned')) {
			$(dropped).removeClass('toBeCloned');
		} else {
			$(event.item).remove();
			// if not cloning, clone was useful to visualize the starting point 	
		}
	}//apply property
	else {
		let target
		let adHocTgt = event.to.classList.contains('tgt')
		if (adHocTgt) {
			//---->real target is Atom so dropped in ad hoc tgt role
			target = event.to.parentElement;
		} else {
			//---->target is a role (no need to create ad hoc tgt)
			target = event.to
		}
		let targetProperty = target.getAttribute('target');
		console.log(' ------------> found target ' + targetProperty);
		let property = propertiesDnD.find(function(el) {
			return el.name == targetProperty
		});
		if (property) {
			let PActx = property.apply($(event.item), $(event.to.parentElement), $(dropped))
			if (adHocTgt) {
				(event.to).remove()
			}
			if (PActx) {
				PActxConclude(PActx)
			}
		}
	}
	/*if (!debugMode) {//in debugMode i target sono lasciati visibili
		clearSortableTargets()
	}*/
	clickSound.play();
}



function makeSortableMouseDown(roles, sort) {// roles is an array containing both roles and dummy roles 
	let sortables = []
	for (var i = 0; i < roles.length; i++) {//for each role
		sortables[i] = Sortable.get(roles[i])
		if (sortables[i]) {//if a Sortable instance exists for that role THEN enable it
			sortables[i].option('disabled', false);
			sortables[i].option('sort', sort);
		} else {//else create a Sortable
			sortables[i] = new Sortable(roles[i],{
				group: {
					name: 'shared',
					pull: 'clone',
				},
				sort: sort,
				onStart: startHandlerMouseDown,
				onAdd: onAdd,
				onEnd: cleanupDnD,
				animation: 150,
				fallbackOnBody: true,
				swapThreshold: 0.65,
				animation: 150,
			});
		}
	}
	return sortables
}
function sortEnd(){
	console.log('sortEnd');
}

function cleanupDnD(event) {
	//called both on sortEnd an Mouseup events 
	//at least one of the events must fire
	//not optimal
	//Mouseup does not fire if the element is removed as a result of property applications
	//Sortend is not fired if click without drag
	//Documentation:
	//https://docs.google.com/drawings/d/1sASg3RC51sOYWCRIxJjdRI_lL0ZKpATyPaFWfkVxT70/edit
	if (!debugMode) {//in debugMode i target sono lasciati visibili
		clearSortableTargets()
		clearLines()//todo: distinguish between hints and PatternMatching and other lines
	}
}


function clearSortableTargets() {
	let tgts = document.querySelectorAll('.tgt');
	let i = 0;
	$('*').removeClass('toBeCollected').removeClass('couldBeCollected');
	while (tgts[i]) {
		let sortable = Sortable.get(tgts[i]);
		if(sortable){sortable.destroy()};
		/*if (sortable) {
			sortable.option('disabled', true);
		}*/
		tgts[i].remove()
		i++
	}
	let sortableRoles = document.querySelectorAll('[target],[from]');
	i = 0
	while (sortableRoles[i]) {
		sortableRoles[i].removeAttribute("target");
		sortableRoles[i].removeAttribute("from");
		let sortable = Sortable.get(sortableRoles[i]);
		
		//if(sortable){sortable.destroy()};
		
		if (sortable) {
			sortable.option('disabled', true);
		}
		
		i++
	}

}
