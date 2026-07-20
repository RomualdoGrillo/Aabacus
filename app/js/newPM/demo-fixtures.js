/**
 * Fixture console per newPM: inserisce pattern + input nel canvas e lancia un test.
 * Usato da demo-newpm.js oppure, a mano:
 *   $.getScript('js/newPM/load.js')
 *   // poi, dopo ready:
 *   $.getScript('js/newPM/demo-fixtures.js')
 */
(function (global) {
	'use strict';

	var PATTERN_MML =
		'<math xmlns="http://www.w3.org/1998/Math/MathML">' +
		'<apply type="num"><plus></plus>' +
		'<ci type="num">x_</ci>' +
		'<ci type="num">y_</ci>' +
		'</apply></math>';

	var INPUT_MATCH_MML =
		'<math xmlns="http://www.w3.org/1998/Math/MathML">' +
		'<apply type="num"><plus></plus>' +
		'<ci type="num">a</ci>' +
		'<ci type="num">b</ci>' +
		'</apply></math>';

	var INPUT_REJECT_MML =
		'<math xmlns="http://www.w3.org/1998/Math/MathML">' +
		'<apply type="num"><times></times>' +
		'<ci type="num">a</ci>' +
		'<ci type="num">b</ci>' +
		'</apply></math>';

	function clearDemoArea() {
		$('#newPM-demo-area').remove();
		var $box = $(
			'<div id="newPM-demo-area" style="margin:12px;padding:12px;border:1px dashed #c4a574;"></div>'
		);
		$box.append('<div class="newPM-demo-label">newPM demo — pattern</div>');
		$box.append('<div id="newPM-demo-pattern" class="ul_role"></div>');
		$box.append('<div class="newPM-demo-label">newPM demo — input</div>');
		$box.append('<div id="newPM-demo-input" class="ul_role"></div>');
		$('#canvasRole').prepend($box);
		return $box;
	}

	function injectInto($role, mml) {
		$role.empty();
		inject(mml, $role);
		RefreshEmptyInfixBraketsGlued($role, true);
		return $role.children('[data-enode]').first();
	}

	/**
	 * @param {'match'|'reject'} scenario
	 * @param {{ play?: boolean, stepMs?: number }} options
	 */
	async function runNewPmDemo(scenario, options) {
		options = options || {};
		scenario = scenario || 'match';
		if (typeof newPM !== 'function' || !newPM.version) {
			await newPM.load();
		}

		clearDemoArea();
		var $pattern = injectInto($('#newPM-demo-pattern'), PATTERN_MML);
		var inputMml = scenario === 'reject' ? INPUT_REJECT_MML : INPUT_MATCH_MML;
		var $input = injectInto($('#newPM-demo-input'), inputMml);

		var result = await newPM($pattern, $input, {
			play: options.play !== false,
			stepMs: options.stepMs != null ? options.stepMs : 450
		});

		global.__newPmDemoLast = {
			scenario: scenario,
			matched: result.matched,
			msg: result.msg,
			bindings: result.bindings,
			trace: result.trace.map(function (s) {
				return { kind: s.kind, narrate: s.narrate, paramName: s.paramName };
			})
		};
		console.log('[newPM demo]', global.__newPmDemoLast);
		return global.__newPmDemoLast;
	}

	global.runNewPmDemo = runNewPmDemo;
	console.info(
		'[newPM demo] pronto — esegui: await runNewPmDemo("match") oppure await runNewPmDemo("reject")'
	);
})(typeof window !== 'undefined' ? window : globalThis);
