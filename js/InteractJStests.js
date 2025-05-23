function innteractMakeDroppable(selector){
	// enable draggables to be dropped into this
	interact(selector).dropzone({
	  // only accept elements matching this CSS selector
	  //accept: '[data-enode]',
	  // Require a 75% element overlap for a drop to be possible
	  overlap: 0.75,

	  // listen for drop related events:

	  ondropactivate: function (event) {
		// add active dropzone feedback
		event.target.classList.add('drop-active')
		console.log('interactive drooop!!!!!!!!!!!!!!!!!!!')
	  },
	  ondragenter: function (event) {
		var draggableElement = event.relatedTarget
		var dropzoneElement = event.target
		console.log('interactive enter drooop!!!!!!!!!!!!!!!!!!!')

		// feedback the possibility of a drop
		dropzoneElement.classList.add('drop-target')
		draggableElement.classList.add('can-drop')
		draggableElement.textContent = 'Dragged in'
	  },
	  ondragleave: function (event) {
		// remove the drop feedback style
		event.target.classList.remove('drop-target')
		event.relatedTarget.classList.remove('can-drop')
		event.relatedTarget.textContent = 'Dragged out'
	  },
	  ondrop: function (event) {
		event.relatedTarget.textContent = 'Dropped'
	  },
	  ondropdeactivate: function (event) {
		// remove active dropzone feedback
		event.target.classList.remove('drop-active')
		event.target.classList.remove('drop-target')
	  }
	})
}