/**
 * Unit test (Node) per helper selezione/lazo input2.
 * Esegue: node project/tests/unit-input2-selection.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
	if (cond) {
		passed++;
		console.log('  PASS', msg);
	} else {
		failed++;
		console.error('  FAIL', msg);
	}
}

function loadGesturesAndMap() {
	const sandbox = {
		window: {},
		document: {
			getElementById: () => null,
			querySelector: () => null,
			querySelectorAll: () => [],
			readyState: 'complete',
			addEventListener: () => {}
		},
		console
	};
	sandbox.globalThis = sandbox;
	sandbox.global = sandbox;
	sandbox.window = sandbox;
	for (const rel of ['app/js/input2/gestures.js', 'app/js/input2/intentMap.js']) {
		const code = fs.readFileSync(path.join(__dirname, '../../', rel), 'utf8');
		vm.runInNewContext(code, sandbox, { filename: rel });
	}
	return sandbox.INPUT2;
}

/** Mini DOM sufficiente a esercitare filterSiblingSet / applySelect. */
function makeMiniDom() {
	function makeEl(tag, attrs) {
		const classSet = new Set();
		const children = [];
		const el = {
			nodeType: 1,
			tagName: tag.toUpperCase(),
			attrs: Object.assign({}, attrs || {}),
			parentElement: null,
			children,
			classList: {
				_set: classSet,
				add: function () {
					for (let i = 0; i < arguments.length; i++) classSet.add(arguments[i]);
				},
				remove: function () {
					for (let i = 0; i < arguments.length; i++) classSet.delete(arguments[i]);
				},
				contains: function (c) { return classSet.has(c); },
				toggle: function (c) {
					if (classSet.has(c)) classSet.delete(c); else classSet.add(c);
				}
			},
			matches: function (sel) {
				if (sel === '[data-enode]') return !!el.attrs['data-enode'];
				if (sel.startsWith('#')) return el.attrs.id === sel.slice(1);
				const parts = sel.split(',').map(function (s) { return s.trim(); });
				return parts.some(function (p) {
					if (p.startsWith('.')) return classSet.has(p.slice(1));
					return false;
				});
			},
			closest: function (sel) {
				let n = el;
				while (n) {
					if (n.matches && n.matches(sel)) return n;
					n = n.parentElement;
				}
				return null;
			},
			querySelectorAll: function (sel) {
				const out = [];
				function walk(n) {
					for (let i = 0; i < n.children.length; i++) {
						const c = n.children[i];
						if (sel === '[data-enode].selected, [data-enode].unselected') {
							if (c.attrs['data-enode'] && (c.classList.contains('selected') || c.classList.contains('unselected'))) {
								out.push(c);
							}
						} else if (sel === '[data-enode]') {
							if (c.attrs['data-enode']) out.push(c);
						}
						walk(c);
					}
				}
				walk(el);
				return out;
			},
			getAttribute: function (k) { return el.attrs[k]; },
			setAttribute: function (k, v) { el.attrs[k] = v; }
		};
		if (attrs && attrs.class) {
			attrs.class.split(/\s+/).forEach(function (c) { if (c) classSet.add(c); });
		}
		return el;
	}

	function append(parent, child) {
		child.parentElement = parent;
		parent.children.push(child);
		return child;
	}

	const canvasRole = makeEl('div', { id: 'canvasRole' });
	const role = append(canvasRole, makeEl('div', { class: 'ol_role' }));
	const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
	const nodes = {};
	ids.forEach(function (id) {
		nodes[id] = append(role, makeEl('div', { 'data-enode': 'ci', id: id }));
	});

	const doc = {
		getElementById: function (id) {
			if (id === 'canvasRole') return canvasRole;
			return nodes[id] || null;
		},
		querySelectorAll: function (sel) {
			return canvasRole.querySelectorAll(sel);
		},
		readyState: 'complete',
		addEventListener: function () {}
	};

	return { document: doc, canvasRole: canvasRole, nodes: nodes };
}

console.log('unit-input2-selection');

const INPUT2 = loadGesturesAndMap();
const H = INPUT2._gestureHelpers;

{
	const square = [
		{ x: 0, y: 0 },
		{ x: 100, y: 0 },
		{ x: 100, y: 100 },
		{ x: 0, y: 100 }
	];
	assert(H.pointInPolygon({ x: 50, y: 50 }, square), 'centro dentro poligono');
	assert(!H.pointInPolygon({ x: 150, y: 50 }, square), 'fuori a destra');
	assert(!H.pointInPolygon({ x: -1, y: 50 }, square), 'fuori a sinistra');
}

{
	const open = [
		{ x: 0, y: 0 },
		{ x: 40, y: 10 },
		{ x: 80, y: 0 },
		{ x: 80, y: 40 }
	];
	assert(!H.isNearlyClosed(open, 20), 'path aperto non chiuso');
	const closed = open.concat([{ x: 5, y: 5 }]);
	assert(H.isNearlyClosed(closed, 20), 'path quasi chiuso');
}

{
	const straight = [
		{ x: 0, y: 0 },
		{ x: 50, y: 1 },
		{ x: 100, y: 0 }
	];
	assert(H.maxDeviationFromChord(straight) < 5, 'deviazione retta bassa');
	const curve = [
		{ x: 0, y: 0 },
		{ x: 50, y: 80 },
		{ x: 100, y: 0 }
	];
	assert(H.maxDeviationFromChord(curve) > 40, 'deviazione curva alta');
}

{
	const lasso = INPUT2.lookupIntent({ type: 'lasso' });
	assert(lasso && lasso.name === 'selectSiblings', 'lasso → selectSiblings');
	const tap = INPUT2.lookupIntent({ type: 'tap' });
	assert(tap && tap.name === 'select', 'tap → select');
	const sliceV = INPUT2.lookupIntent({ type: 'slice', axis: 'v' });
	assert(sliceV && sliceV.name === 'decomposeInASum', 'slice.v → decomposeInASum');
}

{
	const mini = makeMiniDom();
	const sandbox = {
		window: { INPUT2: {} },
		document: mini.document,
		console: console,
		$: function () { return { length: 0 }; },
		ssnapshot: (function () {
			function ssnapshot() {}
			ssnapshot.take = function () {};
			return ssnapshot;
		})(),
		preloadAll: function () {},
		preloadPath: '',
		TryOnePropertyByName: function () { return {}; },
		postApplyAfterProperty: function () {},
		RefreshEmptyInfixBraketsGlued: function () {},
		ENODEapplyFunctToTree: function () {},
		ENODERefreshAsymmEq: function () {},
		isDefinition: function () { return false; }
	};
	sandbox.globalThis = sandbox.window;
	sandbox.global = sandbox.window;
	sandbox.window.document = mini.document;
	// Intent map + boot (boot registra _selectionHelpers)
	vm.runInNewContext(
		fs.readFileSync(path.join(__dirname, '../../app/js/input2/intentMap.js'), 'utf8'),
		sandbox,
		{ filename: 'intentMap.js' }
	);
	vm.runInNewContext(
		fs.readFileSync(path.join(__dirname, '../../app/js/input2/boot2.js'), 'utf8'),
		sandbox,
		{ filename: 'boot2.js' }
	);

	const Sel = sandbox.window.INPUT2._selectionHelpers;
	const a = mini.nodes.a;
	const b = mini.nodes.b;
	const e = mini.nodes.e;
	const f = mini.nodes.f;

	const chosen = Sel.filterSiblingSet([e, f]);
	assert(chosen.length === 2, 'filterSiblingSet: solo 2 target');
	assert(chosen.indexOf(e) !== -1 && chosen.indexOf(f) !== -1, 'filterSiblingSet: e ed f');
	assert(chosen.indexOf(a) === -1 && chosen.indexOf(b) === -1, 'filterSiblingSet: non aggiunge fratelli non colpiti');

	Sel.selectSiblings([e, f]);
	assert(e.classList.contains('selected') && f.classList.contains('selected'), 'selectSiblings marca e,f');
	assert(!a.classList.contains('selected'), 'selectSiblings non marca a');

	Sel.applySelect({ target: a, metaKey: false, ctrlKey: false, shiftKey: false });
	assert(a.classList.contains('selected'), 'tap seleziona a');
	assert(!e.classList.contains('selected') && !f.classList.contains('selected'), 'tap plain deseleziona e,f');

	Sel.applySelect({ target: b, metaKey: true, ctrlKey: false, shiftKey: false });
	assert(a.classList.contains('selected') && b.classList.contains('selected'), 'Cmd+tap aggiunge b');
}

console.log('\nRisultato:', passed, 'PASS,', failed, 'FAIL');
process.exit(failed ? 1 : 0);
