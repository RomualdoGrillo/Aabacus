(function () {
	'use strict';

	var T = window.__aabacusTest;
	if (!T) {
		throw new Error('hanoi exercise helper requires injected test core (injectTestHelpers)');
	}

	var RODS_SELECTOR = '#canvasRole [data-enode=hanoi] [data-enode=hanoirod]';
	var DISC_SELECTOR = '[data-enode=cn]';

	function getRodDiscCounts() {
		var rods = Array.from(document.querySelectorAll(RODS_SELECTOR));
		return rods.map(function (rod) {
			return rod.querySelectorAll(DISC_SELECTOR).length;
		});
	}

	function getRodOrder() {
		var hanoiRole = document.querySelector('#canvasRole [data-enode=hanoi] > .ol_role');
		if (!hanoiRole) {
			return [];
		}
		return Array.from(hanoiRole.children).map(function (child, index) {
			var rod = child.querySelector('[data-enode=hanoirod]');
			return {
				domIndex: index,
				discCount: rod ? rod.querySelectorAll(DISC_SELECTOR).length : -1
			};
		});
	}

	function getRodDragCoordinates(options) {
		options = options || {};
		var rods = Array.from(document.querySelectorAll(RODS_SELECTOR));
		if (rods.length < 2) {
			throw new Error('Need at least 2 Hanoi rods');
		}
		var fromRodIndex = options.fromRodIndex != null ? options.fromRodIndex : 0;
		var toRodIndex = options.toRodIndex != null ? options.toRodIndex : 1;
		var sourceRod = rods[fromRodIndex];
		var targetRod = rods[toRodIndex];
		var dragEl = sourceRod.querySelector('.ol_role') || sourceRod;
		var dropEl = targetRod.querySelector('.ol_role') || targetRod;
		dragEl.scrollIntoView({ block: 'center', inline: 'center' });
		dropEl.scrollIntoView({ block: 'center', inline: 'center' });
		var fromRect = dragEl.getBoundingClientRect();
		var toRect = dropEl.getBoundingClientRect();
		return {
			from: {
				x: fromRect.left + fromRect.width * (options.fromOffsetX != null ? options.fromOffsetX : 0.5),
				y: fromRect.top + fromRect.height * (options.fromOffsetY != null ? options.fromOffsetY : 0.75)
			},
			to: {
				x: toRect.left + toRect.width * (options.toOffsetX != null ? options.toOffsetX : 0.5),
				y: toRect.top + toRect.height * (options.toOffsetY != null ? options.toOffsetY : 0.75)
			}
		};
	}

	function getMoveCoordinates(options) {
		options = options || {};
		var rods = Array.from(document.querySelectorAll(RODS_SELECTOR));
		if (rods.length < 2) {
			throw new Error('Need at least 2 Hanoi rods');
		}
		var fromRodIndex = options.fromRodIndex != null ? options.fromRodIndex : 0;
		var toRodIndex = options.toRodIndex != null ? options.toRodIndex : 1;
		var sourceRod = rods[fromRodIndex];
		var targetRod = rods[toRodIndex];
		var topDisc = sourceRod.querySelector('.ol_role [data-enode=cn]:first-child');
		if (!topDisc) {
			topDisc = sourceRod.querySelector(DISC_SELECTOR);
		}
		if (!topDisc) {
			throw new Error('No disc on source rod');
		}
		var targetZone = targetRod.querySelector('.ol_role') || targetRod;
		var topTargetDisc = targetRod.querySelector('.ol_role [data-enode=cn]:first-child');
		var dropEl = topTargetDisc || targetZone;
		topDisc.scrollIntoView({ block: 'center', inline: 'center' });
		dropEl.scrollIntoView({ block: 'center', inline: 'center' });
		var fromRect = topDisc.getBoundingClientRect();
		var toRect = dropEl.getBoundingClientRect();
		var toOffsetY =
			topTargetDisc != null
				? options.toOffsetY != null
					? options.toOffsetY
					: 0.35
				: options.toOffsetY != null
					? options.toOffsetY
					: 0.85;
		return {
			from: {
				x: fromRect.left + fromRect.width * (options.fromOffsetX != null ? options.fromOffsetX : 0.5),
				y: fromRect.top + fromRect.height * (options.fromOffsetY != null ? options.fromOffsetY : 0.5)
			},
			to: {
				x: toRect.left + toRect.width * (options.toOffsetX != null ? options.toOffsetX : 0.5),
				y: toRect.top + toRect.height * toOffsetY
			}
		};
	}

	function getExerciseState() {
		var hanoi = document.querySelector('#canvasRole [data-enode=hanoi]');
		var rods = hanoi ? hanoi.querySelectorAll('[data-enode=hanoirod]') : [];
		return {
			hanoiRodCount: rods.length,
			hanoiDiscCount: hanoi ? hanoi.querySelectorAll(DISC_SELECTOR).length : 0
		};
	}

	function isExerciseReady() {
		var s = getExerciseState();
		return s.hanoiRodCount >= 3 && s.hanoiDiscCount >= 4;
	}

	async function simulateMove(options) {
		options = options || {};
		var coords = getMoveCoordinates(options);
		var fromRodIndex = options.fromRodIndex != null ? options.fromRodIndex : 0;
		var toRodIndex = options.toRodIndex != null ? options.toRodIndex : 1;
		var before = getRodDiscCounts();
		var steps = options.steps != null ? options.steps : 25;
		var liftY = Math.min(coords.from.y, coords.to.y) - (options.liftPx != null ? options.liftPx : 70);
		var via = { x: coords.from.x, y: liftY };
		var via2 = { x: coords.to.x, y: liftY };
		var leg = Math.max(4, Math.floor(steps / 3));
		var points = T.interpolatePoints(coords.from, via, leg)
			.concat(T.interpolatePoints(via, via2, leg).slice(1))
			.concat(T.interpolatePoints(via2, coords.to, leg).slice(1));
		await T.simulatePointerPath({
			points: points,
			modifiers: options.modifiers,
			button: options.button,
			stepDelayMs: options.stepDelayMs,
			showCursor: options.showCursor
		});
		var after = before;
		var moved = false;
		var deadline = Date.now() + (options.settleMs != null ? options.settleMs : 2000);
		while (Date.now() < deadline) {
			await new Promise(function (resolve) {
				setTimeout(resolve, 80);
			});
			after = getRodDiscCounts();
			moved =
				after[toRodIndex] === before[toRodIndex] + 1 &&
				after[fromRodIndex] === before[fromRodIndex] - 1;
			if (moved) {
				break;
			}
		}
		return {
			ok: true,
			before: before,
			after: after,
			coords: coords,
			moved: moved
		};
	}

	window.__aabacusTestExercises = window.__aabacusTestExercises || {};
	window.__aabacusTestExercises.hanoi = {
		getRodDiscCounts: getRodDiscCounts,
		getRodOrder: getRodOrder,
		getRodDragCoordinates: getRodDragCoordinates,
		getMoveCoordinates: getMoveCoordinates,
		getExerciseState: getExerciseState,
		isExerciseReady: isExerciseReady,
		simulateMove: simulateMove
	};
})();
