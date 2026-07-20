/**
 * Demo staged come nello storyboard PDF:
 *   [ pattern | transform ]
 *   [ input              ]
 */
(function (global) {
	'use strict';

	var PATTERN_MML =
		'<math xmlns="http://www.w3.org/1998/Math/MathML">' +
		'<apply type="num"><plus></plus>' +
		'<ci type="num">a__</ci>' +
		'<apply type="num"><plus></plus>' +
		'<ci type="num">b_</ci>' +
		'<ci type="num">c__</ci>' +
		'</apply></apply></math>';

	var TRANSFORM_MML =
		'<math xmlns="http://www.w3.org/1998/Math/MathML">' +
		'<apply type="num"><plus></plus>' +
		'<apply type="num"><plus></plus>' +
		'<ci type="num">a__</ci>' +
		'<ci type="num">b_</ci>' +
		'</apply>' +
		'<ci type="num">c__</ci>' +
		'</apply></math>';

	var INPUT_MATCH_MML =
		'<math xmlns="http://www.w3.org/1998/Math/MathML">' +
		'<apply type="num"><plus></plus>' +
		'<cn type="num">1</cn>' +
		'<ci type="num">x</ci>' +
		'<apply type="num"><plus></plus>' +
		'<cn type="num">3</cn>' +
		'<ci type="num">z</ci>' +
		'<ci type="num">t</ci>' +
		'</apply></apply></math>';

	var INPUT_REJECT_MML =
		'<math xmlns="http://www.w3.org/1998/Math/MathML">' +
		'<apply type="num"><times></times>' +
		'<ci type="num">a</ci>' +
		'<ci type="num">b</ci>' +
		'</apply></math>';

	function buildStage() {
		$('#newPM-stage, #newPM-demo-area').remove();
		var $stage = $(
			'<div id="newPM-stage">' +
				'<div class="newPM-panel" id="newPM-panel-pattern">' +
				'<div class="newPM-panel-title">pattern</div>' +
				'<div id="newPM-demo-pattern" class="newPM-host ul_role"></div>' +
				'</div>' +
				'<div class="newPM-panel" id="newPM-panel-transform">' +
				'<div class="newPM-panel-title">transform</div>' +
				'<div id="newPM-demo-transform" class="newPM-host ul_role"></div>' +
				'</div>' +
				'<div class="newPM-panel" id="newPM-panel-input">' +
				'<div class="newPM-panel-title">input</div>' +
				'<div id="newPM-demo-input" class="newPM-host ul_role"></div>' +
				'</div>' +
				'</div>'
		);
		$('#canvasRole').prepend($stage);
		return $stage;
	}

	function injectInto($role, mml) {
		$role.empty();
		inject(mml, $role);
		RefreshEmptyInfixBraketsGlued($role, true);
		$role.find('.selected, .exclusiveFocus').removeClass('selected exclusiveFocus');
		return $role.children('[data-enode]').first();
	}

	async function runNewPmDemo(scenario, options) {
		options = options || {};
		scenario = scenario || 'match';
		if (typeof newPM !== 'function' || !newPM.version) {
			await newPM.load();
		}

		buildStage();
		var $pattern = injectInto($('#newPM-demo-pattern'), PATTERN_MML);
		var $transform = injectInto($('#newPM-demo-transform'), TRANSFORM_MML);
		var inputMml = scenario === 'reject' ? INPUT_REJECT_MML : INPUT_MATCH_MML;
		var $input = injectInto($('#newPM-demo-input'), inputMml);

		await new Promise(function (r) {
			requestAnimationFrame(function () {
				requestAnimationFrame(r);
			});
		});

		var result = NewPM.runMatch($pattern, $input, {});
		result.$transform = $transform;
		result.visualSteps = NewPM.buildVisualScript(result);
		result.trace = result.visualSteps;
		NewPM.lastResult = result;

		if (options.play !== false) {
			await NewPM.playTrace(result.visualSteps, {
				stepMs: options.stepMs != null ? options.stepMs : 1000
			});
		}

		global.__newPmDemoLast = {
			scenario: scenario,
			matched: result.matched,
			msg: result.msg,
			bindings: Object.keys(result.bindings || {}).reduce(function (acc, k) {
				acc[k] = (result.bindings[k] || []).map(function (el) {
					return NewPM.enodeLabel($(el));
				});
				return acc;
			}, {}),
			phases: (result.visualSteps || []).map(function (s) {
				return { phase: s.phase, kind: s.kind, narrate: s.narrate };
			})
		};
		console.log('[newPM demo]', global.__newPmDemoLast);
		return global.__newPmDemoLast;
	}

	global.runNewPmDemo = runNewPmDemo;
	console.info('[newPM demo] staged come PDF — await runNewPmDemo("match")');
})(typeof window !== 'undefined' ? window : globalThis);
