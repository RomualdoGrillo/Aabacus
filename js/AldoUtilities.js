//makeSortableDEBUG( $(tela).find( sortablesSelectorString ).addBack().add($('#tavolozza')).toArray() );



function makeSortableDEBUG(sortables) {
	for (var i = 0; i < sortables.length; i++) {
		new Sortable(sortables[i],{

			group: {
				name: 'shared',
				pull: 'clone',
				//put: false // Do not allow items to be put into this list
			},
			animation: 150,
			sort: true // To disable sorting: set sort to false
			
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
