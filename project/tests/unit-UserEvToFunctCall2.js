#!/usr/bin/env node
/**
 * Unit test Node-puro per app/js/UserEvToFunctCall2.js
 * Uso: node project/tests/unit-UserEvToFunctCall2.js
 * Exit 0 = PASS, 1 = FAIL.
 */
'use strict';

const path = require('path');
const UEV2 = require(path.join(__dirname, '../../app/js/UserEvToFunctCall2.js'));

let passed = 0;
let failed = 0;

function assert(name, cond, detail) {
	if (cond) {
		passed++;
		console.log('PASS  ' + name + (detail ? ' — ' + detail : ''));
	} else {
		failed++;
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

const table = UEV2.DEFAULT_TABLE;
const TIED = { tied: true };
const UNTIED = { tied: false };

// ——— 1) risoluzione trigger + colonna tied/untied ———
(function () {
	const slashV = UEV2.resolveIntent({ type: 'slice', axis: 'v' }, table, TIED);
	assert(
		'resolveIntent slice.v tied → slashVert / decomposeInASum',
		slashV && slashV.trigger === 'slashVert' && aName(slashV.actions[0]) === 'decomposeInASum',
		slashV && slashV.trigger
	);

	const slashVUntied = UEV2.resolveIntent({ type: 'slice', axis: 'v' }, table, UNTIED);
	assert(
		'resolveIntent slice.v untied → lista vuota',
		slashVUntied && slashVUntied.actions.length === 0,
		slashVUntied && String(slashVUntied.actions.length)
	);

	const slashH = UEV2.resolveIntent({ type: 'slice', axis: 'h' }, table, TIED);
	assert(
		'resolveIntent slice.h tied → slashHor',
		slashH && slashH.trigger === 'slashHor' && aName(slashH.actions[1]) === 'decomposeInAProduct',
		slashH && slashH.trigger
	);

	const pinchH = UEV2.resolveIntent({ type: 'pinch', axis: 'h' }, table, TIED);
	assert(
		'resolveIntent pinch.h tied → compose…',
		pinchH && pinchH.trigger === 'pinchHor' &&
			pinchH.actions.map(actionKey).join(',') === 'compose,AndNeutral:ltr,timesAbsorbingEl:ltr',
		pinchH && pinchH.actions.map(actionKey).join(',')
	);

	const tap = UEV2.resolveIntent({ type: 'tap' }, table, UNTIED);
	assert(
		'resolveIntent tap → toggleSelect (system, entrambe le colonne)',
		tap && tap.trigger === 'tap' && tap.system === true && aName(tap.actions[0]) === 'toggleSelect'
	);

	const lassoU = UEV2.resolveIntent({ type: 'lasso' }, table, UNTIED);
	assert(
		'lasso untied → selectSiblings',
		lassoU && aName(lassoU.actions[0]) === 'selectSiblings' && UEV2.isBuiltinAction('selectSiblings'),
		lassoU && actionKey(lassoU.actions[0])
	);

	const lassoT = UEV2.resolveIntent({ type: 'lasso' }, table, TIED);
	assert(
		'lasso tied → plusAssociate rtl (bozza Romualdo)',
		lassoT && lassoT.actions[0] && lassoT.actions[0].name === 'plusAssociate' &&
			lassoT.actions[0].val === 'rtl',
		lassoT && actionKey(lassoT.actions[0])
	);

	const dnd = UEV2.resolveIntent({ type: 'dnd' }, table, TIED);
	assert(
		'resolveIntent dnd → applyDnD',
		dnd && aName(dnd.actions[0]) === 'applyDnD' && UEV2.isBuiltinAction('applyDnD')
	);
})();

// ——— 2) alias tastiera ———
(function () {
	const right = UEV2.resolveIntent({ type: 'key', key: 'ArrowRight' }, table, TIED);
	assert(
		'alias ArrowRight tied → slashVert / decomposeInASum',
		right && right.alias === 'ArrowRight' && aName(right.actions[0]) === 'decomposeInASum',
		right && (right.alias + '/' + aName(right.actions[0]))
	);

	const up = UEV2.resolveIntent({ type: 'key', key: 'ArrowUp' }, table, TIED);
	assert(
		'alias ArrowUp tied → slashHor',
		up && up.alias === 'ArrowUp' && aName(up.actions[1]) === 'decomposeInAProduct'
	);

	const modZ = UEV2.resolveIntent({ type: 'key', key: 'z', ctrlKey: true }, table, UNTIED);
	assert('alias ctrl+z → undo', modZ && aName(modZ.actions[0]) === 'undo' && modZ.system);

	const shiftLTied = UEV2.resolveIntent({ type: 'key', key: 'L', shiftKey: true }, table, TIED);
	assert(
		'Shift+L tied → load (parità con MAIN.js / dopo preload)',
		shiftLTied && aName(shiftLTied.actions[0]) === 'load'
	);

	const shiftL = UEV2.resolveIntent({ type: 'key', key: 'L', shiftKey: true }, table, UNTIED);
	assert('Shift+L untied → load', shiftL && aName(shiftL.actions[0]) === 'load');

	const pTied = UEV2.resolveIntent({ type: 'key', key: 'p' }, table, TIED);
	assert(
		'alias p tied → plusAssociate ltr',
		pTied && pTied.actions[0] && pTied.actions[0].name === 'plusAssociate' &&
			pTied.actions[0].val === 'ltr',
		pTied && actionKey(pTied.actions[0])
	);

	const pUntied = UEV2.resolveIntent({ type: 'key', key: 'p' }, table, UNTIED);
	assert('alias p untied → vuoto', pUntied && pUntied.actions.length === 0);
})();

// ——— 3) try-list / availability ———
(function () {
	const pinch = UEV2.resolveIntent({ type: 'pinch', axis: 'v' }, table, TIED);
	const availResult = UEV2.computeAvailability(table, {
		hasCanvasCi: function (name) { return name === 'compose'; },
		isRegistered: function (name) {
			return name === 'compose' || name === 'decomposeInASum' || name === 'decomposeInAProduct';
		}
	});
	const avail = availResult.availability;
	assert(
		'computeAvailability: compose sì, AndNeutral no',
		avail.compose === true && avail.AndNeutral === false,
		JSON.stringify({ compose: avail.compose, AndNeutral: avail.AndNeutral })
	);

	const tryList = UEV2.listTryActions(pinch, avail);
	assert(
		'try-list pinch → solo compose',
		tryList.length === 1 && tryList[0].name === 'compose',
		tryList.map(actionKey).join(',')
	);
})();

// ——— 4) override system / didattici ———
(function () {
	const res = UEV2.applyMmlsOverrides(table, {
		'Mod+z': { actions: ['hacked'] },
		'pinchHor': { actions: ['compose'] },
		'lasso': { actions: ['hackedLasso'] },
		'dnd': { actions: ['hackedDnD'] }
	});
	assert('override system Mod+z → violazione', res.violations.indexOf('Mod+z') >= 0);
	assert('override system lasso → violazione', res.violations.indexOf('lasso') >= 0);
	assert('override system dnd → violazione', res.violations.indexOf('dnd') >= 0);

	const undoRow = res.table.find(function (r) { return r.alias === 'Mod+z'; });
	assert(
		'system undo invariato (actionsUntied)',
		undoRow && aName(undoRow.actionsUntied[0]) === 'undo'
	);

	const lassoRow = res.table.find(function (r) { return r.trigger === 'lasso'; });
	assert(
		'system lasso untied invariato',
		lassoRow && aName(lassoRow.actionsUntied[0]) === 'selectSiblings'
	);

	const pinchRow = res.table.find(function (r) { return r.trigger === 'pinchHor'; });
	assert(
		'override didattico pinchHor (actions → entrambe le colonne)',
		pinchRow && pinchRow.actionsTied.length === 1 && pinchRow.actionsTied[0].name === 'compose' &&
			pinchRow.actionsUntied.length === 1 && pinchRow.actionsUntied[0].name === 'compose'
	);
})();

// ——— 4b) override per colonna ———
(function () {
	const res = UEV2.applyMmlsOverrides(table, {
		'p': {
			actionsTied: [
				{ name: 'plusAssociate', val: 'rtl' },
				{ name: 'timesAssociate', val: 'ltr' }
			],
			actionsUntied: []
		}
	});
	const pRow = res.table.find(function (r) { return r.alias === 'p'; });
	assert(
		'override actionsTied conserva val',
		pRow && pRow.actionsTied[0].name === 'plusAssociate' && pRow.actionsTied[0].val === 'rtl' &&
			pRow.actionsUntied.length === 0,
		pRow && pRow.actionsTied.map(actionKey).join(',')
	);
})();

// ——— 5) enabledRecognizerIntents (spec L2: colonna attiva decide l’ascolto) ———
(function () {
	const enTied = UEV2.enabledRecognizerIntents(table, TIED);
	assert(
		'tied: default abilita tap/lasso/dnd/slice/pinch',
		enTied.tap && enTied.lasso && enTied.dnd && enTied.slice && enTied.pinch &&
			enTied.slashHor && enTied.slashVert && enTied.pinchHor && enTied.pinchVert
	);

	const enUntied = UEV2.enabledRecognizerIntents(table, UNTIED);
	assert(
		'untied: lasso sì (selectSiblings), slash/pinch no (liste vuote)',
		enUntied.lasso === true && enUntied.tap === true &&
			enUntied.slashVert === false && enUntied.slashHor === false &&
			enUntied.pinch === false && enUntied.slice === false,
		JSON.stringify(enUntied)
	);

	const noLasso = table.filter(function (r) { return r.trigger !== 'lasso'; });
	const en2 = UEV2.enabledRecognizerIntents(noLasso, UNTIED);
	assert(
		'senza riga lasso → lasso false, tap ancora true',
		en2.lasso === false && en2.tap === true && en2.dnd === true,
		JSON.stringify({ lasso: en2.lasso, tap: en2.tap })
	);

	// Riga presente ma solo tied ha azioni → untied non ascolta
	const lassoTiedOnly = table.map(function (r) {
		if (r.trigger !== 'lasso') return r;
		return {
			trigger: 'lasso',
			alias: null,
			targetSource: null,
			actionsUntied: [],
			actionsTied: [{ name: 'plusAssociate', val: 'rtl' }],
			system: true
		};
	});
	assert(
		'lasso solo in tied → untied non ascolta',
		UEV2.enabledRecognizerIntents(lassoTiedOnly, UNTIED).lasso === false
	);
	assert(
		'lasso solo in tied → tied ascolta',
		UEV2.enabledRecognizerIntents(lassoTiedOnly, TIED).lasso === true
	);

	const onlyTap = [
		{ trigger: 'tap', alias: null, targetSource: null, actionsUntied: ['toggleSelect'], actionsTied: ['toggleSelect'], system: true }
	];
	const en3 = UEV2.enabledRecognizerIntents(onlyTap, UNTIED);
	assert(
		'solo tap → slice/pinch/lasso/dnd off',
		en3.tap && !en3.lasso && !en3.dnd && !en3.slice && !en3.pinch
	);

	assert(
		'listGestureTriggers esporta i trigger (anche se colonna vuota)',
		UEV2.listGestureTriggers(lassoTiedOnly).indexOf('lasso') !== -1 &&
			UEV2.listActiveGestureTriggers(lassoTiedOnly, UNTIED).indexOf('lasso') === -1 &&
			UEV2.listActiveGestureTriggers(lassoTiedOnly, TIED).indexOf('lasso') !== -1
	);
})();

// ——— 6) setTable (array + JSON) aggiorna il custode ———
(function () {
	const slim = table.filter(function (r) { return r.trigger !== 'lasso'; });
	UEV2.setTable(slim);
	assert(
		'setTable senza lasso → enabled.lasso false',
		UEV2.enabledRecognizerIntents(UEV2.getTable(), UNTIED).lasso === false
	);
	const json = JSON.stringify(table);
	UEV2.setTable(json);
	assert(
		'setTable da JSON string ripristina lasso',
		UEV2.enabledRecognizerIntents(UEV2.getTable(), UNTIED).lasso === true
	);
	let threw = false;
	try { UEV2.setTable('{not json'); } catch (e) { threw = true; }
	assert('setTable JSON invalido → throw', threw);
	// ripristino default per eventuali assert successivi
	UEV2.setTable(UEV2.DEFAULT_TABLE);
})();

// ——— 7) API ———
(function () {
	assert(
		'API pure esportate',
		typeof UEV2.resolveIntent === 'function' &&
			typeof UEV2.actionsForTiedState === 'function' &&
			typeof UEV2.applyMmlsOverrides === 'function' &&
			typeof UEV2.enabledRecognizerIntents === 'function' &&
			Array.isArray(UEV2.DEFAULT_TABLE) &&
			UEV2.DEFAULT_TABLE[0].actionsUntied &&
			UEV2.DEFAULT_TABLE[0].actionsTied
	);
})();

console.log('');
console.log('Risultato: ' + passed + ' PASS, ' + failed + ' FAIL');
process.exit(failed > 0 ? 1 : 0);
