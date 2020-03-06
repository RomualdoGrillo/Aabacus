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

//from  https://stackoverflow.com/questions/14780350/convert-relative-path-to-absolute-using-javascript
function buildPath(base, relative) {
    var stack = base.split("/"),
        parts = relative.split("/");
    stack.pop(); // remove current file name (or empty string)
                 // (omit if "base" is the current folder without trailing slash)
    for (var i=0; i<parts.length; i++) {
        if (parts[i] == ".")
            continue;
        if (parts[i] == "..")
            stack.pop();
        else
            stack.push(parts[i]);
    }
    return stack.join("/");
}