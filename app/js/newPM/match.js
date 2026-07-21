/**
 * newPM — matching sperimentale con traccia logica + binding annotati.
 * Allineato allo schema "Pattern Matching Visualization":
 *   scheletro (plus) → fit strutturale (interno→esterno) → foglie (a__, b_, …).
 * Non modifica PMTutilities.js.
 */
(function (global) {
	'use strict';

	var NewPM = global.NewPM || (global.NewPM = {});
	var TAKEN = 'newPM-taken';

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

	function getName($node) {
		try {
			return $node[0].ENODE_getName(true) || '';
		} catch (e) {
			return '';
		}
	}

	function isListParam(parType) {
		return parType === 'x__' || parType === 'x___';
	}

	function isParameterType(parType) {
		return parType === 'x_' || parType === 'x__' || parType === 'x___';
	}

	function outerOk($inNode, $pattNode, isParameter) {
		if (typeof compareExtENODE === 'function') {
			return compareExtENODE($inNode, $pattNode, !isParameter, true);
		}
		return (
			isParameter ||
			$inNode.attr('data-enode') === $pattNode.attr('data-enode')
		);
	}

	function untaken($Input) {
		return $Input.filter(function () {
			return !$(this).hasClass(TAKEN);
		});
	}

	function markTaken($nodes) {
		$nodes.addClass(TAKEN);
	}

	function unmarkTaken($nodes) {
		$nodes.removeClass(TAKEN);
	}

	/** Snapshot di tutti i nodi .taken sotto $root (incluso root). */
	function snapshotTaken($root) {
		return $root.filter('.' + TAKEN).add($root.find('.' + TAKEN)).toArray();
	}

	function restoreTaken($root, previousEls) {
		$root.removeClass(TAKEN);
		$root.find('.' + TAKEN).removeClass(TAKEN);
		$(previousEls).addClass(TAKEN);
	}

	/**
	 * @returns {{ matched, msg, bindings, structureFits, leafBinds, logicalTrace }}
	 */
	function matchTrees($Input, $Pattern, options) {
		options = options || {};
		var orderedList = !!options.orderedList;
		var depth = options.depth || 0;
		var logicalTrace = options.logicalTrace || [];
		var bindings = options.bindings || {};
		var structureFits = options.structureFits || [];
		var leafBinds = options.leafBinds || [];

		function log(step) {
			logicalTrace.push(step);
		}

		log({
			kind: 'enter',
			depth: depth,
			narrate:
				depth === 0
					? 'Provo a indossare il pattern sull’input'
					: 'Entro nel sottoalbero'
		});

		var result = matchPatternList($Input, $Pattern, 0, {
			orderedList: orderedList,
			depth: depth,
			logicalTrace: logicalTrace,
			bindings: bindings,
			structureFits: structureFits,
			leafBinds: leafBinds,
			log: log
		});

		if (result.matched) {
			var leftover = untaken($Input);
			if (leftover.length) {
				result.matched = false;
				result.msg = 'sono avanzati degli input, no match';
				log({
					kind: 'fail',
					depth: depth,
					narrate: 'Restano pezzi fuori dal maglione',
					msg: result.msg,
					inputEl: leftover[0]
				});
			} else if (depth === 0) {
				log({
					kind: 'done',
					depth: 0,
					narrate: 'Il pattern calza: matching riuscito'
				});
			}
		}

		if (depth === 0) {
			$Input.removeClass(TAKEN);
			$Input.find('.' + TAKEN).removeClass(TAKEN);
		}

		return {
			matched: result.matched,
			msg: result.msg || '',
			bindings: bindings,
			structureFits: structureFits,
			leafBinds: leafBinds,
			logicalTrace: logicalTrace
		};
	}

	/**
	 * Match dei fratelli del pattern a partire da patternIndex.
	 * Per x__/x___ con fratelli successivi: prova lunghezze crescenti (non-greedy + backtrack).
	 */
	function matchPatternList($Input, $Pattern, patternIndex, ctx) {
		if (patternIndex >= $Pattern.length) {
			// Importante per il backtrack di a__: il "successo" vale solo se non avanzano input.
			var left = untaken($Input);
			if (left.length) {
				ctx.log({
					kind: 'fail',
					depth: ctx.depth,
					narrate: 'Restano pezzi fuori dal maglione',
					msg: 'sono avanzati degli input, no match',
					inputEl: left[0]
				});
				return {
					matched: false,
					msg: 'sono avanzati degli input, no match'
				};
			}
			return { matched: true, msg: '' };
		}

		var $pattNode = $($Pattern[patternIndex]);
		var pattName = getName($pattNode);
		var parType = paramTypeFromName(pattName);
		var isParameter = isParameterType(parType);
		var depth = ctx.depth;
		var hasLater = patternIndex < $Pattern.length - 1;

		ctx.log({
			kind: 'need',
			depth: depth,
			paramName: pattName,
			paramType: parType,
			isParameter: isParameter,
			patternEl: $pattNode[0],
			narrate: isParameter
				? 'Cerco pezzi che calzino ' + pattName
				: 'Cerco struttura uguale a ' + enodeLabel($pattNode)
		});

		if (isListParam(parType) && hasLater) {
			return matchListParamWithBacktrack(
				$Input,
				$Pattern,
				patternIndex,
				ctx,
				pattName,
				parType
			);
		}

		if (isListParam(parType) && !hasLater) {
			// ultimo pattern: prendi tutto ciò che calza (greedy)
			var $grab = $();
			untaken($Input).each(function () {
				var $in = $(this);
				if (outerOk($in, $pattNode, true)) {
					$grab = $grab.add($in);
				} else if (ctx.orderedList) {
					return false;
				}
			});
			var minNeed = parType === 'x___' ? 0 : 1;
			if ($grab.length < minNeed) {
				ctx.log({
					kind: 'fail',
					depth: depth,
					paramName: pattName,
					patternEl: $pattNode[0],
					narrate: pattName + ' non trova abbastanza pezzi',
					msg: 'alcuni pattern non hanno trovato input richiesti'
				});
				return {
					matched: false,
					msg: 'alcuni pattern non hanno trovato input richiesti'
				};
			}
			return commitParamBind(
				$Input,
				$Pattern,
				patternIndex,
				ctx,
				pattName,
				parType,
				$grab
			);
		}

		// x_ oppure nodo strutturale: prova candidati uno alla volta (con backtrack)
		var candidates = untaken($Input).toArray();
		for (var i = 0; i < candidates.length; i++) {
			var $inNode = $(candidates[i]);
			ctx.log({
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

			if (!outerOk($inNode, $pattNode, isParameter)) {
				ctx.log({
					kind: 'reject',
					depth: depth,
					patternEl: $pattNode[0],
					inputEl: $inNode[0],
					narrate: enodeLabel($inNode) + ' non calza'
				});
				if (ctx.orderedList) break;
				continue;
			}

			var childOk = true;
			var snapStruct = ctx.structureFits.length;
			var snapLeaf = ctx.leafBinds.length;
			var snapBindKeys = Object.keys(ctx.bindings);
			var snapBindLens = {};
			for (var bk = 0; bk < snapBindKeys.length; bk++) {
				snapBindLens[snapBindKeys[bk]] = ctx.bindings[snapBindKeys[bk]].length;
			}
			var snapTaken = snapshotTaken($Input);

			if (!isParameter) {
				var $pattArg = $pattNode[0].ENODE_getChildren();
				var $inArg = $inNode[0].ENODE_getChildren();
				var childOrdered =
					$inNode[0].ENODE_getRoles().is('.ol_role') ||
					$pattNode.attr('data-nosort') === 'true' ||
					ctx.orderedList;
				if ($pattArg.length || $inArg.length) {
					var nested = matchTrees($inArg, $pattArg, {
						orderedList: childOrdered,
						depth: depth + 1,
						logicalTrace: ctx.logicalTrace,
						bindings: ctx.bindings,
						structureFits: ctx.structureFits,
						leafBinds: ctx.leafBinds
					});
					childOk = nested.matched;
					if (!nested.matched) {
						restoreTaken($Input, snapTaken);
						ctx.structureFits.length = snapStruct;
						ctx.leafBinds.length = snapLeaf;
						restoreBindings(ctx.bindings, snapBindLens);
					}
				}
			}

			if (!childOk) {
				ctx.log({
					kind: 'reject',
					depth: depth,
					patternEl: $pattNode[0],
					inputEl: $inNode[0],
					narrate: enodeLabel($inNode) + ' non calza (interno)'
				});
				if (ctx.orderedList) break;
				continue;
			}

			markTaken($inNode);
			if (isParameter) {
				if (!ctx.bindings[pattName]) ctx.bindings[pattName] = [];
				ctx.bindings[pattName].push($inNode[0]);
				ctx.leafBinds.push({
					paramName: pattName,
					paramType: parType,
					patternEl: $pattNode[0],
					inputEls: [$inNode[0]],
					depth: depth
				});
				ctx.log({
					kind: 'bind',
					depth: depth,
					role: 'leaf',
					paramName: pattName,
					patternEl: $pattNode[0],
					inputEl: $inNode[0],
					narrate:
						'Si assegna a ' + pattName + ' l’elemento ' + enodeLabel($inNode)
				});
			} else {
				ctx.structureFits.push({
					patternEl: $pattNode[0],
					inputEl: $inNode[0],
					depth: depth,
					op: $pattNode.attr('data-enode') || '',
					label: enodeLabel($pattNode)
				});
				ctx.log({
					kind: 'bind',
					depth: depth,
					role: 'structure',
					patternEl: $pattNode[0],
					inputEl: $inNode[0],
					narrate: enodeLabel($pattNode) + ' si stringe su ' + enodeLabel($inNode)
				});
			}

			var rest = matchPatternList($Input, $Pattern, patternIndex + 1, ctx);
			if (rest.matched) {
				return rest;
			}

			restoreTaken($Input, snapTaken);
			ctx.structureFits.length = snapStruct;
			ctx.leafBinds.length = snapLeaf;
			restoreBindings(ctx.bindings, snapBindLens);

			if (ctx.orderedList) break;
		}

		ctx.log({
			kind: 'fail',
			depth: depth,
			paramName: pattName,
			patternEl: $pattNode[0],
			narrate: 'Nessun target adatto per ' + (pattName || enodeLabel($pattNode)),
			msg: 'alcuni pattern non hanno trovato input richiesti'
		});
		return {
			matched: false,
			msg: 'alcuni pattern non hanno trovato input richiesti'
		};
	}

	function matchListParamWithBacktrack(
		$Input,
		$Pattern,
		patternIndex,
		ctx,
		pattName,
		parType
	) {
		var $pattNode = $($Pattern[patternIndex]);
		var $free = untaken($Input);
		var eligible = [];
		$free.each(function () {
			var $in = $(this);
			if (outerOk($in, $pattNode, true)) eligible.push($in[0]);
			else if (ctx.orderedList) return false;
		});

		var minNeed = parType === 'x___' ? 0 : 1;
		// non-greedy: da min a max
		for (var count = minNeed; count <= eligible.length; count++) {
			var snapStruct = ctx.structureFits.length;
			var snapLeaf = ctx.leafBinds.length;
			var snapBindKeys = Object.keys(ctx.bindings);
			var snapBindLens = {};
			for (var bk = 0; bk < snapBindKeys.length; bk++) {
				snapBindLens[snapBindKeys[bk]] = ctx.bindings[snapBindKeys[bk]].length;
			}
			var snapTaken = snapshotTaken($Input);

			var slice = eligible.slice(0, count);
			var $grab = $(slice);
			markTaken($grab);
			if (!ctx.bindings[pattName]) ctx.bindings[pattName] = [];
			for (var i = 0; i < slice.length; i++) {
				ctx.bindings[pattName].push(slice[i]);
			}
			ctx.leafBinds.push({
				paramName: pattName,
				paramType: parType,
				patternEl: $pattNode[0],
				inputEls: slice.slice(),
				depth: ctx.depth
			});
			ctx.log({
				kind: 'bind',
				depth: ctx.depth,
				role: 'leaf',
				paramName: pattName,
				patternEl: $pattNode[0],
				inputEl: slice[0],
				narrate:
					'Prova: ' +
					pattName +
					' prende ' +
					slice.length +
					' pezzo/i (poi verifico il resto)'
			});

			var rest = matchPatternList($Input, $Pattern, patternIndex + 1, ctx);
			if (rest.matched) {
				ctx.log({
					kind: 'bind',
					depth: ctx.depth,
					role: 'leaf',
					paramName: pattName,
					patternEl: $pattNode[0],
					inputEl: slice[0],
					narrate:
						'Confermato: ' +
						pattName +
						' ← ' +
						slice
							.map(function (el) {
								return enodeLabel($(el));
							})
							.join(', ')
				});
				return rest;
			}

			restoreTaken($Input, snapTaken);
			ctx.structureFits.length = snapStruct;
			ctx.leafBinds.length = snapLeaf;
			restoreBindings(ctx.bindings, snapBindLens);
		}

		ctx.log({
			kind: 'fail',
			depth: ctx.depth,
			paramName: pattName,
			patternEl: $pattNode[0],
			narrate: pattName + ' non trova una taglia che lasci spazio al resto',
			msg: 'alcuni pattern non hanno trovato input richiesti'
		});
		return {
			matched: false,
			msg: 'alcuni pattern non hanno trovato input richiesti'
		};
	}

	function commitParamBind(
		$Input,
		$Pattern,
		patternIndex,
		ctx,
		pattName,
		parType,
		$grab
	) {
		markTaken($grab);
		if (!ctx.bindings[pattName]) ctx.bindings[pattName] = [];
		var els = $grab.toArray();
		for (var i = 0; i < els.length; i++) ctx.bindings[pattName].push(els[i]);
		ctx.leafBinds.push({
			paramName: pattName,
			paramType: parType,
			patternEl: $($Pattern[patternIndex])[0],
			inputEls: els.slice(),
			depth: ctx.depth
		});
		ctx.log({
			kind: 'bind',
			depth: ctx.depth,
			role: 'leaf',
			paramName: pattName,
			patternEl: $($Pattern[patternIndex])[0],
			inputEl: els[0],
			narrate:
				'Si assegna a ' +
				pattName +
				': ' +
				els
					.map(function (el) {
						return enodeLabel($(el));
					})
					.join(', ')
		});
		return matchPatternList($Input, $Pattern, patternIndex + 1, ctx);
	}

	function runMatch(pattern, input, options) {
		var $pattern = NewPM.resolveENODE(pattern);
		var $input = NewPM.resolveENODE(input);
		if (!$pattern.length) {
			return emptyFail($pattern, $input, 'pattern vuoto o non risolto');
		}
		if (!$input.length) {
			return emptyFail($pattern, $input, 'input vuoto o non risolto');
		}

		var result = matchTrees($input, $pattern, {
			orderedList: options && options.orderedList,
			logicalTrace: [],
			bindings: {},
			structureFits: [],
			leafBinds: []
		});
		result.$pattern = $pattern;
		result.$input = $input;
		result.trace = result.logicalTrace;
		return result;
	}

	function restoreBindings(bindings, snapBindLens) {
		var keys = Object.keys(bindings);
		for (var i = 0; i < keys.length; i++) {
			var k = keys[i];
			if (snapBindLens[k] == null) {
				delete bindings[k];
			} else {
				bindings[k].length = snapBindLens[k];
				if (!bindings[k].length) delete bindings[k];
			}
		}
	}

	function emptyFail($pattern, $input, msg) {
		return {
			matched: false,
			msg: msg,
			bindings: {},
			structureFits: [],
			leafBinds: [],
			logicalTrace: [],
			trace: [],
			$pattern: $pattern,
			$input: $input
		};
	}

	NewPM.matchTrees = matchTrees;
	NewPM.runMatch = runMatch;
	NewPM.enodeLabel = enodeLabel;
})(typeof window !== 'undefined' ? window : globalThis);
