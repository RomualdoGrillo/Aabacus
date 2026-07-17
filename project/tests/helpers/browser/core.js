(function () {
	'use strict';

	/** Iniettato da Playwright — usa jQuery e globali app (GLBsettings, Sortable). */
	if (typeof $ !== 'function') {
		throw new Error('jQuery missing — load app before test helpers');
	}

	function sleep(ms) {
		return new Promise(function (resolve) {
			setTimeout(resolve, ms);
		});
	}

	function normalizeModifiers(modifiers) {
		modifiers = modifiers || {};
		return {
			ctrlKey: !!modifiers.ctrl,
			metaKey: !!modifiers.meta,
			shiftKey: !!modifiers.shift,
			altKey: !!modifiers.alt
		};
	}

	function enodeAtPoint(el) {
		if (!el) {
			return null;
		}
		var $enode = $(el).closest('[data-enode]');
		return $enode.length ? $enode : null;
	}

	function describeElement(el) {
		if (!el) {
			return null;
		}
		var $enode = enodeAtPoint(el);
		return {
			tagName: el.tagName.toLowerCase(),
			id: el.id || null,
			className: typeof el.className === 'string' ? el.className : null,
			enode: $enode ? $enode.attr('data-enode') : null,
			dataType: $enode ? $enode.attr('data-type') : null
		};
	}

	function probePoint(x, y) {
		var el = document.elementFromPoint(x, y);
		var tool = null;
		if (typeof GLBsettings !== 'undefined' && GLBsettings) {
			tool = GLBsettings.tool;
		}
		if (tool == null && document.body) {
			tool = document.body.getAttribute('tool');
		}
		return {
			x: x,
			y: y,
			hit: describeElement(el),
			tool: tool
		};
	}

	var TEST_POINTER_ID = 1;
	var activeDragTarget = null;

	function sortableUsesPointerEvents() {
		var ua = navigator.userAgent;
		var safari = /safari/i.test(ua) && !/chrome/i.test(ua) && !/android/i.test(ua);
		return typeof PointerEvent !== 'undefined' && !safari;
	}

	function resolveActiveSortable() {
		if (typeof Sortable === 'undefined') {
			return null;
		}
		var chosen = document.querySelector('.sortable-chosen');
		var node = chosen || activeDragTarget;
		while (node && node !== document.body) {
			var sortable = Sortable.get(node);
			if (sortable) {
				return sortable;
			}
			node = node.parentElement;
		}
		return null;
	}

	function buildPointerInit(type, x, y, opts, mods) {
		var pressed = type === 'pointerdown' || type === 'pointermove';
		return {
			bubbles: true,
			cancelable: true,
			view: window,
			clientX: x,
			clientY: y,
			screenX: window.screenX + x,
			screenY: window.screenY + y,
			pointerId: TEST_POINTER_ID,
			pointerType: 'mouse',
			isPrimary: true,
			width: 1,
			height: 1,
			pressure: pressed ? 0.5 : 0,
			button: opts.button != null ? opts.button : 0,
			buttons: pressed ? 1 : 0,
			ctrlKey: mods.ctrlKey,
			metaKey: mods.metaKey,
			shiftKey: mods.shiftKey,
			altKey: mods.altKey
		};
	}

	function buildMouseInit(type, x, y, opts, mods) {
		var pressed = type === 'mousedown' || type === 'mousemove';
		return {
			bubbles: true,
			cancelable: true,
			view: window,
			clientX: x,
			clientY: y,
			screenX: window.screenX + x,
			screenY: window.screenY + y,
			button: opts.button != null ? opts.button : 0,
			buttons: pressed ? 1 : 0,
			ctrlKey: mods.ctrlKey,
			metaKey: mods.metaKey,
			shiftKey: mods.shiftKey,
			altKey: mods.altKey,
			which: type === 'mouseup' ? 0 : 1,
			detail: type === 'mousedown' ? 1 : 0
		};
	}

	function dispatchEventOn(el, evt) {
		if (el) {
			el.dispatchEvent(evt);
		}
	}

	function dispatchToDragTargets(type, x, y, opts) {
		opts = opts || {};
		var mods = normalizeModifiers(opts.modifiers);
		var usePointer = sortableUsesPointerEvents();
		var pointTarget = document.elementFromPoint(x, y);
		if (!pointTarget) {
			throw new Error('No element at (' + x + ', ' + y + ')');
		}
		var dragTarget = activeDragTarget || pointTarget;
		var pointerType = null;
		var ptrEvt = null;
		var mouseEvt = new MouseEvent(type, buildMouseInit(type, x, y, opts, mods));

		if (type === 'mousedown') {
			pointerType = 'pointerdown';
			activeDragTarget = pointTarget;
			dragTarget = activeDragTarget;
		} else if (type === 'mousemove') {
			pointerType = 'pointermove';
		} else if (type === 'mouseup') {
			pointerType = 'pointerup';
		}

		if (usePointer && pointerType) {
			ptrEvt = new PointerEvent(pointerType, buildPointerInit(pointerType, x, y, opts, mods));
		}

		if (type === 'mousedown') {
			if (ptrEvt) {
				dispatchEventOn(dragTarget, ptrEvt);
			}
			dispatchEventOn(dragTarget, mouseEvt);
		} else {
			if (ptrEvt) {
				dispatchEventOn(dragTarget, ptrEvt);
				dispatchEventOn(document, ptrEvt);
			}
			dispatchEventOn(dragTarget, mouseEvt);
			dispatchEventOn(document, mouseEvt);

			var sortable = resolveActiveSortable();
			if (sortable) {
				if (type === 'mousemove') {
					sortable._onTouchMove(ptrEvt || mouseEvt);
				} else if (type === 'mouseup') {
					sortable._emulateDragOver();
					sortable._onDrop(mouseEvt);
				}
			}
		}

		if (type === 'mouseup') {
			activeDragTarget = null;
		}

		return { target: dragTarget, type: type, x: x, y: y, usePointer: usePointer };
	}

	function interpolatePoints(from, to, steps) {
		var points = [];
		for (var i = 0; i <= steps; i++) {
			var t = i / steps;
			points.push({
				x: from.x + (to.x - from.x) * t,
				y: from.y + (to.y - from.y) * t
			});
		}
		return points;
	}

	function isDemoMode() {
		return new URLSearchParams(window.location.search).get('demo') === '1';
	}

	function ensureDemoCursor() {
		var cursor = document.getElementById('__aabacusTestCursor');
		if (!cursor) {
			cursor = document.createElement('div');
			cursor.id = '__aabacusTestCursor';
			cursor.style.cssText =
				'position:fixed;width:18px;height:18px;border-radius:50%;' +
				'background:rgba(255,40,40,0.9);border:2px solid #fff;z-index:999999;' +
				'pointer-events:none;transform:translate(-50%,-50%);' +
				'box-shadow:0 0 8px rgba(0,0,0,0.45);transition:left 80ms linear,top 80ms linear;';
			document.body.appendChild(cursor);
		}
		return cursor;
	}

	function moveDemoCursor(x, y, cursor) {
		if (!cursor) {
			return;
		}
		cursor.style.display = 'block';
		cursor.style.left = x + 'px';
		cursor.style.top = y + 'px';
	}

	function hideDemoCursor(cursor) {
		if (cursor) {
			cursor.style.display = 'none';
		}
	}

	async function simulatePointerPath(options) {
		options = options || {};
		var points = options.points;
		if (!points || points.length < 2) {
			throw new Error('simulatePointerPath requires at least 2 points');
		}
		var stepDelay = options.stepDelayMs != null ? options.stepDelayMs : 16;
		var modifiers = options.modifiers;
		var button = options.button;
		var showCursor = options.showCursor != null ? options.showCursor : isDemoMode();
		var cursor = showCursor ? ensureDemoCursor() : null;

		moveDemoCursor(points[0].x, points[0].y, cursor);
		dispatchToDragTargets('mousemove', points[0].x, points[0].y, { modifiers: modifiers, button: button });
		await sleep(stepDelay);
		dispatchToDragTargets('mousedown', points[0].x, points[0].y, { modifiers: modifiers, button: button });
		await sleep(stepDelay);

		for (var i = 1; i < points.length; i++) {
			moveDemoCursor(points[i].x, points[i].y, cursor);
			dispatchToDragTargets('mousemove', points[i].x, points[i].y, { modifiers: modifiers, button: button });
			await sleep(stepDelay);
		}

		moveDemoCursor(points[points.length - 1].x, points[points.length - 1].y, cursor);
		dispatchToDragTargets('mouseup', points[points.length - 1].x, points[points.length - 1].y, {
			modifiers: modifiers,
			button: button
		});
		await sleep(showCursor ? 400 : 0);
		hideDemoCursor(cursor);

		return { ok: true, pointCount: points.length, showCursor: showCursor };
	}

	function resolveTarget(targetSpec) {
		if (typeof targetSpec.x === 'number' && typeof targetSpec.y === 'number') {
			return {
				x: targetSpec.x,
				y: targetSpec.y,
				element: document.elementFromPoint(targetSpec.x, targetSpec.y)
			};
		}
		if (!targetSpec.selector) {
			throw new Error('Target requires selector or x,y coordinates');
		}
		var el = document.querySelector(targetSpec.selector);
		if (!el) {
			throw new Error('Selector not found: ' + targetSpec.selector);
		}
		el.scrollIntoView({ block: 'center', inline: 'center' });
		var rect = el.getBoundingClientRect();
		if (rect.width === 0 && rect.height === 0) {
			throw new Error('Target not visible: ' + targetSpec.selector);
		}
		var ox = targetSpec.offset && targetSpec.offset.x != null ? targetSpec.offset.x : 0.5;
		var oy = targetSpec.offset && targetSpec.offset.y != null ? targetSpec.offset.y : 0.5;
		return {
			x: rect.left + rect.width * ox,
			y: rect.top + rect.height * oy,
			element: el,
			rect: rect
		};
	}

	function assertHitMatches(x, y, expectSelector) {
		if (!expectSelector) {
			return;
		}
		var hit = document.elementFromPoint(x, y);
		if (!hit) {
			throw new Error('Preflight: no element at (' + x + ', ' + y + ')');
		}
		var expected = document.querySelector(expectSelector);
		if (!expected) {
			throw new Error('Preflight: expect selector not found: ' + expectSelector);
		}
		if (!expected.contains(hit) && expected !== hit) {
			throw new Error(
				'Preflight: expected ' + expectSelector + ' but hit ' + JSON.stringify(probePoint(x, y).hit)
			);
		}
	}

	async function simulateDnD(options) {
		options = options || {};
		var steps = options.steps != null ? options.steps : 20;
		var from = resolveTarget(options.from);
		var to = resolveTarget(options.to);

		assertHitMatches(from.x, from.y, options.expectFrom || (options.from && options.from.selector));
		assertHitMatches(to.x, to.y, options.expectTo || (options.to && options.to.selector));

		return simulatePointerPath({
			points: interpolatePoints(from, to, steps),
			modifiers: options.modifiers,
			button: options.button,
			stepDelayMs: options.stepDelayMs
		});
	}

	async function simulateClick(options) {
		options = options || {};
		var targetSpec = options.at || options;
		var pt = resolveTarget(targetSpec);
		var expectSelector = options.expect || targetSpec.selector;
		assertHitMatches(pt.x, pt.y, expectSelector);
		dispatchToDragTargets('mousedown', pt.x, pt.y, { modifiers: options.modifiers });
		await sleep(16);
		dispatchToDragTargets('mouseup', pt.x, pt.y, { modifiers: options.modifiers });
		return { ok: true, x: pt.x, y: pt.y };
	}

	function getState() {
		var canvas = document.querySelector('#canvasRole');
		var palette = document.querySelector('#palette');
		return {
			ready: !!(canvas && canvas.querySelector('[data-enode]')),
			tiedCanvas:
				typeof GLBsettings !== 'undefined' && GLBsettings
					? !!GLBsettings.tiedCanvas
					: null,
			canvasUntied: !!(document.querySelector('#canvas') && document.querySelector('#canvas').classList.contains('untied')),
			tool:
				typeof GLBsettings !== 'undefined' && GLBsettings
					? GLBsettings.tool
					: document.body.getAttribute('tool'),
			canvasChildCount: canvas ? canvas.children.length : 0,
			canvasEnodeCount: canvas ? canvas.querySelectorAll('[data-enode]').length : 0,
			paletteEnodeCount: palette ? palette.querySelectorAll('[data-enode]').length : 0
		};
	}

	async function waitForReady(timeoutMs) {
		timeoutMs = timeoutMs != null ? timeoutMs : 15000;
		var start = Date.now();
		while (Date.now() - start < timeoutMs) {
			var state = getState();
			if (state.ready && state.canvasEnodeCount > 0) {
				return state;
			}
			await sleep(100);
		}
		throw new Error('waitForReady timeout: ' + JSON.stringify(getState()));
	}

	function probeElement(targetSpec) {
		var pt = resolveTarget(targetSpec);
		return probePoint(pt.x, pt.y);
	}

	window.__aabacusTest = {
		probePoint: probePoint,
		probeElement: probeElement,
		resolveTarget: resolveTarget,
		interpolatePoints: interpolatePoints,
		getState: getState,
		waitForReady: waitForReady,
		simulatePointerPath: simulatePointerPath,
		simulateDnD: simulateDnD,
		simulateClick: simulateClick
	};
})();
