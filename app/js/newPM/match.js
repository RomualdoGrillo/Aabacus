/**
 * newPM — matching sperimentale con traccia + sostituzioni eager sul transform.
 * A ogni bind di parametro: replaceInForall sulla clone (pattern + II membro),
 * come adaptMatch / replaceInForall del PM originale.
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
			if (el && $(el).is('[data-enode]')) {
				name = ENODE_getName(el, true) || '';
			}
		} catch (e) {
			/* ignore */
		}
		return name ? kind + ':' + name : kind;
	}

	function getName($node) {
		try {
			return ENODE_getName($node[0], true) || '';
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

	function snapshotTaken($root) {
		return $root.filter('.' + TAKEN).add($root.find('.' + TAKEN)).toArray();
	}

	function restoreTaken($root, previousEls) {
		$root.removeClass(TAKEN);
		$root.find('.' + TAKEN).removeClass(TAKEN);
		$(previousEls).addClass(TAKEN);
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

	/** Snapshot distaccato della clone (per backtrack). */
	function snapshotCloneProp($cloneProp) {
		if (!$cloneProp || !$cloneProp.length || typeof ENODEclone !== 'function') {
			return null;
		}
		var $snap = ENODEclone($cloneProp, false, false);
		$snap.find('[data-enode]').addBack().addClass('PMclone');
		return $snap;
	}

	function discardCloneProp($prop) {
		if (!$prop || !$prop.length) return;
		if (typeof ENODEremove === 'function') {
			try {
				ENODEremove($prop);
				return;
			} catch (e) {
				/* fall through */
			}
		}
		$prop.remove();
	}

	/**
	 * Ripristina ctx.$cloneProp da uno snapshot e aggiorna $patternRoot.
	 */
	function restoreCloneProp(ctx, $snap) {
		if (!$snap || !$snap.length) return;
		if (ctx.$cloneProp && ctx.$cloneProp[0] !== $snap[0]) {
			discardCloneProp(ctx.$cloneProp);
		}
		ctx.$cloneProp = $snap;
		refreshPatternRoot(ctx);
	}

	function refreshPatternRoot(ctx) {
		if (!ctx.$cloneProp || !ctx.$cloneProp.length) {
			ctx.$patternRoot = $();
			return;
		}
		var mem =
			typeof NewPM.rereadCloneMembers === 'function'
				? NewPM.rereadCloneMembers(ctx.$cloneProp)
				: null;
		ctx.$patternRoot = mem && mem.$pattern.length ? mem.$pattern : ctx.$cloneProp;
	}

	function currentTransform(ctx) {
		if (!ctx.$cloneProp || !ctx.$cloneProp.length) return $();
		var mem =
			typeof NewPM.rereadCloneMembers === 'function'
				? NewPM.rereadCloneMembers(ctx.$cloneProp)
				: null;
		return mem && mem.$transform ? mem.$transform : $();
	}

	/** Snapshot distaccato del transform (per viz progressiva). */
	function snapshotTransform(ctx) {
		var $tf = currentTransform(ctx);
		if (!$tf || !$tf.length || typeof ENODEclone !== 'function') return null;
		var $snap = ENODEclone($tf, false, false);
		$snap.addClass('PMclone newPM-tf-snap');
		return $snap;
	}

	function leafBindRecord(ctx, fields) {
		var $tf = currentTransform(ctx);
		var rec = fields || {};
		rec.transformEl = $tf[0] || rec.transformEl;
		rec.$transformSnap = snapshotTransform(ctx);
		return rec;
	}

	/**
	 * Eager replace come adaptMatch: aggiorna tutta la clone (anche II membro).
	 * @returns {{ ok:boolean, $pattNode?:jQuery }}
	 */
	function eagerReplaceParam(ctx, $pattNode, $resList) {
		if (!ctx.$cloneProp || !ctx.$cloneProp.length) {
			return { ok: true, $pattNode: $pattNode };
		}
		if (typeof replaceInForall !== 'function') {
			ctx.log({
				kind: 'warn',
				narrate: 'replaceInForall assente: bind solo in memoria'
			});
			return { ok: true, $pattNode: $pattNode };
		}
		var $updated = replaceInForall($pattNode, $resList, ctx.$cloneProp);
		if ($updated && $updated.length) {
			ctx.$cloneProp = $updated;
		}
		refreshPatternRoot(ctx);
		var $tf = currentTransform(ctx);
		ctx.log({
			kind: 'replace',
			depth: ctx.depth,
			paramName: getName($pattNode),
			patternEl: $pattNode[0],
			transformEl: $tf[0],
			narrate:
				'Sostituzione eager in pattern+transform: ' +
				(getName($pattNode) || '?') +
				' ← ' +
				$resList
					.toArray()
					.map(function (el) {
						return enodeLabel($(el));
					})
					.join(', ')
		});
		return { ok: true, $pattNode: $pattNode, $transform: $tf };
	}

	function pathUnderPatternRoot(ctx, $node) {
		if (!ctx.$patternRoot || !ctx.$patternRoot.length) return null;
		if (typeof NewPM.indexPath === 'function') {
			return NewPM.indexPath(ctx.$patternRoot, $node);
		}
		return null;
	}

	function nodeUnderPatternRoot(ctx, path) {
		if (!ctx.$patternRoot || !ctx.$patternRoot.length) return $();
		if (typeof NewPM.nodeAtPath === 'function') {
			return NewPM.nodeAtPath(ctx.$patternRoot, path);
		}
		return $();
	}

	/**
	 * Sibling list fresca che contiene il nodo al path (stesso genitore).
	 */
	function freshPatternListAt(ctx, pathToNode) {
		refreshPatternRoot(ctx);
		if (!pathToNode || !pathToNode.length) {
			return ctx.$patternRoot;
		}
		var parentPath = pathToNode.slice(0, -1);
		var $parent =
			parentPath.length === 0
				? ctx.$patternRoot
				: nodeUnderPatternRoot(ctx, parentPath);
		if (!$parent.length) {
			return ctx.$patternRoot;
		}
		return ENODE_getChildren($parent[0]);
	}

	function matchTrees($Input, $Pattern, options) {
		options = options || {};
		var orderedList = !!options.orderedList;
		var depth = options.depth || 0;
		var logicalTrace = options.logicalTrace || [];
		var bindings = options.bindings || {};
		var structureFits = options.structureFits || [];
		var leafBinds = options.leafBinds || [];
		var $cloneProp = options.$cloneProp;
		var $patternRoot = options.$patternRoot;

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

		var ctx = {
			orderedList: orderedList,
			depth: depth,
			logicalTrace: logicalTrace,
			bindings: bindings,
			structureFits: structureFits,
			leafBinds: leafBinds,
			$cloneProp: $cloneProp,
			$patternRoot: $patternRoot,
			log: log
		};
		if ($cloneProp && $cloneProp.length && !$patternRoot) {
			refreshPatternRoot(ctx);
		}

		var result = matchPatternList($Input, $Pattern, 0, ctx);

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
			logicalTrace: logicalTrace,
			$cloneProp: ctx.$cloneProp
		};
	}

	function matchPatternList($Input, $Pattern, patternIndex, ctx) {
		if (patternIndex >= $Pattern.length) {
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

		// x_ oppure nodo strutturale
		var pathToPatt = pathUnderPatternRoot(ctx, $pattNode);
		var $frozenAtEntry =
			ctx.$cloneProp && ctx.$cloneProp.length
				? snapshotCloneProp(ctx.$cloneProp)
				: null;

		var candidates = untaken($Input).toArray();
		for (var i = 0; i < candidates.length; i++) {
			var $inNode = $(candidates[i]);

			if ($frozenAtEntry && pathToPatt) {
				restoreCloneProp(ctx, snapshotCloneProp($frozenAtEntry));
				// path fissato all’ingresso di questo patternIndex (già post-replace
				// dei list param precedenti), così gli indici restano coerenti.
				$pattNode = nodeUnderPatternRoot(ctx, pathToPatt);
				$Pattern = freshPatternListAt(ctx, pathToPatt);
				patternIndex =
					pathToPatt.length > 0
						? pathToPatt[pathToPatt.length - 1]
						: patternIndex;
				pattName = getName($pattNode) || pattName;
			}

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
			var $preNestedSnap = snapshotCloneProp(ctx.$cloneProp);

			if (!isParameter) {
				var $pattArg = ENODE_getChildren($pattNode[0]);
				var $inArg = ENODE_getChildren($inNode[0]);
				var childOrdered =
					ENODE_getRoles($inNode[0]).is('.ol_role') ||
					$pattNode.attr('data-nosort') === 'true' ||
					ctx.orderedList;
				if ($pattArg.length || $inArg.length) {
					var nested = matchTrees($inArg, $pattArg, {
						orderedList: childOrdered,
						depth: depth + 1,
						logicalTrace: ctx.logicalTrace,
						bindings: ctx.bindings,
						structureFits: ctx.structureFits,
						leafBinds: ctx.leafBinds,
						$cloneProp: ctx.$cloneProp,
						$patternRoot: ctx.$patternRoot
					});
					childOk = nested.matched;
					if (nested.$cloneProp) ctx.$cloneProp = nested.$cloneProp;
					refreshPatternRoot(ctx);
					if (!nested.matched) {
						restoreTaken($Input, snapTaken);
						ctx.structureFits.length = snapStruct;
						ctx.leafBinds.length = snapLeaf;
						restoreBindings(ctx.bindings, snapBindLens);
						if ($preNestedSnap) restoreCloneProp(ctx, $preNestedSnap);
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
				var $tfBefore = currentTransform(ctx);
				var $preReplaceSnap = snapshotCloneProp(ctx.$cloneProp);
				var rep = eagerReplaceParam(ctx, $pattNode, $inNode);
				var $tfAfter = rep.$transform || currentTransform(ctx);
				ctx.leafBinds.push(
					leafBindRecord(ctx, {
						paramName: pattName,
						paramType: parType,
						patternEl: $pattNode[0],
						inputEls: [$inNode[0]],
						depth: depth,
						transformEl: $tfAfter[0] || $tfBefore[0]
					})
				);
				ctx.log({
					kind: 'bind',
					depth: depth,
					role: 'leaf',
					paramName: pattName,
					patternEl: $pattNode[0],
					inputEl: $inNode[0],
					transformEl: $tfAfter[0],
					narrate:
						'Si assegna a ' + pattName + ' l’elemento ' + enodeLabel($inNode)
				});
				// Come adaptMatch: $Pattern resta la lista catturata; si avanza di 1
				// (i nodi già sostituiti restano riferimenti staccati; i successivi sono vivi).
				var rest = matchPatternList($Input, $Pattern, patternIndex + 1, ctx);
				if (rest.matched) {
					if ($frozenAtEntry) discardCloneProp($frozenAtEntry);
					if ($preNestedSnap) discardCloneProp($preNestedSnap);
					return rest;
				}
				restoreTaken($Input, snapTaken);
				ctx.structureFits.length = snapStruct;
				ctx.leafBinds.length = snapLeaf;
				restoreBindings(ctx.bindings, snapBindLens);
				if ($preReplaceSnap) restoreCloneProp(ctx, $preReplaceSnap);
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
				var restS = matchPatternList($Input, $Pattern, patternIndex + 1, ctx);
				if (restS.matched) {
					if ($frozenAtEntry) discardCloneProp($frozenAtEntry);
					if ($preNestedSnap) discardCloneProp($preNestedSnap);
					return restS;
				}
				restoreTaken($Input, snapTaken);
				ctx.structureFits.length = snapStruct;
				ctx.leafBinds.length = snapLeaf;
				restoreBindings(ctx.bindings, snapBindLens);
				if ($preNestedSnap) restoreCloneProp(ctx, $preNestedSnap);
			}

			if (ctx.orderedList) break;
		}

		if ($frozenAtEntry) {
			restoreCloneProp(ctx, $frozenAtEntry);
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
		var pathToPatt = pathUnderPatternRoot(ctx, $pattNode);
		var $frozen = snapshotCloneProp(ctx.$cloneProp);

		var $free = untaken($Input);
		var eligible = [];
		$free.each(function () {
			var $in = $(this);
			if (outerOk($in, $pattNode, true)) eligible.push($in[0]);
			else if (ctx.orderedList) return false;
		});

		var minNeed = parType === 'x___' ? 0 : 1;
		for (var count = minNeed; count <= eligible.length; count++) {
			var snapStruct = ctx.structureFits.length;
			var snapLeaf = ctx.leafBinds.length;
			var snapBindKeys = Object.keys(ctx.bindings);
			var snapBindLens = {};
			for (var bk = 0; bk < snapBindKeys.length; bk++) {
				snapBindLens[snapBindKeys[bk]] = ctx.bindings[snapBindKeys[bk]].length;
			}
			var snapTaken = snapshotTaken($Input);

			if ($frozen) {
				restoreCloneProp(ctx, snapshotCloneProp($frozen));
			}
			var $PatternFresh = freshPatternListAt(ctx, pathToPatt);
			var idx =
				pathToPatt && pathToPatt.length
					? pathToPatt[pathToPatt.length - 1]
					: patternIndex;
			$pattNode = $($PatternFresh[idx]);
			if (!$pattNode.length) $pattNode = nodeUnderPatternRoot(ctx, pathToPatt);
			pattName = getName($pattNode) || pattName;

			var slice = eligible.slice(0, count);
			var $grab = $(slice);
			markTaken($grab);
			if (!ctx.bindings[pattName]) ctx.bindings[pattName] = [];
			for (var i = 0; i < slice.length; i++) {
				ctx.bindings[pattName].push(slice[i]);
			}

			eagerReplaceParam(ctx, $pattNode, $grab);
			var $tf = currentTransform(ctx);
			ctx.leafBinds.push(
				leafBindRecord(ctx, {
					paramName: pattName,
					paramType: parType,
					patternEl: $pattNode[0],
					inputEls: slice.slice(),
					depth: ctx.depth,
					transformEl: $tf[0]
				})
			);
			ctx.log({
				kind: 'bind',
				depth: ctx.depth,
				role: 'leaf',
				paramName: pattName,
				patternEl: $pattNode[0],
				inputEl: slice[0],
				transformEl: $tf[0],
				narrate:
					'Prova: ' +
					pattName +
					' prende ' +
					slice.length +
					' pezzo/i (eager replace + resto)'
			});

			// sibling list fresca (post-restore); avanza di 1 come adaptMatch
			var rest = matchPatternList(
				$Input,
				$PatternFresh,
				idx + 1,
				ctx
			);
			if (rest.matched) {
				ctx.log({
					kind: 'bind',
					depth: ctx.depth,
					role: 'leaf',
					paramName: pattName,
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
				if ($frozen) discardCloneProp($frozen);
				return rest;
			}

			restoreTaken($Input, snapTaken);
			ctx.structureFits.length = snapStruct;
			ctx.leafBinds.length = snapLeaf;
			restoreBindings(ctx.bindings, snapBindLens);
		}

		if ($frozen) restoreCloneProp(ctx, $frozen);

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
		var $pattNode = $($Pattern[patternIndex]);
		var pathToPatt = pathUnderPatternRoot(ctx, $pattNode);
		markTaken($grab);
		if (!ctx.bindings[pattName]) ctx.bindings[pattName] = [];
		var els = $grab.toArray();
		for (var i = 0; i < els.length; i++) ctx.bindings[pattName].push(els[i]);

		eagerReplaceParam(ctx, $pattNode, $grab);
		var $tf = currentTransform(ctx);
		ctx.leafBinds.push(
			leafBindRecord(ctx, {
				paramName: pattName,
				paramType: parType,
				patternEl: $pattNode[0],
				inputEls: els.slice(),
				depth: ctx.depth,
				transformEl: $tf[0]
			})
		);
		ctx.log({
			kind: 'bind',
			depth: ctx.depth,
			role: 'leaf',
			paramName: pattName,
			patternEl: $pattNode[0],
			inputEl: els[0],
			transformEl: $tf[0],
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
		options = options || {};
		var $pattern = NewPM.resolveENODE(pattern);
		var $input = NewPM.resolveENODE(input);
		if (!$pattern.length) {
			return emptyFail($pattern, $input, 'pattern vuoto o non risolto');
		}
		if (!$input.length) {
			return emptyFail($pattern, $input, 'input vuoto o non risolto');
		}

		var $cloneProp = options.$cloneProp;
		var result = matchTrees($input, $pattern, {
			orderedList: options.orderedList,
			logicalTrace: [],
			bindings: {},
			structureFits: [],
			leafBinds: [],
			$cloneProp: $cloneProp,
			$patternRoot: $pattern
		});
		result.$pattern = $pattern;
		result.$input = $input;
		if (result.$cloneProp) {
			var mem =
				typeof NewPM.rereadCloneMembers === 'function'
					? NewPM.rereadCloneMembers(result.$cloneProp)
					: null;
			if (mem) {
				result.$pattern = mem.$pattern.length ? mem.$pattern : $pattern;
				result.$transform = mem.$transform;
			}
		}
		result.trace = result.logicalTrace;
		return result;
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
	NewPM.discardCloneProp = discardCloneProp;
	NewPM.currentTransformFromClone = function ($cloneProp) {
		return currentTransform({ $cloneProp: $cloneProp });
	};
})(typeof window !== 'undefined' ? window : globalThis);
