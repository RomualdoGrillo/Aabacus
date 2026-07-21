/**
 * newPM — risoluzione dragged+target come autoAdapt:
 * forAll, ltr/rtl, attack mark "s", levelsToAncestor, risalita operando.
 * Poi clone della proprietà (swapMembersClone) per sostituzioni eager sul transform.
 */
(function (global) {
	'use strict';

	var NewPM = global.NewPM || (global.NewPM = {});

	function levelsToAncestorLocal($marked, $patternMember) {
		if (typeof levelsToAncestor === 'function') {
			return levelsToAncestor($marked, $patternMember);
		}
		if (!$marked || !$marked.length || !$patternMember || !$patternMember.length) {
			return NaN;
		}
		if ($marked.is($patternMember)) return 0;
		if ($marked.parents('[data-enode]').filter($patternMember).length === 0) {
			return NaN;
		}
		return $marked.parentsUntil($patternMember, '[data-enode]').length + 1;
	}

	/** Legge marcatura permanente (title) o volatile (mark), parte "m". */
	function readMarkM($el) {
		if (!$el || !$el.length) return '';
		if (typeof ENODESmarkUnmark === 'function') {
			var perm = ENODESmarkUnmark($el, undefined, 'm', true);
			if (perm) return perm;
			return ENODESmarkUnmark($el, undefined, 'm', false) || '';
		}
		var title = $el.attr('title') || '';
		var vol = $el.attr('mark') || '';
		var raw = title || vol;
		return raw.split('-')[0] || '';
	}

	function findMarkedSInSubtree($root) {
		if (!$root || !$root.length) return $();
		var $nodes = $root.add($root.find('[data-enode]'));
		return $nodes.filter(function () {
			var m = readMarkM($(this));
			return m.indexOf('s') !== -1;
		}).first();
	}

	function getEqFromForAll($forAll) {
		var $content;
		if (typeof GetforAllContentRole === 'function') {
			$content = GetforAllContentRole($forAll).children();
		} else {
			$content = $forAll[0].ENODE_getChildren();
		}
		var $eq = $content.filter('[data-enode=eq]').first();
		if (!$eq.length) $eq = $content.first();
		return $eq;
	}

	/** Equazione + pattern/transform da una prop (live o clone), già orientata. */
	function membersFromProp($prop, direction) {
		var $eq;
		if ($prop.attr('data-enode') === 'forAll') {
			$eq = getEqFromForAll($prop);
		} else if ($prop.attr('data-enode') === 'eq') {
			$eq = $prop;
		} else {
			$eq = $prop.find('[data-enode=eq]').first();
			if (!$eq.length) $eq = $prop;
		}
		if (!$eq.length || $eq.attr('data-enode') !== 'eq') {
			return null;
		}
		var $first = $eq[0].ENODE_getRoles('.firstMember').children().first();
		var $second = $eq[0].ENODE_getRoles('.secondMember').children().first();
		var $pattern = direction === 'ltr' ? $first : $second;
		var $transform = direction === 'ltr' ? $second : $first;
		return {
			$equation: $eq,
			$pattern: $pattern,
			$transform: $transform
		};
	}

	/**
	 * Path di indici ENODE_getChildren da $root a $node (incluso se root===node → []).
	 */
	function indexPath($root, $node) {
		if (!$root || !$root.length || !$node || !$node.length) return null;
		if ($node[0] === $root[0]) return [];
		var path = [];
		var cur = $node[0];
		var rootEl = $root[0];
		var guard = 0;
		while (cur && cur !== rootEl && guard++ < 64) {
			var $parentEn = $(cur).parent().closest('[data-enode]');
			if (!$parentEn.length) return null;
			var kids = $parentEn[0].ENODE_getChildren
				? $parentEn[0].ENODE_getChildren().toArray()
				: $parentEn.children('[data-enode]').toArray();
			var idx = kids.indexOf(cur);
			if (idx < 0) return null;
			path.unshift(idx);
			if ($parentEn[0] === rootEl) break;
			cur = $parentEn[0];
		}
		return path;
	}

	function nodeAtPath($root, path) {
		if (!$root || !$root.length) return $();
		if (!path || !path.length) return $root;
		var $n = $root;
		for (var i = 0; i < path.length; i++) {
			if (!$n.length || !$n[0].ENODE_getChildren) return $();
			var kids = $n[0].ENODE_getChildren();
			$n = $(kids[path[i]]);
		}
		return $n;
	}

	/**
	 * Clona la proprietà e rimappa pattern/transform/attack sulla clone.
	 * L’operand resta sul canvas live.
	 */
	function clonePropertyForMatch(resolved) {
		if (typeof swapMembersClone !== 'function') {
			throw new Error('newPM: swapMembersClone non disponibile');
		}
		var cloningRes = swapMembersClone(resolved.$property, resolved.direction);
		if (!cloningRes || !cloningRes.foundTF) {
			throw new Error(
				'newPM: clone proprietà fallita' +
					(cloningRes && cloningRes.msg ? ' — ' + cloningRes.msg : '')
			);
		}
		var $cloneProp = cloningRes.$cloneProp;
		var mem = membersFromProp($cloneProp, 'ltr');
		// dopo swapMembersClone con rtl i membri sono già scambiati → pattern è firstMember
		if (!mem || !mem.$pattern.length) {
			if (typeof ENODEremove === 'function') ENODEremove($cloneProp);
			throw new Error('newPM: pattern vuoto sulla clone');
		}

		var attackPath = indexPath(resolved.$pattern, resolved.$attackInPattern);
		var $attackClone;
		if (attackPath) {
			$attackClone = nodeAtPath(mem.$pattern, attackPath);
		}
		if (!$attackClone || !$attackClone.length) {
			var $marked = findMarkedSInSubtree(mem.$pattern);
			$attackClone = $marked.length ? $marked : mem.$pattern;
		}

		return {
			$cloneProp: $cloneProp,
			$equation: mem.$equation,
			$pattern: mem.$pattern,
			$transform: mem.$transform,
			$attackInPattern: $attackClone,
			visualization: cloningRes.visualization
		};
	}

	/**
	 * Rilegge pattern/transform dalla clone (dopo replace / dissoluzione forAll).
	 * direction 'ltr' perché la clone è già orientata da swapMembersClone.
	 */
	function rereadCloneMembers($cloneProp) {
		if (!$cloneProp || !$cloneProp.length) {
			return { $pattern: $(), $transform: $(), $equation: $() };
		}
		// se forAll dissolto, $cloneProp può essere già l’eq o il membro
		var mem = membersFromProp($cloneProp, 'ltr');
		if (mem) return mem;
		if ($cloneProp.attr('data-enode') === 'eq') {
			return {
				$equation: $cloneProp,
				$pattern: $cloneProp[0].ENODE_getRoles('.firstMember').children().first(),
				$transform: $cloneProp[0]
					.ENODE_getRoles('.secondMember')
					.children()
					.first()
			};
		}
		return {
			$equation: $(),
			$pattern: $cloneProp,
			$transform: $()
		};
	}

	/**
	 * @param {*} dragged — elemento nel pattern (o root pattern per retrocompat)
	 * @param {*} target — drop target nell’input
	 */
	function resolveFromDragAndTarget(dragged, target) {
		var resolve = NewPM.resolveENODE || function (r) {
			return $(r);
		};
		var $dragged = resolve(dragged);
		var $dropTarget = resolve(target);

		if (!$dragged.length) {
			throw new Error(
				'newPM: dragged — selettore senza match: ' + String(dragged)
			);
		}
		if (!$dragged.is('[data-enode]')) {
			throw new Error('newPM: dragged non è un ENODE');
		}
		if (!$dropTarget.length) {
			throw new Error(
				'newPM: target — selettore senza match: ' + String(target)
			);
		}
		if (!$dropTarget.is('[data-enode]')) {
			throw new Error('newPM: target non è un ENODE');
		}

		var $property = $dragged.closest('[data-enode=forAll]');
		if (!$property.length) {
			throw new Error(
				'newPM: dragged non è dentro un forAll (serve una proprietà PM)'
			);
		}

		var $eq = getEqFromForAll($property);
		if (!$eq.length || $eq.attr('data-enode') !== 'eq') {
			throw new Error('newPM: contenuto del forAll non è un’equazione');
		}

		var $members = $eq[0].ENODE_getRoles('.firstMember,.secondMember');
		var $roleMember = $members.filter(function (i, e) {
			return e.contains($dragged[0]);
		});
		if (!$roleMember.length) {
			throw new Error('newPM: dragged non appartiene a un membro dell’equazione');
		}

		var direction;
		if ($roleMember.is('.firstMember')) direction = 'ltr';
		else if ($roleMember.is('.secondMember')) direction = 'rtl';
		else throw new Error('newPM: membro equazione non riconosciuto');

		var liveMem = membersFromProp($property, direction);
		if (!liveMem || !liveMem.$pattern.length) {
			throw new Error('newPM: pattern vuoto');
		}
		var $patternLive = liveMem.$pattern;
		var $transformLive = liveMem.$transform;

		var draggedIsPatternRoot = $dragged.is($patternLive);
		var $attackLive;
		var patternDepth;

		if (draggedIsPatternRoot) {
			$attackLive = $patternLive;
			patternDepth = 0;
		} else {
			var $markedS = findMarkedSInSubtree($patternLive);
			if ($markedS.length) {
				$attackLive = $markedS;
			} else if (
				$dragged.closest($patternLive).length ||
				$patternLive.has($dragged).length ||
				$patternLive.is($dragged)
			) {
				$attackLive = $dragged;
			} else {
				$attackLive = $patternLive;
			}
			patternDepth = levelsToAncestorLocal($attackLive, $patternLive);
			if (isNaN(patternDepth)) {
				throw new Error(
					'newPM: attack point non è sotto il pattern (levelsToAncestor)'
				);
			}
		}

		var $operand;
		if (patternDepth === 0) {
			$operand = $dropTarget;
		} else {
			var $parents = $dropTarget.parents('[data-enode]');
			$operand = $($parents[patternDepth - 1]);
			if (!$operand || !$operand.length) {
				throw new Error(
					'newPM: impossibile risalire di ' +
						patternDepth +
						' livelli dal target (parents insufficienti)'
				);
			}
		}

		var cloned = clonePropertyForMatch({
			$property: $property,
			direction: direction,
			$pattern: $patternLive,
			$attackInPattern: $attackLive
		});

		return {
			$property: $property,
			$cloneProp: cloned.$cloneProp,
			direction: direction,
			$pattern: cloned.$pattern,
			$transform: cloned.$transform,
			$patternLive: $patternLive,
			$transformLive: $transformLive,
			$operand: $operand,
			$attackInPattern: cloned.$attackInPattern,
			$dropTarget: $dropTarget,
			$dragged: $dragged,
			patternDepth: patternDepth
		};
	}

	NewPM.resolveFromDragAndTarget = resolveFromDragAndTarget;
	NewPM.levelsToAncestorLocal = levelsToAncestorLocal;
	NewPM.membersFromProp = membersFromProp;
	NewPM.rereadCloneMembers = rereadCloneMembers;
	NewPM.indexPath = indexPath;
	NewPM.nodeAtPath = nodeAtPath;
	NewPM.clonePropertyForMatch = clonePropertyForMatch;
})(typeof window !== 'undefined' ? window : globalThis);
