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

	function disposeClone(result, options) {
		if (!result || !result.$cloneProp || !result.$cloneProp.length) return;
		if (options && options.keepClone) return;
		// se il transform è già sul canvas, non rimuoverlo con la clone
		var $tf = result.$transform;
		if (
			result.applied &&
			$tf &&
			$tf.length &&
			result.$cloneProp.has($tf).length === 0 &&
			$tf.closest(result.$cloneProp).length === 0
		) {
			// transform fuori dalla clone: rimuovi solo il guscio clone se ancora nel DOM
		}
		if (typeof NewPM.discardCloneProp === 'function') {
			NewPM.discardCloneProp(result.$cloneProp);
		} else if (typeof ENODEremove === 'function') {
			try {
				ENODEremove(result.$cloneProp);
			} catch (e) {
				result.$cloneProp.remove();
			}
		} else {
			result.$cloneProp.remove();
		}
		result.$cloneProp = $();
	}

	function snapshotInitialTransform($cloneProp) {
		if (!$cloneProp || !$cloneProp.length || typeof ENODEclone !== 'function') {
			return $();
		}
		var mem =
			typeof NewPM.rereadCloneMembers === 'function'
				? NewPM.rereadCloneMembers($cloneProp)
				: null;
		if (!mem || !mem.$transform || !mem.$transform.length) return $();
		var $snap = ENODEclone(mem.$transform, false, false);
		$snap.addClass('PMclone newPM-tf-snap');
		return $snap;
	}

	/**
	 * Trapianto finale: transform istanziato al posto dell’operando (come refreshAndReplace).
	 */
	NewPM.applyToCanvas = function (result) {
		if (!result || !result.matched) {
			throw new Error('newPM.applyToCanvas: serve un match riuscito');
		}
		if (result.applied) return result;
		var $operand = result.$operand;
		var $transform = result.$transform;
		if (!$operand || !$operand.length || !$transform || !$transform.length) {
			throw new Error('newPM.applyToCanvas: operand/transform mancanti');
		}
		if (typeof refreshAndReplace === 'function') {
			refreshAndReplace({
				$operand: $operand,
				$transform: $transform,
				replacedAlready: false,
				msg: 'newPM'
			});
		} else if (typeof ENODEinsertBefore === 'function') {
			ENODEinsertBefore($transform, $operand[0]);
			if (typeof ENODEremove === 'function') ENODEremove($operand);
			else $operand.remove();
			if (typeof RefreshEmptyInfixBraketsGlued === 'function') {
				RefreshEmptyInfixBraketsGlued();
			}
		} else {
			throw new Error('newPM.applyToCanvas: refreshAndReplace non disponibile');
		}
		result.applied = true;
		result.$operand = $transform;
		result.$input = $transform;
		if (typeof console !== 'undefined' && console.log) {
			console.log('[newPM] transform applicato sul canvas');
		}
		return result;
	};

	/**
	 * @param {*} dragged — elemento nel pattern (selettore / ENODE / jQuery)
	 * @param {*} target — drop target nell’input
	 * @param {{ play?: boolean, stepMs?: number, orderedList?: boolean, clearAtEnd?: boolean, keepClone?: boolean, sound?: boolean, apply?: boolean }} options
	 */
	function newPM(dragged, target, options) {
		options = options || {};
		if (options.play === undefined) {
			options.play = true;
		}
		if (options.apply === undefined) {
			options.apply = true;
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

		var $transformInitialSnap = snapshotInitialTransform(resolved.$cloneProp);

		var result = NewPM.runMatch(resolved.$pattern, resolved.$operand, {
			orderedList: options.orderedList,
			$cloneProp: resolved.$cloneProp
		});

		result.$cloneProp = result.$cloneProp || resolved.$cloneProp;
		result.$property = resolved.$property;
		result.$operand = resolved.$operand;
		result.$input = resolved.$operand;
		result.$dropTarget = resolved.$dropTarget;
		result.$attackInPattern = resolved.$attackInPattern;
		result.$transformLive = resolved.$transformLive;
		result.direction = resolved.direction;
		result.patternDepth = resolved.patternDepth;
		result.$transformInitialSnap = $transformInitialSnap;
		result.applied = false;

		var mem =
			result.$cloneProp &&
			result.$cloneProp.length &&
			typeof NewPM.rereadCloneMembers === 'function'
				? NewPM.rereadCloneMembers(result.$cloneProp)
				: null;
		if (mem && mem.$transform && mem.$transform.length) {
			result.$transform = mem.$transform;
			result.$pattern = mem.$pattern.length ? mem.$pattern : resolved.$pattern;
		} else {
			result.$transform = resolved.$transform;
			result.$pattern = resolved.$pattern;
		}

		result.visualSteps = NewPM.buildVisualScript(result);
		result.trace = result.visualSteps;

		result.disposeClone = function () {
			disposeClone(result, { keepClone: false });
		};

		result.apply = function () {
			return NewPM.applyToCanvas(result);
		};

		result.play = function (playOpts) {
			playOpts = playOpts || {};
			if (typeof NewPM.playTrace !== 'function') {
				return Promise.reject(new Error('newPM: visualize.js non caricato'));
			}
			var applyFlag =
				playOpts.apply != null ? playOpts.apply : options.apply;
			return NewPM.playTrace(result.visualSteps, {
				stepMs: playOpts.stepMs != null ? playOpts.stepMs : options.stepMs,
				clearAtEnd:
					playOpts.clearAtEnd != null ? playOpts.clearAtEnd : options.clearAtEnd,
				sound: playOpts.sound != null ? playOpts.sound : options.sound,
				result: result,
				apply: applyFlag
			}).then(function () {
				if (!options.keepClone && playOpts.keepClone !== true) {
					disposeClone(result, options);
				}
				return result;
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
			if (result.matched && result.$transform && result.$transform.length) {
				var tLabel = NewPM.enodeLabel
					? NewPM.enodeLabel(result.$transform)
					: result.$transform.attr('data-enode');
				console.log('[newPM] transform istanziato:', tLabel);
			}
		}

		if (options.play) {
			return result.play().then(function () {
				return result;
			});
		}
		// senza play: apply immediato se richiesto e match ok
		if (result.matched && options.apply) {
			NewPM.applyToCanvas(result);
		}
		if (!options.keepClone) {
			disposeClone(result, options);
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

	newPM.version = '0.8.1-exp';
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
