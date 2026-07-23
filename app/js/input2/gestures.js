/**
 * input2/gestures.js — riconoscitore di gesti PURO (nessuna conoscenza del dominio matematico).
 * Pointer Events su #centralColumn; FSM esplicita; emette intent via callback.
 *
 * Intent:
 *   { type:'tap', target: Element[data-enode], metaKey, ctrlKey, shiftKey, points:[...] }
 *   { type:'slice', target: Element[data-enode], axis:'h'|'v', points:[...] }
 *   { type:'lasso', targets: Element[data-enode][], points:[...] }
 *
 * Slice: tratto quasi-retto H/V che inizia FUORI da ogni foglia [data-enode].
 * Lazo: tratto partito fuori, non classificato come slice, curva quasi chiusa;
 *       targets = ENODE il cui centro è nel poligono (senza antenati ridondanti).
 * Desktop: mouse = un dito; meta/ctrl/shift riportati sul tap.
 */
(function (global) {
	'use strict';

	const SLICE_ANGLE_TOL = 35;
	const MOVE_SLOP_PX = 10;
	const SLICE_MIN_LEN = 48;
	const SAMPLE_STEP_PX = 4;
	const LASSO_MIN_POINTS = 10;
	const LASSO_MIN_LEN = 80;
	const LASSO_CLOSE_GAP_PX = 56;
	const SLICE_MAX_DEVIATION_PX = 28;

	const STATE = {
		IDLE: 'idle',
		TRACKING: 'tracking', // partito su un ENODE → candidato tap
		SLICE: 'slice'        // partito fuori → candidato taglio o lazo
	};

	function dist(a, b) {
		return Math.hypot(a.x - b.x, a.y - b.y);
	}

	function pathLength(points) {
		let len = 0;
		for (let i = 1; i < points.length; i++) len += dist(points[i - 1], points[i]);
		return len;
	}

	function angleDegFromHorizontal(a, b) {
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const deg = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
		return deg > 90 ? 180 - deg : deg; // 0=H, 90=V
	}

	/** Classifica asse con tolleranza ±tol gradi; null se diagonale. */
	function classifyAxisTol(a, b, tol) {
		const ang = angleDegFromHorizontal(a, b);
		if (ang <= tol) return 'h';
		if (ang >= 90 - tol) return 'v';
		return null;
	}

	function pointInRect(p, r) {
		return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
	}

	/** Ray-casting point-in-polygon (poligono chiuso implicito). */
	function pointInPolygon(p, points) {
		if (!points || points.length < 3) return false;
		let inside = false;
		for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
			const xi = points[i].x, yi = points[i].y;
			const xj = points[j].x, yj = points[j].y;
			const intersect = ((yi > p.y) !== (yj > p.y))
				&& (p.x < (xj - xi) * (p.y - yi) / ((yj - yi) || 1e-12) + xi);
			if (intersect) inside = !inside;
		}
		return inside;
	}

	/** Deviazione massima dei punti dalla corda start→end (0 = rettilineo). */
	function maxDeviationFromChord(points) {
		if (!points || points.length < 2) return 0;
		const a = points[0];
		const b = points[points.length - 1];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const len2 = dx * dx + dy * dy;
		if (len2 < 1e-6) {
			let max = 0;
			for (let i = 1; i < points.length - 1; i++) {
				max = Math.max(max, dist(a, points[i]));
			}
			return max;
		}
		let max = 0;
		for (let i = 1; i < points.length - 1; i++) {
			const p = points[i];
			const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
			const proj = { x: a.x + t * dx, y: a.y + t * dy };
			max = Math.max(max, dist(p, proj));
		}
		return max;
	}

	function isNearlyClosed(points, gapPx) {
		if (!points || points.length < 3) return false;
		return dist(points[0], points[points.length - 1]) <= gapPx;
	}

	function enodeFromPoint(x, y) {
		const el = document.elementFromPoint(x, y);
		if (!(el instanceof Element)) return null;
		return el.closest('[data-enode]');
	}

	/** Foglia: [data-enode] senza discendenti [data-enode] (es. cn, ci atomici). */
	function isLeafEnode(el) {
		return !!(el && el.matches && el.matches('[data-enode]') && !el.querySelector('[data-enode]'));
	}

	function leafEnodeFromPoint(x, y) {
		const en = enodeFromPoint(x, y);
		if (!en) return null;
		if (isLeafEnode(en)) return en;
		const leaves = en.querySelectorAll('[data-enode]');
		for (let i = 0; i < leaves.length; i++) {
			const leaf = leaves[i];
			if (!isLeafEnode(leaf)) continue;
			const r = leaf.getBoundingClientRect();
			if (pointInRect({ x: x, y: y }, r)) return leaf;
		}
		return null;
	}

	function deepestEnode(a, b) {
		if (!a) return b || null;
		if (!b) return a;
		if (a.contains(b)) return b;
		if (b.contains(a)) return a;
		const da = depth(a);
		const db = depth(b);
		return db >= da ? b : a;
	}

	function depth(el) {
		let d = 0;
		let n = el;
		while (n) { d++; n = n.parentElement; }
		return d;
	}

	/**
	 * Campiona il segmento p0→p1 e raccoglie gli ENODE attraversati.
	 * Ritorna il più profondo.
	 */
	function deepestEnodeAlongPath(points) {
		let best = null;
		if (!points || points.length < 2) return null;
		for (let i = 1; i < points.length; i++) {
			const a = points[i - 1];
			const b = points[i];
			const len = dist(a, b);
			const steps = Math.max(1, Math.ceil(len / SAMPLE_STEP_PX));
			for (let s = 0; s <= steps; s++) {
				const t = s / steps;
				const x = a.x + (b.x - a.x) * t;
				const y = a.y + (b.y - a.y) * t;
				const hit = enodeFromPoint(x, y);
				if (hit) best = deepestEnode(best, hit);
			}
		}
		return best;
	}

	function segmentCrossesRect(p0, p1, r) {
		const in0 = pointInRect(p0, r);
		const in1 = pointInRect(p1, r);
		if (in0 && in1) return false;
		if (!in0 && in1) return true;
		if (in0 && !in1) return true;
		function segIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
			const den = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
			if (Math.abs(den) < 1e-9) return false;
			const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / den;
			const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / den;
			return t >= 0 && t <= 1 && u >= 0 && u <= 1;
		}
		const edges = [
			[r.left, r.top, r.right, r.top],
			[r.right, r.top, r.right, r.bottom],
			[r.right, r.bottom, r.left, r.bottom],
			[r.left, r.bottom, r.left, r.top]
		];
		for (const e of edges) {
			if (segIntersect(p0.x, p0.y, p1.x, p1.y, e[0], e[1], e[2], e[3])) return true;
		}
		return false;
	}

	function oppositeSides(p0, p1, r) {
		const left0 = p0.x < r.left, right0 = p0.x > r.right;
		const top0 = p0.y < r.top, bottom0 = p0.y > r.bottom;
		const left1 = p1.x < r.left, right1 = p1.x > r.right;
		const top1 = p1.y < r.top, bottom1 = p1.y > r.bottom;
		if ((left0 && right1) || (right0 && left1)) return true;
		if ((top0 && bottom1) || (bottom0 && top1)) return true;
		return false;
	}

	/**
	 * ENODE sotto root con centro nel poligono; elimina antenati se un discendente è già incluso.
	 * @param {Element} root
	 * @param {{x:number,y:number}[]} points
	 * @returns {Element[]}
	 */
	function enodesInsidePolygon(root, points) {
		if (!root || !points || points.length < 3) return [];
		const all = root.querySelectorAll('[data-enode]');
		const hit = [];
		for (let i = 0; i < all.length; i++) {
			const el = all[i];
			const r = el.getBoundingClientRect();
			if (r.width <= 0 || r.height <= 0) continue;
			const c = { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
			if (pointInPolygon(c, points)) hit.push(el);
		}
		// Preferisci i più profondi: scarta chi ha un discendente già in hit
		return hit.filter(function (el) {
			for (let j = 0; j < hit.length; j++) {
				if (hit[j] !== el && el.contains(hit[j])) return false;
			}
			return true;
		});
	}

	function createOverlayPath(className) {
		const svg = document.getElementById('svgContainer');
		if (!svg) return null;
		let path = svg.querySelector('path.' + className);
		if (!path) {
			path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			path.setAttribute('class', className);
			svg.appendChild(path);
		}
		return path;
	}

	function setOverlayPath(pathEl, points) {
		if (!pathEl) return;
		if (!points || !points.length) {
			pathEl.setAttribute('d', '');
			return;
		}
		const svg = document.getElementById('svgContainer');
		const rect = (svg || document.body).getBoundingClientRect();
		let d = '';
		for (let i = 0; i < points.length; i++) {
			const x = points[i].x - rect.left;
			const y = points[i].y - rect.top;
			d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
		}
		pathEl.setAttribute('d', d.trim());
	}

	/**
	 * @param {Object} opts
	 * @param {Element|string} [opts.root='#centralColumn']
	 * @param {function(Object):void} opts.onIntent
	 * @returns {{ destroy: function():void }}
	 */
	function bindGestureRecognizer(opts) {
		const root = typeof opts.root === 'string'
			? document.querySelector(opts.root)
			: (opts.root || document.getElementById('centralColumn'));
		const onIntent = opts.onIntent;
		if (!root || typeof onIntent !== 'function') {
			throw new Error('bindGestureRecognizer: root e onIntent richiesti');
		}

		const bladePath = createOverlayPath('input2-blade');
		const lassoPath = createOverlayPath('input2-lasso');
		const hitRoot = document.getElementById('canvasRole') || root;
		let state = STATE.IDLE;
		let primaryId = null;
		let startPt = null;
		let startEnode = null;
		let points = [];
		let fired = false;
		let mods = { metaKey: false, ctrlKey: false, shiftKey: false };

		function reset() {
			state = STATE.IDLE;
			primaryId = null;
			startPt = null;
			startEnode = null;
			points = [];
			fired = false;
			mods = { metaKey: false, ctrlKey: false, shiftKey: false };
			setOverlayPath(bladePath, []);
			setOverlayPath(lassoPath, []);
		}

		function emit(intent) {
			if (fired) return;
			fired = true;
			onIntent(intent);
		}

		function onPointerDown(e) {
			if (primaryId !== null) return;
			if (e.pointerType === 'mouse' && e.button !== 0) return;
			primaryId = e.pointerId;
			try { root.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
			startPt = { x: e.clientX, y: e.clientY };
			points = [{ x: e.clientX, y: e.clientY }];
			fired = false;
			mods = {
				metaKey: !!e.metaKey,
				ctrlKey: !!e.ctrlKey,
				shiftKey: !!e.shiftKey
			};
			// Tap su foglia; slice/lasso solo se si parte FUORI da ogni foglia [data-enode]
			// (i contenitori eq/and/plus non bloccano — vedi TAB B adattato).
			startEnode = leafEnodeFromPoint(e.clientX, e.clientY)
				|| enodeFromPoint(e.clientX, e.clientY);
			const startLeaf = leafEnodeFromPoint(e.clientX, e.clientY);
			state = startLeaf ? STATE.TRACKING : STATE.SLICE;
		}

		function onPointerMove(e) {
			if (e.pointerId !== primaryId || !startPt) return;
			const pt = { x: e.clientX, y: e.clientY };
			points.push(pt);
			if (state === STATE.SLICE) {
				// feedback: lama se ancora plausibile slice, altrimenti lazo
				const axis = classifyAxisTol(startPt, pt, SLICE_ANGLE_TOL);
				const straight = maxDeviationFromChord(points) <= SLICE_MAX_DEVIATION_PX;
				if (axis && straight) {
					setOverlayPath(lassoPath, []);
					setOverlayPath(bladePath, points);
				} else {
					setOverlayPath(bladePath, []);
					setOverlayPath(lassoPath, points);
				}
			}
		}

		function tryEmitSlice(startPt, endPt, points) {
			const axis = classifyAxisTol(startPt, endPt, SLICE_ANGLE_TOL);
			const len = dist(startPt, endPt);
			const straight = maxDeviationFromChord(points) <= SLICE_MAX_DEVIATION_PX;
			if (!(axis && len >= SLICE_MIN_LEN && straight)) return false;

			const crossed = deepestEnodeAlongPath(points);
			let target = crossed;
			if (target && !isLeafEnode(target)) {
				const all = target.querySelectorAll('[data-enode]');
				let deepest = null;
				for (let i = 0; i < all.length; i++) {
					if (!isLeafEnode(all[i])) continue;
					const r = all[i].getBoundingClientRect();
					if (segmentCrossesRect(startPt, endPt, r) || pointInRect(endPt, r)) {
						deepest = deepestEnode(deepest, all[i]);
					}
				}
				if (deepest) target = deepest;
			}
			if (!target) return false;
			const r = target.getBoundingClientRect();
			const startOut = !pointInRect(startPt, r);
			const through = oppositeSides(startPt, endPt, r) && segmentCrossesRect(startPt, endPt, r);
			const into = pointInRect(endPt, r) && segmentCrossesRect(startPt, endPt, r);
			if (!(startOut && (through || into))) return false;
			emit({
				type: 'slice',
				target: target,
				axis: axis,
				points: points.slice()
			});
			return true;
		}

		function tryEmitLasso(points) {
			const plen = pathLength(points);
			if (points.length < LASSO_MIN_POINTS || plen < LASSO_MIN_LEN) return false;
			if (!isNearlyClosed(points, LASSO_CLOSE_GAP_PX)) return false;
			const targets = enodesInsidePolygon(hitRoot, points);
			emit({
				type: 'lasso',
				targets: targets,
				target: targets[0] || null,
				points: points.slice()
			});
			return true;
		}

		function onPointerUp(e) {
			if (e.pointerId !== primaryId || !startPt) return;
			const endPt = { x: e.clientX, y: e.clientY };
			points.push(endPt);
			const len = dist(startPt, endPt);
			mods = {
				metaKey: !!(e.metaKey || mods.metaKey),
				ctrlKey: !!(e.ctrlKey || mods.ctrlKey),
				shiftKey: !!(e.shiftKey || mods.shiftKey)
			};

			if (state === STATE.TRACKING) {
				if (len <= MOVE_SLOP_PX * 2) {
					const target = leafEnodeFromPoint(startPt.x, startPt.y)
						|| startEnode
						|| enodeFromPoint(endPt.x, endPt.y);
					if (target) {
						emit({
							type: 'tap',
							target: target,
							metaKey: mods.metaKey,
							ctrlKey: mods.ctrlKey,
							shiftKey: mods.shiftKey,
							points: points.slice()
						});
					}
				}
			} else if (state === STATE.SLICE) {
				setOverlayPath(bladePath, []);
				setOverlayPath(lassoPath, []);
				// Priorità: slice rettilineo; altrimenti lazo quasi chiuso
				if (!tryEmitSlice(startPt, endPt, points)) {
					tryEmitLasso(points);
				}
			}

			try { root.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
			reset();
		}

		function onPointerCancel(e) {
			if (e.pointerId !== primaryId) return;
			reset();
		}

		root.addEventListener('pointerdown', onPointerDown);
		root.addEventListener('pointermove', onPointerMove);
		root.addEventListener('pointerup', onPointerUp);
		root.addEventListener('pointercancel', onPointerCancel);

		return {
			destroy: function () {
				root.removeEventListener('pointerdown', onPointerDown);
				root.removeEventListener('pointermove', onPointerMove);
				root.removeEventListener('pointerup', onPointerUp);
				root.removeEventListener('pointercancel', onPointerCancel);
				setOverlayPath(bladePath, []);
				setOverlayPath(lassoPath, []);
				reset();
			},
			_debug: {
				classifyAxisTol: classifyAxisTol,
				deepestEnodeAlongPath: deepestEnodeAlongPath,
				pointInPolygon: pointInPolygon,
				enodesInsidePolygon: enodesInsidePolygon,
				maxDeviationFromChord: maxDeviationFromChord,
				isNearlyClosed: isNearlyClosed
			}
		};
	}

	global.INPUT2 = global.INPUT2 || {};
	global.INPUT2.bindGestureRecognizer = bindGestureRecognizer;
	global.INPUT2._gestureHelpers = {
		classifyAxisTol: classifyAxisTol,
		pointInPolygon: pointInPolygon,
		enodesInsidePolygon: enodesInsidePolygon,
		maxDeviationFromChord: maxDeviationFromChord,
		isNearlyClosed: isNearlyClosed,
		pathLength: pathLength,
		SLICE_ANGLE_TOL: SLICE_ANGLE_TOL,
		SLICE_MIN_LEN: SLICE_MIN_LEN,
		SLICE_MAX_DEVIATION_PX: SLICE_MAX_DEVIATION_PX,
		LASSO_CLOSE_GAP_PX: LASSO_CLOSE_GAP_PX
	};
})(typeof window !== 'undefined' ? window : globalThis);
