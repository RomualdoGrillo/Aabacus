// from  https://www.w3schools.com/html/html5_draganddrop.asp
//cs = document.querySelectorAll('[data-atom=ci]');
//cs.forEach(attachEventsToOneCi)
function eventLogger(){
 document.addEventListener('touchstart',function(ev){console.log('touchstart');console.log(ev)}) 
 document.addEventListener('touchmove',function(ev){console.log('touchmove');console.log(ev)}) 
 document.addEventListener('touchend',function(ev){console.log('touchend');console.log(ev)}); 
 document.addEventListener('ondragovers',function(ev){console.log('ondragovers');console.log(ev)});
}
function eventOver(el){
 el.addEventListener('ondragovers',function(ev){console.log('ondragovers');console.log(ev)});
}





function attachEventsToOneCi(el){

  el.addEventListener('ondragstart',drag);
  el.addEventListener('ondragovers',allowDrop);
  el.addEventListener('drop',drop);
}
function allowDrop(ev) {
  ev.preventDefault();
  console.log('dragover!!!!!!!!!!!!!!')
}

function drag(ev) {
  //ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  //var data = ev.dataTransfer.getData("text");
  //ev.target.appendChild(document.getElementById(data));
  console.log('drop!!!!!!!!!!!!!!!!!!!!!!!!')
  console.log(ev)
}

/*

<div id="div1" ondrop="drop(event)" ondragover="allowDrop(event)"></div>

<img id="drag1" src="img_logo.gif" draggable="true" ondragstart="drag(event)" width="336" height="69">

*/


function addEventsForOvering(target){
	// For native drag&drop
	target.addEventListener('dragover', function(evt) {
		evt.preventDefault();
	});

	target.addEventListener('dragenter', function(evt) {
		if (sorting && !target.contains(evt.relatedTarget)) {
			// Here is where you add the styling of target
			console.log("------------>dragenter");
			target.style.backgroundColor = 'red';
		}
	});

	target.addEventListener('dragleave', function(evt) {
		if (sorting && !target.contains(evt.relatedTarget)) {
			console.log("dragleave------------->");
			// Here is where you remove the styling of target
			target.style.backgroundColor = '';
		}
	});


	// For fallback
	target.addEventListener('mouseenter', function(evt) {
	  if (sorting) {
		console.log("------------>enter");
		// Here is where you change the styling of target
		target.style.backgroundColor = 'red';
	  }
	});

	target.addEventListener('mouseleave', function(evt) {
	  if (sorting) {
		console.log("mouseleave------------->");
	  
		// Here is where you remove the styling of target
		target.style.backgroundColor = '';
	  }
	});
}


//that function can be used to detect when a valid element is hovering over a target via touch
function addEventsToDraggables(element){

  element.addEventListener('touchmove', function(evt) {
    if (!sorting) { return; }
    var x = evt.touches[0].clientX;
    var y = evt.touches[0].clientY;
    var elementAtTouchPoint = document.elementFromPoint(x, y);
    elementAtTouchPoint.style.backgroundColor = 'red';//qui passanno tutti gli elementi che sta sorvolando

    
    /*
    if (elementAtTouchPoint === targetElement ||
        elementAtTouchPoint.parentNode === targetElement) {
      targetElement.style.backgroundColor = 'red';
    } else {
      // Here is where you remove the styling of targetElement
      targetElement.style.backgroundColor = '';
    }
    */
  });



}