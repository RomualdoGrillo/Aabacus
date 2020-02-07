var sorting = false;

new Sortable(el, {
	onStart: function() {
		sorting = true;
	},
	onEnd: function() {
      sorting = false;
      // remove styling
      targetElement.style.backgroundColor = '';
	},
//     forceFallback:true
});

addEventsForOvering(targetElement)

function addEventsForOvering(target){
	// For native drag&drop
	target.addEventListener('dragover', function(evt) {
		evt.preventDefault();
	});

	target.addEventListener('dragenter', function(evt) {
		if (sorting && !target.contains(evt.relatedTarget)) {
			// Here is where you add the styling of target
			target.style.backgroundColor = 'red';
		}
	});

	target.addEventListener('dragleave', function(evt) {
		if (sorting && !target.contains(evt.relatedTarget)) {
			// Here is where you remove the styling of target
			target.style.backgroundColor = '';
		}
	});


	// For fallback
	target.addEventListener('mouseenter', function(evt) {
	  if (sorting) {
		// Here is where you change the styling of target
		target.style.backgroundColor = 'red';
	  }
	});

	target.addEventListener('mouseleave', function(evt) {
	  console.log("vadsf");
	  if (sorting) {
		// Here is where you remove the styling of target
		target.style.backgroundColor = '';
	  }
	});
}

el.addEventListener('touchmove', function(evt) {
  if (!sorting) { return; }
  var x = evt.touches[0].clientX;
  var y = evt.touches[0].clientY;
  var elementAtTouchPoint = document.elementFromPoint(x, y);

  if (elementAtTouchPoint === targetElement ||
      elementAtTouchPoint.parentNode === targetElement) {
    targetElement.style.backgroundColor = 'red';
  } else {
    // Here is where you remove the styling of targetElement
    targetElement.style.backgroundColor = '';
  }
});
