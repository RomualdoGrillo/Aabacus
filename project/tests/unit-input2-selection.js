/**
 * Unit test (Node): selectionManager + MAIN2 (tap deseleziona / lazo multi).
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

/** Mini DOM sufficiente a esercitare selectionManager via MAIN2. */
function makeMiniDom() {
	function makeEl(tag, attrs) {
		const classSet = new Set();
		const children = [];
		const el = {
			nodeType: 1,
			tagName: tag.toUpperCase(),
			attrs: Object.assign({}, attrs || {}),
			parentElement: null,
			children: children,
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
						if (sel === '[data-enode]') {
							if (c.attrs['data-enode']) out.push(c);
						} else if (sel === '[data-enode].selected' || sel.indexOf('.selected') !== -1) {
							if (c.attrs['data-enode'] && c.classList.contains('selected')) out.push(c);
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
			if (sel === '#canvasRole [data-enode].selected') {
				return canvasRole.querySelectorAll('[data-enode].selected');
			}
			return canvasRole.querySelectorAll(sel);
		},
		readyState: 'complete',
		addEventListener: function () {}
	};

	return { document: doc, canvasRole: canvasRole, nodes: nodes };
}

console.log('unit-input2-selection');

{
	const gesturesCode = fs.readFileSync(path.join(__dirname, '../../app/js/input2/gestures.js'), 'utf8');
	const sandbox = {
		window: {},
		document: {
			getElementById: () => null,
			querySelector: () => null,
			querySelectorAll: () => [],
			elementFromPoint: () => null,
			readyState: 'complete',
			addEventListener: () => {}
		},
		console: console
	};
	sandbox.globalThis = sandbox;
	sandbox.global = sandbox;
	sandbox.window = sandbox;
	vm.runInNewContext(gesturesCode, sandbox, { filename: 'gestures.js' });
	const H = sandbox.INPUT2._gestureHelpers;
	const square = [
		{ x: 0, y: 0 },
		{ x: 100, y: 0 },
		{ x: 100, y: 100 },
		{ x: 0, y: 100 }
	];
	assert(H.pointInPolygon({ x: 50, y: 50 }, square), 'centro dentro poligono');
	assert(!H.pointInPolygon({ x: 150, y: 50 }, square), 'fuori a destra');

	const enNoLasso = H.normalizeEnabledIntents({
		tap: true, lasso: false, dnd: true, slice: true, pinch: true,
		slashHor: true, slashVert: true, pinchHor: true, pinchVert: true
	});
	assert(H.isIntentEnabled(enNoLasso, 'lasso') === false, 'isIntentEnabled lasso off');
	assert(H.isIntentEnabled(enNoLasso, 'tap') === true, 'isIntentEnabled tap on');
	assert(H.isIntentEnabled(enNoLasso, 'slice', 'h') === true, 'isIntentEnabled slice.h on');
}

{
	const mini = makeMiniDom();

	function wrap(elOrList) {
		const list = Array.isArray(elOrList) ? elOrList : (elOrList ? [elOrList] : []);
		const api = {
			length: list.length,
			0: list[0],
			attr: function (k) { return list[0] ? list[0].getAttribute(k) : undefined; },
			hasClass: function (c) { return !!(list[0] && list[0].classList.contains(c)); },
			addClass: function (c) {
				list.forEach(function (el) { el.classList.add(c); });
				return api;
			},
			removeClass: function (c) {
				list.forEach(function (el) { el.classList.remove(c); });
				return api;
			},
			find: function (sel) {
				const out = [];
				list.forEach(function (el) {
					const found = el.querySelectorAll(sel);
					for (let i = 0; i < found.length; i++) out.push(found[i]);
				});
				return wrap(out);
			},
			closest: function (sel) {
				if (!list[0] || !list[0].closest) return wrap([]);
				const c = list[0].closest(sel);
				return wrap(c ? [c] : []);
			},
			off: function () { return api; },
			on: function () { return api; }
		};
		return api;
	}

	function $(arg) {
		if (typeof arg === 'string') {
			if (arg === '[data-enode]') {
				return wrap(mini.document.querySelectorAll('[data-enode]'));
			}
			if (arg === '#canvasRole') return wrap([mini.canvasRole]);
			if (arg === 'body') return wrap([]);
			return wrap([]);
		}
		if (arg && arg.nodeType === 1) return wrap([arg]);
		return wrap([]);
	}

	const sandbox = {
		window: { INPUT2: {} },
		document: mini.document,
		console: console,
		$: $,
		GLBsettings: { tool: 'autoAdapt' },
		getDefaultTool: function () { return wrap([]); },
		ssnapshot: (function () {
			function ssnapshot() {}
			ssnapshot.take = function () {};
			ssnapshot.undo = function () {};
			return ssnapshot;
		})(),
		preloadAll: function () {},
		preloadPath: '',
		TryOnePropertyByName: function () { return {}; },
		postApplyAfterProperty: function () {},
		RefreshEmptyInfixBraketsGlued: function () {},
		ENODEapplyFunctToTree: function () {},
		ENODERefreshAsymmEq: function () {},
		isDefinition: function () { return false; },
		listDnDProperties: function () { return []; },
		hookSettingsToInterface: function () {},
		loadFileConvert: function () {},
		debugMode: false
	};
	sandbox.globalThis = sandbox.window;
	sandbox.global = sandbox.window;
	sandbox.window.document = mini.document;
	sandbox.window.$ = $;
	sandbox.window.GLBsettings = sandbox.GLBsettings;
	sandbox.window.getDefaultTool = sandbox.getDefaultTool;
	// stub jQuery selectors usati a boot (settings, file input)
	const $orig = $;
	sandbox.$ = function (arg) {
		if (arg === '#settings' || arg === '#fileToLoad' || (arg && arg.jquery)) return wrap([]);
		return $orig(arg);
	};
	sandbox.window.$ = sandbox.$;

	vm.runInNewContext(
		fs.readFileSync(path.join(__dirname, '../../app/js/selectionManager.js'), 'utf8'),
		sandbox,
		{ filename: 'selectionManager.js' }
	);
	vm.runInNewContext(
		fs.readFileSync(path.join(__dirname, '../../app/js/UserEvToFunctCall2.js'), 'utf8'),
		sandbox,
		{ filename: 'UserEvToFunctCall2.js' }
	);
	// evita boot completo: document ready already complete, ma bindGestureRecognizer manca → ok
	vm.runInNewContext(
		fs.readFileSync(path.join(__dirname, '../../app/js/MAIN2.js'), 'utf8'),
		sandbox,
		{ filename: 'MAIN2.js' }
	);

	const Sel = sandbox.window.INPUT2._selectionHelpers;
	const a = mini.nodes.a;
	const b = mini.nodes.b;
	const e = mini.nodes.e;
	const f = mini.nodes.f;

	assert(typeof Sel.toggleSelect === 'function', 'toggleSelect esportato');
	assert(typeof Sel.selectSiblings === 'function', 'selectSiblings esportato');
	assert(typeof sandbox.window.INPUT2.clickHandler === 'function', 'clickHandler tied/untied esportato');

	Sel.selectSiblings([e, f]);
	assert(e.classList.contains('selected') && f.classList.contains('selected'), 'selectSiblings marca e,f via selectionManager');
	assert(!a.classList.contains('selected'), 'selectSiblings non marca a');

	Sel.toggleSelect({ target: a, metaKey: false, ctrlKey: false, shiftKey: false });
	assert(a.classList.contains('selected'), 'tap seleziona a via selectionManager');
	assert(!e.classList.contains('selected') && !f.classList.contains('selected'), 'tap plain deseleziona e,f via selectionManager');

	Sel.toggleSelect({ target: b, metaKey: true, ctrlKey: false, shiftKey: false });
	assert(a.classList.contains('selected') && b.classList.contains('selected'), 'Cmd+tap aggiunge b via selectionManager');

	// dispatchIntent path (toggleSelect dalla tabella)
	sandbox.window.INPUT2.dispatchIntent({
		type: 'tap',
		target: e,
		metaKey: false,
		ctrlKey: false,
		shiftKey: false
	});
	assert(e.classList.contains('selected'), 'dispatchIntent tap → e selected');
	assert(!a.classList.contains('selected') && !b.classList.contains('selected'), 'dispatchIntent tap deseleziona a,b');
}

console.log('\nRisultato:', passed, 'PASS,', failed, 'FAIL');
process.exit(failed ? 1 : 0);
