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

const table = intentMap.DEFAULT_TABLE;

// ——— 1) risoluzione trigger gesto ———
(function () {
	const slashV = intentMap.resolveIntent({ type: 'slice', axis: 'v' }, table);
	assert(
		'resolveIntent slice.v → slashVert',
		slashV && slashV.trigger === 'slashVert' && slashV.actions[0] === 'decomposeInASum',
		slashV && slashV.trigger
	);

	const slashH = intentMap.resolveIntent({ type: 'slice', axis: 'h' }, table);
	assert(
		'resolveIntent slice.h → slashHor',
		slashH && slashH.trigger === 'slashHor' && slashH.actions[0] === 'decomposeInAProduct',
		slashH && slashH.trigger
	);

	const pinchH = intentMap.resolveIntent({ type: 'pinch', axis: 'h' }, table);
	assert(
		'resolveIntent pinch.h → pinchHor try-list',
		pinchH && pinchH.trigger === 'pinchHor' &&
			pinchH.actions.join(',') === 'composePlus,composeTimes,compose',
		pinchH && pinchH.actions.join(',')
	);

	const tap = intentMap.resolveIntent({ type: 'tap' }, table);
	assert(
		'resolveIntent tap → toggleSelect (system)',
		tap && tap.trigger === 'tap' && tap.system === true && tap.actions[0] === 'toggleSelect'
	);
})();

// ——— 2) alias tastiera ———
(function () {
	const up = intentMap.resolveIntent({ type: 'key', key: 'ArrowUp' }, table);
	assert(
		'alias ArrowUp → slashVert / decomposeInASum',
		up && up.alias === 'ArrowUp' && up.actions[0] === 'decomposeInASum',
		up && up.alias
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
		modZ && modZ.actions[0] === 'undo' && modZ.system === true
	);

	const metaZ = intentMap.resolveIntent({ type: 'key', key: 'z', metaKey: true }, table);
	assert(
		'alias cmd+z → undo system',
		metaZ && metaZ.actions[0] === 'undo' && metaZ.system === true
	);

	const shiftL = intentMap.resolveIntent({ type: 'key', key: 'L', shiftKey: true }, table);
	assert(
		'alias Shift+L → load',
		shiftL && shiftL.actions[0] === 'load' && shiftL.system === true
	);

	const p = intentMap.resolveIntent({ type: 'key', key: 'p' }, table);
	assert(
		'alias p → createParenthesis',
		p && p.actions[0] === 'createParenthesis' && p.targetSource === 'selected'
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
		'computeAvailability: compose disponibile, composePlus no',
		avail.compose === true && avail.composePlus === false && avail.composeTimes === false,
		JSON.stringify({ compose: avail.compose, composePlus: avail.composePlus })
	);
	assert(
		'unresolved include composePlus/composeTimes/createParenthesis…',
		availResult.unresolved.indexOf('composePlus') >= 0 &&
			availResult.unresolved.indexOf('createParenthesis') >= 0,
		availResult.unresolved.join(',')
	);

	const tryList = intentMap.listTryActions(pinch, avail);
	assert(
		'try-list pinch salta non registrate → solo compose',
		tryList.length === 1 && tryList[0] === 'compose',
		tryList.join(',')
	);

	const next = intentMap.nextAction(pinch, avail);
	assert('nextAction pinch → compose', next === 'compose', String(next));
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
		undoRow && undoRow.actions[0] === 'undo',
		undoRow && undoRow.actions.join(',')
	);
	const pinchRow = res.table.find(function (r) { return r.trigger === 'pinchHor'; });
	assert(
		'override didattico pinchHor accettato',
		pinchRow && pinchRow.actions.length === 1 && pinchRow.actions[0] === 'compose',
		pinchRow && pinchRow.actions.join(',')
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
			Array.isArray(intentMap.DEFAULT_TABLE)
	);
})();

console.log('');
console.log('Risultato: ' + passed + ' PASS, ' + failed + ' FAIL');
process.exit(failed > 0 ? 1 : 0);
