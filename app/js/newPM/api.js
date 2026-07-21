/**
 * newPM — API console allineata ad autoAdapt:
 *   newPM(draggedInPattern, dropTarget, options?)
 *
 * arg1 = elemento nel pattern (attack / pezzo trascinato)
 * arg2 = target di drop nell’input
 * L’operando viene ricavato risalendo (mark "s" + levelsToAncestor).
 * Default: play:true. Override: { play: false }.
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
	 * @param {*} dragged — elemento nel pattern (selettore / ENODE / jQuery)
	 * @param {*} target — drop target nell’input
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
		if (typeof NewPM.resolveFromDragAndTarget !== 'function') {
			throw new Error('newPM: resolve.js non caricato');
		}
		if (typeof NewPM.buildVisualScript !== 'function') {
			throw new Error('newPM: phases.js non caricato');
		}

		var resolved;
		try {
			resolved = NewPM.resolveFromDragAndTarget(dragged, target);
		} catch (err) {
			var msg = err && err.message ? err.message : String(err);
			if (msg.indexOf('newPM:') !== 0) {
				msg =
					'newPM: resolve fallito per ' +
					describeRef(dragged) +
					' / ' +
					describeRef(target) +
					' — ' +
					msg;
			}
			throw new Error(msg);
		}

		var result = NewPM.runMatch(resolved.$pattern, resolved.$operand, {
			orderedList: options.orderedList
		});
		result.$pattern = resolved.$pattern;
		result.$input = resolved.$operand;
		result.$transform = resolved.$transform;
		result.$operand = resolved.$operand;
		result.$dropTarget = resolved.$dropTarget;
		result.$attackInPattern = resolved.$attackInPattern;
		result.$property = resolved.$property;
		result.direction = resolved.direction;
		result.patternDepth = resolved.patternDepth;

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
				'| dir:',
				result.direction,
				'| depth:',
				result.patternDepth,
				'| steps:',
				result.visualSteps.length
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

	/**
	 * Selettori della fixture newPM_assoc.mmls (relativi al forAll:
	 * non dipendono da quanti ci ci sono prima nel canvas).
	 * Uso: await newPM(newPM.SEL.attack, newPM.SEL.dropOk)
	 * Nota: :eq(n) è sintassi jQuery (usata da $() in resolveENODE).
	 */
	newPM.SEL = {
		/** plus interno del pattern (elemento trascinato) */
		attack:
			'[data-tag=newPM-assoc] .firstMember [data-enode=plus] [data-enode=plus]',
		/** root del pattern (primo membro) */
		pattern: '[data-tag=newPM-assoc] .firstMember > [data-enode=plus]',
		/** foglia 3 nell’input che matcha (1ª eq dopo la proprietà) */
		dropOk:
			'[data-tag=newPM-assoc] ~ [data-enode=eq]:eq(0) [data-enode=plus] [data-enode=plus] [data-enode=cn]',
		/** root input che matcha */
		okRoot: '[data-tag=newPM-assoc] ~ [data-enode=eq]:eq(0) [data-enode=plus]',
		/** prima foglia cn nell’input times (2ª eq) */
		dropFailTimes:
			'[data-tag=newPM-assoc] ~ [data-enode=eq]:eq(1) [data-enode=cn]',
		/** prima foglia cn nell’input corto (3ª eq) */
		dropFailShort:
			'[data-tag=newPM-assoc] ~ [data-enode=eq]:eq(2) [data-enode=cn]'
	};

	newPM.version = '0.5.3-exp';
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
