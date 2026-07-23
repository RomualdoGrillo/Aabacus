/**
 * newPM — player grafico (ghost a capsule = identikit del pattern).
 */
(function (global) {
	'use strict';

	var NewPM = global.NewPM || (global.NewPM = {});

	var COMPOUND_OPS = {
		plus: true,
		times: true,
		power: true,
		minus: true,
		eq: true,
		and: true,
		or: true,
		implies: true,
		forall: true,
		divide: true,
		root: true
	};

	var OP_GLYPH = {
		plus: '+',
		times: '×',
		power: '^',
		minus: '−',
		eq: '=',
		and: '∧',
		or: '∨',
		implies: '⇒',
		forall: '∀',
		divide: '÷',
		root: '√',
		ci: 'x',
		cn: 'n'
	};

	function opGlyph(op) {
		if (!op) return '?';
		return OP_GLYPH[op] || String(op).charAt(0);
	}

	function deepestCompoundOp(rootEl) {
		if (!rootEl) return null;
		var $inners = $(rootEl)
			.find('[data-enode]')
			.filter(function () {
				var op = this.getAttribute('data-enode');
				return !!COMPOUND_OPS[op];
			});
		return $inners.length ? $inners.last()[0] : null;
	}

	NewPM.deepestCompoundOp = deepestCompoundOp;
	NewPM.opGlyph = opGlyph;

	function ensureNarration() {
		var el = document.getElementById('newPM-narration');
		if (!el) {
			el = document.createElement('div');
			el.id = 'newPM-narration';
			document.body.appendChild(el);
		}
		return el;
	}

	function ensurePhaseBadge() {
		var el = document.getElementById('newPM-phase');
		if (!el) {
			el = document.createElement('div');
			el.id = 'newPM-phase';
			document.body.appendChild(el);
		}
		return el;
	}

	function clearVisuals() {
		$('#newPM-ghost, #newPM-stalk, .newPM-leaf-fly, #newPM-specialize').remove();
		$('#newPM-demo-pattern').removeClass('newPM-hide-leaves');
		$('.newPM-prop-hidden')
			.removeClass('newPM-prop-hidden')
			.css({ visibility: '', opacity: '', pointerEvents: '' });
		$(
			'.newPM-bound-flash, .newPM-flash-ok, .newPM-flash-fail'
		).removeClass('newPM-bound-flash newPM-flash-ok newPM-flash-fail');
		$('#newPM-narration, #newPM-phase').remove();
	}

	/**
	 * Nasconde il forAll circostante; il secondo membro (non dragged) resta
	 * nella stessa posizione/aspetto e si aggiorna con le sostituzioni.
	 * Nessuna etichetta "transform".
	 */
	function beginSpecialize(propertyEl, $initialSnap, transformAnchorEl) {
		var $prop = propertyEl ? $(propertyEl) : $();
		var $anchor = transformAnchorEl ? $(transformAnchorEl) : $();
		if (!$anchor.length && $prop.length) {
			// fallback: secondo membro dell’eq nel forAll live
			var $eq =
				typeof GetforAllContentRole === 'function'
					? GetforAllContentRole($prop).children('[data-enode=eq]').first()
					: $prop.find('[data-enode=eq]').first();
			if ($eq.length) {
				$anchor = ENODE_getRoles($eq[0], '.secondMember').children().first();
			}
		}

		// misura PRIMA di nascondere il forAll
		var anchor = rectOf($anchor[0]) || rectOf(propertyEl);

		if ($prop.length) {
			$prop.addClass('newPM-prop-hidden');
		}

		$('#newPM-specialize').remove();
		var host = document.createElement('div');
		host.id = 'newPM-specialize';
		host.innerHTML = '<div class="newPM-specialize-body"></div>';
		document.body.appendChild(host);

		if (anchor) {
			host.style.top = anchor.top + 'px';
			host.style.left = anchor.left + 'px';
			host.style.minWidth = Math.max(anchor.width, 40) + 'px';
			host.style.minHeight = Math.max(anchor.height, 28) + 'px';
		} else {
			host.style.top = '72px';
			host.style.right = '24px';
		}

		updateSpecializeSnap($initialSnap);
		return host;
	}

	function updateSpecializeSnap($snap) {
		var body = document.querySelector('#newPM-specialize .newPM-specialize-body');
		if (!body) return null;
		$(body).empty();
		if (!$snap || !$snap.length) return null;
		var $show =
			typeof ENODEclone === 'function' ? ENODEclone($snap, false, false) : $snap.clone(true);
		$show.addClass('newPM-specialize-expr');
		$(body).append($show);
		$(body).addClass('newPM-specialize-pulse');
		window.setTimeout(function () {
			$(body).removeClass('newPM-specialize-pulse');
		}, 420);
		return $show[0];
	}

	function restoreProperty(propertyEl) {
		if (!propertyEl) return;
		$(propertyEl)
			.removeClass('newPM-prop-hidden')
			.css({ visibility: '', opacity: '', pointerEvents: '' });
	}

	function rectOf(el) {
		if (!el || !el.getBoundingClientRect) return null;
		var r = el.getBoundingClientRect();
		if (r.width < 2 && r.height < 2) return null;
		return {
			top: r.top + window.scrollY,
			left: r.left + window.scrollX,
			width: Math.max(r.width, 36),
			height: Math.max(r.height, 36),
			cx: r.left + window.scrollX + r.width / 2,
			cy: r.top + window.scrollY + r.height / 2
		};
	}

	function sleep(ms) {
		return new Promise(function (resolve) {
			setTimeout(resolve, ms);
		});
	}

	/* ---------- audio (Web Audio, niente file esterni) ---------- */
	var audioCtx = null;

	function getAudioCtx() {
		if (audioCtx) return audioCtx;
		var AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		audioCtx = new AC();
		return audioCtx;
	}

	function playTone(freq, durMs, type, gainPeak) {
		var ctx = getAudioCtx();
		if (!ctx) return;
		if (ctx.state === 'suspended') {
			try {
				ctx.resume();
			} catch (e) {
				/* ignore */
			}
		}
		var t0 = ctx.currentTime;
		var osc = ctx.createOscillator();
		var g = ctx.createGain();
		osc.type = type || 'sine';
		osc.frequency.value = freq;
		g.gain.setValueAtTime(0.0001, t0);
		g.gain.exponentialRampToValueAtTime(gainPeak || 0.12, t0 + 0.012);
		g.gain.exponentialRampToValueAtTime(0.0001, t0 + (durMs || 120) / 1000);
		osc.connect(g);
		g.connect(ctx.destination);
		osc.start(t0);
		osc.stop(t0 + (durMs || 120) / 1000 + 0.02);
	}

	function playCue(kind, enabled) {
		if (enabled === false) return;
		try {
			if (kind === 'ok') {
				playTone(740, 70, 'sine', 0.1);
				setTimeout(function () {
					playTone(980, 90, 'sine', 0.09);
				}, 55);
			} else if (kind === 'fail') {
				playTone(220, 140, 'triangle', 0.11);
				setTimeout(function () {
					playTone(160, 160, 'triangle', 0.09);
				}, 70);
			} else if (kind === 'tick') {
				playTone(520, 40, 'sine', 0.05);
			}
		} catch (e) {
			/* ignore */
		}
	}

	/* ---------- flash colore su elementi ---------- */
	function flashEls(els, outcome) {
		var cls = outcome === 'fail' ? 'newPM-flash-fail' : 'newPM-flash-ok';
		(els || []).forEach(function (el) {
			if (!el) return;
			$(el).removeClass('newPM-flash-ok newPM-flash-fail').addClass(cls);
			window.setTimeout(function () {
				$(el).removeClass(cls);
			}, 650);
		});
	}

	function setCapsuleOutcome(pair, outcome) {
		if (!pair) return;
		[pair.outer, pair.inner].forEach(function (cap) {
			if (!cap) return;
			cap.classList.remove('is-ok', 'is-fail');
			if (outcome === 'ok') cap.classList.add('is-ok');
			if (outcome === 'fail') cap.classList.add('is-fail');
		});
	}

	function setCapsuleOp(capsule, op) {
		if (!capsule) return;
		capsule.setAttribute('data-op', op || '');
		var badge = capsule.querySelector('.newPM-op-badge');
		if (!badge) {
			badge = document.createElement('span');
			badge.className = 'newPM-op-badge';
			capsule.appendChild(badge);
		}
		badge.textContent = opGlyph(op);
		badge.setAttribute('title', op || '');
	}

	function createGhostPair(outerOp, innerOp) {
		$('#newPM-ghost').remove();
		var ghost = document.createElement('div');
		ghost.id = 'newPM-ghost';
		var outer = document.createElement('div');
		outer.className = 'newPM-ghost-capsule outer is-loose';
		var inner = document.createElement('div');
		inner.className = 'newPM-ghost-capsule inner is-loose';
		ghost.appendChild(outer);
		ghost.appendChild(inner);
		document.body.appendChild(ghost);
		setCapsuleOp(outer, outerOp || 'plus');
		setCapsuleOp(inner, innerOp || outerOp || 'plus');
		var hideInner = !innerOp || innerOp === outerOp;
		if (hideInner) {
			// se c’è un solo tipo, tieni comunque un’ellisse interna più piccola
			// ma con lo stesso simbolo (identikit piatto)
			inner.classList.add('is-same-op');
		}
		return {
			ghost: ghost,
			outer: outer,
			inner: inner,
			outerOp: outerOp,
			innerOp: innerOp,
			gTop: 0,
			gLeft: 0
		};
	}

	function layoutGhost(pair, outerRect, innerRect, loose) {
		var pad = 10;
		var top = Math.min(outerRect.top, innerRect.top) - pad;
		var left = Math.min(outerRect.left, innerRect.left) - pad;
		var right =
			Math.max(
				outerRect.left + outerRect.width,
				innerRect.left + innerRect.width
			) + pad;
		var bottom =
			Math.max(
				outerRect.top + outerRect.height,
				innerRect.top + innerRect.height
			) + pad;

		pair.gTop = top;
		pair.gLeft = left;
		pair.ghost.style.top = top + 'px';
		pair.ghost.style.left = left + 'px';
		pair.ghost.style.width = right - left + 'px';
		pair.ghost.style.height = bottom - top + 'px';

		pair.outer.style.top = outerRect.top - top + 'px';
		pair.outer.style.left = outerRect.left - left + 'px';
		pair.outer.style.width = outerRect.width + 'px';
		pair.outer.style.height = outerRect.height + 'px';

		pair.inner.style.top = innerRect.top - top + 'px';
		pair.inner.style.left = innerRect.left - left + 'px';
		pair.inner.style.width = innerRect.width + 'px';
		pair.inner.style.height = innerRect.height + 'px';

		pair.outer.classList.toggle('is-loose', !!loose);
		pair.inner.classList.toggle('is-loose', !!loose);
		pair.outer.classList.toggle('is-tight', !loose);
		pair.inner.classList.toggle('is-tight', !loose);
	}

	function placeGhostAtPattern(pair, patternEl, outerOp, innerOp) {
		var outerR = rectOf(patternEl);
		if (!outerR) return;
		if (outerOp) setCapsuleOp(pair.outer, outerOp);
		if (innerOp) setCapsuleOp(pair.inner, innerOp);

		var innerEl = deepestCompoundOp(patternEl);
		if (innerEl && innerEl !== patternEl) {
			var innerR = rectOf(innerEl);
			if (innerR) {
				layoutGhost(pair, outerR, innerR, true);
				if (!innerOp) setCapsuleOp(pair.inner, innerEl.getAttribute('data-enode'));
				return;
			}
		}
		var fallbackInner = {
			top: outerR.top + outerR.height * 0.22,
			left: outerR.left + outerR.width * 0.42,
			width: Math.max(outerR.width * 0.48, 60),
			height: Math.max(outerR.height * 0.55, 40)
		};
		layoutGhost(pair, outerR, fallbackInner, true);
	}

	function moveGhostOverInput(pair, inputEl) {
		var target = rectOf(inputEl);
		if (!target) return;
		var outerR = {
			top: target.top - 8,
			left: target.left - 14,
			width: target.width + 28,
			height: target.height + 20
		};
		var innerEl = deepestCompoundOp(inputEl);
		var innerR = rectOf(innerEl);
		if (!innerR || innerEl === inputEl) {
			innerR = {
				top: target.top + target.height * 0.12,
				left: target.left + target.width * 0.36,
				width: target.width * 0.56,
				height: target.height * 0.72
			};
		}
		layoutGhost(pair, outerR, innerR, true);
	}

	function hideOpBadge(capsule) {
		if (!capsule) return;
		capsule.classList.add('badge-hidden');
		var badge = capsule.querySelector('.newPM-op-badge');
		if (badge) badge.setAttribute('aria-hidden', 'true');
	}

	function tighten(pair, which, inputEl) {
		var r = rectOf(inputEl);
		if (!r || !pair) return;
		if (which === 'inner') {
			pair._innerRect = r;
			pair.inner.classList.remove('is-loose');
			pair.inner.classList.add('is-tight');
			pair.inner.style.top = r.top - pair.gTop + 'px';
			pair.inner.style.left = r.left - pair.gLeft + 'px';
			pair.inner.style.width = r.width + 'px';
			pair.inner.style.height = r.height + 'px';
			pair.inner.classList.add('is-ok');
			// match riuscito: il simbolo è ridondante (il target è già un plus/×/…)
			hideOpBadge(pair.inner);
		} else {
			var innerR = pair._innerRect || {
				top: r.top + r.height * 0.15,
				left: r.left + r.width * 0.4,
				width: r.width * 0.5,
				height: r.height * 0.65
			};
			layoutGhost(pair, r, innerR, false);
			pair.outer.classList.add('is-ok');
			hideOpBadge(pair.outer);
		}
	}

	function drawStalk(fromEl, pair) {
		$('#newPM-stalk').remove();
		if (!fromEl || !pair) return;
		var a = rectOf(fromEl);
		if (!a) return;
		var x1 = a.cx;
		var y1 = a.cy;
		var x2 = pair.gLeft + parseFloat(pair.ghost.style.width) * 0.55;
		var y2 = pair.gTop + 8;
		var minX = Math.min(x1, x2) - 30;
		var minY = Math.min(y1, y2) - 30;
		var w = Math.abs(x2 - x1) + 60;
		var h = Math.abs(y2 - y1) + 60;
		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('id', 'newPM-stalk');
		svg.style.top = minY + 'px';
		svg.style.left = minX + 'px';
		svg.style.width = w + 'px';
		svg.style.height = h + 'px';
		var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		var mx = x1 - minX;
		var my = y1 - minY;
		var nx = x2 - minX;
		var ny = y2 - minY;
		path.setAttribute(
			'd',
			'M' +
				mx +
				',' +
				my +
				' C' +
				(mx + (nx - mx) * 0.3) +
				',' +
				(my + 50) +
				' ' +
				(mx + (nx - mx) * 0.7) +
				',' +
				(ny - 30) +
				' ' +
				nx +
				',' +
				ny
		);
		path.setAttribute('fill', 'none');
		path.setAttribute('stroke', 'rgba(110,110,110,0.45)');
		path.setAttribute('stroke-width', '14');
		path.setAttribute('stroke-linecap', 'round');
		svg.appendChild(path);
		document.body.appendChild(svg);
	}

	function flyLeaf(paramName, inputEls, soundEnabled) {
		var $src = $('[data-tag^=newPM-] .firstMember [data-enode], #newPM-demo-pattern [data-enode]').filter(
			function () {
				try {
					return ENODE_getName(this, true) === paramName;
				} catch (e) {
					return false;
				}
			}
		);
		var start =
			rectOf($src[0]) ||
			rectOf(document.querySelector('[data-tag^=newPM-] .firstMember'));
		var targets = inputEls || [];
		if (!targets.length) return Promise.resolve();

		var flyers = targets.map(function (target, i) {
			var flyer = document.createElement('div');
			flyer.className = 'newPM-leaf-fly';
			flyer.textContent = paramName.replace(/_+$/, '');
			if (start) {
				flyer.style.top = start.top + 'px';
				flyer.style.left = start.left + i * 14 + 'px';
			}
			document.body.appendChild(flyer);
			return { el: flyer, target: target };
		});

		void document.body.offsetWidth;
		flyers.forEach(function (f) {
			var t = rectOf(f.target);
			if (!t) return;
			f.el.style.top = t.top + 'px';
			f.el.style.left = t.left + 'px';
			$(f.target).addClass('newPM-bound-flash');
		});
		flashEls(targets, 'ok');
		playCue('ok', soundEnabled);

		return sleep(450).then(function () {
			flyers.forEach(function (f) {
				f.el.remove();
			});
		});
	}

	async function playTrace(visualSteps, options) {
		options = options || {};
		var stepMs = options.stepMs != null ? options.stepMs : 1000;
		var soundEnabled = options.sound !== false;
		var result = options.result || null;
		var doApply = options.apply !== false;
		if (options.clear !== false) clearVisuals();

		var narration = ensureNarration();
		var phaseBadge = ensurePhaseBadge();
		var pair = null;
		var transformEl = null;
		var propertyEl = null;
		var outerOp = null;
		var innerOp = null;
		var specializeHost = null;

		if (soundEnabled) getAudioCtx();

		for (var i = 0; i < (visualSteps || []).length; i++) {
			var step = visualSteps[i];
			narration.textContent = step.narrate || step.kind;
			narration.setAttribute('data-phase', step.phase || '');
			narration.setAttribute('data-outcome', step.outcome || '');
			phaseBadge.textContent = 'fase: ' + (step.phase || '?');
			if (step.transformEl) transformEl = step.transformEl;
			if (step.propertyEl) propertyEl = step.propertyEl;
			if (step.outerOp) outerOp = step.outerOp;
			if (step.innerOp) innerOp = step.innerOp;

			if (step.kind === 'dragStart') {
				$('#newPM-demo-pattern').addClass('newPM-hide-leaves');
				pair = createGhostPair(
					step.outerOp || outerOp,
					step.innerOp || innerOp
				);
				// posiziona il ghost PRIMA di nascondere il forAll (serve il rect)
				var $livePattern = $();
				if (step.propertyEl) {
					$livePattern = $(step.propertyEl)
						.find('.firstMember')
						.children('[data-enode]')
						.first();
					if (!$livePattern.length) {
						$livePattern = $(step.propertyEl)
							.find('[data-enode=' + (step.outerOp || 'plus') + ']')
							.first();
					}
				}
				placeGhostAtPattern(
					pair,
					($livePattern[0] || step.patternEl || step.inputEl),
					step.outerOp,
					step.innerOp
				);
				specializeHost = beginSpecialize(
					step.propertyEl || propertyEl,
					step.$transformInitialSnap,
					step.transformAnchorEl
				);
				var shown = document.querySelector(
					'#newPM-specialize .newPM-specialize-expr'
				);
				if (shown) transformEl = shown;
				drawStalk(transformEl, pair);
				playCue('tick', soundEnabled);
			} else if (step.kind === 'dragGhost') {
				if (!pair) {
					pair = createGhostPair(
						step.outerOp || outerOp,
						step.innerOp || innerOp
					);
					placeGhostAtPattern(
						pair,
						step.patternEl,
						step.outerOp,
						step.innerOp
					);
				}
				moveGhostOverInput(pair, step.inputEl);
				drawStalk(transformEl, pair);
			} else if (step.kind === 'tightenInner') {
				tighten(pair, 'inner', step.inputEl);
				flashEls([step.inputEl], 'ok');
				playCue('ok', soundEnabled);
				drawStalk(transformEl, pair);
			} else if (step.kind === 'tightenOuter') {
				tighten(pair, 'outer', step.inputEl);
				flashEls([step.inputEl], 'ok');
				setCapsuleOutcome(pair, 'ok');
				playCue('ok', soundEnabled);
				drawStalk(transformEl, pair);
			} else if (step.kind === 'revealLeaves') {
				$('#newPM-demo-pattern').removeClass('newPM-hide-leaves');
			} else if (step.kind === 'leafBind') {
				await flyLeaf(step.paramName, step.inputEls, soundEnabled);
				if (step.$transformSnap && step.$transformSnap.length) {
					transformEl = updateSpecializeSnap(step.$transformSnap) || transformEl;
				} else if (step.transformEl) {
					transformEl = step.transformEl;
				}
				drawStalk(transformEl, pair);
				if (transformEl) flashEls([transformEl], 'ok');
			} else if (step.kind === 'fail') {
				if (pair) setCapsuleOutcome(pair, 'fail');
				flashEls([step.inputEl], 'fail');
				playCue('fail', soundEnabled);
				narration.classList.add('is-fail');
				restoreProperty(propertyEl || step.propertyEl);
				$('#newPM-specialize').remove();
			} else if (step.kind === 'transformApply') {
				setCapsuleOutcome(pair, 'ok');
				playCue('ok', soundEnabled);
				narration.classList.add('is-ok');
				if (result && doApply && typeof NewPM.applyToCanvas === 'function') {
					// breve “volo” verso l’input
					if (pair && step.inputEl) {
						moveGhostOverInput(pair, step.inputEl);
						await sleep(Math.min(stepMs, 400));
					}
					NewPM.applyToCanvas(result);
					$('#newPM-ghost, #newPM-stalk').remove();
					$('#newPM-specialize').addClass('newPM-specialize-done');
					await sleep(280);
					$('#newPM-specialize').remove();
					// la prop live resta nascosta solo se era un overlay di sessione;
					// dopo apply la mostriamo di nuovo (la genericità non è cambiata)
					restoreProperty(propertyEl);
				}
			} else if (step.kind === 'transformPending') {
				setCapsuleOutcome(pair, 'ok');
				playCue('ok', soundEnabled);
				narration.classList.add('is-ok');
			}

			await sleep(stepMs);
		}

		if (options.clearAtEnd) {
			await sleep(400);
			clearVisuals();
		}
		return true;
	}

	NewPM.playTrace = playTrace;
	NewPM.clearVisuals = clearVisuals;
	NewPM.beginSpecialize = beginSpecialize;
	NewPM.updateSpecializeSnap = updateSpecializeSnap;
})(typeof window !== 'undefined' ? window : globalThis);
