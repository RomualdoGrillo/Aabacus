function makeSortable(sortables){

	for (var i = 0; i < sortables.length; i++) {
		s = new Sortable(sortables[i], {
			group: {
			name: 'sort',
			pull:function (to, from, item, dragEvent) {
				//clone does not work when target list = starting list
				if(dragEvent.ctrlKey){return 'clone'}
				else{return true}
			},
			
			put: function (to) {
					//let result = to.el.matches('[class*="target"]');
					if( to.el.getAttribute('target')){
						console.log('valid target');
						return true}
					else{
						return false}					
   				}
			},
			
			animation: 150,
			fallbackOnBody: true,
			swapThreshold: 0.65,
			
			onMove: function (evt) {
				// et.to will always be the list you are over but evt.related
				// will be === only the very first time evt.to changes
				console.log('move!!!!')
				if (evt.related === evt.to) {
				  Sortable.utils.toggleClass(evt.to, 'over', true);
				}
			},
		
			onStart:newOnStartHandler,
			onEnd:onEndHandler,

			onChange:onChangeHandler,
			onAdd:openOnAdd,
			onSort:openOnSort
			
		});
	}

}



function newOnStartHandler(event,AtomDragged){
	//debug newOnStartHandler(undefined,AtomDragged) 
	let dragged
	let cloning = false;
	sorting = true;
	if(event){dragged = event.item} 
	else{dragged=AtomDragged}//debug
	//********select*****************
	clickHandler(event)
	//********clear all targets*****************
	clearTarget(["target-opened","toBeCloned"]);//debug 
	document.querySelectorAll(sortablesSelectorString).forEach(function(el){el.setAttribute('target','')});
	document.querySelectorAll('[data-atom]').forEach(function(el){el.setAttribute('target','')});

	if(!event.originalEvent.ctrlKey){//move!
		event.item.classList.add('showAsPlaceholder');//will be removed in onEndHandler
	}
	else{
		event.item.classList.add('toBeCloned');
		cloning = true
		//event.item.classList.remove('showAsPlaceholder');
	}//clone

	
	
	
	if( event.originalEvent.ctrlKey ||!ATOMclosedDef($(dragged)) ){
		let $validTgT = validTargetsFromOpened($(dragged)); 
		$validTgT.addClass("target-opened");
		$validTgT.toArray().forEach(function(el){
			el.setAttribute('target','opened')});
		makeSortable($validTgT.toArray());
		
	}

	if(ATOMclosedDef($(dragged))&& event.from.classList.contains('ol_role')){
			// if closed ordered list the not a good target
			event.from.setAttribute('target','');//not a good target
			event.from.classList.remove("target-opened");
			//let sortable = Sortable.get(event.from)
			thisSortable = Sortable.get(event.from);
			thisSortable.option('sort',false);   
	}


	else{//apply properties
		let i=0
		while(propertiesDnD[i]){	
			let classname = 'target-'+ propertiesDnD[i].name
			clearTarget(classname)
			let targets = propertiesDnD[i].findTgt($(event.item));
			let j = 0;
			while(targets[j]) {
				let role=targets[j];
				role.classList.add(classname);
				role.setAttribute('target',propertiesDnD[i].name)
				let sortable = Sortable.get(role);
				if(sortable ){//&&check that the target is not assigned already ???	
					//sortable.option('group',property.name);
					//sortable.option('put',function(event){property(event.from,event.to)})
					//sortable.option('onAdd',"function(event){console.log('put in target:');console.log(targets[i])}")
					//sortable.option('onAdd',propertiesDnD[i].apply)
					sortable.option('onAdd',propertiesDnD[i].onAdd)
					sortable.option('onSort','')
				}
			j++;	
			}
		i++	
		}
	}	 
}
function onEndHandler(event){
	sorting = false;//used for over class
	console.log('end!')	
	console.log(event)
	event.item.classList.remove('showAsPlaceholder');
	
	if(event.item.classList.contains('toBeCloned')){
		event.item.classList.remove('toBeCloned');
		let myClone = ATOMclone($(event.item))
	}
	let dropTarget
	//Mouse
	if( event.originalEvent.type == 'drop'){
		dropTarget= event.originalEvent.target
	}
	//Touch
	else{
		let x=event.originalEvent.changedTouches[0].clientX;
		let y=event.originalEvent.changedTouches[0].clientY;
		dropTarget = document.elementFromPoint(x,y)
	} 
	let parentTarget
	if(dropTarget){
		//risalgo fino a che non trovo un parent marcato		
		parentTarget = dropTarget.closest('[data-atom][target]:not([target=""])')
	}
	if(parentTarget){
	    //apply property
	    let targetProperty = parentTarget.getAttribute('target');
	    console.log(' ------------> found target ' + targetProperty );
	    let property = propertiesDnD.find(function(el){return el.name == targetProperty });
	    if(property){
	    	property.apply($(event.item),$(parentTarget))
	    }
	}
	

	clickSound.play();//repositioned
	if(event.clone.parentElement != null){
		event.clone.removeAttribute('id')
		attachEventsAndExtend($(event.clone),true)
	}
	$(".cleanPointless").each(function(i,el){ATOMcleanIfPointless($(this),false)});
	RefreshEmptyInfixBraketsGlued(ATOMparent($(this)),true,"ei")
	RefreshEmptyInfixBraketsGlued($('body'),true,"eib");
	$(sortablesSelectorString).removeClass('toBeUpdated');
}

function onChangeHandler(event){
	//RefreshEmptyInfixBraketsGlued($(event.target),true,"eib");
	blipSound.play();
	//console.log('Change!')
	//console.log(event)
	event.target.classList.add('toBeUpdated')//hide infix decorations while sorting
}

