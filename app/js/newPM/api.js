/**
 * newPM — API console: newPM(pattern, input, options?)
 *
 * Esempi (dopo il load):
 *   newPM(patternENODE, inputENODE)
 *   newPM('#canvasRole [data-enode=plus]', $selection)
 *   await newPM(p, i, { play: true, stepMs: 600 })
 */
(function (global) {
	'use strict';

	var NewPM = global.NewPM || (global.NewPM = {});
	var previousLoad = global.newPM && global.newPM.load;

	NewPM.resolveENODE = function (ref) {
		if (ref == null) return $();
		if (ref.jquery) {
			if (ref.length === 0) return ref;
			if (ref.filter('[data-enode]').length === ref.length) return ref;
			if (ref.is('[data-enode]')) return ref;
			var $found = ref.find('[data-enode]');
			return $found.length ? $found.first() : ref;
		}
		if (typeof ref === 'string') {
			var $s = $(ref);
			if (!$s.length) return $s;
			if ($s.length > 1 && $s.filter('[data-enode]').length === $s.length) {
				return $s;
			}
			if ($s.is('[data-enode]')) return $s.first();
			return $s.find('[data-enode]').first();
		}
		if (ref.nodeType === 1) {
			var $n = $(ref);
			return $n.is('[data-enode]') ? $n : $n.find('[data-enode]').first();
		}
		return $(ref);
	};

	/**
	 * @param {*} pattern
	 * @param {*} input
	 * @param {{ play?: boolean, stepMs?: number, orderedList?: boolean, clearAtEnd?: boolean }} options
	 * @returns {Promise<object>|object}
	 */
	function newPM(pattern, input, options) {
		options = options || {};
		if (typeof NewPM.runMatch !== 'function') {
			throw new Error('newPM: match.js non caricato. Esegui $.getScript("js/newPM/load.js")');
		}

		var result = NewPM.runMatch(pattern, input, {
			orderedList: options.orderedList
		});

		result.play = function (playOpts) {
			playOpts = playOpts || {};
			if (typeof NewPM.playTrace !== 'function') {
				return Promise.reject(new Error('newPM: visualize.js non caricato'));
			}
			return NewPM.playTrace(result.trace, {
				stepMs: playOpts.stepMs != null ? playOpts.stepMs : options.stepMs,
				clearAtEnd:
					playOpts.clearAtEnd != null ? playOpts.clearAtEnd : options.clearAtEnd
			});
		};

		NewPM.lastResult = result;

		if (typeof console !== 'undefined' && console.log) {
			console.log(
				'[newPM]',
				result.matched ? 'MATCH' : 'NO MATCH',
				result.msg || '',
				'| steps:',
				result.trace.length,
				'| bindings:',
				result.bindings
			);
		}

		if (options.play) {
			return result.play().then(function () {
				return result;
			});
		}
		return result;
	}

	newPM.version = '0.1.0-exp';
	newPM.NS = NewPM;
	newPM.last = function () {
		return NewPM.lastResult;
	};
	newPM.clear = function () {
		if (NewPM.clearVisuals) NewPM.clearVisuals();
	};
	if (typeof previousLoad === 'function') {
		newPM.load = previousLoad;
	}

	global.newPM = newPM;
	NewPM.api = newPM;
})(typeof window !== 'undefined' ? window : globalThis);
