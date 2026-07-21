/**
 * newPM — risoluzione dragged+target come autoAdapt:
 * forAll, ltr/rtl, attack mark "s", levelsToAncestor, risalita operando.
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

	/**
	 * @param {*} dragged — elemento nel pattern (o root pattern per retrocompat)
	 * @param {*} target — drop target nell’input
	 * @returns {{ $property, direction, $pattern, $transform, $operand, $attackInPattern, $dropTarget, patternDepth, $dragged }}
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

		var $first = $eq[0].ENODE_getRoles('.firstMember').children().first();
		var $second = $eq[0].ENODE_getRoles('.secondMember').children().first();
		var $pattern = direction === 'ltr' ? $first : $second;
		var $transform = direction === 'ltr' ? $second : $first;

		if (!$pattern.length) {
			throw new Error('newPM: pattern vuoto');
		}

		// Retrocompat: dragged == pattern root → depth 0, operand = target
		var draggedIsPatternRoot = $dragged.is($pattern);
		var $attackInPattern;
		var patternDepth;

		if (draggedIsPatternRoot) {
			$attackInPattern = $pattern;
			patternDepth = 0;
		} else {
			var $markedS = findMarkedSInSubtree($pattern);
			if ($markedS.length) {
				$attackInPattern = $markedS;
			} else if ($dragged.closest($pattern).length || $pattern.has($dragged).length || $pattern.is($dragged)) {
				$attackInPattern = $dragged;
			} else {
				$attackInPattern = $pattern;
			}
			patternDepth = levelsToAncestorLocal($attackInPattern, $pattern);
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

		return {
			$property: $property,
			direction: direction,
			$pattern: $pattern,
			$transform: $transform,
			$operand: $operand,
			$attackInPattern: $attackInPattern,
			$dropTarget: $dropTarget,
			$dragged: $dragged,
			patternDepth: patternDepth
		};
	}

	NewPM.resolveFromDragAndTarget = resolveFromDragAndTarget;
	NewPM.levelsToAncestorLocal = levelsToAncestorLocal;
})(typeof window !== 'undefined' ? window : globalThis);
