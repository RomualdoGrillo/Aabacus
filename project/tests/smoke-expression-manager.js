// Smoke test: esercita i percorsi gestiti da ExpressionManager.js
// (caricamento/inflate, serializzazione/deflate, pattern matching, compose/decompose, undo, parser).
// Uso: avviare il server (npx serve -l 5500 app dalla radice del repo), poi `node smoke-expression-manager.js`.
const { chromium } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5500';

(async () => {
	const browser = await chromium.launch();
	const page = await browser.newPage();
	const errors = [];
	page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
	page.on('console', (msg) => {
		if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
	});

	const results = [];
	function report(name, ok, detail) {
		results.push({ name, ok, detail });
		console.log((ok ? 'PASS' : 'FAIL') + ' - ' + name + (detail ? ' :: ' + detail : ''));
	}

	// ---------- 1) Caricamento pagina default (PRELOAD.mmls) ----------
	await page.goto(BASE + '/');
	await page.waitForFunction(() => window.$ && $('#canvasRole [data-enode]').length > 0, null, { timeout: 20000 });
	report('default preload loads with ENODEs', true);

	// ---------- 2) Caricamento esercizio threeplustwo: (1+1+1)+(1+1) ----------
	await page.goto(BASE + '/?preloadPath=./Data/exercises/threeplustwo.mmls');
	await page.waitForFunction(() => window.$ && $('#canvasRole [data-enode=plus]').length > 0, null, { timeout: 20000 });
	report('threeplustwo exercise loads (inflate mml->aab)', true);

	// helper: dump dell'espressione dell'esercizio
	const dump = () => page.evaluate(() =>
		$('#canvasRole [data-enode=eq] [data-enode]').filter(function () {
			return $(this).closest('[data-import]').length == 0;
		}).map(function () {
			return this.getAttribute('data-enode') + '(' + (this.ENODE_getName ? this.ENODE_getName() : '') + ')';
		}).get().join(' '));

	// ---------- 3) Serializzazione AlltoMMLSstring (deflate aab->mml) ----------
	const mmls = await page.evaluate(() => AlltoMMLSstring());
	report('AlltoMMLSstring returns sections', /<section data-section="canvas">/.test(mmls) && /<apply/.test(mmls),
		'len=' + mmls.length);

	// ---------- 4) plusAssociate ltr: (1+1+1)+(1+1) -> 1+1+1+(1+1) ----------
	const pmRes = await page.evaluate(() => {
		const $inner = $('#canvasRole [data-enode=plus]').filter(function () {
			const $k = this.ENODE_getChildren();
			return $k.length === 3 && $k.filter(function () { return this.ENODE_getName() === '1'; }).length === 3;
		}).first();
		if ($inner.length === 0) { return { ok: false, msg: 'inner plus not found' }; }
		const nBefore = $('#canvasRole [data-enode=plus]').length;
		const PActx = TryOnePropertyByName('plusAssociate', $inner, 'ltr');
		if (!PActx || !PActx.matchedTF) { return { ok: false, msg: 'not matched: ' + (PActx && PActx.msg) }; }
		PActxConclude(PActx);
		const nAfter = $('#canvasRole [data-enode=plus]').length;
		return { ok: nAfter < nBefore, msg: 'plus count ' + nBefore + ' -> ' + nAfter };
	});
	report('plusAssociate ltr dissolves inner bracket', pmRes.ok, pmRes.msg + ' | ' + await dump());

	// ---------- 5) compose: seleziona il plus(1,1) e componi -> 2 ----------
	const composeRes = await page.evaluate(() => {
		const $inner = $('#canvasRole [data-enode=plus]').filter(function () {
			const $k = this.ENODE_getChildren();
			return $k.length === 2 && $k.filter(function () { return this.ENODE_getName() === '1'; }).length === 2;
		}).first();
		if ($inner.length === 0) { return { ok: false, msg: 'plus(1,1) not found' }; }
		const $kids = $inner[0].ENODE_getChildren();
		$kids.addClass('selected');
		const PActx = TryOnePropertyByName('compose', $kids);
		if (!PActx || !PActx.matchedTF) { return { ok: false, msg: 'compose not matched: ' + (PActx && PActx.msg) }; }
		PActxConclude(PActx);
		const found2 = $('#canvasRole [data-enode=cn]').filter(function () {
			return this.ENODE_getName() === '2' && $(this).closest('[data-import]').length == 0;
		}).length > 0;
		return { ok: found2, msg: 'cn(2) found=' + found2 };
	});
	report('compose 1+1 -> 2', composeRes.ok, composeRes.msg + ' | ' + await dump());

	// ---------- 6) plusAssociate rtl: aggiunge una parentesi (ENODEswapEqMembers) ----------
	const pmRtl = await page.evaluate(() => {
		const $outer = $('#canvasRole [data-enode=plus]').filter(function () {
			return $(this).closest('[data-import]').length == 0;
		}).first();
		if ($outer.length === 0) { return { ok: false, msg: 'outer plus not found' }; }
		const $cn = $outer[0].ENODE_getChildren(':first');
		const nBefore = $('#canvasRole [data-enode=plus]').length;
		const PActx = TryOnePropertyByName('plusAssociate', $cn, 'rtl');
		if (!PActx || !PActx.matchedTF) { return { ok: false, msg: 'rtl not matched: ' + (PActx && PActx.msg) }; }
		PActxConclude(PActx);
		const nAfter = $('#canvasRole [data-enode=plus]').length;
		return { ok: nAfter > nBefore, msg: 'plus count ' + nBefore + ' -> ' + nAfter };
	});
	report('plusAssociate rtl adds bracket', pmRtl.ok, pmRtl.msg + ' | ' + await dump());

	// ---------- 7) undo: torna indietro fino a far sparire il cn(2) ----------
	// nota: lo snapshot viene preso DOPO ogni azione, servono più undo
	const undoRes = await page.evaluate(() => {
		const has2 = () => $('#canvasRole [data-enode=cn]').filter(function () {
			return this.ENODE_getName() === '2' && $(this).closest('[data-import]').length == 0;
		}).length > 0;
		let i = 0;
		while (has2() && i < 5) { ssnapshot.undo(); i++; }
		return { ok: !has2(), msg: 'undos=' + i };
	});
	report('undo restores expression (cn(2) removed)', undoRes.ok, undoRes.msg + ' | ' + await dump());

	// ---------- 8) decomposeInASum su un cn>1 ----------
	const decRes = await page.evaluate(() => {
		const $cn = $('#canvasRole [data-enode=cn]').filter(function () {
			return Number(this.ENODE_getName()) > 1 && $(this).closest('[data-import]').length == 0;
		}).first();
		if ($cn.length === 0) {
			// dopo l'undo potrebbe non esserci un cn>1: ricrea componendo 1+1
			const $inner = $('#canvasRole [data-enode=plus]').filter(function () {
				const $k = this.ENODE_getChildren();
				return $k.length === 2 && $k.filter(function () { return this.ENODE_getName() === '1'; }).length === 2;
			}).first();
			if ($inner.length === 0) { return { ok: false, msg: 'no cn>1 and no plus(1,1)' }; }
			const $kids = $inner[0].ENODE_getChildren();
			$kids.addClass('selected');
			PActxConclude(TryOnePropertyByName('compose', $kids));
		}
		const $cn2 = $('#canvasRole [data-enode=cn]').filter(function () {
			return Number(this.ENODE_getName()) > 1 && $(this).closest('[data-import]').length == 0;
		}).first();
		if ($cn2.length === 0) { return { ok: false, msg: 'still no cn>1' }; }
		const val = Number($cn2[0].ENODE_getName());
		const PActx = decomposeInASum($cn2);
		if (!PActx || !PActx.matchedTF) { return { ok: false, msg: 'decompose not matched' }; }
		PActxConclude(PActx);
		const names = $('#canvasRole [data-enode=cn]').filter(function () {
			return $(this).closest('[data-import]').length == 0;
		}).map(function () { return this.ENODE_getName(); }).get();
		return { ok: names.indexOf(String(val - 1)) !== -1, msg: 'val=' + val + ' cn names=' + names.join(',') };
	});
	report('decomposeInASum n -> (n-1)+1', decRes.ok, decRes.msg + ' | ' + await dump());

	// ---------- 9) dummyParser + primitive di ExpressionManager ----------
	const parserRes = await page.evaluate(() => {
		const $eq = dummyParser('3=x');
		if (!$eq || $eq.length === 0) { return { ok: false, msg: 'dummyParser returned nothing' }; }
		const first0 = $eq[0].ENODE_getRoles('.firstMember').children()[0].ENODE_getName();
		ENODEswapEqMembers($eq);
		const first1 = $eq[0].ENODE_getRoles('.firstMember').children()[0].ENODE_getName();
		return { ok: first0 === '3' && first1 === 'x', msg: 'firstMember: ' + first0 + ' -> ' + first1 };
	});
	report('dummyParser + ENODEswapEqMembers', parserRes.ok, parserRes.msg);

	const symRes = await page.evaluate(() => {
		const $s = ENODEcreateSymbol('y', 'num');
		return { ok: $s.attr('data-enode') === 'ci' && $s.attr('data-type') === 'num' && $s[0].ENODE_getName() === 'y' };
	});
	report('ENODEcreateSymbol creates ci with data-type', symRes.ok);

	// ---------- errori js ----------
	const realErrors = errors.filter((e) => !/favicon|404|net::ERR/.test(e));
	report('no JS page errors', realErrors.length === 0, realErrors.join(' | ').slice(0, 500));

	await browser.close();
	const failed = results.filter((r) => !r.ok);
	console.log('\n' + (failed.length === 0 ? 'ALL SMOKE TESTS PASSED' : failed.length + ' SMOKE TESTS FAILED'));
	process.exit(failed.length === 0 ? 0 : 1);
})();
