/**
 * newPM — API console: newPM(draggedPattern, targetInput, options?)
 *
 * Semantica: arg1 = pattern da “trascinare”, arg2 = target su cui rilasciare.
 * Default: play:true (animazione). Override: { play: false }.
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

	function describeRef(ref) {
		if (typeof ref === 'string') return JSON.stringify(ref);
		if (ref && ref.jquery) return 'jQuery(' + ref.length + ')';
		if (ref && ref.nodeType) return '<' + (ref.tagName || '?') + '>';
		return String(ref);
	}

	/**
	 * @param {*} dragged — pattern (selettore / ENODE / jQuery)
	 * @param {*} target — input su cui rilasciare
	 * @param {{ play?: boolean, stepMs?: number, orderedList?: boolean, clearAtEnd?: boolean }} options
	 */
	function newPM(dragged, target, options) {
		options = options || {};
		if (options.play === undefined) {
			options.play = true;
		}

		if (typeof NewPM.runMatch !== 'function') {
			throw new Error('newPM: match.js non caricato');
		}
		if (typeof NewPM.buildVisualScript !== 'function') {
			throw new Error('newPM: phases.js non caricato');
		}

		var $pattern = NewPM.resolveENODE(dragged);
		var $input = NewPM.resolveENODE(target);
		if (!$pattern.length || !$pattern.is('[data-enode]')) {
			throw new Error(
				'newPM: pattern non risolto — nessun ENODE per ' + describeRef(dragged)
			);
		}
		if (!$input.length || !$input.is('[data-enode]')) {
			throw new Error(
				'newPM: target non risolto — nessun ENODE per ' + describeRef(target)
			);
		}

		var result = NewPM.runMatch($pattern, $input, {
			orderedList: options.orderedList
		});
		result.visualSteps = NewPM.buildVisualScript(result);
		result.trace = result.visualSteps;

		result.play = function (playOpts) {
			playOpts = playOpts || {};
			if (typeof NewPM.playTrace !== 'function') {
				return Promise.reject(new Error('newPM: visualize.js non caricato'));
			}
			return NewPM.playTrace(result.visualSteps, {
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
				'| visual steps:',
				result.visualSteps.length,
				'| structureFits:',
				(result.structureFits || []).length,
				'| leafBinds:',
				(result.leafBinds || []).length
			);
			console.log(
				'[newPM] fasi:',
				result.visualSteps.map(function (s) {
					return s.phase + ':' + s.kind;
				})
			);
		}

		if (options.play) {
			return result.play().then(function () {
				return result;
			});
		}
		return result;
	}

	newPM.version = '0.4.0-exp';
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
