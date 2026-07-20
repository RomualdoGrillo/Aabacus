/**
 * newPM — script visuale allineato allo storyboard PDF:
 *   dragStart → dragGhost → structureFit → leaves → transform
 */
(function (global) {
	'use strict';

	var NewPM = global.NewPM || (global.NewPM = {});

	function buildVisualScript(matchResult) {
		var steps = [];
		var $pattern = matchResult.$pattern;
		var $input = matchResult.$input;
		var $transform = matchResult.$transform;
		var structureFits = (matchResult.structureFits || []).slice();
		var leafBinds = matchResult.leafBinds || [];

		structureFits.sort(function (a, b) {
			return b.depth - a.depth;
		});

		var outerFit = structureFits.length
			? structureFits[structureFits.length - 1]
			: null;
		var innerFit =
			structureFits.length > 1 ? structureFits[0] : structureFits[0] || null;
		// dopo sort desc: [0]=più interno, [last]=più esterno
		innerFit = structureFits[0] || null;
		outerFit = structureFits[structureFits.length - 1] || null;

		steps.push({
			phase: 'dragStart',
			kind: 'dragStart',
			narrate:
				'L’utente inizia a trascinare un membro dell’equazione (pattern)',
			patternEl: $pattern && $pattern[0],
			transformEl: $transform && $transform[0],
			inputEl: $input && $input[0]
		});

		steps.push({
			phase: 'dragGhost',
			kind: 'dragGhost',
			narrate:
				'Versione semplificata del pattern: solo i contorni del plus interno e di quello esterno',
			patternEl: $pattern && $pattern[0],
			transformEl: $transform && $transform[0],
			inputEl: $input && $input[0],
			// geometria target provvisoria (sopra l’input, ancora “larga”)
			hoverOnInput: true
		});

		if (!matchResult.matched) {
			steps.push({
				phase: 'structureFit',
				kind: 'fail',
				narrate: matchResult.msg || 'Il pattern non calza sull’input',
				inputEl: $input && $input[0]
			});
			steps.push({
				phase: 'transform',
				kind: 'fail',
				narrate: 'Nessun match: non si passa al transform'
			});
			return steps;
		}

		if (innerFit) {
			steps.push({
				phase: 'structureFit',
				kind: 'tightenInner',
				narrate:
					'1) Il plus interno si stringe attorno a un elemento dello stesso tipo',
				patternEl: innerFit.patternEl,
				inputEl: innerFit.inputEl,
				depth: innerFit.depth
			});
		}

		if (outerFit && outerFit !== innerFit) {
			steps.push({
				phase: 'structureFit',
				kind: 'tightenOuter',
				narrate: '2) Il plus esterno trova a sua volta un target adatto',
				patternEl: outerFit.patternEl,
				inputEl: outerFit.inputEl,
				depth: outerFit.depth
			});
		} else if (outerFit) {
			steps.push({
				phase: 'structureFit',
				kind: 'tightenOuter',
				narrate: '2) Il plus esterno trova a sua volta un target adatto',
				patternEl: outerFit.patternEl,
				inputEl: outerFit.inputEl,
				depth: outerFit.depth
			});
		}

		steps.push({
			phase: 'leaves',
			kind: 'revealLeaves',
			narrate:
				'3) Gli altri elementi del pattern tornano visibili e cercano un loro target',
			leafBinds: leafBinds,
			patternEl: $pattern && $pattern[0]
		});

		for (var L = 0; L < leafBinds.length; L++) {
			var leaf = leafBinds[L];
			var labels = (leaf.inputEls || [])
				.map(function (el) {
					return NewPM.enodeLabel ? NewPM.enodeLabel($(el)) : '?';
				})
				.join(', ');
			steps.push({
				phase: 'leaves',
				kind: 'leafBind',
				narrate: 'Si assegna a ' + leaf.paramName + ' ← ' + labels,
				paramName: leaf.paramName,
				patternEl: leaf.patternEl,
				inputEls: leaf.inputEls
			});
		}

		steps.push({
			phase: 'transform',
			kind: 'transformPending',
			narrate:
				'In caso di match, inizia poi la fase di transform (ancora da definire)',
			transformEl: $transform && $transform[0]
		});

		return steps;
	}

	NewPM.buildVisualScript = buildVisualScript;
})(typeof window !== 'undefined' ? window : globalThis);
