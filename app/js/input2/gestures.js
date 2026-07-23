/**
 * input2/gestures.js — riconoscitore di gesti PURO (nessuna conoscenza del dominio matematico).
 * Pointer Events su #centralColumn; FSM esplicita; emette intent via callback.
 *
 * Intent:
 *   { type:'tap', target: Element[data-enode], points:[...] }
 *   { type:'slice', target: Element[data-enode], axis:'h'|'v', points:[...] }
 *   { type:'pinch', target: Element[data-enode], axis:'h'|'v', points:[...] }
 *
 * Slice: tratto che inizia FUORI da ogni foglia [data-enode], attraversa ENODEs;
 *   bersaglio = più profondo attraversato. Asse ±35°; altrimenti scarto.
 * Pinch: due dita che INIZIANO dentro lo stesso ENODE (il più profondo che
 *   contiene entrambi i punti di partenza) e si AVVICINANO oltre soglia.
 *   Asse = dominante del vettore tra le dita. Allontanamento → nessun intent.
 * Desktop pinch: ALT+mouse = secondo dito speculare (come prototipo gesti-v2 TAB A).
 */
(function (global) {
	'use strict';

	const SLICE_ANGLE_TOL = 35;
	const MOVE_SLOP_PX = 10;
	const SLICE_MIN_LEN = 48;
	const SAMPLE_STEP_PX = 4;
	const PINCH_RATIO = 0.78;
	const MIRROR_ID = -1;

	const STATE = {
		IDLE: 'idle',
		TRACKING: 'tracking', // un dito su foglia → tap; o attesa secondo dito
		SLICE: 'slice',
		PINCH: 'pinch'
	};

	function dist(a, b) {
		return Math.hypot(a.x - b.x, a.y - b.y);
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

	/** Asse dominante (sempre h|v, niente zona morta). */
	function dominantAxis(a, b) {
		const ang = angleDegFromHorizontal(a, b);
		return ang < 45 ? 'h' : 'v';
	}

	function pointInRect(p, r) {
		return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
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
	 * Più profondo [data-enode] il cui bounding box contiene entrambi i punti.
	 * Cammina verso l'alto dal nodo sotto p1.
	 */
	function deepestEnodeContainingBoth(p1, p2) {
		let el = enodeFromPoint(p1.x, p1.y);
		while (el) {
			if (el.matches && el.matches('[data-enode]')) {
				const r = el.getBoundingClientRect();
				if (pointInRect(p1, r) && pointInRect(p2, r)) return el;
			}
			el = el.parentElement;
		}
		return null;
	}

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

	/** Come deepestEnodeAlongPath ma preferisce foglie (cn/ci) attraversate. */
	function deepestLeafAlongPath(points) {
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
				const hit = leafEnodeFromPoint(x, y);
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

	function createBlade() {
		const svg = document.getElementById('svgContainer');
		if (!svg) return null;
		let path = svg.querySelector('path.input2-blade');
		if (!path) {
			path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			path.setAttribute('class', 'input2-blade');
			svg.appendChild(path);
		}
		return path;
	}

	function setBlade(bladePath, points) {
		if (!bladePath) return;
		if (!points || !points.length) {
			bladePath.setAttribute('d', '');
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
		bladePath.setAttribute('d', d.trim());
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

		const bladePath = createBlade();
		let state = STATE.IDLE;
		/** @type {Map<number, {x:number,y:number,startX:number,startY:number}>} */
		const pointers = new Map();
		let primaryId = null;
		let secondaryId = null;
		let startPt = null;
		let startEnode = null;
		let points = [];
		let fired = false;
		let pinchTarget = null;
		let startDist = 0;
		let mirrorActive = false;

		function reset() {
			state = STATE.IDLE;
			pointers.clear();
			primaryId = null;
			secondaryId = null;
			startPt = null;
			startEnode = null;
			points = [];
			fired = false;
			pinchTarget = null;
			startDist = 0;
			mirrorActive = false;
			setBlade(bladePath, []);
		}

		function emit(intent) {
			if (fired) return;
			fired = true;
			onIntent(intent);
		}

		function realPointerCount() {
			let n = 0;
			pointers.forEach(function (_v, id) {
				if (id !== MIRROR_ID) n++;
			});
			return n;
		}

		function getPair() {
			if (pointers.size < 2) return null;
			const a = pointers.get(primaryId);
			const b = pointers.get(secondaryId != null ? secondaryId : MIRROR_ID);
			if (!a || !b) {
				const vals = [];
				pointers.forEach(function (v) { vals.push(v); });
				if (vals.length < 2) return null;
				return { a: vals[0], b: vals[1] };
			}
			return { a: a, b: b };
		}

		function mirrorPoint(origin, p) {
			return { x: 2 * origin.x - p.x, y: 2 * origin.y - p.y };
		}

		function tryEnterPinch() {
			const pair = getPair();
			if (!pair) return false;
			const p1 = { x: pair.a.startX, y: pair.a.startY };
			const p2 = { x: pair.b.startX, y: pair.b.startY };
			const common = deepestEnodeContainingBoth(p1, p2);
			if (!common) return false;
			pinchTarget = common;
			startDist = dist(pair.a, pair.b) || 1;
			state = STATE.PINCH;
			setBlade(bladePath, []);
			return true;
		}

		function ensureAltMirror(e) {
			const wantMirror = e.altKey && e.pointerType === 'mouse';
			if (wantMirror && realPointerCount() === 1 && primaryId != null && !mirrorActive) {
				const primary = pointers.get(primaryId);
				if (!primary) return;
				const origin = { x: primary.startX, y: primary.startY };
				const m = mirrorPoint(origin, { x: e.clientX, y: e.clientY });
				pointers.set(MIRROR_ID, {
					x: m.x,
					y: m.y,
					startX: origin.x,
					startY: origin.y
				});
				secondaryId = MIRROR_ID;
				mirrorActive = true;
				if (state === STATE.TRACKING || state === STATE.IDLE) {
					tryEnterPinch();
				}
			} else if (!wantMirror && mirrorActive) {
				pointers.delete(MIRROR_ID);
				if (secondaryId === MIRROR_ID) secondaryId = null;
				mirrorActive = false;
				if (state === STATE.PINCH && realPointerCount() < 2) {
					state = startEnode && isLeafEnode(startEnode) ? STATE.TRACKING : STATE.SLICE;
					pinchTarget = null;
					startDist = 0;
				}
			} else if (wantMirror && mirrorActive && primaryId != null) {
				const primary = pointers.get(primaryId);
				if (!primary) return;
				const origin = { x: primary.startX, y: primary.startY };
				const m = mirrorPoint(origin, { x: e.clientX, y: e.clientY });
				const virt = pointers.get(MIRROR_ID);
				if (virt) {
					virt.x = m.x;
					virt.y = m.y;
				}
			}
		}

		function updatePinch() {
			if (state !== STATE.PINCH || fired) return;
			const pair = getPair();
			if (!pair || !startDist) return;
			const ratio = dist(pair.a, pair.b) / startDist;
			if (ratio <= PINCH_RATIO && pinchTarget) {
				const axis = dominantAxis(pair.a, pair.b);
				emit({
					type: 'pinch',
					target: pinchTarget,
					axis: axis,
					points: [
						{ x: pair.a.x, y: pair.a.y },
						{ x: pair.b.x, y: pair.b.y }
					]
				});
			}
		}

		function finishSlice(endPt) {
			setBlade(bladePath, []);
			const axis = classifyAxisTol(startPt, endPt, SLICE_ANGLE_TOL);
			const len = dist(startPt, endPt);
			if (!(axis && len >= SLICE_MIN_LEN)) return;
			// Preferisci foglia attraversata (cn); fallback al più profondo generico.
			let target = deepestLeafAlongPath(points) || deepestEnodeAlongPath(points);
			if (target && !isLeafEnode(target)) {
				const all = target.querySelectorAll('[data-enode]');
				let deepest = null;
				for (let i = 0; i < all.length; i++) {
					if (!isLeafEnode(all[i])) continue;
					const r = all[i].getBoundingClientRect();
					if (segmentCrossesRect(startPt, endPt, r) || pointInRect(endPt, r) || pointInRect(startPt, r)) {
						deepest = deepestEnode(deepest, all[i]);
					}
				}
				if (deepest) target = deepest;
			}
			if (!target) return;
			const r = target.getBoundingClientRect();
			const startOut = !pointInRect(startPt, r);
			const through = oppositeSides(startPt, endPt, r) || segmentCrossesRect(startPt, endPt, r);
			const into = pointInRect(endPt, r) && segmentCrossesRect(startPt, endPt, r);
			// Taglio valido: parte fuori dalla foglia e la attraversa (o vi termina).
			if (startOut && (through || into || segmentCrossesRect(startPt, endPt, r))) {
				emit({
					type: 'slice',
					target: target,
					axis: axis,
					points: points.slice()
				});
			}
		}

		function onPointerDown(e) {
			if (e.pointerType === 'mouse' && e.button !== 0) return;

			// secondo dito reale → candidato pinch
			if (primaryId !== null && e.pointerId !== primaryId && !pointers.has(e.pointerId)) {
				pointers.set(e.pointerId, {
					x: e.clientX,
					y: e.clientY,
					startX: e.clientX,
					startY: e.clientY
				});
				secondaryId = e.pointerId;
				try { root.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
				if (state === STATE.TRACKING || state === STATE.SLICE) {
					if (!tryEnterPinch()) {
						// dita non nello stesso ENODE: resta sullo stato a un dito del primary
						pointers.delete(e.pointerId);
						secondaryId = null;
					}
				}
				return;
			}

			if (primaryId !== null) return;

			primaryId = e.pointerId;
			try { root.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
			startPt = { x: e.clientX, y: e.clientY };
			points = [{ x: e.clientX, y: e.clientY }];
			fired = false;
			pointers.set(e.pointerId, {
				x: e.clientX,
				y: e.clientY,
				startX: e.clientX,
				startY: e.clientY
			});

			startEnode = leafEnodeFromPoint(e.clientX, e.clientY)
				|| enodeFromPoint(e.clientX, e.clientY);
			const startLeaf = leafEnodeFromPoint(e.clientX, e.clientY);
			state = startLeaf ? STATE.TRACKING : STATE.SLICE;

			// ALT già premuto al down → avvia pinch desktop
			if (e.altKey && e.pointerType === 'mouse' && startLeaf) {
				ensureAltMirror(e);
			}
		}

		function onPointerMove(e) {
			const rec = pointers.get(e.pointerId);
			if (!rec && e.pointerId !== primaryId) return;
			if (rec) {
				rec.x = e.clientX;
				rec.y = e.clientY;
			}
			if (e.pointerId === primaryId || (mirrorActive && e.pointerId === primaryId)) {
				const pt = { x: e.clientX, y: e.clientY };
				points.push(pt);
			}

			ensureAltMirror(e);

			if (state === STATE.PINCH) {
				updatePinch();
			} else if (state === STATE.SLICE && e.pointerId === primaryId) {
				setBlade(bladePath, points);
			}
		}

		function onPointerUp(e) {
			const wasPrimary = e.pointerId === primaryId;
			pointers.delete(e.pointerId);
			if (e.pointerId === secondaryId) secondaryId = null;

			if (state === STATE.PINCH) {
				// se non ha già sparato (solo avvicinamento conta), al rilascio non emettere unpinch
				if (mirrorActive) {
					pointers.delete(MIRROR_ID);
					mirrorActive = false;
				}
				try { root.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
				if (realPointerCount() === 0) reset();
				return;
			}

			if (!wasPrimary || !startPt) {
				try { root.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
				if (realPointerCount() === 0) reset();
				return;
			}

			const endPt = { x: e.clientX, y: e.clientY };
			points.push(endPt);
			const len = dist(startPt, endPt);

			if (state === STATE.TRACKING) {
				if (len <= MOVE_SLOP_PX * 2) {
					const target = leafEnodeFromPoint(startPt.x, startPt.y)
						|| startEnode
						|| enodeFromPoint(endPt.x, endPt.y);
					if (target) {
						emit({
							type: 'tap',
							target: target,
							points: points.slice()
						});
					}
				}
			} else if (state === STATE.SLICE) {
				finishSlice(endPt);
			}

			try { root.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
			reset();
		}

		function onPointerCancel(e) {
			pointers.delete(e.pointerId);
			if (e.pointerId === primaryId || realPointerCount() === 0) reset();
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
				setBlade(bladePath, []);
				reset();
			},
			_debug: {
				classifyAxisTol: classifyAxisTol,
				dominantAxis: dominantAxis,
				deepestEnodeAlongPath: deepestEnodeAlongPath,
				deepestEnodeContainingBoth: deepestEnodeContainingBoth,
				PINCH_RATIO: PINCH_RATIO
			}
		};
	}

	global.INPUT2 = global.INPUT2 || {};
	global.INPUT2.bindGestureRecognizer = bindGestureRecognizer;
	global.INPUT2._gestureHelpers = {
		classifyAxisTol: classifyAxisTol,
		dominantAxis: dominantAxis,
		SLICE_ANGLE_TOL: SLICE_ANGLE_TOL,
		SLICE_MIN_LEN: SLICE_MIN_LEN,
		PINCH_RATIO: PINCH_RATIO
	};
})(typeof window !== 'undefined' ? window : globalThis);
