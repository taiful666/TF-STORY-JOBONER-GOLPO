/* TF Story Studio — cinematic concept visuals for LONG videos.
   Learned from the "documentary explainer" look of popular Bangla channels (style only, never their content):
   every idea in the narration gets its own animated picture — a flipping calendar, a night skyline whose windows light up,
   a bar chart that grows, a letter being signed, a map route, a magnifier, a lock … drawn on a dark cinematic background
   (vignette, glow, grid, drifting dust, film grain), with small labels that pop in on the beat.
   Everything is drawn with the canvas — no images — so it also exports on the phone.
   The renderer (index.html, LongRenderer) calls LV.plan() once per story, then LV.draw() for every visual shot. */
const LV = (() => {
  'use strict';
  const BND = '০১২৩৪৫৬৭৮৯';
  const toEn = s => String(s == null ? '' : s).replace(/[০-৯]/g, d => BND.indexOf(d));
  const toBn = s => String(s == null ? '' : s).replace(/\d/g, d => BND[d]);
  const num = s => { const m = toEn(s).replace(/,/g, '').match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };
  const grp = n => { let s = String(Math.round(n)); if (s.length <= 3) return toBn(s); const last = s.slice(-3); let rest = s.slice(0, -3); const parts = []; while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); } if (rest) parts.unshift(rest); return toBn(parts.join(',') + ',' + last); };
  const MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
  const C = { cl: (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)) };
  const eo = x => 1 - Math.pow(1 - C.cl(x), 3);
  const eio = x => { x = C.cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const bk = (t, s, d = .45) => { const x = C.cl((t - s) / d); if (x <= 0) return 0; const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const BN = () => (typeof FONT_BN !== 'undefined' ? FONT_BN : 'sans-serif');
  const FB = () => (typeof FONT_FALLBACK !== 'undefined' ? FONT_FALLBACK : 'sans-serif');
  const font = (w, s, fam) => `${w} ${s}px ${fam || BN()}, ${FB()}`;

  /* ---------- colour themes (dark, cinematic) ---------- */
  const TH = {
    night: { a: '#060C18', b: '#10264A', glow: '#2F6BFF', acc: '#FFD23F', ink: '#FFFFFF', dim: '#8FA6C9', ok: '#7CFF8A', bad: '#FF5468' },
    ember: { a: '#140A07', b: '#3C1F12', glow: '#FF8A3D', acc: '#FFB347', ink: '#FFF4E4', dim: '#C9A27F', ok: '#9CF0A0', bad: '#FF6A55' },
    money: { a: '#05120D', b: '#0D3526', glow: '#1FD38A', acc: '#9CFFB8', ink: '#F0FFF6', dim: '#7FBF9F', ok: '#7CFF8A', bad: '#FF6A6A' },
    alert: { a: '#150507', b: '#40101A', glow: '#FF3B4E', acc: '#FFC857', ink: '#FFF2F2', dim: '#C98A92', ok: '#7CFF8A', bad: '#FF5468' },
    steel: { a: '#080D13', b: '#1B2A39', glow: '#58B6FF', acc: '#7FDBFF', ink: '#F2FAFF', dim: '#86A3BA', ok: '#7CFF8A', bad: '#FF6A7A' },
    plum: { a: '#10091A', b: '#2D1848', glow: '#B05CFF', acc: '#FFD7A0', ink: '#FBF3FF', dim: '#B49BD0', ok: '#9CF0B0', bad: '#FF6A8A' }
  };

  /* ---------- cinematic background: gradient, glow, grid, dust, vignette, grain ---------- */
  let _grain = null;
  function grainTile() {
    if (_grain) return _grain; const cv = document.createElement('canvas'); cv.width = cv.height = 192; const x = cv.getContext('2d'), id = x.createImageData(192, 192), r = rng(77);
    for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - .5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 30; } x.putImageData(id, 0, 0); return (_grain = cv);
  }
  function bg(c, o, th) {
    const FW = o.FW, FH = o.FH, u = o.u, t = o.t, T = TH[th] || TH.night;
    const g = c.createLinearGradient(0, 0, 0, FH); g.addColorStop(0, T.a); g.addColorStop(1, T.b); c.fillStyle = g; c.fillRect(0, 0, FW, FH);
    // soft light bloom behind the subject, slowly breathing
    const gx = FW * (.5 + .06 * Math.sin(t * .4 + o.seed % 7)), gy = FH * .42, gr = Math.max(FW, FH) * (.55 + .03 * Math.sin(t * .7));
    const rg = c.createRadialGradient(gx, gy, 10, gx, gy, gr); rg.addColorStop(0, T.glow + '55'); rg.addColorStop(.55, T.glow + '14'); rg.addColorStop(1, T.glow + '00'); c.fillStyle = rg; c.fillRect(0, 0, FW, FH);
    // faint grid drifting upward (depth)
    c.save(); c.strokeStyle = 'rgba(150,185,255,.055)'; c.lineWidth = 1; const gs = 90 * u, off = (t * 7 * u) % gs;
    c.beginPath(); for (let x = -gs; x <= FW + gs; x += gs) { c.moveTo(x + .5, 0); c.lineTo(x + .5, FH); } for (let y = -gs; y <= FH + gs; y += gs) { c.moveTo(0, y + off + .5); c.lineTo(FW, y + off + .5); } c.stroke(); c.restore();
    // dust motes
    for (let i = 0; i < 26; i++) { const x = (i * 263 + Math.sin(t * .3 + i) * 30) % FW, y = (FH - ((i * 331 + t * (10 + i % 5 * 4) * u) % FH)), a = .06 + (i % 4) * .035; c.globalAlpha = a; c.fillStyle = T.acc; c.beginPath(); c.arc(Math.abs(x), y, (1.4 + i % 3) * u, 0, 7); c.fill(); } c.globalAlpha = 1;
    // vignette
    const vg = c.createRadialGradient(FW / 2, FH / 2, Math.min(FW, FH) * .32, FW / 2, FH / 2, Math.max(FW, FH) * .74); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.72)'); c.fillStyle = vg; c.fillRect(0, 0, FW, FH);
  }
  function grain(c, o) {
    try { const tile = grainTile(), n = Math.floor(o.t * 20); c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = .5; c.fillStyle = c.createPattern(tile, 'repeat'); c.translate((n * 53) % 192, (n * 97) % 192); c.fillRect(-192, -192, o.FW + 384, o.FH + 384); c.restore(); } catch (e) { }
  }

  /* ---------- small drawing helpers (work in the scene's own 1600×800 space) ---------- */
  const R = (c, x, y, w, h, r, fill, stroke, lw) => { c.beginPath(); c.roundRect(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 4; c.stroke(); } };
  const O = (c, x, y, r, fill, stroke, lw) => { c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 4; c.stroke(); } };
  const L = (c, x1, y1, x2, y2, col, lw) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = col; c.lineWidth = lw || 4; c.lineCap = 'round'; c.stroke(); };
  const TXT = (c, s, x, y, size, col, weight, align, fam, maxW) => { c.font = font(weight || 700, size, fam); c.fillStyle = col; c.textAlign = align || 'center'; c.textBaseline = 'alphabetic'; if (maxW) { const w = c.measureText(s).width; if (w > maxW) { c.save(); c.translate(x, y); c.scale(maxW / w, 1); c.fillText(s, 0, 0); c.restore(); return; } } c.fillText(s, x, y); };
  const tw = (c, s, size, weight, fam) => { c.font = font(weight || 700, size, fam); return c.measureText(s).width; };
  const pop = (c, x, y, k, fn) => { if (k <= 0) return; c.save(); c.translate(x, y); c.scale(k, k); c.translate(-x, -y); c.globalAlpha *= C.cl(k * 1.5); fn(); c.restore(); };
  const glowText = (c, s, x, y, size, col, glow, weight, fam, maxW) => { c.save(); c.shadowColor = glow; c.shadowBlur = size * .35; TXT(c, s, x, y, size, col, weight || 800, 'center', fam, maxW); c.restore(); };
  /* a label chip that pops in: dark pill, accent underline, blur-in text */
  function chip(c, s, x, y, size, k, T, opt) {
    if (!s || k <= 0) return; opt = opt || {}; const w = tw(c, s, size, 800) + size * 1.2, h = size * 1.7;
    pop(c, x, y, k, () => { c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 18; c.shadowOffsetY = 6; R(c, x - w / 2, y - h / 2, w, h, size * .3, opt.bg || 'rgba(8,12,22,.86)', opt.edge || null, 3); c.restore();
      TXT(c, s, x, y + size * .3, size, opt.ink || T.ink, 800, 'center', null, w - size * .6); R(c, x - w / 2 + size * .5, y + h / 2 - size * .22, (w - size) * eo(k), 4, 2, opt.line || T.acc); });
  }
  /* big accent number / word with glow */
  function big(c, s, x, y, size, T, k, col) { if (k <= 0) return; c.save(); c.globalAlpha *= C.cl(k * 1.4); c.translate(x, y); const z = .9 + .1 * C.cl(k); c.scale(z, z); glowText(c, s, 0, 0, size, col || T.ink, (col || T.acc) + 'cc', 800, 'TFDisp'); c.restore(); }
  function arrow(c, x1, y1, x2, y2, col, lw, k) { const dx = x2 - x1, dy = y2 - y1, a = Math.atan2(dy, dx), e = C.cl(k == null ? 1 : k); const xe = x1 + dx * e, ye = y1 + dy * e; L(c, x1, y1, xe, ye, col, lw); if (e > .98) { c.save(); c.translate(x2, y2); c.rotate(a); c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.lineTo(-lw * 3.4, -lw * 2.2); c.lineTo(-lw * 3.4, lw * 2.2); c.closePath(); c.fill(); c.restore(); } }
  function person(c, x, y, s, skin, shirt, hat) { // simple avatar: head + shoulders
    O(c, x, y - 26 * s, 17 * s, skin); c.beginPath(); c.moveTo(x - 30 * s, y + 34 * s); c.quadraticCurveTo(x - 30 * s, y - 2 * s, x, y - 4 * s); c.quadraticCurveTo(x + 30 * s, y - 2 * s, x + 30 * s, y + 34 * s); c.closePath(); c.fillStyle = shirt; c.fill();
    if (hat) { R(c, x - 17 * s, y - 62 * s, 34 * s, 22 * s, 8 * s, '#FFFFFF'); R(c, x - 14 * s, y - 46 * s, 28 * s, 9 * s, 3 * s, '#F1F1F1'); }
  }
  const SKIN = ['#C98B5C', '#B07448', '#D9A06F', '#8D5A3B', '#E0B088'], SHIRT = ['#4C7BD9', '#E0883A', '#3FA37C', '#B45BD6', '#D9534F', '#E8C547'];

  const KINDS = {};
  const THEME_OF = {};
  const reg = (name, th, fn) => { KINDS[name] = fn; THEME_OF[name] = th; };

  /* ================= scenes (each drawn around (0,0) in a 1600×800 space) ================= */

  /* flipping calendar: the old day tears away and the new date lands */
  reg('calendar', 'ember', (c, o) => {
    const T = o.T, tx = o.tx; let month = '', day = '', year = '';
    tx.join(' ').split(/\s+/).forEach(w => { const n = toEn(w).replace(/[^\d]/g, ''); if (/^\d{4}$/.test(n)) year = toBn(n); else if (/^\d{1,2}$/.test(n) && !day) day = toBn(n); else if (!month && MONTHS.some(m => w.indexOf(m) === 0)) month = w.replace(/[^ঀ-৿]/g, ''); });
    if (!month && !day) { month = tx[0] || 'তারিখ'; day = ''; }
    const prev = day ? toBn(Math.max(1, (parseInt(toEn(day), 10) || 2) - 1)) : '';
    const k = bk(o.lt, .02, .55), W = 600, H = 680, x = -W / 2, y = -H / 2 - 10;
    pop(c, 0, 0, k, () => {
      c.save(); c.rotate(-.06); R(c, x + 14, y + 22, W, H, 30, '#D9D2C6'); c.restore(); c.save(); c.rotate(.035); R(c, x + 6, y + 12, W, H, 30, '#ECE6DB'); c.restore();
      const page = (d, flap) => { c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = flap ? 20 : 46; c.shadowOffsetY = 18; R(c, x, y, W, H, 30, '#FFFFFF'); c.restore();
        c.save(); c.beginPath(); c.roundRect(x, y, W, H, 30); c.clip(); R(c, x, y, W, 150, 0, '#E0342F'); const gl = c.createLinearGradient(0, y, 0, y + 150); gl.addColorStop(0, 'rgba(255,255,255,.25)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gl; c.fillRect(x, y, W, 150); c.restore();
        [-170, 170].forEach(dx => { R(c, dx - 12, y - 30, 24, 70, 12, '#3A3A3F'); O(c, dx, y + 22, 8, '#111'); });
        TXT(c, month || 'তারিখ', 0, y + 100, 84, '#FFFFFF', 800, 'center', 'TFDisp', W - 80);
        if (d) TXT(c, d, 0, y + 440, 330, '#171B26', 800, 'center', 'TFDisp', W - 90);
        if (year) TXT(c, year, 0, y + 582, 64, '#6C7384', 700, 'center', null, W - 120); };
      page(day, false);
      const f = eio((o.lt - .55) / .55);
      if (day && f < 1) { c.save(); c.translate(0, y); c.scale(1, Math.max(.001, 1 - f)); c.translate(0, -y); page(prev, true); c.restore(); }
      if (f >= 1 && o.lt < 1.3) { const s = Math.sin((o.lt - 1.1) * 40) * Math.max(0, 1.3 - o.lt) * 6; c.translate(0, s); }
    });
    if (tx[3]) chip(c, tx[3], 0, 400, 44, bk(o.lt, 1.1, .4), T);
  });

  /* night skyline: windows light up one by one, one tower is highlighted with a sign */
  reg('skyline', 'night', (c, o) => {
    const T = o.T, tx = o.tx, r = rng(o.seed), lt = o.lt, base = 330;
    for (let i = 0; i < 46; i++) { const sx = (r() * 2400 - 1200), sy = -r() * 520 - 80; O(c, sx, sy, .8 + r() * 1.6, 'rgba(255,255,255,' + (.25 + .35 * Math.abs(Math.sin(lt * 1.3 + i))) + ')'); }
    O(c, 560, -300, 70, '#EAF1FF'); O(c, 590, -318, 62, T.a); c.globalAlpha = .14; O(c, 560, -300, 150, '#BBD0FF'); c.globalAlpha = 1;
    const hi = Math.floor(o.seed % 3) + 7;
    [[.45, '#0C1830', 130], [.7, '#101F3C', 90], [1, '#16294C', 60]].forEach(([sc, col, wBase], layer) => {
      const rr2 = rng(o.seed + layer * 31); let x = -1150 + layer * 30 + (Math.sin(lt * .2) * 8) * (1 - sc); let idx = 0;
      while (x < 1150) { const w = wBase * (.7 + rr2() * .9), h = (150 + rr2() * 330) * (layer === 2 ? 1.15 : sc + .3), isHi = layer === 2 && idx === hi, hh = isHi ? 520 : h, ww = isHi ? 170 : w;
        c.fillStyle = col; c.fillRect(x, base - hh, ww, hh + 400);
        const cols = Math.max(2, Math.floor(ww / 26)), rows = Math.floor(hh / 34);
        for (let a = 0; a < cols; a++) for (let b = 0; b < rows; b++) { const hv = hash(layer + ':' + idx + ':' + a + ':' + b) % 1000 / 1000, on = hv < .18 + .52 * C.cl((lt - .1 - hv * 1.8) / .8) * (layer + 1) / 3 + (isHi ? .35 : 0); if (on) { c.fillStyle = hv < .1 ? '#FFE9A8' : hv < .45 ? '#FFD66B' : '#9FD4FF'; c.globalAlpha = .55 + .45 * (isHi ? 1 : hv); c.fillRect(x + 10 + a * ((ww - 20) / cols), base - hh + 14 + b * 34, (ww - 20) / cols - 8, 18); c.globalAlpha = 1; } }
        if (isHi) { c.save(); c.strokeStyle = T.acc; c.lineWidth = 4; c.shadowColor = T.acc; c.shadowBlur = 24 * (.6 + .4 * Math.sin(lt * 3)); c.strokeRect(x, base - hh, ww, hh); c.restore(); L(c, x + ww / 2, base - hh, x + ww / 2, base - hh - 70, '#6C7A99', 4); O(c, x + ww / 2, base - hh - 74, 6 + 3 * Math.abs(Math.sin(lt * 4)), '#FF4B4B');
          const k = bk(lt, .7, .5); if (tx[0]) { c.save(); c.translate(x + ww / 2, base - hh - 130); pop(c, 0, 0, k, () => { const sw = Math.max(240, tw(c, tx[0], 54, 800) + 70); R(c, -sw / 2, -42, sw, 84, 8, 'rgba(10,14,26,.92)', '#E5484D', 5); TXT(c, tx[0], 0, 18, 54, '#FFFFFF', 800, 'center', null, sw - 30); }); c.restore(); } }
        x += ww + 6 + rr2() * 14; idx++; }
    });
    const gr = c.createLinearGradient(0, base - 20, 0, base + 120); gr.addColorStop(0, 'rgba(255,200,90,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(-1300, base - 20, 2600, 140); c.fillStyle = '#060B16'; c.fillRect(-1300, base + 6, 2600, 300);
    if (tx[1]) chip(c, tx[1], 0, 405, 44, bk(lt, 1, .4), T);
  });

  /* a single building: school / bank / office tower / factory, with a sign */
  reg('building', 'ember', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, key = String(tx[1] || tx[0] || ''), kind = /স্কুল|school|বিদ্যালয়/i.test(key) ? 'school' : /ব্যাংক|bank|সরকার|gov|আদালত|court/i.test(key) ? 'bank' : /কারখানা|factory|মিল/i.test(key) ? 'factory' : 'office';
    const k = bk(lt, .02, .6), gy = 330; pop(c, 0, gy, k, () => {
      const gg = c.createLinearGradient(0, gy - 10, 0, gy + 90); gg.addColorStop(0, kind === 'school' ? '#2F6B2C' : '#18202E'); gg.addColorStop(1, '#0A0F18'); c.fillStyle = gg; c.fillRect(-1300, gy, 2600, 200);
      const win = (x, y, w, h, i) => { const fl = (Math.sin(lt * 1.6 + i * 1.7) + 1) / 2; c.fillStyle = fl > .08 ? '#FFE8A0' : '#C79B3B'; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, y, w, 5); };
      if (kind === 'school') { const bx = -380, bw = 760, by = gy - 340; c.fillStyle = '#B4432A'; c.fillRect(bx, by, bw, 340); const g = c.createLinearGradient(0, by, 0, by + 340); g.addColorStop(0, 'rgba(255,200,150,.18)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = g; c.fillRect(bx, by, bw, 340);
        c.beginPath(); c.moveTo(bx - 50, by + 6); c.lineTo(0, by - 130); c.lineTo(bx + bw + 50, by + 6); c.closePath(); c.fillStyle = '#6E241A'; c.fill();
        for (let r2 = 0; r2 < 2; r2++) for (let i = 0; i < 6; i++) win(bx + 50 + i * 118, by + 40 + r2 * 150, 70, 90, i + r2 * 6); R(c, -50, gy - 130, 100, 130, 4, '#4A190F'); L(c, 330, gy, 330, gy - 520, '#CFCFCF', 6); c.fillStyle = '#2FA05A'; c.fillRect(332, gy - 520, 90 + 10 * Math.sin(lt * 3), 56); }
      else if (kind === 'bank') { const bx = -400, bw = 800, by = gy - 120; c.fillStyle = '#E4DAC4'; c.fillRect(bx, by - 220, bw, 220); c.beginPath(); c.moveTo(bx - 40, by - 220); c.lineTo(0, by - 360); c.lineTo(bx + bw + 40, by - 220); c.closePath(); c.fillStyle = '#F3EBD8'; c.fill(); c.fillStyle = '#CFC4AA'; c.fillRect(bx - 40, by - 224, bw + 80, 18);
        for (let i = 0; i < 7; i++) { const cx = bx + 45 + i * 118; c.fillStyle = '#F6EFDF'; c.fillRect(cx, by - 200, 46, 200); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(cx + 34, by - 200, 12, 200); }
        for (let s = 0; s < 4; s++) { c.fillStyle = s % 2 ? '#D2C7AE' : '#E9E0CB'; c.fillRect(bx - 30 - s * 12, by + s * 30, bw + 60 + s * 24, 30); } R(c, -48, by - 120, 96, 120, 6, '#3A2E22'); }
      else if (kind === 'factory') { const bx = -420, bw = 840, by = gy - 240; c.fillStyle = '#4A5260'; c.fillRect(bx, by, bw, 240); for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(bx + i * 210, by); c.lineTo(bx + i * 210, by - 90); c.lineTo(bx + i * 210 + 210, by); c.closePath(); c.fillStyle = '#5B6574'; c.fill(); } for (let i = 0; i < 8; i++) win(bx + 40 + i * 100, by + 70, 60, 70, i);
        c.fillStyle = '#39414D'; c.fillRect(bx + 600, by - 260, 70, 260); for (let i = 0; i < 6; i++) { const p = ((lt * .5 + i / 6) % 1); c.globalAlpha = (1 - p) * .35; O(c, bx + 635 + Math.sin(p * 6 + i) * 22, by - 270 - p * 220, 30 + p * 50, '#C9D1DC'); } c.globalAlpha = 1; }
      else { [[-290, 430, 150], [-120, 560, 170], [70, 650, 190], [270, 500, 150]].forEach(([bx, bh, bw2], n) => { const g = c.createLinearGradient(bx, gy - bh, bx + bw2, gy); g.addColorStop(0, '#2A3F66'); g.addColorStop(1, '#16243F'); c.fillStyle = g; c.fillRect(bx, gy - bh, bw2, bh); c.fillStyle = 'rgba(160,200,255,.18)'; c.fillRect(bx, gy - bh, 18, bh);
          for (let a = 0; a < Math.floor(bw2 / 34); a++) for (let b = 0; b < Math.floor(bh / 44); b++) { const hv = hash(n + ':' + a + ':' + b) % 100; if (hv < 62) { c.fillStyle = hv < 12 ? '#FFE8A0' : hv < 40 ? '#8FC8FF' : '#2E4A78'; c.globalAlpha = .75; c.fillRect(bx + 14 + a * 34, gy - bh + 20 + b * 44, 22, 26); c.globalAlpha = 1; } } }); }
      const nm = tx[0]; if (nm) { const sy = kind === 'school' ? gy - 410 : kind === 'bank' ? gy - 410 : kind === 'factory' ? gy - 330 : gy - 700; const sw = Math.max(300, tw(c, nm, 60, 800) + 80); pop(c, 0, sy, bk(lt, .5, .5), () => { R(c, -sw / 2, sy - 48, sw, 96, 10, 'rgba(12,16,28,.94)', T.acc, 5); TXT(c, nm, 0, sy + 22, 60, '#FFFFFF', 800, 'center', null, sw - 40); }); } });
    if (tx[2]) chip(c, tx[2], 0, 405, 44, bk(lt, 1, .4), T);
  });

  /* line chart that draws itself: up (green) or down (red) */
  reg('chart_line', 'night', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, tr = String(tx[1] || 'up'), crash = /crash|ধস/i.test(tr), down = crash || /down|পতন|নিচে|কমে/i.test(tr), spike = /spike|লাফ/i.test(tr);
    const x0 = -640, x1 = 640, y0 = -290, y1 = 250, N = 48, r = rng(o.seed), pts = [];
    for (let i = 0; i < N; i++) { const q = i / (N - 1); let v = down ? 1 - q * .85 : spike ? (q < .6 ? .12 + q * .1 : .2 + (q - .6) * 2.2) : q * .88 + .06; if (crash) v = q < .55 ? .12 + q * 1.4 : .9 - (q - .55) * 1.9; v += (r() - .5) * .06 * (spike ? .4 : 1); pts.push([x0 + q * (x1 - x0), y1 - C.cl(v, .03, .97) * (y1 - y0)]); }
    c.save(); c.strokeStyle = 'rgba(150,185,255,.14)'; c.lineWidth = 2; for (let i = 0; i <= 5; i++) { const y = y0 + i * (y1 - y0) / 5; L(c, x0, y, x1, y, 'rgba(150,185,255,.12)', 2); } L(c, x0, y0, x0, y1, 'rgba(200,220,255,.5)', 4); L(c, x0, y1, x1, y1, 'rgba(200,220,255,.5)', 4); c.restore();
    const p = eo(lt / 2), col = down ? T.bad : T.ok, n = Math.max(2, Math.floor(p * (N - 1)) + 1);
    c.save(); c.beginPath(); c.moveTo(pts[0][0], y1); for (let i = 0; i < n; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineTo(pts[n - 1][0], y1); c.closePath(); const ag = c.createLinearGradient(0, y0, 0, y1); ag.addColorStop(0, col + '55'); ag.addColorStop(1, col + '00'); c.fillStyle = ag; c.fill(); c.restore();
    c.save(); c.beginPath(); for (let i = 0; i < n; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]); c.strokeStyle = col; c.lineWidth = 9; c.lineJoin = 'round'; c.lineCap = 'round'; c.shadowColor = col; c.shadowBlur = 28; c.stroke(); c.restore();
    const e = pts[n - 1]; O(c, e[0], e[1], 15 + 5 * Math.sin(lt * 6), '#FFFFFF'); c.globalAlpha = .35 * (1 - (lt * 1.2 % 1)); O(c, e[0], e[1], 20 + (lt * 1.2 % 1) * 60, null, col, 4); c.globalAlpha = 1;
    if (tx[0]) chip(c, tx[0], C.cl(e[0] - 40, -420, 420), e[1] - (down ? -80 : 80), 50, bk(lt, 1.6, .45), T, { line: col });
    if (tx[2]) TXT(c, tx[2], 0, 340, 44, T.dim, 700, 'center', null, 1300);
  });

  /* bars that grow ("label=value" pairs); a multiplier badge if given */
  reg('chart_bars', 'money', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt; const items = [], extra = []; tx.forEach(s => { const m = String(s).split('='); if (m.length > 1) { if (/^(x|গুণ|badge)$/i.test(m[0].trim())) extra.push(m.slice(1).join('=')); else items.push({ l: m[0].trim(), v: m.slice(1).join('=').trim() }); } });
    if (!items.length) { items.push({ l: tx[0] || 'আগে', v: tx[2] || '' }, { l: tx[1] || 'পরে', v: tx[3] || '' }); }
    const vals = items.map(i => { let n = num(i.v), u2 = /বিলিয়ন|billion/i.test(i.v) ? 1e9 : /মিলিয়ন|million/i.test(i.v) ? 1e6 : /কোটি/.test(i.v) ? 1e7 : /লাখ|লক্ষ/.test(i.v) ? 1e5 : /হাজার/.test(i.v) ? 1e3 : 1; return isNaN(n) ? NaN : n * u2; });
    const mx = Math.max(...vals.filter(v => !isNaN(v)), 1), n = items.length, bw = Math.min(230, 1100 / n - 50), gap = bw + 60, x0 = -(n - 1) * gap / 2, by = 270, maxH = 520;
    L(c, -760, by, 760, by, 'rgba(200,220,255,.5)', 4);
    items.forEach((it, i) => { const raw = isNaN(vals[i]) ? (i + 1) / n : vals[i] / mx, hh = Math.max(14, maxH * (isNaN(vals[i]) ? raw : Math.max(.025, raw))), k = eo((lt - .25 - i * .55) / .9), h = hh * k, x = x0 + i * gap - bw / 2, hot = i === n - 1;
      const g = c.createLinearGradient(0, by - h, 0, by); g.addColorStop(0, hot ? T.ok : '#3FBF7A'); g.addColorStop(1, hot ? '#128A4F' : '#1A6B46'); c.save(); c.shadowColor = hot ? T.ok : 'transparent'; c.shadowBlur = hot ? 30 : 0; R(c, x, by - h, bw, h, [12, 12, 0, 0], g); c.restore();
      TXT(c, it.l, x + bw / 2, by + 64, 48, T.ink, 800, 'center', 'TFDisp', bw + 40); if (it.v && k > .6) chip(c, it.v, x + bw / 2, by - h - 46, 42, bk(lt, .45 + i * .55 + .5, .4), T); });
    if (extra[0]) { const k = bk(lt, .5 + n * .55 + .2, .5); const bxp = x0 + (n - 1) * gap + bw / 2 + 190; pop(c, bxp, -180, k, () => { c.save(); c.translate(bxp, -180); c.rotate(-.1); R(c, -150, -62, 300, 124, 62, T.acc); TXT(c, extra[0], 0, 22, 62, '#1A1200', 800, 'center', 'TFDisp', 260); c.restore(); }); }
  });

  /* a big number counting up */
  reg('counter', 'night', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt; const label = tx[0] || ''; const raw = tx[2] !== undefined && tx[2] !== '' ? tx[2] : (tx[1] || ''); const from = tx[2] !== undefined && tx[2] !== '' ? (num(tx[1]) || 0) : 0, toRaw = num(raw), to = isNaN(toRaw) ? 0 : toRaw;
    const dec = /\./.test(toEn(raw)) ? 1 : 0; let suf = tx[4] || (tx[2] === undefined ? String(raw).replace(/[০-৯\d.,\s]+/, '').trim() : ''), pre = tx[3] || ''; if (!pre) { const pm = String(raw).match(/^[^০-৯\d]+/); if (pm && /[৳$]/.test(pm[0])) { pre = pm[0].trim(); } }
    const v = from + (to - from) * eo(lt / 1.7), s = dec ? toBn(v.toFixed(1)) : grp(v), full = (pre ? pre + ' ' : '') + s;
    c.save(); for (let i = 0; i < 3; i++) { c.globalAlpha = .22 - i * .05; c.strokeStyle = T.glow; c.lineWidth = 6; c.beginPath(); c.arc(0, -10, 330 + i * 60, lt * (.4 + i * .15) + i, lt * (.4 + i * .15) + i + 1.6 + i * .4); c.stroke(); } c.restore();
    if (label) pop(c, 0, -250, bk(lt, .05, .4), () => TXT(c, label, 0, -250, 62, T.dim, 800, 'center', null, 1300));
    const k = bk(lt, .1, .5); c.save(); c.translate(0, 40); c.scale(k, k); let sz = 300; while (tw(c, full, sz, 800, 'TFDisp') > 1300 && sz > 100) sz -= 12; glowText(c, full, 0, 0, sz, T.ink, T.acc + 'bb', 800, 'TFDisp'); c.restore();
    if (suf) pop(c, 0, 190, bk(lt, 1.2, .4), () => TXT(c, suf, 0, 190, 72, T.acc, 800, 'center', null, 1300));
    R(c, -300 * eo((lt - .3) / .6), 270, 600 * eo((lt - .3) / .6), 8, 4, T.acc);
  });

  /* a letter / report: lines are written, a stamp lands, a pen signs */
  reg('doc', 'ember', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, title = tx[0] || 'নথি', W = 560, H = 700, x = -W / 2, y = -H / 2 - 10, k = bk(lt, .02, .55);
    pop(c, 0, 0, k, () => { c.save(); c.rotate(-.03); c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; c.shadowOffsetY = 20; R(c, x, y, W, H, 12, '#F6F1E4'); c.restore();
      const gl = c.createLinearGradient(x, y, x + W, y + H); gl.addColorStop(0, 'rgba(255,255,255,.5)'); gl.addColorStop(1, 'rgba(120,90,40,.12)'); c.fillStyle = gl; c.fillRect(x, y, W, H);
      TXT(c, title, 0, y + 100, 66, '#2B2118', 800, 'center', 'TFSerif', W - 80); L(c, x + 60, y + 134, x + W - 60, y + 134, 'rgba(60,40,20,.35)', 3);
      for (let i = 0; i < 9; i++) { const lw = (W - 120) * (i === 8 ? .55 : .86 + ((i * 37) % 10) / 100), p = eo((lt - .35 - i * .12) / .5); L(c, x + 60, y + 190 + i * 46, x + 60 + lw * p, y + 190 + i * 46, 'rgba(60,45,30,.55)', 6); }
      const sp = eo((lt - 1.5) / 1.1), sx0 = x + 90, sy0 = y + 640; c.beginPath(); for (let i = 0; i <= 40 * sp; i++) { const q = i / 40, px = sx0 + q * 230, py = sy0 + Math.sin(q * 18) * 16 * (1 - q * .3) - q * 8; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.strokeStyle = '#1B2A8A'; c.lineWidth = 5; c.lineCap = 'round'; c.stroke();
      if (sp > 0 && sp < 1) { const q = sp, px = sx0 + q * 230, py = sy0 + Math.sin(q * 18) * 16 * (1 - q * .3) - q * 8; c.save(); c.translate(px, py); c.rotate(-.7); R(c, 0, -9, 190, 18, 9, '#171717'); O(c, 188, 0, 46, '#C98B5C'); c.restore(); }
      if (tx[1]) { const sk = bk(lt, 1.0, .35); if (sk > 0) { c.save(); c.translate(x + W - 150, y + 330); c.rotate(-.22); c.scale(sk, sk); const sw = Math.max(210, tw(c, tx[1], 50, 800) + 50); R(c, -sw / 2, -44, sw, 88, 8, null, '#D2342A', 7); TXT(c, tx[1], 0, 17, 50, '#D2342A', 800, 'center', null, sw - 30); c.restore(); } }
      c.restore(); });
  });

  /* an email / message window with text being typed and a send button */
  reg('email', 'steel', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, W = 1180, H = 600, x = -W / 2, y = -H / 2 - 10, k = bk(lt, .02, .55), to = tx[0] || 'সবাইকে', body = tx[1] || tx[0] || '';
    pop(c, 0, 0, k, () => { c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; c.shadowOffsetY = 20; R(c, x, y, W, H, 22, '#F4F6FA'); c.restore(); c.save(); c.beginPath(); c.roundRect(x, y, W, 78, [22, 22, 0, 0]); c.clip(); c.fillStyle = '#E3E8F1'; c.fillRect(x, y, W, 78); c.restore();
      ['#FF5F57', '#FEBC2E', '#28C840'].forEach((cc, i) => O(c, x + 44 + i * 34, y + 39, 11, cc)); TXT(c, 'প্রাপক: ' + to, x + 200, y + 52, 38, '#2A3140', 800, 'left', null, W - 260);
      const full = body, shown = Math.floor(C.cl((lt - .5) / Math.max(.8, Math.min(2.6, full.length * .045))) * full.length), lines = []; { let cur = ''; full.slice(0, shown).split(/(\s+)/).forEach(w => { if (tw(c, cur + w, 56, 700) > W - 150 && cur) { lines.push(cur); cur = w.trim(); } else cur += w; }); lines.push(cur); }
      lines.slice(0, 5).forEach((l, i) => TXT(c, l, x + 70, y + 190 + i * 84, 56, '#1B2232', 700, 'left')); if (shown < full.length && Math.floor(o.t * 2.5) % 2) { const li = Math.min(4, lines.length - 1); R(c, x + 74 + tw(c, lines[li] || '', 56, 700), y + 150 + li * 84, 5, 62, 2, '#1B2232'); }
      const sk = bk(lt, 2.0, .4), pulse = 1 + .05 * Math.sin(lt * 6); pop(c, x + W - 190, y + H - 80, sk, () => { c.save(); c.translate(x + W - 190, y + H - 80); c.scale(pulse, pulse); R(c, -110, -42, 220, 84, 14, '#2F6BFF'); TXT(c, 'পাঠান', 0, 18, 48, '#FFFFFF', 800, 'center'); c.restore(); }); });
  });

  /* stacks of cash that rise, coins that drop, a label with the amount */
  reg('money', 'money', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, r = rng(o.seed);
    const bill = (x, y, w, h, rot, tone) => { c.save(); c.translate(x, y); c.rotate(rot); R(c, -w / 2, -h / 2, w, h, 8, tone || '#3FAE6A'); R(c, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 5, null, 'rgba(255,255,255,.45)', 3); O(c, 0, 0, h * .26, 'rgba(255,255,255,.28)'); TXT(c, '৳', 0, h * .17, h * .34, 'rgba(10,50,25,.75)', 800, 'center', 'TFDisp'); c.restore(); };
    [[-420, 5], [-140, 7], [150, 9], [430, 6]].forEach(([x, n], si) => { const k = eo((lt - .1 - si * .25) / .9); for (let i = 0; i < n; i++) { const kk = C.cl(k * n - i, 0, 1); if (kk <= 0) continue; bill(x + Math.sin(i * 7 + si) * 8, 250 - i * 44 - (1 - kk) * 120, 250, 118, Math.sin(i * 3 + si) * .05, i % 2 ? '#37A261' : '#4DBA7A'); } });
    for (let i = 0; i < 16; i++) { const t0 = i * .18, p = C.cl((lt - t0 - .4) / 1.1); if (p <= 0 || p >= 1) continue; const x = -520 + r() * 1040, y = -420 + p * 640; c.save(); c.translate(x, y); c.rotate(p * 7); O(c, 0, 0, 30, '#FFC93C'); O(c, 0, 0, 22, null, '#D79A12', 4); TXT(c, '৳', 0, 10, 28, '#9A6A08', 800, 'center'); c.restore(); }
    const lab = tx[0] || tx[1]; if (lab) { const k = bk(lt, .9, .5); pop(c, 0, -300, k, () => { c.save(); c.translate(0, -300); glowText(c, lab, 0, 0, 120, T.ink, T.acc + 'aa', 800, 'TFDisp', 1300); c.restore(); }); }
    if (tx[1] && tx[0]) chip(c, tx[1], 0, 405, 44, bk(lt, 1.3, .4), T);
  });

  /* a grid of little people that pop in row by row (the crowd / customers / workers) */
  reg('people', 'night', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, cols = 11, rows = 5, gx = 118, gy = 118, x0 = -(cols - 1) * gx / 2, y0 = -190, chef = /chef|বাবুর্চি|রাঁধুনি/i.test(tx.join(' ')), r = rng(o.seed);
    for (let rr2 = 0; rr2 < rows; rr2++) for (let cc = 0; cc < cols; cc++) { const i = rr2 * cols + cc, k = bk(lt, .12 + rr2 * .22 + cc * .03, .4), hot = rr2 === 2 && cc === 5; if (k <= 0) continue; const s = (.82 + rr2 * .06) * (hot ? 1.25 : 1); pop(c, x0 + cc * gx, y0 + rr2 * gy, k, () => { if (hot) { c.save(); c.shadowColor = T.acc; c.shadowBlur = 40; } person(c, x0 + cc * gx, y0 + rr2 * gy, s, SKIN[i % 5], hot ? T.acc : SHIRT[(i * 7) % 6], chef); if (hot) c.restore(); }); }
    const lab = tx[0]; if (lab) chip(c, lab, 0, 380, 62, bk(lt, 1.2, .45), T);
  });

  /* two places joined by a route; a parcel travels along the arc */
  reg('route', 'steel', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, A = [-520, 70], B = [520, 70], a = tx[0] || 'এখান', b = tx[1] || 'ওখান', via = tx[2];
    c.save(); c.globalAlpha = .22; const r = rng(o.seed); for (let i = 0; i < 160; i++) { const x = -760 + r() * 1520, y = -330 + r() * 640; O(c, x, y, 3, '#9CC4FF'); } c.restore();
    const node = (p, lab, k, col) => pop(c, p[0], p[1], k, () => { O(c, p[0], p[1], 78, col + '33'); O(c, p[0], p[1], 52, col); O(c, p[0], p[1], 20, '#FFFFFF'); c.globalAlpha *= .5; O(c, p[0], p[1], 78 + 30 * ((lt * .8) % 1), null, col, 4); c.globalAlpha = 1; chip(c, lab, p[0], p[1] + 150, 52, 1, T, { line: col }); });
    node(A, a, bk(lt, .05, .45), T.acc); node(B, b, bk(lt, .5, .45), T.ok);
    const ctrl = [0, -330], pt = q => { const u2 = 1 - q; return [u2 * u2 * A[0] + 2 * u2 * q * ctrl[0] + q * q * B[0], u2 * u2 * A[1] + 2 * u2 * q * ctrl[1] + q * q * B[1]]; };
    const p = eio((lt - .6) / 1.3); c.save(); c.setLineDash([22, 18]); c.lineDashOffset = -lt * 40; c.strokeStyle = T.acc; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i <= 60 * p; i++) { const q = pt(i / 60); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.shadowColor = T.acc; c.shadowBlur = 16; c.stroke(); c.restore();
    if (p > 0 && p < 1.001) { const q = pt(Math.min(1, p)); c.save(); c.translate(q[0], q[1] - 10); c.rotate(Math.sin(lt * 8) * .1); R(c, -36, -30, 72, 60, 10, '#C98B5C'); R(c, -36, -8, 72, 12, 0, '#E8B889'); c.restore(); }
    if (via) chip(c, via, 0, -170, 46, bk(lt, 1.2, .45), T);
  });

  /* a magnifier sweeping over a report; one line gets highlighted */
  reg('magnifier', 'ember', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, W = 760, H = 600, x = -W / 2, y = -H / 2;
    R(c, x, y, W, H, 16, '#F2ECDD'); for (let i = 0; i < 9; i++) { const hi = i === 4, p = eo((lt - .2 - i * .08) / .4); if (hi) { c.fillStyle = 'rgba(255,214,64,' + (.85 * C.cl((lt - 1.3) / .5)) + ')'; c.fillRect(x + 40, y + 62 + i * 58 - 24, (W - 80) * .86, 40); } L(c, x + 60, y + 62 + i * 58, x + 60 + (W - 120) * (i % 3 === 2 ? .6 : .92) * p, y + 62 + i * 58, hi && lt > 1.5 ? '#B3261E' : 'rgba(60,45,30,.5)', 8); }
    const q = eio(lt / 1.6), mx = x + 120 + q * 360 + Math.sin(lt * 2) * 10, my = y + 120 + q * 220 + Math.cos(lt * 2.3) * 8; c.save(); c.translate(mx, my); c.rotate(-.8); R(c, 120, -14, 240, 28, 14, '#4A3A2C'); c.restore();
    c.save(); c.beginPath(); c.arc(mx, my, 118, 0, 7); c.clip(); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(mx - 120, my - 120, 240, 240); c.restore(); O(c, mx, my, 118, null, '#E9C46A', 18); O(c, mx, my, 118, null, 'rgba(255,255,255,.25)', 4);
    if (tx[0]) chip(c, tx[0], 0, 380, 56, bk(lt, 1.5, .45), T);
  });

  /* padlock: shakes, then locks (✓) or breaks open (✗) */
  reg('lock', 'alert', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, open = /open|break|খুল|ভাঙ|হ্যাক|চুরি/i.test(String(tx[1] || tx[0] || '')), k = bk(lt, .03, .5);
    pop(c, 0, 0, k, () => { const sh = open && lt > .9 && lt < 1.5 ? Math.sin(lt * 70) * 8 : 0, lift = open ? eio((lt - 1.1) / .5) * 70 : 0; c.save(); c.translate(sh, 0);
      c.save(); c.shadowColor = open ? T.bad : T.ok; c.shadowBlur = 50; c.lineWidth = 34; c.strokeStyle = '#C5CAD6'; c.lineCap = 'round'; c.beginPath(); c.moveTo(-100, -40 - lift * .2); c.lineTo(-100, -150 - lift); c.arc(0, -150 - lift, 100, Math.PI, 0); c.lineTo(100, open ? -150 - lift * .1 + 36 : -40); c.stroke(); c.restore();
      const g = c.createLinearGradient(0, -40, 0, 190); g.addColorStop(0, '#F0B83A'); g.addColorStop(1, '#C48715'); R(c, -170, -40, 340, 240, 30, g); R(c, -170, -40, 340, 18, 14, 'rgba(255,255,255,.3)'); O(c, 0, 60, 32, '#3A2A0A'); R(c, -9, 60, 18, 72, 6, '#3A2A0A'); c.restore(); });
    const ok = bk(lt, 1.7, .45); if (ok > 0) pop(c, 230, -170, ok, () => { O(c, 230, -170, 66, open ? T.bad : T.ok); c.strokeStyle = '#fff'; c.lineWidth = 15; c.lineCap = 'round'; c.beginPath(); if (open) { c.moveTo(205, -195); c.lineTo(255, -145); c.moveTo(255, -195); c.lineTo(205, -145); } else { c.moveTo(200, -168); c.lineTo(224, -142); c.lineTo(262, -196); } c.stroke(); });
    if (tx[0]) chip(c, tx[0], 0, 292, 52, bk(lt, 1.2, .45), T);
  });

  /* a phone with chat bubbles that appear one by one */
  reg('phone', 'steel', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, W = 420, H = 760, x = -W / 2, y = -H / 2 - 10, k = bk(lt, .03, .55), msgs = tx.length ? tx : ['…'];
    pop(c, 0, 0, k, () => { c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; c.shadowOffsetY = 20; R(c, x, y, W, H, 54, '#10151D', '#3B4656', 6); c.restore(); R(c, x + 22, y + 22, W - 44, H - 44, 36, '#EAF0F6'); R(c, -60, y + 36, 120, 20, 10, '#10151D'); R(c, x + 22, y + 22, W - 44, 96, [36, 36, 0, 0], '#2F6BFF'); TXT(c, 'মেসেজ', 0, y + 88, 38, '#FFFFFF', 800, 'center');
      let yy = y + 160; msgs.slice(0, 4).forEach((m, i) => { const bk2 = bk(lt, .5 + i * .8, .4); if (bk2 <= 0) return; const mine = i % 2 === 1, lines = (() => { const out = []; let cur = ''; String(m).split(/\s+/).forEach(w => { if (tw(c, cur + ' ' + w, 34, 700) > W - 150 && cur) { out.push(cur); cur = w; } else cur = (cur ? cur + ' ' : '') + w; }); out.push(cur); return out.slice(0, 3); })(), bh = lines.length * 46 + 28, bw = Math.min(W - 90, Math.max(...lines.map(l => tw(c, l, 34, 700))) + 44), bx = mine ? x + W - 40 - bw : x + 40;
        pop(c, bx + bw / 2, yy + bh / 2, bk2, () => { R(c, bx, yy, bw, bh, 26, mine ? '#2F6BFF' : '#FFFFFF'); lines.forEach((l, j) => TXT(c, l, bx + 22, yy + 46 + j * 46, 34, mine ? '#FFFFFF' : '#1A2233', 700, 'left')); }); yy += bh + 22; }); });
  });

  /* a balance that tips towards the heavier side */
  reg('balance', 'night', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, a = tx[0] || 'এক', b = tx[1] || 'আরেক', va = tx[2] || '', vb = tx[3] || '', na = num(va), nb = num(vb), heavy = isNaN(na) || isNaN(nb) ? 1 : (nb >= na ? 1 : -1), ang = heavy * .22 * eo((lt - .4) / 1.2) * (1 + .08 * Math.sin(lt * 4) * (1 - C.cl((lt - 1.6) / 1)));
    R(c, -16, -230, 32, 470, 10, '#9AA7BD'); R(c, -150, 232, 300, 26, 12, '#6F7C93'); O(c, 0, -230, 28, '#E9C46A');
    c.save(); c.translate(0, -230); c.rotate(ang); R(c, -520, -12, 1040, 24, 12, '#C5CAD6');
    [[-520, a, va, '#4C7BD9'], [520, b, vb, '#E0883A']].forEach(([px, lab, val, col], i) => { c.save(); c.translate(px, 0); c.rotate(-ang); L(c, 0, 0, -110, 250, 'rgba(200,210,230,.7)', 4); L(c, 0, 0, 110, 250, 'rgba(200,210,230,.7)', 4); R(c, -140, 246, 280, 26, 13, '#9AA7BD'); R(c, -112, 130 + (i ? 0 : 20) * 0, 224, 116, 14, col); TXT(c, val || lab, 0, 206, val ? 60 : 44, '#fff', 800, 'center', 'TFDisp', 210); c.restore(); }); c.restore();
    chip(c, a, -520, 360, 46, bk(lt, .2, .4), T); chip(c, b, 520, 360, 46, bk(lt, .5, .4), T, { line: T.bad });
  });

  /* a horizontal timeline with labelled dots that light up in order */
  reg('timeline', 'plum', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, items = tx.length ? tx : ['১', '২', '৩', '৪'], n = Math.min(6, items.length), x0 = -620, x1 = 620, gap = n > 1 ? (x1 - x0) / (n - 1) : 0;
    L(c, x0, 0, x1, 0, 'rgba(255,255,255,.18)', 10); const pr = eio(lt / (.6 + n * .55)); L(c, x0, 0, x0 + (x1 - x0) * pr, 0, T.acc, 10);
    for (let i = 0; i < n; i++) { const x = x0 + i * gap, k = bk(lt, .3 + i * .55, .45); if (k <= 0) continue; const up = i % 2 === 0; pop(c, x, 0, k, () => { O(c, x, 0, 34, T.acc); O(c, x, 0, 16, '#1A1030'); L(c, x, up ? -34 : 34, x, up ? -110 : 110, T.acc, 5); const parts = String(items[i]).split('|'); chip(c, parts[0], x, up ? -170 : 170, 46, 1, T); }); }
  });

  /* the cliff-hanger question: a huge pulsing "?" */
  reg('question', 'plum', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, k = bk(lt, .05, .7);
    for (let i = 0; i < 4; i++) { const p = ((lt * .5 + i / 4) % 1); c.globalAlpha = (1 - p) * .4; O(c, 0, -20, 150 + p * 420, null, T.glow, 5); } c.globalAlpha = 1;
    pop(c, 0, 0, k, () => { c.save(); c.translate(0, 120 + Math.sin(lt * 2) * 8); c.scale(1 + .03 * Math.sin(lt * 4), 1 + .03 * Math.sin(lt * 4)); glowText(c, '?', 0, 0, 640, T.ink, T.glow + 'dd', 800, 'TFDisp'); c.restore(); });
    if (tx[0]) chip(c, tx[0], 0, 350, 58, bk(lt, .9, .45), T);
  });

  /* connected dots: one source, links that light up (relationships, surveillance, networks) */
  reg('network', 'steel', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, r = rng(o.seed), pts = [[0, 0]]; for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2 + r() * .4, d = 230 + r() * 200; pts.push([Math.cos(a) * d * 1.5, Math.sin(a) * d * .95]); }
    pts.forEach((p, i) => { if (!i) return; const k = eo((lt - .2 - i * .12) / .5); if (k <= 0) return; c.globalAlpha = .75; L(c, 0, 0, p[0] * k, p[1] * k, T.glow, 4); c.globalAlpha = 1; if (i % 3 === 0 && i < 10) { const q = pts[i + 1]; if (q) { c.globalAlpha = .35 * k; L(c, p[0], p[1], q[0], q[1], T.dim, 3); c.globalAlpha = 1; } } });
    pts.forEach((p, i) => { const k = i ? bk(lt, .3 + i * .12, .4) : bk(lt, .02, .5); pop(c, p[0], p[1], k, () => { if (!i) { c.save(); c.shadowColor = T.acc; c.shadowBlur = 40; O(c, 0, 0, 62, T.acc); c.restore(); O(c, 0, 0, 24, '#10151D'); c.globalAlpha = .5; O(c, 0, 0, 62 + 40 * ((lt * .9) % 1), null, T.acc, 5); c.globalAlpha = 1; } else { O(c, p[0], p[1], 22, T.glow); O(c, p[0], p[1], 9, '#fff'); } }); });
    if (tx[0]) chip(c, tx[0], 0, 130, 56, bk(lt, 1.0, .45), T);
    if (tx[1]) chip(c, tx[1], 0, 380, 44, bk(lt, 1.4, .45), T);
  });

  /* a pile of files / papers sliding in, the top one gets a red stamp */
  reg('files', 'ember', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, n = 7;
    for (let i = 0; i < n; i++) { const k = eo((lt - .1 - i * .13) / .5); if (k <= 0) continue; const rot = ((hash(o.seed + ':' + i) % 100) / 100 - .5) * .5, x = (hash(o.seed + 'x' + i) % 160) - 80, y = 80 - i * 14 + (1 - k) * -520; c.save(); c.translate(x, y); c.rotate(rot * k); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 24; c.shadowOffsetY = 10; R(c, -230, -300, 460, 600, 10, i === n - 1 ? '#F6F1E4' : '#E7DFCB'); c.restore(); c.save(); c.translate(x, y); c.rotate(rot * k); if (i === n - 1) { TXT(c, tx[0] || 'ফাইল', 0, -200, 56, '#2B2118', 800, 'center', 'TFSerif', 400); for (let j = 0; j < 6; j++) L(c, -170, -140 + j * 56, 170 - (j === 5 ? 120 : 0), -140 + j * 56, 'rgba(60,45,30,.45)', 7); } c.restore(); }
    const sk = bk(lt, 1.3, .35); if (sk > 0) { c.save(); c.translate(120, 40); c.rotate(-.25); c.scale(sk, sk); const t2 = tx[1] || 'গোপন', sw = Math.max(260, tw(c, t2, 68, 800) + 60); R(c, -sw / 2, -56, sw, 112, 10, null, '#D2342A', 9); TXT(c, t2, 0, 24, 68, '#D2342A', 800, 'center', null, sw - 30); c.restore(); }
  });

  /* a clock whose hand sweeps; a label for the time span */
  reg('clock', 'plum', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, k = bk(lt, .03, .5);
    pop(c, 0, -30, k, () => { O(c, 0, -30, 260, '#F6F1E4'); O(c, 0, -30, 260, null, T.acc, 16); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; L(c, Math.cos(a) * 214, -30 + Math.sin(a) * 214, Math.cos(a) * 236, -30 + Math.sin(a) * 236, '#2B2118', i % 3 ? 6 : 12); }
      const a = lt * 2.4 - Math.PI / 2, a2 = lt * .2 - Math.PI / 2; L(c, 0, -30, Math.cos(a2) * 120, -30 + Math.sin(a2) * 120, '#2B2118', 16); L(c, 0, -30, Math.cos(a) * 190, -30 + Math.sin(a) * 190, '#D2342A', 8); O(c, 0, -30, 16, '#D2342A'); });
    if (tx[0]) chip(c, tx[0], 0, 330, 66, bk(lt, .7, .45), T);
  });

  /* a siren: red pulsing light and rays, for danger / breaking news */
  reg('alert', 'alert', (c, o) => {
    const T = o.T, tx = o.tx, lt = o.lt, k = bk(lt, .03, .5), pl = .5 + .5 * Math.sin(lt * 8);
    c.save(); c.translate(0, -60); c.rotate(lt * 2.4); const rg = c.createLinearGradient(0, 0, 900, 0); rg.addColorStop(0, 'rgba(255,60,70,.55)'); rg.addColorStop(1, 'rgba(255,60,70,0)'); c.fillStyle = rg; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 900, -.28, .28); c.closePath(); c.fill(); c.rotate(Math.PI); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 900, -.28, .28); c.closePath(); c.fill(); c.restore();
    pop(c, 0, 40, k, () => { R(c, -170, 130, 340, 70, 14, '#3A3F4B'); const g = c.createLinearGradient(0, -120, 0, 140); g.addColorStop(0, '#FF6B6B'); g.addColorStop(1, '#C21F2F'); c.save(); c.shadowColor = '#FF3B4E'; c.shadowBlur = 40 + 50 * pl; c.beginPath(); c.moveTo(-130, 140); c.lineTo(-130, 0); c.arc(0, 0, 130, Math.PI, 0); c.lineTo(130, 140); c.closePath(); c.fillStyle = g; c.fill(); c.restore(); R(c, -70, -70, 36, 120, 18, 'rgba(255,255,255,.35)'); });
    if (tx[0]) { const kk = bk(lt, .5, .5); pop(c, 0, -300, kk, () => { c.save(); c.translate(0, -300); glowText(c, tx[0], 0, 0, 110, T.ink, '#FF3B4Eaa', 800, 'TFDisp', 1400); c.restore(); }); }
  });

  /* ================= choosing and drawing ================= */
  const ALIAS = { chart: 'chart_line', graph: 'chart_line', line: 'chart_line', up: 'chart_line', down: 'chart_line', bars: 'chart_bars', bar: 'chart_bars', map: 'route', path: 'route', crowd: 'people', people: 'people', letter: 'doc', paper: 'doc', report: 'doc', mail: 'email', city: 'skyline', night: 'skyline', siren: 'alert', danger: 'alert', cash: 'money', date: 'calendar', scale: 'balance', versus: 'balance', net: 'network', links: 'network', file: 'files', pile: 'files', time: 'clock', days: 'timeline', why: 'question', '?': 'question', search: 'magnifier', spy: 'magnifier', secure: 'lock', hack: 'lock', chat: 'phone', sms: 'phone', tower: 'building', bank: 'building', school: 'building', factory: 'building', count: 'counter', number: 'counter' };
  const normKind = k => { k = String(k || '').trim().toLowerCase().replace(/[\s-]+/g, '_'); return KINDS[k] ? k : (ALIAS[k] && KINDS[ALIAS[k]] ? ALIAS[k] : ''); };
  const clean = s => String(s || '').replace(/[।,.!?“”"'‘’:;()\[\]{}]/g, '').trim();
  const COUNTRIES = ['আমেরিকা', 'যুক্তরাষ্ট্র', 'চীন', 'সিঙ্গাপুর', 'মালয়েশিয়া', 'ইন্দোনেশিয়া', 'তাইওয়ান', 'ভারত', 'বাংলাদেশ', 'জাপান', 'রাশিয়া', 'ইংল্যান্ড', 'ফিলিপাইন', 'দুবাই', 'কানাডা', 'জার্মানি', 'ঢাকা', 'দিল্লি', 'নিউইয়র্ক', 'লন্ডন'];

  function fromCard(card) {
    const p = String((card && card.text) || '').split('/').map(s => s.trim()), kind = normKind(p[0]);
    if (kind) return { kind, tx: p.slice(1).filter((s, i, a) => s !== '' || i < a.length - 1) };
    return null;
  }
  function fromOldCard(card) {
    const ty = card.type, T = s => String(s == null ? '' : s);
    if (ty === 'date') return { kind: 'calendar', tx: [T(card.text)] };
    if (ty === 'calendar') return { kind: 'calendar', tx: [T(card.text)] };
    if (ty === 'doc') return { kind: 'doc', tx: [T(card.title) || 'গোপন নথি', 'গোপন', T(card.text)] };
    if (ty === 'counter') return { kind: 'counter', tx: [T(card.label), T(card.from), T(card.to), T(card.prefix), T(card.suffix)] };
    if (ty === 'compare') return { kind: 'balance', tx: [T(card.left), T(card.right), T(card.lv), T(card.rv)] };
    if (ty === 'alert') return { kind: 'alert', tx: [T(card.text)] };
    if (ty === 'sms') return { kind: 'phone', tx: [T(card.title), T(card.text)] };
    if (ty === 'chat') return { kind: 'phone', tx: [T(card.text)] };
    return null;
  }
  /* keyword director: reads the line and picks a picture that explains it (null = keep the characters on screen) */
  function auto(ln, ctx) {
    const text = String(ln.cap || ln.say || '').trim(); if (!text) return null; const en = toEn(text);
    const hl = String(ln.hl || '').split('|').map(clean).filter(Boolean), h0 = hl[0] || '';
    const has = re => re.test(text);
    // date
    { const mre = new RegExp('(?:^|[\\s,।(])((?:[০-৯\\d]{1,2}\\s*)?(?:' + MONTHS.join('|') + ')(?:\\s*,?\\s*[০-৯\\d]{4})?)(?=$|[\\s,।)])'), m = text.match(mre); if (m && /[০-৯\d]/.test(m[1])) return { kind: 'calendar', tx: [m[1].trim()] }; }
    if (ctx.last && /[?？]/.test(text)) return { kind: 'question', tx: [h0] };
    // money / numbers with units
    const nm = text.match(/([০-৯\d][০-৯\d,\.]*)\s*(কোটি|লাখ|লক্ষ|হাজার|মিলিয়ন|বিলিয়ন|ট্রিলিয়ন)?\s*(টাকা|ডলার|৳|\$|রুপি|পাউন্ড)?/g) || [], withUnit = nm.filter(x => /(কোটি|লাখ|লক্ষ|হাজার|মিলিয়ন|বিলিয়ন|ট্রিলিয়ন|টাকা|ডলার|৳|\$|রুপি)/.test(x));
    if (withUnit.length >= 2 && has(/গুণ|বেড়ে|বাড়|থেকে|হয়ে|পর|ছিল/)) return { kind: 'chart_bars', tx: [(ctx.yr1 || 'আগে') + '=' + withUnit[0].trim(), (ctx.yr2 || 'পরে') + '=' + withUnit[1].trim()] };
    if (withUnit.length >= 1 && !has(/জন|বছর বয়স|বয়স/)) { const w = withUnit[0].trim(); if (has(/টাকা|৳|ডলার|রুপি/)) { return has(/হারাল|গেল|ক্ষতি|লস|চুরি|পতন/) ? { kind: 'chart_line', tx: [w, 'down', h0] } : { kind: 'money', tx: [w, h0] }; } return { kind: 'counter', tx: [h0 && h0 !== w ? h0 : 'মোট', w] }; }
    // growth / fall
    if (has(/ধস|পতন|দরপতন|পড়ে গেল|নিচে নেমে|কমে|হারাল|লস|ক্ষতি|বন্ধ হয়ে/)) return { kind: 'chart_line', tx: [h0, /ধস|পতন/.test(text) ? 'crash' : 'down'] };
    if (has(/বেড়ে|বাড়ল|বাড়তে|উঠে|লাফ|সাফল্য|বিক্রি বাড়/)) return { kind: 'chart_line', tx: [h0, 'up'] };
    // documents
    if (has(/ই-?মেইল|ইমেইল|মেইল/)) return { kind: 'email', tx: ['সবাইকে', h0 || text] };
    if (has(/পদত্যাগ|সই|চুক্তি|চিঠি|দলিল/)) return { kind: 'doc', tx: [has(/পদত্যাগ/) ? 'পদত্যাগপত্র' : has(/চুক্তি/) ? 'চুক্তিপত্র' : has(/দলিল/) ? 'দলিল' : 'চিঠি', has(/গোপন/) ? 'গোপন' : ''] };
    if (has(/রিপোর্ট|নথি|কাগজ|ফাইল|ফাইলের|মামলা|নোটিশ/)) return { kind: has(/ফাইল|স্তূপ|মামলা/) ? 'files' : 'doc', tx: [has(/মামলা/) ? 'মামলার ফাইল' : h0 || 'রিপোর্ট', has(/গোপন/) ? 'গোপন' : ''] };
    // places
    if (has(/স্কুল|বিদ্যালয়/)) return { kind: 'building', tx: [h0 || 'স্কুল', 'school'] };
    if (has(/ব্যাংক|আদালত|সরকারি অফিস|দফতর/)) return { kind: 'building', tx: [h0 || (has(/আদালত/) ? 'আদালত' : 'ব্যাংক'), 'bank'] };
    if (has(/কারখানা|ফ্যাক্টরি/)) return { kind: 'building', tx: [h0 || 'কারখানা', 'factory'] };
    if (has(/কোম্পানি|অফিস|প্রতিষ্ঠান|বিল্ডিং|ভবন/)) return { kind: has(/শহর|রাত|টাওয়ার/) ? 'skyline' : 'building', tx: [h0 || 'কোম্পানি', 'office'] };
    if (has(/শহর|আকাশছোঁয়া|টাওয়ার|ঢাকা শহর/)) return { kind: 'skyline', tx: [h0] };
    // people / phone / lock / route / spy / network / time / danger
    if (has(/কর্মী|ক্রেতা|গ্রাহক|বাবুর্চি|হাজার হাজার|লাখ লাখ|সবাই|সবার/)) return { kind: 'people', tx: [h0] };
    if (has(/ফোন|মেসেজ|এসএমএস|কল করল|চ্যাট/)) return { kind: 'phone', tx: [h0 || text] };
    if (has(/তালা|হ্যাক|পাসওয়ার্ড|ফাঁস|নিরাপত্তা|চুরি/)) return { kind: 'lock', tx: [h0, has(/ফাঁস|হ্যাক|চুরি/) ? 'open' : 'lock'] };
    const cs = COUNTRIES.filter(x => text.indexOf(x) >= 0); if (cs.length >= 2 || (cs.length === 1 && has(/পাঠ|চালান|পাচার|পৌঁছ/))) return { kind: 'route', tx: [cs[0], cs[1] || 'অন্য দেশ', h0] };
    if (has(/গোয়েন্দা|তদন্ত|খুঁজে|সন্দেহ|নজর|যাচাই|পরীক্ষা|ধরা পড়ল/)) return { kind: 'magnifier', tx: [h0] };
    if (has(/সম্পর্ক|যোগাযোগ|সংযোগ|জাল|চক্র|দল/)) return { kind: 'network', tx: [h0] };
    const tm = text.match(/([০-৯\d]+)\s*(ঘণ্টা|মিনিট|দিন|মাস|সপ্তাহ|বছর)/); if (tm && has(/মাত্র|লাগল|লাগলো|পর|ভেতর|মধ্যে/)) return { kind: 'clock', tx: [tm[0]] };
    if (has(/বিপদ|সতর্ক|ঝুঁকি|ধ্বংস|বিস্ফোরণ|জরুরি/)) return { kind: 'alert', tx: [h0] };
    if (has(/বনাম|তুলনা|একদিকে|অন্যদিকে/)) return { kind: 'balance', tx: ['এক পাশ', 'আরেক পাশ'] };
    return null;
  }
  /* plan every shot: explicit [scene: …] cards always win; old cards (date, doc, counter …) become full-screen pictures;
     narration lines get an automatic picture when a keyword matches; dialogue stays with the characters */
  function plan(story, shots, opt) {
    opt = opt || {}; const kt = !!opt.kt, out = [], maxRun = kt ? 4 : 3, density = kt ? .7 : .45, seed0 = hash(story.title || ''); let run = 0, recent = [], vcount = 0, total = 0;
    const lastStory = (() => { let li = -1; shots.forEach((sh, k) => { const sc = story.scenes[sh.si]; if (sc && sc.type === 'story') li = k; }); return li; })();
    shots.forEach((sh, k) => {
      const sc = story.scenes[sh.si], ln = sc && sc.lines[sh.li]; if (!sc || sc.type !== 'story' || !ln) { out[k] = null; run = 0; return; } total++;
      let v = null; const card = ln.card, explicit = card && card.type === 'scene';
      if (explicit) v = fromCard(card);
      else if (opt.visuals !== false) { if (card) v = fromOldCard(card); else if (!ln.speak && run < maxRun && vcount < density * total + 2) { v = auto(ln, { last: k >= lastStory - 1, kt }); if (v && recent.slice(-2).includes(v.kind)) v = null; } }
      if (v && !KINDS[v.kind]) v = null;
      if (v) { let th = THEME_OF[v.kind]; if (!kt && (th === 'night' || th === 'steel' || th === 'plum')) th = 'ember'; v = { kind: v.kind, tx: (v.tx || []).map(s => String(s == null ? '' : s)), th, seed: (seed0 + k * 7919) >>> 0 }; run++; vcount++; recent.push(v.kind); } else run = 0;
      out[k] = v; sh.vis = v ? v.kind : '';
    });
    return out;
  }
  /* draw one visual shot full-frame: o = { FW, FH, u, t, lt, dur, land } */
  function draw(c, v, o) {
    const FW = o.FW, FH = o.FH, T = TH[v.th] || TH.night, fn = KINDS[v.kind]; if (!fn) return;
    const base = { FW, FH, u: o.u, t: o.t, seed: v.seed };
    c.save(); bg(c, base, v.th);
    const ZM = { calendar: 1.08, doc: 1.1, files: 1.08, clock: 1.08, lock: 1.0, phone: 1.06, magnifier: 1.12, building: 1.2, network: 1.08, money: 1.0, route: 1.06 }[v.kind] || 1, sc = ZM * Math.min(FW * .94 / 1600, FH * (o.land ? .74 : .5) / 800), cy = FH * (o.land ? .44 : .4), push = 1 + .035 * C.cl(o.lt / Math.max(1, o.dur));
    c.save(); c.translate(FW / 2, cy); c.scale(sc * push, sc * push);
    try { fn(c, { lt: o.lt, dur: o.dur, t: o.t, tx: v.tx, T, seed: v.seed, FW, FH, u: o.u }); } catch (e) { /* a broken picture must never stop the export */ }
    c.restore(); grain(c, base);
    if (o.lt < .14) { c.globalAlpha = (1 - o.lt / .14) * .35; c.fillStyle = '#fff'; c.fillRect(0, 0, FW, FH); c.globalAlpha = 1; }
    c.restore();
  }
  return { plan, draw, auto, fromCard, normKind, kinds: Object.keys(KINDS), has: k => !!KINDS[k], TH, bg, grain };
})();
