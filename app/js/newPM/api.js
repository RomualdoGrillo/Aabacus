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
	 * Catalogo selettori per le fixture TestBedExamples/newPM_*.mmls.
	 * Relativi al forAll (non dipendono dai ci sopra).
	 * :eq(n) = sintassi jQuery (usata da $() in resolveENODE).
	 *
	 * Uso:
	 *   await newPM(newPM.SEL.attack, newPM.SEL.dropOk)
	 *   newPM.use('distrib')  // forza un catalogo
	 */
	var FIXTURE_SELS = {
		assoc: {
			tag: 'newPM-assoc',
			path:
				'./Data/TestBedExamples/newPM_assoc.mmls',
			attack:
				'[data-tag=newPM-assoc] .firstMember [data-enode=plus] [data-enode=plus]',
			pattern: '[data-tag=newPM-assoc] .firstMember > [data-enode=plus]',
			dropOk:
				'[data-tag=newPM-assoc] ~ [data-enode=eq]:eq(0) [data-enode=plus] [data-enode=plus] [data-enode=cn]',
			okRoot: '[data-tag=newPM-assoc] ~ [data-enode=eq]:eq(0) [data-enode=plus]',
			dropFailTimes:
				'[data-tag=newPM-assoc] ~ [data-enode=eq]:eq(1) [data-enode=cn]',
			dropFailShort:
				'[data-tag=newPM-assoc] ~ [data-enode=eq]:eq(2) [data-enode=cn]'
		},
		distrib: {
			tag: 'newPM-distrib',
			path: './Data/TestBedExamples/newPM_distrib.mmls',
			/** b_ marcato s dentro a_(b_+c_) */
			attack: '[data-tag=newPM-distrib] .firstMember [title=s]',
			pattern: '[data-tag=newPM-distrib] .firstMember > [data-enode=times]',
			/** foglia x in 2*(x+3) */
			dropOk:
				'[data-tag=newPM-distrib] ~ [data-enode=eq]:eq(0) [data-enode=plus] [data-enode=ci]',
			okRoot:
				'[data-tag=newPM-distrib] ~ [data-enode=eq]:eq(0) [data-enode=times]',
			dropFailPlus:
				'[data-tag=newPM-distrib] ~ [data-enode=eq]:eq(1) [data-enode=cn]',
			dropFailShort:
				'[data-tag=newPM-distrib] ~ [data-enode=eq]:eq(2) [data-enode=cn]',
			dropFailTernary:
				'[data-tag=newPM-distrib] ~ [data-enode=eq]:eq(3) [data-enode=plus] [data-enode=ci]'
		},
		power: {
			tag: 'newPM-power',
			path: './Data/TestBedExamples/newPM_power.mmls',
			/** primo n_ marcato s in a_^n_ * b_^n_ */
			attack: '[data-tag=newPM-power] .firstMember [title=s]',
			pattern: '[data-tag=newPM-power] .firstMember > [data-enode=times]',
			/** esponente 2 di x^2 */
			dropOk:
				'[data-tag=newPM-power] ~ [data-enode=eq]:eq(0) [data-enode=power]:eq(0) [data-enode=cn]',
			okRoot: '[data-tag=newPM-power] ~ [data-enode=eq]:eq(0) [data-enode=times]',
			dropFailExp:
				'[data-tag=newPM-power] ~ [data-enode=eq]:eq(1) [data-enode=cn]',
			dropFailPlus:
				'[data-tag=newPM-power] ~ [data-enode=eq]:eq(2) [data-enode=cn]'
		}
	};

	var forcedFixture = null;

	function detectFixtureName() {
		if (forcedFixture && FIXTURE_SELS[forcedFixture]) return forcedFixture;
		var $tagged = $('[data-tag^=newPM-]').first();
		if ($tagged.length) {
			var tag = $tagged.attr('data-tag') || '';
			var name = tag.replace(/^newPM-/, '');
			if (FIXTURE_SELS[name]) return name;
		}
		return 'assoc';
	}

	function activeSel() {
		return FIXTURE_SELS[detectFixtureName()];
	}

	Object.defineProperty(newPM, 'SEL', {
		configurable: true,
		enumerable: true,
		get: function () {
			return activeSel();
		}
	});

	newPM.FIXTURES = FIXTURE_SELS;

	/** Elenco nomi fixture e path preload. */
	newPM.list = function () {
		return Object.keys(FIXTURE_SELS).map(function (name) {
			var f = FIXTURE_SELS[name];
			return {
				name: name,
				tag: f.tag,
				url: '/?preloadPath=' + f.path
			};
		});
	};

	/**
	 * Forza il catalogo SEL (utile se più forAll newPM-* sono in pagina).
	 * newPM.use('distrib') | 'assoc' | 'power' | null (auto)
	 */
	newPM.use = function (name) {
		if (name == null) {
			forcedFixture = null;
			return activeSel();
		}
		if (!FIXTURE_SELS[name]) {
			throw new Error(
				'newPM.use: fixture sconosciuta "' +
					name +
					'". Usa: ' +
					Object.keys(FIXTURE_SELS).join(', ')
			);
		}
		forcedFixture = name;
		return FIXTURE_SELS[name];
	};

	newPM.version = '0.6.1-exp';
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
