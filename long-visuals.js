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
  const SEC = /[?&]part=islamic\b/.test(location.search) || /\/islamic\//.test(location.pathname) ? 'isl' : /[?&]part=explainer\b/.test(location.search) ? 'exp' : 'story';
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
    paper: { a: '#FCF6EA', b: '#EEDDBF', glow: '#FFB347', acc: '#C8781E', ink: '#2A1A10', dim: '#8A6A4A', ok: '#2E9E5B', bad: '#D2343C', light: 1 }, // short videos: bright, clear
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
    c.save(); c.strokeStyle = T.light ? 'rgba(120,80,40,.06)' : 'rgba(150,185,255,.055)'; c.lineWidth = 1; const gs = 90 * u, off = (t * 7 * u) % gs;
    c.beginPath(); for (let x = -gs; x <= FW + gs; x += gs) { c.moveTo(x + .5, 0); c.lineTo(x + .5, FH); } for (let y = -gs; y <= FH + gs; y += gs) { c.moveTo(0, y + off + .5); c.lineTo(FW, y + off + .5); } c.stroke(); c.restore();
    // dust motes
    for (let i = 0; i < 26; i++) { const x = (i * 263 + Math.sin(t * .3 + i) * 30) % FW, y = (FH - ((i * 331 + t * (10 + i % 5 * 4) * u) % FH)), a = .06 + (i % 4) * .035; c.globalAlpha = a; c.fillStyle = T.acc; c.beginPath(); c.arc(Math.abs(x), y, (1.4 + i % 3) * u, 0, 7); c.fill(); } c.globalAlpha = 1;
    // vignette
    const vg = c.createRadialGradient(FW / 2, FH / 2, Math.min(FW, FH) * .32, FW / 2, FH / 2, Math.max(FW, FH) * .74); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, T.light ? 'rgba(80,50,20,.16)' : 'rgba(0,0,0,.72)'); c.fillStyle = vg; c.fillRect(0, 0, FW, FH);
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
      TXT(c, s, x, y + size * .3, size, opt.ink || (T.light ? '#FFF4E4' : T.ink), 800, 'center', null, w - size * .6); R(c, x - w / 2 + size * .5, y + h / 2 - size * .22, (w - size) * eo(k), 4, 2, opt.line || T.acc); });
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

  /* ================= everyday objects & situations (round 2) ================= */
  const steam = (c, x, y, lt, n, h, w) => { c.save(); c.lineCap = 'round'; for (let i = 0; i < n; i++) { const ph = (lt * .55 + i / n) % 1; c.globalAlpha = .34 * Math.sin(ph * Math.PI); c.strokeStyle = '#FFFFFF'; c.lineWidth = w || 14; c.beginPath(); const x0 = x + (i - (n - 1) / 2) * 60; for (let s = 0; s <= 20; s++) { const yy = y - s / 20 * h - ph * 60, xx = x0 + Math.sin(s * .5 + lt * 2 + i) * 18; if (s === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.stroke(); } c.restore(); };
  const rays = (c, x, y, lt, col, n, len, a) => { c.save(); c.translate(x, y); c.rotate(lt * .25); c.globalAlpha *= a == null ? .22 : a; c.fillStyle = col; for (let i = 0; i < n; i++) { c.rotate(Math.PI * 2 / n); c.beginPath(); c.moveTo(0, 0); c.lineTo(len, -len * .09); c.lineTo(len, len * .09); c.closePath(); c.fill(); } c.restore(); };
  const sparkles = (c, lt, seed, n, rx, ry, col, cx, cy) => { const r = rng(seed); for (let i = 0; i < n; i++) { const x = (cx || 0) + (r() - .5) * rx * 2, y = (cy || 0) + (r() - .5) * ry * 2, ph = (lt * (1 + r()) + r() * 3) % 1.6, a = ph < .8 ? Math.sin(ph / .8 * Math.PI) : 0; if (a <= 0) continue; const s = (8 + r() * 14) * a; c.save(); c.globalAlpha = a; c.fillStyle = col || '#FFF6C8'; c.beginPath(); c.moveTo(x, y - s * 2); c.lineTo(x + s * .4, y - s * .4); c.lineTo(x + s * 2, y); c.lineTo(x + s * .4, y + s * .4); c.lineTo(x, y + s * 2); c.lineTo(x - s * .4, y + s * .4); c.lineTo(x - s * 2, y); c.lineTo(x - s * .4, y - s * .4); c.closePath(); c.fill(); c.restore(); } };
  const confetti = (c, lt, seed, n) => { const r = rng(seed), cols = ['#FFD23F', '#FF5468', '#4CC9F0', '#7CFF8A', '#B05CFF', '#FF8A3D']; for (let i = 0; i < n; i++) { const x = (r() - .5) * 2200, sp = 180 + r() * 220, y = -520 + ((lt * sp + r() * 900) % 1100), a = lt * (2 + r() * 4) + i; c.save(); c.translate(x + Math.sin(a) * 30, y); c.rotate(a); c.fillStyle = cols[i % cols.length]; c.fillRect(-9, -5, 18, 10 * Math.abs(Math.cos(a * 1.3)) + 2); c.restore(); } };
  const heartPath = (c, x, y, s) => { c.beginPath(); c.moveTo(x, y - s * .3); c.bezierCurveTo(x - s * .5, y - s * .95, x - s * 1.25, y - s * .2, x, y + s * .62); c.bezierCurveTo(x + s * 1.25, y - s * .2, x + s * .5, y - s * .95, x, y - s * .3); c.closePath(); };
  const wheel = (c, x, y, r, lt) => { O(c, x, y, r, '#111418'); O(c, x, y, r * .55, '#9AA3B2'); c.save(); c.translate(x, y); c.rotate(lt * 12); for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); L(c, 0, 0, r * .55, 0, '#5A6270', 5); } c.restore(); O(c, x, y, r * .14, '#2A2F38'); };
  const sky = (c, top, bot) => { const g = c.createLinearGradient(0, -520, 0, 420); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(-1400, -700, 2800, 1400); };
  const stars = (c, seed, lt, n) => { const r = rng(seed); for (let i = 0; i < n; i++) O(c, r() * 2600 - 1300, -r() * 520 - 40, 1 + r() * 1.8, 'rgba(255,255,255,' + (.25 + .45 * Math.abs(Math.sin(lt * 1.2 + i))) + ')'); };
  const label = (c, o, y) => { if (o.tx[0]) chip(c, o.tx[0], 0, Math.min(y || 330, 335), 50, bk(o.lt, 1, .45), o.T); };

  /* a framed photo on the wall: swings on its nail, light sweeps over the glass */
  reg('frame', 'ember', (c, o) => {
    const lt = o.lt, v = String(o.tx[1] || '');
    const wg = c.createLinearGradient(0, -460, 0, 460); wg.addColorStop(0, '#5E3F2A'); wg.addColorStop(1, '#2A190F'); c.fillStyle = wg; c.fillRect(-1400, -700, 2800, 1400);
    c.globalAlpha = .07; for (let x = -1400; x < 1400; x += 70) { c.fillStyle = (Math.round(x / 70) % 2) ? '#000' : '#FFE7C2'; c.fillRect(x, -700, 35, 1400); } c.globalAlpha = 1;
    const lg = c.createRadialGradient(0, -430, 10, 0, -160, 760); lg.addColorStop(0, 'rgba(255,214,150,.5)'); lg.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = lg; c.fillRect(-1400, -700, 2800, 1400);
    const k = bk(lt, .05, .6), sw = Math.sin(lt * 3.4) * Math.exp(-lt * .9) * .14 + Math.sin(lt * 1.1) * .012;
    O(c, 0, -330, 10, '#CFC6B5');
    c.save(); c.translate(0, -330); c.rotate(sw);
    L(c, 0, 0, -170, 90, '#B8A98E', 3); L(c, 0, 0, 170, 90, '#B8A98E', 3);
    pop(c, 0, 330, k, () => {
      const W = 420, H = 500, x = -W / 2, y = 80;
      c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 40; c.shadowOffsetY = 24; const fg = c.createLinearGradient(x, y, x + W, y + H); fg.addColorStop(0, '#F2D58A'); fg.addColorStop(.5, '#A8762A'); fg.addColorStop(1, '#E9C46A'); R(c, x, y, W, H, 10, fg); c.restore();
      R(c, x + 26, y + 26, W - 52, H - 52, 4, '#F4EEDF');
      const px = x + 54, py = y + 54, pw = W - 108, ph = H - 108; c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
      const sg = c.createLinearGradient(0, py, 0, py + ph); sg.addColorStop(0, '#9EC9E8'); sg.addColorStop(1, '#E9D9B8'); c.fillStyle = sg; c.fillRect(px, py, pw, ph);
      const n = /one|single|একা|বাবা|মা|দাদা|নানা/.test(v) ? 1 : /two|couple|বিয়ে|দুজন/.test(v) ? 2 : 3, cx = px + pw / 2, by = py + ph;
      for (let i = 0; i < n; i++) { const dx = n === 1 ? 0 : n === 2 ? (i - .5) * 120 : (i - 1) * 105, s = n === 1 ? 2.8 : i === 1 && n === 3 ? 1.55 : 2.1; person(c, cx + dx, by - 34 * s, s, SKIN[(o.seed + i) % 5], SHIRT[(o.seed + i * 2) % 6]); }
      c.fillStyle = 'rgba(120,80,30,.2)'; c.fillRect(px, py, pw, ph); c.restore();
      c.save(); c.globalAlpha = .2; c.fillStyle = '#fff'; c.beginPath(); const gx = px + ((lt * 170) % (pw + 420)) - 200; c.moveTo(gx, py); c.lineTo(gx + 70, py); c.lineTo(gx - 50, py + ph); c.lineTo(gx - 120, py + ph); c.closePath(); c.fill(); c.restore();
    });
    c.restore(); label(c, o);
  });

  /* a plate of rice with dal and curry, steam rising (variants: empty, sweets, biryani) */
  reg('plate', 'ember', (c, o) => {
    const lt = o.lt, v = String(o.tx[1] || ''), empty = /empty|খালি/.test(v), sweets = /sweet|মিষ্টি/.test(v), biryani = /biryani|বিরিয়ানি|পোলাও/.test(v);
    const tg = c.createLinearGradient(0, -200, 0, 600); tg.addColorStop(0, '#7A4C2C'); tg.addColorStop(1, '#3B2414'); c.fillStyle = tg; c.beginPath(); c.ellipse(0, 150, 1200, 460, 0, 0, 7); c.fill();
    c.globalAlpha = .1; c.strokeStyle = '#000'; c.lineWidth = 4; for (let i = 1; i < 9; i++) { c.beginPath(); c.ellipse(0, 150, 1200 - i * 120, 460 - i * 46, 0, 0, 7); c.stroke(); } c.globalAlpha = 1;
    const k = bk(lt, .05, .55);
    pop(c, 0, 60, k, () => {
      c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; c.shadowOffsetY = 20; c.beginPath(); c.ellipse(0, 60, 430, 205, 0, 0, 7); c.fillStyle = '#F3F1EC'; c.fill(); c.restore();
      c.beginPath(); c.ellipse(0, 60, 345, 158, 0, 0, 7); c.fillStyle = '#E2DED4'; c.fill(); c.beginPath(); c.ellipse(0, 52, 335, 150, 0, 0, 7); c.fillStyle = '#FAF8F3'; c.fill();
      if (empty) { const r = rng(o.seed); for (let i = 0; i < 9; i++) { c.save(); c.translate(-120 + r() * 240, 20 + r() * 70); c.rotate(r() * 3); R(c, -7, -3, 14, 6, 3, '#FFFFFF'); c.restore(); } return; }
      if (sweets) { [[-110, 30], [0, 10], [110, 30], [-55, 85], [55, 85]].forEach(([x, y], i) => { const kk = bk(lt, .3 + i * .15, .4); pop(c, x, y, kk, () => { O(c, x, y + 6, 58, '#E9D9B6'); O(c, x, y, 58, '#F8EED8'); O(c, x - 18, y - 20, 16, 'rgba(255,255,255,.8)'); }); }); return; }
      const rc = biryani ? '#E8B04A' : '#FFFFFF'; c.beginPath(); c.ellipse(-60, 45, 190, 100, 0, Math.PI, 0); c.ellipse(-60, 45, 190, 42, 0, 0, Math.PI); c.fillStyle = rc; c.fill();
      const r = rng(o.seed + 3); for (let i = 0; i < 80; i++) { const a = r() * Math.PI, q = Math.sqrt(r()), x = -60 + Math.cos(a) * 180 * q, y = 45 - Math.sin(a) * 92 * q; c.save(); c.translate(x, y); c.rotate(r() * 3); R(c, -6, -2.5, 12, 5, 2.5, biryani ? '#F7D27E' : '#E6E2D8'); c.restore(); }
      if (biryani) { O(c, -10, -12, 34, '#8B3A1E'); O(c, -130, 12, 26, '#9A4A22'); O(c, 40, 20, 14, '#F2F2F2'); }
      [[210, -30, '#E8B53A'], [195, 115, '#C9561E']].forEach(([x, y, col], i) => { const kk = bk(lt, .35 + i * .2, .45); pop(c, x, y, kk, () => { c.beginPath(); c.ellipse(x, y, 95, 52, 0, 0, 7); c.fillStyle = '#D5D0C5'; c.fill(); c.beginPath(); c.ellipse(x, y - 4, 80, 40, 0, 0, 7); c.fillStyle = col; c.fill(); if (i === 1) { O(c, x - 20, y - 8, 14, '#7A2E10'); O(c, x + 22, y, 12, '#8A3A16'); } c.globalAlpha = .35; c.beginPath(); c.ellipse(x - 20, y - 16, 30, 8, 0, 0, 7); c.fillStyle = '#fff'; c.fill(); c.globalAlpha = 1; }); });
      c.save(); c.translate(-330, 120); c.rotate(-.4); c.beginPath(); c.moveTo(-60, 0); c.quadraticCurveTo(0, -28, 60, 0); c.quadraticCurveTo(0, -6, -60, 0); c.fillStyle = '#3E9B3A'; c.fill(); L(c, 60, 0, 80, -12, '#2E6B2A', 6); c.restore();
    });
    if (!empty && !sweets) steam(c, -60, -70, lt, 3, 250);
    label(c, o);
  });

  /* a steaming cup of tea on a saucer */
  reg('tea', 'ember', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .55);
    const tg = c.createLinearGradient(0, 100, 0, 600); tg.addColorStop(0, '#6B4226'); tg.addColorStop(1, '#2E1B10'); c.fillStyle = tg; c.fillRect(-1400, 150, 2800, 600);
    pop(c, 0, 100, k, () => {
      c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 30; c.shadowOffsetY = 14; c.beginPath(); c.ellipse(0, 200, 330, 70, 0, 0, 7); c.fillStyle = '#F2EEE6'; c.fill(); c.restore();
      c.beginPath(); c.ellipse(0, 192, 230, 42, 0, 0, 7); c.fillStyle = '#DDD7CB'; c.fill();
      c.beginPath(); c.moveTo(-190, -40); c.lineTo(-150, 170); c.quadraticCurveTo(0, 215, 150, 170); c.lineTo(190, -40); c.closePath(); const g = c.createLinearGradient(-190, 0, 190, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#DCD6CA'); c.fillStyle = g; c.fill();
      c.lineWidth = 26; c.strokeStyle = '#EFEAE1'; c.beginPath(); c.arc(215, 50, 62, -Math.PI / 2, Math.PI / 2); c.stroke();
      c.beginPath(); c.ellipse(0, -40, 190, 40, 0, 0, 7); c.fillStyle = '#F7F4EE'; c.fill(); c.beginPath(); c.ellipse(0, -36, 168, 30, 0, 0, 7); c.fillStyle = '#9A5B2B'; c.fill();
      c.globalAlpha = .3; c.beginPath(); c.ellipse(-50, -42, 50, 8, 0, 0, 7); c.fillStyle = '#fff'; c.fill(); c.globalAlpha = 1;
      R(c, -150, 30, 300, 10, 5, '#C9563A');
      c.save(); c.translate(-420, 190); c.rotate(-.2); R(c, -80, -30, 160, 60, 14, '#D9A05B'); for (let i = 0; i < 6; i++) O(c, -55 + i * 22, 0, 4, '#A86E30'); c.restore();
    });
    steam(c, 0, -90, lt, 3, 300);
    label(c, o);
  });

  /* a house at dusk: the windows light up, smoke from the chimney (variant "sale": a for-sale board swings) */
  reg('house', 'night', (c, o) => {
    const lt = o.lt, T = o.T, sale = /sale|বিক্রি|নিলাম|বন্ধক/.test(String(o.tx[1] || ''));
    sky(c, '#0B1430', '#3A2A4A'); stars(c, o.seed, lt, 40); O(c, -600, -300, 58, '#F3F0DC'); c.globalAlpha = .12; O(c, -600, -300, 140, '#F3F0DC'); c.globalAlpha = 1;
    const gg = c.createLinearGradient(0, 240, 0, 360); gg.addColorStop(0, '#1F4A2C'); gg.addColorStop(1, '#0B1A12'); c.fillStyle = gg; c.fillRect(-1400, 240, 2800, 500);
    for (let i = 0; i < 5; i++) { const ph = (lt * .35 + i / 5) % 1; c.globalAlpha = .28 * (1 - ph); O(c, 200 + Math.sin(ph * 6 + i) * 30, -270 - ph * 280, 26 + ph * 60, '#B9C2CF'); } c.globalAlpha = 1;
    const k = bk(lt, .05, .55);
    pop(c, 0, 250, k, () => {
      R(c, 170, -260, 60, 130, 4, '#5A2A20');
      R(c, -300, -60, 600, 310, 4, '#C9764A'); c.fillStyle = 'rgba(0,0,0,.12)'; for (let y = -50; y < 250; y += 36) c.fillRect(-300, y, 600, 3);
      c.beginPath(); c.moveTo(-370, -50); c.lineTo(0, -310); c.lineTo(370, -50); c.closePath(); c.fillStyle = '#7B2E22'; c.fill(); L(c, -370, -50, 370, -50, '#5A1E16', 10);
      R(c, -55, 105, 110, 145, [55, 55, 0, 0], '#4A2A18'); O(c, 30, 185, 7, '#E9C46A');
      [[-230, 10], [120, 10]].forEach(([x, y], i) => { const on = C.cl((lt - .6 - i * .45) / .3); R(c, x, y, 110, 100, 6, '#2A1A12'); if (on > 0) { c.save(); c.globalAlpha = on; c.shadowColor = '#FFD36B'; c.shadowBlur = 60; R(c, x + 8, y + 8, 94, 84, 4, '#FFD36B'); c.restore(); } L(c, x + 55, y, x + 55, y + 100, '#5A3A26', 6); L(c, x, y + 50, x + 110, y + 50, '#5A3A26', 6); });
      R(c, -540, 40, 34, 210, 8, '#4A2E1A'); O(c, -523, 0, 110, '#1F5A34'); O(c, -590, 40, 80, '#1A4D2C'); O(c, -460, 40, 80, '#226640');
    });
    if (sale) { const sk = bk(lt, .9, .5), sw = Math.sin(lt * 3) * .06; pop(c, 500, 150, sk, () => { L(c, 500, 330, 500, 60, '#6B4A2E', 14); c.save(); c.translate(500, 80); c.rotate(sw); L(c, -90, 0, -90, 30, '#888', 3); L(c, 90, 0, 90, 30, '#888', 3); R(c, -140, 30, 280, 110, 10, '#E5484D'); TXT(c, 'বিক্রি হবে', 0, 102, 46, '#FFFFFF', 800, 'center'); c.restore(); }); }
    label(c, o, 340);
  });

  /* a car / bus / rickshaw / truck driving past a city, wheels spinning, speed lines */
  reg('vehicle', 'steel', (c, o) => {
    const lt = o.lt, v = String(o.tx[1] || 'car');
    const r = rng(o.seed); let x = -1400; while (x < 1400) { const w = 80 + r() * 150, h = 120 + r() * 280; c.fillStyle = '#121A26'; c.fillRect(x, 165 - h, w, h); for (let i = 0; i < 6; i++) if (r() > .5) { c.fillStyle = 'rgba(255,214,107,.35)'; c.fillRect(x + 14 + (i % 2) * (w / 2 - 10), 180 - h + Math.floor(i / 2) * 40, 18, 14); } x += w + 10; }
    c.fillStyle = '#1A1F27'; c.fillRect(-1400, 170, 2800, 300); c.fillStyle = '#2C333E'; c.fillRect(-1400, 160, 2800, 14);
    const off = (lt * 700) % 260; for (let x2 = -1500; x2 < 1500; x2 += 260) R(c, x2 - off, 300, 130, 14, 7, '#E8C547');
    c.globalAlpha = .32; for (let i = 0; i < 7; i++) { const y = -170 + i * 48, xx = 900 - ((lt * 1100 + i * 230) % 2200); L(c, xx, y, xx + 240, y, '#9FD4FF', 4); } c.globalAlpha = 1;
    const k = bk(lt, .03, .5), b = Math.abs(Math.sin(lt * 10)) * 5;
    pop(c, 0, 150, k, () => { c.save(); c.translate(Math.sin(lt * .8) * 40, -b);
      if (/bus|বাস/.test(v)) { R(c, -400, -150, 800, 270, 34, '#2E8B57'); R(c, -400, 60, 800, 34, 0, '#226B43'); for (let i = 0; i < 6; i++) R(c, -370 + i * 112, -118, 94, 90, 10, '#BFE3F7'); R(c, 330, -118, 50, 180, 8, '#1A3A2A'); R(c, 360, 40, 30, 24, 6, '#FFE9A8'); wheel(c, -260, 130, 56, lt); wheel(c, 260, 130, 56, lt); }
      else if (/rickshaw|রিকশা/.test(v)) { wheel(c, -200, 110, 80, lt); wheel(c, 260, 130, 60, lt); L(c, -200, 110, 260, 130, '#3A3F4B', 12); L(c, -60, 120, 140, -40, '#3A3F4B', 10); c.beginPath(); c.moveTo(-330, 20); c.quadraticCurveTo(-320, -260, -80, -240); c.lineTo(-60, 30); c.closePath(); c.fillStyle = '#D9363E'; c.fill(); c.strokeStyle = '#FFD23F'; c.lineWidth = 8; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-300 + i * 55, 10); c.quadraticCurveTo(-290 + i * 50, -200, -110 + i * 10, -220 + i * 30); c.stroke(); } R(c, -320, 10, 280, 50, 14, '#3A6FD8'); L(c, 140, -40, 200, -60, '#3A3F4B', 10); O(c, 140, -60, 18, '#C98B5C'); }
      else if (/truck|ট্রাক/.test(v)) { R(c, -420, -200, 520, 300, 10, '#E0883A'); R(c, 100, -110, 260, 210, 20, '#3A6FD8'); R(c, 230, -90, 110, 80, 8, '#BFE3F7'); R(c, 330, 50, 30, 24, 6, '#FFE9A8'); [-300, -120, 240].forEach(w => wheel(c, w, 120, 54, lt)); }
      else { c.beginPath(); c.moveTo(-340, 90); c.lineTo(-340, 10); c.quadraticCurveTo(-330, -20, -270, -30); c.lineTo(-170, -125); c.quadraticCurveTo(-150, -140, -110, -140); c.lineTo(120, -140); c.quadraticCurveTo(165, -140, 195, -112); c.lineTo(275, -30); c.quadraticCurveTo(345, -20, 345, 20); c.lineTo(345, 90); c.closePath(); const g = c.createLinearGradient(0, -140, 0, 90); g.addColorStop(0, '#F0525A'); g.addColorStop(1, '#B8232C'); c.fillStyle = g; c.fill();
        c.fillStyle = '#BFE3F7'; c.beginPath(); c.moveTo(-145, -38); c.lineTo(-95, -115); c.lineTo(-5, -115); c.lineTo(-5, -38); c.closePath(); c.fill(); c.beginPath(); c.moveTo(15, -38); c.lineTo(15, -115); c.lineTo(120, -115); c.lineTo(190, -38); c.closePath(); c.fill();
        R(c, 305, 0, 40, 26, 6, '#FFE9A8'); c.save(); c.globalAlpha = .18; c.fillStyle = '#FFE9A8'; c.beginPath(); c.moveTo(345, 0); c.lineTo(900, -120); c.lineTo(900, 160); c.lineTo(345, 26); c.closePath(); c.fill(); c.restore();
        wheel(c, -210, 95, 60, lt); wheel(c, 210, 95, 60, lt); }
      c.restore(); });
    label(c, o, 360);
  });

  /* dark clouds, rain, lightning flashes, ripples on the ground */
  reg('rain', 'steel', (c, o) => {
    const lt = o.lt, fl = ((lt + .6) % 2.7) < .12 ? 1 : 0;
    if (fl) { c.fillStyle = 'rgba(220,230,255,.32)'; c.fillRect(-1400, -700, 2800, 1400); }
    const cloud = (x, y, s, col) => { c.fillStyle = col; [[0, 0, 90], [80, -34, 112], [185, 0, 92], [92, 30, 100], [-80, 16, 70]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, 7); c.fill(); }); };
    cloud(-760 + Math.sin(lt * .3) * 30, -300, 1.7, '#3A4252'); cloud(450 + Math.sin(lt * .2) * 20, -280, 1.6, '#3A4252'); cloud(-150 + Math.sin(lt * .25) * 25, -330, 2, '#2A303C');
    if (fl) { c.save(); c.strokeStyle = '#FFF7C2'; c.lineWidth = 12; c.lineJoin = 'round'; c.shadowColor = '#FFF7C2'; c.shadowBlur = 50; c.beginPath(); c.moveTo(60, -230); c.lineTo(0, -80); c.lineTo(80, -60); c.lineTo(-20, 160); c.stroke(); c.restore(); }
    c.strokeStyle = 'rgba(170,200,255,.55)'; c.lineWidth = 4; c.beginPath(); for (let i = 0; i < 170; i++) { const x = ((i * 137) % 2800) - 1400, y = ((i * 211 + lt * 1700) % 950) - 330; c.moveTo(x, y); c.lineTo(x - 18, y + 62); } c.stroke();
    c.fillStyle = '#0E141C'; c.fillRect(-1400, 340, 2800, 400);
    for (let i = 0; i < 9; i++) { const ph = (lt * 1.2 + i * .37) % 1, x = -1000 + i * 250; c.globalAlpha = 1 - ph; c.strokeStyle = '#9FC3FF'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, 370, 20 + ph * 80, 6 + ph * 18, 0, 0, 7); c.stroke(); } c.globalAlpha = 1;
    label(c, o, 300);
  });

  /* sunrise over hills with birds (variant "night": moon, stars, drifting clouds) */
  reg('sun', 'ember', (c, o) => {
    const lt = o.lt, night = /night|রাত|moon|চাঁদ/.test(String(o.tx[1] || ''));
    if (night) { sky(c, '#050A1C', '#1B2348'); stars(c, o.seed, lt, 90); const k = eo(lt / 1.4); c.save(); c.shadowColor = '#F6F1D5'; c.shadowBlur = 80; O(c, 380, -220 + (1 - k) * 120, 130, '#F6F1D5'); c.restore(); O(c, 440, -260 + (1 - k) * 120, 118, '#1B2348');
      c.globalAlpha = .5; for (let i = 0; i < 3; i++) { const x = -900 + ((lt * 40 + i * 700) % 2200); c.fillStyle = '#2C3560'; c.beginPath(); c.ellipse(x, -80 + i * 70, 260, 40, 0, 0, 7); c.fill(); } c.globalAlpha = 1; }
    else { sky(c, '#3A2A6A', '#FF9A4D'); const k = eo(lt / 2.6), sy = 260 - k * 330; rays(c, 0, sy, lt, '#FFE9A8', 16, 1400, .16); c.save(); c.shadowColor = '#FFD36B'; c.shadowBlur = 90; O(c, 0, sy, 140, '#FFE08A'); c.restore();
      for (let i = 0; i < 4; i++) { const t2 = lt * .8 + i * .7, bx = -700 + ((t2 * 220) % 1600), by = -260 + i * 40 + Math.sin(t2 * 2) * 10, f = Math.sin(lt * 9 + i) * 14; c.strokeStyle = '#2A1A30'; c.lineWidth = 6; c.beginPath(); c.moveTo(bx - 30, by - f); c.quadraticCurveTo(bx - 12, by - 12, bx, by); c.quadraticCurveTo(bx + 12, by - 12, bx + 30, by - f); c.stroke(); } }
    c.fillStyle = night ? '#0A0F22' : '#5A2C3C'; c.beginPath(); c.moveTo(-1400, 300); c.quadraticCurveTo(-700, 80, 0, 260); c.quadraticCurveTo(600, 120, 1400, 280); c.lineTo(1400, 700); c.lineTo(-1400, 700); c.closePath(); c.fill();
    c.fillStyle = night ? '#060A18' : '#3A1A2A'; c.beginPath(); c.moveTo(-1400, 380); c.quadraticCurveTo(-400, 220, 300, 360); c.quadraticCurveTo(900, 260, 1400, 380); c.lineTo(1400, 700); c.lineTo(-1400, 700); c.closePath(); c.fill();
    label(c, o, 340);
  });

  /* a beating heart over a heartbeat line (variant "broken": it cracks in two) */
  reg('heart', 'alert', (c, o) => {
    const lt = o.lt, T = o.T, broken = /broken|ভাঙ|ফেটে|কষ্ট|break/.test(String(o.tx[1] || ''));
    c.save(); c.strokeStyle = 'rgba(255,90,110,.5)'; c.lineWidth = 6; c.beginPath(); for (let x = -1300; x <= 1300; x += 10) { const ph = ((x + lt * 600) % 600 + 600) % 600, y = ph > 260 && ph < 300 ? (ph < 280 ? -(ph - 260) * 7 : -(300 - ph) * 7) : ph > 300 && ph < 320 ? (ph - 300) * 4 : 0; if (x === -1300) c.moveTo(x, y + 20); else c.lineTo(x, y + 20); } c.stroke(); c.restore();
    const k = bk(lt, .05, .5), beat = 1 + .09 * Math.pow(Math.max(0, Math.sin(lt * 7)), 10), sp = broken ? eio((lt - 1.1) / .5) : 0;
    pop(c, 0, 0, k, () => { const g = c.createLinearGradient(0, -260, 0, 260); g.addColorStop(0, '#FF6B81'); g.addColorStop(1, '#C2163A');
      const half = (side) => { c.save(); c.translate(side * sp * 90, sp * 30); c.rotate(side * sp * .18); c.beginPath(); c.moveTo(0, -330); const zz = [[-30, -160], [30, -60], [-25, 40], [25, 150], [0, 330]]; zz.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(side * 600, 330); c.lineTo(side * 600, -330); c.closePath(); if (broken) c.clip(); c.save(); c.scale(beat, beat); c.shadowColor = '#FF3B5C'; c.shadowBlur = 60; heartPath(c, 0, 0, 330); c.fillStyle = g; c.fill(); c.restore(); c.globalAlpha = .35; O(c, -120 * beat, -110 * beat, 50, '#fff'); c.restore(); };
      if (broken) { half(-1); half(1); } else { c.save(); c.scale(beat, beat); c.shadowColor = '#FF3B5C'; c.shadowBlur = 70; heartPath(c, 0, 0, 330); c.fillStyle = g; c.fill(); c.restore(); c.globalAlpha = .35; O(c, -120, -110, 50, '#fff'); c.globalAlpha = 1; } });
    label(c, o, 320);
  });

  /* an open book, pages flipping, letters floating up */
  reg('book', 'ember', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .55), r = rng(o.seed), LETTERS = 'অআকখগঘচছজঝটঠডঢতথদধনপফবভমযরলশসহ';
    for (let i = 0; i < 18; i++) { const ph = (lt * .4 + r()) % 1, x = (r() - .5) * 700, y = 60 - ph * 520; c.globalAlpha = Math.sin(ph * Math.PI) * .8; TXT(c, LETTERS[Math.floor(r() * LETTERS.length)], x + Math.sin(lt + i) * 20, y, 36 + r() * 30, '#FFE3A8', 700, 'center'); } c.globalAlpha = 1;
    pop(c, 0, 150, k, () => { c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; c.shadowOffsetY = 20; R(c, -560, 60, 1120, 300, 20, '#5A2E1E'); c.restore();
      const page = (side, flip) => { c.save(); if (flip != null) { c.scale(flip, 1); } c.beginPath(); c.moveTo(0, 90); c.quadraticCurveTo(side * 260, 40, side * 520, 80); c.lineTo(side * 520, 330); c.quadraticCurveTo(side * 260, 300, 0, 345); c.closePath(); const g = c.createLinearGradient(0, 0, side * 520, 0); g.addColorStop(0, '#D9D0BC'); g.addColorStop(.15, '#FBF7EC'); g.addColorStop(1, '#F2EAD6'); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(90,60,30,.25)'; c.lineWidth = 4; for (let i = 0; i < 6; i++) { const yy = 130 + i * 32; c.beginPath(); c.moveTo(side * 60, yy + 6); c.lineTo(side * (440 - (i === 5 ? 160 : 0)), yy); c.stroke(); } c.restore(); };
      page(-1); page(1); const f = (lt * .8) % 1; if (lt > .4) page(1, Math.cos(f * Math.PI)); });
    sparkles(c, lt, o.seed, 10, 600, 120, '#FFE3A8', 0, -40);
    label(c, o, 330);
  });

  /* an answer script: lines get written, then a grade stamp lands */
  reg('exam', 'steel', (c, o) => {
    const lt = o.lt, g0 = String(o.tx[1] || o.tx[0] || 'A+'), fail = /ফেল|fail|^F$|অকৃতকার্য/i.test(g0), grade = /ফেল|fail/i.test(g0) ? 'ফেল' : (g0.length <= 6 ? g0 : 'A+'), k = bk(lt, .05, .5);
    pop(c, 0, 0, k, () => { c.save(); c.rotate(-.04); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 40; c.shadowOffsetY = 18; R(c, -330, -360, 660, 720, 14, '#FCFBF7'); c.restore(); c.save(); c.rotate(-.04);
      L(c, -250, -360, -250, 360, 'rgba(229,72,77,.5)', 3); for (let i = 0; i < 12; i++) L(c, -310, -250 + i * 52, 310, -250 + i * 52, 'rgba(80,120,200,.18)', 2);
      TXT(c, 'উত্তরপত্র', 0, -290, 46, '#1A2233', 800, 'center');
      const wrote = C.cl((lt - .3) / 1.4) * 9; let pen = null; c.strokeStyle = '#1F3A8A'; c.lineWidth = 5; c.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const f = C.cl(wrote - i); if (f <= 0) break; const y = -215 + i * 52, x1 = -230, len = 480 - (i % 3) * 60; c.beginPath(); for (let s = 0; s <= 40 * f; s++) { const xx = x1 + s / 40 * len, yy = y + Math.sin(s * 1.7 + i) * 6; if (s === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.stroke(); pen = [x1 + len * f, y]; }
      if (pen && lt < 1.8) { c.save(); c.translate(pen[0], pen[1]); c.rotate(-.7); R(c, -8, -150, 16, 140, 6, '#2F6BFF'); c.beginPath(); c.moveTo(-8, -10); c.lineTo(8, -10); c.lineTo(0, 8); c.fill(); c.restore(); }
      c.restore(); });
    const s = bk(lt, 1.8, .35); if (s > 0) { const z = 1 + (1 - C.cl((lt - 1.8) / .2)) * .8, col = fail ? '#E5484D' : '#22A06B'; c.save(); c.translate(200, 170); c.rotate(-.25); c.scale(z, z); c.globalAlpha = C.cl(s); c.lineWidth = 12; c.strokeStyle = col; c.beginPath(); c.arc(0, 0, 130, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, 108, 0, 7); c.lineWidth = 4; c.stroke(); TXT(c, grade, 0, 38, grade.length > 2 ? 72 : 110, col, 800, 'center', 'TFDisp', 200); c.restore(); }
    if (o.tx[0] && o.tx[0] !== g0) chip(c, o.tx[0], 0, 400, 46, bk(lt, 1.2, .4), o.T);
  });

  /* hospital monitor: heartbeat line, a red cross, pills (variant "flat": the line goes flat) */
  reg('health', 'steel', (c, o) => {
    const lt = o.lt, flat = /flat|মৃত্যু|মারা/.test(String(o.tx[1] || '')), k = bk(lt, .05, .5);
    pop(c, -120, -20, k, () => { c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 40; R(c, -620, -300, 880, 520, 30, '#1B232E', '#3B4656', 8); c.restore(); R(c, -585, -265, 810, 450, 14, '#05110C');
      c.strokeStyle = 'rgba(40,120,80,.25)'; c.lineWidth = 1; for (let x = -585; x < 225; x += 45) L(c, x, -265, x, 185, 'rgba(40,120,80,.22)', 1); for (let y = -265; y < 185; y += 45) L(c, -585, y, 225, y, 'rgba(40,120,80,.22)', 1);
      const flatK = flat ? C.cl((lt - 1.2) / .3) : 0; c.save(); c.beginPath(); c.rect(-585, -265, 810, 450); c.clip(); c.shadowColor = flat && flatK > .5 ? '#FF5468' : '#3DFF9A'; c.shadowBlur = 16; c.strokeStyle = flat && flatK > .5 ? '#FF5468' : '#3DFF9A'; c.lineWidth = 7; c.beginPath();
      for (let x = -585; x <= 225; x += 6) { const ph = ((x - lt * 420) % 270 + 270) % 270, alive = 1 - (flat ? C.cl(((x + 585) / 810 - (1 - flatK))) * flatK : 0); let y = 0; if (ph > 120 && ph < 135) y = -(ph - 120) * 11; else if (ph >= 135 && ph < 150) y = -(150 - ph) * 11 + (ph - 135) * 4; else if (ph >= 150 && ph < 160) y = (160 - ph) * 5; y *= alive; if (x === -585) c.moveTo(x, y - 40); else c.lineTo(x, y - 40); } c.stroke(); c.restore();
      TXT(c, flat && flatK > .5 ? '০' : String(toBn(72 + Math.round(Math.sin(lt * 2) * 3))), 150, -190, 60, flat && flatK > .5 ? '#FF5468' : '#3DFF9A', 800, 'center'); TXT(c, '♥', 150, -120, 40, '#FF5468', 700, 'center'); });
    const ck = bk(lt, .4, .45); pop(c, 470, -120, ck, () => { c.save(); c.shadowColor = '#FF3B4E'; c.shadowBlur = 40; R(c, 410, -260, 120, 280, 18, '#E5484D'); R(c, 330, -180, 280, 120, 18, '#E5484D'); c.restore(); });
    [[400, 180, '#4C7BD9', .3], [520, 230, '#E0883A', .6]].forEach(([x, y, col, d], i) => { const pk = bk(lt, .7 + d, .4); pop(c, x, y, pk, () => { c.save(); c.translate(x, y); c.rotate(.5 + i * .6); R(c, -70, -30, 140, 60, 30, '#F2F2F2'); c.save(); c.beginPath(); c.rect(-70, -30, 70, 60); c.clip(); R(c, -70, -30, 140, 60, 30, col); c.restore(); c.restore(); }); });
    label(c, o, 340);
  });

  /* a gift box: the lid pops, light and sparkles come out */
  reg('gift', 'plum', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), open = eio((lt - .8) / .4);
    if (open > 0) rays(c, 0, -60, lt, '#FFE7A8', 14, 1300, .25 * open);
    pop(c, 0, 120, k, () => { c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; c.shadowOffsetY = 18; R(c, -260, -60, 520, 360, 16, '#E5484D'); c.restore(); R(c, -40, -60, 80, 360, 0, '#FFD23F'); R(c, -260, -60, 520, 40, 0, 'rgba(0,0,0,.15)');
      c.save(); c.translate(0, -60 - open * 220); c.rotate(-open * .35); R(c, -290, -80, 580, 90, 14, '#F0525A'); R(c, -40, -80, 80, 90, 0, '#FFD23F'); c.fillStyle = '#FFD23F'; c.beginPath(); c.ellipse(-70, -110, 80, 42, -.4, 0, 7); c.ellipse(70, -110, 80, 42, .4, 0, 7); c.fill(); O(c, 0, -100, 30, '#F2B92A'); c.restore(); });
    if (open > 0) { c.save(); c.globalAlpha = open; const g = c.createRadialGradient(0, -60, 10, 0, -60, 420); g.addColorStop(0, 'rgba(255,240,190,.9)'); g.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = g; c.fillRect(-500, -500, 1000, 600); c.restore(); sparkles(c, lt, o.seed, 22, 520, 240, '#FFF2B8', 0, -200); }
    label(c, o, 360);
  });

  /* a golden trophy rising with light rays and confetti */
  reg('trophy', 'ember', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .55), up = (1 - eo(lt / .8)) * 140;
    rays(c, 0, -60, lt, '#FFD36B', 18, 1400, .2);
    pop(c, 0, 0, k, () => { c.save(); c.translate(0, up); const g = c.createLinearGradient(-200, 0, 200, 0); g.addColorStop(0, '#C48715'); g.addColorStop(.45, '#FFE08A'); g.addColorStop(1, '#B07510');
      c.save(); c.shadowColor = '#FFD36B'; c.shadowBlur = 60; c.beginPath(); c.moveTo(-210, -300); c.lineTo(210, -300); c.quadraticCurveTo(200, -20, 40, 30); c.lineTo(-40, 30); c.quadraticCurveTo(-200, -20, -210, -300); c.closePath(); c.fillStyle = g; c.fill(); c.restore();
      c.lineWidth = 28; c.strokeStyle = '#D9A12A'; c.beginPath(); c.arc(-230, -190, 80, Math.PI * .5, Math.PI * 1.5); c.stroke(); c.beginPath(); c.arc(230, -190, 80, -Math.PI * .5, Math.PI * .5); c.stroke();
      R(c, -30, 30, 60, 110, 8, '#C48715'); R(c, -150, 140, 300, 60, 12, '#8A5A12'); R(c, -190, 200, 380, 70, 14, '#5A3A10');
      TXT(c, '★', 0, -110, 150, '#FFF6D0', 800, 'center'); c.globalAlpha = .45; R(c, -160, -280, 40, 220, 20, '#FFF'); c.restore(); });
    if (lt > .5) confetti(c, lt - .5, o.seed, 60);
    label(c, o, 350);
  });

  /* a light bulb that flickers on: an idea */
  reg('idea', 'night', (c, o) => {
    const lt = o.lt, T = o.T, on = lt < .6 ? 0 : lt < 1 ? (Math.sin(lt * 60) > 0 ? 1 : .2) : 1, k = bk(lt, .05, .5);
    if (on) { rays(c, 0, -100, lt, '#FFE9A8', 14, 1300, .18 * on); const g = c.createRadialGradient(0, -100, 10, 0, -100, 600); g.addColorStop(0, 'rgba(255,233,168,' + .5 * on + ')'); g.addColorStop(1, 'rgba(255,233,168,0)'); c.fillStyle = g; c.fillRect(-1400, -700, 2800, 1400); }
    pop(c, 0, 0, k, () => { c.save(); if (on) { c.shadowColor = '#FFE08A'; c.shadowBlur = 90; } c.beginPath(); c.arc(0, -120, 200, Math.PI * .8, Math.PI * .2); c.quadraticCurveTo(110, 60, 90, 130); c.lineTo(-90, 130); c.quadraticCurveTo(-110, 60, -160, 0); c.closePath(); c.fillStyle = on ? '#FFE9A0' : '#5A6478'; c.fill(); c.restore();
      c.strokeStyle = on ? '#C98A1A' : '#2E3646'; c.lineWidth = 8; c.beginPath(); c.moveTo(-40, 120); c.lineTo(-40, -40); c.lineTo(0, -80); c.lineTo(40, -40); c.lineTo(40, 120); c.stroke();
      for (let i = 0; i < 4; i++) R(c, -100 + i * 4, 140 + i * 34, 200 - i * 8, 30, 10, i % 2 ? '#8A93A6' : '#B7BFCE'); R(c, -40, 276, 80, 30, 12, '#3A4252'); c.globalAlpha = .35; O(c, -90, -190, 50, '#fff'); c.globalAlpha = 1; });
    label(c, o, 360);
  });

  /* a shopping cart: items drop in, price tags pop */
  reg('cart', 'ember', (c, o) => {
    const lt = o.lt, T = o.T, k = bk(lt, .05, .5), dear = /dear|দাম|expensive/.test(String(o.tx[1] || ''));
    pop(c, 0, 50, k, () => { c.save(); c.translate(Math.sin(lt * 1.2) * 20, 0);
      const items = [['#E5484D', -170, 70, 110], ['#4C7BD9', -40, 90, 90], ['#FFD23F', 90, 60, 100], ['#3FA37C', 200, 80, 80]];
      items.forEach(([col, x, w, h], i) => { const d = C.cl((lt - .3 - i * .25) / .35), y = -40 - h - (1 - eo(d)) * 500; if (d <= 0) return; c.save(); c.translate(x + w / 2, y + h / 2); c.rotate((1 - d) * (i % 2 ? .5 : -.5)); R(c, -w / 2, -h / 2, w, h, 10, col); R(c, -w / 2 + 10, -h / 2 + 12, w - 20, 16, 6, 'rgba(255,255,255,.4)'); c.restore(); });
      c.lineWidth = 14; c.strokeStyle = '#C5CAD6'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-440, -220); c.lineTo(-360, -220); c.lineTo(-290, 120); c.lineTo(300, 120); c.lineTo(350, -60); c.lineTo(-330, -60); c.stroke();
      c.lineWidth = 5; for (let i = 1; i < 8; i++) { const x = -320 + i * 82; L(c, x, -60, x - 10 + (i * 4), 120, '#9AA3B2', 5); } L(c, -320, 30, 330, 30, '#9AA3B2', 5);
      L(c, -290, 120, -300, 190, '#C5CAD6', 12); L(c, -300, 190, 280, 190, '#C5CAD6', 12); wheel(c, -250, 220, 32, lt); wheel(c, 240, 220, 32, lt);
      c.restore(); });
    ['৳', dear ? '↑' : '৳'].forEach((s, i) => { const tk = bk(lt, 1.2 + i * .3, .4); pop(c, -420 + i * 840, -240, tk, () => { c.save(); c.translate(-420 + i * 840, -240); c.rotate(i ? .15 : -.15); R(c, -80, -50, 160, 100, 14, dear ? '#E5484D' : '#FFD23F'); O(c, -55, -25, 10, '#3A2A10'); TXT(c, s, 10, 28, 70, dear ? '#FFFFFF' : '#3A2A10', 800, 'center'); c.restore(); }); });
    label(c, o, 350);
  });

  /* a wallet that opens: empty (a moth flies out) or full of notes */
  reg('wallet', 'money', (c, o) => {
    const lt = o.lt, full = /full|ভরা/.test(String(o.tx[1] || '')), k = bk(lt, .05, .5), op = eio((lt - .5) / .5);
    pop(c, 0, 60, k, () => { c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 40; c.shadowOffsetY = 18; R(c, -340, -40, 680, 340, 30, '#6B4226'); c.restore(); c.setLineDash([14, 10]); R(c, -320, -20, 640, 300, 24, null, '#A8784E', 4); c.setLineDash([]);
      if (full) { for (let i = 0; i < 4; i++) { const y = -40 - op * (90 + i * 22); c.save(); c.translate(-140 + i * 90, y); c.rotate(-.08 + i * .05); R(c, -120, -60, 240, 120, 8, '#3FA37C'); O(c, 0, 0, 34, '#2E8B57'); TXT(c, '৳', 0, 18, 50, '#E8FFF2', 800, 'center'); c.restore(); } }
      c.save(); c.translate(0, -40); c.scale(1, Math.max(.05, 1 - op * 1.9)); R(c, -340, -170, 680, 170, [30, 30, 0, 0], '#7E5030'); c.restore();
      R(c, -340, -40, 680, 70, 0, 'rgba(0,0,0,.18)'); R(c, 210, 40, 110, 80, 18, '#5A3820'); O(c, 265, 80, 18, '#E9C46A'); });
    if (!full && op > .5) { const t2 = lt - 1, mx = Math.sin(t2 * 1.5) * 220, my = -80 - t2 * 150, f = Math.sin(lt * 30) * .8; c.save(); c.translate(mx, my); c.fillStyle = '#C9C1B0'; c.save(); c.scale(1, f); c.beginPath(); c.ellipse(-30, 0, 34, 20, -.4, 0, 7); c.ellipse(30, 0, 34, 20, .4, 0, 7); c.fill(); c.restore(); R(c, -6, -18, 12, 36, 6, '#8C8270'); c.restore(); for (let i = 0; i < 12; i++) { const ph = (t2 * .8 + i / 12) % 1; c.globalAlpha = (1 - ph) * .6; O(c, Math.sin(i * 7) * 200, -60 - ph * 300, 4, '#D8D0BE'); } c.globalAlpha = 1; }
    label(c, o, 360);
  });

  /* a laptop: code types itself, notifications pop in */
  reg('laptop', 'steel', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), notes = o.tx.slice(1).filter(Boolean);
    pop(c, 0, 40, k, () => { c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; R(c, -480, -330, 960, 600, 30, '#1B232E', '#3B4656', 6); c.restore(); R(c, -450, -300, 900, 540, 12, '#0B1420');
      c.beginPath(); c.moveTo(-560, 270); c.lineTo(560, 270); c.lineTo(620, 320); c.lineTo(-620, 320); c.closePath(); c.fillStyle = '#C5CAD6'; c.fill(); R(c, -90, 272, 180, 18, 8, '#9AA3B2');
      const cols = ['#58B6FF', '#FFD23F', '#7CFF8A', '#FF8A9A', '#B9A6FF'], typed = lt * 9; let y = -250;
      for (let i = 0; i < 9; i++) { const ind = (i % 3) * 40, w = 160 + ((i * 97) % 300), f = C.cl(typed - i * 1.3); if (f <= 0) break; R(c, -410 + ind, y, w * f * .35, 18, 6, cols[i % 5]); R(c, -410 + ind + w * .38, y, w * f * .55, 18, 6, 'rgba(220,230,255,.55)'); if (f < 1 && Math.sin(lt * 12) > 0) R(c, -410 + ind + w * f * .95, y - 4, 10, 26, 2, '#FFFFFF'); y += 50; } });
    const msgs = notes.length ? notes : ['নতুন অর্ডার এসেছে', '+ ৳ ৫,০০০']; msgs.slice(0, 2).forEach((m, i) => { const nk = bk(lt, 1 + i * .6, .4); pop(c, 330, -230 + i * 130, nk, () => { const w = Math.max(320, tw(c, m, 36, 700) + 110); c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 24; R(c, 330 - w / 2, -280 + i * 130, w, 100, 22, '#FFFFFF'); c.restore(); O(c, 330 - w / 2 + 50, -230 + i * 130, 26, '#22A06B'); TXT(c, '✓', 330 - w / 2 + 50, -218 + i * 130, 32, '#FFFFFF', 800, 'center'); TXT(c, m, 330 - w / 2 + 90, -218 + i * 130, 36, '#1A2233', 700, 'left', null, w - 110); }); });
    label(c, o, 380);
  });

  /* a sunny paddy field: rows of rice plants sway, the sun shines */
  reg('field', 'ember', (c, o) => {
    const lt = o.lt; sky(c, '#4FA3E0', '#CFE9F7'); rays(c, 520, -300, lt, '#FFF6D0', 14, 1100, .25); c.save(); c.shadowColor = '#FFE08A'; c.shadowBlur = 80; O(c, 520, -300, 90, '#FFE08A'); c.restore();
    for (let i = 0; i < 3; i++) { const x = -900 + ((lt * 30 + i * 800) % 2400); c.fillStyle = 'rgba(255,255,255,.9)'; [[0, 0, 60], [60, -20, 70], [130, 0, 55]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx, -320 + i * 40 + dy, r, 0, 7); c.fill(); }); }
    c.fillStyle = '#5E9B3E'; c.beginPath(); c.moveTo(-1400, 20); c.quadraticCurveTo(-500, -90, 200, 10); c.quadraticCurveTo(800, -60, 1400, 20); c.lineTo(1400, 700); c.lineTo(-1400, 700); c.closePath(); c.fill();
    R(c, -700, -60, 140, 90, 4, '#C9764A'); c.beginPath(); c.moveTo(-720, -60); c.lineTo(-630, -130); c.lineTo(-540, -60); c.closePath(); c.fillStyle = '#8A5A2B'; c.fill();
    for (let row = 0; row < 6; row++) { const y = 60 + row * 70, s = .6 + row * .2, col = row % 2 ? '#7FB63A' : '#8DC63F'; for (let x = -1400 + (row % 2) * 40; x < 1400; x += 80 * s) { const sway = Math.sin(lt * 2 + x * .01 + row) * 14 * s; c.strokeStyle = col; c.lineWidth = 6 * s; c.lineCap = 'round'; for (let b = -1; b <= 1; b++) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + b * 10 * s, y - 40 * s, x + b * 22 * s + sway, y - 80 * s); c.stroke(); } O(c, x + sway, y - 84 * s, 7 * s, '#E8C547'); } }
    label(c, o, 340);
  });

  /* a plane flying along a dashed arc between two pins */
  reg('plane', 'night', (c, o) => {
    const lt = o.lt, T = o.T, a = o.tx[1] || '', b = o.tx[2] || '', p = eio((lt - .3) / 2.2);
    stars(c, o.seed, lt, 50); c.save(); c.globalAlpha = .22; c.strokeStyle = '#58B6FF'; c.lineWidth = 3; O(c, 0, 900, 1000, null, '#58B6FF', 3); for (let i = -4; i <= 4; i++) { c.beginPath(); c.ellipse(0, 900, Math.abs(i) * 230, 1000, 0, 0, 7); c.stroke(); } c.restore();
    const P = s => { const x = -560 + s * 1120, y = 120 - Math.sin(s * Math.PI) * 360; return [x, y]; };
    c.setLineDash([20, 18]); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 6; c.beginPath(); for (let s = 0; s <= p; s += .01) { const q = P(s); if (s === 0) c.moveTo(q[0], q[1]); else c.lineTo(q[0], q[1]); } c.stroke(); c.setLineDash([]);
    [[0, a], [1, b]].forEach(([s, t], i) => { const q = P(s), kk = bk(lt, i ? 2.2 : .1, .4); pop(c, q[0], q[1], kk, () => { c.fillStyle = i ? T.acc : '#FF5468'; c.beginPath(); c.arc(q[0], q[1] - 50, 30, Math.PI, 0); c.lineTo(q[0], q[1]); c.closePath(); c.fill(); O(c, q[0], q[1] - 52, 11, '#fff'); if (t) chip(c, t, q[0], q[1] + 60, 40, 1, T); }); });
    const q = P(p * .86), q2 = P(Math.min(1, p * .86 + .01)), ang = Math.atan2(q2[1] - q[1], q2[0] - q[0]);
    c.save(); c.translate(q[0], q[1]); c.rotate(ang); c.scale(1.4, 1.4); c.fillStyle = '#FFFFFF'; R(c, -70, -14, 150, 28, 14, '#F2F5FA'); c.beginPath(); c.moveTo(-10, 0); c.lineTo(-40, -80); c.lineTo(-10, -80); c.lineTo(40, 0); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-10, 0); c.lineTo(-40, 80); c.lineTo(-10, 80); c.lineTo(40, 0); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-70, 0); c.lineTo(-90, -40); c.lineTo(-70, -40); c.lineTo(-50, 0); c.closePath(); c.fill(); for (let i = 0; i < 4; i++) O(c, 10 + i * 14, -4, 3.5, '#4C7BD9'); c.restore();
    label(c, o, 340);
  });

  /* a piggy bank: coins drop in one by one */
  reg('piggy', 'money', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), jig = Math.sin(lt * 14) * Math.max(0, Math.sin(lt * 3)) * 2;
    for (let i = 0; i < 5; i++) { const t0 = .5 + i * .45, ph = C.cl((lt - t0) / .4); if (ph <= 0 || ph >= 1) continue; const y = -420 + ph * 330; c.save(); c.translate(0, y); c.scale(1, .3 + .7 * Math.abs(Math.cos(lt * 9))); O(c, 0, 0, 48, '#F2B92A'); O(c, 0, 0, 36, '#FFD36B'); TXT(c, '৳', 0, 16, 44, '#A8761A', 800, 'center'); c.restore(); }
    pop(c, 0, 80, k, () => { c.save(); c.translate(0, jig); c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; c.beginPath(); c.ellipse(0, 80, 330, 230, 0, 0, 7); const g = c.createLinearGradient(0, -150, 0, 310); g.addColorStop(0, '#FFB3C7'); g.addColorStop(1, '#E06A8C'); c.fillStyle = g; c.fill(); c.restore();
      [-180, -60, 80, 200].forEach(x => R(c, x - 30, 250, 60, 90, 18, '#D9587C')); c.beginPath(); c.ellipse(320, 70, 70, 60, 0, 0, 7); c.fillStyle = '#F48FAA'; c.fill(); O(c, 300, 70, 12, '#A8405E'); O(c, 340, 70, 12, '#A8405E');
      c.fillStyle = '#E06A8C'; c.beginPath(); c.moveTo(150, -110); c.lineTo(200, -210); c.lineTo(240, -100); c.closePath(); c.fill(); O(c, 220, 0, 16, '#3A1A26'); R(c, -70, -150, 140, 20, 10, '#7A2A44'); c.globalAlpha = .35; c.beginPath(); c.ellipse(-120, -40, 90, 40, -.4, 0, 7); c.fillStyle = '#fff'; c.fill(); c.globalAlpha = 1; c.restore(); });
    label(c, o, 380);
  });

  /* two hands meet in a handshake, a burst of light */
  reg('handshake', 'steel', (c, o) => {
    const lt = o.lt, m = eo(lt / .7), sh = lt > .8 ? Math.sin(lt * 9) * 14 * Math.max(0, 1.6 - lt) : 0;
    if (lt > .7) { rays(c, 0, -20, lt, '#FFE9A8', 14, 900, .2); sparkles(c, lt, o.seed, 14, 300, 200, '#FFF2B8', 0, -40); }
    c.save(); c.translate(0, sh);
    c.save(); c.translate(-(1 - m) * 700, 0); R(c, -1000, -60, 820, 180, 60, '#2F6BFF'); R(c, -230, -70, 70, 200, 20, '#FFFFFF'); c.beginPath(); c.ellipse(-60, 20, 150, 95, 0, 0, 7); c.fillStyle = '#C98B5C'; c.fill(); c.restore();
    c.save(); c.translate((1 - m) * 700, 0); R(c, 180, -80, 820, 180, 60, '#3A3F4B'); R(c, 160, -90, 70, 200, 20, '#FFFFFF'); c.beginPath(); c.ellipse(60, 0, 150, 95, 0, 0, 7); c.fillStyle = '#8D5A3B'; c.fill(); for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(-40 + i * 8, -50 + i * 38, 70, 20, -.2, 0, 7); c.fillStyle = '#8D5A3B'; c.fill(); L(c, -100 + i * 8, -50 + i * 38, 10 + i * 8, -50 + i * 38, 'rgba(0,0,0,.18)', 3); } c.restore();
    c.restore(); label(c, o, 330);
  });

  /* a door swings open and light floods the floor */
  reg('door', 'night', (c, o) => {
    const lt = o.lt, op = eio((lt - .4) / .8);
    R(c, -1400, -700, 2800, 1400, 0, '#141824'); c.fillStyle = '#0B0E16'; c.fillRect(-1400, 330, 2800, 400);
    if (op > 0) { c.save(); c.globalAlpha = op; const g = c.createLinearGradient(0, 330, 0, 700); g.addColorStop(0, 'rgba(255,226,160,.6)'); g.addColorStop(1, 'rgba(255,226,160,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(-200, 330); c.lineTo(200, 330); c.lineTo(600, 700); c.lineTo(-600, 700); c.closePath(); c.fill(); c.restore(); }
    R(c, -230, -360, 460, 700, 6, '#3A2A1E'); c.save(); c.globalAlpha = Math.max(.15, op); R(c, -200, -330, 400, 660, 4, '#FFE2A0'); c.restore(); if (op > .2) { c.save(); c.globalAlpha = op; c.shadowColor = '#FFE2A0'; c.shadowBlur = 120; R(c, -200, -330, 400, 660, 4, '#FFF1CC'); c.restore(); }
    const w = 400 * Math.cos(op * 1.35); c.beginPath(); c.moveTo(-200, -330); c.lineTo(-200 + w, -330 - op * 40); c.lineTo(-200 + w, 330 + op * 40); c.lineTo(-200, 330); c.closePath(); c.fillStyle = '#6B4226'; c.fill(); if (w > 60) { R(c, -200 + w * .15, -280, w * .7, 220, 6, 'rgba(0,0,0,.18)'); R(c, -200 + w * .15, 20, w * .7, 260, 6, 'rgba(0,0,0,.18)'); O(c, -200 + w * .85, 10, 14, '#E9C46A'); }
    label(c, o, 380);
  });

  /* a mosque at night: domes, minarets, crescent, swaying lanterns */
  reg('mosque', 'night', (c, o) => {
    const lt = o.lt; sky(c, '#06122A', '#1D3A5A'); stars(c, o.seed, lt, 70); c.save(); c.shadowColor = '#FFF1C4'; c.shadowBlur = 60; O(c, 520, -290, 70, '#FFF1C4'); c.restore(); O(c, 548, -306, 64, '#0A1A36');
    const k = bk(lt, .05, .6), G = '#E9C46A';
    pop(c, 0, 200, k, () => { const g = c.createLinearGradient(0, -300, 0, 330); g.addColorStop(0, '#2A3E60'); g.addColorStop(1, '#0E1A30'); c.fillStyle = g;
      c.beginPath(); c.moveTo(-200, 0); c.quadraticCurveTo(-200, -260, 0, -300); c.quadraticCurveTo(200, -260, 200, 0); c.closePath(); c.fill(); L(c, 0, -300, 0, -360, G, 6); c.fillStyle = G; c.beginPath(); c.arc(0, -385, 20, .6, Math.PI * 2 - .6); c.arc(8, -385, 15, Math.PI * 2 - .6, .6, true); c.fill(); c.fillStyle = g;
      [-330, 330].forEach(x => { c.beginPath(); c.moveTo(x - 90, 60); c.quadraticCurveTo(x - 90, -110, x, -130); c.quadraticCurveTo(x + 90, -110, x + 90, 60); c.closePath(); c.fill(); });
      [-560, 560].forEach(x => { R(c, x - 32, -360, 64, 690, 10, '#1F3352'); c.beginPath(); c.moveTo(x - 40, -360); c.lineTo(x, -450); c.lineTo(x + 40, -360); c.closePath(); c.fill(); R(c, x - 46, -230, 92, 20, 6, G); R(c, x - 46, -60, 92, 20, 6, G); });
      R(c, -480, 0, 960, 330, 0, '#16263F'); for (let i = 0; i < 7; i++) { const x = -390 + i * 130; c.beginPath(); c.moveTo(x - 36, 260); c.lineTo(x - 36, 120); c.quadraticCurveTo(x, 70, x + 36, 120); c.lineTo(x + 36, 260); c.closePath(); c.fillStyle = 'rgba(255,214,120,' + (.55 + .3 * Math.sin(lt * 2 + i)) + ')'; c.fill(); } });
    [-800, 800].forEach((x, i) => { const sw = Math.sin(lt * 1.6 + i) * .12; c.save(); c.translate(x, -500); c.rotate(sw); L(c, 0, 0, 0, 220, '#C9A45A', 3); c.save(); c.shadowColor = '#FFC857'; c.shadowBlur = 50; R(c, -40, 220, 80, 110, 18, '#FFC857'); c.restore(); R(c, -46, 210, 92, 20, 8, '#8A5A12'); R(c, -46, 322, 92, 20, 8, '#8A5A12'); c.restore(); });
    label(c, o, 360);
  });

  /* flames flicker, embers rise, smoke drifts */
  reg('fire', 'alert', (c, o) => {
    const lt = o.lt, k = eo(lt / .6);
    for (let i = 0; i < 6; i++) { const ph = (lt * .25 + i / 6) % 1; c.globalAlpha = .3 * (1 - ph); O(c, Math.sin(i * 3 + ph * 4) * 200, -200 - ph * 400, 80 + ph * 140, '#2A2A30'); } c.globalAlpha = 1;
    const g0 = c.createRadialGradient(0, 200, 10, 0, 200, 800); g0.addColorStop(0, 'rgba(255,120,40,.5)'); g0.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g0; c.fillRect(-1400, -700, 2800, 1400);
    const flame = (x, h, w, col, ph) => { const f1 = Math.sin(lt * 9 + ph) * 18, f2 = Math.sin(lt * 13 + ph * 2) * 14; c.beginPath(); c.moveTo(x - w, 260); c.quadraticCurveTo(x - w * 1.1, 260 - h * .5 + f2, x - w * .2 + f1, 260 - h * k); c.quadraticCurveTo(x + w * .2, 260 - h * .6, x + w * .5 + f2, 260 - h * .75 * k); c.quadraticCurveTo(x + w * 1.1, 260 - h * .4, x + w, 260); c.closePath(); c.fillStyle = col; c.fill(); };
    c.save(); c.shadowColor = '#FF6A1A'; c.shadowBlur = 80; [[-250, 380, 160, 2], [250, 420, 170, 4], [0, 560, 230, 0]].forEach(([x, h, w, p]) => flame(x, h, w, '#E8361C', p)); c.restore();
    [[-250, 280, 110, 1], [250, 300, 120, 3], [0, 420, 160, 5]].forEach(([x, h, w, p]) => flame(x, h, w, '#FF8A1A', p)); [[0, 260, 100, 6], [-240, 160, 60, 7], [250, 180, 70, 8]].forEach(([x, h, w, p]) => flame(x, h, w, '#FFD23F', p));
    R(c, -420, 250, 840, 50, 25, '#3A2216'); c.save(); c.translate(0, 270); c.rotate(.12); R(c, -380, -22, 760, 44, 22, '#4A2A18'); c.restore();
    const r = rng(o.seed); for (let i = 0; i < 30; i++) { const ph = (lt * (.5 + r()) + r()) % 1, x = (r() - .5) * 700 + Math.sin(lt * 3 + i) * 30, y = 200 - ph * 700; c.globalAlpha = 1 - ph; O(c, x, y, 3 + r() * 5, r() > .5 ? '#FFD23F' : '#FF8A1A'); } c.globalAlpha = 1;
    label(c, o, 370);
  });

  /* police lights, prison bars slide down, handcuffs swing */
  reg('jail', 'alert', (c, o) => {
    const lt = o.lt, flip = Math.floor(lt * 4) % 2, d = eo((lt - .2) / .6);
    const gl = (x, col, on) => { const g = c.createRadialGradient(x, -520, 10, x, -520, 900); g.addColorStop(0, col + (on ? '88' : '22')); g.addColorStop(1, col + '00'); c.fillStyle = g; c.fillRect(-1400, -700, 2800, 1400); };
    gl(-700, '#FF2D3D', flip); gl(700, '#2D6BFF', !flip);
    c.fillStyle = '#10141C'; c.beginPath(); c.arc(0, 40, 130, 0, 7); c.fill(); c.beginPath(); c.moveTo(-260, 420); c.quadraticCurveTo(-250, 170, 0, 170); c.quadraticCurveTo(250, 170, 260, 420); c.closePath(); c.fill();
    c.save(); c.translate(0, -(1 - d) * 900); R(c, -700, -380, 1400, 50, 8, '#5A6270'); R(c, -700, 330, 1400, 50, 8, '#5A6270'); for (let i = 0; i < 11; i++) { const x = -640 + i * 128, g = c.createLinearGradient(x - 18, 0, x + 18, 0); g.addColorStop(0, '#6C7484'); g.addColorStop(.5, '#C5CAD6'); g.addColorStop(1, '#5A6270'); c.fillStyle = g; c.fillRect(x - 18, -340, 36, 690); } c.restore();
    const hk = bk(lt, 1, .5), sw = Math.sin(lt * 3) * .25; pop(c, 450, 130, hk, () => { c.save(); c.translate(450, -40); c.rotate(sw); L(c, 0, 0, 0, 120, '#C5CAD6', 8); c.lineWidth = 20; c.strokeStyle = '#D5DAE4'; c.beginPath(); c.arc(-60, 180, 60, 0, 7); c.stroke(); c.beginPath(); c.arc(70, 190, 60, 0, 7); c.stroke(); for (let i = 0; i < 3; i++) O(c, -5 + i * 10, 120 + i * 10, 9, '#AEB5C3'); c.restore(); });
    label(c, o, 390);
  });

  /* two dice tumble and land, playing cards fan out behind */
  reg('dice', 'plum', (c, o) => {
    const lt = o.lt, T = o.T;
    [-2, -1, 0, 1, 2].forEach((i, n) => { const kk = bk(lt, .1 + n * .1, .4); pop(c, 0, 200, kk, () => { c.save(); c.translate(0, 220); c.rotate(i * .22); c.translate(0, -320); c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 20; R(c, -120, -170, 240, 340, 18, '#FBFAF5'); c.restore(); TXT(c, ['A', 'K', 'Q', 'J', '7'][n], -82, -110, 54, n % 2 ? '#1A2233' : '#E5484D', 800, 'center'); TXT(c, n % 2 ? '♠' : '♥', 0, 50, 120, n % 2 ? '#1A2233' : '#E5484D', 700, 'center'); c.restore(); }); });
    const die = (x, face, seed) => { const land = C.cl((lt - .3) / 1), ang = (1 - eo(land)) * (6 + seed), y = 250 - Math.abs(Math.sin(land * Math.PI * 2.5)) * (1 - land) * 380; c.save(); c.translate(x - (1 - land) * 300 * (seed ? -1 : 1), y); c.rotate(ang); c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 24; R(c, -90, -90, 180, 180, 30, '#E5484D'); c.restore(); R(c, -80, -80, 160, 40, 20, 'rgba(255,255,255,.18)');
      const P = { 1: [[0, 0]], 2: [[-40, -40], [40, 40]], 3: [[-40, -40], [0, 0], [40, 40]], 4: [[-40, -40], [40, -40], [-40, 40], [40, 40]], 5: [[-40, -40], [40, -40], [0, 0], [-40, 40], [40, 40]], 6: [[-40, -45], [40, -45], [-40, 0], [40, 0], [-40, 45], [40, 45]] }[land < 1 ? 1 + Math.floor(lt * 12 + seed) % 6 : face]; P.forEach(([px, py]) => O(c, px, py, 16, '#FFFFFF')); c.restore(); };
    die(-170, 6, 0); die(170, 5, 1);
    label(c, o, 380);
  });

  /* a TV with a "breaking news" banner and a ticker that scrolls the line */
  reg('tv', 'steel', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), head = o.tx[1] || o.tx[0] || 'ব্রেকিং নিউজ';
    pop(c, 0, 0, k, () => { L(c, -60, -360, -180, -470, '#9AA3B2', 8); L(c, 60, -360, 180, -470, '#9AA3B2', 8); c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; R(c, -560, -360, 1120, 680, 40, '#1B232E', '#3B4656', 8); c.restore();
      c.save(); c.beginPath(); c.roundRect(-520, -320, 1040, 560, 20); c.clip(); const g = c.createLinearGradient(0, -320, 0, 240); g.addColorStop(0, '#1C3A6A'); g.addColorStop(1, '#0B1A33'); c.fillStyle = g; c.fillRect(-520, -320, 1040, 560);
        for (let i = 0; i < 6; i++) R(c, -500 + i * 180, -300, 150, 200, 6, 'rgba(88,182,255,' + (.08 + .06 * Math.sin(lt * 2 + i)) + ')');
        person(c, 260, -10, 3.4, '#C98B5C', '#2A3550'); R(c, -500, 20, 1000, 92, 0, '#E5484D'); TXT(c, 'ব্রেকিং নিউজ', -480, 82, 50, '#FFFFFF', 800, 'left'); R(c, -500, 112, 1000, 80, 0, '#FFFFFF');
        c.save(); c.beginPath(); c.rect(-500, 112, 1000, 80); c.clip(); const w = tw(c, head, 46, 800) + 200, x = 500 - ((lt * 260) % (w + 1000)); TXT(c, head + '   •   ' + head, x, 168, 46, '#1A2233', 800, 'left'); c.restore();
        R(c, 360, -300, 140, 56, 10, '#E5484D'); O(c, 385, -272, 9 * (.6 + .4 * Math.abs(Math.sin(lt * 4))), '#FFFFFF'); TXT(c, 'লাইভ', 445, -256, 32, '#FFFFFF', 800, 'center');
        c.globalAlpha = .06; for (let y = -320; y < 240; y += 6) c.fillRect(-520, y, 1040, 2); c.restore();
      R(c, -200, 320, 400, 30, 10, '#3B4656'); });
  });

  /* a target board: an arrow flies in and hits the bullseye */
  reg('target', 'alert', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), hit = C.cl((lt - .6) / .35), sh = hit >= 1 ? Math.sin((lt - .95) * 50) * Math.max(0, .4 - (lt - .95)) * 30 : 0;
    pop(c, 0, 0, k, () => { c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; O(c, 0, -20, 320, '#FFFFFF'); c.restore(); [[320, '#FFFFFF'], [265, '#E5484D'], [205, '#FFFFFF'], [145, '#E5484D'], [85, '#FFFFFF'], [40, '#E5484D']].forEach(([r, col]) => O(c, 0, -20, r, col)); });
    if (hit > 0) { const x = -1200 + 1200 * eo(hit) + sh * .2; c.save(); c.translate(x, -20 + sh * .3); c.rotate(-.03); L(c, -420, 0, 0, 0, '#8A5A2B', 14); c.fillStyle = '#C5CAD6'; c.beginPath(); c.moveTo(20, 0); c.lineTo(-30, -24); c.lineTo(-30, 24); c.closePath(); c.fill(); c.fillStyle = '#FFD23F'; c.beginPath(); c.moveTo(-400, 0); c.lineTo(-460, -50); c.lineTo(-420, 0); c.lineTo(-460, 50); c.closePath(); c.fill(); c.restore(); if (hit >= 1) sparkles(c, lt, o.seed, 10, 120, 120, '#FFF2B8', 0, -20); }
    label(c, o, 370);
  });

  /* a rocket blasts off: flame, smoke, stars streak past */
  reg('rocket', 'night', (c, o) => {
    const lt = o.lt, y = 160 - eio(lt / 2.2) * 260 - Math.max(0, lt - 2.2) * 80, fl = .8 + .2 * Math.sin(lt * 40);
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 3; const r = rng(o.seed); for (let i = 0; i < 40; i++) { const x = r() * 2600 - 1300, yy = ((r() * 1400 + lt * 900) % 1400) - 700; L(c, x, yy, x, yy - 40 - r() * 60, 'rgba(255,255,255,.35)', 3); }
    for (let i = 0; i < 10; i++) { const ph = (lt * .6 + i / 10) % 1; c.globalAlpha = .35 * (1 - ph); O(c, Math.sin(i * 5) * (80 + ph * 300), y + 300 + ph * 260, 60 + ph * 120, '#C9CED8'); } c.globalAlpha = 1;
    c.save(); c.translate(0, y); c.save(); c.shadowColor = '#FF8A1A'; c.shadowBlur = 60; c.fillStyle = '#FF8A1A'; c.beginPath(); c.moveTo(-60, 200); c.quadraticCurveTo(0, 200 + 260 * fl, 60, 200); c.closePath(); c.fill(); c.fillStyle = '#FFE08A'; c.beginPath(); c.moveTo(-34, 200); c.quadraticCurveTo(0, 200 + 150 * fl, 34, 200); c.closePath(); c.fill(); c.restore();
      c.fillStyle = '#E5484D'; c.beginPath(); c.moveTo(-90, 120); c.lineTo(-170, 230); c.lineTo(-90, 200); c.closePath(); c.fill(); c.beginPath(); c.moveTo(90, 120); c.lineTo(170, 230); c.lineTo(90, 200); c.closePath(); c.fill();
      const g = c.createLinearGradient(-90, 0, 90, 0); g.addColorStop(0, '#C5CAD6'); g.addColorStop(.5, '#FFFFFF'); g.addColorStop(1, '#AEB5C3'); c.fillStyle = g; c.beginPath(); c.moveTo(-90, 210); c.lineTo(-90, -80); c.quadraticCurveTo(-80, -260, 0, -330); c.quadraticCurveTo(80, -260, 90, -80); c.lineTo(90, 210); c.closePath(); c.fill();
      c.fillStyle = '#E5484D'; c.beginPath(); c.moveTo(-60, -200); c.quadraticCurveTo(0, -330, 60, -200); c.quadraticCurveTo(0, -230, -60, -200); c.fill(); O(c, 0, -40, 50, '#2A3550'); O(c, 0, -40, 38, '#58B6FF'); O(c, -12, -52, 10, 'rgba(255,255,255,.7)'); c.restore();
    label(c, o, 380);
  });

  /* stairs going up: a small figure climbs step by step to a flag */
  reg('stairs', 'ember', (c, o) => {
    const lt = o.lt, T = o.T, n = 5, sw = 220, sh = 120, x0 = -550, y0 = 330, steps = o.tx.slice(1).filter(Boolean);
    for (let i = 0; i < n; i++) { const kk = bk(lt, .05 + i * .1, .4); pop(c, x0 + i * sw + sw / 2, y0 - (i + 1) * sh, kk, () => { const g = c.createLinearGradient(0, y0 - (i + 1) * sh, 0, y0); g.addColorStop(0, '#F2C14E'); g.addColorStop(1, '#B07510'); R(c, x0 + i * sw, y0 - (i + 1) * sh, sw - 8, (i + 1) * sh, 8, g); R(c, x0 + i * sw, y0 - (i + 1) * sh, sw - 8, 18, 6, 'rgba(255,255,255,.35)'); if (steps[i]) TXT(c, steps[i], x0 + i * sw + sw / 2 - 4, y0 - (i + 1) * sh + 70, 34, '#3A2410', 800, 'center', null, sw - 30); }); }
    const fx = x0 + n * sw - 60; L(c, fx, y0 - n * sh, fx, y0 - n * sh - 200, '#DDD', 8); c.fillStyle = '#E5484D'; c.beginPath(); c.moveTo(fx, y0 - n * sh - 200); c.quadraticCurveTo(fx + 70, y0 - n * sh - 200 + Math.sin(lt * 6) * 14, fx + 140, y0 - n * sh - 180); c.lineTo(fx, y0 - n * sh - 130); c.closePath(); c.fill();
    const p = C.cl((lt - .6) / 2.2) * (n - 1), i = Math.floor(p), f = p - i, hop = Math.sin(f * Math.PI) * 70, px = x0 + sw / 2 + p * sw, py = y0 - (i + 1) * sh - (f > .5 ? sh * (f - .5) * 2 : 0) - hop;
    person(c, px, py - 34 * 2.2, 2.2, '#C98B5C', '#2F6BFF');
    if (p >= n - 1) sparkles(c, lt, o.seed, 10, 200, 120, '#FFF2B8', px, py - 150);
    label(c, o, 400);
  });

  /* an hourglass: sand runs from the top to the bottom */
  reg('hourglass', 'plum', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), p = C.cl(lt / Math.max(2.5, o.dur * .9));
    pop(c, 0, 0, k, () => { R(c, -260, -380, 520, 50, 14, '#8A5A2B'); R(c, -260, 330, 520, 50, 14, '#8A5A2B'); L(c, -230, -330, -230, 330, '#6B4226', 14); L(c, 230, -330, 230, 330, '#6B4226', 14);
      const glass = () => { c.beginPath(); c.moveTo(-190, -330); c.quadraticCurveTo(-190, -100, -24, 0); c.quadraticCurveTo(-190, 100, -190, 330); c.lineTo(190, 330); c.quadraticCurveTo(190, 100, 24, 0); c.quadraticCurveTo(190, -100, 190, -330); c.closePath(); };
      glass(); c.fillStyle = 'rgba(200,220,255,.12)'; c.fill(); c.save(); glass(); c.clip(); const sand = '#F2C14E';
      const top = (1 - p) * 290; c.fillStyle = sand; c.beginPath(); c.moveTo(-200, -10 - top); c.quadraticCurveTo(0, -10 - top + 30, 200, -10 - top); c.lineTo(200, 0); c.lineTo(-200, 0); c.closePath(); c.fill();
      const bh = p * 280; c.beginPath(); c.moveTo(-200, 330); c.lineTo(-200, 330 - bh * .6); c.quadraticCurveTo(0, 330 - bh * 1.3, 200, 330 - bh * .6); c.lineTo(200, 330); c.closePath(); c.fill();
      if (p < 1) R(c, -5, 0, 10, 330 - bh, 4, sand); c.restore(); glass(); c.strokeStyle = 'rgba(220,235,255,.6)'; c.lineWidth = 6; c.stroke(); c.globalAlpha = .3; R(c, -150, -300, 26, 200, 13, '#fff'); c.globalAlpha = 1; });
    label(c, o, 340);
  });

  /* a turning globe with glowing pings */
  reg('globe', 'night', (c, o) => {
    const lt = o.lt, T = o.T, k = bk(lt, .05, .55), R0 = 320;
    pop(c, 0, -20, k, () => { c.save(); c.shadowColor = T.glow; c.shadowBlur = 80; O(c, 0, -20, R0, '#0E3A6A'); c.restore(); const g = c.createRadialGradient(-120, -140, 20, 0, -20, R0); g.addColorStop(0, '#2F8BD8'); g.addColorStop(1, '#0B2A52'); O(c, 0, -20, R0, g);
      c.save(); c.beginPath(); c.arc(0, -20, R0, 0, 7); c.clip(); const rot = lt * .35, land = [[.2, -.4, .5, .25], [1.2, .1, .4, .35], [2.4, -.2, .55, .3], [3.6, .3, .35, .25], [4.6, -.5, .3, .18], [5.4, .15, .45, .3]];
      land.forEach(([lon, lat, w, h]) => { const a = lon + rot, x = Math.sin(a) * R0 * Math.cos(lat), vis = Math.cos(a); if (vis < -.1) return; c.fillStyle = '#3FA37C'; c.beginPath(); c.ellipse(x, -20 + lat * R0 * .9, w * R0 * Math.max(.15, vis) * .7, h * R0, 0, 0, 7); c.fill(); });
      c.strokeStyle = 'rgba(160,210,255,.35)'; c.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 6; c.beginPath(); c.ellipse(0, -20, Math.abs(Math.cos(a)) * R0, R0, 0, 0, 7); c.stroke(); } for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(0, -20 + i * 110, Math.sqrt(R0 * R0 - (i * 110) ** 2), 26, 0, 0, 7); c.stroke(); }
      c.restore(); [[-150, -120], [120, 40], [60, -200], [-60, 140]].forEach(([x, y], i) => { const ph = (lt * .8 + i * .3) % 1; c.globalAlpha = 1 - ph; O(c, x, y, 10 + ph * 50, null, T.acc, 4); c.globalAlpha = 1; O(c, x, y, 9, T.acc); }); });
    label(c, o, 350);
  });

  /* a family: parents and children under one roof, a heart above */
  reg('family', 'ember', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .55);
    c.save(); c.globalAlpha = .7; c.strokeStyle = '#FFD7A0'; c.lineWidth = 16; c.lineJoin = 'round'; const rp = eo(lt / .8); c.beginPath(); c.moveTo(-560, 40); c.lineTo(-560 + 560 * rp, 40 - 320 * rp); if (rp >= 1) c.lineTo(560, 40); c.stroke(); c.restore();
    [[-250, 3.4, 0], [-80, 3.6, 1], [110, 2.4, 2], [260, 2.1, 3]].forEach(([x, s, i]) => { const kk = bk(lt, .2 + i * .15, .45); pop(c, x, 300, kk, () => person(c, x, 300 - 34 * s, s, SKIN[(o.seed + i) % 5], SHIRT[(o.seed + i * 2) % 6])); });
    const hk = bk(lt, 1.1, .5), beat = 1 + .08 * Math.pow(Math.max(0, Math.sin(lt * 6)), 8); pop(c, 0, -260, hk, () => { c.save(); c.translate(0, -230); c.scale(beat, beat); c.shadowColor = '#FF3B5C'; c.shadowBlur = 40; heartPath(c, 0, 0, 80); c.fillStyle = '#FF5468'; c.fill(); c.restore(); });
    label(c, o, 370);
  });

  /* gold bars and jewellery with a shine sweep */
  reg('gold', 'ember', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .55); rays(c, 0, 0, lt, '#FFD36B', 16, 1300, .15);
    const bar = (x, y) => { const g = c.createLinearGradient(x - 160, y - 60, x + 160, y + 60); g.addColorStop(0, '#B07510'); g.addColorStop(.5, '#FFE08A'); g.addColorStop(1, '#C48715'); c.beginPath(); c.moveTo(x - 160, y + 60); c.lineTo(x - 120, y - 60); c.lineTo(x + 120, y - 60); c.lineTo(x + 160, y + 60); c.closePath(); c.fillStyle = g; c.fill(); c.beginPath(); c.moveTo(x - 120, y - 60); c.lineTo(x + 120, y - 60); c.lineTo(x + 100, y - 40); c.lineTo(x - 100, y - 40); c.closePath(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(); };
    [[-170, 220], [170, 220], [0, 220], [-85, 100], [85, 100], [0, -20]].forEach(([x, y], i) => { const kk = bk(lt, .05 + i * .12, .4); pop(c, x, y, kk, () => bar(x, y)); });
    sparkles(c, lt, o.seed, 14, 400, 220, '#FFF6D0', 0, 80);
    label(c, o, 370);
  });

  /* ================= round 3: specific things (health, paper, home) + Islamic-only + general-story-only =================
     every kind is drawn around (0,0) in the 1600×800 space; works full-screen, as an inset beside a speaker and in thumbnails */
  const drop = (c, x, y, s, col) => { c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x + s * .8, y + s * .2, x, y + s * .7); c.quadraticCurveTo(x - s * .8, y + s * .2, x, y - s); c.fillStyle = col; c.fill(); };
  const scribble = (c, x, y, w, rows, gap, col, f, lw) => { c.strokeStyle = col; c.lineWidth = lw || 4; c.lineCap = 'round'; for (let i = 0; i < rows; i++) { const ff = C.cl(f * rows - i); if (ff <= 0) break; const len = (w - (i % 3) * w * .12) * ff; c.beginPath(); for (let s = 0; s <= 30; s++) { const xx = x + s / 30 * len, yy = y + i * gap + Math.sin(s * 1.6 + i * 2) * 4; if (s === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.stroke(); } };

  /* fever: a thermometer whose red line climbs, heat waves, a wet cloth and sweat drops */
  reg('fever', 'alert', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), lv = eo((lt - .3) / 1.6), deg = 98 + Math.round(lv * 6);
    for (let i = 0; i < 4; i++) { c.save(); c.globalAlpha = .18 + .08 * Math.sin(lt * 3 + i); c.strokeStyle = '#FF8A5C'; c.lineWidth = 10; c.beginPath(); for (let y = -320; y <= 260; y += 10) { const x = -480 + i * 60 + Math.sin(y * .03 + lt * 4 + i) * 16; if (y === -320) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke(); c.restore(); }
    pop(c, 120, 0, k, () => { c.save(); c.translate(120, 0); c.rotate(-.18); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; R(c, -70, -330, 140, 560, 70, '#F4F7FA'); c.restore(); c.save(); c.translate(120, 0); c.rotate(-.18);
      R(c, -24, -290, 48, 480, 24, '#E3E9EF'); const top = 190 - lv * 420; R(c, -16, top, 32, 190 - top + 10, 16, '#E5484D'); O(c, 0, 230, 62, '#E5484D', '#F4F7FA', 12);
      for (let i = 0; i < 9; i++) L(c, 30, 160 - i * 48, i % 2 ? 50 : 62, 160 - i * 48, '#8A96A3', 4);
      c.restore(); });
    big(c, toBn(deg) + '°', 520, -80, 150, o.T, bk(lt, .6, .4), lv > .7 ? '#FF5468' : '#FFC857');
    for (let i = 0; i < 5; i++) { const ph = (lt * .7 + i * .21) % 1; c.globalAlpha = Math.sin(ph * Math.PI) * .9; drop(c, -300 + i * 50, -200 + ph * 300, 18, '#9FD8FF'); } c.globalAlpha = 1;
    label(c, o, 340);
  });

  /* medicine: a blister strip pops its pills, a syrup bottle and a spoon */
  reg('medicine', 'steel', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), v = String(o.tx[1] || '');
    pop(c, -250, 0, k, () => { c.save(); c.translate(-250, 0); c.rotate(-.12); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; R(c, -330, -200, 660, 400, 30, '#C9D3DD'); c.restore(); c.save(); c.translate(-250, 0); c.rotate(-.12); R(c, -310, -180, 620, 360, 24, null, 'rgba(255,255,255,.55)', 4);
      for (let r = 0; r < 2; r++) for (let q = 0; q < 4; q++) { const i = r * 4 + q, gone = lt > 1 + i * .18 && i < 3; const x = -225 + q * 150, y = -80 + r * 160; O(c, x, y, 52, gone ? 'rgba(80,95,110,.35)' : 'rgba(255,255,255,.65)'); if (!gone) { c.save(); c.translate(x, y); c.rotate(.6); R(c, -46, -22, 92, 44, 22, '#F7F7F7'); c.beginPath(); c.rect(-46, -22, 46, 44); c.clip(); R(c, -46, -22, 92, 44, 22, v === 'red' ? '#E5484D' : '#4C7BD9'); c.restore(); } }
      c.restore(); });
    pop(c, 400, 40, bk(lt, .4, .45), () => { c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 30; R(c, 300, -180, 200, 380, 30, '#8B4A1C'); c.restore(); R(c, 335, -250, 130, 80, 12, '#F2F2F2'); R(c, 315, -60, 170, 170, 12, '#FFF8E8'); TXT(c, 'সিরাপ', 400, 20, 40, '#8B4A1C', 800, 'center'); L(c, 335, 70, 465, 70, '#E5484D', 6); });
    const sp = bk(lt, .9, .4); pop(c, 380, 300, sp, () => { c.save(); c.translate(380, 300); c.rotate(-.2); R(c, -170, -10, 230, 20, 10, '#C6CED6'); c.beginPath(); c.ellipse(90, 0, 60, 34, 0, 0, 7); c.fillStyle = '#C6CED6'; c.fill(); c.beginPath(); c.ellipse(90, 0, 46, 24, 0, 0, 7); c.fillStyle = '#B5652A'; c.fill(); c.restore(); });
    label(c, o, 360);
  });

  /* doctor: a stethoscope + a prescription pad that writes "Rx" lines */
  reg('doctor', 'steel', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5);
    pop(c, -180, 0, k, () => { c.save(); c.translate(-180, 0); c.rotate(-.05); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; R(c, -300, -340, 600, 680, 18, '#FFFFFF'); c.restore(); c.save(); c.translate(-180, 0); c.rotate(-.05);
      R(c, -300, -340, 600, 110, 18, '#2B7BB9'); R(c, -300, -260, 600, 30, 0, '#2B7BB9'); TXT(c, 'ডা. প্রেসক্রিপশন', 0, -275, 44, '#FFFFFF', 800, 'center');
      TXT(c, 'Rx', -220, -150, 80, '#1A2233', 800, 'left', 'TFDisp'); scribble(c, -230, -60, 440, 6, 58, '#1F3A8A', C.cl((lt - .4) / 1.6), 5);
      c.restore(); });
    const s2 = bk(lt, .5, .5); pop(c, 380, 0, s2, () => { c.save(); c.translate(380, 0); c.lineWidth = 16; c.strokeStyle = '#3A4656'; c.lineCap = 'round'; c.beginPath(); c.moveTo(-90, -260); c.quadraticCurveTo(-120, -40, 0, 40); c.quadraticCurveTo(120, -40, 90, -260); c.stroke(); c.beginPath(); c.moveTo(0, 40); c.bezierCurveTo(0, 180, 160, 200, 170, 90); c.stroke(); O(c, -90, -270, 18, '#BFC7D0'); O(c, 90, -270, 18, '#BFC7D0'); O(c, 170, 70, 62, '#C9D1DA', '#8995A3', 8); O(c, 170, 70, 36, '#E6EBF0'); c.restore(); });
    label(c, o, 360);
  });

  /* saline: a drip bag on a stand, drops falling into the tube, a hospital bed edge */
  reg('saline', 'steel', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5);
    pop(c, 0, 0, k, () => { L(c, 0, -380, 0, 330, '#9AA6B4', 12); L(c, -90, 330, 90, 330, '#9AA6B4', 12); L(c, -120, -380, 120, -380, '#9AA6B4', 10);
      c.save(); c.shadowColor = 'rgba(160,210,255,.6)'; c.shadowBlur = 30; c.beginPath(); c.moveTo(-90, -360); c.lineTo(90, -360); c.quadraticCurveTo(120, -200, 70, -90); c.lineTo(-70, -90); c.quadraticCurveTo(-120, -200, -90, -360); c.closePath(); c.fillStyle = 'rgba(210,235,255,.85)'; c.fill(); c.restore();
      const lvl = .75 - .1 * C.cl(lt / 6); c.save(); c.beginPath(); c.moveTo(-90, -360); c.lineTo(90, -360); c.quadraticCurveTo(120, -200, 70, -90); c.lineTo(-70, -90); c.quadraticCurveTo(-120, -200, -90, -360); c.clip(); c.fillStyle = 'rgba(120,190,255,.55)'; c.fillRect(-130, -360 + (1 - lvl) * 270, 260, 300); c.restore();
      TXT(c, 'NaCl', 0, -230, 40, '#2B5C8A', 800, 'center', 'TFDisp'); R(c, -14, -90, 28, 90, 8, 'rgba(210,235,255,.9)', '#9AA6B4', 3);
      const ph = (lt * 1.6) % 1; drop(c, 0, -60 + ph * 50, 8, '#7FC4FF');
      c.strokeStyle = 'rgba(200,225,250,.8)'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(0, 180, 300, 120, 420, 240); c.stroke(); });
    pop(c, 520, 260, bk(lt, .4, .5), () => { R(c, 260, 220, 520, 70, 16, '#E8EEF3'); R(c, 260, 290, 520, 30, 8, '#9AA6B4'); R(c, 600, 150, 160, 80, 30, '#FFFFFF'); });
    label(c, o, 360);
  });

  /* injection: a syringe pushes, a vial and a small plaster */
  reg('injection', 'steel', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), push = eio((lt - .6) / 1.2);
    pop(c, 0, 0, k, () => { c.save(); c.rotate(-.35); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 30; R(c, -330, -60, 520, 120, 20, 'rgba(235,245,255,.92)', '#9AA6B4', 5); c.restore(); c.save(); c.rotate(-.35);
      R(c, -320 + push * 260, -48, 500 - push * 260, 96, 14, 'rgba(120,200,255,.55)'); for (let i = 0; i < 8; i++) L(c, -270 + i * 55, -60, -270 + i * 55, -30, '#6A7888', 4);
      R(c, -400 + push * 260, -16, 90, 32, 6, '#6A7888'); R(c, -440 + push * 260, -70, 40, 140, 10, '#3A4656');
      R(c, 190, -24, 60, 48, 8, '#3A4656'); L(c, 250, 0, 420, 0, '#C6CED6', 6); c.restore(); });
    pop(c, -480, 170, bk(lt, .4, .4), () => { R(c, -540, 80, 120, 200, 18, 'rgba(230,240,250,.9)', '#9AA6B4', 4); R(c, -540, 50, 120, 50, 10, '#E5484D'); R(c, -540, 170, 120, 70, 0, 'rgba(120,200,255,.55)'); });
    label(c, o, 340);
  });

  /* ambulance: drives in with flashing light and speed lines */
  reg('ambulance', 'alert', (c, o) => {
    const lt = o.lt, x0 = -900 * (1 - eo(lt / 1.1)), fl = Math.floor(lt * 5) % 2;
    c.save(); c.globalAlpha = .4; for (let i = 0; i < 6; i++) L(c, x0 - 600 - i * 40, -120 + i * 50, x0 - 420 - i * 20, -120 + i * 50, '#FFFFFF', 6); c.restore();
    c.save(); c.translate(x0, 60); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; R(c, -420, -220, 640, 300, 30, '#F7F9FB'); R(c, 220, -140, 220, 220, 30, '#F7F9FB'); c.restore();
    c.save(); c.translate(x0, 60); R(c, 250, -120, 150, 100, 14, '#8FC3E8'); R(c, -420, -40, 860, 34, 0, '#E5484D'); R(c, -150, -190, 60, 130, 8, '#E5484D'); R(c, -185, -155, 130, 60, 8, '#E5484D');
      R(c, -70, -270, 120, 50, 12, fl ? '#FF3B4E' : '#3B7BFF'); if (fl || 1) { c.save(); c.globalAlpha = .35; O(c, -10, -250, 140, fl ? '#FF3B4E' : '#3B7BFF'); c.restore(); }
      wheel(c, -250, 90, 70, lt); wheel(c, 300, 90, 70, lt); c.restore();
    R(c, -1400, 230, 2800, 12, 0, 'rgba(255,255,255,.15)');
    label(c, o, 340);
  });

  /* diary: a leather diary with a strap opens to a dated handwritten page */
  reg('diary', 'ember', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), op = eio((lt - .5) / .6), date = String(o.tx[1] || '');
    pop(c, 0, 0, k, () => { c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; c.shadowOffsetY = 20; R(c, -20, -300, 420, 600, 18, '#5B1F2B'); c.restore();
      R(c, 0, -280, 380, 560, 10, '#F6EEDC'); for (let i = 0; i < 9; i++) L(c, 30, -170 + i * 52, 350, -170 + i * 52, 'rgba(120,90,60,.25)', 2);
      TXT(c, date || 'প্রিয় ডায়েরি,', 40, -200, 40, '#6B2A1A', 700, 'left'); scribble(c, 40, -120, 300, 7, 52, '#3A2A6A', C.cl((lt - .9) / 1.8), 4);
      c.save(); c.translate(0, 0); c.scale(1 - op * 2, 1); R(c, 0, -300, 400, 600, 18, '#6E2433'); R(c, 0, -300, 30, 600, 6, '#4A1520'); c.fillStyle = '#E6C36A'; c.globalAlpha = 1 - op; R(c, 140, -120, 180, 120, 10, null, '#E6C36A', 4); TXT(c, 'ডায়েরি', 230, -45, 40, '#E6C36A', 800, 'center'); c.restore();
      if (op < .9) { R(c, 360 - op * 300, -40, 80, 70, 10, '#3D1119'); O(c, 400 - op * 300, -5, 14, '#E6C36A'); } });
    label(c, o, 350);
  });

  /* notebook: a spiral exercise book (khata), ruled lines get written, a pencil moves */
  reg('notebook', 'ember', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), f = C.cl((lt - .3) / 2); let pen = null;
    pop(c, 0, 0, k, () => { c.save(); c.rotate(.04); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 40; c.shadowOffsetY = 16; R(c, -420, -300, 840, 600, 14, '#FFFFFF'); c.restore(); c.save(); c.rotate(.04);
      R(c, -420, -300, 840, 90, 14, '#E9573F'); TXT(c, 'খাতা', -330, -235, 44, '#FFFFFF', 800, 'left');
      for (let i = 0; i < 9; i++) L(c, -400, -170 + i * 50, 400, -170 + i * 50, 'rgba(70,130,200,.3)', 2); L(c, -320, -210, -320, 300, 'rgba(229,72,77,.45)', 3);
      for (let i = 0; i < 9; i++) O(c, -420, -250 + i * 62, 16, '#CFD5DA', '#7A7F85', 3);
      scribble(c, -300, -180, 640, 8, 50, '#2A3A6A', f, 4); const row = Math.min(7, Math.floor(f * 8)); pen = [-300 + 640 * C.cl(f * 8 - row) * (1 - (row % 3) * .12), -180 + row * 50];
      if (lt < 2.4) { c.save(); c.translate(pen[0], pen[1]); c.rotate(-.8); R(c, -10, -190, 20, 170, 4, '#F2B134'); c.beginPath(); c.moveTo(-10, -20); c.lineTo(10, -20); c.lineTo(0, 6); c.fillStyle = '#E8C9A0'; c.fill(); R(c, -10, -200, 20, 18, 3, '#E5484D'); c.restore(); }
      c.restore(); });
    label(c, o, 350);
  });

  /* ledger: the red cloth account book (hisab khata) — a column of numbers and a total that adds up */
  reg('ledger', 'money', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), rows = ['১২০', '৪৫০', '৮০', '৩০০', '২৫০'], f = C.cl((lt - .4) / 1.6), due = /বাকি|due|দেনা/.test(String(o.tx[1] || ''));
    pop(c, 0, 0, k, () => { c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; R(c, -460, -320, 920, 640, 16, '#8C2230'); c.restore(); R(c, -430, -295, 860, 590, 8, '#F4ECD8'); L(c, 0, -295, 0, 295, 'rgba(120,60,40,.35)', 3);
      TXT(c, due ? 'বাকির খাতা' : 'হিসাবের খাতা', -215, -225, 42, '#8C2230', 800, 'center'); TXT(c, 'জমা / খরচ', 215, -225, 42, '#8C2230', 800, 'center'); L(c, -400, -195, 400, -195, '#8C2230', 3);
      rows.forEach((r, i) => { if (f * rows.length < i + .2) return; const y = -140 + i * 62; TXT(c, ['চাল', 'তেল', 'নুন', 'ডাল', 'সবজি'][i], -380, y, 38, '#3A2410', 700, 'left'); TXT(c, '৳ ' + r, 380, y, 40, '#1F3A8A', 800, 'right', 'TFDisp'); L(c, -400, y + 18, 400, y + 18, 'rgba(120,60,40,.18)', 2); });
      const tk = bk(lt, 2.1, .4); if (tk > 0) { L(c, 60, 180, 400, 180, '#3A2410', 4); pop(c, 260, 230, tk, () => TXT(c, '৳ ১২০০', 380, 250, 58, due ? '#C62828' : '#1E7A4C', 800, 'right', 'TFDisp')); } });
    label(c, o, 370);
  });

  /* envelope: a letter slides out of an envelope, a stamp lands */
  reg('envelope', 'ember', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), op = eio((lt - .5) / .5), out = eio((lt - .9) / .7);
    pop(c, 0, 60, k, () => { R(c, -300, -200 - out * 250, 600, 360, 10, '#FFFDF6'); if (out > .3) scribble(c, -240, -140 - out * 250, 470, 4, 52, '#3A2A6A', C.cl((lt - 1.4) / 1.2), 4);
      c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; c.shadowOffsetY = 14; R(c, -380, -160, 760, 400, 14, '#E9D2A6'); c.restore();
      c.beginPath(); c.moveTo(-380, 240); c.lineTo(0, 30); c.lineTo(380, 240); c.strokeStyle = 'rgba(120,80,30,.35)'; c.lineWidth = 4; c.stroke();
      c.save(); c.translate(0, -160); c.scale(1, 1 - op * 2); c.beginPath(); c.moveTo(-380, 0); c.lineTo(0, 210); c.lineTo(380, 0); c.closePath(); c.fillStyle = op > .5 ? '#D9BE8C' : '#E2C694'; c.fill(); c.restore();
      if (op < .5) O(c, 0, 40, 34, '#B3261E'); });
    pop(c, 260, -10, bk(lt, 1.6, .3), () => { c.save(); c.translate(260, 120); c.rotate(.12); R(c, -60, -70, 120, 140, 6, '#FFFFFF', '#3E7C59', 6); R(c, -44, -54, 88, 108, 4, '#7FB89A'); c.restore(); });
    label(c, o, 360);
  });

  /* lantern: a hurricane lamp flickers in the dark (load-shedding, night study) */
  reg('lantern', 'ember', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .6), fl = 1 + .08 * Math.sin(lt * 17) + .05 * Math.sin(lt * 29);
    c.save(); const g = c.createRadialGradient(0, -20, 10, 0, -20, 700 * fl); g.addColorStop(0, 'rgba(255,190,90,.55)'); g.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = g; c.fillRect(-1400, -700, 2800, 1400); c.restore();
    pop(c, 0, 0, k, () => { c.strokeStyle = '#3A3A3A'; c.lineWidth = 10; c.beginPath(); c.arc(0, -250, 110, Math.PI, 0); c.stroke(); R(c, -150, -230, 300, 40, 12, '#B5651D'); R(c, -150, 170, 300, 70, 16, '#B5651D'); R(c, -120, 150, 240, 30, 6, '#8C4A12');
      c.save(); c.beginPath(); c.ellipse(0, -20, 120, 170, 0, 0, 7); c.fillStyle = 'rgba(255,240,200,.35)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 4; c.stroke(); c.restore();
      [-130, 130].forEach(x => L(c, x, -200, x, 160, '#7A3E12', 10));
      c.save(); c.translate(0, 60); c.scale(fl, fl); c.shadowColor = '#FFB347'; c.shadowBlur = 60; c.beginPath(); c.moveTo(0, -110); c.quadraticCurveTo(46, -20, 0, 20); c.quadraticCurveTo(-46, -20, 0, -110); c.fillStyle = '#FFD36B'; c.fill(); c.beginPath(); c.moveTo(0, -60); c.quadraticCurveTo(20, -10, 0, 12); c.quadraticCurveTo(-20, -10, 0, -60); c.fillStyle = '#FFF6D6'; c.fill(); c.restore(); });
    label(c, o, 360);
  });

  /* key: a golden key slides into a padlock, turns, the shackle springs open */
  reg('key', 'night', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), ins = eo(lt / .8), tr = eio((lt - .9) / .35), up = eo((lt - 1.2) / .4);
    pop(c, -200, 0, k, () => { c.lineWidth = 46; c.strokeStyle = '#AEB7C2'; c.lineCap = 'butt'; c.beginPath(); c.moveTo(-350, -60 - up * 90); c.lineTo(-350, -170 - up * 90); c.arc(-200, -170 - up * 90, 150, Math.PI, 0); c.lineTo(-50, -60 + (up > 0 ? -up * 90 : 0)); c.stroke();
      c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; R(c, -420, -80, 440, 380, 40, '#C9A24B'); c.restore(); R(c, -400, -60, 400, 340, 32, '#E0B95A'); O(c, -200, 90, 38, '#3A2A0A'); R(c, -214, 100, 28, 80, 6, '#3A2A0A'); });
    c.save(); c.translate(-160 + (1 - ins) * 700, 90); c.rotate(tr * .22); c.shadowColor = "#FFD36B"; c.shadowBlur = 30;
      O(c, 520, 0, 110, '#E6C36A'); O(c, 520, 0, 50, TH.night.b); R(c, 0, -26, 430, 52, 16, '#E6C36A'); R(c, 60, 20, 38, 60, 6, '#E6C36A'); R(c, 130, 20, 38, 42, 6, '#E6C36A'); c.restore();
    if (up > .8) sparkles(c, lt, o.seed, 10, 300, 200, '#FFF2B8', -200, -200);
    label(c, o, 350);
  });

  /* baby: a newborn wrapped in a cloth, gently rocking, small hearts */
  reg('baby', 'plum', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .6), rk = Math.sin(lt * 1.6) * .06;
    pop(c, 0, 40, k, () => { c.save(); c.translate(0, 40); c.rotate(rk); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 40; c.beginPath(); c.ellipse(0, 40, 360, 190, 0, 0, 7); c.fillStyle = '#F7D9E3'; c.fill(); c.restore(); c.save(); c.translate(0, 40); c.rotate(rk);
      c.beginPath(); c.moveTo(-340, 40); c.quadraticCurveTo(0, -60, 340, 40); c.quadraticCurveTo(0, 230, -340, 40); c.fillStyle = '#FCE9F0'; c.fill(); O(c, -200, -40, 120, '#E8B48C'); O(c, -200, -40, 120, null, '#F7D9E3', 20);
      L(c, -250, -50, -225, -50, '#5A3A2A', 6); L(c, -175, -50, -150, -50, '#5A3A2A', 6); c.beginPath(); c.arc(-200, -5, 16, .2, Math.PI - .2); c.strokeStyle = '#B5653A'; c.lineWidth = 5; c.stroke(); O(c, -260, -10, 18, 'rgba(255,120,140,.35)'); O(c, -140, -10, 18, 'rgba(255,120,140,.35)');
      c.restore(); });
    for (let i = 0; i < 5; i++) { const ph = (lt * .5 + i * .2) % 1; c.save(); c.globalAlpha = Math.sin(ph * Math.PI) * .8; heartPath(c, 200 + i * 60 - 120, -120 - ph * 260, 34); c.fillStyle = '#FF7EA0'; c.fill(); c.restore(); }
    label(c, o, 350);
  });

  /* tiffin: a steel tiffin carrier opens tier by tier, steam rises */
  reg('tiffin', 'ember', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), op = eio((lt - .8) / .8);
    pop(c, 0, 40, k, () => { c.strokeStyle = '#9AA6B4'; c.lineWidth = 14; L(c, -170, -260, -170, 260, '#9AA6B4', 14); L(c, 170, -260, 170, 260, '#9AA6B4', 14); c.beginPath(); c.arc(0, -260, 170, Math.PI, 0); c.stroke();
      [0, 1, 2].forEach(i => { const y = 120 - i * 150 - (i === 2 ? op * 140 : i === 1 ? op * 60 : 0), x = i === 2 ? op * 260 : 0; c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 20; R(c, x - 150, y - 60, 300, 130, 30, '#D6DDE4'); c.restore(); R(c, x - 150, y - 60, 300, 30, 14, '#EEF2F5'); R(c, x - 150, y + 40, 300, 14, 7, '#B5C0CB'); });
      if (op > .3) { c.save(); c.globalAlpha = op; c.beginPath(); c.ellipse(0, -30, 130, 30, 0, 0, 7); c.fillStyle = '#FFF8EA'; c.fill(); O(c, -50, -36, 22, '#E8B04B'); O(c, 40, -30, 18, '#6E9E48'); c.restore(); steam(c, 0, -60, lt, 3, 220, 12); } });
    label(c, o, 360);
  });

  /* school bag: a backpack with books peeking out, it bounces as if walking */
  reg('schoolbag', 'night', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), b = Math.abs(Math.sin(lt * 4)) * 16;
    pop(c, 0, 0, k, () => { c.save(); c.translate(0, -b); c.strokeStyle = '#2C4D8A'; c.lineWidth = 22; c.beginPath(); c.arc(0, -230, 90, Math.PI, 0); c.stroke();
      R(c, -150, -280, 60, 140, 10, '#E5484D'); R(c, -80, -300, 60, 160, 10, '#F2B134'); R(c, -10, -270, 60, 130, 10, '#3FA37C');
      c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; R(c, -230, -230, 460, 520, 70, '#3B6FD8'); c.restore(); R(c, -170, 60, 340, 180, 40, '#2C59B8'); R(c, -130, 90, 260, 16, 8, '#F2C14E'); R(c, -230, -230, 460, 120, 70, '#4A7FE6'); c.restore(); });
    label(c, o, 350);
  });

  /* umbrella: opens under rain */
  reg('umbrella', 'steel', (c, o) => {
    const lt = o.lt, op = eo((lt - .2) / .6);
    c.strokeStyle = 'rgba(170,200,255,.5)'; c.lineWidth = 4; c.beginPath(); for (let i = 0; i < 110; i++) { const x = ((i * 137) % 2800) - 1400, y = ((i * 211 + lt * 1500) % 950) - 400; if (Math.abs(x) < 380 * op && y > -260) continue; c.moveTo(x, y); c.lineTo(x - 14, y + 50); } c.stroke();
    c.save(); c.translate(0, -60); c.scale(.2 + .8 * op, 1); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 30; c.beginPath(); c.moveTo(-420, 0); c.quadraticCurveTo(0, -380, 420, 0); for (let i = 0; i < 6; i++) { const x1 = 420 - i * 140; c.quadraticCurveTo(x1 - 70, -60, x1 - 140, 0); } c.fillStyle = '#E5484D'; c.fill(); c.restore();
    L(c, 0, -60, 0, 280, '#3A3A3A', 12); c.beginPath(); c.arc(-40, 280, 40, 0, Math.PI); c.strokeStyle = '#3A3A3A'; c.lineWidth = 12; c.stroke();
    label(c, o, 360);
  });

  /* ---------- Islamic-only ---------- */
  /* the Quran open on a wooden stand (rehal), soft light, Arabic-like strokes (no real text) */
  reg('quran', 'money', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .6); rays(c, 0, -60, lt, '#FFF1C4', 14, 1200, .14);
    pop(c, 0, 80, k, () => { c.fillStyle = '#7A4A22'; c.beginPath(); c.moveTo(-420, 260); c.lineTo(0, 40); c.lineTo(420, 260); c.lineTo(380, 290); c.lineTo(0, 90); c.lineTo(-380, 290); c.closePath(); c.fill();
      const page = s => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 200, -50, s * 400, -10); c.lineTo(s * 400, -330); c.quadraticCurveTo(s * 200, -370, 0, -320); c.closePath(); c.fillStyle = '#FBF5E4'; c.fill(); c.strokeStyle = '#C9A24B'; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#2E6B52'; c.lineWidth = 4; for (let i = 0; i < 6; i++) { c.beginPath(); const y = -280 + i * 44; for (let x = 30; x < 370; x += 14) { const yy = y + Math.sin(x * .2 + i) * 6; if (x === 30) c.moveTo(s * x, yy); else c.lineTo(s * x, yy); } c.stroke(); } };
      c.save(); c.translate(0, 60); page(-1); page(1); c.restore(); R(c, -12, -280, 24, 340, 6, '#1F5D45'); });
    sparkles(c, lt, o.seed, 12, 520, 200, '#FFF1C4', 0, -220);
    label(c, o, 360);
  });

  /* tasbih: prayer beads, one bead slides at a time, a soft counter */
  reg('tasbih', 'money', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), n = 33, step = Math.floor(lt * 2.5) % n;
    pop(c, 0, 0, k, () => { for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i / n * Math.PI * 2 + (i <= step ? .06 : 0), x = Math.cos(a) * 280, y = Math.sin(a) * 240 - 20; c.save(); c.shadowColor = i === step ? '#FFE08A' : 'rgba(0,0,0,.4)'; c.shadowBlur = i === step ? 30 : 10; O(c, x, y, 26, i === step ? '#F2C14E' : '#1F7A5A'); c.restore(); O(c, x - 8, y - 8, 7, 'rgba(255,255,255,.5)'); }
      R(c, -18, 220, 36, 70, 10, '#F2C14E'); c.beginPath(); c.moveTo(-40, 290); c.lineTo(40, 290); c.lineTo(0, 380); c.closePath(); c.fillStyle = '#C9A24B'; c.fill(); });
    big(c, toBn(step + 1), 0, 10, 120, o.T, bk(lt, .3, .4), '#FFE08A');
    label(c, o, 360);
  });

  /* prayer mat: a jaynamaz unrolls, mihrab arch pattern */
  reg('prayer_mat', 'money', (c, o) => {
    const lt = o.lt, un = eio((lt - .1) / 1.1), h = 640 * un;
    c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; R(c, -260, 320 - h, 520, h, 12, '#1F5D45'); c.restore();
    c.save(); c.beginPath(); c.rect(-260, 320 - h, 520, h); c.clip(); R(c, -230, -290, 460, 580, 8, null, '#E6C36A', 6);
      c.beginPath(); c.moveTo(-160, 220); c.lineTo(-160, -120); c.quadraticCurveTo(-160, -250, 0, -270); c.quadraticCurveTo(160, -250, 160, -120); c.lineTo(160, 220); c.strokeStyle = '#E6C36A'; c.lineWidth = 8; c.stroke();
      O(c, 0, -170, 28, '#E6C36A'); for (let i = 0; i < 9; i++) R(c, -200 + i * 46, 250, 24, 24, 4, i % 2 ? '#C9A24B' : '#8C2230'); c.restore();
    if (un < 1) { c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 20; R(c, -270, 320 - h - 50, 540, 90, 45, '#174A37'); c.restore(); }
    label(c, o, 370);
  });

  /* dua: two open palms raised, light falls from above (no face) */
  reg('dua', 'money', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .6); rays(c, 0, -460, lt, '#FFF1C4', 12, 900, .2);
    const palm = s => { c.save(); c.scale(s, 1); c.beginPath(); c.moveTo(30, 260); c.quadraticCurveTo(20, 60, 50, -60); for (let i = 0; i < 4; i++) { const x = 70 + i * 52; c.quadraticCurveTo(x - 6, -200 + Math.abs(i - 1.5) * 30, x + 22, -60 + i * 6); } c.quadraticCurveTo(300, 40, 260, 120); c.quadraticCurveTo(240, 220, 200, 260); c.closePath(); c.fillStyle = '#D9A06F'; c.fill(); c.strokeStyle = '#B5784A'; c.lineWidth = 5; c.stroke(); R(c, 10, 250, 220, 120, 20, '#F2F2F2'); c.restore(); };
    pop(c, 0, 60, k, () => { c.save(); c.translate(0, 60); c.rotate(.05); palm(-1); c.rotate(-.1); palm(1); c.restore(); });
    sparkles(c, lt, o.seed, 16, 400, 250, '#FFF6D0', 0, -260);
    label(c, o, 370);
  });

  /* iftar: dates and a glass of water on a plate, a crescent outside */
  reg('iftar', 'ember', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5);
    c.save(); c.shadowColor = '#FFF1C4'; c.shadowBlur = 40; O(c, 560, -260, 70, '#FFF1C4'); c.restore(); O(c, 590, -280, 64, TH.ember.b);
    pop(c, 0, 120, k, () => { c.beginPath(); c.ellipse(0, 180, 480, 110, 0, 0, 7); c.fillStyle = '#E7E3DC'; c.fill(); c.beginPath(); c.ellipse(0, 170, 400, 80, 0, 0, 7); c.fillStyle = '#FFFFFF'; c.fill();
      for (let i = 0; i < 6; i++) { const x = -300 + (i % 3) * 90 + (i > 2 ? 45 : 0), y = 150 - (i > 2 ? 40 : 0); c.save(); c.translate(x, y); c.rotate(.4); c.beginPath(); c.ellipse(0, 0, 50, 26, 0, 0, 7); c.fillStyle = '#5A2A16'; c.fill(); c.globalAlpha = .4; c.beginPath(); c.ellipse(-12, -8, 18, 6, 0, 0, 7); c.fillStyle = '#C98A5A'; c.fill(); c.restore(); }
      c.save(); c.beginPath(); c.moveTo(150, -100); c.lineTo(330, -100); c.lineTo(310, 170); c.lineTo(170, 170); c.closePath(); c.fillStyle = 'rgba(200,230,255,.45)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 4; c.stroke(); c.restore(); R(c, 162, -10, 156, 170, 6, 'rgba(120,190,255,.45)'); });
    label(c, o, 360);
  });

  /* crescent: the new moon appears over rooftops (Ramadan / Eid) */
  reg('crescent', 'night', (c, o) => {
    const lt = o.lt, k = eo(lt / 1.4); sky(c, '#050A1C', '#1B2A48'); stars(c, o.seed, lt, 80);
    c.save(); c.globalAlpha = k; c.shadowColor = '#FFF1C4'; c.shadowBlur = 70; O(c, 0, -120, 170, '#FFF1C4'); c.restore(); O(c, 70, -160, 160, '#0E1830');
    c.save(); c.globalAlpha = k; c.fillStyle = '#FFF1C4'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 22 : 54; c.lineTo(230 + Math.cos(a) * r, -230 + Math.sin(a) * r); } c.fill(); c.restore();
    c.fillStyle = '#070C1C'; [[-1400, 180, 500, 400], [-900, 120, 300, 500], [-600, 200, 520, 400], [-80, 160, 340, 500], [260, 110, 260, 500], [520, 190, 900, 400]].forEach(([x, y, w, h]) => c.fillRect(x, y, w, h));
    label(c, o, 360);
  });

  /* kaaba: the black cube with a gold band under a calm sky (no people) */
  reg('kaaba', 'night', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .6); sky(c, '#0A1630', '#2A3E66'); stars(c, o.seed, lt, 40);
    pop(c, 0, 100, k, () => { c.save(); c.shadowColor = 'rgba(255,220,150,.35)'; c.shadowBlur = 60; c.beginPath(); c.moveTo(-320, -200); c.lineTo(160, -260); c.lineTo(340, -190); c.lineTo(340, 280); c.lineTo(160, 330); c.lineTo(-320, 280); c.closePath(); c.fillStyle = '#121212'; c.fill(); c.restore();
      c.beginPath(); c.moveTo(160, -260); c.lineTo(160, 330); c.strokeStyle = '#2A2A2A'; c.lineWidth = 4; c.stroke();
      c.fillStyle = '#D4A93C'; c.beginPath(); c.moveTo(-320, -120); c.lineTo(160, -170); c.lineTo(340, -110); c.lineTo(340, -75); c.lineTo(160, -132); c.lineTo(-320, -84); c.closePath(); c.fill();
      R(c, 40, 60, 90, 180, 6, '#C9A24B'); R(c, -1400, 330, 2800, 300, 0, '#E9E4DA'); });
    label(c, o, 370);
  });

  /* zakat / sadaqah: an open hand gives coins into another, coins arc over */
  reg('zakat', 'money', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5);
    const hand = (x, s) => { c.save(); c.translate(x, 140); c.scale(s * 1.5, 1.5); c.beginPath(); c.moveTo(-260, 40); c.quadraticCurveTo(-100, 70, 60, 40); c.quadraticCurveTo(140, 20, 160, -20); c.quadraticCurveTo(100, -40, 40, -10); c.quadraticCurveTo(-100, -20, -260, -40); c.closePath(); c.fillStyle = '#D9A06F'; c.fill(); R(c, -320, -50, 90, 110, 16, '#3FA37C'); c.restore(); };
    pop(c, 0, 140, k, () => { hand(-260, 1); hand(260, -1); });
    for (let i = 0; i < 5; i++) { const t0 = lt - .4 - i * .25; if (t0 < 0) continue; const ph = C.cl((t0 % 1.6) / .9); if (ph >= 1) continue; const x = -260 + ph * 520, y = 60 - Math.sin(ph * Math.PI) * 260; c.save(); c.shadowColor = '#FFE08A'; c.shadowBlur = 20; O(c, x, y, 40, '#F2C14E', '#C9A24B', 6); c.restore(); TXT(c, '৳', x, y + 16, 40, '#8A6A1E', 800, 'center'); }
    label(c, o, 360);
  });

  /* ---------- general stories only ---------- */
  /* ring: two wedding rings, one drops into the other, sparkles */
  reg('ring', 'plum', (c, o) => {
    const lt = o.lt, k = bk(lt, .05, .5), d = eio((lt - .4) / .8);
    pop(c, 0, 0, k, () => { c.save(); c.shadowColor = '#FFD36B'; c.shadowBlur = 40; c.lineWidth = 40; c.strokeStyle = '#E6C36A'; c.beginPath(); c.ellipse(-110, 40, 170, 190, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(110 - (1 - d) * 160, 60 - (1 - d) * 260, 170, 190, 0, 0, 7); c.stroke(); c.restore();
      c.save(); c.translate(110 - (1 - d) * 160, -140 - (1 - d) * 260); c.rotate(Math.PI / 4); c.shadowColor = '#BFE9FF'; c.shadowBlur = 40; R(c, -40, -40, 80, 80, 8, '#DFF6FF'); c.restore(); });
    sparkles(c, lt, o.seed, 18, 420, 260, '#FFF6D0', 0, -60);
    label(c, o, 350);
  });

  /* cricket: a bat hits the ball, the ball flies off with a trail, stumps behind */
  reg('cricket', 'night', (c, o) => {
    const lt = o.lt, sw = eio((lt - .4) / .25), fly = C.cl((lt - .65) / 1.2);
    [-420, -360, -300].forEach(x => R(c, x, -60, 18, 360, 8, '#F2E3C0')); R(c, -430, -70, 146, 14, 6, '#E8D3A0');
    R(c, -1400, 300, 2800, 400, 0, '#1E5C34');
    c.save(); c.translate(-80, 260); c.rotate(-1.2 + sw * 1.5); R(c, -16, -460, 32, 160, 12, '#3A3A3A'); R(c, -46, -310, 92, 300, 20, '#E9C98E'); c.restore();
    const bx = fly > 0 ? -60 + fly * 1100 : -600 + C.cl(lt / .65) * 540, by = fly > 0 ? 40 - Math.sin(fly * Math.PI * .8) * 420 : 60;
    if (fly > 0) { c.save(); c.globalAlpha = .3; L(c, -60, 40, bx, by, '#FFFFFF', 18); c.restore(); }
    O(c, bx, by, 34, '#C62828'); c.beginPath(); c.arc(bx, by, 26, -1, 1); c.strokeStyle = '#FFFFFF'; c.lineWidth = 4; c.stroke();
    label(c, o, 360);
  });

  /* kite: a paper kite dances on its string in the sky */
  reg('kite', 'ember', (c, o) => {
    const lt = o.lt; sky(c, '#4A7FD0', '#FFC98A'); const x = 120 + Math.sin(lt * 1.2) * 120, y = -200 + Math.cos(lt * 1.7) * 60, r = Math.sin(lt * 2) * .15;
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-600, 380); c.quadraticCurveTo(-200, 100, x, y + 150); c.stroke();
    c.save(); c.translate(x, y); c.rotate(r); c.beginPath(); c.moveTo(0, -170); c.lineTo(130, 0); c.lineTo(0, 170); c.lineTo(-130, 0); c.closePath(); c.fillStyle = '#E5484D'; c.fill(); c.beginPath(); c.moveTo(0, -170); c.lineTo(130, 0); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#F2B134'; c.fill(); L(c, 0, -170, 0, 170, '#7A3E12', 4); L(c, -130, 0, 130, 0, '#7A3E12', 4);
      c.beginPath(); c.moveTo(0, 170); for (let i = 1; i <= 8; i++) c.lineTo(Math.sin(lt * 4 + i) * 30, 170 + i * 30); c.strokeStyle = '#FFFFFF'; c.lineWidth = 4; c.stroke(); c.restore();
    label(c, o, 360);
  });

  /* ================= choosing and drawing ================= */
  const ALIAS = { photo: 'frame', picture: 'frame', wall_photo: 'frame', food: 'plate', rice: 'plate', meal: 'plate', cup: 'tea', coffee: 'tea', home: 'house', car: 'vehicle', bus: 'vehicle', rickshaw: 'vehicle', truck: 'vehicle', storm: 'rain', weather: 'rain', morning: 'sun', sunrise: 'sun', moon: 'sun', love: 'heart', study: 'book', result: 'exam', hospital: 'saline', icu: 'health', pills: 'medicine', thermometer: 'fever', letter: 'envelope', khata: 'notebook', hisab: 'ledger', lamp: 'lantern', hurricane: 'lantern', mat: 'prayer_mat', jaynamaz: 'prayer_mat', beads: 'tasbih', moon_star: 'crescent', wedding: 'ring', present: 'gift', win: 'trophy', award: 'trophy', bulb: 'idea', plan: 'idea', shop: 'cart', market: 'cart', bazaar: 'cart', purse: 'wallet', debt: 'wallet', computer: 'laptop', online: 'laptop', farm: 'field', village: 'field', flight: 'plane', abroad: 'plane', savings: 'piggy', deal: 'handshake', partner: 'handshake', exit: 'door', prayer: 'mosque', eid: 'mosque', burn: 'fire', police: 'jail', arrest: 'jail', prison: 'jail', gamble: 'dice', lottery: 'dice', casino: 'dice', news: 'tv', goal: 'target', dream: 'target', launch: 'rocket', growth: 'rocket', steps: 'stairs', promotion: 'stairs', deadline: 'hourglass', wait: 'hourglass', world: 'globe', earth: 'globe', jewellery: 'gold', chart: 'chart_line', graph: 'chart_line', line: 'chart_line', up: 'chart_line', down: 'chart_line', bars: 'chart_bars', bar: 'chart_bars', map: 'route', path: 'route', crowd: 'people', people: 'people', letter: 'doc', paper: 'doc', report: 'doc', mail: 'email', city: 'skyline', night: 'skyline', siren: 'alert', danger: 'alert', cash: 'money', date: 'calendar', scale: 'balance', versus: 'balance', net: 'network', links: 'network', file: 'files', pile: 'files', time: 'clock', days: 'timeline', why: 'question', '?': 'question', search: 'magnifier', spy: 'magnifier', secure: 'lock', hack: 'lock', chat: 'phone', sms: 'phone', tower: 'building', bank: 'building', school: 'building', factory: 'building', count: 'counter', number: 'counter' };
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

  /* concrete things and situations named in a line → the picture of that thing (also used for small pop-ups during dialogue) */
  function objectFor(text, has, h0) {
    const pickBy = arr => arr[hash(text) % arr.length]; // same line → same picture, different lines → different pictures
    // Islamic part only
    if (SEC === 'isl') {
      if (has(/কুরআন|কোরআন|কোরান|তিলাওয়াত|তেলাওয়াত|মুসহাফ/)) return { kind: 'quran', tx: [h0] };
      if (has(/তাসবিহ|তসবি|জিকির|জিকর|সুবহানাল্লাহ|আলহামদুলিল্লাহ|আস্তাগফিরুল্লাহ/)) return { kind: 'tasbih', tx: [h0] };
      if (has(/জায়নামাজ|জায়নামাজ|জায়নামায|সিজদা|সেজদা|নামাজে দাঁড়|নামাজ পড়|তাহাজ্জুদ/)) return { kind: 'prayer_mat', tx: [h0] };
      if (has(/দোয়া|দোয়া|মোনাজাত|হাত তুলে/)) return { kind: 'dua', tx: [h0] };
      if (has(/ইফতার|খেজুর|রোজা ভাঙ/)) return { kind: 'iftar', tx: [h0] };
      if (has(/রমজানের চাঁদ|ঈদের চাঁদ|চাঁদ দেখা|নতুন চাঁদ|হিলাল|রমজান|রোজা/)) return { kind: 'crescent', tx: [h0] };
      if (has(/কাবা|হজ|হজ্জ|উমরা|মক্কা|তাওয়াফ/)) return { kind: 'kaaba', tx: [h0] };
      if (has(/যাকাত|জাকাত|সদকা|সাদকা|দান কর|দান করে|ফিতরা/)) return { kind: 'zakat', tx: [h0] };
    } else if (SEC === 'story') {
      // general life stories only
      if (has(/আংটি|বাগদান|এনগেজমেন্ট|বিয়ের দিন|বিয়ে হল|বিয়ে হয়|বিয়ে করল|বিয়ের/)) return { kind: 'ring', tx: [h0] };
      if (has(/ক্রিকেট|ব্যাট|ছক্কা|উইকেট|খেলার মাঠ/)) return { kind: 'cricket', tx: [h0] };
      if (has(/ঘুড়ি/)) return { kind: 'kite', tx: [h0] };
    }
    // common to every section: health (each illness gets its own picture, not one heartbeat for all)
    if (has(/আইসিইউ|হার্ট অ্যাটাক|অপারেশন|অক্সিজেন|হৃদরোগ/)) return { kind: 'health', tx: [h0] };
    if (has(/অ্যাম্বুলেন্স|এম্বুলেন্স/)) return { kind: 'ambulance', tx: [h0] };
    if (has(/স্যালাইন|হাসপাতালে ভর্তি|ভর্তি করা হল|ভর্তি করল|বেডে|হাসপাতালের বিছানা/)) return { kind: 'saline', tx: [h0] };
    if (has(/ইনজেকশন|ইঞ্জেকশন|টিকা|ভ্যাকসিন|সুঁই/)) return { kind: 'injection', tx: [h0] };
    if (has(/জ্বর|থার্মোমিটার|সর্দি|কাশি|ঠান্ডা লেগে|ঠাণ্ডা লেগে|গা গরম/)) return { kind: 'fever', tx: [h0] };
    if (has(/ওষুধ|ঔষধ|ট্যাবলেট|সিরাপ|ফার্মেসি|ওষুধের দোকান/)) return { kind: 'medicine', tx: [h0] };
    if (has(/ডাক্তার|প্রেসক্রিপশন|চেকআপ|চেম্বার|কবিরাজ/)) return { kind: 'doctor', tx: [h0] };
    if (has(/মারা গেল|মারা যান|মারা গেলেন|মৃত্যু|চলে গেলেন|পরপারে/)) return { kind: 'health', tx: [h0, 'flat'] };
    if (has(/হাসপাতাল|ক্লিনিক/)) return { kind: pickBy(['saline', 'doctor', 'ambulance']), tx: [h0] };
    if (has(/অসুখ|অসুস্থ|চিকিৎসা|রোগ|ক্যান্সার|ব্যথা|শরীর খারাপ/)) return { kind: pickBy(['fever', 'medicine', 'doctor', 'saline']), tx: [h0] };
    // paper things: each its own picture
    if (has(/ডায়েরি|ডায়েরি|দিনলিপি/)) return { kind: 'diary', tx: [h0] };
    if (has(/বাকির খাতা|হিসাবের খাতা|হিসেবের খাতা|হিসাব|হিসেব|লেজার|জমা-খরচ|খরচের খাতা/)) return { kind: 'ledger', tx: [h0, has(/বাকি|দেনা/) ? 'due' : ''] };
    if (has(/খাতা|নোটবুক|নোট করে|হোমওয়ার্ক|বাড়ির কাজ/)) return { kind: 'notebook', tx: [h0] };
    if (has(/চিঠি|খাম|ডাকপিয়ন|পোস্ট অফিস|ডাকঘর/)) return { kind: 'envelope', tx: [h0] };
    // home & everyday
    if (has(/টিফিন/)) return { kind: 'tiffin', tx: [h0] };
    if (has(/স্কুলব্যাগ|স্কুল ব্যাগ|ব্যাগ কাঁধে|বইখাতা/)) return { kind: 'schoolbag', tx: [h0] };
    if (has(/হারিকেন|লোডশেডিং|কারেন্ট নেই|কারেন্ট চলে|বিদ্যুৎ নেই|মোমবাতি|কুপি|লণ্ঠন/)) return { kind: 'lantern', tx: [h0] };
    if (has(/চাবি/)) return { kind: 'key', tx: [h0] };
    if (has(/নবজাতক|জন্ম নিল|জন্ম হল|জন্ম হয়|বাচ্চা হল|ছেলে হয়েছে|মেয়ে হয়েছে|কোলে এল/)) return { kind: 'baby', tx: [h0] };
    if (has(/ছাতা/)) return { kind: 'umbrella', tx: [h0] };
    if (has(/(দেয়াল|দেওয়াল|দেয়াল)[^।]{0,25}ছবি|ছবি[^।]{0,15}(দেয়াল|দেওয়াল|দেয়াল)|ফ্রেমে|ফ্রেম|বাঁধানো ছবি|পুরোনো ছবি|পুরনো ছবি|ফটো|অ্যালবাম/)) return { kind: 'frame', tx: [h0, has(/বিয়ে/) ? 'couple' : has(/বাবার|মায়ের|দাদার|নানার/) ? 'one' : ''] };
    if (has(/না খেয়ে|অভুক্ত|ক্ষুধা|ক্ষিধে|খিদে|খালি থালা|খাবার নেই|উপোস/)) return { kind: 'plate', tx: [h0, 'empty'] };
    if (has(/বিরিয়ানি|পোলাও/)) return { kind: 'plate', tx: [h0, 'biryani'] };
    if (has(/মিষ্টি/)) return { kind: 'plate', tx: [h0, 'sweets'] };
    if (has(/(?<![\u0980-\u09FF])ভাত(?!া)|থালা|খাবার|খেতে বস|তরকারি|ডাল-ভাত|ডালভাত|রান্না|মাছ-ভাত/)) return { kind: 'plate', tx: [h0] };
    if (has(/(^|\s)চা(\s|য়|য়|ের|-)|চায়ের|চায়ের|কফি/)) return { kind: 'tea', tx: [h0] };
    if (has(/পরীক্ষা[য়য়]? (পাস|ফেল|দিল|দিতে)|রেজাল্ট|ফলাফল|জিপিএ|গোল্ডেন|এ প্লাস|ফেল করল|পাস করল|এসএসসি|এইচএসসি|ভর্তি পরীক্ষা/)) return { kind: 'exam', tx: [h0, has(/ফেল/) ? 'ফেল' : has(/গোল্ডেন/) ? 'A+' : 'A+'] };
    if (has(/মসজিদ|নামাজ|আজান|ঈদ|রমজান|ইফতার|সেহরি|দোয়া/)) return { kind: 'mosque', tx: [h0] };
    if (has(/আগুন|পুড়ে|পুড়িয়ে|অগ্নি|জ্বলছে|দাউদাউ/)) return { kind: 'fire', tx: [h0] };
    if (has(/(?<![\u0980-\u09FF])জেল(?!া)|কারাগার|গ্রেপ্তার|গ্রেফতার|পুলিশ|হাতকড়া|আটক(?![ে])|থানায়? (?:নিয়ে|গেল|ডাক)/)) return { kind: 'jail', tx: [h0] };
    if (has(/জুয়া|ক্যাসিনো|লটারি|বাজি ধর|জুয়ার/)) return { kind: 'dice', tx: [h0] };
    if (has(/খবর|সংবাদ|টিভি|টেলিভিশন|পত্রিকা|মিডিয়া|ভাইরাল|শিরোনাম/)) return { kind: 'tv', tx: [h0, text.length < 60 ? text.replace(/[।]$/, '') : h0] };
    if (has(/উপহার|গিফট|সারপ্রাইজ/)) return { kind: 'gift', tx: [h0] };
    if (has(/পুরস্কার|জিতল|জিতে নিল|চ্যাম্পিয়ন|প্রথম হল|প্রথম হলো|প্রথম হয়|ট্রফি|মেডেল/)) return { kind: 'trophy', tx: [h0] };
    if (has(/সঞ্চয়|জমানো|জমাতে|জমিয়ে|সেভিংস|মাটির ব্যাংক|টাকার কৌটো/)) return { kind: 'piggy', tx: [h0] };
    if (has(/মানিব্যাগ|পকেটে|পকেট খালি|(?<![\u0980-\u09FF])ধার(?![ণা])|ঋণ|দেনা|কর্জ|টাকা নেই|ফতুর|নিঃস্ব|কপর্দকশূন্য/)) return { kind: 'wallet', tx: [h0, has(/ভরা|ভর্তি/) ? 'full' : 'empty'] };
    if (has(/(?<![\u0980-\u09FF])সোনা(?!লি)|স্বর্ণ|গয়না|অলংকার/)) return { kind: 'gold', tx: [h0] };
    if (has(/বাজার|কেনাকাটা|কিনল|কিনতে|শপিং|দাম বেড়|দাম বাড়|দ্রব্যমূল্য/)) return { kind: 'cart', tx: [h0, has(/দাম/) ? 'dear' : ''] };
    if (has(/ল্যাপটপ|কম্পিউটার|অনলাইন|ইন্টারনেট|ফ্রিল্যান্স|ওয়েবসাইট|ইউটিউব|ফেসবুক|প্রোগ্রামিং|কোডিং|ক্লায়েন্ট/)) return { kind: 'laptop', tx: [h0] };
    if (has(/বিদেশ|প্রবাস|বিমান|ফ্লাইট|প্লেনে|সৌদি|দুবাই|কাতার|ওমান|বিমানবন্দর/)) { const cs = COUNTRIES.filter(x => text.indexOf(x) >= 0); return { kind: 'plane', tx: [h0, 'বাংলাদেশ', cs.find(x => x !== 'বাংলাদেশ' && x !== 'ঢাকা') || (has(/সৌদি/) ? 'সৌদি আরব' : has(/কাতার/) ? 'কাতার' : 'বিদেশ')] }; }
    if (has(/রিকশা/)) return { kind: 'vehicle', tx: [h0, 'rickshaw'] };
    if (has(/বাসে|বাস ধর|বাসস্ট্যান্ড|লোকাল বাস/)) return { kind: 'vehicle', tx: [h0, 'bus'] };
    if (has(/ট্রাক/)) return { kind: 'vehicle', tx: [h0, 'truck'] };
    if (has(/গাড়ি|মোটরসাইকেল|বাইক|সিএনজি|অ্যাক্সিডেন্ট|দুর্ঘটনা/)) return { kind: 'vehicle', tx: [h0, 'car'] };
    if (has(/বাড়ি বিক্রি|বাড়ি নিলাম|ভিটে|ভিটেমাটি|বন্ধক/)) return { kind: 'house', tx: [h0, 'sale'] };
    if (has(/নিজের বাড়ি|বাড়িটা|বাড়িতে ফির|বাড়ি ফির|ফ্ল্যাট কিন|বাসা ভাড়া|ভাড়া বাসা/)) return { kind: 'house', tx: [h0] };
    if (has(/ধানক্ষেত|(?<![\u0980-\u09FF])ধান(?![্া])|(?<![\u0980-\u09FF])ক্ষেত|খেতে কাজ|কৃষক|চাষ|ফসল|গ্রামের বাড়ি|গ্রামে/)) return { kind: 'field', tx: [h0] };
    if (has(/বৃষ্টি|ঝড়|বন্যা|বজ্রপাত|বাজ পড়/)) return { kind: 'rain', tx: [h0] };
    if (has(/হাত মেলাল|অংশীদার|পার্টনার|ডিল|বন্ধুত্ব/)) return { kind: 'handshake', tx: [h0] };
    if (has(/দরজা|বের করে দিল|ঘর থেকে বের/)) return { kind: 'door', tx: [h0] };
    if (has(/পরিবার|সংসার|ছেলেমেয়ে|সন্তান|বাবা-মা|মা-বাবা|স্ত্রী-সন্তান/)) return { kind: 'family', tx: [h0] };
    if (has(/(^|\s)বই|পড়াশোনা|পড়াশুনা|লেখাপড়া|পড়ালেখা|লাইব্রেরি/)) return { kind: 'book', tx: [h0] };
    if (has(/মন ভেঙে|বুক ফেটে|বিচ্ছেদ|ছেড়ে চলে গেল|ডিভোর্স|তালাক/)) return { kind: 'heart', tx: [h0, 'broken'] };
    if (has(/ভালোবাস|ভালোবাস|প্রেম|হৃদয়/)) return { kind: 'heart', tx: [h0] };
    if (has(/আইডিয়া|বুদ্ধি এল|মাথায় এল|মাথায় আসে|পরিকল্পনা|প্ল্যান/)) return { kind: 'idea', tx: [h0] };
    if (has(/ধাপে ধাপে|সিঁড়ি|প্রমোশন|পদোন্নতি|উন্নতির/)) return { kind: 'stairs', tx: [h0] };
    if (has(/লক্ষ্য (ছিল|পূরণ|ঠিক)|লক্ষ্যে পৌঁছ|টার্গেট|স্বপ্ন/)) return { kind: 'target', tx: [h0] };
    if (has(/রকেট|হু হু করে|তরতর করে|রাতারাতি|স্টার্টআপ/)) return { kind: 'rocket', tx: [h0] };
    if (has(/সময় ফুরিয়ে|সময় নেই|শেষ সময়|ডেডলাইন|অপেক্ষা|দেরি হয়ে/)) return { kind: 'hourglass', tx: [h0] };
    if (has(/সারা বিশ্ব|বিশ্বজুড়ে|পৃথিবী|দুনিয়া|আন্তর্জাতিক/)) return { kind: 'globe', tx: [h0] };
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
    if (has(/পদত্যাগ|সই|চুক্তি|দলিল/)) return { kind: 'doc', tx: [has(/পদত্যাগ/) ? 'পদত্যাগপত্র' : has(/চুক্তি/) ? 'চুক্তিপত্র' : has(/দলিল/) ? 'দলিল' : 'চিঠি', has(/গোপন/) ? 'গোপন' : ''] };
    if (has(/রিপোর্ট|নথি|কাগজ|ফাইল|ফাইলের|মামলা|নোটিশ/)) return { kind: has(/ফাইল|স্তূপ|মামলা/) ? 'files' : 'doc', tx: [has(/মামলা/) ? 'মামলার ফাইল' : h0 || 'রিপোর্ট', has(/গোপন/) ? 'গোপন' : ''] };
    // everyday things the narration names: show that thing
    const obj = objectFor(text, has, h0); if (obj) return obj;
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
    if (has(/ভোর|সকালবেলা|সূর্য উঠ|সূর্যোদয়/)) return { kind: 'sun', tx: [h0, 'day'] };
    if (has(/গভীর রাত|মাঝরাত|রাতের আকাশ|চাঁদ/)) return { kind: 'sun', tx: [h0, 'night'] };
    return null;
  }
  /* plan every shot: explicit [scene: …] cards always win; old cards (date, doc, counter …) become full-screen pictures;
     narration lines get an automatic picture when a keyword matches; dialogue stays with the characters */
  function plan(story, shots, opt) {
    opt = opt || {}; const kt = !!opt.kt, out = [], maxRun = kt ? 4 : 3, density = kt ? .7 : .55, seed0 = hash(story.title || ''); let run = 0, recent = [], vcount = 0, total = 0; const ins = [];
    const lastStory = (() => { let li = -1; shots.forEach((sh, k) => { const sc = story.scenes[sh.si]; if (sc && sc.type === 'story') li = k; }); return li; })();
    shots.forEach((sh, k) => {
      const sc = story.scenes[sh.si], ln = sc && sc.lines[sh.li]; if (!sc || sc.type !== 'story' || !ln) { out[k] = null; run = 0; return; } total++;
      let v = null; const card = ln.card, explicit = card && card.type === 'scene';
      if (explicit) v = fromCard(card);
      else if (opt.visuals !== false) { if (card) v = fromOldCard(card); else if (!ln.speak && run < maxRun && vcount < density * total + 2) { v = auto(ln, { last: k >= lastStory - 1, kt }); if (v && recent.slice(-2).includes(v.kind)) v = null; } }
      if (v && !KINDS[v.kind]) v = null;
      if (v) { let th = THEME_OF[v.kind]; if (!kt && (th === 'night' || th === 'steel' || th === 'plum')) th = 'ember'; v = { kind: v.kind, tx: (v.tx || []).map(s => String(s == null ? '' : s)), th, seed: (seed0 + k * 7919) >>> 0 }; run++; vcount++; recent.push(v.kind); } else run = 0;
      out[k] = v; sh.vis = v ? v.kind : '';
      // dialogue that names a thing (a plate of rice, a photo on the wall, the hospital …) gets a small picture card beside the speaker
      let iv = null; if (!v && opt.visuals !== false && ln.speak && !card && !ins[k - 1]) { const text = String(ln.cap || ln.say || ''), hl = String(ln.hl || '').split('|').map(clean).filter(Boolean); iv = objectFor(text, re => re.test(text), hl[0] || ''); if (iv && KINDS[iv.kind]) { let th = THEME_OF[iv.kind]; if (!kt && (th === 'night' || th === 'steel' || th === 'plum')) th = 'ember'; iv = { kind: iv.kind, tx: (iv.tx || []).map(s => String(s == null ? '' : s)), th, seed: (seed0 + k * 7919) >>> 0 }; } else iv = null; }
      ins[k] = iv; sh.ins = iv ? iv.kind : '';
    });
    out.ins = ins;
    return out;
  }
  /* draw one visual shot full-frame: o = { FW, FH, u, t, lt, dur, land } */
  function draw(c, v, o) {
    const FW = o.FW, FH = o.FH, T = TH[v.th] || TH.night, fn = KINDS[v.kind]; if (!fn) return;
    const base = { FW, FH, u: o.u, t: o.t, seed: v.seed };
    c.save(); bg(c, base, v.th);
    const ZM = { calendar: 1.08, doc: 1.1, files: 1.08, clock: 1.08, lock: 1.0, phone: 1.06, magnifier: 1.12, building: 1.2, network: 1.08, money: 1.0, route: 1.06, tv: .84, jail: .9, laptop: .95, mosque: .95, stairs: .95 }[v.kind] || 1, sc = ZM * (o.zoom || 1) * Math.min(FW * .94 / 1600, FH * (o.land ? .74 : .5) / 800), cy = FH * (o.cy || (o.land ? .44 : .4)), push = 1 + .035 * C.cl(o.lt / Math.max(1, o.dur));
    c.save(); c.translate(FW / 2, cy); c.scale(sc * push, sc * push);
    try { fn(c, { lt: o.lt, dur: o.dur, t: o.t, tx: v.tx, T, seed: v.seed, FW, FH, u: o.u }); } catch (e) { if (window.LV_DEBUG) console.error("LV " + v.kind + ": " + e.message); /* a broken picture must never stop the export */ }
    c.restore(); grain(c, base);
    if (o.lt < .14) { c.globalAlpha = (1 - o.lt / .14) * .35; c.fillStyle = '#fff'; c.fillRect(0, 0, FW, FH); c.globalAlpha = 1; }
    c.restore();
  }
  /* a small picture card that pops in beside a speaking character: o = { FW, FH, u, t, lt, dur, land, side (1 = right, -1 = left) } */
  function inset(c, v, o) {
    const fn = KINDS[v.kind]; if (!fn) return; const FW = o.FW, FH = o.FH, u = o.u, T = TH[v.th] || TH.night;
    const k = bk(o.lt, .25, .5), out = C.cl((o.dur - o.lt) / .25); if (k <= 0 || out <= 0) return;
    // place it where it covers no face (and not the speaker's bubble): try both top corners, then smaller sizes
    const boxes = (o.heads || []).map(hd => { const r = 100 * hd[2]; return [hd[0] - r, hd[1] - r * 1.2 - (hd[3] ? 300 * u : 0), hd[0] + r, hd[1] + r * 1.1]; });
    let best = null; search: for (const sz of [1, .82, .66, .54]) for (const sd of [o.side || 1, -(o.side || 1)]) for (const row of (o.capBottom ? [0, 1] : [0, 2, 1])) { const w0 = (o.land ? FW * .34 : FW * .64) * sz, h0 = w0 * .62, x0 = sd > 0 ? FW - w0 - 48 * u : 48 * u, y0 = row === 2 ? FH - h0 - 60 * u : row ? (o.land ? FH * .6 - h0 / 2 : FH * .5 - h0 / 2) : o.land ? (sd > 0 ? 110 : 175) * u : FH * .17;
      const hit = boxes.reduce((n, b) => n + (b[2] > x0 && b[0] < x0 + w0 && b[3] > y0 && b[1] < y0 + h0 ? 1 : 0), 0); if (!best || hit < best.hit) best = { w: w0, h: h0, x: x0, y: y0, sd, hit }; if (hit === 0) break search; }
    if (best.hit > 0) return; // no free corner: never cover a face
    const w = best.w, h = best.h, x = best.x, y = best.y, cx = x + w / 2, cy = y + h / 2; o = Object.assign({}, o, { side: best.sd });
    c.save(); c.globalAlpha *= out; c.translate(cx, cy); c.scale(k, k); c.rotate((o.side > 0 ? 1 : -1) * .025); c.translate(-cx, -cy);
    c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 30 * u; c.shadowOffsetY = 10 * u; R(c, x - 9 * u, y - 9 * u, w + 18 * u, h + 18 * u, 28 * u, '#FFFFFF'); c.restore();
    c.save(); c.beginPath(); c.roundRect(x, y, w, h, 20 * u); c.clip(); c.translate(x, y);
    const base = { FW: w, FH: h, u: u * w / FW, t: o.t, seed: v.seed }; bg(c, base, v.th);
    const sc = Math.min(w / 1500, h / 820); c.save(); c.translate(w / 2, h * .5); c.scale(sc, sc);
    try { fn(c, { lt: Math.max(0, o.lt - .25), dur: o.dur, t: o.t, tx: ['', ...v.tx.slice(1)], T, seed: v.seed, FW: w, FH: h, u: base.u }); } catch (e) { }
    c.restore(); c.restore();
    c.restore();
  }
  /* a picture card (white border, rounded, tilted) holding one scene: used by the thumbnail. o = { x, y, w, h, rot, u, t, lt } */
  function card(c, v, o) {
    const fn = KINDS[v.kind]; if (!fn) return; const T = TH[v.th] || TH.night, u = o.u || 1, x = o.x, y = o.y, w = o.w, h = o.h, b = (o.border == null ? 14 : o.border) * u;
    c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(o.rot || 0); c.translate(-w / 2, -h / 2);
    c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 40 * u; c.shadowOffsetY = 16 * u; R(c, -b, -b, w + b * 2, h + b * 2, 30 * u, '#FFFFFF'); c.restore();
    c.save(); c.beginPath(); c.roundRect(0, 0, w, h, 22 * u); c.clip();
    const base = { FW: w, FH: h, u: u * w / 1920, t: o.t || 0, seed: v.seed }; bg(c, base, v.th);
    const sc = Math.min(w / 1480, h / 800) * (o.zoom || 1); c.save(); c.translate(w / 2, h * .52); c.scale(sc, sc);
    try { fn(c, { lt: o.lt == null ? 3 : o.lt, dur: 6, t: o.t || 0, tx: v.tx, T, seed: v.seed, FW: w, FH: h, u: base.u }); } catch (e) { if (window.LV_DEBUG) console.error('LV card ' + v.kind + ': ' + e.message); }
    c.restore(); c.restore(); c.restore();
  }
  return { plan, draw, inset, card, THEME_OF: k => THEME_OF[k] || 'night', objectFor, auto, fromCard, SEC, normKind, kinds: Object.keys(KINDS), has: k => !!KINDS[k], TH, bg, grain };
})();
