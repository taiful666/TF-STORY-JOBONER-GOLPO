/* TF Story Studio — thumb-art.js: subject pictures for the pro thumbnail background (all parts, all ratios).
   The thumbnail background must show what the story is about: "দ্বিতীয় টিফিন বক্স" → two tiffin carriers on a table,
   "দুই প্রদীপের গল্প" → two clay lamps, "মায়ের চিঠি" → a letter … Each subject = id, Bangla label, word regex, mood
   (backdrop), draw(c) in a unit box (bottom-centre at 0,0, about 100 units tall, y up = negative).
   API window.TF_THUMB_ART: list [{id,label}], pick(text) → {id, two, id2} | null, best(text) (most-mentioned subject in a
   long text), draw(c, FW, FH, pick, kind). New subject = one row in ART (+ its words). Loaded after index.html's code. */
(function () {
  'use strict';
  if (typeof P === 'undefined' || typeof rr === 'undefined') return;
  const lg = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; };
  const rg = (c, x, y, r0, r1, a, b) => { const g = c.createRadialGradient(x, y, r0, x, y, r1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const glow = (c, x, y, r, a, col) => { c.fillStyle = rg(c, x, y, 1, r, `rgba(${col || '255,200,110'},${a})`, `rgba(${col || '255,200,110'},0)`); c.fillRect(x - r, y - r, r * 2, r * 2); };
  const flame = (c, x, y, h) => { glow(c, x, y - h * .5, h * 1.6, .55); P(c, `M${x},${y - h} Q${x + h * .42},${y - h * .35} ${x},${y} Q${x - h * .42},${y - h * .35} ${x},${y - h}Z`, '#FF9800'); P(c, `M${x},${y - h * .72} Q${x + h * .26},${y - h * .25} ${x},${y} Q${x - h * .26},${y - h * .25} ${x},${y - h * .72}Z`, '#FFD54F'); ell(c, x, y - h * .16, h * .09, h * .17, '#FFFDE7'); };
  const metal = (c, a, b) => lg(c, a, 0, b, 0, ['#6E7A86', '#C9D3DC', '#F7FAFC', '#AEB9C3', '#5E6A75']);
  const gold = (c, a, b) => lg(c, a, 0, b, 0, ['#8A5A12', '#E9B949', '#FFF1B8', '#D4A032', '#7A4E0E']);
  const crescent = (c, x, y, r, fill) => { c.save(); c.beginPath(); c.rect(x - r * 3, y - r * 3, r * 6, r * 6); c.arc(x + r * .42, y - r * .22, r * .82, 0, Math.PI * 2, true); c.clip('evenodd'); circ(c, x, y, r, fill); c.restore(); };
  const wood = (c, y0, y1) => lg(c, 0, y0, 0, y1, ['#A0683F', '#7A4A2A', '#5A341C']);

  /* ---------- the pictures (unit box) ---------- */
  const D = {
    tiffin(c) { const g = metal(c, -36, 36); for (let i = 0; i < 3; i++) { const y = -6 - i * 25; rr(c, -33, y - 22, 66, 22, 5, g); rr(c, -36, y - 24, 72, 5, 2, '#D5DDE4'); line(c, -30, y - 11, 30, y - 11, 'rgba(0,0,0,.12)', 1.5); }
      rr(c, -28, -92, 56, 12, 6, g); circ(c, 0, -94, 5, '#9AA5AF'); rect(c, -41, -84, 5, 80, '#56616B'); rect(c, 36, -84, 5, 80, '#56616B');
      P(c, 'M-38.5,-84 Q-40,-112 0,-112 Q40,-112 38.5,-84', null, '#56616B', 6); withA(c, .55, () => rect(c, -22, -82, 3.5, 74, '#fff')); },
    lamp(c) { flame(c, 26, -30, 50); P(c, 'M-50,-24 Q-44,0 0,0 Q44,0 50,-24 Q30,-33 0,-33 Q-30,-33 -50,-24Z', lg(c, -50, 0, 50, 0, ['#7A3A12', '#C8742F', '#E9A15C', '#A9561F', '#6B300E']));
      ell(c, 0, -25, 46, 8, '#4A230C'); ell(c, 0, -25, 40, 6, '#B8860B'); P(c, 'M44,-27 Q54,-34 50,-24', '#A9561F'); line(c, 20, -27, 26, -31, '#3E2723', 3);
      P(c, 'M-50,-24 Q-30,-31 0,-31', null, 'rgba(255,230,190,.5)', 2); },
    lantern(c) { glow(c, 0, -50, 110, .6); rr(c, -30, -8, 60, 10, 4, '#B71C1C'); P(c, 'M-24,-8 Q-38,-48 -20,-82 L20,-82 Q38,-48 24,-8Z', 'rgba(255,236,179,.78)', '#8D6E63', 2.5); flame(c, 0, -30, 26);
      rr(c, -26, -94, 52, 12, 5, '#B71C1C'); P(c, 'M-22,-94 Q0,-130 22,-94', null, '#37474F', 3.5); line(c, -26, -6, -26, -88, '#7F1010', 3); line(c, 26, -6, 26, -88, '#7F1010', 3); rr(c, -36, 0, 72, 6, 3, '#7F1010'); },
    candle(c) { flame(c, 0, -82, 26); rr(c, -13, -80, 26, 74, 4, lg(c, -13, 0, 13, 0, ['#E8DFC8', '#FFFDF5', '#E6DCC2'])); P(c, 'M-13,-76 Q-8,-62 -10,-56 Q-6,-60 -4,-76Z', '#FFFDF5'); line(c, 0, -80, 0, -86, '#333', 2);
      ell(c, 0, -4, 34, 8, '#B08D57'); ell(c, 0, -7, 26, 5, '#D7B57A'); },
    book(c) { P(c, 'M0,-6 Q-30,-18 -66,-8 L-66,-72 Q-30,-82 0,-70Z', lg(c, -66, 0, 0, 0, ['#E8DCC2', '#FFFDF5'])); P(c, 'M0,-6 Q30,-18 66,-8 L66,-72 Q30,-82 0,-70Z', lg(c, 0, 0, 66, 0, ['#FFFDF5', '#E8DCC2']));
      P(c, 'M0,-2 Q-32,-14 -70,-4 L-70,0 Q-32,-10 0,2 Q32,-10 70,0 L70,-4 Q32,-14 0,-2Z', '#7B3F1D'); line(c, 0, -70, 0, -6, 'rgba(0,0,0,.25)', 1.5);
      for (let i = 0; i < 6; i++) { const y = -62 + i * 8; line(c, -58, y + 1, -10, y - 3 + i * .6, 'rgba(60,40,20,.28)', 1.6); line(c, 10, y - 3 + i * .6, 58, y + 1, 'rgba(60,40,20,.28)', 1.6); } },
    quran(c) { P(c, 'M-46,0 L36,-46 M46,0 L-36,-46', null, '#6D3F1F', 7); P(c, 'M-4,-40 Q-30,-52 -60,-44 L-60,-92 Q-30,-100 -4,-88Z', '#0E5A3A', '#D4AF37', 2); P(c, 'M4,-40 Q30,-52 60,-44 L60,-92 Q30,-100 4,-88Z', '#0E5A3A', '#D4AF37', 2);
      P(c, 'M0,-42 Q-26,-52 -54,-46 L-54,-88 Q-26,-95 0,-84Z', '#FFF8E1'); P(c, 'M0,-42 Q26,-52 54,-46 L54,-88 Q26,-95 0,-84Z', '#FFF8E1');
      for (let i = 0; i < 4; i++) { line(c, -46, -78 + i * 9, -8, -80 + i * 9 + 2, 'rgba(14,90,58,.45)', 1.6); line(c, 8, -80 + i * 9 + 2, 46, -78 + i * 9, 'rgba(14,90,58,.45)', 1.6); } glow(c, 0, -70, 80, .35, '255,236,170'); },
    mosque(c) { const g = lg(c, 0, -100, 0, 0, ['#E9F5EE', '#B9D8C6']); rr(c, -60, -42, 120, 42, 3, g); P(c, 'M-34,-42 Q-34,-86 0,-92 Q34,-86 34,-42Z', gold(c, -34, 34)); line(c, 0, -92, 0, -104, '#C99A2E', 2.5);
      crescent(c, 0, -108, 6, '#F2C14E'); [-70, 70].forEach(x => { rect(c, x - 6, -88, 12, 88, '#D7EBDF'); P(c, `M${x - 7},-88 L${x},-104 L${x + 7},-88Z`, '#C99A2E'); rect(c, x - 8, -66, 16, 4, '#9CC3AE'); });
      [-36, 0, 36].forEach(x => P(c, `M${x - 9},0 L${x - 9},-18 Q${x},-30 ${x + 9},-18 L${x + 9},0Z`, '#2F5D4A')); },
    jaynamaz(c) { P(c, 'M-58,0 L58,0 L40,-60 L-40,-60Z', lg(c, 0, -60, 0, 0, ['#7A1E2B', '#A8323F'])); P(c, 'M-48,-6 L48,-6 L34,-54 L-34,-54Z', null, '#E9C46A', 2.2);
      P(c, 'M-14,-54 L-14,-40 Q0,-30 14,-40 L14,-54', null, '#E9C46A', 2); P(c, 'M-20,-20 L20,-20', null, '#E9C46A', 1.5); for (let i = 0; i < 7; i++) line(c, -50 + i * 16.6, 0, -50 + i * 16.6, 5, '#E9C46A', 1.4); },
    tasbih(c) { for (let i = 0; i < 33; i++) { const a = i / 33 * Math.PI * 2; circ(c, Math.cos(a) * 34, -56 + Math.sin(a) * 30, 5.2, i % 11 ? '#8D5524' : '#D4A032', 'rgba(0,0,0,.25)', 1); }
      rr(c, -4, -30, 8, 12, 3, '#D4A032'); P(c, 'M-6,-18 L-10,8 L10,8 L6,-18Z', '#2E7D32'); for (let i = 0; i < 5; i++) line(c, -8 + i * 4, -6, -9 + i * 4.5, 10, '#1B5E20', 1.5); },
    money(c) { for (let i = 0; i < 5; i++) { const y = -6 - i * 9; rr(c, -46, y - 9, 92, 10, 2, i % 2 ? '#7CB342' : '#8BC34A', 'rgba(0,0,0,.25)', 1); rect(c, -10, y - 9, 20, 10, '#E1BEE7'); }
      c.save(); c.translate(0, -60); [-24, -8, 8, 24].forEach((r, i) => { c.save(); c.rotate(r * Math.PI / 180); rr(c, -22, -60, 44, 70, 3, ['#AED581', '#F48FB1', '#81C784', '#FFB74D'][i], 'rgba(0,0,0,.3)', 1.2); rr(c, -16, -52, 32, 54, 2, null, 'rgba(0,0,0,.25)', 1); circ(c, 0, -26, 9, 'rgba(255,255,255,.5)'); c.restore(); }); c.restore();
      c.save(); c.font = `800 18px ${typeof FONT_BN !== 'undefined' ? FONT_BN : 'sans-serif'}`; c.fillStyle = '#1B5E20'; c.textAlign = 'center'; c.fillText('৳', 0, -78); c.restore(); },
    coins(c) { const g = gold(c, -40, 40); [[-30, 0, 5], [0, 0, 8], [30, 0, 6], [-15, -40, 4], [15, -40, 5], [0, -66, 3]].forEach(([x, y, n]) => { for (let i = 0; i < n; i++) { ell(c, x, y - 4 - i * 6, 16, 5, g, '#7A4E0E', 1); } });
      c.save(); c.translate(36, -64); c.rotate(-.3); ell(c, 0, 0, 22, 22, g, '#7A4E0E', 2); c.font = `800 22px ${typeof FONT_BN !== 'undefined' ? FONT_BN : 'sans-serif'}`; c.fillStyle = '#7A4E0E'; c.textAlign = 'center'; c.fillText('৳', 0, 8); c.restore(); },
    letter(c) { c.save(); c.rotate(-.06); rr(c, -36, -96, 64, 70, 2, '#FFFDF5', 'rgba(0,0,0,.2)', 1); for (let i = 0; i < 5; i++) line(c, -28, -84 + i * 10, 20 - (i === 4 ? 20 : 0), -84 + i * 10, 'rgba(30,60,120,.45)', 1.8); c.restore();
      rr(c, -56, -50, 112, 50, 3, '#F3E5C8', '#C9B48A', 1.5); P(c, 'M-56,-50 L0,-18 L56,-50', null, '#C9B48A', 1.8); P(c, 'M-56,0 L-14,-26 M56,0 L14,-26', null, '#D8C7A0', 1.5); circ(c, 0, -18, 9, '#B71C1C'); circ(c, 0, -18, 5, '#8E1212'); },
    key(c) { const g = gold(c, -40, 40); c.save(); c.rotate(-.5); circ(c, -40, -30, 22, g, '#7A4E0E', 2); circ(c, -40, -30, 10, '#2B1A08'); rr(c, -20, -34, 78, 9, 3, g, '#7A4E0E', 1.5); rect(c, 40, -26, 7, 16, '#C99A2E'); rect(c, 52, -26, 7, 11, '#C99A2E'); c.restore(); },
    lock(c) { P(c, 'M-24,-50 L-24,-74 Q-24,-100 0,-100 Q24,-100 24,-74 L24,-50', null, metal(c, -26, 26), 10); rr(c, -38, -54, 76, 54, 8, gold(c, -38, 38), '#7A4E0E', 2); circ(c, 0, -32, 7, '#3E2A0A'); rect(c, -2.5, -32, 5, 14, '#3E2A0A'); },
    clock(c) { [-24, 24].forEach(x => circ(c, x, -96, 12, '#C62828')); line(c, -26, -6, -34, 2, '#5D4037', 5); line(c, 26, -6, 34, 2, '#5D4037', 5); circ(c, 0, -50, 44, '#C62828'); circ(c, 0, -50, 36, '#FFFDF5');
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; line(c, Math.cos(a) * 30, -50 + Math.sin(a) * 30, Math.cos(a) * 34, -50 + Math.sin(a) * 34, '#333', 2); } line(c, 0, -50, 0, -74, '#222', 3.5); line(c, 0, -50, 16, -42, '#222', 3.5); circ(c, 0, -50, 3, '#C62828'); },
    phone(c) { rr(c, -30, -100, 60, 100, 9, '#1F2937'); rr(c, -26, -94, 52, 86, 5, lg(c, 0, -94, 0, -8, ['#4FC3F7', '#1565C0'])); glow(c, 0, -50, 70, .35, '120,190,255');
      rr(c, -20, -84, 34, 12, 5, '#fff'); rr(c, -14, -66, 34, 12, 5, '#C8E6C9'); rr(c, -20, -48, 26, 12, 5, '#fff'); rr(c, -8, -104, 16, 3, 1.5, '#111'); circ(c, 24, -96, 8, '#E53935'); },
    rickshaw(c) { const W0 = (x, r) => { circ(c, x, -r, r, null, '#263238', 4); circ(c, x, -r, 3, '#555'); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line(c, x, -r, x + Math.cos(a) * r, -r + Math.sin(a) * r, '#90A4AE', 1.2); } };
      W0(-36, 26); W0(46, 18); line(c, -36, -26, 46, -18, '#37474F', 4); rr(c, -60, -64, 50, 18, 4, '#E53935'); P(c, 'M-64,-64 Q-64,-112 -14,-112 L-4,-108 L-8,-64Z', '#1565C0', '#0D47A1', 2);
      for (let i = 0; i < 4; i++) line(c, -60 + i * 14, -108 + i * 2, -58 + i * 14, -66, 'rgba(255,255,255,.35)', 2); rect(c, -60, -48, 50, 6, '#FBC02D'); line(c, 0, -46, 30, -58, '#37474F', 4); line(c, 30, -58, 38, -60, '#111', 6); P(c, 'M-60,-46 L-70,-40', null, '#E91E63', 4); },
    bicycle(c) { [-40, 40].forEach(x => { circ(c, x, -28, 28, null, '#263238', 4.5); circ(c, x, -28, 3, '#555'); }); P(c, 'M-40,-28 L-8,-28 L22,-62 L-20,-62 Z M-8,-28 L-24,-72 M22,-62 L40,-28 M22,-62 L18,-78', null, '#C62828', 4.5); rr(c, -32, -78, 18, 6, 3, '#222'); line(c, 10, -80, 28, -80, '#222', 4); },
    schoolbag(c) { P(c, 'M-26,-92 Q0,-112 26,-92', null, '#5D4037', 6); rr(c, -40, -94, 80, 94, 18, lg(c, -40, 0, 40, 0, ['#1565C0', '#1E88E5', '#0D47A1'])); rr(c, -30, -46, 60, 38, 10, '#1976D2', '#0D47A1', 2); line(c, -22, -40, 22, -40, '#FBC02D', 3); rr(c, -6, -50, 12, 8, 2, '#FBC02D'); },
    pen(c) { rr(c, -50, -58, 100, 58, 3, '#FFFDF5', 'rgba(0,0,0,.2)', 1); for (let i = 0; i < 4; i++) line(c, -40, -46 + i * 10, 30, -46 + i * 10, 'rgba(30,60,120,.35)', 1.6); P(c, 'M8,-12 Q20,-22 34,-14', null, '#1A237E', 2);
      c.save(); c.translate(30, -14); c.rotate(-.9); rr(c, -6, -96, 12, 70, 4, '#1A1A1A'); rr(c, -6, -100, 12, 10, 3, '#D4AF37'); P(c, 'M-6,-26 L6,-26 L0,0Z', gold(c, -6, 6)); line(c, 0, -22, 0, -6, '#3E2A0A', 1); c.restore(); },
    hut(c) { rr(c, -50, -50, 100, 50, 2, lg(c, 0, -50, 0, 0, ['#B07A48', '#8A5A33'])); P(c, 'M-68,-46 L0,-100 L68,-46Z', lg(c, 0, -100, 0, -46, ['#E0B44C', '#B98C2A']), '#8C6A1E', 2);
      for (let i = 0; i < 8; i++) line(c, -60 + i * 17, -48, -40 + i * 11, -86, 'rgba(120,80,20,.4)', 1.4); rr(c, -12, -36, 24, 36, 2, '#3E2716'); rr(c, 22, -38, 18, 16, 2, '#FFD180'); glow(c, 31, -30, 30, .5); },
    tree(c) { P(c, 'M-8,0 Q-6,-40 -14,-56 L-4,-58 Q0,-44 2,-58 L12,-56 Q6,-40 8,0Z', '#6D4C41'); [[-26, -70, 26], [24, -72, 26], [0, -92, 30], [-6, -64, 22], [14, -60, 20]].forEach(([x, y, r]) => circ(c, x, y, r, '#2E7D32'));
      [[-18, -80, 10], [16, -88, 9], [4, -100, 8]].forEach(([x, y, r]) => withA(c, .5, () => circ(c, x, y, r, '#66BB6A'))); },
    boat(c) { P(c, 'M-66,-22 Q0,-2 66,-22 L54,-6 Q0,6 -54,-6Z', wood(c, -22, 6)); line(c, -6, -22, -6, -104, '#5D4037', 3); P(c, 'M-4,-100 Q34,-70 22,-26 L-4,-26Z', '#F5E6C8', '#C9B48A', 1.5);
      for (let i = 0; i < 3; i++) P(c, `M${-90 + i * 30},${4 + i * 3} q15,-6 30,0 t30,0`, null, 'rgba(160,210,240,.6)', 2); },
    umbrella(c) { for (let i = 0; i < 14; i++) line(c, -70 + (i * 37) % 140, -110 + (i * 23) % 60, -74 + (i * 37) % 140, -100 + (i * 23) % 60, 'rgba(180,220,255,.7)', 2);
      P(c, 'M-56,-60 Q-50,-98 0,-100 Q50,-98 56,-60 Q46,-66 37,-60 Q28,-66 18,-60 Q9,-66 0,-60 Q-9,-66 -18,-60 Q-28,-66 -37,-60 Q-46,-66 -56,-60Z', lg(c, -56, 0, 56, 0, ['#B71C1C', '#E53935', '#B71C1C']));
      line(c, 0, -100, 0, -10, '#333', 3); P(c, 'M0,-10 Q0,0 -10,0 Q-16,0 -16,-8', null, '#333', 3); },
    moon(c) { glow(c, 0, -60, 90, .35, '255,236,170'); crescent(c, -6, -58, 42, lg(c, -40, -100, 30, -16, ['#FFF3C4', '#F2C14E']));
      [[34, -86, 6], [46, -50, 4], [22, -40, 3]].forEach(([x, y, r]) => P(c, `M${x},${y - r * 2} L${x + r * .6},${y - r * .6} L${x + r * 2},${y} L${x + r * .6},${y + r * .6} L${x},${y + r * 2} L${x - r * .6},${y + r * .6} L${x - r * 2},${y} L${x - r * .6},${y - r * .6}Z`, '#FFF8E1')); },
    riceplate(c) { ell(c, 0, -14, 62, 16, '#E0E0E0', '#9E9E9E', 1.5); ell(c, 0, -16, 50, 11, '#F5F5F5'); P(c, 'M-36,-18 Q-30,-52 0,-54 Q30,-52 36,-18Z', '#FFFDF5'); for (let i = 0; i < 26; i++) ell(c, -28 + (i * 13) % 56, -24 - (i * 7) % 26, 3, 1.4, '#E8E2D0');
      ell(c, 48, -40, 20, 8, '#C9A227'); P(c, 'M28,-40 Q48,-12 68,-40Z', '#D9B86A'); glow(c, 0, -60, 60, .2, '255,255,255'); for (let i = 0; i < 3; i++) P(c, `M${-10 + i * 10},-60 q-6,-10 0,-20 t0,-20`, null, 'rgba(255,255,255,.4)', 2); },
    medicine(c) { rr(c, -46, -76, 38, 76, 6, '#FF8F00'); rr(c, -48, -90, 42, 16, 4, '#ECEFF1'); rr(c, -40, -56, 26, 28, 2, '#FFFDF5'); line(c, -27, -50, -27, -34, '#E53935', 3); line(c, -35, -42, -19, -42, '#E53935', 3);
      [[14, -10, .3], [34, -18, -.6], [22, -30, 1.2]].forEach(([x, y, r]) => { c.save(); c.translate(x, y); c.rotate(r); rr(c, -12, -5, 12, 10, 5, '#E53935'); rr(c, 0, -5, 12, 10, 5, '#FFFDF5'); c.restore(); });
      rr(c, 4, -70, 50, 30, 4, '#CFD8DC', '#90A4AE', 1); for (let i = 0; i < 4; i++) circ(c, 14 + i * 10, -55, 4, '#fff', '#B0BEC5', 1); },
    ring(c) { rr(c, -44, -40, 88, 40, 6, '#880E4F'); P(c, 'M-44,-40 L-36,-86 L36,-86 L44,-40Z', '#AD1457'); rr(c, -36, -40, 72, 30, 4, '#5D0A33'); ell(c, 0, -44, 20, 22, null, gold(c, -20, 20), 6);
      P(c, 'M-9,-66 L9,-66 L14,-58 L0,-46 L-14,-58Z', 'rgba(200,240,255,.95)', '#90CAF9', 1); glow(c, 0, -60, 30, .6, '255,255,255'); },
    shoes(c) { c.scale(1.7, 1.7); [[-30, 0], [26, -6]].forEach(([x, y], i) => { P(c, `M${x - 30},${y} L${x - 30},${y - 14} Q${x - 28},${y - 34} ${x - 8},${y - 34} L${x + 2},${y - 22} Q${x + 30},${y - 18} ${x + 34},${y - 4} L${x + 34},${y}Z`, i ? '#4E342E' : '#5D4037', '#3E2723', 1.5); rect(c, x - 32, y - 4, 68, 5, '#212121'); line(c, x - 14, y - 30, x - 2, y - 24, '#D7CCC8', 1.5); }); },
    kolshi(c) { ell(c, -14, -44, 40, 44, lg(c, -54, 0, 26, 0, ['#7A3A12', '#C8742F', '#8A4B16'])); rr(c, -30, -100, 32, 14, 5, '#A0521A'); P(c, 'M-26,-88 Q-14,-80 -2,-88', null, '#7A3A12', 3); ell(c, -14, -2, 26, 5, 'rgba(0,0,0,.25)');
      rr(c, 30, -46, 26, 46, 3, 'rgba(200,235,255,.45)', 'rgba(255,255,255,.7)', 1.5); rect(c, 31.5, -30, 23, 28, 'rgba(120,190,240,.55)'); },
    scale(c) { const g = gold(c, -60, 60); rect(c, -3, -96, 6, 90, '#B8892A'); rr(c, -24, -8, 48, 8, 3, g); line(c, -60, -90, 60, -90, '#B8892A', 5); circ(c, 0, -98, 6, g);
      [-60, 60].forEach(x => { line(c, x, -90, x - 20, -50, '#9E7B2A', 1.4); line(c, x, -90, x + 20, -50, '#9E7B2A', 1.4); P(c, `M${x - 26},-50 Q${x},-34 ${x + 26},-50Z`, g); }); },
    handcuffs(c) { const g = metal(c, -60, 60); [-28, 28].forEach(x => { circ(c, x, -40, 24, null, g, 9); rr(c, x - 6, -70, 12, 12, 3, '#78909C'); }); for (let i = 0; i < 3; i++) ell(c, -8 + i * 8, -72, 5, 3.5, null, '#90A4AE', 2.5); },
    door(c) { rr(c, -44, -110, 88, 110, 2, '#2B1B10'); glow(c, 0, -55, 80, .7); rect(c, -40, -106, 80, 106, 'rgba(255,214,140,.85)'); P(c, 'M-40,-106 L-6,-96 L-6,-6 L-40,0Z', wood(c, -106, 0)); circ(c, -12, -52, 3, '#E0B84A');
      P(c, 'M-40,0 L40,0 L80,20 L-80,20Z', 'rgba(255,214,140,.35)'); },
    mirror(c) { ell(c, 0, -64, 34, 44, gold(c, -34, 34)); ell(c, 0, -64, 28, 38, lg(c, -28, -100, 28, -30, ['#B3E5FC', '#E1F5FE', '#81D4FA'])); line(c, -12, -84, 4, -94, 'rgba(255,255,255,.8)', 3); rect(c, -3, -20, 6, 16, '#B8892A'); ell(c, 0, -4, 24, 6, '#B8892A'); },
    frame(c) { rr(c, -46, -104, 92, 104, 4, wood(c, -104, 0)); rr(c, -36, -94, 72, 84, 2, lg(c, 0, -94, 0, -10, ['#D7CCC8', '#A1887F']));
      circ(c, 0, -62, 14, 'rgba(60,40,30,.55)'); P(c, 'M-26,-10 Q-24,-38 0,-40 Q24,-38 26,-10Z', 'rgba(60,40,30,.55)'); withA(c, .35, () => P(c, 'M-36,-94 L10,-94 L-36,-40Z', '#fff')); },
    gift(c) { rr(c, -44, -60, 88, 60, 3, '#C62828'); rr(c, -48, -74, 96, 16, 3, '#E53935'); rect(c, -6, -74, 12, 74, '#FBC02D'); P(c, 'M0,-74 Q-30,-100 -26,-80 Q-22,-70 0,-74 Q22,-70 26,-80 Q30,-100 0,-74Z', '#FBC02D', '#F9A825', 1.5); },
    paddy(c) { for (let i = 0; i < 9; i++) { const x = -24 + i * 6, tx = -40 + i * 10; P(c, `M${x},0 Q${x},-50 ${tx},-96`, null, '#9E7B2A', 2.5); for (let k = 0; k < 6; k++) ell(c, tx + (x - tx) * k * .1 - 3, -94 + k * 9, 2.4, 4.5, '#E0B44C'); }
      rr(c, -28, -36, 56, 8, 3, '#8D6E63'); },
    sapling(c) { P(c, 'M-40,0 Q0,-26 40,0Z', '#5D4037'); line(c, 0, -10, 0, -70, '#558B2F', 4); [[-1, -40, -30, -58], [1, -54, 30, -76], [-1, -68, -18, -96]].forEach(([s, y, tx, ty]) => P(c, `M0,${y} Q${tx},${y - 4} ${tx},${ty} Q${s * -4},${ty + 8} 0,${y}Z`, '#7CB342', '#558B2F', 1.5)); glow(c, 0, -60, 60, .25, '200,255,150'); },
    crown(c) { P(c, 'M-50,-20 L-56,-80 L-28,-52 L0,-96 L28,-52 L56,-80 L50,-20Z', gold(c, -56, 56), '#7A4E0E', 2); rr(c, -52, -22, 104, 16, 4, gold(c, -52, 52), '#7A4E0E', 2);
      [[-56, -80, '#E53935'], [0, -96, '#1E88E5'], [56, -80, '#43A047']].forEach(([x, y, col]) => circ(c, x, y, 6, col, '#fff', 1)); circ(c, 0, -14, 5, '#E53935'); },
    hourglass(c) { const g = wood(c, -100, 0); rr(c, -36, -100, 72, 10, 3, g); rr(c, -36, -10, 72, 10, 3, g); [-30, 30].forEach(x => rect(c, x - 3, -92, 6, 84, '#6D4C41'));
      P(c, 'M-24,-90 L24,-90 Q24,-66 4,-54 Q24,-42 24,-12 L-24,-12 Q-24,-42 -4,-54 Q-24,-66 -24,-90Z', 'rgba(220,240,255,.45)', 'rgba(255,255,255,.8)', 1.5); P(c, 'M-14,-74 L14,-74 Q10,-62 0,-56 Q-10,-62 -14,-74Z', '#E9B949'); P(c, 'M-20,-12 Q0,-34 20,-12Z', '#E9B949'); line(c, 0, -54, 0, -26, '#E9B949', 1.6); },
    heart(c) { glow(c, 0, -50, 80, .4, '255,80,90'); P(c, 'M0,-8 C-70,-50 -40,-100 0,-72 C40,-100 70,-50 0,-8Z', lg(c, -50, -100, 50, 0, ['#FF6B6B', '#C62828'])); withA(c, .5, () => ell(c, -22, -72, 8, 5, '#fff')); },
    glasses(c) { [-28, 28].forEach(x => { circ(c, x, -30, 22, 'rgba(200,230,255,.3)', '#222', 4.5); line(c, x - 10, -40, x - 2, -46, 'rgba(255,255,255,.7)', 2); }); P(c, 'M-6,-34 Q0,-40 6,-34', null, '#222', 4); line(c, -50, -34, -66, -30, '#222', 4); line(c, 50, -34, 66, -30, '#222', 4); },
    sack(c) { P(c, 'M-40,0 Q-50,-60 -30,-80 L-34,-92 Q0,-86 34,-92 L30,-80 Q50,-60 40,0Z', lg(c, -40, 0, 40, 0, ['#C9B48A', '#F0E2C0', '#B8A270']), '#9E8A5E', 1.5); line(c, -30, -82, 30, -82, '#6D4C41', 3);
      ell(c, 0, -92, 30, 6, '#FFFDF5'); for (let i = 0; i < 14; i++) ell(c, -24 + (i * 7) % 48, -94 + (i % 3) * 2, 2.6, 1.3, '#E8E2D0'); },
    kite(c) { P(c, 'M0,-104 L34,-70 L0,-28 L-34,-70Z', lg(c, -34, 0, 34, 0, ['#E53935', '#FDD835'])); line(c, 0, -104, 0, -28, 'rgba(0,0,0,.35)', 1.5); line(c, -34, -70, 34, -70, 'rgba(0,0,0,.35)', 1.5); P(c, 'M0,-28 Q10,-14 -4,-4 Q-14,4 0,10', null, '#E53935', 2); P(c, 'M0,-28 Q40,-10 70,10', null, 'rgba(255,255,255,.7)', 1.2); },
    train(c) { rr(c, -44, -96, 88, 86, 14, lg(c, -44, 0, 44, 0, ['#1B5E20', '#2E7D32', '#1B5E20'])); rr(c, -34, -84, 68, 32, 6, '#B3E5FC'); rect(c, -44, -44, 88, 6, '#FBC02D'); [-26, 26].forEach(x => circ(c, x, -26, 7, '#FFF59D')); glow(c, 0, -26, 50, .3, '255,250,180'); rect(c, -50, -10, 100, 6, '#424242'); line(c, -80, 0, 80, 0, '#5D4037', 4); },
    dates(c) { ell(c, -14, -12, 50, 12, '#BCAAA4', '#8D6E63', 1.5); [[-40, -20], [-26, -24], [-10, -22], [6, -24], [-32, -32], [-16, -34], [0, -32], [-24, -42]].forEach(([x, y]) => ell(c, x, y, 9, 5.5, '#5D2A12', '#3E1A08', 1));
      rr(c, 30, -62, 28, 62, 4, 'rgba(200,235,255,.45)', 'rgba(255,255,255,.75)', 1.5); rect(c, 31.5, -40, 25, 38, 'rgba(120,190,240,.5)'); },
    chair(c) { glow(c, 0, -60, 90, .35); rr(c, -30, -110, 60, 66, 6, wood(c, -110, -44)); rr(c, -36, -48, 72, 10, 3, '#7A4A2A'); [-32, 26].forEach(x => rect(c, x, -40, 6, 40, '#5A341C')); [-28, 22].forEach(x => rect(c, x, -104, 6, 56, '#5A341C')); },
    hands(c) { glow(c, 0, -70, 90, .4, '255,236,170'); [-1, 1].forEach(s => P(c, `M${s * 4},-4 Q${s * 8},-40 ${s * 6},-60 Q${s * 6},-92 ${s * 22},-100 Q${s * 30},-98 ${s * 30},-80 L${s * 32},-40 Q${s * 36},-14 ${s * 22},-4Z`, lg(c, 0, -100, 0, 0, ['#E8B990', '#C98E62']), '#A0704A', 1.5));
      [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) line(c, s * (12 + i * 6), -86 + i * 4, s * (12 + i * 6), -70 + i * 4, 'rgba(120,70,40,.35)', 1.2); }); P(c, 'M-24,-4 L24,-4 L30,8 L-30,8Z', '#F5F5F5'); },
    cow(c) { ell(c, 0, -46, 44, 24, '#FAFAFA', '#9E9E9E', 1.5); [[-14, -52, 10], [16, -40, 9]].forEach(([x, y, r]) => circ(c, x, y, r, '#5D4037')); [-30, -16, 18, 32].forEach(x => rect(c, x - 4, -26, 8, 26, '#EEE'));
      ell(c, -50, -62, 14, 12, '#FAFAFA', '#9E9E9E', 1.5); ell(c, -58, -56, 7, 6, '#F8BBD0'); P(c, 'M-56,-74 L-64,-86 M-44,-74 L-40,-86', null, '#BCAAA4', 3); P(c, 'M44,-50 Q56,-40 50,-24', null, '#9E9E9E', 2); },
    house(c) { rr(c, -50, -60, 100, 60, 2, '#ECEFF1'); P(c, 'M-60,-56 L0,-100 L60,-56Z', '#B71C1C'); rr(c, -10, -38, 20, 38, 2, '#5D4037'); [[-38, -46], [20, -46]].forEach(([x, y]) => { rr(c, x, y, 18, 16, 2, '#FFD180'); glow(c, x + 9, y + 8, 22, .4); }); }
  };
  /* ---------- subjects: id, Bangla label, words, mood ---------- */
  const ART = [
    ['tiffin', 'টিফিন বক্স', /টিফিন/, 'warm'], ['lamp', 'প্রদীপ', /প্রদীপ|কুপি|দীপ(?!ক)/, 'warm'], ['lantern', 'হারিকেন', /হারিকেন|লণ্ঠন|লন্ঠন|কুপিবাতি/, 'night'], ['candle', 'মোমবাতি', /মোমবাতি|মোম/, 'warm'],
    ['quran', 'কুরআন', /কুরআন|কোরআন|কোরান|তিলাওয়াত|আয়াত|সূরা|হাফেজ|হাফিজ/, 'isl'], ['hands', 'দোয়ার হাত', /দোয়া|দুআ|দোআ|মোনাজাত|মুনাজাত|প্রার্থনা/, 'isl'], ['tasbih', 'তাসবিহ', /তাসবিহ|তসবি|জিকির|যিকির/, 'isl'],
    ['jaynamaz', 'জায়নামাজ', /জায়নামাজ|জায়নামায|সিজদা|সেজদা|তাহাজ্জুদ/, 'isl'], ['mosque', 'মসজিদ', /মসজিদ|আজান|আযান|জুমা|নামাজ|নামায|সালাত|ইমাম|মুয়াজ্জিন|মিনার/, 'isl'],
    ['moon', 'চাঁদ-তারা', /চাঁদ|রমজান|রমযান|রোজা|রোযা|ঈদ|তারা|রাতের আকাশ/, 'night'], ['dates', 'ইফতার (খেজুর-পানি)', /ইফতার|খেজুর|সেহরি|সাহরি/, 'isl'],
    ['letter', 'চিঠি', /চিঠি|খাম|চিরকুট|পত্র(?!িকা)/, 'warm'], ['money', 'টাকা', /টাকা|ঋণ|দেনা|বেতন|সুদ|ঘুষ|লাখ|কোটি|মজুরি|যৌতুক|ধার/, 'cool'], ['coins', 'পয়সা / দান', /পয়সা|কয়েন|মুদ্রা|দান|সদকা|সাদাকা|যাকাত|জাকাত|ভিক্ষা/, 'warm'],
    ['key', 'চাবি', /চাবি/, 'warm'], ['lock', 'তালা', /তালা(?!ক)|তালাবদ্ধ/, 'cool'], ['clock', 'ঘড়ি', /ঘড়ি|সময়|ঘণ্টা|মিনিট|দেরি/, 'cool'], ['hourglass', 'বালিঘড়ি', /বালিঘড়ি|মৃত্যু|কবর|আখিরাত|পরকাল|কিয়ামত|শেষ সময়|হায়াত/, 'night'],
    ['phone', 'মোবাইল', /মোবাইল|ফোন|মেসেজ|ফেসবুক|ভিডিও কল|ইন্টারনেট|অনলাইন/, 'cool'], ['rickshaw', 'রিকশা', /রিকশা|রিক্সা|ভ্যান/, 'out'], ['bicycle', 'সাইকেল', /সাইকেল/, 'out'], ['train', 'ট্রেন', /ট্রেন|রেল|স্টেশন/, 'out'],
    ['boat', 'নৌকা', /নৌকা|নদী|মাঝি|ঘাট|নদীর/, 'out'], ['umbrella', 'ছাতা ও বৃষ্টি', /ছাতা|বৃষ্টি|বর্ষা|ঝড়/, 'cool'], ['kite', 'ঘুড়ি', /ঘুড়ি/, 'out'],
    ['schoolbag', 'স্কুলব্যাগ', /স্কুল|ব্যাগ|ছাত্র|ছাত্রী|ক্লাস|মাদরাসা|মাদ্রাসা/, 'warm'], ['book', 'বই', /বই|খাতা|পরীক্ষা|ডায়েরি|ডায়রি|পড়াশোনা|লাইব্রেরি|বৃত্তি|রেজাল্ট/, 'warm'], ['pen', 'কলম ও কাগজ', /কলম|সই|স্বাক্ষর|দলিল|দস্তখত|উইল/, 'warm'],
    ['riceplate', 'ভাতের থালা', /ভাত|খাবার|ক্ষুধা|ক্ষুধার্ত|থালা|রুটি|এক বেলা|খিদে|ক্ষিধে|দাওয়াত/, 'warm'], ['kolshi', 'কলসি ও পানি', /কলসি|কলস|পানি|পিপাসা|তৃষ্ণা|তেষ্টা/, 'warm'], ['sack', 'চালের বস্তা', /চালের বস্তা|বস্তা|চাল/, 'warm'],
    ['medicine', 'ওষুধ', /ওষুধ|ঔষধ|অসুখ|হাসপাতাল|ডাক্তার|রোগ|অসুস্থ|ক্যান্সার|অপারেশন/, 'cool'], ['ring', 'আংটি', /আংটি|বিয়ে|বিবাহ|মোহর|কাবিন/, 'warm'], ['shoes', 'জুতা', /জুতা|জুতো|স্যান্ডেল|চপ্পল/, 'warm'],
    ['scale', 'ন্যায়ের পাল্লা', /বিচার|ন্যায়|ইনসাফ|দাঁড়িপাল্লা|আদালত|সালিশ|ওজন|মাপে/, 'cool'], ['handcuffs', 'হাতকড়া', /হাতকড়া|পুলিশ|থানা|জেল|চোর|চুরি|গ্রেফতার|আসামি/, 'cool'],
    ['door', 'দরজা', /দরজা|দুয়ার|দোর/, 'warm'], ['mirror', 'আয়না', /আয়না|আরশি/, 'warm'], ['frame', 'বাঁধানো ছবি', /ছবি|স্মৃতি|অ্যালবাম/, 'warm'], ['gift', 'উপহার', /উপহার|গিফট|জন্মদিন|সারপ্রাইজ/, 'warm'],
    ['paddy', 'ধানের শীষ', /ধান|ফসল|কৃষক|ক্ষেত|চাষ|জমি/, 'out'], ['sapling', 'চারাগাছ', /বীজ|চারা|গাছ লাগ|বৃক্ষরোপণ/, 'out'], ['tree', 'গাছ', /গাছ|বৃক্ষ|বটতলা|আমগাছ/, 'out'],
    ['hut', 'কুঁড়েঘর', /কুঁড়েঘর|কুঁড়ে|ভিটা|মাটির ঘর|গ্রামের বাড়ি/, 'out'], ['house', 'বাড়ি', /বাড়ি|ঘর|আশ্রয়|ভাড়া|ফ্ল্যাট/, 'out'], ['cow', 'গরু', /গরু|গাভী|বাছুর|কোরবানি|কুরবানি/, 'out'],
    ['crown', 'মুকুট', /রাজা|মুকুট|বাদশা|সিংহাসন|রাজত্ব|অহংকার|ক্ষমতা/, 'warm'], ['heart', 'হৃদয়', /ভালোবাসা|হৃদয়|মায়া|অন্তর|দিল/, 'warm'], ['glasses', 'চশমা', /চশমা/, 'warm'],
    ['chair', 'শূন্য চেয়ার', /চেয়ার|শূন্য|একা|নিঃসঙ্গ/, 'warm']
  ].filter(a => D[a[0]]);
  const BYID = {}; ART.forEach(a => BYID[a[0]] = a);
  const TWO = /দুই|দুটি|দুটো|২|দ্বিতীয়|জোড়া|দু'টি|দু’টি/;
  function pick(text) {
    const t = String(text || '').replace(/[{}|]/g, ' '); if (!t.trim()) return null; const hit = [];
    ART.forEach(a => { const m = t.match(a[2]); if (m) hit.push([a, m.index]); });
    if (!hit.length) return null; hit.sort((x, y) => x[1] - y[1]); // the word that comes first in the title is the subject
    const a = hit[0][0], before = t.slice(Math.max(0, hit[0][1] - 14), hit[0][1]);
    return { id: a[0], two: TWO.test(before), id2: hit[1] && hit[1][0][0] !== a[0] ? hit[1][0][0] : null };
  }
  function best(text) { // a long story text: the most-mentioned subject (2+ times)
    const t = String(text || ''); let top = null, n = 1;
    ART.forEach(a => { const g = new RegExp(a[2].source, 'g'), k = (t.match(g) || []).length; if (k > n) { n = k; top = a; } });
    return top ? { id: top[0], two: false, id2: null } : null;
  }

  /* ---------- backdrops ---------- */
  const MOOD = {
    warm: ['#2A160B', '#5A3219', '255,190,110'], night: ['#060B1E', '#1B2A55', '200,215,255'], isl: ['#04241A', '#0F5A40', '242,210,130'],
    cool: ['#0A1626', '#21436B', '150,200,255'], out: ['#1E1530', '#8A4A3A', '255,180,120']
  };
  function rnd(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function backdrop(c, FW, FH, mood, floorY, seed) {
    const m = MOOD[mood] || MOOD.warm, R = rnd(seed), U = Math.min(FW, FH);
    c.fillStyle = lg(c, 0, 0, 0, FH, [m[0], m[1], m[0]]); c.fillRect(0, 0, FW, FH);
    if (mood === 'night') { for (let i = 0; i < 90; i++) withA(c, .3 + R() * .6, () => circ(c, R() * FW, R() * floorY, U * (.0015 + R() * .003), '#fff')); }
    if (mood === 'isl') { c.save(); c.globalAlpha = .07; c.strokeStyle = '#F2C14E'; c.lineWidth = U * .002; const s = U * .09;
      for (let y = 0; y < FH + s; y += s) for (let x = 0; x < FW + s; x += s) { c.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r = k % 2 ? s * .28 : s * .42; k ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + r, y); } c.closePath(); c.stroke(); } c.restore();
      [[.0, .32], [1, .32]].forEach(([fx]) => { const w = FW * .2, x0 = fx ? FW - w : 0; withA(c, .35, () => P(c, `M${x0},${FH} L${x0},${FH * .35} Q${x0 + w / 2},${FH * .12} ${x0 + w},${FH * .35} L${x0 + w},${FH}Z`, null, '#F2C14E', U * .004)); }); }
    if (mood === 'out') { c.fillStyle = lg(c, 0, 0, 0, floorY, ['#2A1B4A', '#B0563D', '#F0A35E']); c.fillRect(0, 0, FW, floorY); glow(c, FW * .5, floorY, U * .5, .5, '255,200,120');
      c.fillStyle = 'rgba(25,15,30,.85)'; c.beginPath(); c.moveTo(0, floorY); for (let x = 0; x <= FW; x += FW / 24) c.lineTo(x, floorY - U * (.04 + R() * .07)); c.lineTo(FW, floorY); c.closePath(); c.fill(); }
    if (mood === 'warm' || mood === 'cool') { // a window of soft light + bokeh
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${m[2]},.06)`; c.beginPath(); c.moveTo(FW * .62, 0); c.lineTo(FW * .86, 0); c.lineTo(FW * .55, floorY); c.lineTo(FW * .25, floorY); c.closePath(); c.fill(); c.restore();
      for (let i = 0; i < 14; i++) withA(c, .08 + R() * .12, () => circ(c, R() * FW, R() * floorY * .9, U * (.02 + R() * .05), `rgb(${m[2]})`)); }
    // the surface the things stand on
    const fy = floorY, surf = mood === 'out' ? ['#2B1C14', '#120B08'] : mood === 'isl' ? ['#0B3A2A', '#03140E'] : mood === 'night' ? ['#141B33', '#05080F'] : mood === 'cool' ? ['#1D2B3E', '#070D16'] : ['#6B3F22', '#24130A'];
    c.fillStyle = lg(c, 0, fy, 0, FH, surf); c.fillRect(0, fy, FW, FH - fy);
    if (mood === 'warm') for (let i = 0; i < 6; i++) withA(c, .12, () => line(c, 0, fy + (FH - fy) * (i + 1) / 7, FW, fy + (FH - fy) * (i + 1) / 7 + U * .01, '#000', U * .002));
    withA(c, .5, () => line(c, 0, fy, FW, fy, `rgba(${m[2]},.5)`, U * .003));
  }
  /* half-width of each picture in units of its height (default .45): wide things are pulled in from the frame edge */
  const WIDE = { bicycle: 1.45, rickshaw: 1.5, boat: 1.6, cow: 1.35, scale: 1.45, handcuffs: 1.3, glasses: 1.45, house: 1.3, coins: 1.15, book: 1.45, letter: 1.2, medicine: 1.15, riceplate: 1.45, kite: 1.1, jaynamaz: 1.2, umbrella: 1.45, shoes: 1.55, dates: 1.35, money: 1.05, tiffin: .9, lamp: 1.1, crown: 1.2, heart: 1.1, quran: 1.25, mosque: 1.6, pen: 1.1, ring: 1, train: 1, sack: .95, kolshi: 1.2, door: 1.2, tasbih: .9 };
  function put(c, id, x, y, h, flip, dim) {
    const f = D[id]; if (!f) return; const s = h / 100, hw = (WIDE[id] || .9) * h / 2, U = c.canvas.width; x = Math.max(hw + U * .015, Math.min(U - hw - U * .015, x));
    c.save(); ell(c, x, y + h * .01, h * .5, h * .06, 'rgba(0,0,0,.45)'); glow(c, x, y - h * .5, h * .9, .22);
    c.translate(x, y); c.scale(flip ? -s : s, s); if (dim) c.globalAlpha = dim; try { f(c); } catch (e) { console.warn('thumb-art', id, e); } c.restore();
  }
  /* the whole background: subject (and its pair / second subject) where the text block leaves room */
  function draw(c, FW, FH, pk, kind) {
    const a = BYID[pk.id]; if (!a) return false; const mood = a[3];
    const land = FW > FH * 1.15, tall = FH > FW * 1.5, U = Math.min(FW, FH);
    let floorY, slots;
    if (tall) { floorY = FH * .35; const h = FH * .22; slots = pk.two || pk.id2 ? [[FW * .3, h], [FW * .7, h * .92]] : [[FW * .5, h * 1.12]]; }
    else if (land) { floorY = FH * .9; const h = FH * .62; slots = pk.two || pk.id2 ? [[FW * .15, h * .86], [FW * .85, h]] : [[FW * .84, h * 1.05], [FW * .14, h * .55, 'echo']]; }
    else { floorY = FH * .93; const h = FH * .4; slots = pk.two || pk.id2 ? [[FW * .16, h], [FW * .84, h]] : [[FW * .82, h * 1.1], [FW * .17, h * .6, 'echo']]; }
    backdrop(c, FW, FH, mood, floorY, [...pk.id].reduce((s, ch) => s + ch.charCodeAt(0), 7));
    const ids = pk.id2 && !pk.two ? [pk.id, pk.id2] : [pk.id, pk.id];
    slots.forEach(([x, h, echo], i) => put(c, echo ? pk.id : ids[i] || pk.id, x, floorY + U * .005, h, false, echo ? .5 : 0));
    // a warm/cool light wash over everything so the picture sits behind the words
    const vg = c.createRadialGradient(FW / 2, FH / 2, U * .2, FW / 2, FH / 2, Math.hypot(FW, FH) * .6); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); c.fillStyle = vg; c.fillRect(0, 0, FW, FH);
    return true;
  }
  window.TF_THUMB_ART = { list: ART.map(a => ({ id: a[0], label: a[1] })), pick, best, draw, has: id => !!BYID[id] };
})();
