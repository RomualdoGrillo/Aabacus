#!/usr/bin/env node
/**
 * Unit test Node-puro per app/js/input2/importMmlsV1.js
 * Uso: node project/tests/unit-importMmlsV1.js
 */
'use strict';

const path = require('path');
const UEV2 = require(path.join(__dirname, '../../app/js/UserEvToFunctCall2.js'));
const Imp = require(path.join(__dirname, '../../app/js/input2/importMmlsV1.js'));

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

assert('← → ArrowLeft', Imp.normalizeV1EventName('←') === 'ArrowLeft');
assert('→ → ArrowRight', Imp.normalizeV1EventName('→') === 'ArrowRight');
assert('↑ → ArrowUp', Imp.normalizeV1EventName('↑') === 'ArrowUp');
assert('↓ → ArrowDown', Imp.normalizeV1EventName('↓') === 'ArrowDown');
assert('p resta p', Imp.normalizeV1EventName('p') === 'p');
assert('slice.v → slashVert', Imp.normalizeV1EventName('slice.v') === 'slashVert');

const recipes = [
	{ event: '↓', actions: [{ name: 'compose' }, { name: 'AndNeutral', val: 'ltr' }] },
	{ event: 'p', actions: [{ name: 'plusAssociate', val: 'rtl' }] },
	{ event: 'c', actions: [{ name: 'PlusSingleTerm', val: 'ltr' }] }
];
const ov = Imp.recipesToTiedOverrides(recipes);
assert('override ha ArrowDown', !!ov.ArrowDown && Array.isArray(ov.ArrowDown.actionsTied));
assert('override non usa actions (entrambe le colonne)', !ov.ArrowDown.actions);
assert('p → solo actionsTied', !!ov.p.actionsTied && !ov.p.actionsUntied && !ov.p.actions);

const res = Imp.importMmlsV1ToGA(UEV2.DEFAULT_TABLE, recipes);
const pinch = res.table.find(function (r) { return r.trigger === 'pinchHor'; });
const pRow = res.table.find(function (r) { return r.alias === 'p'; });
assert(
	'v1 su pinchHor aggiorna tied, untied resta vuoto',
	pinch && pinch.actionsTied[0].name === 'compose' && pinch.actionsUntied.length === 0
);
assert(
	'v1 su p aggiorna tied, untied resta vuoto',
	pRow && pRow.actionsTied[0].name === 'plusAssociate' && pRow.actionsTied[0].val === 'rtl' &&
		pRow.actionsUntied.length === 0
);

const sys = Imp.importMmlsV1ToGA(UEV2.DEFAULT_TABLE, [
	{ event: 'lasso', actions: [{ name: 'hacked' }] }
]);
assert('v1 non sovrascrive system lasso', sys.violations.indexOf('lasso') >= 0);
const lasso = sys.table.find(function (r) { return r.trigger === 'lasso'; });
const untied0 = lasso && lasso.actionsUntied[0];
const untiedName = typeof untied0 === 'string' ? untied0 : (untied0 && untied0.name);
assert('lasso untied di default intatto', untiedName === 'selectSiblings');

console.log('');
console.log('Risultato: ' + passed + ' PASS, ' + failed + ' FAIL');
process.exit(failed > 0 ? 1 : 0);
