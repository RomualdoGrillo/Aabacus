/**
 * newPM — player della traccia: ellisse che si stringe (metafora maglione).
 */
(function (global) {
	'use strict';

	var NewPM = global.NewPM || (global.NewPM = {});

	function ensureNarration() {
		var el = document.getElementById('newPM-narration');
		if (!el) {
			el = document.createElement('div');
			el.id = 'newPM-narration';
			document.body.appendChild(el);
		}
		return el;
	}

	function clearVisuals() {
		$('.newPM-halo').remove();
		$('.newPM-candidate, .newPM-fitted, .newPM-rejected').removeClass(
			'newPM-candidate newPM-fitted newPM-rejected'
		);
		var n = document.getElementById('newPM-narration');
		if (n) n.remove();
	}

	function rectOf(el) {
		if (!el || !el.getBoundingClientRect) return null;
		var r = el.getBoundingClientRect();
		if (!r.width && !r.height) return null;
		return {
			top: r.top + window.scrollY,
			left: r.left + window.scrollX,
			width: Math.max(r.width, 18),
			height: Math.max(r.height, 18)
		};
	}

	function placeHalo(el, stateClass) {
		var r = rectOf(el);
		if (!r) return null;
		var pad = 10;
		var halo = document.createElement('div');
		halo.className = 'newPM-halo' + (stateClass ? ' ' + stateClass : '');
		halo.style.top = r.top - pad + 'px';
		halo.style.left = r.left - pad + 'px';
		halo.style.width = r.width + pad * 2 + 'px';
		halo.style.height = r.height + pad * 2 + 'px';
		document.body.appendChild(halo);
		// force reflow then tighten (maglione)
		void halo.offsetWidth;
		if (stateClass !== 'is-reject') {
			halo.classList.add('is-fitting');
		}
		return halo;
	}

	function sleep(ms) {
		return new Promise(function (resolve) {
			setTimeout(resolve, ms);
		});
	}

	/**
	 * @param {array} trace
	 * @param {{ stepMs?: number, clear?: boolean }} options
	 */
	async function playTrace(trace, options) {
		options = options || {};
		var stepMs = options.stepMs != null ? options.stepMs : 700;
		if (options.clear !== false) clearVisuals();

		var narration = ensureNarration();
		var lastHalo = null;

		for (var i = 0; i < (trace || []).length; i++) {
			var step = trace[i];
			narration.textContent = step.narrate || step.kind;
			narration.setAttribute('data-kind', step.kind || '');

			if (lastHalo) {
				lastHalo.remove();
				lastHalo = null;
			}
			$('.newPM-candidate').removeClass('newPM-candidate');

			if (step.inputEl) {
				var $in = $(step.inputEl);
				if (step.kind === 'try') {
					$in.addClass('newPM-candidate');
					lastHalo = placeHalo(step.inputEl, '');
				} else if (step.kind === 'bind') {
					$in.addClass('newPM-fitted');
					lastHalo = placeHalo(step.inputEl, 'is-fitting');
				} else if (step.kind === 'reject') {
					$in.addClass('newPM-rejected');
					lastHalo = placeHalo(step.inputEl, 'is-reject');
				} else if (step.kind === 'fail' || step.kind === 'done') {
					if (step.inputEl) lastHalo = placeHalo(step.inputEl, step.kind === 'done' ? 'is-fitting' : 'is-reject');
				}
			}

			await sleep(stepMs);
		}

		if (options.clearAtEnd) {
			await sleep(400);
			clearVisuals();
		}

		return true;
	}

	NewPM.playTrace = playTrace;
	NewPM.clearVisuals = clearVisuals;
})(typeof window !== 'undefined' ? window : globalThis);
