/**
 * newPM — player grafico (ghost a capsule come nello storyboard PDF).
 */
(function (global) {
	'use strict';

	var NewPM = global.NewPM || (global.NewPM = {});

	function ensureNarration() {
		var el = document.getElementById('newPM-narration');
		if (!el) {
			el = document.createElement('div');
			el.id = 'newPM-narration';
			document.body.appendChild(el);
		}
		return el;
	}

	function ensurePhaseBadge() {
		var el = document.getElementById('newPM-phase');
		if (!el) {
			el = document.createElement('div');
			el.id = 'newPM-phase';
			document.body.appendChild(el);
		}
		return el;
	}

	function clearVisuals() {
		$('#newPM-ghost, #newPM-stalk, .newPM-leaf-fly').remove();
		$('#newPM-demo-pattern').removeClass('newPM-hide-leaves');
		$('#newPM-stage .newPM-bound-flash').removeClass('newPM-bound-flash');
		$('#newPM-narration, #newPM-phase').remove();
	}

	function rectOf(el) {
		if (!el || !el.getBoundingClientRect) return null;
		var r = el.getBoundingClientRect();
		if (r.width < 2 && r.height < 2) return null;
		return {
			top: r.top + window.scrollY,
			left: r.left + window.scrollX,
			width: Math.max(r.width, 36),
			height: Math.max(r.height, 36),
			cx: r.left + window.scrollX + r.width / 2,
			cy: r.top + window.scrollY + r.height / 2
		};
	}

	function sleep(ms) {
		return new Promise(function (resolve) {
			setTimeout(resolve, ms);
		});
	}

	function deepestPlus(rootEl) {
		if (!rootEl) return null;
		var $inners = $(rootEl).find('[data-enode="plus"]');
		return $inners.length ? $inners.last()[0] : null;
	}

	function createGhostPair() {
		$('#newPM-ghost').remove();
		var ghost = document.createElement('div');
		ghost.id = 'newPM-ghost';
		var outer = document.createElement('div');
		outer.className = 'newPM-ghost-capsule outer is-loose';
		var inner = document.createElement('div');
		inner.className = 'newPM-ghost-capsule inner is-loose';
		ghost.appendChild(outer);
		ghost.appendChild(inner);
		document.body.appendChild(ghost);
		return { ghost: ghost, outer: outer, inner: inner, gTop: 0, gLeft: 0 };
	}

	function layoutGhost(pair, outerRect, innerRect, loose) {
		var pad = 10;
		var top = Math.min(outerRect.top, innerRect.top) - pad;
		var left = Math.min(outerRect.left, innerRect.left) - pad;
		var right =
			Math.max(
				outerRect.left + outerRect.width,
				innerRect.left + innerRect.width
			) + pad;
		var bottom =
			Math.max(
				outerRect.top + outerRect.height,
				innerRect.top + innerRect.height
			) + pad;

		pair.gTop = top;
		pair.gLeft = left;
		pair.ghost.style.top = top + 'px';
		pair.ghost.style.left = left + 'px';
		pair.ghost.style.width = right - left + 'px';
		pair.ghost.style.height = bottom - top + 'px';

		pair.outer.style.top = outerRect.top - top + 'px';
		pair.outer.style.left = outerRect.left - left + 'px';
		pair.outer.style.width = outerRect.width + 'px';
		pair.outer.style.height = outerRect.height + 'px';

		pair.inner.style.top = innerRect.top - top + 'px';
		pair.inner.style.left = innerRect.left - left + 'px';
		pair.inner.style.width = innerRect.width + 'px';
		pair.inner.style.height = innerRect.height + 'px';

		pair.outer.classList.toggle('is-loose', !!loose);
		pair.inner.classList.toggle('is-loose', !!loose);
		pair.outer.classList.toggle('is-tight', !loose);
		pair.inner.classList.toggle('is-tight', !loose);
	}

	function placeGhostAtPattern(pair, patternEl) {
		var outerR = rectOf(patternEl);
		if (!outerR) return;
		var innerEl = deepestPlus(patternEl);
		var innerR = rectOf(innerEl) || {
			top: outerR.top + outerR.height * 0.22,
			left: outerR.left + outerR.width * 0.42,
			width: Math.max(outerR.width * 0.48, 60),
			height: Math.max(outerR.height * 0.55, 40)
		};
		layoutGhost(pair, outerR, innerR, true);
	}

	function moveGhostOverInput(pair, inputEl) {
		var target = rectOf(inputEl);
		if (!target) return;
		var outerR = {
			top: target.top - 8,
			left: target.left - 14,
			width: target.width + 28,
			height: target.height + 20
		};
		var innerR = {
			top: target.top + target.height * 0.12,
			left: target.left + target.width * 0.36,
			width: target.width * 0.56,
			height: target.height * 0.72
		};
		layoutGhost(pair, outerR, innerR, true);
	}

	function tighten(pair, which, inputEl) {
		var r = rectOf(inputEl);
		if (!r || !pair) return;
		if (which === 'inner') {
			pair._innerRect = r;
			pair.inner.classList.remove('is-loose');
			pair.inner.classList.add('is-tight');
			pair.inner.style.top = r.top - pair.gTop + 'px';
			pair.inner.style.left = r.left - pair.gLeft + 'px';
			pair.inner.style.width = r.width + 'px';
			pair.inner.style.height = r.height + 'px';
		} else {
			var innerR = pair._innerRect || {
				top: r.top + r.height * 0.15,
				left: r.left + r.width * 0.4,
				width: r.width * 0.5,
				height: r.height * 0.65
			};
			layoutGhost(pair, r, innerR, false);
		}
	}

	function drawStalk(fromEl, pair) {
		$('#newPM-stalk').remove();
		if (!fromEl || !pair) return;
		var a = rectOf(fromEl);
		if (!a) return;
		var x1 = a.cx;
		var y1 = a.bottom != null ? a.cy : a.cy;
		var x2 = pair.gLeft + parseFloat(pair.ghost.style.width) * 0.55;
		var y2 = pair.gTop + 8;
		var minX = Math.min(x1, x2) - 30;
		var minY = Math.min(y1, y2) - 30;
		var w = Math.abs(x2 - x1) + 60;
		var h = Math.abs(y2 - y1) + 60;
		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('id', 'newPM-stalk');
		svg.style.top = minY + 'px';
		svg.style.left = minX + 'px';
		svg.style.width = w + 'px';
		svg.style.height = h + 'px';
		var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		var mx = x1 - minX;
		var my = y1 - minY;
		var nx = x2 - minX;
		var ny = y2 - minY;
		path.setAttribute(
			'd',
			'M' +
				mx +
				',' +
				my +
				' C' +
				(mx + (nx - mx) * 0.3) +
				',' +
				(my + 50) +
				' ' +
				(mx + (nx - mx) * 0.7) +
				',' +
				(ny - 30) +
				' ' +
				nx +
				',' +
				ny
		);
		path.setAttribute('fill', 'none');
		path.setAttribute('stroke', 'rgba(110,110,110,0.45)');
		path.setAttribute('stroke-width', '14');
		path.setAttribute('stroke-linecap', 'round');
		svg.appendChild(path);
		document.body.appendChild(svg);
	}

	function flyLeaf(paramName, inputEls) {
		var $src = $('#newPM-demo-pattern [data-enode]').filter(function () {
			try {
				return this.ENODE_getName(true) === paramName;
			} catch (e) {
				return false;
			}
		});
		var start =
			rectOf($src[0]) || rectOf(document.querySelector('#newPM-demo-pattern'));
		var targets = inputEls || [];
		if (!targets.length) return Promise.resolve();

		var flyers = targets.map(function (target, i) {
			var flyer = document.createElement('div');
			flyer.className = 'newPM-leaf-fly';
			flyer.textContent = paramName.replace(/_+$/, '');
			if (start) {
				flyer.style.top = start.top + 'px';
				flyer.style.left = start.left + i * 14 + 'px';
			}
			document.body.appendChild(flyer);
			return { el: flyer, target: target };
		});

		void document.body.offsetWidth;
		flyers.forEach(function (f) {
			var t = rectOf(f.target);
			if (!t) return;
			f.el.style.top = t.top + 'px';
			f.el.style.left = t.left + 'px';
			$(f.target).addClass('newPM-bound-flash');
		});

		return sleep(450).then(function () {
			flyers.forEach(function (f) {
				f.el.remove();
			});
		});
	}

	async function playTrace(visualSteps, options) {
		options = options || {};
		var stepMs = options.stepMs != null ? options.stepMs : 1000;
		if (options.clear !== false) clearVisuals();

		var narration = ensureNarration();
		var phaseBadge = ensurePhaseBadge();
		var pair = null;
		var transformEl = null;

		for (var i = 0; i < (visualSteps || []).length; i++) {
			var step = visualSteps[i];
			narration.textContent = step.narrate || step.kind;
			narration.setAttribute('data-phase', step.phase || '');
			phaseBadge.textContent = 'fase: ' + (step.phase || '?');
			if (step.transformEl) transformEl = step.transformEl;

			if (step.kind === 'dragStart') {
				$('#newPM-demo-pattern').addClass('newPM-hide-leaves');
				pair = createGhostPair();
				placeGhostAtPattern(pair, step.patternEl);
				drawStalk(transformEl || step.transformEl, pair);
			} else if (step.kind === 'dragGhost') {
				if (!pair) {
					pair = createGhostPair();
					placeGhostAtPattern(pair, step.patternEl);
				}
				moveGhostOverInput(pair, step.inputEl);
				drawStalk(transformEl || step.transformEl, pair);
			} else if (step.kind === 'tightenInner') {
				tighten(pair, 'inner', step.inputEl);
				drawStalk(transformEl, pair);
			} else if (step.kind === 'tightenOuter') {
				tighten(pair, 'outer', step.inputEl);
				drawStalk(transformEl, pair);
			} else if (step.kind === 'revealLeaves') {
				$('#newPM-demo-pattern').removeClass('newPM-hide-leaves');
			} else if (step.kind === 'leafBind') {
				await flyLeaf(step.paramName, step.inputEls);
			} else if (step.kind === 'fail' && pair) {
				pair.outer.style.borderColor = '#c0392b';
				pair.inner.style.borderColor = '#c0392b';
			}

			await sleep(stepMs);
		}

		if (options.clearAtEnd) {
			await sleep(400);
			clearVisuals();
		}
		return true;
	}

	NewPM.playTrace = playTrace;
	NewPM.clearVisuals = clearVisuals;
})(typeof window !== 'undefined' ? window : globalThis);
