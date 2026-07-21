/**
 * newPM — script visuale allineato allo storyboard PDF:
 *   dragStart → dragGhost → structureFit → leaves → transform
 */
(function (global) {
	'use strict';

	var NewPM = global.NewPM || (global.NewPM = {});

	function opOf(el) {
		if (!el) return '';
		return (el.getAttribute && el.getAttribute('data-enode')) || '';
	}

	function opWord(op) {
		var map = {
			plus: 'somma',
			times: 'moltiplicazione',
			power: 'potenza',
			minus: 'sottrazione',
			eq: 'equazione',
			and: 'congiunzione',
			or: 'disgiunzione',
			implies: 'implicazione',
			ci: 'variabile',
			cn: 'numero'
		};
		return map[op] || op || 'nodo';
	}

	function buildVisualScript(matchResult) {
		var steps = [];
		var $pattern = matchResult.$pattern;
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

		var patternEl = $pattern && $pattern[0];
		var outerOp = opOf(patternEl);
		var innerOp =
			(innerFit && (innerFit.op || opOf(innerFit.patternEl))) ||
			(NewPM.deepestCompoundOp &&
				opOf(NewPM.deepestCompoundOp(patternEl))) ||
			'';
		if (innerOp === outerOp && structureFits.length < 2) {
			// un solo livello strutturale: il badge interno ripete solo se c’è un figlio composto diverso
			var deepEl =
				NewPM.deepestCompoundOp && NewPM.deepestCompoundOp(patternEl);
			if (deepEl && deepEl !== patternEl) {
				innerOp = opOf(deepEl);
			}
		}

		steps.push({
			phase: 'dragStart',
			kind: 'dragStart',
			narrate:
				'Identikit del pattern: ' +
				opWord(outerOp) +
				(innerOp && innerOp !== outerOp
					? ' con ' + opWord(innerOp) + ' dentro'
					: '') +
				(depth != null ? ' — depth ' + depth : ''),
			patternEl: patternEl,
			transformEl: $transform && $transform[0],
			inputEl: $input && $input[0],
			attackEl: attackEl,
			dropEl: dropEl,
			outerOp: outerOp,
			innerOp: innerOp
		});

		steps.push({
			phase: 'dragGhost',
			kind: 'dragGhost',
			narrate:
				'Si prova a infilare l’identikit sull’operando' +
				(dropEl && $input && dropEl !== $input[0]
					? ' (risalito dal target)'
					: ''),
			patternEl: patternEl,
			transformEl: $transform && $transform[0],
			inputEl: $input && $input[0],
			hoverOnInput: true,
			outerOp: outerOp,
			innerOp: innerOp
		});

		if (!matchResult.matched) {
			steps.push({
				phase: 'structureFit',
				kind: 'fail',
				narrate: matchResult.msg || 'Il pattern non calza sull’operando',
				inputEl: $input && $input[0],
				outcome: 'fail'
			});
			steps.push({
				phase: 'transform',
				kind: 'fail',
				narrate: 'Nessun match: non si passa al transform',
				outcome: 'fail'
			});
			return steps;
		}

		if (innerFit && outerFit && innerFit !== outerFit) {
			var iOp = innerFit.op || opOf(innerFit.patternEl);
			steps.push({
				phase: 'structureFit',
				kind: 'tightenInner',
				narrate:
					'1) La ' +
					opWord(iOp) +
					' interna si stringe su un pezzo dello stesso tipo',
				patternEl: innerFit.patternEl,
				inputEl: innerFit.inputEl,
				depth: innerFit.depth,
				op: iOp,
				outcome: 'ok'
			});
		}

		if (outerFit) {
			var oOp = outerFit.op || opOf(outerFit.patternEl);
			var outerNarr =
				innerFit && innerFit !== outerFit
					? '2) La ' +
						opWord(oOp) +
						' esterna trova a sua volta un target adatto'
					: 'La ' +
						opWord(oOp) +
						' del pattern si stringe su un pezzo dello stesso tipo';
			steps.push({
				phase: 'structureFit',
				kind: 'tightenOuter',
				narrate: outerNarr,
				patternEl: outerFit.patternEl,
				inputEl: outerFit.inputEl,
				depth: outerFit.depth,
				op: oOp,
				outcome: 'ok'
			});
		}

		steps.push({
			phase: 'leaves',
			kind: 'revealLeaves',
			narrate:
				'3) Gli altri elementi del pattern tornano visibili e cercano un loro target',
			leafBinds: leafBinds,
			patternEl: patternEl
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
				narrate: 'Match: ' + leaf.paramName + ' ← ' + labels,
				paramName: leaf.paramName,
				patternEl: leaf.patternEl,
				inputEls: leaf.inputEls,
				outcome: 'ok'
			});
		}

		steps.push({
			phase: 'transform',
			kind: 'transformPending',
			narrate:
				'Match completo: poi seguirà la fase di transform (ancora da definire)',
			transformEl: $transform && $transform[0],
			outcome: 'ok'
		});

		return steps;
	}

	NewPM.buildVisualScript = buildVisualScript;
	NewPM.opWord = opWord;
})(typeof window !== 'undefined' ? window : globalThis);
