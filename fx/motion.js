/* TF Story — motion kit (গল্প শর্ট + ইসলামিক)
   রেফারেন্স ভিডিও বিশ্লেষণ থেকে:
   1. কথার সাথে সাথে মূল বাক্য বড় হয়ে আছড়ে পড়ে (ঝাপসা → স্পষ্ট, ছোট-বড় বাউন্স, আন্ডারলাইন, পেছনে আঁধার)
   2. দৃশ্যের লেবেল ("সন্ধ্যা", "রাত") বড় হয়ে আছড়ে পড়ে, তারপর ছোট হয়ে উপরে উঠে যায়
   3. প্রতিটি দৃশ্য-বদলে প্যানেল-পর্দা (তির্যক ওয়াইপ / আইরিস / ব্লাইন্ডস) + সোনালি ধার
   4. হালকা সাউন্ড: আছড়ানোর ধাক্কা, শব্দ-পিছু ছোট টিক
   5. লেখায় "শুয়ে আছে" থাকলে চরিত্র সত্যিই বিছানায় শোয়; বইয়ের ধরন পরিবেশ ও কথা অনুযায়ী আলাদা
   সব ক্যানভাসে আঁকা + WebAudio-তে তৈরি, তাই অ্যাপ ও ওয়েব দুই জায়গাতেই এক। */
(function () {
  'use strict';
  if (typeof StoryRenderer === 'undefined') return;
  const ISL = /[?&]part=islamic\b/.test(location.search);
  const GOLD = ISL ? '#F6C453' : '#FFB224', GOLD2 = ISL ? '#FFEBB0' : '#FFE08A', PANEL = ISL ? '#08170f' : '#0e1118';
  const on = s => !s || s.motion !== false;
  const lerp = (a, b, k) => a + (b - a) * k;
  const eb = x => { x = cl(x); const c3 = 2.2; return 1 + (c3 + 1) * Math.pow(x - 1, 3) + c3 * Math.pow(x - 1, 2); };
  const strip = s => String(s || '').replace(/[{}]/g, '');
  const font = (c, px, w) => { c.font = `${w || 800} ${px}px ${FONT_BN}, ${FONT_FALLBACK}`; };
  function star8(c, x, y, r, rot) { c.save(); c.translate(x, y); c.rotate(rot || 0); c.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, q = i % 2 ? r * .62 : r; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); } c.closePath(); c.fill(); c.restore(); }

  /* =============================== PLAN (what happens when) =============================== */
  const PLAN = new WeakMap();
  function plan(story, tl) {
    let p = PLAN.get(tl); if (p && p.story === story) return p;
    p = { story, slams: [], labels: [], ticks: [] };
    let prevTime = null;
    story.scenes.forEach((sc, si) => {
      if (sc.type !== 'story') return;
      let text = String(sc.badge || '').trim(), kind = sc.time;
      if (text) { if (/রাত/.test(text)) kind = 'night'; else if (/সন্ধ্যা|বিকেল/.test(text)) kind = 'evening'; else if (/সকাল|ভোর|দুপুর|দিন/.test(text)) kind = 'day'; }
      else if (sc.time !== prevTime && (prevTime !== null || sc.time !== 'day')) text = { day: 'দিন', evening: 'সন্ধ্যা', night: 'রাত' }[sc.time] || '';
      prevTime = sc.time;
      if (text) p.labels[si] = { si, t0: sc.start, text, kind, dur: 1.4 };
    });
    let gEnd = -9, tkLast = -9;
    tl.shots.forEach(sh => {
      const sc = story.scenes[sh.si]; if (!sc || sc.type === 'cta' || sc.type === 'rewind') return; const ln = sc.lines[sh.li]; if (!ln) return;
      if (ln.card && ln.card.type === 'statement') return;
      const cap = strip(ln.cap || '');
      // key phrase → big slam
      const ph0 = String(ln.hl || '').split('|').map(s => s.replace(/[।,.!?“”"]/g, '').trim()).filter(Boolean)[0];
      if (ph0) {
        const words = ph0.split(/\s+/).slice(0, 4), text = words.join(' ');
        let idx = cap.indexOf(words[0]); if (idx < 0) idx = 0;
        let tm = sh.start + (idx / Math.max(1, cap.length)) * sh.dur * .88 + .04; tm = Math.max(tm, sh.start + .06);
        const lab = p.labels[sh.si]; if (lab && tm < lab.t0 + 1.3) tm = lab.t0 + 1.3;
        if (tm <= sh.end - .55 && tm >= gEnd + .9) { const dur = cl(sh.end - tm + .15, .85, 1.5); p.slams.push({ t: tm, dur, text, si: sh.si }); gEnd = tm + dur; }
      }
      // per-word tick
      const ws = cap.split(/\s+/).filter(Boolean), tot = Math.max(1, cap.length); let cum = 0;
      ws.forEach(w => { const tm = sh.start + (cum / tot) * sh.dur * .92 + .02; cum += w.length + 1; if (tm - tkLast >= .2 && tm < sh.end) { p.ticks.push(tm); tkLast = tm; } });
    });
    PLAN.set(tl, p); return p;
  }

  /* =============================== DRAWING =============================== */
  function drawSlam(c, e, tt, fw, fh, u) {
    const inT = .22, outT = .26, k = eb(tt / inT), a = Math.min(cl(tt / .09), cl((e.dur - tt) / outT));
    const sc = lerp(2.15, 1, k) * (tt > e.dur - outT ? 1 + .08 * (1 - cl((e.dur - tt) / outT)) : 1), blur = (1 - cl(tt / inT)) * 14 * u;
    withA(c, a * .5, () => rect(c, 0, 0, fw, fh, '#02040a'));
    const cy = fh * .3;
    if (tt < .2) withA(c, (1 - tt / .2) * .32, () => { const g = c.createRadialGradient(fw / 2, cy, 0, fw / 2, cy, fw * .7); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, fw, fh); });
    const maxW = fw * .86; let size = 176 * u, lines = [e.text]; font(c, size);
    if (c.measureText(e.text).width > maxW) {
      const ws = e.text.split(/\s+/);
      if (ws.length > 1) { let best = 1, bd = 1e9; for (let i = 1; i < ws.length; i++) { const d = Math.abs(c.measureText(ws.slice(0, i).join(' ')).width - c.measureText(ws.slice(i).join(' ')).width); if (d < bd) { bd = d; best = i; } } lines = [ws.slice(0, best).join(' '), ws.slice(best).join(' ')]; }
      const mw = Math.max(...lines.map(l => c.measureText(l).width)); size *= Math.min(1, maxW / mw);
    }
    font(c, size); const lw = Math.max(...lines.map(l => c.measureText(l).width)), lh = size * 1.2, y0 = -(lines.length - 1) * lh / 2;
    withA(c, a, () => {
      c.save(); c.translate(fw / 2, cy); c.scale(sc, sc);
      if (blur > .6) { try { c.filter = `blur(${blur}px)`; } catch (_) { } }
      c.textAlign = 'center'; c.lineJoin = 'round'; font(c, size);
      lines.forEach((l, i) => {
        const y = y0 + i * lh + size * .34;
        c.lineWidth = 16 * u; c.strokeStyle = 'rgba(8,10,16,.92)'; c.strokeText(l, 0, y);
        const g = c.createLinearGradient(0, y - size * .8, 0, y + size * .2); g.addColorStop(0, GOLD2); g.addColorStop(1, GOLD);
        c.save(); c.shadowColor = 'rgba(255,190,60,.6)'; c.shadowBlur = 38 * u; c.fillStyle = g; c.fillText(l, 0, y); c.restore();
      });
      c.filter = 'none';
      const ux = cl((tt - .2) / .25); if (ux > 0) { const by = y0 + (lines.length - 1) * lh + size * .34 + 22 * u, w = lw * eo(ux); c.save(); c.shadowColor = 'rgba(255,190,60,.7)'; c.shadowBlur = 18 * u; c.lineCap = 'round'; c.lineWidth = 10 * u; c.strokeStyle = GOLD; c.beginPath(); c.moveTo(-w / 2, by); c.lineTo(w / 2, by); c.stroke(); c.restore(); }
      if (ISL) { c.fillStyle = GOLD; const sx = lw / 2 + 80 * u, sr = 30 * u * cl(tt / .3); star8(c, -sx, 0, sr, tt * .9); star8(c, sx, 0, sr, -tt * .9); }
      c.restore();
    });
  }

  function drawLabel(c, lab, lt, fw, fh, u) {
    const T = lab.dur; if (lt < 0 || lt > T) return;
    const k = eb(lt / .24), x2 = cl((lt - .9) / .4), a = Math.min(cl(lt / .08), 1 - cl((x2 - .7) / .3));
    const sc = lerp(2.6, 1, k) * lerp(1, .34, eo(x2)), cy = lerp(fh * .4, 188 * u, eo(x2)), size = 130 * u;
    withA(c, a * (1 - x2 * .8), () => { const g = c.createLinearGradient(0, cy - 190 * u, 0, cy + 190 * u); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(0,0,0,.58)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, cy - 190 * u, fw, 380 * u); });
    withA(c, a, () => {
      c.save(); c.translate(fw / 2, cy); c.scale(sc, sc); c.textAlign = 'center'; c.lineJoin = 'round'; font(c, size);
      if (lt < .24) { try { c.filter = `blur(${(1 - lt / .24) * 10 * u}px)`; } catch (_) { } }
      const tw = c.measureText(lab.text).width, ix = -tw / 2 - 90 * u;
      c.lineWidth = 14 * u; c.strokeStyle = 'rgba(8,10,16,.92)'; c.strokeText(lab.text, 0, size * .34);
      c.save(); c.shadowColor = 'rgba(255,190,60,.55)'; c.shadowBlur = 30 * u; c.fillStyle = GOLD2; c.fillText(lab.text, 0, size * .34); c.restore(); c.filter = 'none';
      // small icon at the left
      c.save(); c.translate(ix, 0); c.fillStyle = GOLD; c.strokeStyle = GOLD; c.lineWidth = 8 * u; c.lineCap = 'round'; const r = 34 * u;
      if (lab.kind === 'night') P(c, `M0,${-r} A${r * 1.05},${r * 1.05} 0 1 0 0,${r} A${r * 1.5},${r * 1.5} 0 0 1 0,${-r}Z`, GOLD);
      else if (lab.kind === 'evening') { c.beginPath(); c.arc(0, r * .5, r * .8, Math.PI, 0); c.fill(); c.beginPath(); c.moveTo(-r * 1.3, r * .5); c.lineTo(r * 1.3, r * .5); c.stroke(); }
      else { c.beginPath(); c.arc(0, 0, r * .6, 0, 7); c.fill(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; c.beginPath(); c.moveTo(Math.cos(an) * r * .9, Math.sin(an) * r * .9); c.lineTo(Math.cos(an) * r * 1.3, Math.sin(an) * r * 1.3); c.stroke(); } }
      c.restore();
      const lw2 = (tw / 2 + 60 * u) * eo((lt - .1) / .3); c.lineCap = 'round'; c.lineWidth = 6 * u; c.strokeStyle = GOLD; c.beginPath(); c.moveTo(-lw2, size * .62); c.lineTo(lw2, size * .62); c.stroke();
      c.restore();
    });
  }

  function drawPanel(c, style, cover, phase, fw, fh, u) {
    if (cover <= .002) return; c.save(); c.fillStyle = PANEL; c.strokeStyle = GOLD; c.lineWidth = 12 * u; c.shadowColor = 'rgba(255,190,60,.8)'; c.shadowBlur = 0;
    if (style === 0) {
      const sl = 150 * u, ex = (phase === 'out' ? cover : 1 - cover) * (fw + sl);
      c.beginPath(); if (phase === 'out') { c.moveTo(0, 0); c.lineTo(ex, 0); c.lineTo(ex - sl, fh); c.lineTo(0, fh); } else { c.moveTo(ex, 0); c.lineTo(fw, 0); c.lineTo(fw, fh); c.lineTo(ex - sl, fh); }
      c.closePath(); c.fill(); if (cover < .995) { c.shadowBlur = 26 * u; c.beginPath(); c.moveTo(ex, 0); c.lineTo(ex - sl, fh); c.stroke(); }
    } else if (style === 1) {
      const R = (1 - cover) * (Math.hypot(fw, fh) / 2 + 40 * u); c.beginPath(); c.rect(0, 0, fw, fh); c.arc(fw / 2, fh / 2, R, 0, Math.PI * 2, true); c.fill('evenodd');
      if (R > 3 && cover > .01) { c.shadowBlur = 26 * u; c.beginPath(); c.arc(fw / 2, fh / 2, R, 0, Math.PI * 2); c.stroke(); }
    } else {
      const n = 8, h = fh / n;
      for (let i = 0; i < n; i++) { const am = cl(cover * 1.5 - i * .07); if (am <= 0) continue; const w = am * fw, x = i % 2 ? fw - w : 0; c.fillRect(x, i * h - .5, w, h + 1); if (am < .995) { c.fillStyle = GOLD; c.fillRect(i % 2 ? x - 6 * u : x + w, i * h, 6 * u, h); c.fillStyle = PANEL; } }
    }
    if (ISL && cover > .85) { c.shadowBlur = 0; c.globalAlpha *= .14 * cl((cover - .85) / .15); c.fillStyle = GOLD; star8(c, fw / 2, fh / 2, 340 * u, cover * 1.2); }
    c.restore();
  }

  function drawMotion(r, c, t, si, fw, fh) {
    const st = r.story, tl = r.tl; if (!st || !tl) return; const sc = st.scenes[si]; if (!sc) return;
    const p = plan(st, tl), u = Math.sqrt(fw * fh / (1080 * 1920)), lt = t - sc.start;
    for (const e of p.slams) { if (t >= e.t && t < e.t + e.dur) { drawSlam(c, e, t - e.t, fw, fh, u); break; } if (e.t > t) break; }
    const lab = p.labels[si]; if (lab) drawLabel(c, lab, lt, fw, fh, u);
    // scene-change panel: closes in the last .16 s of the outgoing scene, opens in the first .38 s of the next one
    if (si > 0 && lt < .38) drawPanel(c, si % 3, 1 - eo(lt / .38), 'in', fw, fh, u);
    else if (si < st.scenes.length - 1 && sc.end - t < .16 && sc.end - t >= 0) drawPanel(c, (si + 1) % 3, 1 - (sc.end - t) / .16, 'out', fw, fh, u);
  }

  const _ui = StoryRenderer.prototype.drawUI;
  StoryRenderer.prototype.drawUI = function (c, t, si, fw, fh) {
    _ui.call(this, c, t, si, fw, fh);
    if (this.isLong || !on(this.settings) || (this.story && this.story.fmt === 'long')) return;
    try { drawMotion(this, c, t, si, fw || 1080, fh || 1920); } catch (e) { if (!this._mxe) { this._mxe = 1; console.error('motion fx:', e); } }
  };

  /* =============================== SOUND =============================== */
  const _sfx = sfx;
  sfx = function (ctx, dest, kind, t0, noise, abs) {
    if (kind === 'slam' || kind === 'hit') {
      const big = kind === 'slam', g = ctx.createGain(); g.connect(dest); const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(big ? 150 : 230, t0); o.frequency.exponentialRampToValueAtTime(big ? 48 : 95, t0 + .2);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(big ? .5 : .22, t0 + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + .3); o.connect(g); o.start(t0); o.stop(t0 + .32);
      const s = ctx.createBufferSource(); s.buffer = noise; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = .8; const g2 = ctx.createGain();
      g2.gain.setValueAtTime(big ? .2 : .1, t0); g2.gain.exponentialRampToValueAtTime(.0001, t0 + .09); s.connect(bp); bp.connect(g2); g2.connect(dest); s.start(t0, 0, .12); return;
    }
    if (kind === 'wtick') {
      const s = ctx.createBufferSource(); s.buffer = noise; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000 + (Math.floor((abs || 0) * 91) % 5) * 420; const g = ctx.createGain();
      g.gain.setValueAtTime(.045, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + .02); s.connect(hp); hp.connect(g); g.connect(dest); s.start(t0, 0, .03); return;
    }
    return _sfx(ctx, dest, kind, t0, noise, abs);
  };
  window.TF_MOTION_SFX = function (story, tl, S, play) {
    if (!story || story.fmt === 'long' || !on(S)) return; const p = plan(story, tl);
    p.slams.forEach(e => play('slam', e.t));
    p.labels.forEach(l => { if (l) play('slam', l.t0 + .22); });
    if (S.motionTick !== false) p.ticks.forEach(tm => play('wtick', tm));
  };

  /* =============================== ACTS FROM THE TEXT (শুয়ে আছে → সত্যিই শোয়) =============================== */
  if (!ACTIONS.includes('lie')) ACTIONS.push('lie'); try { DO_BN.lie = 'বিছানায় শোয়া'; } catch (_) { }
  const RE_LIE = /শুয়ে|শয্যা|বিছানায়|বিছানার ওপর|ঘুমিয়ে (?:আছ|পড়)|ঘুমাচ্ছ/, RE_NOT = /বসে|দাঁড়িয়ে|উঠে/, RE_UP = /উঠে (?:বসল|দাঁড়াল|পড়ল|এল)|উঠে দাঁড়|উঠে বস|বিছানা ছেড়ে|উঠলেন|উঠল/;
  const EXTRA = ISL ? [[/সিজদা|সেজদা|রুকু/, 'kneel'], [/দোয়া|মোনাজাত|হাত তুলে/, 'dua'], [/দৌড়/, 'run'], [/হেঁটে|হাঁটছ|হাঁটতে হাঁটতে|এগিয়ে চল/, 'walk'], [/মেঝেতে বসে|বসে (?:আছ|পড়)|বসলেন|বসল/, 'sit']] : [];
  function fixActs(story) {
    if (!story || story.fmt === 'long') return;
    const names = (story.characters || []).map(ch => [ch.id, ch.name]).filter(x => x[1] && x[1].length > 1);
    story.scenes.forEach(sc => {
      if (sc.type !== 'story') return; const lying = {};
      sc.lines.forEach(ln => {
        const txt = strip(ln.cap || ''), men = names.filter(([id, nm]) => txt.includes(nm) && (sc.cast || []).includes(id)).map(x => x[0]);
        let a = ln.who || ln.focus;
        if (RE_LIE.test(txt) && !RE_NOT.test(txt)) {
          const target = men.length === 1 ? men[0] : a;
          if (target && (target === a || !ln.who)) { if (!ln.who) ln.focus = target; ln.do = 'lie'; ln.hold = ''; lying[target] = true; return; }
        }
        if (a && lying[a]) { if (RE_UP.test(txt)) { ln.do = 'idle'; lying[a] = false; } else if (!ln.do || ['idle', 'talk', 'head_down'].includes(ln.do)) ln.do = 'lie'; return; }
        if (!ln.do) { const x = EXTRA.find(([re]) => re.test(txt)); if (x && ACTIONS.includes(x[1])) ln.do = x[1]; }
      });
    });
  }
  const _load = StoryRenderer.prototype.load;
  StoryRenderer.prototype.load = function (story, tl, settings) { try { fixActs(story); } catch (e) { console.error('fixActs', e); } return _load.call(this, story, tl, settings); };

  /* ---- the bed + lying person ---- */
  const _dpe = drawPerson;
  drawPerson = function (c, o) {
    if ((o.act || '') !== 'lie') return _dpe(c, o);
    const L = o.L, S0 = (o.s || 1) * (L.kid ? .74 : L.teen ? .92 : 1), px = Math.max(o.x + 90 * S0, 540 * S0), py = o.y + 56 * S0, gy = o.y + 266 * S0, t = o.t || 0, sd = o.seed || 0;
    const wood = ISL ? '#6a4a2c' : '#7a5232', sheet = ISL ? '#F3EBD6' : '#F2E8E0', blank = ISL ? ['#2E6B52', '#3d8466'] : ['#B5483A', '#c9604f'];
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    ell(c, px - 60 * S0, gy + 6 * S0, 470 * S0, 22 * S0, 'rgba(0,0,0,.16)');
    rr(c, px - 500 * S0, gy - 260 * S0, 44 * S0, 270 * S0, 14 * S0, wood); rr(c, px + 330 * S0, gy - 150 * S0, 34 * S0, 160 * S0, 12 * S0, wood);
    rr(c, px - 490 * S0, gy - 48 * S0, 860 * S0, 46 * S0, 10 * S0, wood); rr(c, px - 480 * S0, gy - 98 * S0, 830 * S0, 66 * S0, 24 * S0, sheet);
    ell(c, px - 372 * S0, py - 8 * S0, 96 * S0, 58 * S0, '#fff', 'rgba(0,0,0,.12)', 3);
    c.save(); c.translate(px, py); c.scale(1, 1 + Math.sin(t * 1.5 + sd) * .01); c.rotate(-Math.PI / 2); _dpe(c, Object.assign({}, o, { x: 0, y: 0, act: 'idle', flip: false, tilt: 0, talk: o.talk, alpha: null })); c.restore();
    const bx = px - 30 * S0, bw = 400 * S0, by = py - 140 * S0, bh = 270 * S0;
    rr(c, bx, by, bw, bh, 40 * S0, blank[0]); rr(c, bx, by, bw, 56 * S0, 28 * S0, blank[1]);
    c.save(); c.globalAlpha *= .22; for (let i = 1; i < 4; i++) { c.strokeStyle = '#000'; c.lineWidth = 4 * S0; c.beginPath(); c.moveTo(bx + 90 * S0 * i, by + 70 * S0); c.quadraticCurveTo(bx + 90 * S0 * i - 14 * S0, by + bh * .6, bx + 90 * S0 * i + 8 * S0, by + bh - 8 * S0); c.stroke(); } c.restore();
    if (!/crying|worried|angry|surprised/.test(o.feel || '')) { c.fillStyle = 'rgba(255,255,255,.85)'; c.textAlign = 'center'; for (let i = 0; i < 3; i++) { const ph = (t * .7 + i * .33) % 1, zs = (34 + i * 12) * S0; font(c, zs, 800); c.globalAlpha = Math.sin(ph * Math.PI) * .9; c.fillText('z', px - 430 * S0 - 40 * S0 * i - ph * 60 * S0, py - 190 * S0 - ph * 150 * S0); } c.globalAlpha = 1; }
    c.restore();
  };

  /* =============================== BOOKS: পরিবেশ অনুযায়ী আলাদা বই =============================== */
  let CTX = { place: '', cap: '', si: 0 };
  const _ds = StoryRenderer.prototype.drawScene;
  StoryRenderer.prototype.drawScene = function (c, si, t) {
    try { const sc = this.story.scenes[si]; let cap = ''; const sh = this.tl && this.tl.shots[this.shotAt(t)]; if (sh && sh.si === si) cap = (sc.lines[sh.li] || {}).cap || ''; CTX = { place: String(sc.place || ''), cap, si, time: sc.time }; } catch (_) { }
    return _ds.call(this, c, si, t);
  };
  const BOOKS = ['quran', 'kitab', 'textbook', 'notebook', 'diary', 'storybook', 'ledger'];
  function pickBook() {
    const cap = CTX.cap, pl = CTX.place.toLowerCase();
    if (/কুরআন|কোরআন|কুরআনের/.test(cap)) return 'quran';
    if (/কিতাব|হাদিস|তাফসির|পুরোনো বই|পুরনো বই/.test(cap)) return 'kitab';
    if (/ডায়েরি/.test(cap)) return 'diary'; if (/খাতা/.test(cap)) return /হিসাব|ক্যাশ|সঞ্চয়|বাকি/.test(cap) ? 'ledger' : 'notebook';
    if (/হিসাব|ক্যাশ|সঞ্চয়|লেজার/.test(cap)) return 'ledger'; if (/গল্প|ছড়া|ছবির বই|রূপকথা/.test(cap)) return 'storybook';
    if (/পাঠ্য|পরীক্ষা|ক্লাস|স্কুল|পড়া/.test(cap)) return 'textbook';
    if (/mosque|masjid|quran|madrasa|hifz|prayer|eid|hajj|kaaba|arafat|zamzam|medina|makka/.test(pl)) return 'quran';
    if (/school|class|study|library|campus/.test(pl)) return 'textbook'; if (/shop|market|store|office|bank/.test(pl)) return 'ledger';
    return BOOKS[(typeof hashStr === 'function' ? hashStr(pl + CTX.si) : CTX.si) % BOOKS.length];
  }
  function drawBook(c, v, t) {
    const pages = () => { rr(c, -56, -74, 116, 148, 6, '#F6EFDD'); for (let i = 0; i < 4; i++) rect(c, 50, -66 + i * 36, 8, 2, 'rgba(0,0,0,.12)'); };
    if (v === 'quran') { pages(); rr(c, -60, -78, 114, 156, 8, '#1F5D45'); rr(c, -60, -78, 14, 156, 4, '#143d2d'); rr(c, -38, -60, 80, 120, 6, null, GOLD, 3); c.fillStyle = GOLD; star8(c, 2, 0, 28, 0); c.fillStyle = '#1F5D45'; star8(c, 2, 0, 15, Math.PI / 8); c.fillStyle = GOLD; [[-30, -50], [34, -50], [-30, 50], [34, 50]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); }); }
    else if (v === 'kitab') { pages(); rr(c, -60, -78, 114, 156, 6, '#6B4423'); rr(c, -60, -78, 14, 156, 4, '#4a2e15'); P(c, 'M54,-78 L40,-78 L54,-64Z', '#caa56b'); P(c, 'M54,78 L40,78 L54,64Z', '#caa56b'); rr(c, -34, -46, 76, 50, 6, '#EADBB5', '#3a2410', 2); for (let i = 0; i < 3; i++) line(c, -24, -32 + i * 14, 32, -32 + i * 14, '#3a2410', 3); line(c, 20, 78, 20, 112, '#B03030', 5); P(c, 'M14,112 L26,112 L20,124Z', '#B03030'); }
    else if (v === 'textbook') { pages(); rr(c, -60, -78, 114, 156, 6, '#2F6DB5'); rr(c, -60, -78, 12, 156, 3, '#1d4a80'); rr(c, -36, -62, 78, 30, 6, '#fff'); line(c, -26, -47, 32, -47, '#2F6DB5', 6); c.fillStyle = '#9fd0f5'; c.fillRect(-36, -16, 78, 70); c.fillStyle = '#FFD24A'; c.beginPath(); c.arc(18, 4, 11, 0, 7); c.fill(); P(c, 'M-36,54 L-8,18 L12,40 L28,24 L42,54Z', '#3b9b5a'); }
    else if (v === 'notebook') { rr(c, -60, -78, 120, 156, 8, '#E9573F'); rr(c, -34, -50, 78, 58, 6, '#fff'); for (let i = 0; i < 3; i++) line(c, -24, -34 + i * 16, 34, -34 + i * 16, '#9bb', 3); for (let i = 0; i < 8; i++) { circ(c, -60, -66 + i * 19, 5, '#cfd3d6', '#7a7f85', 2); } }
    else if (v === 'diary') { pages(); rr(c, -60, -78, 114, 156, 8, '#5B1F2B'); rr(c, -60, -78, 14, 156, 4, '#3d1119'); rr(c, 16, -78, 12, 156, 2, '#C9A24B'); circ(c, 22, 0, 9, '#E6C36A', '#8a6a1f', 2); c.fillStyle = '#E6C36A'; star8(c, -16, -50, 10, 0); }
    else if (v === 'storybook') { pages(); rr(c, -60, -78, 114, 156, 8, '#F2B134'); rr(c, -60, -78, 14, 156, 4, '#c98a14'); rr(c, -36, -58, 80, 92, 8, '#2b3a78'); P(c, 'M14,-44 A18,18 0 1 0 14,-6 A24,24 0 0 1 14,-44Z', '#FFE08A'); c.fillStyle = '#FFE08A'; star8(c, -8, 14, 8, 0); star8(c, 26, 18, 6, 0); rr(c, -36, 44, 80, 16, 8, '#fff'); }
    else { pages(); rr(c, -60, -78, 114, 156, 4, '#1d1f24'); rr(c, -60, -78, 18, 156, 3, '#8c2230'); P(c, 'M54,-78 L36,-78 L54,-60Z', '#8c2230'); P(c, 'M54,78 L36,78 L54,60Z', '#8c2230'); rr(c, -30, -40, 76, 44, 5, '#EADBB5'); font(c, 28, 800); c.fillStyle = '#1d1f24'; c.textAlign = 'center'; c.fillText('হিসাব', 8, -10); for (let i = 0; i < 3; i++) line(c, -22, 22 + i * 12, 38, 22 + i * 12, '#8c2230', 2); }
  }
  const _dprop = drawProp;
  drawProp = function (c, kind, s, t, big) { if (kind !== 'book') return _dprop(c, kind, s, t, big); c.save(); c.scale(s, s); try { drawBook(c, pickBook(), t); } finally { c.restore(); } };

  /* =============================== SETTINGS =============================== */
  try {
    const host = document.getElementById('sCtxBg');
    if (host && !document.getElementById('sMotion')) {
      host.closest('label').insertAdjacentHTML('afterend', '<label class="chk"><input type="checkbox" id="sMotion"> বড়-লেখা ও মোশন (মূল কথা বড় হয়ে আছড়ে পড়া, দৃশ্য-লেবেল, দৃশ্য-বদলের অ্যানিমেশন)</label><label class="chk"><input type="checkbox" id="sMotionTick"> প্রতিটি শব্দে হালকা টিক সাউন্ড</label>');
      const a = document.getElementById('sMotion'), b = document.getElementById('sMotionTick'); a.checked = S.motion !== false; b.checked = S.motionTick !== false;
      bindSetting('sMotion', 'motion', t => t.checked); bindSetting('sMotionTick', 'motionTick', t => t.checked);
    }
  } catch (e) { console.error('motion ui', e); }
  window.TF_MOTION = { plan, fixActs, pickBook, drawBook };
})();
