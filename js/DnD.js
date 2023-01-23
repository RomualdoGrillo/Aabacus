//Passing data between DnD, write on the Drag and use data on dragStat..dragEnd
let GLBDnD = { toolWhenMousedown: "" }
//at the moment ther's no clean whay to pass data between
// mousedown, sortablejs onStart, sortablejs onEnd etc.. 
//see discussion https://github.com/SortableJS/Sortable/issues/1196 


function MakeSortableAndInjectMouseDown(event) {
	let $validTgT=$();
	/******** from target to Atom target *************/
	//glued vs no glued
	let $atomTarget
	if (MNODEclosedDef($(event.target))) {
		$atomTarget = $(event.target).closest('[data-atom]:not(.undraggable):not(.glued)');
	} else {
		$atomTarget = $(event.target).closest('[data-atom]:not(.undraggable)');
	}
	/********cleanup*******/
	cleanupDnD() //cleanup must happen after $atomTarget is determined!!! Othrwise you may remove the element clicked on
	//***selection manager "grey" highlight
	if($atomTarget.hasClass('unselectable')){
		selectionManager("","","",true)//deselectAll
	}
	else{
		selectionManager($atomTarget,event.ctrlKey||event.metaKey,event.shiftKey)//on mac use command key instead of control
	}
	//**** highlight Span and Parameters
	if($atomTarget.attr('data-atom')=='ci'){
		highlightOccurrences($atomTarget,'mu_connected');
	}
	
	//**** highlight DOWNSTREAM 
	// add class mu_Downstream1
	if($atomTarget.attr('data-type')=='bool'){
		$calculateJurisdictionUpstream($atomTarget.parent()).addClass('mu_span');
	}
	
	GLBDnD.toolWhenMousedown = GLBsettings.tool;
	if (GLBDnD.toolWhenMousedown == 'autoAdapt'){
		//********* autoAdapt ****************
		if (MNODEclosedDef($(event.target))) {
			GLBDnD.$originalProperty = $(event.target).closest('[data-atom=forAll]');
			if(GLBDnD.$originalProperty.length==0){return};
			let $forallContent=GetforAllContentRole(GLBDnD.$originalProperty).children();
			let $equation=$($forallContent[0]);
			if(!$equation.is('[data-atom=eq]')){console.log('forall content is not an equation'); return}
			let $eqRoleMembers=$equation[0].MNODE_getRoles('.firstMember,.secondMember');
			let $RoleMember = $eqRoleMembers.filter(function(i,e){return e.contains(event.target)})
            if($RoleMember.length==0){return}
            //decide if ltr or rtl
			if($RoleMember.is('.firstMember')){
            	GLBDnD.direction='ltr'//rtl or ltr
            }
			else if($RoleMember.is('.secondMember')){
            	GLBDnD.direction='rtl'//rtl or ltr
            }
            else{console.log('ERROR:member not found in equation')}
			//look for  attack point
			$atomTarget = $RoleMember.children().filter('[data-atom]:first');
			let $startPointForValids = searchForMarkedInSubtree($RoleMember,"s",'m',true)//"s" e' la marcatura cercata, "m" vuol dire cerca una marcatura, non un link o post
            if($startPointForValids.length==0){$startPointForValids=$atomTarget}
			$atomTarget.addClass('attackPoint')
			$validTgT = validCandidatesForPatternDrop($startPointForValids,GLBDnD.$originalProperty);
			let validTgT
			//order is important!!!!
			//WORKS but I don't know why: apparently if I sort with criteriion Son->parent does not work, if I sort Parent->son than reverse it works
			//makeTargetsSortableRolesOrAtoms($validTgT.toArray().sort(CriterionSonParent), 'dragPatternMatch');//not working
			// validTgT = $validTgT.toArray() //notWorking
			validTgT = $validTgT.toArray()
			validTgT.sort(CriterionSonParent)//notWorking
			//validTgT = $validTgT.toArray().sort(CriterionParentSon)//notWorking
			//validTgT = $validTgT.toArray().sort(CriterionParentSon).reverse()//working
			//*****testing
			let mappa = [0,1,2,3,4,5,6,7,8,9,10,11]
			//let mappa = [0,1,2,3,4,5,10]
			//let mappa = [0,2,3,4,5]

			//let mappa = [1,6,7,8,9,10,11]
			console.log(validTgT)
			validTgT = ArrayNewOrder(validTgT,mappa)
			console.log(validTgT)
			//*************
			makeTargetsSortableRolesOrAtoms(validTgT, 'dragPatternMatch');	
		}
		else {
			//no forall property
		}
	}
	else if (GLBDnD.toolWhenMousedown == 'copy' || !MNODEclosedDef($(event.target)) || $atomTarget.is('#palette *')) {
		//*********from opened****************
		
		//make targets sortable
		let $validTgTOpen = validTargetsFromOpened($atomTarget);//i $validTgTOpen non vengono evidenziati con exclusive focus
		if ($atomTarget.is('#palette *')) {
			//add canvas as target
			$validTgTOpen = $validTgTOpen.add('#canvasRole');//will be encased!!//
		}
		$validTgTOpen.toArray().forEach(function (el) {
			el.setAttribute('target', 'opened')
		});
		makeSortableMouseDown($validTgTOpen.toArray(), true);
	}
	else {
		//********  determine validTargets for propeties listed in propertiesDnD[i] ***************
		if (!$atomTarget.length || !$atomTarget[0].parentElement) { return }//precondition
		let i = 0
		let propInCanvasEnabled = getDnDpropEnabled()
		while (propInCanvasEnabled[i]) {
			let targets = propInCanvasEnabled[i].findTgt($atomTarget,(event.ctrlKey || event.metaKey),event.altKey);
			makeTargetsSortableRolesOrAtoms(targets, propInCanvasEnabled[i].name, propInCanvasEnabled[i].icon)
			$validTgT = $validTgT.add($(targets))
			i++
		}
	}
	if ($atomTarget && $atomTarget.length && $atomTarget[0].parentElement){
	//is there a valid target?(sometimes the $atomTarget is undefined sometime it is not but there is no [0] element)
		if($validTgT.length!=0){
			let $draggedAndTargets = $atomTarget.add($validTgT); 
			$commParent = $(commonParent( $draggedAndTargets.toArray() ));	
			$commParent.addClass('mu_targetsCommonParent')
		}
		//make source sortable
		let sort
		if(GLBDnD.toolWhenMousedown=="autoAdapt" || GLBDnD.toolWhenMousedown=="copy" ){//never sort in "autoAdapt" or "copy" mode\
			sort=false;
		}
		else if(GLBDnD.toolWhenMousedown=="declare"){
			//check if specific commutative property is selected
			let commutativeOf = $('.selectedTool').attr('data-commutative');
			let op = $atomTarget[0].MNODEparent().attr('data-atom')
			sort = (op==commutativeOf);
		}
		else{
			sort = $atomTarget[0].parentElement.matches('.ul_role') || !MNODEclosedDef($atomTarget);
		}
		$atomTarget[0].parentElement.setAttribute('from', 'fromNode')
		let fromSortable = makeSortableMouseDown([$atomTarget[0].parentElement], sort)[0]
		//inject start event
		fromSortable._onTapStart(event);
	}
}

function startHandlerMouseDown(event) {
	//*************** deselect ********
	if (event.type == 'start') {
		//clear selected unselected
		selectionManager("", "", "", true);
	}
	if (event.originalEvent.metaKey || event.originalEvent.ctrlKey||GLBDnD.toolWhenMousedown == 'copy' || event.from.matches('#palette,#palette *')) {
		//clone!
		event.item.classList.add('toBeCloned');
		//event.item.classList.remove('showAsPlaceholder');
	} else {
		//move!
		event.item.classList.add('showAsPlaceholder');
		//will be removed in onEndHandler

	}

}
function onMove(event) {
	$('.mu_DropTarget').removeClass('mu_DropTarget');
	MNODEparent($(event.to)).addClass('mu_DropTarget');
}
function onSort(event) {
	RefreshEmptyInfixBraketsGlued(MNODEparent($(event.target)))
}
function onUpdate(event) {
	clickSound.play()
	lookForResultAndCelebrate();
}

function onAdd(event) {
	//replacing sortablejs defaul clone with myClone (removed id, extends MNODE etc..)
	//item stays in place myclone dropped in new place
	event.item.classList.remove('showAsPlaceholder');
	let myClone
	//if moving, id and tags must remain!
	if($(event.item).hasClass('toBeCloned')){
		myClone = MNODEclone($(event.item))[0]//remove id and tag
		event.item.classList.remove('toBeCloned');
	}
	else{
		myClone = MNODEclone($(event.item),true,false)[0]//do not remove id and tag
	}
	event.item.replaceWith(myClone)
	event.clone.replaceWith(event.item)//questo è l'elemento che rimane nella posizione di partenza
	let dropped = myClone
	//*********** move or clone
	if (event.to.getAttribute('target') == 'opened') {
		if (event.to.matches('#canvasRole')) {
			WrapWithDefIfNeededreturnTarget($('#canvasRole'), $(dropped),true);
		}

		if ($(dropped).hasClass('toBeCloned')) {
			$(dropped).removeClass('toBeCloned');
		} else {
			$(event.item).remove();
			// if not cloning, clone was useful to visualize the starting point 	
		}
	}
	//*********** apply property
	else {
		let target
		let adHocTgt = event.to.classList.contains('tgt')
		if (adHocTgt) {
			//---->real target is Atom so dropped in ad hoc tgt role
			target = event.to.parentElement;
		} else {
			//---->target is a role (no need for ad hoc tgt)
			target = event.to
		}
		let targetProperty = target.getAttribute('target');
		console.log(' ------------> found target ' + targetProperty);
		//*********** dragPatternMatch
		if (targetProperty == 'dragPatternMatch') {
			
			
			let PActx = InstructAndTryOnePMT(GLBDnD.$originalProperty, MNODEparent($(event.to)), GLBDnD.direction)
			PActx.msg = GLBDnD.$originalProperty.closest('[data-tag]').attr('data-tag')
			PActxConclude(PActx)
		}
		//*********** apply property in propertiesDnD
		else {
			let property = getDnDpropEnabled().find(function (el) {
				return el.name == targetProperty
			});
			if (property) {
				let $droppedIn
				if($(event.to).hasClass('tgt')){ $droppedIn = $(event.to.parentElement)}//skip dummy tgt if present
				else{$droppedIn = $(event.to)}
				let PActx = property.apply($(event.item), $droppedIn, $(dropped))
				PActx.visualization = property.icon //an element must appear on the canvas to enable the property, such element also contains the icon for that property
				if (adHocTgt) {
					(event.to).remove()
				}
				if (PActx) {
					PActxConclude(PActx)
				}
			}
		}
	}
	if (!debugMode) {
		//clearSortableTargets();
		//clearTargetsMouseDown()
	}
	//in debugMode i target sono lasciati visibili
	clickSound.play();
}

function makeTargetsSortableRolesOrAtoms(targetsArray, propertyName, icon) {
	let j = 0;
	while (targetsArray[j]) {
		targetsArray[j].setAttribute('target', propertyName);
		if (targetsArray[j].matches('.ul_role')) {
			//target is a role: for example associative property   
			makeSortableMouseDown([targetsArray[j]]);
			let notAtgt = $('<div class="notAtgt"></div>')[0]
			if(icon){
					$(notAtgt).css('background-image',wrapUnwrapUrlString(icon));
			}
			targetsArray[j].append(notAtgt);
		} else {
			//target is not a role: for example in replacement it is an atom
			let tgt = $('<div class="tgt"></div>')[0]
			if(icon){
					$(tgt).css('background-image',wrapUnwrapUrlString(icon));
			}
			targetsArray[j].prepend(tgt);
			makeSortableMouseDown([tgt])
		}
		j++;
	}
}



function makeSortableMouseDown(roles, sort) {// roles is an array containing both roles and dummy roles 
	let sortables = []
	for (var i = 0; i < roles.length; i++) {//for each role
		sortables[i] = Sortable.get(roles[i])
		if (sortables[i]) {//if a Sortable instance exists for that role THEN enable it
			sortables[i].option('disabled', false);
			sortables[i].option('sort', sort);
		} else {//else create a Sortable
			sortables[i] = new Sortable(roles[i], {
				group: {
					name: 'shared',
					pull: 'clone',
				},
				sort: sort,
				onUpdate:onUpdate,// Changed sorting within list
				onSort:onSort,
				onStart: startHandlerMouseDown,
				onAdd: onAdd,
				onMove:onMove,
				onEnd:MouseUpCleanup,//on sortend the event MouseUp does not occur! onEnd is fired instead
				fallbackOnBody: true,
				swapThreshold: 0.65,
				animation: 150,
			});
		}
	}
	return sortables
}
function MouseUpCleanup(event) {
	if (!debugMode) {//in debugMode i target sono lasciati visibili
		hideTargetsOnMouseUp()// targets are hidden, not removed 
		//cleanupDnD()//if I remove targets and the "onAdd" event fires after Mouseup, the onAdd handler may be in error because of disappeared targets
	}
}

function cleanupDnD() {
	//called both on sortEnd an Mouseup events 
	//at least one of the events must fire
	//not optimal
	//Mouseup does not fire if the element is removed as a result of property applications
	//Sortend is not fired if click without drag
	//Documentation:
	//https://docs.google.com/drawings/d/1sASg3RC51sOYWCRIxJjdRI_lL0ZKpATyPaFWfkVxT70/edit
	removeClassByPrefix(undefined,'mu_') //clear classes in case mouseup failed to fire
	clearSortableTargets()
	clearLines()//todo: distinguish between hints and PatternMatching and other lines
}
function hideTargetsOnMouseUp(){
	removeClassByPrefix(undefined,'mu_') //clear classes on mouseup
	$('.tgt,.notAtgt').css('background-image','none')
	clearLines()
}


function clearSortableTargets() {
	$('*').removeClass('toBeCollected').removeClass('couldBeCollected');
	$('*').removeClass('dropTarget');
	$('*').removeClass('TargetsCommonParent');
	$('*').removeClass('refine_c'); 
	let tgts = document.querySelectorAll('.tgt,.notAtgt');
	let i = 0;
	while (tgts[i]) {
		let sortable = Sortable.get(tgts[i]);
		if (sortable) { sortable.destroy() };
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


