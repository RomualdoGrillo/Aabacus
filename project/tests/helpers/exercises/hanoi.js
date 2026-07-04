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
		var fromRect = topDisc.getBoundingClientRect();
		var toRect = targetZone.getBoundingClientRect();
		return {
			from: {
				x: fromRect.left + fromRect.width * (options.fromOffsetX != null ? options.fromOffsetX : 0.5),
				y: fromRect.top + fromRect.height * (options.fromOffsetY != null ? options.fromOffsetY : 0.5)
			},
			to: {
				x: toRect.left + toRect.width * (options.toOffsetX != null ? options.toOffsetX : 0.5),
				y: toRect.top + toRect.height * (options.toOffsetY != null ? options.toOffsetY : 0.85)
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
		await T.simulatePointerPath({
			points: T.interpolatePoints(coords.from, coords.to, steps),
			modifiers: options.modifiers,
			button: options.button,
			stepDelayMs: options.stepDelayMs,
			showCursor: options.showCursor
		});
		await new Promise(function (resolve) {
			setTimeout(resolve, 100);
		});
		var after = getRodDiscCounts();
		return {
			ok: true,
			before: before,
			after: after,
			coords: coords,
			moved: after[toRodIndex] === before[toRodIndex] + 1 && after[fromRodIndex] === before[fromRodIndex] - 1
		};
	}

	window.__aabacusTestExercises = window.__aabacusTestExercises || {};
	window.__aabacusTestExercises.hanoi = {
		getRodDiscCounts: getRodDiscCounts,
		getMoveCoordinates: getMoveCoordinates,
		getExerciseState: getExerciseState,
		isExerciseReady: isExerciseReady,
		simulateMove: simulateMove
	};
})();
