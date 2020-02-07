



/*

//******************** MOUSEDOWN E CLICK *********************
tela.addEventListener("mousedown",MousedownOrTouchStart);
tela.addEventListener('touchstart', MousedownOrTouchStart);

function MousedownOrTouchStart(event){
	if(event.type=="mousedown"){
    	if(event.sourceCapabilities.firesTouchEvents == false){
            //real mousedown
            console.log('mousedown event')
    	}
    	else{
    	    //touchStop is mapped to a mouseDown (only when you do not drag the element)
    	    return //discard event
    	}
	}
    else{
        console.log('touchstart event')
    }
    var $sourceATOM = $(ATOMNselectable(event.target));
	if( event.ctrlKey||!ATOMclosedDef($sourceATOM) ){
		//ctrlKemy or fromOpened
		//destroyAllRegisteredSortables()
		clearClass("target-associative")
		validTargetsFromOpened($sourceATOM).addClass("target-associative");	
		//let $targets = validTargetsFromOpened($sourceATOM);
		//makeSortable( $targets.add($sourceATOM[0].ATOM_getRoles()));
	}
	else{//apply properties
		
	}
	// from target go back to AtomTarget
}
*/

/*
function mouseDownHandler(event){
    //console.log('mouseDown');
    console.log(ATOMNselectable(event.target));
	var $parent = ATOMparent($(event.target));
	//mark 
	var op = undefined
	if ($parent !== undefined){op = $parent.attr("data-atom")}
    clearTarget("target-associative")//clear previous marks
	immediateAssValid($(event.target),op).addClass("target-associative");
}

*/








/*

var nestedSortablesNum = document.querySelectorAll('.ul_role[data-type=num],[data-atom=ci][data-type=num]')
for (var i = 0; i < nestedSortablesNum.length; i++) {
	new Sortable(nestedSortablesNum[i], {
         group: {
        name: 'shared',
        pull: 'clone',
        //put: false // Do not allow items to be put into this list
    },
		animation: 150,
		fallbackOnBody: true,
		swapThreshold: 0.65,
        //filter: ".decoration",
        onEnd:onEndHandler,
        onMove:onMoveHandler,
	});
}

var nestedSortablesBool = document.querySelectorAll('.ul_role[data-type=bool],[data-atom=ci][data-type=bool]')
for (var i = 0; i < nestedSortablesBool.length; i++) {
	new Sortable(nestedSortablesBool[i], {
         group: {
        name: 'bool',
        pull: 'clone',
        //put: false // Do not allow items to be put into this list
    },
		animation: 150,
		fallbackOnBody: true,
		swapThreshold: 0.65,
        //filter: ".decoration",
        onEnd:onEndHandler,
        onMove:onMoveHandler,
	});
}

*/





