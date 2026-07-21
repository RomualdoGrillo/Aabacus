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
		// operando dopo risalita autoAdapt (preferito rispetto al drop grezzo)
		var $input = matchResult.$operand || matchResult.$input;
		var $transform = matchResult.$transform;
		var structureFits = (matchResult.structureFits || []).slice();
		var leafBinds = matchResult.leafBinds || [];
		var depth = matchResult.patternDepth;
		var attackEl =
			matchResult.$attackInPattern && matchResult.$attackInPattern[0];
		var dropEl = matchResult.$dropTarget && matchResult.$dropTarget[0];

		structureFits.sort(function (a, b) {
			return b.depth - a.depth;
		});

		var innerFit = structureFits[0] || null;
		var outerFit = structureFits[structureFits.length - 1] || null;

		steps.push({
			phase: 'dragStart',
			kind: 'dragStart',
			narrate:
				'L’utente trascina un elemento nel pattern' +
				(attackEl ? ' (attack point)' : '') +
				(depth != null ? ' — depth ' + depth : ''),
			patternEl: $pattern && $pattern[0],
			transformEl: $transform && $transform[0],
			inputEl: $input && $input[0],
			attackEl: attackEl,
			dropEl: dropEl
		});

		steps.push({
			phase: 'dragGhost',
			kind: 'dragGhost',
			narrate:
				'Versione semplificata del pattern: solo i contorni del plus interno e di quello esterno' +
				(dropEl && $input && dropEl !== $input[0]
					? ' (operando risalito dal target)'
					: ''),
			patternEl: $pattern && $pattern[0],
			transformEl: $transform && $transform[0],
			inputEl: $input && $input[0],
			hoverOnInput: true
		});

		if (!matchResult.matched) {
			steps.push({
				phase: 'structureFit',
				kind: 'fail',
				narrate: matchResult.msg || 'Il pattern non calza sull’operando',
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
