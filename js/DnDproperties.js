function makeSortable(sortables) {
/*
	for (var i = 0; i < sortables.length; i++) {
		new Sortable(sortables[i],{
			group: {
				name: 'sort',
				pull: function(to, sortableFrom, item, dragEvent) {
					//clone does not work when target list = starting list
					if (dragEvent.ctrlKey || sortableFrom.el.matches('#tavolozza')) {
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
						//console.log('valid target');
						return true
					} else {
						return false
					}
				}
			},
			/*filter: function(event, b, sortable, d) {
				let $draggedATOM = ATOMparent($(event.target));
				if ($draggedATOM.hasClass('glued') && ATOMclosedDef($draggedATOM[0])) {
					return "*"
				}
			},*/
			//filter:".glued",//elimina l'evento di drag invece di lascirlo a quello sotto
/*			animation: 150,
			fallbackOnBody: true,
			swapThreshold: 0.65,

			onMove: function(evt) {
				// et.to will always be the list you are over but evt.related
				// will be === only the very first time evt.to changes
				console.log('move!!!!')
				if (evt.related === evt.to) {
					Sortable.utils.toggleClass(evt.to, 'over', true);
				}
			},
			onStart: startHandler,
			onEnd: onEndHandler,
			onChange: onChangeHandler,
			onAdd: openOnAdd,
			onSort: openOnSort

		});
	}
*/
}

function startHandler(event, AtomDragged) {
	//debug newOnStartHandler(undefined,AtomDragged) 
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
	//clone

	if (event.originalEvent.ctrlKey || !ATOMclosedDef($(dragged)) || $(dragged).is('#tavolozza>*')) {
		let $validTgT = validTargetsFromOpened($(dragged));
		$validTgT.addClass("target-opened");
		$validTgT.toArray().forEach(function(el) {
			el.setAttribute('target', 'opened')
		});
		makeSortable($validTgT.toArray());
	}

	if (ATOMclosedDef($(dragged)) && event.from.classList.contains('ol_role')) {
		// if closed ordered list the not a good target
		event.from.setAttribute('target', '');
		//not a good target
		event.from.classList.remove("target-opened");
		//let sortable = Sortable.get(event.from)
		thisSortable = Sortable.get(event.from);
		thisSortable.option('sort', false);
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
	$('*').removeClass('tempdisable');
	event.item.classList.remove('showAsPlaceholder');

	if (event.item.classList.contains('toBeCloned')) {
		event.item.classList.remove('toBeCloned');
		let myClone = ATOMclone($(event.item))
	}
	let dropTarget
	//Mouse
	if (event.originalEvent.type == 'drop' || event.originalEvent.type == 'dragend') {
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
	 
	let parentTarget
	if(dropTarget && dropTarget.getAttribute('target')!=""){
		parentTarget=dropTarget
	}
	else if( ATOMparent($(dropTarget)).attr('target')!="" ){//risalgo solo di un livello!!
		parentTarget=ATOMparent($(dropTarget))[0];
	}
	/*
	if(dropTarget){
		parentTarget = dropTarget.closest('[data-atom][target]:not([target=""])')//risalgo fino a che non trovo un parent marcato
	}*/
	if(dropTarget && dropTarget.matches('#telaAnd') && $('#telaRole').attr('target')== 'opened'){
		let $newTarget = returnTargetWrappedIfNeeded($('#telaRole'),$(event.item)); 
		if( !$newTarget.is('#telaRole') ){
			//target has changed 
			$newTarget.append($(event.item));
		}
	}
	else if(parentTarget){
	    //apply property
	    let targetProperty = parentTarget.getAttribute('target');
	    console.log(' ------------> found target ' + targetProperty );
	    let property = propertiesDnD.find(function(el){return el.name == targetProperty });
	    if(property){
	    	let PActx = property.apply($(event.item),$(parentTarget))
			if(PActx){PActxConclude(PActx)}	    
	    }
	}
	
	else {
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
