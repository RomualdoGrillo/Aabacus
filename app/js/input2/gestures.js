/**
 * input2/gestures.js — riconoscitore di gesti PURO (nessuna conoscenza del dominio matematico).
 * Pointer Events su #centralColumn; FSM esplicita; emette intent via callback.
 *
 * Intent:
 *   { type:'tap', target: Element[data-enode], points:[...] }
 *   { type:'slice', target: Element[data-enode], axis:'h'|'v', points:[...] }
 *   { type:'pinch', target: Element[data-enode], axis:'h'|'v', points:[...] }
 *   { type:'lasso', targets: Element[data-enode][], points:[...] }
 *   { type:'dnd', source: Element, target: Element, points:[...] }
 *
 * FSM (transizioni):
 *   IDLE  --down su foglia [data-enode]--> TRACKING   (tap | drag)
 *   IDLE  --down altrove (anche dentro contenitori non-foglia)--> PATH  (slice|lasso)
 *   TRACKING --move > slop-------> DRAG
 *   TRACKING --up ≤ slop---------> tap → IDLE
 *   TRACKING|PATH --2° dito------> PINCH (se stesso ENODE comune; altrimenti ignora 2°)
 *   PATH --up--------------------> slice | lasso | ∅ → IDLE
 *   DRAG --up su altro ENODE-----> dnd → IDLE
 *   DRAG --up fuori / no move----> ∅ → IDLE
 *   PINCH --ratio ≤ soglia-------> pinch → IDLE
 *
 * Nota start TRACKING vs PATH: il canvas è pieno di contenitori (and/eq) non-foglia;
 * "fuori dagli ENODE" per slice/lasso (§7.5) si interpreta operativamente come
 * "fuori da ogni foglia" — altrimenti slice/lasso non potrebbero mai partire.
 * Il DnD parte quindi da una foglia (cn/ci/…); drag di non-foglia = limite noto.
 *
 * Discriminazione PATH (slice vs lasso) — critico §7.3.1 / §7.5:
 *   - tratto quasi rettilineo (efficienza chord/path alta) che ATTRAVERSA un ENODE → slice
 *   - percorso con curvatura/ritorno che RACCHIUDE senza attraversare → lasso
 *   - se entrambi i criteri competono o il gesto è insufficiente → nessun intent
 *
 * Slice: attraversa; bersaglio = foglia più profonda attraversata.
 * Lasso: racchiude; selezione = fratelli nello stesso role (gruppo ≥2 preferito).
 * DnD: foglia + move oltre soglia; ghost; drop sul più profondo sotto il dito.
 * Pinch: due dita nello stesso ENODE che si avvicinano. Desktop: ALT+mouse = 2° dito.
 */
(function (global) {
	'use strict';

	const SLICE_ANGLE_TOL = 35;
	const MOVE_SLOP_PX = 10;
	const SLICE_MIN_LEN = 48;
	const SAMPLE_STEP_PX = 4;
	const PINCH_RATIO = 0.78;
	const MIRROR_ID = -1;
	/** chord/pathLen ≥ questo → quasi rettilineo (candidato slice). */
	const STRAIGHT_EFFICIENCY = 0.82;
	/** chord/pathLen ≤ questo, oppure ritorno vicino all'inizio → curvatura/chiusura (candidato lasso). */
	const CURVE_EFFICIENCY = 0.70;
	const LASSO_CLOSE_PX = 56;
	const LASSO_MIN_PATH = 80;
	const LASSO_MIN_TARGETS = 1;

	const STATE = {
		IDLE: 'idle',
		TRACKING: 'tracking', // un dito su ENODE → tap o attesa drag/pinch
		PATH: 'path',         // un dito fuori → candidato slice|lasso
		DRAG: 'drag',
		PINCH: 'pinch'
	};

	function dist(a, b) {
		return Math.hypot(a.x - b.x, a.y - b.y);
	}

	function pathLength(points) {
		let len = 0;
		if (!points || points.length < 2) return 0;
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

	/** Asse dominante (sempre h|v, niente zona morta). */
	function dominantAxis(a, b) {
		const ang = angleDegFromHorizontal(a, b);
		return ang < 45 ? 'h' : 'v';
	}

	function pointInRect(p, r) {
		return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
	}

	/** Ray-casting point-in-polygon (poligono chiuso implicitamente). */
	function pointInPolygon(p, poly) {
		if (!poly || poly.length < 3) return false;
		let inside = false;
		for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
			const xi = poly[i].x;
			const yi = poly[i].y;
			const xj = poly[j].x;
			const yj = poly[j].y;
			const intersect = ((yi > p.y) !== (yj > p.y)) &&
				(p.x < (xj - xi) * (p.y - yi) / ((yj - yi) || 1e-12) + xi);
			if (intersect) inside = !inside;
		}
		return inside;
	}

	function enodeFromPoint(x, y, excludeEl) {
		const el = document.elementFromPoint(x, y);
		if (!(el instanceof Element)) return null;
		const en = el.closest('[data-enode]');
		if (!en) return null;
		if (excludeEl && (en === excludeEl || excludeEl.contains(en) || en.contains(excludeEl))) {
			// se il hit è il source stesso, prova elementi sotto (ghost ha pointer-events:none)
			return null;
		}
		return en;
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

	function pathCrossesEnode(points, el) {
		if (!el || !points || points.length < 2) return false;
		const r = el.getBoundingClientRect();
		const start = points[0];
		const end = points[points.length - 1];
		if (oppositeSides(start, end, r)) return true;
		for (let i = 1; i < points.length; i++) {
			if (segmentCrossesRect(points[i - 1], points[i], r)) return true;
		}
		return false;
	}

	/**
	 * Fratelli nello stesso role racchiusi dal poligono.
	 * Preferisce il gruppo di fratelli (≥2) al livello più alto (profondità minima
	 * tra i gruppi multipli): così un lazo attorno a due addendi non collassa sul
	 * solo `plus` padre il cui centro è spesso dentro il percorso.
	 * Fallback: nodi al livello più alto racchiuso (anche singleton).
	 */
	function selectLassoTargets(points) {
		if (!points || points.length < 3) return [];
		const root = document.getElementById('canvasRole') ||
			document.getElementById('centralColumn') ||
			document.body;
		const all = root.querySelectorAll('[data-enode]');
		const enclosed = [];
		for (let i = 0; i < all.length; i++) {
			const el = all[i];
			if (el.closest('#palette, #prototypeContainer, #events')) continue;
			const r = el.getBoundingClientRect();
			if (r.width < 1 || r.height < 1) continue;
			const center = { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
			if (!pointInPolygon(center, points)) continue;
			// lazo non deve "tagliare" il nodo (altrimenti è territorio slice)
			if (pathCrossesEnode(points, el) && isLeafEnode(el)) continue;
			enclosed.push(el);
		}
		if (!enclosed.length) return [];

		/** @type {Map<Element, Element[]>} */
		const byParent = new Map();
		for (let i = 0; i < enclosed.length; i++) {
			const el = enclosed[i];
			const p = el.parentElement;
			if (!p) continue;
			if (!byParent.has(p)) byParent.set(p, []);
			byParent.get(p).push(el);
		}

		let bestMulti = [];
		let bestMultiDepth = Infinity;
		byParent.forEach(function (group) {
			if (group.length < 2) return;
			const d = depth(group[0]);
			if (d < bestMultiDepth || (d === bestMultiDepth && group.length > bestMulti.length)) {
				bestMultiDepth = d;
				bestMulti = group;
			}
		});
		if (bestMulti.length >= 2) return bestMulti;

		let minD = Infinity;
		for (let i = 0; i < enclosed.length; i++) {
			minD = Math.min(minD, depth(enclosed[i]));
		}
		const topLevel = enclosed.filter(function (el) { return depth(el) === minD; });
		let best = [];
		const byParentTop = new Map();
		for (let i = 0; i < topLevel.length; i++) {
			const el = topLevel[i];
			const p = el.parentElement;
			if (!p) continue;
			if (!byParentTop.has(p)) byParentTop.set(p, []);
			byParentTop.get(p).push(el);
		}
		byParentTop.forEach(function (group) {
			if (group.length > best.length) best = group;
		});
		return best;
	}

	function resolveSliceTarget(points, startPt, endPt) {
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
		if (!target) return null;
		const r = target.getBoundingClientRect();
		const startOut = !pointInRect(startPt, r);
		const through = oppositeSides(startPt, endPt, r) || segmentCrossesRect(startPt, endPt, r);
		const into = pointInRect(endPt, r) && segmentCrossesRect(startPt, endPt, r);
		if (startOut && (through || into || segmentCrossesRect(startPt, endPt, r))) {
			return target;
		}
		return null;
	}

	/**
	 * Classifica PATH → slice | lasso | null.
	 * Regola: rettilineo+attraversa → slice; curvatura+racchiude senza attraversare → lasso;
	 * ambiguo → null.
	 */
	function classifyPathIntent(startPt, endPt, points) {
		const chord = dist(startPt, endPt);
		const plen = pathLength(points);
		const efficiency = plen > 1e-6 ? chord / plen : 1;
		const axis = classifyAxisTol(startPt, endPt, SLICE_ANGLE_TOL);
		const closes = chord <= LASSO_CLOSE_PX && plen >= LASSO_MIN_PATH;
		const isStraight = efficiency >= STRAIGHT_EFFICIENCY && !!axis && chord >= SLICE_MIN_LEN;
		const isCurved = efficiency <= CURVE_EFFICIENCY || closes;

		const sliceTarget = resolveSliceTarget(points, startPt, endPt);
		const lassoTargets = selectLassoTargets(points);
		const hasLasso = isCurved && lassoTargets.length >= LASSO_MIN_TARGETS && plen >= LASSO_MIN_PATH;
		const hasSlice = isStraight && !!sliceTarget;

		if (hasSlice && hasLasso) return null; // ambiguo §7.3.1
		if (hasSlice) {
			return {
				type: 'slice',
				target: sliceTarget,
				axis: axis,
				points: points.slice()
			};
		}
		if (hasLasso) {
			return {
				type: 'lasso',
				targets: lassoTargets.slice(),
				points: points.slice()
			};
		}
		return null;
	}

	function createSvgPath(className) {
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

	function setSvgPath(pathEl, points, close) {
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
		if (close && points.length >= 3) d += 'Z';
		pathEl.setAttribute('d', d.trim());
	}

	function createHull() {
		let hull = document.getElementById('input2LassoHull');
		if (!hull) {
			const host = document.getElementById('centralColumn') || document.body;
			hull = document.createElement('div');
			hull.id = 'input2LassoHull';
			hull.className = 'input2-lasso-hull';
			host.appendChild(hull);
		}
		return hull;
	}

	function updateHull(hull, targets) {
		if (!hull) return;
		if (!targets || !targets.length) {
			hull.classList.remove('visible');
			return;
		}
		const host = hull.parentElement || document.body;
		const hostRect = host.getBoundingClientRect();
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (let i = 0; i < targets.length; i++) {
			const r = targets[i].getBoundingClientRect();
			minX = Math.min(minX, r.left);
			minY = Math.min(minY, r.top);
			maxX = Math.max(maxX, r.right);
			maxY = Math.max(maxY, r.bottom);
		}
		const pad = 8;
		hull.style.left = (minX - hostRect.left - pad) + 'px';
		hull.style.top = (minY - hostRect.top - pad) + 'px';
		hull.style.width = (maxX - minX + pad * 2) + 'px';
		hull.style.height = (maxY - minY + pad * 2) + 'px';
		hull.classList.add('visible');
	}

	/**
	 * @param {Object} opts
	 * @param {Element|string} [opts.root='#centralColumn']
	 * @param {function(Object):void} opts.onIntent
	 * @param {function(Element, Element):boolean} [opts.isValidDnDTarget] — opzionale, per highlight drop
	 * @returns {{ destroy: function():void }}
	 */
	function bindGestureRecognizer(opts) {
		const root = typeof opts.root === 'string'
			? document.querySelector(opts.root)
			: (opts.root || document.getElementById('centralColumn'));
		const onIntent = opts.onIntent;
		const isValidDnDTarget = typeof opts.isValidDnDTarget === 'function'
			? opts.isValidDnDTarget
			: null;
		if (!root || typeof onIntent !== 'function') {
			throw new Error('bindGestureRecognizer: root e onIntent richiesti');
		}

		const bladePath = createSvgPath('input2-blade');
		const lassoPath = createSvgPath('input2-lasso');
		const hull = createHull();
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
		let dragSource = null;
		let ghostEl = null;
		let dndOverEl = null;

		function clearDnDHighlight() {
			if (dndOverEl) {
				dndOverEl.classList.remove('input2-dnd-target');
				dndOverEl = null;
			}
		}

		function setDnDHighlight(el) {
			if (dndOverEl === el) return;
			clearDnDHighlight();
			if (el) {
				el.classList.add('input2-dnd-target');
				dndOverEl = el;
			}
		}

		function removeGhost() {
			if (ghostEl && ghostEl.parentNode) ghostEl.parentNode.removeChild(ghostEl);
			ghostEl = null;
		}

		function ensureGhost(source, x, y) {
			if (!source) return;
			if (!ghostEl) {
				ghostEl = source.cloneNode(true);
				ghostEl.classList.add('input2-dnd-ghost');
				ghostEl.removeAttribute('id');
				ghostEl.style.pointerEvents = 'none';
				document.body.appendChild(ghostEl);
			}
			const r = source.getBoundingClientRect();
			ghostEl.style.width = r.width + 'px';
			ghostEl.style.height = r.height + 'px';
			ghostEl.style.left = (x - r.width / 2) + 'px';
			ghostEl.style.top = (y - r.height / 2) + 'px';
		}

		function clearPathFeedback() {
			setSvgPath(bladePath, []);
			setSvgPath(lassoPath, []);
			updateHull(hull, []);
		}

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
			dragSource = null;
			removeGhost();
			clearDnDHighlight();
			clearPathFeedback();
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
			clearPathFeedback();
			removeGhost();
			clearDnDHighlight();
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
				if (state === STATE.TRACKING || state === STATE.IDLE || state === STATE.PATH) {
					tryEnterPinch();
				}
			} else if (!wantMirror && mirrorActive) {
				pointers.delete(MIRROR_ID);
				if (secondaryId === MIRROR_ID) secondaryId = null;
				mirrorActive = false;
				if (state === STATE.PINCH && realPointerCount() < 2) {
					state = startEnode ? STATE.TRACKING : STATE.PATH;
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

		function updatePathFeedback() {
			if (state !== STATE.PATH || !startPt || points.length < 2) return;
			const endPt = points[points.length - 1];
			const chord = dist(startPt, endPt);
			const plen = pathLength(points);
			const efficiency = plen > 1e-6 ? chord / plen : 1;
			const closes = chord <= LASSO_CLOSE_PX && plen >= LASSO_MIN_PATH;
			const curved = efficiency <= CURVE_EFFICIENCY || closes;
			if (curved) {
				setSvgPath(bladePath, []);
				setSvgPath(lassoPath, points, true);
				updateHull(hull, selectLassoTargets(points));
			} else {
				setSvgPath(lassoPath, []);
				updateHull(hull, []);
				setSvgPath(bladePath, points);
			}
		}

		function enterDrag(x, y) {
			state = STATE.DRAG;
			dragSource = startEnode;
			clearPathFeedback();
			ensureGhost(dragSource, x, y);
		}

		function updateDrag(x, y) {
			if (!dragSource) return;
			ensureGhost(dragSource, x, y);
			const under = enodeFromPoint(x, y);
			let candidate = under;
			// escludi source e suoi antenati/discendenti come drop
			if (candidate && (candidate === dragSource || dragSource.contains(candidate) || candidate.contains(dragSource))) {
				candidate = null;
			}
			if (candidate && isValidDnDTarget) {
				if (!isValidDnDTarget(dragSource, candidate)) candidate = null;
			}
			setDnDHighlight(candidate);
		}

		function finishPath(endPt) {
			clearPathFeedback();
			const intent = classifyPathIntent(startPt, endPt, points);
			if (intent) emit(intent);
		}

		function finishDrag(endPt) {
			removeGhost();
			clearDnDHighlight();
			if (!dragSource || !startPt) return;
			const moved = dist(startPt, endPt);
			if (moved <= MOVE_SLOP_PX * 2) return;
			const under = enodeFromPoint(endPt.x, endPt.y);
			if (!under) return;
			if (under === dragSource || dragSource.contains(under) || under.contains(dragSource)) return;
			emit({
				type: 'dnd',
				source: dragSource,
				target: under,
				points: points.slice()
			});
		}

		function onPointerDown(e) {
			if (e.pointerType === 'mouse' && e.button !== 0) return;

			// secondo dito reale → candidato pinch (non da DRAG)
			if (primaryId !== null && e.pointerId !== primaryId && !pointers.has(e.pointerId)) {
				if (state === STATE.DRAG) return;
				pointers.set(e.pointerId, {
					x: e.clientX,
					y: e.clientY,
					startX: e.clientX,
					startY: e.clientY
				});
				secondaryId = e.pointerId;
				try { root.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
				if (state === STATE.TRACKING || state === STATE.PATH) {
					if (!tryEnterPinch()) {
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

			// TRACKING solo su foglia: tap/dnd. Altrimenti PATH (slice|lasso),
			// anche se il punto cade in un contenitore and/eq non-foglia.
			const startLeaf = leafEnodeFromPoint(e.clientX, e.clientY);
			startEnode = startLeaf || enodeFromPoint(e.clientX, e.clientY);
			state = startLeaf ? STATE.TRACKING : STATE.PATH;

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
			if (e.pointerId === primaryId) {
				points.push({ x: e.clientX, y: e.clientY });
			}

			ensureAltMirror(e);

			if (state === STATE.PINCH) {
				updatePinch();
			} else if (state === STATE.TRACKING && e.pointerId === primaryId && startPt) {
				const moved = dist(startPt, { x: e.clientX, y: e.clientY });
				if (moved > MOVE_SLOP_PX && startEnode) {
					enterDrag(e.clientX, e.clientY);
					updateDrag(e.clientX, e.clientY);
				}
			} else if (state === STATE.DRAG && e.pointerId === primaryId) {
				updateDrag(e.clientX, e.clientY);
			} else if (state === STATE.PATH && e.pointerId === primaryId) {
				updatePathFeedback();
			}
		}

		function onPointerUp(e) {
			const wasPrimary = e.pointerId === primaryId;
			pointers.delete(e.pointerId);
			if (e.pointerId === secondaryId) secondaryId = null;

			if (state === STATE.PINCH) {
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
			} else if (state === STATE.PATH) {
				finishPath(endPt);
			} else if (state === STATE.DRAG) {
				finishDrag(endPt);
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
				reset();
			},
			_debug: {
				classifyAxisTol: classifyAxisTol,
				dominantAxis: dominantAxis,
				classifyPathIntent: classifyPathIntent,
				selectLassoTargets: selectLassoTargets,
				pointInPolygon: pointInPolygon,
				deepestEnodeAlongPath: deepestEnodeAlongPath,
				deepestEnodeContainingBoth: deepestEnodeContainingBoth,
				PINCH_RATIO: PINCH_RATIO,
				STATE: STATE
			}
		};
	}

	global.INPUT2 = global.INPUT2 || {};
	global.INPUT2.bindGestureRecognizer = bindGestureRecognizer;
	global.INPUT2._gestureHelpers = {
		classifyAxisTol: classifyAxisTol,
		dominantAxis: dominantAxis,
		pointInPolygon: pointInPolygon,
		selectLassoTargets: selectLassoTargets,
		classifyPathIntent: classifyPathIntent,
		SLICE_ANGLE_TOL: SLICE_ANGLE_TOL,
		SLICE_MIN_LEN: SLICE_MIN_LEN,
		PINCH_RATIO: PINCH_RATIO,
		STRAIGHT_EFFICIENCY: STRAIGHT_EFFICIENCY,
		CURVE_EFFICIENCY: CURVE_EFFICIENCY
	};
})(typeof window !== 'undefined' ? window : globalThis);
