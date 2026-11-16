/* ===================== TF Story Studio — ইসলামিক অংশ: ছবি, লেখা ও আবহ =====================
   Loaded only for index.html?part=islamic (after islamic/story.js, before the main script).
   - faceless people (a soft light where the face would be), worshippers in salah, animals (goat, sheep, dumba, cow, camel, horse, donkey, doves, cat)
   - place + animals in a scene: "## village_yard+goat+sheep:700 day normal"
   - captions in the TF Post Maker "Islamic classic" style: Noto Serif Bengali, gold highlight with a swash, word-by-word reveal
   - Islamic background sound without instruments: humming (nasheed-like), soft drone, desert wind, night rain — all made offline */
(function () {
  'use strict';
  if (!/[?&]part=islamic\b/.test(location.search)) return;

  /* ---------- one-time settings update for this part (before the main script reads them) ---------- */
  try {
    if (!localStorage.getItem('tf_isl_v2')) {
      let o = {}; try { o = JSON.parse(localStorage.getItem('tf_isl_settings') || '{}') || {}; } catch (e) { }
      Object.assign(o, { capLook: 'islamic', capFont: 'serif', titleFont: 'galada', accFont: 'galada' });
      if (!o.music || o.music === 'none' || o.music === 'auto') o.music = 'isl_auto';
      localStorage.setItem('tf_isl_settings', JSON.stringify(o)); localStorage.setItem('tf_isl_v2', '1');
    }
  } catch (e) { }

  const GOLD = '#A87A26', GREEN = '#123D26', CREAM = '#F8F1DF';

  /* ---------- people in salah (faceless, simple) ---------- */
  function prayer(c, x, y, s, pose, col, cap) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const sk = '#D9AE86', face = '#F3DFC6', ln = 'rgba(40,30,20,.28)';
    ell(c, 0, 4, 70, 9, 'rgba(0,0,0,.14)');
    c.lineWidth = 3; c.strokeStyle = ln;
    const head = (hx, hy) => { circ(c, hx, hy, 27, sk, ln, 3); const g = c.createRadialGradient(hx + 4, hy + 4, 2, hx + 4, hy + 4, 22); g.addColorStop(0, 'rgba(255,248,235,.95)'); g.addColorStop(1, 'rgba(255,248,235,0)'); c.fillStyle = g; c.fillRect(hx - 26, hy - 20, 54, 50);
      P(c, `M${hx - 27},${hy - 4} Q${hx},${hy - 44} ${hx + 27},${hy - 4}Z`, cap || '#FFFFFF', ln, 3); };
    if (pose === 'qiyam' || pose === 'dua') {
      P(c, 'M-34,0 L-30,-150 Q0,-170 30,-150 L34,0Z', col, 'rgba(40,30,20,.28)', 3); line(c, 0, -150, 0, -20, 'rgba(0,0,0,.08)', 4);
      if (pose === 'qiyam') { line(c, -26, -118, 22, -126, shade(col, -.15), 14); circ(c, 22, -126, 9, sk); }
      else { P(c, 'M-28,-150 Q-46,-120 -26,-104', null, shade(col, -.12), 14); P(c, 'M28,-150 Q46,-120 26,-104', null, shade(col, -.12), 14); ell(c, -22, -104, 12, 8, sk); ell(c, 22, -104, 12, 8, sk); }
      head(0, -186);
    } else if (pose === 'ruku') {
      P(c, 'M-34,0 L-28,-100 L-6,-104 L-4,0Z', col, 'rgba(40,30,20,.28)', 3); P(c, 'M-34,-96 L70,-110 L74,-84 L-30,-72Z', col, 'rgba(40,30,20,.28)', 3); line(c, 40, -92, 46, -40, shade(col, -.15), 13); circ(c, 46, -38, 8, sk); head(92, -100);
    } else if (pose === 'sujud') {
      P(c, 'M-60,0 Q-70,-70 -30,-80 Q20,-70 60,-14 L60,0Z', col, 'rgba(40,30,20,.28)', 3); line(c, 40, -20, 70, -4, shade(col, -.15), 12); head(84, -18);
    } else { // jalsa — sitting on the knees
      P(c, 'M-56,0 Q-60,-40 -20,-44 L-24,-140 Q0,-154 24,-140 L28,-40 Q50,-30 54,0Z', col, 'rgba(40,30,20,.28)', 3); line(c, 0, -110, 30, -54, shade(col, -.15), 13); circ(c, 32, -50, 8, sk); head(0, -172);
    }
    c.restore();
  }
  // one rakah cycle (seconds): stand → bow → stand → prostrate → sit → prostrate → stand
  const CYCLE = [['qiyam', 4], ['ruku', 2.2], ['qiyam', 1.2], ['sujud', 2.4], ['jalsa', 1.4], ['sujud', 2.4]];
  const CYCLE_T = CYCLE.reduce((a, b) => a + b[1], 0);
  function poseAt(t) { let x = ((t % CYCLE_T) + CYCLE_T) % CYCLE_T; for (const [p, d] of CYCLE) { if (x < d) return p; x -= d; } return 'qiyam'; }

  /* ---------- animals (side view, gentle idle motion). a = x position (number), facing towards the centre ---------- */
  function beast(c, x, y, s, flip, fn) { c.save(); c.translate(x, y); c.scale(flip ? -s : s, s); ell(c, 0, 6, 110, 12, 'rgba(0,0,0,.12)'); fn(); c.restore(); }
  const legs = (c, xs, top, col, t, k) => xs.forEach((lx, i) => line(c, lx, top, lx + Math.sin(t * 2 + i) * (k || 0), 0, col, 14));
  const ANIMALS = {
    goat(c, t, x, y, s, f) { beast(c, x, y, s, f, () => { const col = '#8A6A4F', g = Math.sin(t * 1.4) * 6; legs(c, [-60, -35, 40, 62], -70, shade(col, -.2), t);
      ell(c, 0, -100, 90, 45, col); P(c, 'M-88,-118 Q-110,-150 -98,-160', null, shade(col, -.2), 8);
      c.save(); c.translate(78, -120 + g); P(c, 'M0,0 L40,-30 Q66,-20 62,6 Q46,20 24,16Z', col); P(c, 'M30,-28 Q24,-62 6,-70', null, '#4E3B2C', 7); P(c, 'M42,-28 Q44,-60 30,-72', null, '#4E3B2C', 7); P(c, 'M52,12 Q54,34 46,40', null, '#E8DED0', 7); ell(c, 14, -10, 16, 8, shade(col, -.15)); c.restore(); }); },
    sheep(c, t, x, y, s, f) { beast(c, x, y, s, f, () => { const g = Math.sin(t * 1.2) * 5; legs(c, [-50, -26, 36, 58], -60, '#3B3330', t);
      for (let i = 0; i < 9; i++) circ(c, -70 + (i % 5) * 34, -110 + Math.floor(i / 5) * 32 + (i % 2) * 6, 34, '#F4EFE6'); circ(c, -86, -96, 22, '#EDE6DA');
      c.save(); c.translate(82, -112 + g); ell(c, 18, 0, 28, 22, '#3B3330'); ell(c, 2, -16, 14, 7, '#3B3330'); circ(c, -6, -10, 22, '#F4EFE6'); c.restore(); }); },
    dumba(c, t, x, y, s, f) { beast(c, x, y, s * 1.1, f, () => { const g = Math.sin(t * 1.1) * 5; legs(c, [-56, -28, 40, 64], -62, '#5A4635', t);
      for (let i = 0; i < 10; i++) circ(c, -76 + (i % 5) * 36, -116 + Math.floor(i / 5) * 34 + (i % 2) * 6, 36, '#EFE4CF');
      ell(c, -104, -78, 34, 40, '#E7D8BC'); P(c, 'M-120,-60 Q-104,-40 -88,-60', null, '#D9C6A4', 5);
      c.save(); c.translate(88, -116 + g); ell(c, 20, 0, 30, 24, '#8B6A4A'); ell(c, 2, -18, 16, 8, '#8B6A4A'); P(c, 'M-4,-20 Q-30,-40 -20,-4', null, '#C8B28E', 9); c.restore(); }); },
    cow(c, t, x, y, s, f) { beast(c, x, y, s * 1.15, f, () => { const g = Math.sin(t * 1.1) * 5; legs(c, [-74, -46, 54, 80], -80, '#5D4A3E', t);
      rr(c, -100, -170, 200, 100, 46, '#F3EEE6'); ell(c, -40, -140, 36, 26, '#7A5A44'); ell(c, 40, -110, 30, 22, '#7A5A44'); P(c, 'M-100,-150 Q-122,-120 -112,-96', null, '#5D4A3E', 7);
      c.save(); c.translate(100, -150 + g); rr(c, 0, -26, 64, 54, 22, '#F3EEE6'); rr(c, 30, 4, 40, 28, 12, '#E6B9A6'); P(c, 'M8,-26 Q0,-50 -12,-48', null, '#D8CDBA', 8); P(c, 'M44,-26 Q52,-50 64,-48', null, '#D8CDBA', 8); c.restore(); }); },
    camel(c, t, x, y, s, f) { beast(c, x, y, s * 1.2, f, () => { const col = '#C49A6C', g = Math.sin(t * 1.3) * 5; legs(c, [-60, -36, 44, 68], -110, shade(col, -.15), t);
      ell(c, 0, -150, 100, 48, col); ell(c, -10, -196, 48, 42, col); c.save(); c.translate(86, -160); P(c, `M0,0 Q30,-40 40,-110 L64,-112 Q60,-50 22,10Z`, col); c.translate(44, -116 + g); rr(c, -6, -18, 58, 34, 16, col); ell(c, 4, -20, 8, 10, shade(col, -.15)); c.restore();
      P(c, 'M-98,-156 Q-118,-120 -108,-100', null, shade(col, -.2), 7); rr(c, -54, -214, 100, 28, 10, '#8E2B2B'); }); },
    horse(c, t, x, y, s, f) { beast(c, x, y, s * 1.15, f, () => { const col = '#6B4226', g = Math.sin(t * 1.5) * 5; legs(c, [-70, -46, 50, 74], -90, shade(col, -.15), t);
      ell(c, 0, -130, 100, 44, col); c.save(); c.translate(80, -150); P(c, 'M0,0 Q20,-60 40,-90 L66,-80 Q40,-40 26,14Z', col); c.translate(48, -90 + g); P(c, 'M0,0 L64,26 Q72,40 58,46 L-6,26Z', col); P(c, 'M-4,-4 L4,-24 L10,-2Z', col); c.restore();
      P(c, 'M80,-160 Q100,-220 128,-240', null, '#2B1B12', 12); P(c, 'M-98,-140 Q-130,-100 -116,-40', null, '#2B1B12', 12); }); },
    donkey(c, t, x, y, s, f) { beast(c, x, y, s, f, () => { const col = '#8E8A86', g = Math.sin(t * 1.2) * 6; legs(c, [-56, -34, 40, 60], -70, shade(col, -.2), t);
      ell(c, 0, -104, 86, 40, col); c.save(); c.translate(70, -118 + g); P(c, 'M0,0 L52,-26 Q74,-10 66,16 L20,20Z', col); P(c, 'M30,-20 L22,-74 L38,-24Z', col); P(c, 'M40,-22 L42,-76 L50,-24Z', col); ell(c, 64, 6, 10, 10, '#D7D1CB'); c.restore();
      P(c, 'M-84,-110 Q-100,-80 -92,-56', null, shade(col, -.2), 6); }); },
    cat(c, t, x, y, s, f) { beast(c, x, y, s * .7, f, () => { const col = '#9A9088'; ell(c, 0, -60, 54, 46, col); circ(c, 30, -118, 34, col); P(c, 'M8,-142 L14,-170 L30,-148Z', col); P(c, 'M36,-148 L52,-172 L58,-140Z', col);
      P(c, `M-50,-40 Q-100,-60 ${-90 + Math.sin(t * 2) * 14},-120`, null, col, 12); }); },
    doves(c, t, x) { for (let i = 0; i < 5; i++) { const px = ((x || 300) + t * 60 + i * 130) % (W + 200) - 100, py = 260 + Math.sin(t * 1.5 + i) * 30 + i * 36, w = Math.sin(t * 9 + i) * 18;
      ell(c, px, py, 22, 11, '#FFFFFF'); circ(c, px + 20, py - 6, 8, '#FFFFFF'); P(c, `M${px - 6},${py} Q${px - 20},${py - 30 - w} ${px - 36},${py - 18 - w}`, null, '#F2F2F2', 8); } }
  };
  function drawAnimal(name, c, t, a, outdoor) {
    const fn = ANIMALS[name]; if (!fn) return;
    if (name === 'doves') { fn(c, t, +a || 300); return; }
    const x = +a || 540, y = outdoor ? GY + 30 : 1450, s = outdoor ? 1 : 1.1;
    fn(c, t, x, y, s, x > 560);
  }

  /* ---------- extra places for everyday Islamic life ---------- */
  function addArt() {
    Object.assign(E, {
      salah(c, t, tm, a) { const out = a === 'out'; const rows = out ? [[GY - 10, .8], [GY + 150, .95]] : [[1250, .85], [1430, 1.0]];
        const col = ['#F7F5EF', '#E8E6DD', '#D8E3DC', '#EFE6D4'];
        rows.forEach(([y, s], r) => { for (let i = 0; i < 5; i++) { const x = 140 + i * 200 + (r ? 60 : 0); prayer(c, x, y, s, poseAt(t + (r * .15) + i * .05), col[(i + r) % 4], i % 3 === 1 ? '#F4E9D2' : '#FFFFFF'); } }); },
      musalli(c, t, tm, a) { const x = +String(a || '540').split('/')[0] || 540, p = String(a || '').split('/')[1] || ''; const y = 1400; rr(c, x - 170, y - 14, 340, 80, 14, '#2E5E4E'); rr(c, x - 150, y - 4, 300, 60, 10, null, '#C9A24A', 4); prayer(c, x, y, 2.1, p || poseAt(t), '#F4F1EA', '#FFFFFF'); },
      kaaba(c, t, tm) { const night = tm === 'night'; rect(c, 0, GY - 40, W, 400, night ? '#8E8A80' : '#E9E4DA'); for (let i = 0; i < 7; i++) withA(c, .15, () => ell(c, 540, GY + 120, 120 + i * 70, 30 + i * 12, null, '#fff', 4));
        rr(c, 380, GY - 420, 320, 440, 6, '#151515'); rect(c, 380, GY - 330, 320, 46, '#C9A24A'); for (let i = 0; i < 7; i++) withA(c, .6, () => rect(c, 392 + i * 44, GY - 324, 24, 34, '#8C6A20')); rr(c, 600, GY - 170, 56, 150, 6, '#C9A24A');
        for (let i = 0; i < 26; i++) { const ang = t * .25 + i * .24, px = 540 + Math.cos(ang) * (300 + (i % 3) * 60), py = GY + 120 + Math.sin(ang) * (60 + (i % 3) * 14); withA(c, .8, () => { circ(c, px, py - 40, 12, '#FFFFFF'); rr(c, px - 10, py - 30, 20, 34, 6, '#FFFFFF'); }); } },
      minaret(c, t, tm, a) { const x = +a || 860; rect(c, x - 30, GY - 640, 60, 650, '#EDE3CF'); rr(c, x - 50, GY - 520, 100, 24, 6, '#C9A24A'); P(c, `M${x - 34},${GY - 640} Q${x},${GY - 760} ${x + 34},${GY - 640}Z`, '#2F6B4F'); line(c, x, GY - 760, x, GY - 800, '#C9A24A', 5); circ(c, x, GY - 806, 8, '#C9A24A'); },
      rehalq(c, t) { const x = 540, y = 1400; P(c, `M${x - 160},${y} L${x},${y - 120} L${x + 160},${y} L${x + 140},${y + 20} L${x},${y - 92} L${x - 140},${y + 20}Z`, '#6D4C41');
        P(c, `M${x - 170},${y - 70} Q${x - 80},${y - 130} ${x},${y - 110} Q${x + 80},${y - 130} ${x + 170},${y - 70} L${x + 160},${y - 30} Q${x + 80},${y - 90} ${x},${y - 70} Q${x - 80},${y - 90} ${x - 160},${y - 30}Z`, '#F7F0DE');
        for (let i = 0; i < 4; i++) { line(c, x - 140 + i * 6, y - 74 + i * 9, x - 30, y - 96 + i * 9, '#7A6A55', 3); line(c, x + 30, y - 96 + i * 9, x + 140 - i * 6, y - 74 + i * 9, '#7A6A55', 3); } line(c, x, y - 110, x, y - 70, '#C9A24A', 4); },
      oillamp(c, t, tm, a) { const x = +a || 820, y = 1330; const g = c.createRadialGradient(x, y - 60, 6, x, y - 60, 340); g.addColorStop(0, 'rgba(255,190,90,.55)'); g.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = g; c.fillRect(x - 340, y - 400, 680, 680);
        ell(c, x, y, 60, 22, '#B8862F'); P(c, `M${x + 50},${y - 6} L${x + 90},${y - 24} L${x + 56},${y + 8}Z`, '#B8862F'); P(c, `M${x + 86},${y - 26} Q${x + 80 + Math.sin(t * 9) * 4},${y - 70} ${x + 92},${y - 90} Q${x + 104},${y - 60} ${x + 92},${y - 26}Z`, '#FFC24A'); },
      tasbih(c, t, tm, a) { const x = +a || 300, y = 1360; for (let i = 0; i < 33; i++) { const ang = i / 33 * Math.PI * 2; circ(c, x + Math.cos(ang) * 60, y + Math.sin(ang) * 24, 8, i === Math.floor(t * 2) % 33 ? '#E9C46A' : '#6D4C41'); } },
      crescentwin(c, t, tm) { rr(c, 620, 280, 300, 420, [150, 150, 10, 10], '#0f1c33'); for (let i = 0; i < 20; i++) circ(c, 640 + (i * 53) % 260, 320 + (i * 37) % 340, 2, '#FFF6DA'); circ(c, 800, 400, 46, '#F6EACB'); circ(c, 822, 388, 42, '#0f1c33'); rr(c, 620, 280, 300, 420, [150, 150, 10, 10], null, '#6D4C41', 14); line(c, 770, 280, 770, 700, '#6D4C41', 8); },
      graves(c, t, tm) { for (let i = 0; i < 6; i++) { const x = 90 + i * 180, y = GY + 40 + (i % 2) * 70; P(c, `M${x - 70},${y} Q${x},${y - 60} ${x + 70},${y}Z`, tm === 'night' ? '#4A4636' : '#9A8B6A'); rr(c, x - 10, y - 110, 20, 80, 6, '#E6E1D6'); } }
    });
    const DEFS = [
      ['tahajjud_room', 'তাহাজ্জুদের ঘর', 'wall:#3A3F52 crescentwin floor:carpet oillamp:860 >musalli:440'],
      ['night_dua', 'রাতে দোয়া', 'wall:#3A3F52 crescentwin floor:carpet oillamp:860 >musalli:460/dua'],
      ['quran_room', 'কুরআন পড়ার জায়গা', 'wall:#EDE3CF calligraphy lantern floor:carpet tasbih:240 >rehalq'],
      ['mosque_salah', 'মসজিদে জামাত', 'wall:#F1E9D6 mihrab lantern floor:carpet >salah'],
      ['eid_salah', 'ঈদের জামাত', 'sky mosquebld ground:grass >salah:out'],
      ['masjid_minaret', 'মিনারসহ মসজিদ', 'sky moon minaret:860 mosquebld palm:150 ground:grass'],
      ['kaaba_view', 'কাবা শরিফ', 'sky stars moon kaaba'],
      ['qabrastan', 'কবরস্থান', 'sky stars moon trees ground:grass graves'],
      ['goat_field', 'ছাগল-ভেড়ার মাঠ', 'sky hills trees ground:grass'],
      ['qurbani_haat', 'কুরবানির হাট', 'sky trees umbrellas ground:mud'],
      ['camel_desert', 'উটের কাফেলা', 'sky stars moon dunes ground:sand'],
      ['dove_sky', 'কবুতর ওড়া আকাশ', 'sky moon hills mosquebld ground:grass']
    ];
    DEFS.forEach(([k, b, r]) => {
      PLACE_DEFS.push([k, b, 'ইসলামিক জীবন', r]);
      const toks = r.split(/\s+/).filter(Boolean).map(s => { const fg = s[0] === '>'; const [n, ...a] = (fg ? s.slice(1) : s).split(':'); return { fg, n, a: a.join(':') }; });
      PLACE_INDEX[k] = { bn: b, group: 'ইসলামিক জীবন', toks, outdoor: toks.some(x => x.n === 'sky') }; PLACES[k] = b;
    });
    // default animals for some places
    const ADD = { goat_field: '+goat:260+sheep:620+sheep:860', qurbani_haat: '+cow:300+dumba:640+goat:900', camel_desert: '+camel:300+camel:720', dove_sky: '+doves:200' };
    Object.entries(ADD).forEach(([k, plus]) => { const p = PLACE_INDEX[k]; parsePlus(plus).forEach(an => p.toks.push(an)); });
  }
  // "+goat:300" → animal tokens drawn by the 'animal' element
  function parsePlus(s) { return String(s).split('+').slice(1).map(x => { const [n, a] = x.split(':'); return { fg: false, n: 'animal', a: n + ':' + (a || '') }; }).filter(x => ANIMALS[x.a.split(':')[0]]); }

  /* ---------- faceless people: a soft light instead of eyes and mouth ---------- */
  function noFace(c, L) {
    const g = c.createRadialGradient(0, -300, 8, 0, -300, 78); g.addColorStop(0, 'rgba(255,253,246,.98)'); g.addColorStop(.7, 'rgba(255,250,238,.9)'); g.addColorStop(1, 'rgba(255,250,238,0)');
    c.save(); c.beginPath(); c.ellipse(0, -300, 70, 79, 0, 0, Math.PI * 2); c.clip(); c.fillStyle = g; c.fillRect(-80, -390, 160, 180); c.restore();
  }

  /* ---------- captions: Post Maker "Islamic classic" look ---------- */
  function swash(c, x0, x1, y, fs, col) {
    const w = x1 - x0, dip = fs * .15, th = Math.max(2, fs * .1); c.save(); c.fillStyle = col;
    c.beginPath(); c.moveTo(x0 - fs * .05, y - dip * .2); c.quadraticCurveTo(x0 + w * .5, y + dip + th, x1 + fs * .08, y - dip * .55); c.quadraticCurveTo(x0 + w * .5, y + dip - th * .3, x0 - fs * .05, y - dip * .2); c.closePath(); c.fill();
    c.beginPath(); const dx = x1 + fs * .16, dy = y - dip * .7, q = fs * .06; c.moveTo(dx, dy - q); c.lineTo(dx + q, dy); c.lineTo(dx, dy + q); c.lineTo(dx - q, dy); c.closePath(); c.fill(); c.restore();
  }
  function islCaption(c, t, fw, fh, u) {
    fw = fw || W; fh = fh || H; u = u || 1;
    const R = this, k = R.shotAt(t), sh = R.tl.shots[k]; if (!sh) return;
    const sc = R.story.scenes[sh.si], ln = sc.lines[sh.li]; const end = sh.end + .12;
    if (t < sh.start || t > end || sc.type === 'ayah' || sc.type === 'cta') return;
    const Sx = R.settings, f = FONTS[Sx.capFont] || FONTS.serif, FAM = f.fam, WT = f.w || 700;
    const size = (Sx.capSize || 58) * u * .96, maxW = Math.min(fw * .8, 880 * u * (fw > fh ? 1.6 : 1)), cx = fw / 2;
    const words = ln.cap.split(/\s+/).filter(Boolean); if (ln.speak && words.length) { words[0] = '“' + words[0]; words[words.length - 1] += '”'; }
    let pages = [words]; const full = wrapText(c, words.join(' '), size, maxW, WT, FAM);
    if (full.length > 2) { const n = Math.ceil(full.length / 2), per = Math.ceil(words.length / n); pages = []; for (let i = 0; i < words.length; i += per) pages.push(words.slice(i, i + per)); }
    const total = ln.cap.length, rel = (t - sh.start) / Math.max(.1, sh.dur); let acc = 0, pi = 0;
    for (let i = 0; i < pages.length; i++) { const len = (pages[i].join(' ').length + 1) / (total + 1); if (rel < acc + len || i === pages.length - 1) { pi = i; break; } acc += len; }
    const pg = pages[pi], pageStart = sh.start + acc * sh.dur, pageDur = Math.max(.2, ((pg.join(' ').length + 1) / (total + 1)) * sh.dur);
    const hlSet = new Set(); (ln.hl || '').split('|').map(s => s.trim()).filter(Boolean).forEach(h => h.split(/\s+/).forEach(w => hlSet.add(w.replace(/[।,.!?“”]/g, ''))));
    c.font = `${WT} ${size}px ${FAM}, ${FONT_FALLBACK}`;
    const sp = Math.max(c.measureText(' ').width, size * .3), ww = pg.map(w => c.measureText(w).width), tot = ww.reduce((a, b) => a + b, 0) + sp * (pg.length - 1);
    let lines = [pg.map((w, i) => i)];
    if (tot > maxW) { let best = 1, bestD = 1e9; for (let i = 1; i < pg.length; i++) { const l1 = ww.slice(0, i).reduce((a, b) => a + b, 0) + sp * (i - 1), l2 = tot - l1 - sp; const d = Math.abs(l1 - l2) + (Math.max(l1, l2) > maxW ? 1e6 : 0); if (d < bestD) { bestD = d; best = i; } } lines = [lines[0].slice(0, best), lines[0].slice(best)]; }
    const lw = lines.map(l => l.reduce((s2, i) => s2 + ww[i], 0) + sp * (l.length - 1));
    const lh = size * 1.5, boxW = Math.min(fw * .94, Math.max(...lw) + 110 * u), boxH = lines.length * lh + 52 * u, y0 = fh - boxH - (fw > fh ? 70 : 270) * u, bx = cx - boxW / 2;
    const cum = []; let cc = 0; pg.forEach(w => { cum.push(cc); cc += w.length + 1; });
    const prog = (t + .05 - pageStart) / pageDur * cc, kk = eo(cl((t - pageStart) / .3)), out = cl((end - t) / .15);
    c.save(); c.globalAlpha *= Math.min(kk, out); c.translate(0, (1 - kk) * 24 * u);
    c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 28 * u; c.shadowOffsetY = 10 * u; rr(c, bx, y0, boxW, boxH, 30 * u, 'rgba(248,241,223,.97)'); c.restore();
    rr(c, bx + 9 * u, y0 + 9 * u, boxW - 18 * u, boxH - 18 * u, 23 * u, null, 'rgba(168,122,38,.55)', 2.2 * u);
    const dm = 9 * u; c.save(); c.fillStyle = GOLD; c.beginPath(); c.moveTo(cx, y0 - dm); c.lineTo(cx + dm, y0); c.lineTo(cx, y0 + dm); c.lineTo(cx - dm, y0); c.closePath(); c.fill(); c.restore();
    c.textAlign = 'left';
    lines.forEach((l, li) => { let x = cx - lw[li] / 2; const y = y0 + 26 * u + lh * (li + .72);
      l.forEach(i => { const w = pg[i], wd = ww[i], hl = hlSet.has(w.replace(/[।,.!?“”]/g, ''));
        const st = cum[i], q = cl((prog - st) / 3.5); const a = .18 + .82 * eo(q), rise = (1 - eo(q)) * 14 * u;
        c.save(); c.globalAlpha *= a; c.fillStyle = hl ? GOLD : GREEN; c.fillText(w, x, y + rise);
        if (hl && q > .3) { c.globalAlpha *= eo(cl((q - .3) / .7)); swash(c, x, x + wd * eo(cl((q - .3) / .7)), y + size * .3, size, GOLD); }
        c.restore(); x += wd + sp; }); });
    c.restore();
  }

  /* ---------- Islamic background sound (no instruments) ---------- */
  const ISL_MUSIC = { isl_auto: 'ইসলামিক অটো (দৃশ্য অনুযায়ী, বাদ্যযন্ত্র ছাড়া)', nasheed: 'নাশিদ-ধাঁচের হামিং (কণ্ঠ)', nasheed_soft: 'নরম হামিং (ধীর)', drone: 'শান্ত গুঞ্জন', desert_wind: 'মরুভূমির বাতাস', night_rain: 'রাতের বৃষ্টি' };
  // maqam-like scales (semitones from the tonic): Hijaz and Rast-ish (without quarter tones)
  const HIJAZ = [0, 1, 4, 5, 7, 8, 10, 12], RAST = [0, 2, 4, 5, 7, 9, 10, 12];
  function voice(ctx, dest, f, t0, dur, vol, vowel) {
    const F = vowel === 'oo' ? [[320, 6], [800, 8], [2400, 10]] : vowel === 'mm' ? [[260, 4], [1800, 12]] : [[700, 7], [1150, 9], [2600, 12]];
    const env = ctx.createGain(); env.gain.setValueAtTime(0, t0); env.gain.linearRampToValueAtTime(vol, t0 + Math.min(.35, dur * .3)); env.gain.setValueAtTime(vol, t0 + dur * .7); env.gain.linearRampToValueAtTime(0, t0 + dur); env.connect(dest);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.connect(env);
    const bands = F.map(([fq, q]) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fq; b.Q.value = q; const g = ctx.createGain(); g.gain.value = 1.6; b.connect(g); g.connect(lp); return b; });
    [-7, 0, 6].forEach(det => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t0); o.detune.value = det;
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5 + Math.random() * .8; lg.gain.value = f * .006; lfo.connect(lg); lg.connect(o.frequency);
      bands.forEach(b => o.connect(b)); o.start(t0); o.stop(t0 + dur + .05); lfo.start(t0); lfo.stop(t0 + dur + .05); });
  }
  function noiseLayer(ctx, dest, noise, t0, t1, kind) {
    const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    if (kind === 'wind') { f.type = 'bandpass'; f.frequency.setValueAtTime(400, t0); f.Q.value = .8; for (let t = t0; t < t1; t += 3) f.frequency.linearRampToValueAtTime(300 + Math.random() * 500, t + 3); g.gain.value = .22; }
    else { f.type = 'highpass'; f.frequency.value = 1800; g.gain.value = .045; }
    s.connect(f); f.connect(g); g.connect(dest); s.start(t0); s.stop(t1);
  }
  function islMusic(ctx, dest, st, t0, t1, noise, seed, sc) {
    if (st === 'isl_auto') st = !sc ? 'nasheed' : sc.type === 'ayah' ? 'drone' : (sc.type === 'takeaways' || sc.type === 'cta') ? 'nasheed' : sc.mood === 'tense' ? 'desert_wind' : (sc.mood === 'sad' || sc.mood === 'regret') ? 'nasheed_soft' : sc.time === 'night' ? 'nasheed_soft' : 'nasheed';
    const root = 146.83; // D3
    const nf = k => root * Math.pow(2, k / 12);
    const drone = (vol) => { for (let t = t0; t < t1 - .1; t += 6) voice(ctx, dest, root / 2, t, Math.min(6.4, t1 - t), vol, 'mm'); };
    if (st === 'drone') { drone(.08); return; }
    if (st === 'desert_wind') { noiseLayer(ctx, dest, noise, t0, t1, 'wind'); drone(.03); return; }
    if (st === 'night_rain') { noiseLayer(ctx, dest, noise, t0, t1, 'rain'); drone(.035); return; }
    const scale = (st === 'nasheed_soft') ? HIJAZ : RAST, slow = st === 'nasheed_soft' ? 1.5 : 1;
    drone(.06);
    let r = (seed * 9301 + 49297) % 233280, deg = 4;
    const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    for (let t = t0 + .3; t < t1 - .6;) {
      const d = (rnd() < .3 ? 1.6 : rnd() < .6 ? 1.1 : .8) * slow; deg = Math.max(0, Math.min(7, deg + (rnd() < .5 ? -1 : 1) * (rnd() < .2 ? 2 : 1)));
      voice(ctx, dest, nf(scale[deg] + 12), t, Math.min(d + .15, t1 - t), .058, rnd() < .5 ? 'aa' : 'oo');
      t += d; if (rnd() < .18) t += .5 * slow; // breathing pause
    }
  }


  /* ---------- thumbnail / first frame: the most emotional moment + a big hook line ---------- */
  function pickCoverShot(st, tl) {
    let best = -1, bs = -1e9;
    st.scenes.forEach((sc, si) => { if (sc.type !== 'story') return; let s = 0;
      if (/sad|tense|regret/.test(sc.mood || '')) s += 3; if (sc.time === 'night') s += 1; if (sc.cast && sc.cast.length) s += 2;
      sc.lines.forEach(l => { if (/crying|sad|worried|surprised/.test(l.feel || '')) s += 2; if (/pray_hands/.test(l.do || '')) s += 1.5; });
      s -= si * .35; if (s > bs) { bs = s; best = si; } });
    if (best < 0) best = Math.max(0, st.scenes.findIndex(x => x.type === 'story'));
    const shots = (tl.shots || []).filter(sh => sh.si === best);
    const sh = shots.find(x => /crying|sad|worried|surprised/.test((st.scenes[best].lines[x.li] || {}).feel || '')) || shots[0] || tl.shots[0];
    return { si: best, t: sh ? sh.start + Math.min(.6, sh.dur * .4) : 0 };
  }
  function hookLine(c, s, y, size, base, hi, maxW) {
    const parts = []; String(s || '').split(/(\{[^}]*\})/).forEach(p => { if (!p) return; const h = p[0] === '{'; p.replace(/[{}]/g, '').split(/\s+/).filter(Boolean).forEach(w => parts.push({ w, h })); });
    if (!parts.length) return 0; let sz = size, sp = 0, tw = 0;
    const meas = () => { c.font = `700 ${sz}px TFAtma, ${FONT_FALLBACK}`; sp = c.measureText(' ').width; tw = parts.reduce((a, p) => a + c.measureText(p.w).width, 0) + sp * (parts.length - 1); };
    meas(); while (tw > maxW && sz > 56) { sz -= 4; meas(); }
    let x = 540 - tw / 2; c.textAlign = 'left'; c.lineJoin = 'round';
    parts.forEach(p => { const w = c.measureText(p.w).width;
      c.save(); c.lineWidth = sz * .2; c.strokeStyle = 'rgba(6,18,12,.92)'; c.strokeText(p.w, x, y); c.shadowColor = p.h ? 'rgba(255,200,80,.55)' : 'rgba(0,0,0,.4)'; c.shadowBlur = p.h ? 30 : 10; c.fillStyle = p.h ? hi : base; c.fillText(p.w, x, y); c.restore();
      if (p.h) swash(c, x, x + w, y + sz * .22, sz * .9, hi);
      x += w + sp; });
    return sz;
  }
  function drawCoverIslamic(c, R) {
    const st = R.story, tl = R.tl; if (!st || !tl) return; const d = coverData(st), Sx = (typeof S !== 'undefined' ? S : {});
    const { si, t } = pickCoverShot(st, tl), sc = st.scenes[si] || {}, people = (sc.cast || []).length;
    c.save();
    const off = document.createElement('canvas'); off.width = W; off.height = H; const oc = off.getContext('2d', { alpha: false });
    R._camOverride = clampCam({ x: 540, y: people ? 1180 : 1000, z: people ? 1.34 : 1.12 }); try { R.drawScene(oc, si, t); } catch (e) { rect(oc, 0, 0, W, H, '#1E3A2F'); } R._camOverride = null;
    c.drawImage(off, 0, 0, W, H);
    // cinematic grade: warm light, dark edges, darker bottom for the text
    c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(255,180,90,.35)'; c.fillRect(0, 0, W, H); c.restore();
    const vg = c.createRadialGradient(540, 760, 200, 540, 900, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.62)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(4,14,10,.55)'); g.addColorStop(.16, 'rgba(4,14,10,0)'); g.addColorStop(.46, 'rgba(4,14,10,.05)'); g.addColorStop(.7, 'rgba(4,14,10,.82)'); g.addColorStop(1, 'rgba(4,14,10,.94)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // light from above (noor)
    c.save(); c.globalCompositeOperation = 'screen'; for (let i = 0; i < 5; i++) { c.globalAlpha = .05; P(c, `M${470 + i * 30},0 L${510 + i * 30},0 L${220 + i * 150},1300 L${120 + i * 150},1300Z`, '#FFE7B0'); } c.restore();
    // gold frame corners
    const k = 46, L = 120; c.save(); c.strokeStyle = 'rgba(233,196,106,.85)'; c.lineWidth = 6; [[k, k, 1, 1], [W - k, k, -1, 1], [k, H - k, 1, -1], [W - k, H - k, -1, -1]].forEach(([x, y, sx, sy]) => { c.beginPath(); c.moveTo(x, y + sy * L); c.lineTo(x, y); c.lineTo(x + sx * L, y); c.stroke(); c.save(); c.fillStyle = '#E9C46A'; c.translate(x + sx * 18, y + sy * 18); c.rotate(Math.PI / 4); c.fillRect(-7, -7, 14, 14); c.restore(); }); c.restore();
    // source badge
    const ay = st.scenes.find(x => x.type === 'ayah'); const isQ = ay ? !/বুখারি|হাদিস|মুসলিম|তিরমিজি|মাজাহ|মুফরাদ/.test(ay.ref || '') : true;
    const badge = isQ ? 'কুরআনের আলোয়' : 'হাদিসের আলোয়'; c.font = `400 44px TFGalada, ${FONT_FALLBACK}`; const bw = c.measureText(badge).width + 70;
    c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 16; rr(c, 80, 96, bw, 74, 37, '#0F3D24'); c.restore(); rr(c, 86, 102, bw - 12, 62, 31, null, '#E9C46A', 3); txt(c, badge, 80 + bw / 2, 146, 44, '#F3DFA2', 400, 'center', 'TFGalada');
    if (Sx.watermark !== false) { c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 12; drawLogo(c, W - 130, 134, 92, Sx.logo || 'প্র'); c.restore(); }
    // teaser ribbon + the hook
    let y = 1130;
    if (d.ctx) { drawTeaserBanner(c, d.ctx, y - 210, 1, W); }
    let l1 = d.l1 || '', l2 = d.l2 || ''; if (!/\{/.test(l1 + l2) && l2) { const w = l2.split(/\s+/); l2 = (w.length > 1 ? w.slice(0, -1).join(' ') + ' ' : '') + '{' + w[w.length - 1] + '}'; }
    const s1 = hookLine(c, l1, y + 40, 112, '#FFFFFF', '#FFD15C', 940);
    if (l2) hookLine(c, l2, y + 40 + s1 * 1.22 + 10, 138, '#FFFFFF', '#FFD15C', 960);
    // nudge to watch
    const ny = 1600; c.font = `700 40px ${FONT_CAP}, ${FONT_FALLBACK}`; const nt = 'শেষ পর্যন্ত দেখুন', nw = c.measureText(nt).width + 110;
    c.save(); c.globalAlpha = .92; rr(c, 540 - nw / 2, ny - 50, nw, 76, 38, 'rgba(122,31,26,.92)'); c.restore(); txt(c, nt, 540 - 22, ny + 2, 40, '#FFF3E0', 700, 'center', FONT_CAP);
    P(c, `M${540 + nw / 2 - 66},${ny - 16} l20,0 l-10,14Z`, '#FFC857');
    c.restore();
  }
  window.ISL_ART_PATCH = function () {
    try { if (!localStorage.getItem('tf_isl_v2b')) { Object.assign(S, { capLook: 'islamic', capFont: 'serif', titleFont: 'galada', accFont: 'galada' }); if (!S.music || S.music === 'none' || S.music === 'auto') S.music = 'isl_auto'; saveSettings(); localStorage.setItem('tf_isl_v2b', '1'); } } catch (e) { }
    addArt();
    // thumbnail theme (also the first frame of the video, which Facebook/YouTube take as the cover)
    COVER_THEMES.islamic = { name: 'ইসলামিক আকর্ষণীয়', islamic: true };
    try { if (!localStorage.getItem('tf_isl_v3')) { S.coverTheme = 'islamic'; S.coverFirstFrame = true; saveSettings(); localStorage.setItem('tf_isl_v3', '1'); } } catch (e) { }
    const _dc = drawCover; drawCover = function (c, r, k) { const key = k || S.coverTheme; if (key === 'islamic') return drawCoverIslamic(c, r); return _dc(c, r, k); };
    E.animal = function (c, t, tm, a) { const [n, x] = String(a || '').split(':'); drawAnimal(n, c, t, x, true); };
    // "place+animal:x+animal" in a scene heading → that place with animals added
    const _np = normPlace;
    normPlace = function (p) {
      const s = String(p || '').trim();
      if (s.includes('+')) { const key = s.toLowerCase(); if (PLACE_INDEX[key]) return key; const base = _np(s.split('+')[0]); const b = PLACE_INDEX[base]; if (!b) return base;
        const toks = b.toks.slice(); parsePlus(key.slice(key.indexOf('+'))).forEach(an => { an.a = an.a.split(':')[0] + ':' + (an.a.split(':')[1] || ''); if (!b.outdoor) an.n = 'animalIn'; toks.push(an); });
        PLACE_INDEX[key] = { bn: b.bn, group: b.group, toks, outdoor: b.outdoor }; PLACES[key] = b.bn; return key; }
      return _np(p);
    };
    E.animalIn = function (c, t, tm, a) { const [n, x] = String(a || '').split(':'); drawAnimal(n, c, t, x, false); };
    // foreground (drawn every frame, sharp and moving): animals, people in salah, a musalli, the Quran stand
    ['salah', 'musalli', 'rehalq'].forEach(k => { FGE[k] = E[k]; });
    // faceless people
    drawFace = function (c, L) { noFace(c, L); };
    // captions
    const RP = StoryRenderer.prototype, _cap = RP.drawCaption;
    RP.drawCaption = function (c, t, fw, fh, u) { if ((this.settings.capLook || 'islamic') === 'islamic') return islCaption.call(this, c, t, fw, fh, u); return _cap.call(this, c, t, fw, fh, u); };
    // background sound
    Object.keys(MUSIC_STYLES).forEach(k => { if (!['none', 'upload'].includes(k)) delete MUSIC_STYLES[k]; });
    Object.assign(MUSIC_STYLES, ISL_MUSIC);
    const _sm = sceneMusic;
    let SC_NOW = null;
    sceneMusic = function (ctx, dest, st, prog, t0, t1, noise, seed) { if (ISL_MUSIC[st]) return islMusic(ctx, dest, st, t0, t1, noise, seed, SC_NOW && SC_NOW[seed]); return _sm(ctx, dest, st, prog, t0, t1, noise, seed); };
    // sceneMusic gets the scene index as "seed"; keep the scenes at hand for the automatic choice
    const _pf = progFor; progFor = function (sc) { try { SC_NOW = (window.TFStudio && TFStudio.app && TFStudio.app.story) ? TFStudio.app.story.scenes : SC_NOW; } catch (e) { } return _pf(sc); };
  };
  window.ISL_ART_DOM = function () {
    const sel = $('sCapLook'); if (sel && !sel.querySelector('option[value="islamic"]')) { sel.prepend(el('option', { value: 'islamic', text: 'ইসলামিক ক্লাসিক (পোস্ট মেকারের মতো)' })); sel.value = S.capLook || 'islamic'; }
    const ct = $('coverTheme'); if (ct && !ct.querySelector('option[value="islamic"]')) { ct.prepend(el('option', { value: 'islamic', text: 'ইসলামিক আকর্ষণীয় (আবেগের মুহূর্ত + বড় শিরোনাম)' })); ct.value = S.coverTheme || 'islamic'; }
    const ms = $('mStyle'); if (ms) { ms.innerHTML = ''; Object.entries(MUSIC_STYLES).forEach(([k, v]) => ms.append(el('option', { value: k, text: v }))); ms.value = MUSIC_STYLES[S.music] ? S.music : 'isl_auto'; }
  };
})();
