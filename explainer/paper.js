/* TF Story Studio — এক্সপ্লেনারি ভিডিওর পেইন্টার ("কাগজের বোর্ডে লেখা")
   Style only (never any channel's content): a plain paper board, no outdoor footage. Every line of narration is written onto the
   board word by word (key words in red with a hand-drawn underline), numbers count up, bars grow, timelines draw themselves,
   small doodle icons pop in. Everything is drawn with the canvas, so it also exports on the phone.
   The engine's LongRenderer calls XP.render() for stories whose format is "long | explainer"; XP.sfx() adds the sound effects. */
window.XP = (() => {
  'use strict';
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const eo = x => 1 - Math.pow(1 - cl(x), 3);
  const eio = x => { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const bk = (t, s, d = .4) => { const x = cl((t - s) / d); if (x <= 0) return 0; const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const fin = (t, s, d) => cl((t - s) / d);
  const BND = '০১২৩৪৫৬৭৮৯';
  const toEn = s => String(s == null ? '' : s).replace(/[০-৯]/g, d => BND.indexOf(d));
  const toBn = s => String(s == null ? '' : s).replace(/\d/g, d => BND[d]);
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
  const FB = () => (typeof FONT_FALLBACK !== 'undefined' ? FONT_FALLBACK : '"Nirmala UI", sans-serif');
  const HEAD = 'TFCap', DISP = 'TFDisp';
  const font = (w, s, fam) => `${w} ${s}px ${fam || HEAD}, ${FB()}`;
  const P = { paper: '#F3EBDB', paper2: '#E8DCC4', card: '#FBF6EA', ink: '#1C2B4B', ink2: '#58657F', acc: '#F07F1D', acc2: '#FFD9A6', red: '#D62F2F', ok: '#2E8B57', blue: '#2F6FDE', mark: 'rgba(255,190,60,.5)', line: 'rgba(28,43,75,.16)' };
  const SEG = [P.ink, P.acc, P.red, P.ok, P.blue, '#8E5BD0'];

  /* ---------- number helpers ---------- */
  const grp = n => { let s = String(Math.round(n)); if (s.length <= 3) return toBn(s); const last = s.slice(-3); let rest = s.slice(0, -3); const parts = []; while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); } if (rest) parts.unshift(rest); return toBn(parts.join(',') + ',' + last); };
  const numOf = s => { const m = toEn(s).replace(/,/g, '').match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };
  /* "৳৬.৫ কোটি" → {pre:'৳', num:6.5, dec:1, suf:' কোটি'} */
  function parseVal(s) {
    s = String(s == null ? '' : s).trim(); const m = s.match(/^([^\d০-৯]*)([০-৯\d][০-৯\d,]*(?:\.[০-৯\d]+)?)(.*)$/);
    if (!m) return { pre: '', num: NaN, dec: 0, suf: '', raw: s };
    const n = toEn(m[2]).replace(/,/g, ''); const dec = (n.split('.')[1] || '').length;
    return { pre: m[1], num: parseFloat(n), dec, suf: m[3], raw: s, comma: /,/.test(m[2]) };
  }
  function fmtVal(v, x) { // x in 0..1 of the final number
    if (!isFinite(v.num)) return v.raw;
    const cur = v.num * x; let s;
    if (v.dec) s = toBn(cur.toFixed(v.dec)); else s = (v.comma || v.num >= 10000) ? grp(cur) : toBn(String(Math.round(cur)));
    return v.pre + s + v.suf;
  }
  const items = card => String((card && card.text) || '').split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean);
  const kv = s => { const m = String(s).match(/^(.*?)\s*[=＝]\s*(.*)$/); return m ? [m[1].trim(), m[2].trim()] : [String(s).trim(), '']; };

  /* ---------- paper background ---------- */
  const _bg = {};
  function paperBg(FW, FH) {
    const key = FW + 'x' + FH; if (_bg[key]) return _bg[key];
    const cv = document.createElement('canvas'); cv.width = FW; cv.height = FH; const c = cv.getContext('2d', { alpha: false });
    c.fillStyle = P.paper; c.fillRect(0, 0, FW, FH);
    const g = c.createRadialGradient(FW / 2, FH * .45, Math.min(FW, FH) * .3, FW / 2, FH / 2, Math.max(FW, FH) * .75); g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(1, 'rgba(120,90,40,.16)'); c.fillStyle = g; c.fillRect(0, 0, FW, FH);
    const r = rng(7), step = Math.round(Math.min(FW, FH) / 18); c.fillStyle = 'rgba(28,43,75,.07)'; // faint dotted notebook grid
    for (let y = step; y < FH; y += step) for (let x = step; x < FW; x += step) c.fillRect(x - 1.5, y - 1.5, 3, 3);
    for (let i = 0; i < FW * FH / 900; i++) { c.fillStyle = r() > .5 ? 'rgba(110,80,30,.06)' : 'rgba(255,255,255,.12)'; c.fillRect(r() * FW, r() * FH, 2, 2); } // paper grain
    return (_bg[key] = cv);
  }

  /* ---------- hand-drawn strokes ---------- */
  function wobble(c, x1, y1, x2, y2, p, col, lw, seed) {
    if (p <= 0) return; const n = Math.max(6, Math.round(Math.hypot(x2 - x1, y2 - y1) / 26)), r = rng(hash(seed || 'w')); c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x1, y1);
    const m = Math.max(1, Math.floor(n * cl(p))); for (let i = 1; i <= m; i++) { const f = i / n, a = Math.min(1, f); c.lineTo(x1 + (x2 - x1) * a + (r() - .5) * lw * .6, y1 + (y2 - y1) * a + (r() - .5) * lw * 1.1); }
    if (p < 1) { const f = cl(p); c.lineTo(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f); } else c.lineTo(x2, y2); c.stroke(); c.restore();
  }
  const rrect = (c, x, y, w, h, r, fill, stroke, lw) => { c.beginPath(); c.roundRect(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 4; c.stroke(); } };
  const disc = (c, x, y, r, fill, stroke, lw) => { c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 4; c.stroke(); } };
  const alpha = (c, a, fn) => { if (a <= 0) return; c.save(); c.globalAlpha *= cl(a); fn(); c.restore(); };
  const pop = (c, x, y, k, fn) => { if (k <= 0) return; c.save(); c.translate(x, y); c.scale(k, k); c.translate(-x, -y); c.globalAlpha *= cl(k * 1.4); fn(); c.restore(); };
  function say(c, s, x, y, size, col, weight, align, fam, maxW) {
    c.font = font(weight || 700, size, fam); c.textAlign = align || 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = col || P.ink;
    if (maxW) { let sz = size; while (sz > 14 && c.measureText(s).width > maxW) { sz -= 2; c.font = font(weight || 700, sz, fam); } }
    c.fillText(s, x, y);
  }
  function wrap(c, s, size, maxW, weight, fam) {
    c.font = font(weight || 700, size, fam); const ws = String(s).split(/\s+/).filter(Boolean), out = []; let cur = '';
    for (const w of ws) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
    if (cur) out.push(cur); return out;
  }
  const shadowCard = (c, x, y, w, h, rad, u, fill) => { c.save(); c.shadowColor = 'rgba(40,30,10,.28)'; c.shadowBlur = 26 * u; c.shadowOffsetY = 10 * u; rrect(c, x, y, w, h, rad, fill || P.card); c.restore(); rrect(c, x, y, w, h, rad, null, P.line, 2 * u); };

  /* ---------- doodle icons (unit box −50…50) ---------- */
  const O = (c, lw) => { c.strokeStyle = P.ink; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; };
  const ICONS = {
    bank(c) { c.fillStyle = P.acc2; c.beginPath(); c.moveTo(-44, -16); c.lineTo(0, -44); c.lineTo(44, -16); c.closePath(); c.fill(); c.stroke(); [-30, -10, 10, 30].forEach(x => { c.fillStyle = '#fff'; c.fillRect(x - 6, -10, 12, 38); c.strokeRect(x - 6, -10, 12, 38); }); c.fillStyle = P.ink2; c.fillRect(-44, 32, 88, 9); c.strokeRect(-44, 32, 88, 9); },
    coin(c) { c.fillStyle = '#FFCB45'; c.beginPath(); c.arc(0, 0, 40, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(0, 0, 28, 0, 7); c.stroke(); c.fillStyle = P.ink; c.font = font(800, 40); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('৳', 0, 3); },
    note(c) { c.fillStyle = '#CDE9BE'; c.beginPath(); c.roundRect(-46, -26, 92, 52, 7); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 14, 0, 7); c.fill(); c.stroke(); [[-34, -14], [34, 14]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 4, 0, 7); c.stroke(); }); },
    phone(c) { c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-24, -44, 48, 88, 10); c.fill(); c.stroke(); c.fillStyle = P.acc2; c.fillRect(-17, -32, 34, 56); c.beginPath(); c.arc(0, 34, 4, 0, 7); c.stroke(); c.beginPath(); c.moveTo(-6, -38); c.lineTo(6, -38); c.stroke(); },
    building(c) { c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-28, -44, 56, 88, 4); c.fill(); c.stroke(); c.fillStyle = P.acc2; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) c.fillRect(-18 + i * 14, -34 + j * 17, 9, 10); c.fillStyle = P.ink2; c.fillRect(-7, 24, 14, 20); },
    people(c) { c.fillStyle = P.acc2; c.beginPath(); c.arc(-16, -18, 13, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(18, -10, 11, 0, 7); c.fillStyle = '#fff'; c.fill(); c.stroke(); c.fillStyle = P.acc2; c.beginPath(); c.moveTo(-42, 36); c.quadraticCurveTo(-16, -8, 10, 36); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, 36); c.quadraticCurveTo(18, 2, 42, 36); c.closePath(); c.fill(); c.stroke(); },
    gavel(c) { c.save(); c.rotate(-.6); c.fillStyle = P.acc; c.beginPath(); c.roundRect(-26, -34, 52, 24, 5); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-5, -10, 10, 56, 4); c.fill(); c.stroke(); c.restore(); c.fillStyle = P.ink2; c.beginPath(); c.roundRect(-38, 36, 76, 10, 4); c.fill(); c.stroke(); },
    doc(c) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-30, -44); c.lineTo(12, -44); c.lineTo(30, -26); c.lineTo(30, 44); c.lineTo(-30, 44); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(12, -44); c.lineTo(12, -26); c.lineTo(30, -26); c.stroke(); for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-19, -10 + i * 14); c.lineTo(i === 3 ? 4 : 19, -10 + i * 14); c.stroke(); } },
    warning(c) { c.fillStyle = '#FFCB45'; c.beginPath(); c.moveTo(0, -44); c.lineTo(46, 36); c.lineTo(-46, 36); c.closePath(); c.fill(); c.stroke(); c.fillStyle = P.ink; c.fillRect(-4, -16, 8, 28); c.beginPath(); c.arc(0, 24, 5, 0, 7); c.fill(); },
    chart_up(c) { [[-34, 14], [-12, 0], [10, -16], [32, -34]].forEach(([x, h], i) => { c.fillStyle = i === 3 ? P.ok : P.acc2; c.beginPath(); c.roundRect(x - 9, h, 18, 44 - h, 3); c.fill(); c.stroke(); }); c.strokeStyle = P.ok; c.lineWidth = 6; c.beginPath(); c.moveTo(-40, -6); c.lineTo(-8, -26); c.lineTo(8, -14); c.lineTo(38, -42); c.stroke(); c.beginPath(); c.moveTo(24, -42); c.lineTo(38, -42); c.lineTo(38, -28); c.stroke(); },
    chart_down(c) { [[-34, -30], [-12, -14], [10, 0], [32, 18]].forEach(([x, h], i) => { c.fillStyle = i === 3 ? P.red : P.acc2; c.beginPath(); c.roundRect(x - 9, h, 18, 44 - h, 3); c.fill(); c.stroke(); }); c.strokeStyle = P.red; c.lineWidth = 6; c.beginPath(); c.moveTo(-40, -42); c.lineTo(-8, -22); c.lineTo(8, -32); c.lineTo(38, -6); c.stroke(); c.beginPath(); c.moveTo(38, -20); c.lineTo(38, -6); c.lineTo(24, -6); c.stroke(); },
    clock(c) { c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 42, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, -26); c.lineTo(0, 0); c.lineTo(20, 12); c.stroke(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.moveTo(Math.sin(a) * 34, -Math.cos(a) * 34); c.lineTo(Math.sin(a) * 38, -Math.cos(a) * 38); c.stroke(); } },
    calendar(c) { c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-40, -38, 80, 80, 8); c.fill(); c.stroke(); c.fillStyle = P.red; c.beginPath(); c.roundRect(-40, -38, 80, 24, [8, 8, 0, 0]); c.fill(); c.stroke(); [-20, 20].forEach(x => { c.beginPath(); c.moveTo(x, -46); c.lineTo(x, -30); c.stroke(); }); c.fillStyle = P.acc2; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) c.fillRect(-28 + i * 20, -4 + j * 20, 12, 12); },
    box(c) { c.fillStyle = '#E8C48A'; c.beginPath(); c.moveTo(0, -42); c.lineTo(42, -22); c.lineTo(0, -2); c.lineTo(-42, -22); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#D6A865'; c.beginPath(); c.moveTo(-42, -22); c.lineTo(0, -2); c.lineTo(0, 44); c.lineTo(-42, 22); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#C79651'; c.beginPath(); c.moveTo(42, -22); c.lineTo(0, -2); c.lineTo(0, 44); c.lineTo(42, 22); c.closePath(); c.fill(); c.stroke(); },
    truck(c) { c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-46, -24, 52, 42, 4); c.fill(); c.stroke(); c.fillStyle = P.acc2; c.beginPath(); c.moveTo(6, -12); c.lineTo(28, -12); c.lineTo(46, 4); c.lineTo(46, 18); c.lineTo(6, 18); c.closePath(); c.fill(); c.stroke(); [-26, 26].forEach(x => { c.fillStyle = P.ink; c.beginPath(); c.arc(x, 22, 9, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, 22, 3, 0, 7); c.fill(); }); },
    question(c) { c.fillStyle = P.acc2; c.beginPath(); c.arc(0, 0, 42, 0, 7); c.fill(); c.stroke(); c.fillStyle = P.ink; c.font = font(800, 62); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 0, 4); },
    shield(c) { c.fillStyle = P.acc2; c.beginPath(); c.moveTo(0, -44); c.lineTo(38, -30); c.lineTo(34, 8); c.quadraticCurveTo(28, 32, 0, 46); c.quadraticCurveTo(-28, 32, -34, 8); c.lineTo(-38, -30); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = P.ok; c.lineWidth = 8; c.beginPath(); c.moveTo(-16, 2); c.lineTo(-4, 14); c.lineTo(18, -12); c.stroke(); },
    lock(c) { c.beginPath(); c.arc(0, -14, 20, Math.PI, 0); c.lineWidth = 8; c.stroke(); c.lineWidth = 5; c.fillStyle = '#FFCB45'; c.beginPath(); c.roundRect(-30, -12, 60, 50, 8); c.fill(); c.stroke(); c.fillStyle = P.ink; c.beginPath(); c.arc(0, 10, 6, 0, 7); c.fill(); c.fillRect(-2.5, 12, 5, 14); },
    bulb(c) { c.fillStyle = '#FFE27A'; c.beginPath(); c.arc(0, -12, 28, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-14, 14, 28, 24, 4); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-14, 26); c.lineTo(14, 26); c.stroke(); [[-42, -14], [42, -14], [-34, -38], [34, -38]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x * .8, y * .8); c.lineTo(x, y); c.stroke(); }); },
    cart(c) { c.fillStyle = P.acc2; c.beginPath(); c.moveTo(-42, -30); c.lineTo(-30, -30); c.lineTo(-18, 14); c.lineTo(28, 14); c.lineTo(38, -16); c.lineTo(-26, -16); c.fill(); c.stroke(); [-12, 20].forEach(x => { c.fillStyle = P.ink; c.beginPath(); c.arc(x, 30, 7, 0, 7); c.fill(); }); },
    mail(c) { c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-44, -28, 88, 56, 6); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-44, -26); c.lineTo(0, 6); c.lineTo(44, -26); c.stroke(); },
    bell(c) { c.fillStyle = '#FFCB45'; c.beginPath(); c.moveTo(-34, 22); c.quadraticCurveTo(-30, 18, -28, -4); c.quadraticCurveTo(-26, -34, 0, -36); c.quadraticCurveTo(26, -34, 28, -4); c.quadraticCurveTo(30, 18, 34, 22); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.arc(0, 30, 7, 0, 7); c.fill(); c.stroke(); },
    scale(c) { c.beginPath(); c.moveTo(0, -40); c.lineTo(0, 36); c.moveTo(-38, -26); c.lineTo(38, -26); c.stroke(); [-38, 38].forEach(x => { c.beginPath(); c.moveTo(x, -26); c.lineTo(x - 16, 4); c.lineTo(x + 16, 4); c.closePath(); c.stroke(); c.fillStyle = P.acc2; c.beginPath(); c.moveTo(x - 20, 4); c.lineTo(x + 20, 4); c.quadraticCurveTo(x, 22, x - 20, 4); c.fill(); c.stroke(); }); c.fillStyle = P.ink2; c.beginPath(); c.roundRect(-20, 34, 40, 8, 3); c.fill(); },
    percent(c) { c.fillStyle = P.acc2; c.beginPath(); c.arc(0, 0, 42, 0, 7); c.fill(); c.stroke(); c.fillStyle = P.ink; c.font = font(800, 54); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('%', 0, 4); }
  };
  const ICON_RX = [
    ['bank', /ব্যাংক|ব্যাঙ্ক|লাইসেন্স|ডিজিটাল ব্যাংক|রিজার্ভ/], ['gavel', /আদালত|মামলা|হাইকোর্ট|আপিল|রিট|বিচার|আইন|দুদক|জব্দ|রায়/], ['warning', /ঝুঁকি|সতর্ক|অনিয়ম|জালিয়াতি|অভিযোগ|প্রতারণা|ভুয়া|দুর্নীতি/],
    ['chart_down', /লোকসান|পতন|কমে|কমল|ক্ষতি|ধস|ছাঁটাই|বন্ধ করে/], ['chart_up', /মুনাফা|লাভ|বেড়ে|বাড়ল|বৃদ্ধি|প্রবৃদ্ধি|রেকর্ড|উত্থান/], ['percent', /শতাংশ|ভাগ|কমিশন|সুদ|চার্জ|ভ্যাট/],
    ['coin', /টাকা|কোটি|লাখ|ডলার|দাম|খরচ|আয়|বেতন|বিনিয়োগ/], ['phone', /ফোন|মোবাইল|অ্যাপ|ওয়ালেট|অনলাইন|ডিজিটাল/], ['truck', /ডেলিভারি|হাব|পৌঁছে|ডেলিভারি|পরিবহন/], ['box', /পণ্য|অর্ডার|প্যাকেজ|পার্সেল/], ['cart', /বিক্রি|কেনা|ক্রেতা|বাজার|ই-কমার্স|দোকান/],
    ['people', /গ্রাহক|মানুষ|কর্মী|এজেন্ট|ব্যবহারকারী|দর্শক|পরিবার|ভাতা|শিক্ষার্থী/], ['building', /কোম্পানি|প্রতিষ্ঠান|অফিস|মালিক|সংস্থা|গ্রুপ|বোর্ড/], ['doc', /চুক্তি|নথি|প্রতিবেদন|রিপোর্ট|হিসাব|আর্থিক|অডিট|আবেদন/], ['mail', /ডাক|চিঠি|মেসেজ|ইমেইল/],
    ['shield', /বিশ্বাস|সরকারি|নিরাপদ|নিরাপত্তা|সুরক্ষা|অনুমোদন/], ['lock', /স্থগিত|আটকে|তালা|নিষেধ|জব্দ/], ['clock', /সময়|ঘণ্টা|ঘন্টা|দিন|মাস|বছর|সাল|শুরু/], ['calendar', /তারিখ|আগস্ট|জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|জুন|জুলাই|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর/],
    ['scale', /বনাম|তুলনা|পাশাপাশি|ফারাক|ভারসাম্য/], ['bulb', /শিক্ষা|আইডিয়া|কৌশল|উপায|উপায়|বুঝতে|মনে রাখ/], ['question', /কেন|কীভাবে|কিভাবে|কী|কোন|প্রশ্ন/]
  ];
  function iconFor(text) { const s = String(text || ''); for (const [k, rx] of ICON_RX) if (rx.test(s)) return k; return ''; }
  function drawIcon(c, name, x, y, size) {
    c.save(); c.translate(x, y); const s = size / 100; c.scale(s, s); O(c, 5.5 / 1);
    if (ICONS[name]) ICONS[name](c); else if (name) { c.font = `${72}px "Noto Color Emoji", "Segoe UI Emoji", ${FB()}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, 0, 4); }
    c.restore();
  }
  function sticker(c, x, y, R, name, lt, delay) {
    const k = bk(lt, delay || 0, .5); if (k <= 0) return; const bob = Math.sin(lt * 2.4) * R * .04;
    pop(c, x, y, k, () => { c.save(); c.translate(x, y + bob); c.rotate(Math.sin(lt * 1.3) * .03 - .05); disc(c, R * .07, R * .09, R, 'rgba(28,43,75,.13)'); disc(c, 0, 0, R, P.card, P.ink, R * .045); disc(c, 0, 0, R * .86, P.acc2 + '88'); drawIcon(c, name, 0, 0, R * 1.25); c.restore(); });
  }

  /* ---------- word layout ---------- */
  function layout(r, words, size, maxW, maxRows, minSize) {
    const c = r._xc || (r._xc = document.createElement('canvas').getContext('2d'));
    const lay = sz => { c.font = font(700, sz); const sp = c.measureText(' ').width * .95, rows = [{ it: [], w: 0 }];
      words.forEach((w, i) => { const ww = c.measureText(w.w).width; let row = rows[rows.length - 1]; if (row.it.length && row.w + sp + ww > maxW) { rows.push({ it: [], w: 0 }); row = rows[rows.length - 1]; } row.it.push({ i, ww, x: row.w ? row.w + sp : 0 }); row.w += (row.w ? sp : 0) + ww; });
      return { rows, sp, size: sz }; };
    let L = lay(size); while (L.rows.length > maxRows && L.size > minSize) L = lay(L.size - 3); return L;
  }

  /* kinetic text block: every word lands on its beat; key words turn red and get a hand-drawn underline */
  function drawWords(r, c, k, t, L, cx, top, opt) {
    opt = opt || {}; const words = r.words[k], u = r.u, sz = L.size, lh = sz * 1.34, align = opt.align || 'center', seed = hash(r.story.title + k);
    L.rows.forEach((row, ri) => {
      const x0 = align === 'left' ? cx : cx - row.w / 2, base = top + lh * (ri + .8);
      row.it.forEach(it => {
        const w = words[it.i], lt = t - w.t0, kk = bk(lt, 0, .34); if (kk <= 0) return;
        const x = x0 + it.x, hl = w.hl, col = hl ? P.red : (w.num ? P.acc : (opt.col || P.ink));
        c.save(); c.translate(x + it.ww / 2, base - sz * .3); c.scale(.7 + .3 * kk, .7 + .3 * kk); c.globalAlpha *= cl(kk * 1.6); c.translate(-(x + it.ww / 2), -(base - sz * .3) + (1 - cl(kk)) * sz * .22);
        c.font = font(700, sz); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = col; c.fillText(w.w, x, base); c.restore();
        if (hl) { const p = eo((lt - .12) / .38); if (p > 0) wobble(c, x - 4 * u, base + sz * .13, x + it.ww * p + 2 * u, base + sz * .13 + (it.i % 2 ? 3 : -2) * u, 1, P.acc, Math.max(4, sz * .07), 'u' + seed + it.i); }
      });
    });
  }

  /* ---------- text board: the line itself, large, with an optional doodle icon ---------- */
  function pickMode(r, k, ln, words, icon, stage) {
    r._xm = r._xm || {}; if (r._xm[k]) return r._xm[k];
    const hlw = words.filter(w => w.hl), numHl = hlw.some(w => w.num), n = words.length, h = hash(r.story.title + ':' + k), prev = r._xm[k - 1] || '';
    let m;
    if (numHl && n >= 3 && n <= 14) m = 'hero';
    else if (hlw.length && n >= 4 && hlw.length <= 3 && h % 5 < 2 && !stage) m = 'hero';
    else if (stage) m = 'stage';
    else if (r.land && icon && h % 3 !== 0) m = 'side';
    else m = 'center';
    if (m !== 'stage') { if (m === prev && m !== 'center') m = 'center'; else if (m === 'center' && prev === 'center' && icon && r.land) m = 'side'; }
    return (r._xm[k] = m);
  }
  function textBoard(r, c, k, t, o) {
    o = o || {}; const FW = r.FW, FH = r.FH, u = r.u, land = r.land, sh = r.tl.shots[k], sc = r.story.scenes[sh.si], ln = sc.lines[sh.li], words = r.words[k], lt = t - sh.start;
    const icon = o.icon || iconFor(ln.cap + ' ' + (ln.hl || '')), stg = o.stage || null, mode = pickMode(r, k, ln, words, icon, !!stg);
    const key = k + ':' + r.fkey + ':' + mode; r._xl = r._xl || {}; let B = r._xl[key];
    if (!B) {
      if (mode === 'hero') {
        const hlIdx = []; words.forEach((w, i) => { if (w.hl) hlIdx.push(i); });
        // the first run of highlighted words becomes the giant word
        let a = hlIdx[0], b = a; for (let j = 1; j < hlIdx.length; j++) { if (hlIdx[j] === b + 1) b = hlIdx[j]; else break; }
        const hero = words.slice(a, b + 1), rest = words.filter((w, i) => i < a || i > b);
        const hw = hero.map(w => w.w).join(' '), c0 = r._xc || (r._xc = document.createElement('canvas').getContext('2d'));
        let hs = (land ? 250 : 200) * u; c0.font = font(800, hs, DISP); while (c0.measureText(hw).width > FW * (land ? .78 : .88) && hs > 60 * u) { hs -= 6 * u; c0.font = font(800, hs, DISP); }
        const restL = rest.length ? layout(r, rest, (land ? 70 : 68) * u, FW * (land ? .74 : .86), land ? 3 : 4, 40 * u) : null;
        B = { mode, a, b, hs, hw, restL, restIdx: words.map((w, i) => i).filter(i => i < a || i > b) };
      } else {
        const side = mode === 'side', stage = mode === 'stage', maxW = FW * (stage ? (land ? .43 : .86) : side ? .5 : (land ? .74 : .86)), base = (land ? (stage ? 84 : side ? 92 : 108) : (stage ? 84 : 100)) * u;
        B = { mode, L: layout(r, words, base, maxW, stage && land ? 5 : land ? 3 : 5, 40 * u) };
      }
      r._xl[key] = B; const ks = Object.keys(r._xl); if (ks.length > 60) delete r._xl[ks[0]];
    }
    const t0 = words.length ? words[0].t0 : sh.start;
    if (B.mode === 'hero') {
      const hs = B.hs, restH = B.restL ? B.restL.rows.length * B.restL.size * 1.34 : 0, total = hs * 1.15 + (restH ? restH + 30 * u : 0), top = (o.cy != null ? o.cy : FH * .47) - total / 2;
      // giant word (own timing = first highlighted word)
      const w0 = words[B.a], lw = t - w0.t0, kk = bk(lw, 0, .5);
      if (kk > 0) { const cx = FW / 2, base = top + hs * .92; c.save(); c.translate(cx, base - hs * .35); c.scale(.55 + .45 * kk, .55 + .45 * kk); c.globalAlpha *= cl(kk * 1.5); c.translate(-cx, -(base - hs * .35)); c.font = font(800, hs, DISP); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        const numeric = /[০-৯\d]/.test(B.hw); c.fillStyle = numeric ? P.acc : P.red; c.fillText(B.hw, cx, base); const ww = c.measureText(B.hw).width; c.restore();
        wobble(c, cx - ww / 2 - 6 * u, base + hs * .12, cx - ww / 2 + (ww + 12 * u) * eo((lw - .15) / .45), base + hs * .12 + 3 * u, 1, P.ink, Math.max(6 * u, hs * .035), 'h' + k);
        if (numeric) { const sk = eo((lw - .3) / .5); if (sk > 0) for (let i = 0; i < 3; i++) { const a = -.8 + i * .8; wobble(c, cx + ww / 2 + 30 * u + i * 4 * u, base - hs * .8 + i * 26 * u, cx + ww / 2 + (30 + 40 * sk) * u + i * 4 * u, base - hs * .8 + i * 26 * u - 14 * u * sk, 1, P.acc, 6 * u, 'sp' + i + k); } } }
      if (B.restL) { const L = B.restL, words2 = words; const sub = { words: words2 }; let ri2 = 0;
        L.rows.forEach((row, ri) => { const base2 = top + hs * 1.15 + 30 * u + L.size * 1.34 * (ri + .8);
          row.it.forEach(it => { const w = words[B.restIdx[it.i]], lw2 = t - w.t0, k2 = bk(lw2, 0, .34); if (k2 <= 0) return; const x = FW / 2 - row.w / 2 + it.x;
            c.save(); c.translate(x + it.ww / 2, base2 - L.size * .3); c.scale(.7 + .3 * k2, .7 + .3 * k2); c.globalAlpha *= cl(k2 * 1.6); c.translate(-(x + it.ww / 2), -(base2 - L.size * .3)); c.font = font(700, L.size); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = w.num ? P.acc : P.ink; c.fillText(w.w, x, base2); c.restore(); }); }); }
      if (icon && land && !o.noIcon) sticker(c, FW * .88, FH * .2, 80 * u, icon, lt, .25);
      return;
    }
    const L = B.L, hgt = L.rows.length * L.size * 1.34;
    if (B.mode === 'stage') {
      if (land) { const onLeft = !!(stg && stg.left), left = onLeft ? FW * .5 : FW * .07, top = FH * .5 - hgt / 2;
        drawWords(r, c, k, t, L, left, top, { align: 'left' }); wobble(c, left, top + hgt + 14 * u, left + 220 * u * eo((lt - .5) / .5), top + hgt + 14 * u, 1, P.acc, 7 * u, 'l' + k); }
      else { const top = FH * .13 + Math.max(0, (FH * .36 - hgt) / 2); drawWords(r, c, k, t, L, FW / 2, top, { align: 'center' }); }
      return;
    }
    if (B.mode === 'side') {
      const left = FW * .08, top = (o.cy != null ? o.cy : FH * .5) - hgt / 2; drawWords(r, c, k, t, L, left, top, { align: 'left' });
      if (icon) sticker(c, FW * .79, FH * .47, Math.min(FH * .24, 230 * u), icon, lt, .15);
      wobble(c, left, top + hgt + 14 * u, left + 220 * u * eo((lt - .5) / .5), top + hgt + 14 * u, 1, P.acc, 7 * u, 'l' + k);
    } else {
      const withIcon = icon && !o.noIcon, ih = withIcon ? (land ? 190 : 230) * u : 0, top = (o.cy != null ? o.cy : FH * (land ? .5 : .5)) - (hgt + ih) / 2 + ih;
      drawWords(r, c, k, t, L, FW / 2, top, { align: 'center' });
      if (withIcon) sticker(c, FW / 2, top - ih * .52, (land ? 78 : 92) * u, icon, lt, .1);
    }
  }

  /* ---------- caption under a card board ---------- */
  function caption(r, c, k, t) {
    const S = r.settings || {}; if (S.captions === false) return; const FW = r.FW, FH = r.FH, u = r.u, sh = r.tl.shots[k], ln = r.story.scenes[sh.si].lines[sh.li], lt = t - sh.start;
    const a = fin(lt, .05, .3); if (a <= 0) return; const size = (r.land ? 46 : 52) * u, rows = wrap(c, ln.cap, size, FW * (r.land ? .8 : .88), 700).slice(0, 2), hl = new Set(String(ln.hl || '').split('|').flatMap(h => h.split(/\s+/)).map(w => w.replace(/[।,.!?“”"'‘’:;()]/g, '')).filter(Boolean));
    const lh = size * 1.3, h = rows.length * lh + 28 * u, y = FH - (r.land ? 70 : 150) * u - h;
    alpha(c, a, () => { c.save(); c.translate(0, (1 - a) * 14 * u); let wmax = 0; rows.forEach(rw => { wmax = Math.max(wmax, c.measureText(rw).width); }); rrect(c, FW / 2 - wmax / 2 - 30 * u, y, wmax + 60 * u, h, 18 * u, 'rgba(251,246,234,.94)', P.line, 2 * u);
      rows.forEach((rw, ri) => { c.font = font(700, size); const sp = c.measureText(' ').width, ws = rw.split(' '), tot = c.measureText(rw).width; let x = FW / 2 - tot / 2; ws.forEach(w => { const cw = c.measureText(w).width; c.textAlign = 'left'; c.fillStyle = hl.has(w.replace(/[।,.!?“”"'‘’:;()]/g, '')) ? P.red : P.ink; c.fillText(w, x, y + 14 * u + lh * (ri + .8)); x += cw + sp; }); }); c.restore(); });
  }

  /* ---------- card boards ---------- */
  function boardTitle(c, r, text, lt, y) { if (!text) return; const u = r.u, FW = r.FW; alpha(c, fin(lt, 0, .3), () => say(c, text, FW / 2, y, (r.land ? 58 : 56) * u, P.ink2, 700, 'center', HEAD, FW * .84)); }

  function statBoard(r, c, card, lt, sh) {
    const FW = r.FW, FH = r.FH, u = r.u, land = r.land; let valStr, label, kicker = '';
    if (card.type === 'counter') { const to = parseVal(String(card.prefix || '') + card.to + String(card.suffix || '')); valStr = to; label = card.label || ''; const fr = numOf(card.from); to.from = isFinite(fr) ? fr : 0; }
    else { const it = items(card); valStr = parseVal(it[0] || ''); label = it[1] || ''; kicker = it[2] || ''; valStr.from = 0; }
    const v = valStr, x = eo((lt - .25) / 1.15), fromN = v.from || 0; let shown;
    if (isFinite(v.num)) { const cur = fromN + (v.num - fromN) * x; const s = v.dec ? toBn(cur.toFixed(v.dec)) : ((v.comma || v.num >= 10000) ? grp(cur) : toBn(String(Math.round(cur)))); shown = v.pre + s + v.suf; } else shown = v.raw;
    let sz = (land ? 280 : 210) * u; c.font = font(800, sz, DISP); const full = v.pre + (isFinite(v.num) ? (v.dec ? toBn(v.num.toFixed(v.dec)) : ((v.comma || v.num >= 10000) ? grp(v.num) : toBn(String(Math.round(v.num))))) : '') + v.suf || v.raw; while (c.measureText(full).width > FW * .86 && sz > 60 * u) { sz -= 8 * u; c.font = font(800, sz, DISP); }
    const cy = FH * (land ? .42 : .4), kk = bk(lt, .05, .5);
    if (kicker) alpha(c, fin(lt, 0, .3), () => say(c, kicker, FW / 2, cy - sz * .78, 54 * u, P.ink2, 700));
    pop(c, FW / 2, cy, kk, () => { c.font = font(800, sz, DISP); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = P.acc; c.fillText(shown, FW / 2, cy + sz * .3); });
    const ww = c.measureText(full).width; wobble(c, FW / 2 - ww / 2, cy + sz * .46, FW / 2 - ww / 2 + ww * eo((lt - .5) / .5), cy + sz * .46 + 3 * u, 1, P.ink, 9 * u, 'st' + sh);
    if (label) alpha(c, fin(lt, .55, .4), () => { c.save(); c.translate(0, (1 - fin(lt, .55, .4)) * 22 * u); say(c, label, FW / 2, cy + sz * .46 + 112 * u, (land ? 78 : 70) * u, P.ink, 700, 'center', HEAD, FW * .86); c.restore(); });
    const ic = card.icon || iconFor(label); if (ic && land) sticker(c, FW * .12, FH * .2, 70 * u, ic, lt, .35);
  }

  function barsBoard(r, c, card, lt, sh) {
    const FW = r.FW, FH = r.FH, u = r.u, land = r.land, it = items(card); let title = ''; const bars = [];
    it.forEach(s => { const [a, b] = kv(s); if (b === '' && !bars.length && !title && !isFinite(numOf(a))) title = a; else bars.push({ l: a, vs: b, v: numOf(b) }); });
    const data = bars.filter(b => isFinite(b.v)).slice(0, 7); if (!data.length) return; boardTitle(c, r, title, lt, FH * (land ? .17 : .2));
    const mx = Math.max(...data.map(d => d.v)) || 1, bw = Math.min(150 * u, (FW * (land ? .78 : .86)) / (data.length * 1.45)), gap = bw * .45, tot = data.length * bw + (data.length - 1) * gap, x0 = FW / 2 - tot / 2, base = FH * (land ? .8 : .72), maxH = FH * (land ? .5 : .42);
    wobble(c, x0 - 30 * u, base, x0 + tot + 30 * u, base, eo(lt / .4), P.ink, 6 * u, 'bb');
    data.forEach((d, i) => { const p = eo((lt - .3 - i * .16) / .6), h = maxH * (d.v / mx) * p, x = x0 + i * (bw + gap), last = i === data.length - 1, col = last ? P.red : SEG[i % 2 ? 0 : 1];
      if (p > 0) { rrect(c, x, base - h, bw, h, [10 * u, 10 * u, 0, 0], last ? P.red : (i % 2 ? P.ink : P.acc)); c.save(); rrect(c, x, base - h, bw, h, [10 * u, 10 * u, 0, 0], null, P.ink, 3 * u); c.restore();
        const num = parseVal(d.vs); const vs = isFinite(num.num) ? fmtVal(num, p) : d.vs; say(c, vs, x + bw / 2, base - h - 16 * u, 46 * u, P.ink, 800, 'center', HEAD, bw * 1.6); }
      alpha(c, fin(lt, .3 + i * .16, .3), () => say(c, d.l, x + bw / 2, base + 52 * u, 38 * u, P.ink2, 700, 'center', HEAD, bw * 1.5)); });
  }

  function timelineBoard(r, c, card, lt, sh) {
    const FW = r.FW, FH = r.FH, u = r.u, land = r.land, it = items(card).slice(0, 6).map(s => kv(s)); if (!it.length) return; const n = it.length;
    if (land) { const x0 = FW * .1, x1 = FW * .9, y = FH * .5, step = n > 1 ? (x1 - x0) / (n - 1) : 0;
      wobble(c, x0 - 40 * u, y, x0 - 40 * u + (x1 - x0 + 80 * u) * eo(lt / (.5 + n * .35)), y, 1, P.ink, 8 * u, 'tl');
      it.forEach(([a, b], i) => { const x = n > 1 ? x0 + step * i : FW / 2, d = .25 + i * .35, k = bk(lt, d, .45); if (k <= 0) return; const up = i % 2 === 0;
        pop(c, x, y, k, () => { disc(c, x, y, 20 * u, i === n - 1 ? P.red : P.acc, P.ink, 5 * u);
          say(c, a, x, up ? y - 62 * u : y + 100 * u, 64 * u, i === n - 1 ? P.red : P.ink, 800, 'center', DISP, step * .9 || FW * .5);
          if (b) wrap(c, b, 38 * u, Math.min(step * .9, 420 * u) || 520 * u, 600).slice(0, 3).forEach((l, li) => say(c, l, x, up ? y - 62 * u - 70 * u - (wrap(c, b, 38 * u, Math.min(step * .9, 420 * u) || 520 * u, 600).slice(0, 3).length - 1 - li) * 46 * u : y + 100 * u + 56 * u + li * 46 * u, 38 * u, P.ink2, 600, 'center', HEAD)); }); }); }
    else { const x = FW * .2, y0 = FH * .2, y1 = FH * .72, step = n > 1 ? (y1 - y0) / (n - 1) : 0; wobble(c, x, y0 - 40 * u, x, y0 - 40 * u + (y1 - y0 + 80 * u) * eo(lt / (.5 + n * .35)), 1, P.ink, 8 * u, 'tl');
      it.forEach(([a, b], i) => { const y = n > 1 ? y0 + step * i : FH * .45, k = bk(lt, .25 + i * .35, .45); if (k <= 0) return; pop(c, x, y, k, () => { disc(c, x, y, 20 * u, i === n - 1 ? P.red : P.acc, P.ink, 5 * u); say(c, a, x + 50 * u, y - 4 * u, 62 * u, i === n - 1 ? P.red : P.ink, 800, 'left', DISP, FW * .6); if (b) say(c, b, x + 50 * u, y + 50 * u, 40 * u, P.ink2, 600, 'left', HEAD, FW * .68); }); }); }
  }

  function splitBoard(r, c, card, lt, sh) {
    const FW = r.FW, FH = r.FH, u = r.u, land = r.land, it = items(card); const head = it[0] && it[0].indexOf('=') < 0 ? it.shift() : ''; const parts = it.map(s => { const [a, b] = kv(s); return { l: a, vs: b, v: numOf(b) }; }).filter(p => isFinite(p.v) && p.v > 0).slice(0, 5); if (!parts.length) return;
    const sum = parts.reduce((a, p) => a + p.v, 0), W0 = FW * (land ? .8 : .88), x0 = (FW - W0) / 2, h = (land ? 150 : 130) * u, y = FH * (land ? .5 : .46);
    if (head) alpha(c, fin(lt, 0, .3), () => say(c, head, FW / 2, y - h * .5 - 70 * u, (land ? 110 : 96) * u, P.ink, 800, 'center', DISP, FW * .86));
    const grow = eo((lt - .2) / 1); let x = x0; c.save(); c.beginPath(); c.roundRect(x0, y - h / 2, W0 * grow, h, 22 * u); c.clip();
    parts.forEach((p, i) => { const w = W0 * (p.v / sum); rect2(c, x, y - h / 2, w + 1, h, SEG[(i + 1) % SEG.length]); x += w; }); c.restore(); c.save(); rrect(c, x0, y - h / 2, W0 * grow, h, 22 * u, null, P.ink, 5 * u); c.restore();
    x = x0; parts.forEach((p, i) => { const w = W0 * (p.v / sum), cx = x + w / 2, a = fin(lt, .7 + i * .2, .4); x += w; if (a <= 0) return; alpha(c, a, () => { const vs = p.vs, ty = i % 2 ? y + h / 2 + 130 * u : y - h / 2 - 44 * u - (head ? 120 * u : 0);
      if (!head || i % 2) { say(c, p.l, cx, i % 2 ? y + h / 2 + 62 * u : y + h / 2 + 62 * u, 42 * u, P.ink2, 700, 'center', HEAD, Math.max(w, 220 * u)); say(c, vs, cx, y + 20 * u, Math.min(70 * u, w / 3), '#fff', 800, 'center', DISP, w - 16 * u); }
      else { say(c, p.l, cx, y + h / 2 + 62 * u, 42 * u, P.ink2, 700, 'center', HEAD, Math.max(w, 220 * u)); say(c, vs, cx, y + 20 * u, Math.min(70 * u, w / 3), '#fff', 800, 'center', DISP, w - 16 * u); } }); });
  }
  const rect2 = (c, x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x, y, w, h); };

  function flowBoard(r, c, card, lt, sh) {
    const FW = r.FW, FH = r.FH, u = r.u, land = r.land, it = items(card).slice(0, 5).map(s => { const m = s.match(/^(.*?)\s*@\s*([^\s@]+)\s*$/); return m ? { l: m[1].trim(), ic: m[2] } : { l: s, ic: iconFor(s) }; }); const n = it.length; if (!n) return;
    const bw = land ? Math.min(330 * u, (FW * .86 - (n - 1) * 80 * u) / n) : Math.min(560 * u, FW * .7), bh = (land ? 330 : 250) * u;
    it.forEach((o, i) => { const k = bk(lt, .15 + i * .4, .45); const cx = land ? FW / 2 + (i - (n - 1) / 2) * (bw + 80 * u) : FW / 2, cy = land ? FH * .46 : FH * (.16 + (i + .5) * (.66 / n)) , h = land ? bh : Math.min(bh, FH * .6 / n - 20 * u);
      if (i > 0) { const p = eo((lt - .1 - i * .4) / .35); if (land) wobble(c, cx - bw / 2 - 74 * u, cy, cx - bw / 2 - 74 * u + 66 * u * p, cy, 1, P.ink, 7 * u, 'f' + i); else wobble(c, cx, cy - h / 2 - 26 * u, cx, cy - h / 2 - 26 * u + 22 * u * p, 1, P.ink, 7 * u, 'f' + i); if (p > .9 && land) { c.save(); c.strokeStyle = P.ink; c.lineWidth = 7 * u; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - bw / 2 - 20 * u, cy - 16 * u); c.lineTo(cx - bw / 2 - 8 * u, cy); c.lineTo(cx - bw / 2 - 20 * u, cy + 16 * u); c.stroke(); c.restore(); } }
      pop(c, cx, cy, k, () => { shadowCard(c, cx - bw / 2, cy - h / 2, bw, h, 26 * u, u); if (o.ic) drawIcon(c, o.ic, cx, cy - h * (land ? .12 : 0), Math.min(h * .5, 150 * u)); const ls = wrap(c, o.l, 40 * u, bw - 30 * u, 700).slice(0, 2); ls.forEach((l, li) => say(c, l, land ? cx : cx + (o.ic ? 60 * u : 0), cy + (land ? h * .3 : 0) + li * 46 * u - (ls.length - 1) * (land ? 0 : 23) * u + (land ? 0 : 14 * u), 40 * u, P.ink, 700, 'center', HEAD, bw - 30 * u)); }); });
  }

  function compareBoard(r, c, card, lt, sh) {
    const FW = r.FW, FH = r.FH, u = r.u, land = r.land, sides = [{ n: card.left, v: card.lv }, { n: card.right, v: card.rv }]; if (!sides[0].n && !sides[1].n) return;
    const w = land ? FW * .38 : FW * .8, h = land ? FH * .5 : FH * .3;
    sides.forEach((s, i) => { const k = bk(lt, .1 + i * .35, .5); const cx = land ? FW * (i ? .73 : .27) : FW / 2, cy = land ? FH * .46 : FH * (i ? .62 : .27);
      pop(c, cx, cy, k, () => { shadowCard(c, cx - w / 2, cy - h / 2, w, h, 30 * u, u); rrect(c, cx - w / 2, cy - h / 2, w, 20 * u, [30 * u, 30 * u, 0, 0], i ? P.acc : P.ink); say(c, s.n || '', cx, cy - h * .2, 62 * u, P.ink2, 700, 'center', HEAD, w - 40 * u);
        const v = parseVal(s.v || ''), x = eo((lt - .5 - i * .3) / .9); say(c, isFinite(v.num) ? fmtVal(v, x) : (s.v || ''), cx, cy + h * .22, (land ? 118 : 100) * u, i ? P.acc : P.ink, 800, 'center', DISP, w - 40 * u); }); });
    const vk = bk(lt, .35, .4); if (vk > 0) pop(c, FW / 2, land ? FH * .46 : FH * .445, vk, () => { disc(c, FW / 2, land ? FH * .46 : FH * .445, 54 * u, P.red, P.ink, 5 * u); say(c, 'বনাম', FW / 2, (land ? FH * .46 : FH * .445) + 17 * u, 42 * u, '#fff', 800); });
  }

  function checkBoard(r, c, card, lt, sh) {
    const FW = r.FW, FH = r.FH, u = r.u, land = r.land, list = (card.items || []).slice(0, 6); if (!list.length) return; const rh = Math.min(120 * u, FH * .62 / list.length), top = FH * .46 - rh * list.length / 2, w = FW * (land ? .6 : .86), x0 = (FW - w) / 2;
    list.forEach((o, i) => { const k = bk(lt, .15 + i * .3, .4); if (k <= 0) return; const y = top + i * rh; pop(c, x0, y, k, () => { shadowCard(c, x0, y, w, rh - 14 * u, 18 * u, u); disc(c, x0 + 50 * u, y + (rh - 14 * u) / 2, 28 * u, o.ok === false ? P.red : P.ok); c.save(); c.strokeStyle = '#fff'; c.lineWidth = 7 * u; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); const cx = x0 + 50 * u, cy = y + (rh - 14 * u) / 2; if (o.ok === false) { c.moveTo(cx - 10 * u, cy - 10 * u); c.lineTo(cx + 10 * u, cy + 10 * u); c.moveTo(cx + 10 * u, cy - 10 * u); c.lineTo(cx - 10 * u, cy + 10 * u); } else { c.moveTo(cx - 11 * u, cy); c.lineTo(cx - 3 * u, cy + 9 * u); c.lineTo(cx + 12 * u, cy - 9 * u); } c.stroke(); c.restore(); say(c, o.t, x0 + 100 * u, y + (rh - 14 * u) / 2 + 16 * u, 48 * u, P.ink, 700, 'left', HEAD, w - 130 * u); }); });
  }

  function progressBoard(r, c, card, lt, sh) {
    const FW = r.FW, FH = r.FH, u = r.u, v = cl(numOf(card.value) / 100), w = FW * .72, x0 = (FW - w) / 2, y = FH * .48, h = 92 * u, p = eo((lt - .25) / 1.1);
    say(c, card.label || '', FW / 2, y - 80 * u, 66 * u, P.ink, 700, 'center', HEAD, FW * .84); rrect(c, x0, y - h / 2, w, h, h / 2, P.paper2, P.ink, 5 * u); c.save(); c.beginPath(); c.roundRect(x0, y - h / 2, w, h, h / 2); c.clip(); rect2(c, x0, y - h / 2, w * v * p, h, v > .6 ? P.ok : v < .3 ? P.red : P.acc); c.restore();
    say(c, toBn(Math.round(v * 100 * p)) + '%', FW / 2, y + h / 2 + 130 * u, 130 * u, P.acc, 800, 'center', DISP);
  }

  function dateBoard(r, c, card, lt, sh) {
    const FW = r.FW, FH = r.FH, u = r.u, k = bk(lt, .05, .5), w = 640 * u, h = 400 * u, x = FW / 2 - w / 2, y = FH * .46 - h / 2;
    pop(c, FW / 2, FH * .46, k, () => { c.save(); c.translate(FW / 2, FH * .46); c.rotate(-.025); c.translate(-FW / 2, -FH * .46); shadowCard(c, x, y, w, h, 28 * u, u, '#fff'); rrect(c, x, y, w, 100 * u, [28 * u, 28 * u, 0, 0], P.red); disc(c, x + 130 * u, y, 15 * u, P.paper, P.ink, 4 * u); disc(c, x + w - 130 * u, y, 15 * u, P.paper, P.ink, 4 * u);
      wrap(c, String(card.text || ''), 92 * u, w - 70 * u, 800, DISP).slice(0, 2).forEach((l, i, a) => say(c, l, FW / 2, y + 250 * u + (i - (a.length - 1) / 2) * 100 * u, 92 * u, P.ink, 800, 'center', DISP, w - 60 * u)); c.restore(); });
  }

  /* big statement: the line's sharpest sentence, large and centred */
  function heroBoard(r, c, card, lt, sh, t) {
    const FW = r.FW, FH = r.FH, u = r.u, land = r.land, text = String(card.text || card.title || ''); const ls = wrap(c, text, (land ? 112 : 104) * u, FW * (land ? .76 : .86), 800, DISP).slice(0, 4), size = (land ? 112 : 104) * u, lh = size * 1.28, top = FH * .46 - ls.length * lh / 2;
    if (card.title && card.text) alpha(c, fin(lt, 0, .3), () => say(c, card.title, FW / 2, top - 40 * u, 52 * u, P.ink2, 700));
    let wi = 0; ls.forEach((l, i) => { const ws = l.split(' '); c.font = font(800, size, DISP); const sp = c.measureText(' ').width, tot = c.measureText(l).width; let x = FW / 2 - tot / 2; ws.forEach(w => { const ww = c.measureText(w).width, kk = bk(lt, .12 + wi * .1, .34); wi++; if (kk > 0) { c.save(); c.translate(x + ww / 2, top + lh * (i + .6)); c.scale(.7 + .3 * kk, .7 + .3 * kk); c.globalAlpha *= cl(kk * 1.6); c.translate(-(x + ww / 2), -(top + lh * (i + .6))); c.font = font(800, size, DISP); c.textAlign = 'left'; c.fillStyle = i === ls.length - 1 ? P.red : P.ink; c.fillText(w, x, top + lh * (i + .8)); c.restore(); } x += ww + sp; }); });
    const ul = eo((lt - .3 - wi * .1) / .5); wobble(c, FW / 2 - 200 * u, top + lh * ls.length + 14 * u, FW / 2 - 200 * u + 400 * u * ul, top + lh * ls.length + 14 * u, 1, P.acc, 9 * u, 'sm' + sh);
  }

  /* small overlays that sit on top of a text board */
  function sourceChip(r, c, card, lt) {
    const FW = r.FW, FH = r.FH, u = r.u, k = bk(lt, .35, .45); if (k <= 0) return; const name = 'সূত্র: ' + (card.name || ''), body = String(card.text || ''), x = 56 * u, y = FH - (r.land ? 70 : 120) * u;
    c.font = font(700, 36 * u); const w = Math.min(FW * .8, Math.max(c.measureText(name).width, body ? Math.min(c.measureText(body).width, FW * .6) : 0) + 70 * u), h = (body ? 118 : 70) * u;
    pop(c, x, y, k, () => { c.save(); c.translate(x, y - h); c.rotate(-.012); shadowCard(c, 0, 0, w, h, 14 * u, u, '#FFF6D8'); rect2(c, 0, 0, 10 * u, h, P.acc); say(c, name, 30 * u, 46 * u, 36 * u, P.red, 800, 'left', HEAD, w - 50 * u); if (body) say(c, body, 30 * u, 92 * u, 34 * u, P.ink, 600, 'left', HEAD, w - 50 * u); c.restore(); });
  }
  function labelChip(r, c, card, lt) { const u = r.u, k = bk(lt, .3, .4); if (k <= 0) return; const s = String(card.text || ''); c.font = font(700, 34 * u); const w = c.measureText(s).width + 50 * u, x = 56 * u, y = (r.land ? 150 : 210) * u; pop(c, x, y, k, () => { rrect(c, x, y, w, 58 * u, 29 * u, P.ink); say(c, s, x + w / 2, y + 40 * u, 34 * u, '#fff', 700, 'center', HEAD, w - 30 * u); }); }

  /* ---------- one line of narration ---------- */
  const CARD_BOARDS = { counter: statBoard, stat: statBoard, bars: barsBoard, timeline: timelineBoard, split: splitBoard, flow: flowBoard, compare: compareBoard, check: checkBoard, progress: progressBoard, date: dateBoard };
  const HERO_CARDS = new Set(['statement', 'big', 'reveal', 'doc', 'alert', 'sms', 'chat', 'call', 'quote']);

  /* ---------- stage: characters + the place, drawn straight onto the paper board ----------
     Narration lines: the place (a hand-drawn paper scenery) and the story's characters stand on one side of the board,
     the animated text on the other. Card / giant-number lines: the characters shrink into the corner and keep reacting.
     Characters are the app's own (drawPerson), so they blink, breathe, hold a phone, look worried ... from the words. */
  const NOPLACE = /^(board|abstract|)$/;
  function stageScene(r, si) {
    r._xsc = r._xsc || {}; if (si in r._xsc) return r._xsc[si];
    const sc = r.story.scenes[si]; let ok = false;
    try { ok = !!(sc && sc.type === 'story' && sc.cast && sc.cast.length && !NOPLACE.test(sc.place || '') && r.chars && typeof drawPerson === 'function' && (typeof PLACE_INDEX === 'undefined' || PLACE_INDEX[sc.place] || (typeof PLACES !== 'undefined' && PLACES[sc.place]))); } catch (e) { ok = false; }
    return (r._xsc[si] = ok);
  }
  /* which scenery a place key gets */
  function sceneryKind(key) {
    key = String(key || '');
    if (/mall/.test(key)) return 'mall'; if (/tea_stall|cafe|biryani|street_food|canteen|fastfood|rooftop_cafe|restaurant/.test(key)) return 'tea';
    if (/mobile_shop/.test(key)) return 'phoneshop'; if (/clothing|tailor/.test(key)) return 'clothshop';
    if (/bank|atm|post_office|court/.test(key)) return 'bank'; if (/market_street|bazar|village_market|fruit|super_shop/.test(key)) return 'market';
    if (/office|cubicle|startup|conference|reception|hr_|it_|factory|garments|warehouse|govt|lobby|interview|youtube/.test(key)) return 'office';
    if (/road|street|alley|rickshaw|bus_|cng|traffic|footbridge|night_city|station|airport/.test(key)) return 'road';
    if (/home|living|bedroom|kitchen|dining|drawing|balcony|room|house|staircase|hostel|study/.test(key)) return 'home';
    return 'shop';
  }
  function placeName(sc) { try { return (PLACE_INDEX[sc.place] && PLACE_INDEX[sc.place].bn) || ''; } catch (e) { return ''; } }
  const stk = (c, f, lw) => { if (f) { c.fillStyle = f; c.fill(); } c.lineWidth = lw; c.stroke(); };
  /* scenery is drawn in a 760 x 640 box, origin = bottom centre (the ground line) */
  function sign(c, label, x, y, w, h) { c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, 12); stk(c, P.ink, 5); c.fillStyle = '#FFF6E2'; c.font = font(800, Math.min(h * .56, 46), DISP); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x, y + 3, w - 30); }
  const SCENERY = {
    shop(c, o) { const w = 560; c.beginPath(); c.roundRect(-w / 2, -430, w, 430, 8); stk(c, P.card, 5);
      c.beginPath(); c.roundRect(-w / 2 + 40, -270, 300, 190, 6); stk(c, '#CFE6F5', 5); for (let i = 0; i < 3; i++) { c.beginPath(); c.roundRect(-w / 2 + 62 + i * 92, -150, 70, 52, 6); stk(c, [P.acc2, '#CDE9BE', '#F7C6C6'][i], 4); }
      c.beginPath(); c.roundRect(w / 2 - 190, -300, 130, 300, 6); stk(c, '#E8C48A', 5); c.beginPath(); c.arc(w / 2 - 80, -150, 7, 0, 7); c.fillStyle = P.ink; c.fill();
      for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(-w / 2 - 20 + i * 76, -430); c.lineTo(-w / 2 + 56 + i * 76, -430); c.lineTo(-w / 2 + 70 + i * 76, -350); c.lineTo(-w / 2 - 6 + i * 76, -350); c.closePath(); stk(c, i % 2 ? '#fff' : P.red, 4); }
      sign(c, o.label || 'দোকান', 0, -500, 360, 70); },
    phoneshop(c, o) { SCENERY.shop(c, { label: o.label }); c.save(); c.translate(-280 + 62, -200); for (let i = 0; i < 4; i++) { c.beginPath(); c.roundRect(i * 66, -34 + (i % 2) * 6, 44, 76, 7); stk(c, ['#7CC4F0', '#FFCB45', '#B79BE8', '#8FD9A8'][i], 4); } c.restore(); },
    clothshop(c, o) { SCENERY.shop(c, { label: o.label }); c.save(); c.translate(-280 + 70, -230); c.lineWidth = 4; for (let i = 0; i < 3; i++) { const x = i * 88; c.beginPath(); c.moveTo(x, -4); c.lineTo(x + 28, 6); c.lineTo(x + 56, -4); c.stroke(); c.beginPath(); c.moveTo(x + 8, 6); c.lineTo(x - 6, 80); c.lineTo(x + 50, 80); c.lineTo(x + 36, 6); c.closePath(); stk(c, [P.red, '#5B8DEF', '#F2B84B'][i], 4); } c.restore(); },
    mall(c, o) { const w = 520; c.beginPath(); c.roundRect(-w / 2, -540, w, 540, 10); stk(c, '#E7EEF5', 5);
      for (let r = 0; r < 4; r++) for (let q = 0; q < 5; q++) { c.beginPath(); c.roundRect(-w / 2 + 28 + q * 96, -490 + r * 96, 78, 70, 6); stk(c, (r + q) % 3 === 0 ? '#FFE9A8' : '#BFE0F5', 4); }
      c.beginPath(); c.roundRect(-110, -130, 220, 130, 8); stk(c, '#9FD0EE', 5); c.beginPath(); c.moveTo(0, -130); c.lineTo(0, 0); c.stroke();
      c.beginPath(); c.moveTo(-150, -135); c.lineTo(150, -135); c.lineTo(130, -170); c.lineTo(-130, -170); c.closePath(); stk(c, P.red, 5);
      sign(c, o.label || 'শপিং মল', 0, -585, 380, 76); [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(sd * (w / 2 - 20), -540); c.lineTo(sd * (w / 2 - 20), -640); c.stroke(); c.beginPath(); c.moveTo(sd * (w / 2 - 20), -640); c.lineTo(sd * (w / 2 - 70), -620); c.lineTo(sd * (w / 2 - 20), -600); c.closePath(); stk(c, P.acc, 3); }); },
    tea(c, o) { c.beginPath(); c.moveTo(-300, -330); c.lineTo(300, -330); c.lineTo(270, -400); c.lineTo(-270, -400); c.closePath(); stk(c, '#9A8F7B', 5); [-250, 250].forEach(x => { c.beginPath(); c.moveTo(x, -330); c.lineTo(x, 0); c.lineWidth = 9; c.stroke(); c.lineWidth = 5; });
      c.beginPath(); c.roundRect(-230, -150, 460, 150, 8); stk(c, '#E8C48A', 5); c.beginPath(); c.roundRect(-230, -170, 460, 30, 6); stk(c, '#C99A5B', 5);
      c.beginPath(); c.moveTo(-130, -170); c.lineTo(-130, -220); c.quadraticCurveTo(-130, -250, -90, -250); c.lineTo(-40, -250); c.lineTo(-30, -220); c.lineTo(-30, -170); c.closePath(); stk(c, '#B8C2CC', 5);
      for (let i = 0; i < 3; i++) { const yy = -250 - ((o.t * 26 + i * 30) % 90); c.save(); c.globalAlpha *= .5 * (1 - ((o.t * 26 + i * 30) % 90) / 90); c.strokeStyle = P.ink2; c.lineWidth = 4; c.beginPath(); c.moveTo(-90 + i * 14, yy); c.quadraticCurveTo(-80 + i * 14, yy - 14, -90 + i * 14, yy - 28); c.stroke(); c.restore(); }
      [70, 130, 190].forEach((x, i) => { c.beginPath(); c.roundRect(x - 18, -212, 36, 42, [4, 4, 12, 12]); stk(c, '#fff', 4); });
      sign(c, o.label || 'চায়ের দোকান', 0, -455, 380, 66); },
    bank(c, o) { const w = 520; c.beginPath(); c.moveTo(-w / 2 - 20, -380); c.lineTo(0, -500); c.lineTo(w / 2 + 20, -380); c.closePath(); stk(c, P.acc2, 5);
      for (let i = 0; i < 5; i++) { c.beginPath(); c.roundRect(-w / 2 + 14 + i * 100, -370, 60, 330, 6); stk(c, '#fff', 5); }
      c.beginPath(); c.roundRect(-w / 2 - 20, -40, w + 40, 40, 6); stk(c, P.ink2, 5); sign(c, o.label || 'ব্যাংক', 0, -430, 250, 56); },
    office(c, o) { const w = 400; c.beginPath(); c.roundRect(-w / 2, -600, w, 600, 8); stk(c, '#E7EEF5', 5);
      for (let r = 0; r < 6; r++) for (let q = 0; q < 4; q++) { c.beginPath(); c.roundRect(-w / 2 + 28 + q * 90, -570 + r * 84, 62, 56, 5); stk(c, (r * 3 + q) % 5 === 0 ? '#FFE9A8' : '#BFE0F5', 4); }
      c.beginPath(); c.roundRect(-50, -90, 100, 90, 6); stk(c, '#9FD0EE', 5); sign(c, o.label || 'অফিস', 0, -640, 260, 56); },
    home(c, o) { const w = 520; c.beginPath(); c.roundRect(-w / 2, -300, w, 300, 8); stk(c, '#F5E3C3', 5); c.beginPath(); c.moveTo(-w / 2 - 30, -300); c.lineTo(0, -470); c.lineTo(w / 2 + 30, -300); c.closePath(); stk(c, '#D9694F', 5);
      c.beginPath(); c.roundRect(-45, -200, 90, 200, 6); stk(c, '#8A5A33', 5); [-160, 160].forEach(x => { c.beginPath(); c.roundRect(x - 50, -230, 100, 90, 6); stk(c, '#BFE0F5', 5); c.beginPath(); c.moveTo(x, -230); c.lineTo(x, -140); c.moveTo(x - 50, -185); c.lineTo(x + 50, -185); c.stroke(); });
      c.beginPath(); c.arc(w / 2 + 60, -230, 62, 0, 7); stk(c, '#8FD9A8', 5); c.beginPath(); c.moveTo(w / 2 + 60, -170); c.lineTo(w / 2 + 60, 0); c.lineWidth = 12; c.stroke(); c.lineWidth = 5; },
    market(c, o) { [[-200, P.red], [0, '#F2B84B'], [200, '#5B8DEF']].forEach(([x, col], i) => { c.beginPath(); c.moveTo(x - 110, -300); c.quadraticCurveTo(x, -400, x + 110, -300); c.closePath(); stk(c, col, 5); c.beginPath(); c.moveTo(x, -350); c.lineTo(x, 0); c.lineWidth = 8; c.stroke(); c.lineWidth = 5;
        c.beginPath(); c.roundRect(x - 90, -100, 180, 100, 6); stk(c, '#E8C48A', 5); [-45, 0, 45].forEach(dx => { c.beginPath(); c.arc(x + dx, -118, 22, 0, 7); stk(c, [P.red, '#F2B84B', '#8FD9A8'][(i + dx / 45 + 3) % 3 | 0], 4); }); });
      sign(c, o.label || 'বাজার', 0, -470, 300, 60); },
    road(c, o) { c.beginPath(); c.roundRect(-380, -60, 760, 60, 6); stk(c, '#6B7280', 5); for (let i = 0; i < 6; i++) { c.fillStyle = '#FFF6E2'; c.fillRect(-360 + i * 130, -34, 70, 8); }
      c.beginPath(); c.moveTo(-300, -60); c.lineTo(-300, -420); c.quadraticCurveTo(-300, -470, -240, -470); c.lineTo(-190, -470); c.lineWidth = 12; c.stroke(); c.lineWidth = 5; c.beginPath(); c.arc(-190, -452, 20, 0, 7); stk(c, '#FFE27A', 4);
      c.beginPath(); c.roundRect(130, -360, 200, 300, 6); stk(c, '#F5E3C3', 5); [0, 1, 2].forEach(i => { c.beginPath(); c.roundRect(150, -330 + i * 90, 60, 60, 5); stk(c, '#BFE0F5', 4); c.beginPath(); c.roundRect(240, -330 + i * 90, 60, 60, 5); stk(c, '#BFE0F5', 4); });
      sign(c, o.label || 'রাস্তা', 0, -520, 300, 56); }
  };
  /* where the characters stand for a mode; the first array element belongs to the first cast member */
  function stagePose(r, si, n, mode) {
    const FW = r.FW, FH = r.FH, u = r.u, land = r.land, right = si % 2 === 1, out = [];
    if (mode === 'full') {
      if (land) { const cx = right ? FW * .75 : FW * .25, ground = FH * .9, H0 = FH * (n === 1 ? .52 : n === 2 ? .47 : .41), sp = n === 1 ? [0] : n === 2 ? [-.5, .5] : [-1, 0, 1], gap = (n === 2 ? 270 : 215) * u;
        sp.forEach(d => out.push({ x: cx + d * gap, y: ground, h: H0 })); return { pose: out, sx: cx, sg: FH * .875, sw: FW * .4, sh: FH * .8, text: right ? 'left' : 'right' }; }
      const cx = FW / 2, ground = FH * .93, H0 = FH * (n === 1 ? .32 : n === 2 ? .3 : .27), sp = n === 1 ? [0] : n === 2 ? [-.5, .5] : [-1, 0, 1], gap = 330 * u;
      sp.forEach(d => out.push({ x: cx + d * gap, y: ground, h: H0 })); return { pose: out, sx: cx, sg: FH * .915, sw: FW * .96, sh: FH * .46, text: 'top' };
    }
    const cx = land ? FW - 175 * u - (n - 1) * 70 * u : FW - 140 * u - (n - 1) * 60 * u, ground = (land ? .43 : .36) * FH, H0 = FH * (land ? .27 : .17), gap = 120 * u;
    for (let i = 0; i < n; i++) out.push({ x: cx + (i - (n - 1) / 2) * gap + (n - 1) * 50 * u, y: ground, h: H0 }); return { pose: out, sx: cx, sg: ground, sw: 0, sh: 0, text: 'none' };
  }
  const fidOf = ln => ln.who || ln.focus || '';
  function stageDraw(r, c, si, k, t, mode) {
    const sc = r.story.scenes[si], sh = r.tl.shots[k], ln = sc.lines[sh.li], lt = t - sh.start, slt = t - sc.start, u = r.u, n = Math.min(3, sc.cast.length || 1);
    r._xmd = r._xmd || {}; const key = si + ':' + k;
    if (!r._xmd[key]) { const pk = r.tl.shots[k - 1]; r._xmd[key] = { prevMode: pk && pk.si === si ? (r._xmd[si + ':' + (k - 1)] || {}).mode || mode : mode, mode }; }
    const pm = r._xmd[key].prevMode, A = stagePose(r, si, n, pm), B = stagePose(r, si, n, mode), e = pm === mode ? 1 : eio(lt / .5), mix = (a, b) => a + (b - a) * e;
    const st = r.state && r.state[k], showScene = mode === 'full' ? e : 1 - e; // scenery fades with the mode
    const wasFull = pm === 'full', sceneA = (mode === 'full' ? 1 : 0) * e + (wasFull ? 1 : 0) * (1 - e);
    // scenery (behind the characters)
    const sa = Math.max(0, Math.min(1, pm === mode ? (mode === 'full' ? 1 : 0) : sceneA)), skk = bk(slt, .05, .55);
    if (sa > 0 && skk > 0) { const g = sa < 1 || true ? B : B; const L = mode === 'full' ? B : A, bw = L.sw, bh = L.sh; if (bw > 0) alpha(c, sa, () => { c.save(); const sc0 = Math.min(bw / 760, bh / 640) * (r.land ? 1.06 : 1); c.translate(L.sx + (si % 2 ? -1 : 1) * 10 * u, L.sg); c.scale(sc0 * (.82 + .18 * cl(skk)), sc0 * (.82 + .18 * cl(skk))); O(c, 5);
        // soft paper blob behind the scenery
        c.save(); c.fillStyle = 'rgba(240,127,29,.10)'; c.beginPath(); c.ellipse(0, -240, 400, 310, 0, 0, 7); c.fill(); c.restore();
        try { SCENERY[sceneryKind(sc.place)](c, { label: placeName(sc), t }); } catch (e2) { }
        c.restore(); }); }
    // ground scribble
    if (sa > 0) alpha(c, sa * .9, () => { const L = mode === 'full' ? B : A; if (L.sw > 0) { const gx = L.sx, gy = L.sg - 4 * u, w2 = L.sw * .52 * eo(slt / .6); wobble(c, gx - w2, gy, gx + w2, gy + 2 * u, 1, P.ink, 5 * u, 'g' + si); } });
    // characters
    const cast = sc.cast.slice(0, 3);
    cast.forEach((id, i) => {
      const cr = r.chars[id]; if (!cr) return; const a0 = A.pose[i] || A.pose[0], b0 = B.pose[i] || B.pose[0]; const x = mix(a0.x, b0.x), y = mix(a0.y, b0.y), h = mix(a0.h, b0.h);
      const kf = cr.L.kid ? .74 : cr.L.teen ? .92 : 1, ks = h / 722 * (1 + (fidOf(ln) === id ? .035 * Math.min(1, lt / .3) : 0)), m = (st && st.mem && st.mem[id]) || { feel: 'neutral', act: 'idle' };
      const ent = eo((slt - .08 - i * .16) / .5); if (ent <= 0) return; const side = x < r.FW / 2 ? -1 : 1;
      const fid = ln.who || ln.focus; let eye = 0; if (fid && fid !== id) { const wi = sc.cast.indexOf(fid); eye = wi > i ? 1 : wi >= 0 ? -1 : 0; } if (m.act === 'phone') eye = 0;
      const talking = !!ln.who && ln.who === id && lt > .1 && lt < sh.dur - .15;
      c.save(); c.globalAlpha *= cl(ent * 1.5); c.translate(side * (1 - ent) * 160 * u, (1 - ent) * 70 * u);
      const foot = (LEG_LEN + 16) * ks * kf; // drawPerson's anchor is the hip
      c.translate(0, 0); drawPerson(c, { L: cr.L, x, y: y - foot, s: ks, flip: n > 1 && i === n - 1 ? true : false, feel: m.feel, act: m.act, hold: m.hold, talk: talking, t, seed: cr.seed, eye, tear: m.feel === 'crying' });
      c.restore();
      if (mode === 'full' && e >= 1) { const nm = (cr.ch && cr.ch.name) || ''; const tg = bk(slt, .55 + i * .12, .4); if (nm && tg > 0) { c.font = font(700, 30 * u); const tw = c.measureText(nm).width + 44 * u, ty = y + 22 * u; pop(c, x, ty + 22 * u, tg, () => { rrect(c, x - tw / 2, ty, tw, 46 * u, 23 * u, P.ink); say(c, nm, x, ty + 24 * u, 28 * u, '#FFF6E2', 700, 'center', HEAD, tw); }); } }
    });
    return { text: B.text, sx: B.sx, sw: B.sw, side: B.text === 'left' ? 1 : -1, left: B.text === 'right' };
  }

  const FW0 = r => r.FW;
  function drawLine(r, c, si, k, t) {
    const sh = r.tl.shots[k], sc = r.story.scenes[si], ln = sc.lines[sh.li], lt = t - sh.start, card = ln.card, dur = sh.dur + .2;
    const ex = 1 - eo((lt - (dur - .26)) / .26), ent = fin(lt, 0, .12), A = Math.min(ex, .15 + ent * .85);
    c.save(); c.globalAlpha *= cl(A); c.translate(0, (1 - ex) * -14 * r.u);
    const ty = card && card.type, hasStage = stageScene(r, si);
    if (ty && CARD_BOARDS[ty]) { if (hasStage) stageDraw(r, c, si, k, t, 'pip'); CARD_BOARDS[ty](r, c, card, lt, k); caption(r, c, k, t); }
    else if (ty && HERO_CARDS.has(ty)) { if (hasStage && ty !== 'statement' && ty !== 'big') stageDraw(r, c, si, k, t, 'pip'); heroBoard(r, c, card, lt, k, t); if (ty !== 'statement' && ty !== 'big') caption(r, c, k, t); }
    else {
      const icon = ty === 'icon' ? String(card.text || '').trim() : '';
      if (hasStage) {
        const words = r.words[k], ic = icon || iconFor(ln.cap + ' ' + (ln.hl || '')), m = pickMode(r, k, ln, words, ic, true), mode = m === 'hero' ? 'pip' : 'full', bx = stageDraw(r, c, si, k, t, mode);
        textBoard(r, c, k, t, { icon, stage: { left: bx.left, text: bx.text }, noIcon: m === 'hero' });
        if (m === 'stage' && ic && r.land) sticker(c, bx.sx + (bx.left ? -1 : 1) * bx.sw * .36, r.FH * .2, 64 * r.u, ic, lt, .35);
      } else textBoard(r, c, k, t, { icon });
      if (ty === 'source') sourceChip(r, c, card, lt); else if (ty === 'label') labelChip(r, c, card, lt); }
    c.restore();
  }

  /* ---------- special scenes ---------- */
  function chapterBoard(r, c, si, t) {
    const sc = r.story.scenes[si], lt = t - sc.start, ch = sc.chapter || {}, FW = r.FW, FH = r.FH, u = r.u, land = r.land; const num = (String(ch.no).match(/[০-৯\d]+/) || [''])[0] || '';
    if (num) alpha(c, .13 * fin(lt, 0, .5), () => { c.save(); c.font = font(800, (land ? 760 : 620) * u, DISP); c.textAlign = 'center'; c.fillStyle = P.ink; c.fillText(toBn(num), FW / 2 + (1 - eo(lt / .8)) * 260 * u, FH * .78); c.restore(); });
    if (ch.no) pop(c, FW / 2, FH * .3, bk(lt, .05, .45), () => { c.font = font(800, 52 * u); const w = c.measureText(ch.no).width + 90 * u; rrect(c, FW / 2 - w / 2, FH * .3 - 44 * u, w, 88 * u, 44 * u, P.acc); say(c, ch.no, FW / 2, FH * .3 + 18 * u, 52 * u, '#fff', 800); });
    const size = (land ? 130 : 112) * u, ls = wrap(c, ch.title || '', size, FW * (land ? .8 : .86), 800, DISP).slice(0, 3), lh = size * 1.25, top = FH * (land ? .46 : .42) - ls.length * lh / 2 + lh * .5; let wi = 0;
    ls.forEach((l, i) => { c.font = font(800, size, DISP); const sp = c.measureText(' ').width, tot = c.measureText(l).width; let x = FW / 2 - tot / 2; l.split(' ').forEach(w => { const ww = c.measureText(w).width, kk = bk(lt, .25 + wi * .13, .36); wi++; if (kk > 0) { c.save(); c.translate(x + ww / 2, top + lh * i); c.scale(.7 + .3 * kk, .7 + .3 * kk); c.globalAlpha *= cl(kk * 1.6); c.translate(-(x + ww / 2), -(top + lh * i)); c.font = font(800, size, DISP); c.textAlign = 'left'; c.fillStyle = P.ink; c.fillText(w, x, top + lh * i + lh * .3); c.restore(); } x += ww + sp; }); });
    const ul = eo((lt - .4 - wi * .13) / .55); wobble(c, FW / 2 - 300 * u, top + lh * ls.length - lh * .25, FW / 2 - 300 * u + 600 * u * ul, top + lh * ls.length - lh * .25 + 3 * u, 1, P.red, 10 * u, 'ch' + si);
    const list = r.chapList || []; if (list.length > 1) { const idx = list.indexOf(sc), gap = 50 * u, x0 = FW / 2 - (list.length - 1) * gap / 2, y = FH * .9; list.forEach((cc, i) => { disc(c, x0 + i * gap, y, (i === idx ? 14 : 9) * u, i <= idx ? P.acc : P.line); }); }
  }
  function takeawaysBoard(r, c, si, t) {
    const sc = r.story.scenes[si], lt = t - sc.start, FW = r.FW, FH = r.FH, u = r.u, land = r.land; pop(c, FW / 2, FH * .12, bk(lt, .05, .45), () => { c.font = font(800, 56 * u); const label = sc.badge || 'যা মনে রাখবেন', w = c.measureText(label).width + 100 * u; rrect(c, FW / 2 - w / 2, FH * .12 - 48 * u, w, 96 * u, 48 * u, P.ink); say(c, label, FW / 2, FH * .12 + 20 * u, 56 * u, P.card, 800); });
    const [a, b] = r.shotRangeOfScene(si), n = b - a + 1, top = FH * .24, rh = Math.min(land ? 190 * u : 230 * u, (FH * .66) / Math.max(1, n)), w = FW * (land ? .82 : .9), x0 = (FW - w) / 2;
    for (let k = a; k <= b; k++) { const sh = r.tl.shots[k], ln = sc.lines[sh.li], i = k - a, p = bk(t - sh.start + .05, 0, .5); if (p <= 0) continue; const y = top + i * rh, cur = t < sh.end + .6; const item = ln.item || ln.cap;
      pop(c, x0, y + rh / 2, p, () => { shadowCard(c, x0, y, w, rh - 22 * u, 24 * u, u, cur ? '#FFF6D8' : P.card); disc(c, x0 + 70 * u, y + (rh - 22 * u) / 2, 42 * u, i % 2 ? P.ink : P.acc); say(c, toBn(i + 1), x0 + 70 * u, y + (rh - 22 * u) / 2 + 20 * u, 54 * u, '#fff', 800, 'center', DISP);
        const ls = wrap(c, item, 50 * u, w - 200 * u, 700).slice(0, 2); ls.forEach((l, li) => say(c, l, x0 + 140 * u, y + (rh - 22 * u) / 2 + 16 * u + (li - (ls.length - 1) / 2) * 58 * u, 50 * u, P.ink, 700, 'left', HEAD, w - 180 * u)); }); }
  }
  function ctaBoard(r, c, si, t) {
    const sc = r.story.scenes[si], lt = t - sc.start, S = r.settings || {}, FW = r.FW, FH = r.FH, u = r.u, land = r.land, q = (sc.cta && sc.cta.question) || (sc.lines[0] ? sc.lines[0].cap : ''), opts = ((sc.cta && sc.cta.options) || []).slice(0, 3);
    const qs = (land ? 92 : 88) * u, qw = land ? FW * .5 : FW * .86, ql = wrap(c, q, qs, qw, 800, DISP).slice(0, 4), qx = land ? FW * .07 : FW / 2, al = land ? 'left' : 'center', y0 = land ? FH * .2 : FH * .1;
    let wi = 0; const total = ql.join(' ').split(' ').length; ql.forEach((l, i) => { c.font = font(800, qs, DISP); const sp = c.measureText(' ').width, tot = c.measureText(l).width; let x = land ? qx : qx - tot / 2; l.split(' ').forEach(w => { const ww = c.measureText(w).width, kk = bk(lt, .1 + wi * .12, .36); wi++; if (kk > 0) { c.save(); c.translate(x + ww / 2, y0 + qs * 1.3 * i); c.scale(.7 + .3 * kk, .7 + .3 * kk); c.globalAlpha *= cl(kk * 1.6); c.translate(-(x + ww / 2), -(y0 + qs * 1.3 * i)); c.font = font(800, qs, DISP); c.textAlign = 'left'; c.fillStyle = i === ql.length - 1 ? P.red : P.ink; c.fillText(w, x, y0 + qs * 1.3 * i + qs * .4); c.restore(); } x += ww + sp; }); });
    let y = y0 + ql.length * qs * 1.3 + 20 * u; const ow = Math.min(land ? FW * .46 : FW * .8, 760 * u);
    opts.forEach((o, i) => { const k = bk(lt, 1 + i * .25, .45), ox = land ? qx : FW / 2 - ow / 2; pop(c, ox + ow / 2, y + 44 * u, k, () => { rrect(c, ox, y, ow, 88 * u, 44 * u, P.card, P.ink, 4 * u); say(c, o, ox + ow / 2, y + 60 * u, 44 * u, P.ink, 700, 'center', HEAD, ow - 40 * u); }); y += 108 * u; });
    const cw = land ? FW * .34 : Math.min(FW * .8, 700 * u), cx = land ? FW * .76 : FW / 2, cy = land ? FH * .42 : Math.min(FH * .74, y + 220 * u), ch = 400 * u;
    pop(c, cx, cy, bk(lt, 1.4, .5), () => { shadowCard(c, cx - cw / 2, cy - ch / 2, cw, ch, 34 * u, u); if (typeof drawLogo === 'function') drawLogo(c, cx, cy - 90 * u, 140 * u, S.logo || 'TF'); say(c, S.series || 'TF', cx, cy + 50 * u, 58 * u, P.ink, 800, 'center', HEAD, cw - 50 * u); say(c, S.tagline || '', cx, cy + 108 * u, 34 * u, P.ink2, 600, 'center', HEAD, cw - 50 * u); });
    const pulse = 1 + .05 * Math.sin(t * 6) * cl(lt - 2.6), by = cy + ch / 2 + 90 * u; pop(c, cx, by, bk(lt, 2.1, .5) * pulse, () => { c.save(); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 18 * u; rrect(c, cx - 250 * u, by - 52 * u, 500 * u, 104 * u, 52 * u, '#E53935'); c.restore(); drawIcon(c, 'bell', cx - 175 * u, by, 64 * u); say(c, 'সাবস্ক্রাইব', cx + 40 * u, by + 17 * u, 48 * u, '#fff', 800, 'center', HEAD, 330 * u); });
    const outro = S.outro; if (outro) alpha(c, fin(lt, 3, .5), () => wrap(c, outro, 40 * u, FW * .9, 600).slice(0, 2).reverse().forEach((l, i) => say(c, l, FW / 2, FH - 60 * u - i * 52 * u, 40 * u, P.ink2, 600, 'center', HEAD, FW * .92)));
  }

  function drawScene(r, c, si, t) {
    const sc = r.story.scenes[si]; c.save();
    if (sc.type === 'chapter') { chapterBoard(r, c, si, t); caption(r, c, r.shotIn(si, t), t); }
    else if (sc.type === 'takeaways' || sc.type === 'book') takeawaysBoard(r, c, si, t);
    else if (sc.type === 'cta') ctaBoard(r, c, si, t);
    else { const k = r.shotIn(si, t); drawLine(r, c, si, k, t); }
    c.restore();
  }

  /* ---------- frame ---------- */
  const TRANS = ['slide', 'rise', 'fade', 'wipe'];
  function render(r, c, t, opt) {
    const FW = r.FW, FH = r.FH, th = r.tl.thumb || 0;
    if (th > 0 && t < th) { r.drawThumb(c); return; }
    const si = r.sceneAt(t), sc = r.story.scenes[si], lt = t - sc.start;
    c.save(); c.drawImage(paperBg(FW, FH), 0, 0);
    const kind = sc.type === 'chapter' ? 'wipe' : TRANS[(hash(r.story.title) + si) % TRANS.length], TR = kind === 'wipe' ? .55 : .5;
    if (si > 0 && lt < TR) {
      const p = eio(lt / TR), pv = r.story.scenes[si - 1], tp = pv.end - .001;
      if (kind === 'slide') { c.save(); c.translate(-FW * p, 0); drawScene(r, c, si - 1, tp); c.restore(); c.save(); c.translate(FW * (1 - p), 0); drawScene(r, c, si, t); c.restore(); }
      else if (kind === 'rise') { drawScene(r, c, si - 1, tp); c.save(); c.translate(0, FH * (1 - p)); c.save(); c.shadowColor = 'rgba(40,30,10,.35)'; c.shadowBlur = 40; c.shadowOffsetY = -12; c.fillStyle = P.paper; c.fillRect(0, 0, FW, FH + 40); c.restore(); c.drawImage(paperBg(FW, FH), 0, 0); drawScene(r, c, si, t); c.restore(); }
      else if (kind === 'wipe') { drawScene(r, c, si - 1, tp); c.save(); c.beginPath(); const sk = FH * .25, x = -sk + (FW + sk * 2) * p; c.moveTo(0, 0); c.lineTo(x + sk, 0); c.lineTo(x, FH); c.lineTo(0, FH); c.closePath(); c.clip(); c.drawImage(paperBg(FW, FH), 0, 0); drawScene(r, c, si, t); c.restore(); c.save(); c.fillStyle = P.acc; c.beginPath(); c.moveTo(x + sk, 0); c.lineTo(x + sk + 36 * r.u, 0); c.lineTo(x + 36 * r.u, FH); c.lineTo(x, FH); c.closePath(); c.fill(); c.restore(); }
      else { drawScene(r, c, si - 1, tp); c.save(); c.globalAlpha = p; c.translate(FW / 2, FH / 2); const z = 1.05 - .05 * p; c.scale(z, z); c.translate(-FW / 2, -FH / 2); drawScene(r, c, si, t); c.restore(); }
    } else drawScene(r, c, si, t);
    if (!opt || opt.ui !== false) ui(r, c, t, si);
    if (th > 0 && t < th + .3) alpha(c, 1 - (t - th) / .3, () => r.drawThumb(c));
    c.restore();
  }
  function ui(r, c, t, si) {
    const sc = r.story.scenes[si], S = r.settings || {}, FW = r.FW, FH = r.FH, u = r.u;
    if (S.progress !== false) { const p = cl(t / Math.max(1, r.duration)); rect2(c, 0, FH - 9 * u, FW, 9 * u, 'rgba(28,43,75,.12)'); rect2(c, 0, FH - 9 * u, FW * p, 9 * u, P.acc); (r.chapList || []).forEach(ch => rect2(c, FW * ch.start / r.duration - 2, FH - 9 * u, 4, 9 * u, P.ink)); }
    if (S.watermark !== false) { const a = (S.wm != null ? S.wm : 70) / 100; c.save(); c.globalAlpha *= a; if (typeof drawLogo === 'function') drawLogo(c, 62 * u, 60 * u, 62 * u, S.logo || 'TF'); say(c, S.series || 'TF', 108 * u, 72 * u, 32 * u, P.ink, 800, 'left', HEAD, FW * .4); c.restore(); }
    const ch = r.chap && r.chap[si]; if (ch && ch.chapter && sc.type === 'story') { const lab = [ch.chapter.no, ch.chapter.title].filter(Boolean).join(' · '); c.font = font(700, 30 * u); const w = Math.min(FW * (r.land ? .42 : .8), c.measureText(lab).width + 50 * u); alpha(c, .95, () => { rrect(c, FW - w - 44 * u, 36 * u, w, 56 * u, 28 * u, 'rgba(28,43,75,.9)'); say(c, lab, FW - 44 * u - w / 2, 74 * u, 30 * u, '#fff', 700, 'center', HEAD, w - 30 * u); }); }
  }


  /* ---------- thumbnail (also the first second of the video): paper board, teaser pill, huge headline, doodle icon ---------- */
  const PROP_ICON = { money: 'note', phone: 'phone', envelope: 'mail', book: 'doc', paper: 'doc', laptop: 'chart_up', key: 'lock', bag: 'cart', gift: 'box', medicine: 'shield', cup: 'bulb', plate: 'coin', ring: 'coin', flower: 'bulb', sweets: 'coin' };
  function rich(c, text, red, x, y, size, maxW, maxRows, align, fam, weight) {
    const raw = String(text || '').replace(/[{}]/g, '').trim(); if (!raw) return { h: 0, rows: 0 }; let sz = size, rows;
    for (let i = 0; i < 40; i++) { rows = wrap(c, raw, sz, maxW, weight || 800, fam || DISP); if (rows.length <= maxRows || sz < 40) break; sz -= 4; }
    const lh = sz * 1.22; rows.slice(0, maxRows).forEach((row, ri) => { c.font = font(weight || 800, sz, fam || DISP); const sp = c.measureText(' ').width, tot = c.measureText(row).width; let xx = align === 'center' ? x - tot / 2 : x; row.split(' ').forEach(w => { const ww = c.measureText(w).width, clean = w.replace(/[।,.!?“”"'‘’:;()]/g, ''); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = (red.has(clean) || /[০-৯\d]/.test(clean)) ? P.red : P.ink; c.fillText(w, xx, y + lh * (ri + .85)); xx += ww + sp; }); });
    return { h: lh * Math.min(rows.length, maxRows), rows: Math.min(rows.length, maxRows), size: sz };
  }
  function thumb(r, c) {
    const st = r.story, FW = r.FW, FH = r.FH, u = r.u, land = r.land, port = r.port, S = r.settings || {}, cv0 = st.cover || {};
    const d = (typeof coverData === 'function') ? coverData(st) : { l1: st.title, l2: '', ctx: '', icon: 'money', sym: '৳' };
    const raw1 = cv0.l1 || d.l1 || '', raw2 = cv0.l2 || d.l2 || '', ctx = cv0.ctx || d.ctx || '', red = new Set();
    [raw1, raw2].forEach(t => (String(t).match(/\{([^}]*)\}/g) || []).forEach(m => m.slice(1, -1).split(/\s+/).forEach(w => red.add(w.replace(/[।,.!?“”"'‘’:;()]/g, '')))));
    c.drawImage(paperBg(FW, FH), 0, 0);
    // tilted navy corner stripe + dotted burst for energy
    c.save(); c.fillStyle = P.ink; c.beginPath(); c.moveTo(0, 0); c.lineTo(FW * .34, 0); c.lineTo(FW * .27, 26 * u); c.lineTo(0, 26 * u); c.fill(); c.restore();
    const pad = (land ? 70 : 60) * u, tw = land ? FW * .56 : FW - pad * 2; let y = (land ? 92 : 100) * u;
    if (ctx) { c.font = font(800, 44 * u); const cw = Math.min(tw, c.measureText(ctx).width + 70 * u); rrect(c, pad, y, cw, 76 * u, 38 * u, P.acc); say(c, ctx, pad + cw / 2, y + 53 * u, 44 * u, '#fff', 800, 'center', HEAD, cw - 40 * u); y += 120 * u; }
    const a = rich(c, raw1, red, pad, y, (land ? 92 : 100) * u, tw, 2, 'left', DISP, 800); y += a.h + 14 * u;
    const b = rich(c, raw2, red, pad, y, (land ? 168 : 170) * u, tw, land ? 3 : 4, 'left', DISP, 800); y += b.h;
    wobble(c, pad, y + 14 * u, pad + Math.min(tw, 520 * u), y + 18 * u, 1, P.acc, 14 * u, 'thumb');
    // doodle picture
    const ic = ICONS[cv0.icon] ? cv0.icon : (PROP_ICON[d.icon] || iconFor(raw1 + raw2) || 'coin');
    const R = land ? Math.min(FH * .3, FW * .17) : Math.min(FW * .26, FH * .16), cx = land ? FW * .79 : FW * .74, cy = land ? FH * .46 : FH * .82;
    c.save(); c.translate(cx, cy); c.rotate(.06); disc(c, R * .1, R * .12, R, 'rgba(28,43,75,.14)'); disc(c, 0, 0, R, P.card, P.ink, R * .05); disc(c, 0, 0, R * .84, P.acc2 + 'AA'); drawIcon(c, ic, 0, 0, R * 1.3); c.restore();
    if (d.sym) { const sr = R * .34; c.save(); c.translate(cx + R * .78, cy - R * .78); c.rotate(.1); disc(c, 0, 0, sr, P.red, P.ink, sr * .1); c.restore(); say(c, String(d.sym).slice(0, 3), cx + R * .78, cy - R * .78 + sr * .34, sr * .95, '#fff', 800, 'center', DISP, sr * 1.6); }
    // little rising chart for the "business" feel
    if (land) { const bx = FW * .62, by = FH * .9; [.3, .5, .42, .72, .95].forEach((h, i) => { rrect(c, bx + i * 46 * u, by - h * 150 * u, 30 * u, h * 150 * u, [6 * u, 6 * u, 0, 0], i === 4 ? P.red : 'rgba(28,43,75,.22)'); }); }
    c.save(); if (typeof drawLogo === 'function') drawLogo(c, pad + 30 * u, FH - 70 * u, 64 * u, S.logo || 'TF'); say(c, S.series || 'TF', pad + 80 * u, FH - 58 * u, 34 * u, P.ink, 800, 'left', HEAD, FW * .4); c.restore();
  }

  /* ---------- sound effects (engine's play(name, time)) ---------- */
  function sfx(st, tl, S, play) {
    const pops = S.pops !== false; let first = true;
    st.scenes.forEach(sc => { if (sc.type === 'chapter') { play('whoosh', sc.start - .05); play('bell', sc.start + .22); } else if (sc.type === 'cta') { play('whoosh', sc.start); play('ding', sc.start + 2.1); } });
    tl.shots.forEach(sh => {
      const sc = st.scenes[sh.si], ln = sc.lines[sh.li]; if (!ln) return; const ty = ln.card && ln.card.type;
      if (sh.li === 0 && sc.type === 'story') play('whoosh', sh.start - .06);
      if (first && sc.type === 'story') { play('boom', sh.start); first = false; }
      if (ty === 'stat' || ty === 'counter' || ty === 'bars' || ty === 'split' || ty === 'compare' || ty === 'progress') { play('ding', sh.start + .35); if (ty === 'bars') for (let i = 0; i < 5; i++) play('pop', sh.start + .3 + i * .16); }
      else if (ty === 'timeline' || ty === 'flow' || ty === 'check') for (let i = 0; i < 5; i++) play('pop', sh.start + .25 + i * (ty === 'timeline' ? .35 : .4));
      else if (ty === 'date') play('ding', sh.start + .25); else if (ty === 'source') play('paper', sh.start + .3);
      else if (sc.type === 'takeaways') play('ding', sh.start + .1);
      else if (pops && sc.type === 'story') { const ws = ktWords(ln, sh), a = ws.find(w => w.hl); if (a) play(a.num ? 'ding' : 'pop', a.t0); ws.forEach((w, i) => { if (i % 3 === 1 && !w.hl) play('click', w.t0); }); }
    });
  }
  return { render, sfx, thumb, ICONS, iconFor, parseVal, version: 1 };
})();
