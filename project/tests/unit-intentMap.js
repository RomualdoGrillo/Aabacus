#!/usr/bin/env node
/**
 * Unit test Node-puro per app/js/input2/intentMap.js
 * Uso: node project/tests/unit-intentMap.js
 * Exit 0 = PASS, 1 = FAIL.
 */
'use strict';

const path = require('path');
const intentMap = require(path.join(__dirname, '../../app/js/input2/intentMap.js'));

let passed = 0;
let failed = 0;
const results = [];

function assert(name, cond, detail) {
	if (cond) {
		passed++;
		results.push({ name: name, ok: true, detail: detail || '' });
		console.log('PASS  ' + name + (detail ? ' — ' + detail : ''));
	} else {
		failed++;
		results.push({ name: name, ok: false, detail: detail || '' });
		console.log('FAIL  ' + name + (detail ? ' — ' + detail : ''));
	}
}

function aName(a) {
	return a && (typeof a === 'string' ? a : a.name);
}

function actionKey(a) {
	if (!a) return '';
	const n = typeof a === 'string' ? a : a.name;
	const v = typeof a === 'object' && a.val != null ? a.val : '';
	return v ? n + ':' + v : n;
}

const table = intentMap.DEFAULT_TABLE;

// ——— 1) risoluzione trigger gesto ———
(function () {
	const slashV = intentMap.resolveIntent({ type: 'slice', axis: 'v' }, table);
	assert(
		'resolveIntent slice.v → slashVert / decomposeInASum',
		slashV && slashV.trigger === 'slashVert' && aName(slashV.actions[0]) === 'decomposeInASum',
		slashV && slashV.trigger
	);

	const slashH = intentMap.resolveIntent({ type: 'slice', axis: 'h' }, table);
	assert(
		'resolveIntent slice.h → slashHor / timesAbsorbingEl→decomposeInAProduct',
		slashH && slashH.trigger === 'slashHor' && aName(slashH.actions[0]) === 'timesAbsorbingEl' &&
			aName(slashH.actions[1]) === 'decomposeInAProduct',
		slashH && slashH.trigger
	);

	const pinchH = intentMap.resolveIntent({ type: 'pinch', axis: 'h' }, table);
	assert(
		'resolveIntent pinch.h → pinchHor try-list reali',
		pinchH && pinchH.trigger === 'pinchHor' &&
			pinchH.actions.map(actionKey).join(',') === 'compose,AndNeutral:ltr,timesAbsorbingEl:ltr',
		pinchH && pinchH.actions.map(actionKey).join(',')
	);

	const tap = intentMap.resolveIntent({ type: 'tap' }, table);
	assert(
		'resolveIntent tap → toggleSelect (system)',
		tap && tap.trigger === 'tap' && tap.system === true && aName(tap.actions[0]) === 'toggleSelect'
	);
})();

// ——— 2) alias tastiera ———
(function () {
	const right = intentMap.resolveIntent({ type: 'key', key: 'ArrowRight' }, table);
	assert(
		'alias ArrowRight → slashVert / decomposeInASum (legacy addendi)',
		right && right.alias === 'ArrowRight' && right.trigger === 'slashVert' &&
			aName(right.actions[0]) === 'decomposeInASum',
		right && (right.alias + '/' + right.trigger)
	);

	const up = intentMap.resolveIntent({ type: 'key', key: 'ArrowUp' }, table);
	assert(
		'alias ArrowUp → slashHor (legacy fattori)',
		up && up.alias === 'ArrowUp' && up.trigger === 'slashHor' &&
			aName(up.actions[1]) === 'decomposeInAProduct',
		up && (up.alias + '/' + up.trigger)
	);

	const down = intentMap.resolveIntent({ type: 'key', key: 'ArrowDown' }, table);
	assert(
		'alias ArrowDown → pinchHor',
		down && down.trigger === 'pinchHor',
		down && down.trigger
	);

	const modZ = intentMap.resolveIntent({ type: 'key', key: 'z', ctrlKey: true }, table);
	assert(
		'alias ctrl+z → undo system',
		modZ && aName(modZ.actions[0]) === 'undo' && modZ.system === true
	);

	const metaZ = intentMap.resolveIntent({ type: 'key', key: 'z', metaKey: true }, table);
	assert(
		'alias cmd+z → undo system',
		metaZ && aName(metaZ.actions[0]) === 'undo' && metaZ.system === true
	);

	const shiftL = intentMap.resolveIntent({ type: 'key', key: 'L', shiftKey: true }, table);
	assert(
		'alias Shift+L → load',
		shiftL && aName(shiftL.actions[0]) === 'load' && shiftL.system === true
	);

	const p = intentMap.resolveIntent({ type: 'key', key: 'p' }, table);
	assert(
		'alias p → plusAssociate ltr (primo con val)',
		p && p.targetSource === 'selected' &&
			p.actions[0] && p.actions[0].name === 'plusAssociate' && p.actions[0].val === 'ltr',
		p && actionKey(p.actions[0])
	);
})();

// ——— 3) try-list salta azioni non registrate / non disponibili ———
(function () {
	const pinch = intentMap.resolveIntent({ type: 'pinch', axis: 'v' }, table);
	const availResult = intentMap.computeAvailability(table, {
		hasCanvasCi: function (name) { return name === 'compose'; },
		isRegistered: function (name) {
			return name === 'compose' || name === 'decomposeInASum' || name === 'decomposeInAProduct';
		}
	});
	const avail = availResult.availability;
	assert(
		'computeAvailability: compose disponibile, AndNeutral no',
		avail.compose === true && avail.AndNeutral === false && avail.timesAbsorbingEl === false,
		JSON.stringify({ compose: avail.compose, AndNeutral: avail.AndNeutral })
	);
	assert(
		'unresolved include AndNeutral / plusAssociate…',
		availResult.unresolved.indexOf('AndNeutral') >= 0 &&
			availResult.unresolved.indexOf('plusAssociate') >= 0,
		availResult.unresolved.join(',')
	);

	const tryList = intentMap.listTryActions(pinch, avail);
	assert(
		'try-list pinch salta non registrate → solo compose (oggetto)',
		tryList.length === 1 && tryList[0].name === 'compose' && tryList[0].val === undefined,
		tryList.map(actionKey).join(',')
	);

	const next = intentMap.nextAction(pinch, avail);
	assert(
		'nextAction pinch → {name:compose}',
		next && next.name === 'compose',
		next && actionKey(next)
	);
})();

// ——— 4) applyMmlsOverrides rifiuta system ———
(function () {
	const res = intentMap.applyMmlsOverrides(table, {
		'Mod+z': { actions: ['hacked'] },
		'pinchHor': { actions: ['compose'] }
	});
	assert(
		'override system Mod+z → violazione',
		res.violations.indexOf('Mod+z') >= 0,
		res.violations.join(',')
	);
	const undoRow = res.table.find(function (r) { return r.alias === 'Mod+z'; });
	assert(
		'system undo invariato',
		undoRow && aName(undoRow.actions[0]) === 'undo',
		undoRow && undoRow.actions.map(actionKey).join(',')
	);
	const pinchRow = res.table.find(function (r) { return r.trigger === 'pinchHor'; });
	assert(
		'override didattico pinchHor accettato (stringa→{name})',
		pinchRow && pinchRow.actions.length === 1 && pinchRow.actions[0].name === 'compose',
		pinchRow && pinchRow.actions.map(actionKey).join(',')
	);
})();

// ——— 4b) override .mmls con val estratto ———
(function () {
	const res = intentMap.applyMmlsOverrides(table, {
		'p': {
			actions: [
				{ name: 'plusAssociate', val: 'rtl' },
				{ name: 'timesAssociate', val: 'ltr' }
			]
		}
	});
	const pRow = res.table.find(function (r) { return r.alias === 'p'; });
	assert(
		'override .mmls conserva val (plusAssociate rtl)',
		pRow && pRow.actions.length === 2 &&
			pRow.actions[0].name === 'plusAssociate' && pRow.actions[0].val === 'rtl' &&
			pRow.actions[1].name === 'timesAssociate' && pRow.actions[1].val === 'ltr',
		pRow && pRow.actions.map(actionKey).join(',')
	);
})();

// ——— 5) computeAvailability ci presente/assente ———
(function () {
	const res = intentMap.computeAvailability(table, {
		hasCanvasCi: function (name) {
			return name === 'decomposeInASum';
		},
		isRegistered: function (name) {
			return name === 'decomposeInASum' || name === 'decomposeInAProduct' || name === 'compose';
		}
	});
	assert(
		'ci presente → decomposeInASum available',
		res.availability.decomposeInASum === true
	);
	assert(
		'ci assente → decomposeInAProduct unavailable',
		res.availability.decomposeInAProduct === false
	);
	assert(
		'system undo sempre available',
		res.availability.undo === true
	);
})();

// ——— 6) nessun riferimento DOM nel modulo (smoke: API definite) ———
(function () {
	assert(
		'API pure esportate',
		typeof intentMap.resolveIntent === 'function' &&
			typeof intentMap.nextAction === 'function' &&
			typeof intentMap.applyMmlsOverrides === 'function' &&
			typeof intentMap.computeAvailability === 'function' &&
			typeof intentMap.normalizeAction === 'function' &&
			Array.isArray(intentMap.DEFAULT_TABLE)
	);
})();

console.log('');
console.log('Risultato: ' + passed + ' PASS, ' + failed + ' FAIL');
process.exit(failed > 0 ? 1 : 0);
