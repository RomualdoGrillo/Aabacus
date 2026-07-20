/**
 * newPM — motore di matching sperimentale con traccia step-by-step.
 * Non sostituisce adaptMatch in PMTutilities.js; riusa solo helper ENODE già globali
 * (compareExtENODE, ParameterNameToType) quando presenti.
 */
(function (global) {
	'use strict';

	var NewPM = global.NewPM || (global.NewPM = {});

	function paramTypeFromName(name) {
		if (typeof ParameterNameToType === 'function') {
			return ParameterNameToType(name);
		}
		if (!name) return 'x';
		if (name.slice(-3) === '___') return 'x___';
		if (name.slice(-2) === '__') return 'x__';
		if (name.slice(-1) === '_') return 'x_';
		return 'x';
	}

	function enodeLabel($node) {
		if (!$node || !$node.length) return '?';
		var el = $node[0];
		var kind = $node.attr('data-enode') || '?';
		var name = '';
		try {
			if (el && typeof el.ENODE_getName === 'function') {
				name = el.ENODE_getName(true) || '';
			}
		} catch (e) { /* ignore */ }
		return name ? kind + ':' + name : kind;
	}

	function pushStep(trace, step) {
		trace.push(step);
		return step;
	}

	/**
	 * Matching ricorsivo ispirato ad adaptMatch, con emissione trace.
	 * @param {jQuery} $Input — collezione di nodi input (fratelli)
	 * @param {jQuery} $Pattern — collezione di nodi pattern (fratelli)
	 * @param {object} options
	 * @returns {{ matched: boolean, msg: string, bindings: object, trace: array }}
	 */
	function matchTrees($Input, $Pattern, options) {
		options = options || {};
		var orderedList = !!options.orderedList;
		var depth = options.depth || 0;
		var trace = options.trace || [];
		var bindings = options.bindings || {};
		var takenClass = 'newPM-taken';

		var matched = true;
		var msg = '';
		var patternIndex = 0;
		var currPattMatch = true;

		pushStep(trace, {
			kind: 'enter',
			depth: depth,
			narrate:
				depth === 0
					? 'Provo a indossare il pattern sull’input'
					: 'Entro nel sottoalbero (ricorsione)',
			patternLabel: enodeLabel($Pattern.first()),
			inputLabel: enodeLabel($Input.first())
		});

		while ($Pattern[patternIndex] != null) {
			var $pattNode = $($Pattern[patternIndex]);
			var pattName = '';
			try {
				pattName = $pattNode[0].ENODE_getName(true) || '';
			} catch (e) {
				pattName = '';
			}
			var parType = paramTypeFromName(pattName);
			var isParameter =
				parType === 'x_' || parType === 'x__' || parType === 'x___';
			var $resList = $();
			var inputIndex = 0;

			pushStep(trace, {
				kind: 'need',
				depth: depth,
				paramName: pattName,
				paramType: parType,
				isParameter: isParameter,
				patternEl: $pattNode[0],
				narrate: isParameter
					? 'Cerco un pezzo che calzi il parametro ' + pattName
					: 'Cerco un pezzo strutturale uguale a ' + enodeLabel($pattNode)
			});

			while ($Input[inputIndex] != null) {
				var $inNode = $($Input[inputIndex]);
				if ($inNode.hasClass(takenClass)) {
					inputIndex++;
					continue;
				}

				pushStep(trace, {
					kind: 'try',
					depth: depth,
					paramName: pattName,
					paramType: parType,
					patternEl: $pattNode[0],
					inputEl: $inNode[0],
					narrate:
						'Provo a infilare ' +
						enodeLabel($inNode) +
						(isParameter ? ' in ' + pattName : ' sul pattern')
				});

				var outerOk = false;
				if (typeof compareExtENODE === 'function') {
					outerOk = compareExtENODE($inNode, $pattNode, !isParameter, true);
				} else {
					outerOk =
						$inNode.attr('data-enode') === $pattNode.attr('data-enode') ||
						isParameter;
				}

				var currInputMatch = false;
				if (outerOk) {
					if (isParameter) {
						currInputMatch = true;
					} else {
						var $pattArg = $pattNode[0].ENODE_getChildren();
						var $inArg = $inNode[0].ENODE_getChildren();
						var childOrdered =
							$inNode[0].ENODE_getRoles().is('.ol_role') ||
							$pattNode.attr('data-nosort') === 'true' ||
							orderedList;
						if ($pattArg.length === 0 && $inArg.length === 0) {
							currInputMatch = true;
						} else {
							var childRes = matchTrees($inArg, $pattArg, {
								orderedList: childOrdered,
								depth: depth + 1,
								trace: trace,
								bindings: bindings
							});
							currInputMatch = childRes.matched;
							if (!childRes.matched && childRes.msg) {
								msg = childRes.msg;
							}
						}
					}
				}

				if (currInputMatch) {
					$inNode.addClass(takenClass);
					$resList = $resList.add($inNode);
					pushStep(trace, {
						kind: 'bind',
						depth: depth,
						paramName: pattName,
						paramType: parType,
						isParameter: isParameter,
						patternEl: $pattNode[0],
						inputEl: $inNode[0],
						narrate: isParameter
							? 'Si assegna al parametro ' +
								pattName +
								' l’elemento ' +
								enodeLabel($inNode) +
								' (calza)'
							: enodeLabel($inNode) + ' calza sul pattern'
					});
					if (isParameter) {
						if (!bindings[pattName]) bindings[pattName] = [];
						bindings[pattName].push($inNode[0]);
					}
					if (parType === 'x' || parType === 'x_') {
						break;
					}
				} else {
					pushStep(trace, {
						kind: 'reject',
						depth: depth,
						paramName: pattName,
						paramType: parType,
						patternEl: $pattNode[0],
						inputEl: $inNode[0],
						narrate:
							enodeLabel($inNode) +
							' non calza' +
							(isParameter ? ' in ' + pattName : '')
					});
				}

				if (orderedList) {
					break;
				}
				inputIndex++;
			}

			if (parType === 'x___' || $resList.length > 0) {
				currPattMatch = true;
				patternIndex++;
			} else {
				currPattMatch = false;
				msg = 'alcuni pattern non hanno trovato input richiesti';
				pushStep(trace, {
					kind: 'fail',
					depth: depth,
					paramName: pattName,
					narrate: 'Il pezzo ' + pattName + ' del pattern non calza a nulla',
					msg: msg
				});
				break;
			}
		}

		if (currPattMatch) {
			var leftover = $Input.filter(':not(.' + takenClass + ')');
			if (leftover.length !== 0) {
				matched = false;
				msg = 'sono avanzati degli input, no match';
				pushStep(trace, {
					kind: 'fail',
					depth: depth,
					narrate: 'Restano pezzi fuori dal maglione: non calza',
					msg: msg,
					inputEl: leftover[0]
				});
			} else {
				matched = true;
				if (depth === 0) {
					pushStep(trace, {
						kind: 'done',
						depth: depth,
						narrate: 'Il pattern calza: matching riuscito'
					});
				}
			}
		} else {
			matched = false;
			if (!msg) msg = 'alcuni pattern non hanno trovato input richiesti';
		}

		$Input.removeClass(takenClass);

		return {
			matched: matched,
			msg: msg,
			bindings: bindings,
			trace: trace
		};
	}

	/**
	 * Confronta due radici ENODE (o collezioni di fratelli).
	 */
	function runMatch(pattern, input, options) {
		var $pattern = NewPM.resolveENODE(pattern);
		var $input = NewPM.resolveENODE(input);
		if (!$pattern.length) {
			return {
				matched: false,
				msg: 'pattern vuoto o non risolto',
				bindings: {},
				trace: [],
				$pattern: $pattern,
				$input: $input
			};
		}
		if (!$input.length) {
			return {
				matched: false,
				msg: 'input vuoto o non risolto',
				bindings: {},
				trace: [],
				$pattern: $pattern,
				$input: $input
			};
		}

		var result = matchTrees($input, $pattern, {
			orderedList: options && options.orderedList,
			trace: [],
			bindings: {}
		});
		result.$pattern = $pattern;
		result.$input = $input;
		return result;
	}

	NewPM.matchTrees = matchTrees;
	NewPM.runMatch = runMatch;
	NewPM.enodeLabel = enodeLabel;
})(typeof window !== 'undefined' ? window : globalThis);
