function makeSortable(sortables) {

	for (var i = 0; i < sortables.length; i++) {
		new Sortable(sortables[i],{
			group: {
				//name: 'sort',
				pull: 'clone',
				put: false ,
				/*
				// !!!!!!!!!! not the right place to
				// pull function is not overwritten and it will prevale on when you set pull:false
				pull: function(to, from, item, dragEvent) {
					//clone does not work when target list = starting list
					if (dragEvent.ctrlKey) {
						return 'clone'
					} else if (item.classList.contains('glued')) {
						return false
					} else {
						return true
					}
				},

				put: function(to) {
					//let result = to.el.matches('[class*="target"]');
					if (to.el.getAttribute('target')) {
						console.log('valid target');
						return true
					} else {
						return false
					}
				}
				*/
			},
			sort: false,
			filter: function(event, b, sortable, d) {
				let $draggedATOM = ATOMparent($(event.target));
				if ($draggedATOM.hasClass('glued') && ATOMclosedDef($draggedATOM[0])) {
					return "*"
				}
			},
			animation: 150,
			fallbackOnBody: true,
			swapThreshold: 0.25,

			onMove: function(evt) {
				// et.to will always be the list you are over but evt.related
				// will be === only the very first time evt.to changes
				console.log('move!!!!')
				if (evt.related === evt.to) {
					Sortable.utils.toggleClass(evt.to, 'over', true);
				}
			},

			onStart: StartHandler,
			onEnd: onEndHandler,
			/*
			onChange: onChangeHandler,
			onAdd: openOnAdd,
			onSort: openOnSort
			*/
		});
	}

}

function StartHandler(event, AtomDragged) {
	//debug StartHandler(undefined,AtomDragged) 
	let dragged
	let cloning = false;
	sorting = true;
	if (event) {
		dragged = event.item
	} else {
		dragged = AtomDragged
	}
	//debug
	//********select*****************
	clickHandler(event)
	//********clear all targets*****************
	if (debugMode) {
		clearTragets()
	}

	if (!event.originalEvent.ctrlKey) {
		//move!
		event.item.classList.add('showAsPlaceholder');
		//will be removed in onEndHandler
	} else {
		event.item.classList.add('toBeCloned');
		cloning = true
		//event.item.classList.remove('showAsPlaceholder');
	}
	//clone

	if (event.originalEvent.ctrlKey || !ATOMclosedDef($(dragged)) || $(dragged).is('#tavolozza>*')) {
		let role = dragged.parentElement

		let closedol_role = (role.classList.contains('ol_role') && ATOMclosedDef(dragged)) || //if ol_role
		role.matches('#tavolozza');
		//tavolozza

		addRoleToConnectedGroup(dragged.parentElement, closedol_role)

		let $validTgT = validTargetsFromOpened($(dragged));
		$validTgT.addClass("target-opened");
		$validTgT.toArray().forEach(function(el) {
			addRoleToConnectedGroup(el);

			el.setAttribute('target', 'opened')
		});
		makeSortable($validTgT.toArray());

	}

	if (ATOMclosedDef($(dragged)) && event.from.classList.contains('ol_role')) {
		// if closed ordered list the not a good target
		event.from.setAttribute('target', '');
		//not a good target
		event.from.classList.remove("target-opened");
		/*
		thisSortable = Sortable.get(event.from);
		thisSortable.option('sort', false);
		*/
	} else {
		//apply properties
		let i = 0
		while (propertiesDnD[i]) {
			let classname = 'target-' + propertiesDnD[i].name
			clearTarget(classname)
			let targets = propertiesDnD[i].findTgt($(event.item));
			let j = 0;
			while (targets[j]) {
				let role = targets[j];
				role.classList.add(classname);
				role.setAttribute('target', propertiesDnD[i].name)
				/*
				let sortable = Sortable.get(role);
				if (sortable) {
					//&&check that the target is not assigned already ???	
					//sortable.option('group',property.name);
					//sortable.option('put',function(event){property(event.from,event.to)})
					//sortable.option('onAdd',"function(event){console.log('put in target:');console.log(targets[i])}")
					//sortable.option('onAdd',propertiesDnD[i].apply)
					sortable.option('onAdd', propertiesDnD[i].onAdd)
					sortable.option('onSort', '')
				}
				*/
				j++;
			}
			i++
		}
	}
}
function onEndHandler(event) {
	sorting = false;
	//used for over class
	console.log('end!')
	console.log(event)
	event.item.classList.remove('showAsPlaceholder');

	if (event.item.classList.contains('toBeCloned')) {
		event.item.classList.remove('toBeCloned');
		let myClone = ATOMclone($(event.item))
	}
	let dropTarget
	//Mouse
	if (event.originalEvent.type == 'drop') {
		// event.originalEvent.target è più facile, ma non distingue tra elemento e suo pseudoelemento ::before
		let x = event.originalEvent.clientX;
		let y = event.originalEvent.clientY;
		dropTarget = document.elementFromPoint(x, y);
		if (!dropTarget.getAttribute('data-atom')) {
			//if it's not an atom get the parent atom
			dropTarget = ATOMparent($(dropTarget))[0];
		}
	}//Touch
	else if (event.originalEvent.changedTouches) {
		//sometimes a touch event is detected without changed touches!
		let x = event.originalEvent.changedTouches[0].clientX;
		let y = event.originalEvent.changedTouches[0].clientY;
		dropTarget = document.elementFromPoint(x, y);
		if (!dropTarget.getAttribute('data-atom')) {
			//if it's not an atom get the parent atom
			dropTarget = ATOMparent($(dropTarget))[0];
		}
	}
	/* 
	let parentTarget
	if(dropTarget){
		parentTarget = dropTarget.closest('[data-atom][target]:not([target=""])')//risalgo fino a che non trovo un parent marcato
	}
	if(parentTarget){
	    //apply property
	    let targetProperty = parentTarget.getAttribute('target');
	    console.log(' ------------> found target ' + targetProperty );
	    let property = propertiesDnD.find(function(el){return el.name == targetProperty });
	    if(property){
	    	let PActx = property.apply($(event.item),$(parentTarget))
			if(PActx){PActxConclude(PActx)}	    
	    }
	}
	*/
	if ($(dropTarget).is('[data-atom][target]:not([target=""])')) {
		//apply property from propertiesDnD
		let targetProperty = dropTarget.getAttribute('target');
		console.log(' ------------> found target ' + targetProperty);
		let property = propertiesDnD.find(function(el) {
			return el.name == targetProperty
		});
		if (property) {
			let PActx = property.apply($(event.item), $(dropTarget))
			if (PActx) {
				PActxConclude(PActx)
			}
		}
	} else {
		//  no need for a specific function in propertiesDnD
		// edit, commute, distribute are simply movement in connected lists  
		ssnapshot.take()
	}

	clickSound.play();
	//repositioned
	if (event.clone.parentElement != null) {
		event.clone.removeAttribute('id')
		attachEventsAndExtend($(event.clone), true)
	}
	//RefreshEmptyInfixBraketsGlued($('body'),true,"eib");
	//$(sortablesSelectorString).removeClass('toBeUpdated');
	clearConnectedGroup();
	if (!debugMode) {
		clearTragets()
	}
}

function onChangeHandler(event) {
	//RefreshEmptyInfixBraketsGlued($(event.target),true,"eib");
	blipSound.play();
	//console.log('Change!')
	//console.log(event)
	event.target.classList.add('toBeUpdated')
	//hide infix decorations while sorting
}

let connectedSortables = []
function addRoleToConnectedGroup(role, closedol_role) {
	let s = Sortable.get(role);
	try {
		s.option('group', 'connected');

		//s.option('put', !closedol_role);
		// Do not allow items to be put into this list
		//if(closedol_role){s.option('sort', false);}
		
		// To disable sorting: set sort to false
		connectedSortables.push(s);
		console.log('added to connected as: ' + (closedol_role ? 'unsortable' : 'normal'));
		console.log(role)
	} catch {
		console.log('error when setting group on role  !!!!!!!!!!!!!!!!!!!!!!!!')
		console.log(role)
	}
}

function clearConnectedGroup() {
	connectedSortables.forEach(function(e) {

		e.options.group.name = undefined;
	})
	connectedSortables = [];

}
/*
function testStartHandler(event, AtomDragged) {
	// se il dragged è un booleano consenti sort, altrimenti no.
	let dragged;
	if (event) {
		dragged = event.item
	} else {
		dragged = AtomDragged
	}
	let s = Sortable.get(dragged.parentElement);
	if (dragged.matches('[data-type=bool]')) {
		s.option('group', 'connected');

		//s.option('put', !closedol_role);
		// Do not allow items to be put into this list
		s.option('sort', true);
		//addRoleToConnectedGroup(dragged.parentElement, false)
		// To disable sorting: set sort to false
		//connectedSortables.push(s);
		console.log('set NO sort');
	} else {
		s.option('group', 'disconnected');
		s.option('pull', 'clone');
		s.option('put', false);
		s.option('sort', false);
		//addRoleToConnectedGroup(dragged.parentElement, true)
		console.log('set sort');

	}
	console.log(dragged.parentElement);
	console.log(s);
}
*/
/*
function testStartHandler(event, AtomDragged) {
	// se il dragged è un booleano consenti sort, altrimenti no.
	let dragged;
	if (event) {
		dragged = event.item
	} else {
		dragged = AtomDragged
	}
	let s = Sortable.get(dragged.parentElement);
	if (dragged.matches('[data-type=bool]')) {
		s.option('group', 'connected');

		//s.option('put', !closedol_role);
		// Do not allow items to be put into this list
		s.option('sort', true);
		//addRoleToConnectedGroup(dragged.parentElement, false)
		// To disable sorting: set sort to false
		//connectedSortables.push(s);
		console.log('set NO sort');
	} else {
		s.option('sort', false);
		//addRoleToConnectedGroup(dragged.parentElement, true)
		console.log('set sort');

	}
	console.log(dragged.parentElement);
	console.log(s);
}
*/