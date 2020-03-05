function removeClassStartNodeAndDiscendence(Class,$startNode){
	let $toBeCleaned
	if($startNode == undefined){
		$toBeCleaned = $('*')
	}
	else{
		$toBeCleaned = $startNode.find('*').addBack()	
	}
	$toBeCleaned.removeClass(Class);
}


function clearTarget(Classes){// for example clearTarget(['selected','unselected'])   or clearTarget(['unselected')
	if (typeof(Classes)=="string"){Classes=[Classes]}//if input is a sting, create a one element array
	document.querySelectorAll(sortablesSelectorString).forEach(function(e){e.classList.remove(...Classes)});//clear an array of classes
}
