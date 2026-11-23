/* TF Story Studio — elements.js: scene objects (furniture, lamps, office things, village things) for every part.
   - Background objects drawn into the place art (behind the people): E['o_<name>'] (x = argument).
   - A scene heading can add them: "## govt_office+table+chair:900+flag night" (x optional; works in every part).
   - autoDirect adds them by itself from the words of the scene ("টেবিলের ওপর", "হারিকেনের আলো" …), so old and new
     stories get the things they talk about (max 3 per scene; off when "context backgrounds" is off).
   - New places (prison, police_station, officer_room, land_office, salish, mud_house, cowshed, lantern_room) and new
     hand props (file, pen, candle, lantern, photo, cheque, certificate, stamp, stick, basket, broom).
   - The AI prompts get the object list, so future stories can ask for them. Loaded after index.html's main code. */
(function () {
  'use strict';
  if (typeof E === 'undefined' || typeof PLACE_INDEX === 'undefined') return;
  const FLOOR = 1380;
  const glow = (c, x, y, r, a, col) => { const g = c.createRadialGradient(x, y, 4, x, y, r); g.addColorStop(0, `rgba(${col || '255,214,120'},${a})`); g.addColorStop(1, `rgba(${col || '255,214,120'},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
  const flame = (c, x, y, s, t, i) => { const f = Math.sin((t || 0) * 9 + (i || 0)) * 3 * s; P(c, `M${x},${y - 30 * s + f} Q${x + 12 * s},${y - 8 * s} ${x},${y} Q${x - 12 * s},${y - 8 * s} ${x},${y - 30 * s + f}Z`, '#FFB300'); P(c, `M${x},${y - 18 * s + f / 2} Q${x + 6 * s},${y - 5 * s} ${x},${y} Q${x - 6 * s},${y - 5 * s} ${x},${y - 18 * s + f / 2}Z`, '#FFF3C4'); };
  const dim = tm => tm === 'night' ? .9 : tm === 'evening' ? .55 : .25;

  /* ---------- background objects: [name, Bangla, kind (floor|wall|out), draw(c,t,tm,x)] ---------- */
  const OBJ = {
    table: ['টেবিল', 'floor', (c, t, tm, x) => { rr(c, x - 170, 1140, 340, 26, 6, '#8D5B3A'); rect(c, x - 165, 1166, 330, 16, '#6F4730'); [x - 150, x + 136].forEach(lx => rect(c, lx, 1180, 14, 210, '#6F4730')); rr(c, x - 60, 1110, 90, 32, 4, '#E8E2D2', '#BDB39C', 2); }],
    chair: ['চেয়ার', 'floor', (c, t, tm, x) => { rr(c, x - 60, 1000, 120, 160, 10, '#7A4F33'); rr(c, x - 48, 1012, 96, 136, 8, '#94643F'); rr(c, x - 70, 1160, 140, 24, 6, '#6B4429'); [x - 62, x + 50].forEach(lx => rect(c, lx, 1184, 12, 200, '#5A3822')); }],
    office_chair: ['অফিসের চেয়ার', 'floor', (c, t, tm, x) => { rr(c, x - 70, 960, 140, 220, 30, '#263238'); rr(c, x - 80, 1180, 160, 36, 12, '#37474F'); rect(c, x - 6, 1216, 12, 120, '#555'); line(c, x - 70, 1376, x + 70, 1376, '#333', 12); line(c, x, 1336, x, 1376, '#333', 10); }],
    almirah: ['আলমারি', 'floor', (c, t, tm, x) => { rr(c, x - 115, 820, 230, 560, 8, '#7E8C8D', '#5F6B6C', 4); line(c, x, 830, x, 1370, '#5F6B6C', 4); [x - 16, x + 16].forEach(hx => rr(c, hx - 4, 1060, 8, 60, 3, '#CFD8DC')); rect(c, x - 115, 1290, 230, 6, '#5F6B6C'); }],
    khat: ['খাট / চৌকি', 'floor', (c, t, tm, x) => { rr(c, x - 230, 1200, 460, 40, 6, '#8D5B3A'); rr(c, x - 222, 1170, 444, 36, 10, '#ECE3D0'); rr(c, x - 210, 1150, 120, 40, 16, '#fff'); [x - 220, x + 206].forEach(lx => rect(c, lx, 1240, 14, 140, '#6F4730')); rect(c, x - 230, 1100, 16, 280, '#6F4730'); }],
    stool: ['টুল / মোড়া', 'floor', (c, t, tm, x) => { ell(c, x, 1280, 70, 18, '#A1887F'); rect(c, x - 70, 1280, 140, 18, '#8D6E63'); P(c, `M${x - 60},1298 L${x - 40},1380 M${x + 60},1298 L${x + 40},1380`, null, '#6D4C41', 10); }],
    lamps: ['দুই প্রদীপ (তাকের ওপর)', 'wall', (c, t, tm, x) => { c.save(); c.translate(x, 900); c.scale(1.7, 1.7); c.translate(-x, -900); rect(c, x - 150, 900, 300, 16, '#6D4C41'); [x - 70, x + 70].forEach((lx, i) => { withA(c, dim(tm), () => glow(c, lx, 860, 150, .55)); P(c, `M${lx - 34},900 Q${lx},930 ${lx + 34},900 Q${lx + 30},880 ${lx},882 Q${lx - 30},880 ${lx - 34},900Z`, '#C67C3A', '#8A4F1E', 2); flame(c, lx + 16, 886, 1, t, i); }); c.restore(); }],
    hurricane: ['হারিকেন', 'wall', (c, t, tm, x) => { const y = 1110; withA(c, dim(tm), () => glow(c, x, y - 60, 220, .6)); rr(c, x - 40, y - 10, 80, 24, 6, '#B71C1C'); P(c, `M${x - 30},${y - 10} Q${x - 44},${y - 70} ${x - 26},${y - 120} L${x + 26},${y - 120} Q${x + 44},${y - 70} ${x + 30},${y - 10}Z`, 'rgba(255,236,179,.75)', '#8D6E63', 3); flame(c, x, y - 40, 1.2, t); rr(c, x - 34, y - 134, 68, 16, 6, '#B71C1C'); P(c, `M${x - 30},${y - 134} Q${x},${y - 190} ${x + 30},${y - 134}`, null, '#424242', 4); rect(c, x - 70, y + 14, 140, 14, '#6D4C41'); }],
    candle: ['মোমবাতি', 'wall', (c, t, tm, x) => { withA(c, dim(tm), () => glow(c, x, 1080, 170, .55)); rr(c, x - 14, 1100, 28, 90, 4, '#FFF8E1', '#E0D3B0', 2); flame(c, x, 1098, 1, t); ell(c, x, 1192, 40, 10, '#BCAAA4'); rect(c, x - 70, 1196, 140, 12, '#6D4C41'); }],
    bulb: ['ঝোলানো বাল্ব', 'wall', (c, t, tm, x) => { line(c, x, 0, x, 300, '#333', 4); withA(c, dim(tm) + .2, () => glow(c, x, 330, 260, .5, '255,240,190')); circ(c, x, 330, 30, '#FFF6D5', '#C9B98A', 2); rr(c, x - 14, 290, 28, 18, 4, '#666'); }],
    filestack: ['ফাইলের স্তূপ', 'floor', (c, t, tm, x) => { rr(c, x - 120, 1240, 240, 140, 6, '#6F4730'); for (let i = 0; i < 7; i++) rr(c, x - 100 + (i % 2) * 8, 1212 - i * 22, 190, 22, 3, ['#E9C46A', '#E76F51', '#8AB17D', '#F4A261', '#90A4AE'][i % 5], 'rgba(0,0,0,.2)', 1); line(c, x - 70, 1080, x + 80, 1080, '#8D6E63', 3); }],
    flag: ['পতাকা (স্ট্যান্ডে)', 'floor', (c, t, tm, x) => { line(c, x, 860, x, 1370, '#9E9E9E', 8); ell(c, x, 1372, 50, 12, '#757575'); const w = Math.sin((t || 0) * 2) * 4; P(c, `M${x + 4},870 Q${x + 90},${860 + w} ${x + 176},874 L${x + 176},984 Q${x + 90},${974 - w} ${x + 4},984Z`, '#006A4E'); circ(c, x + 80, 928, 32, '#F42A41'); circ(c, x, 856, 9, '#E0B84A'); }],
    portrait: ['বাঁধানো ছবি', 'wall', (c, t, tm, x) => { rr(c, x - 120, 300, 240, 180, 6, '#6D4C41'); rr(c, x - 104, 316, 208, 148, 3, '#9CC9E0'); P(c, `M${x - 104},464 L${x - 40},390 L${x + 10},440 L${x + 50},404 L${x + 104},464Z`, '#5B8C5A'); circ(c, x + 60, 350, 16, '#FFE082'); line(c, x - 50, 300, x, 250, '#555', 3); line(c, x + 50, 300, x, 250, '#555', 3); }],
    computer: ['কম্পিউটার', 'floor', (c, t, tm, x) => { OBJ.table[2](c, t, tm, x); rr(c, x - 90, 980, 180, 120, 8, '#263238'); rr(c, x - 80, 990, 160, 100, 4, tm === 'night' ? '#5DADE2' : '#81D4FA'); rect(c, x - 10, 1100, 20, 30, '#37474F'); rr(c, x - 50, 1128, 100, 12, 3, '#37474F'); }],
    printer: ['প্রিন্টার / ফটোকপি', 'floor', (c, t, tm, x) => { rr(c, x - 110, 1150, 220, 230, 10, '#ECEFF1', '#B0BEC5', 3); rr(c, x - 90, 1130, 180, 30, 6, '#CFD8DC'); rect(c, x - 70, 1200, 140, 10, '#455A64'); rr(c, x - 60, 1110, 120, 24, 3, '#fff', '#ddd', 2); circ(c, x + 80, 1176, 7, '#66BB6A'); }],
    safe: ['সিন্দুক / লকার', 'floor', (c, t, tm, x) => { rr(c, x - 110, 1120, 220, 260, 10, '#455A64', '#263238', 4); rr(c, x - 90, 1140, 180, 220, 6, '#546E7A'); circ(c, x + 10, 1240, 34, '#90A4AE', '#37474F', 4); line(c, x + 10, 1240, x + 30, 1220, '#37474F', 5); rr(c, x + 60, 1220, 12, 50, 4, '#CFD8DC'); }],
    cashbox: ['ক্যাশবাক্স ও টাকা', 'floor', (c, t, tm, x) => { OBJ.table[2](c, t, tm, x); rr(c, x - 80, 1060, 160, 80, 6, '#2E7D32', '#1B5E20', 3); [0, 1, 2].forEach(i => rr(c, x - 150 + i * 30, 1118 - i * 10, 80, 22, 3, '#A5D6A7', '#558B2F', 2)); }],
    kolshi: ['কলসি', 'floor', (c, t, tm, x) => { [0, 1].forEach(i => { const cx = x + i * 90, y = 1300 - i * 6; ell(c, cx, y, 50 - i * 6, 62 - i * 6, '#B5651D', '#8A4B16', 3); rr(c, cx - 22, y - 80, 44, 22, 6, '#A0521A'); ell(c, cx, y + 60, 34, 10, 'rgba(0,0,0,.2)'); }); }],
    chula: ['মাটির চুলা', 'floor', (c, t, tm, x) => { P(c, `M${x - 110},1380 L${x - 90},1270 L${x + 90},1270 L${x + 110},1380Z`, '#A1663B', '#7A4A27', 3); rr(c, x - 40, 1310, 80, 60, 30, '#2B1B12'); flame(c, x - 10, 1360, 1.2, t); flame(c, x + 14, 1362, .9, t, 2); ell(c, x, 1252, 80, 22, '#3E3E3E'); P(c, `M${x - 80},1252 Q${x},1330 ${x + 80},1252Z`, '#555'); for (let i = 0; i < 3; i++) withA(c, .35, () => circ(c, x - 20 + i * 20, 1200 - (((t || 0) * 40 + i * 30) % 120), 14, '#ddd')); }],
    sacks: ['বস্তা (চাল/সিমেন্ট)', 'floor', (c, t, tm, x) => { [[-90, 0], [30, 0], [-30, -110]].forEach(([dx, dy]) => { P(c, `M${x + dx - 60},${1380 + dy} Q${x + dx - 70},${1280 + dy} ${x + dx - 44},${1270 + dy} L${x + dx + 44},${1270 + dy} Q${x + dx + 70},${1280 + dy} ${x + dx + 60},${1380 + dy}Z`, '#E8DCC0', '#B8A67E', 3); line(c, x + dx - 40, 1290 + dy, x + dx + 40, 1290 + dy, '#B8A67E', 3); }); }],
    bricks: ['ইটের স্তূপ', 'floor', (c, t, tm, x) => { for (let r = 0; r < 5; r++) for (let i = 0; i < 5 - r; i++) rr(c, x - 150 + r * 30 + i * 62, 1350 - r * 30, 58, 28, 3, '#B5442A', '#8A3320', 2); }],
    tubewell: ['টিউবওয়েল', 'out', (c, t, tm, x) => { const g = typeof GY !== 'undefined' ? GY : 1150; rr(c, x - 90, g - 10, 180, 30, 6, '#9E9E9E'); rect(c, x - 14, g - 260, 28, 250, '#2E7D32'); rr(c, x - 24, g - 280, 48, 40, 8, '#2E7D32'); line(c, x + 20, g - 262, x + 150, g - 300, '#1B5E20', 12); rr(c, x - 70, g - 190, 60, 24, 6, '#2E7D32'); }],
    well: ['কুয়া', 'out', (c, t, tm, x) => { const g = typeof GY !== 'undefined' ? GY : 1150; ell(c, x, g - 120, 150, 36, '#3E2723'); rect(c, x - 150, g - 120, 300, 130, '#A1887F'); for (let i = 0; i < 4; i++) line(c, x - 150, g - 90 + i * 30, x + 150, g - 90 + i * 30, '#8D6E63', 3); ell(c, x, g - 120, 150, 36, null, '#8D6E63', 6); line(c, x - 130, g - 120, x - 130, g - 300, '#6D4C41', 10); line(c, x + 130, g - 120, x + 130, g - 300, '#6D4C41', 10); line(c, x - 140, g - 300, x + 140, g - 300, '#6D4C41', 10); line(c, x, g - 300, x, g - 180, '#888', 3); rr(c, x - 22, g - 190, 44, 40, 6, '#78909C'); }],
    haystack: ['খড়ের গাদা', 'out', (c, t, tm, x) => { const g = typeof GY !== 'undefined' ? GY : 1150; P(c, `M${x - 170},${g + 10} Q${x - 150},${g - 230} ${x},${g - 300} Q${x + 150},${g - 230} ${x + 170},${g + 10}Z`, '#E0B44C', '#B98C2A', 3); line(c, x, g - 300, x, g - 360, '#6D4C41', 8); for (let i = 0; i < 6; i++) line(c, x - 120 + i * 48, g - 40 - (i % 2) * 30, x - 100 + i * 48, g - 120 - (i % 2) * 30, '#C99A34', 3); }],
    shed: ['টিনের চালা / গোয়াল', 'out', (c, t, tm, x) => { const g = typeof GY !== 'undefined' ? GY : 1150; P(c, `M${x - 280},${g - 360} L${x + 280},${g - 320} L${x + 280},${g - 290} L${x - 280},${g - 330}Z`, '#90A4AE', '#607D8B', 3); [x - 260, x - 10, x + 260].forEach(px => rect(c, px - 8, g - 330, 16, 340, '#6D4C41')); rect(c, x - 260, g - 60, 520, 12, '#6D4C41'); }],
    crack: ['দেয়ালে ফাটল', 'wall', (c, t, tm, x) => { P(c, `M${x},300 L${x + 20},380 L${x - 14},450 L${x + 30},540 L${x + 4},630 L${x + 36},720 M${x + 20},380 L${x + 70},410 M${x - 14},450 L${x - 60},470 M${x + 30},540 L${x + 80},560`, null, '#3E2C20', 5); }],
    clothesline: ['দড়িতে কাপড়', 'wall', (c, t, tm, x) => { P(c, `M${x - 260},520 Q${x},580 ${x + 260},520`, null, '#555', 3); [['#E57373', -190], ['#64B5F6', -60], ['#FFF176', 70], ['#81C784', 180]].forEach(([col, dx], i) => { const sw = Math.sin((t || 0) * 2 + i) * 4; P(c, `M${x + dx - 40},${548 + Math.abs(dx) * -.08} L${x + dx + 40},${548 + Math.abs(dx) * -.08} L${x + dx + 36 + sw},${680} L${x + dx - 36 + sw},${680}Z`, col); }); }],
    scale: ['দাঁড়িপাল্লা', 'floor', (c, t, tm, x) => { OBJ.table[2](c, t, tm, x); line(c, x, 1110, x, 960, '#5D4037', 8); line(c, x - 110, 970, x + 110, 970, '#5D4037', 6); [x - 110, x + 110].forEach(px => { line(c, px, 970, px - 40, 1050, '#777', 2); line(c, px, 970, px + 40, 1050, '#777', 2); P(c, `M${px - 50},1050 Q${px},1090 ${px + 50},1050Z`, '#B0A27A'); }); }],
    signboard: ['সাইনবোর্ড / নামফলক', 'wall', (c, t, tm, x) => { rr(c, x - 200, 200, 400, 110, 8, '#1B5E20', '#0D3B12', 4); rr(c, x - 180, 220, 360, 70, 4, null, '#E8F5E9', 2); for (let i = 0; i < 3; i++) rr(c, x - 150 + i * 110, 246, 80, 16, 4, '#E8F5E9'); }],
    truck: ['ট্রাক', 'out', (c, t, tm, x) => { const g = typeof GY !== 'undefined' ? GY : 1150; rr(c, x - 240, g - 230, 320, 190, 10, '#E65100'); rr(c, x + 80, g - 180, 140, 140, 14, '#F9A825'); rr(c, x + 140, g - 166, 66, 56, 6, '#B3E5FC'); [x - 170, x + 150].forEach(wx => { circ(c, wx, g - 30, 42, '#263238'); circ(c, wx, g - 30, 18, '#90A4AE'); }); }],
    ambulance: ['অ্যাম্বুলেন্স', 'out', (c, t, tm, x) => { const g = typeof GY !== 'undefined' ? GY : 1150; rr(c, x - 230, g - 240, 420, 200, 16, '#FAFAFA', '#CFD8DC', 3); rr(c, x + 110, g - 210, 70, 60, 8, '#B3E5FC'); rect(c, x - 230, g - 120, 420, 20, '#E53935'); rect(c, x - 90, g - 210, 20, 70, '#E53935'); rect(c, x - 115, g - 185, 70, 20, '#E53935'); const on = Math.floor((t || 0) * 4) % 2; rr(c, x - 60, g - 262, 50, 22, 6, on ? '#E53935' : '#1E88E5'); [x - 140, x + 110].forEach(wx => { circ(c, wx, g - 36, 38, '#263238'); circ(c, wx, g - 36, 16, '#90A4AE'); }); }],
    cctv: ['সিসিটিভি ক্যামেরা', 'wall', (c, t, tm, x) => { line(c, x, 150, x, 200, '#555', 8); rr(c, x - 70, 190, 110, 50, 10, '#ECEFF1', '#90A4AE', 3); circ(c, x - 64, 215, 14, '#263238'); if (Math.floor((t || 0) * 2) % 2) circ(c, x + 24, 202, 5, '#E53935'); }],
    jailbars: ['জেলের শিক', 'wall', (c, t, tm, x) => { rect(c, 0, 240, W, 18, '#37474F'); rect(c, 0, 1360, W, 18, '#37474F'); for (let bx = 40; bx < W; bx += 90) rect(c, bx, 240, 14, 1130, '#546E7A'); rect(c, 0, 760, W, 14, '#37474F'); }],
    mudwall: ['মাটির দেয়াল', 'wall', (c, t, tm, x) => { for (let i = 0; i < 40; i++) withA(c, .18, () => ell(c, (i * 197) % W, 120 + (i * 131) % 1200, 50, 14, '#7A5634')); }],
    almanac: ['দেয়ালের ঘড়ি', 'wall', (c, t, tm, x) => { if (E.clock) E.clock(c, t, tm, x); }]
  };
  /* Bangla words in a scene → object (first match wins per object). Specific before general. */
  const WORDS = [
    [/প্রদীপ|কুপি/, 'lamps'], [/হারিকেন|লণ্ঠন|লন্ঠন/, 'hurricane'], [/মোমবাতি/, 'candle'], [/বাল্ব|বাতির আলো/, 'bulb'],
    [/কম্পিউটার|মনিটর|ডেস্কটপ/, 'computer'], [/প্রিন্টার|ফটোকপি|প্রিন্ট/, 'printer'], [/ফাইলের স্তূপ|ফাইলের পাহাড়|নথিপত্র|ফাইলগুলো|ফাইল/, 'filestack'],
    [/সিন্দুক|লকার|ভল্ট/, 'safe'], [/ক্যাশবাক্স|ক্যাশ কাউন্টার|ক্যাশে/, 'cashbox'], [/দাঁড়িপাল্লা|পাল্লায়|ওজন কর/, 'scale'],
    [/রিভলভিং চেয়ার|অফিসের চেয়ার|বসের চেয়ার/, 'office_chair'], [/চেয়ার|কেদারা/, 'chair'], [/টেবিল/, 'table'], [/আলমারি/, 'almirah'],
    [/খাট|চৌকি|তক্তপোশ|বিছানা/, 'khat'], [/টুলে|টুল|মোড়া/, 'stool'], [/পতাকা/, 'flag'], [/বাঁধানো ছবি|দেয়ালের ছবি|ছবি টাঙানো|পোর্ট্রেট/, 'portrait'],
    [/কলসি|কলস/, 'kolshi'], [/চুলা|উনুন|রান্না চড়/, 'chula'], [/বস্তা/, 'sacks'], [/ইটের|ইট /, 'bricks'], [/টিউবওয়েল|চাপকল/, 'tubewell'], [/কুয়া|কুয়ো|কূপ/, 'well'],
    [/খড়ের|খড়/, 'haystack'], [/গোয়াল|টিনের চাল/, 'shed'], [/ফাটল/, 'crack'], [/কাপড় শুকা|দড়িতে কাপড়|ভেজা কাপড়/, 'clothesline'],
    [/সাইনবোর্ড|নামফলক|সাইনবোর্ডে/, 'signboard'], [/ট্রাক/, 'truck'], [/অ্যাম্বুলেন্স/, 'ambulance'], [/সিসিটিভি|ক্যামেরায় ধরা/, 'cctv'],
    [/জেলের শিক|গরাদ|লোহার শিক|হাজতে/, 'jailbars'], [/দেয়ালঘড়ি|দেয়ালের ঘড়ি|ঘড়ির কাঁটা|টিকটিক/, 'almanac']
  ];
  // the same thing already in a place's art (so a word does not draw it twice)
  const SAME = { table: ['desk', 'table', 'books', 'cafe', 'counter', 'o_computer', 'o_cashbox', 'o_scale'], chair: ['desk', 'seats'], office_chair: ['desk'], filestack: ['files'], khat: ['bed', 'hbed'], almirah: ['wardrobe', 'lockers'], almanac: ['clock'], jailbars: ['bars'], flag: [], computer: ['desk', 'servers'], bulb: ['lamp', 'hang'] };
  Object.entries(OBJ).forEach(([k, [, , f]]) => { E['o_' + k] = (c, t, tm, a) => { try { f(c, t, tm, +a || (OBJ[k][1] === 'wall' ? 540 : 200)); } catch (e) { } }; });
  const OUTDOOR = k => OBJ[k] && OBJ[k][1] === 'out';

  /* ---------- new places ---------- */
  FLOORS.mud = FLOORS.mud || ['#9C7650', '#86633F'];
  const NEW = [
    ['prison', 'জেলখানা / হাজত', 'আইন ও প্রশাসন', 'wall:#5B6066 bricks floor:concrete o_bulb:540 o_jailbars'],
    ['police_station', 'থানা', 'আইন ও প্রশাসন', 'wall:#E1E5E8 floor:tile notice:150 cal:700 o_flag:880 fan >desk'],
    ['officer_room', 'অফিসারের কক্ষ', 'আইন ও প্রশাসন', 'wall:#E6DCC6 floor:carpet o_portrait:540 o_almirah:150 o_flag:900 fan >desk'],
    ['land_office', 'ভূমি অফিস / তহসিল', 'আইন ও প্রশাসন', 'wall:#DCD2BA files:100 o_filestack:860 o_crack:640 fan >desk'],
    ['salish', 'গ্রামের সালিশ', 'গ্রাম', 'sky trees ground:mud o_khat:300 o_stool:820'],
    ['mud_house', 'মাটির ঘরের ভেতর', 'গ্রাম', 'wall:#B48A5E o_mudwall floor:mud o_khat:330 o_hurricane:860 o_kolshi:820'],
    ['cowshed', 'গোয়ালঘর', 'গ্রাম', 'sky trees ground:mud o_shed:540 o_haystack:880'],
    ['lantern_room', 'হারিকেনের আলোয় ঘর', 'বাসা', 'wall:#4A3F33 floor:wood o_hurricane:760 o_khat:300 o_almirah:900'],
    ['night_lamps', 'প্রদীপ জ্বলা ঘর', 'বাসা', 'wall:#3F362C floor:wood o_lamps:540 o_khat:260 o_almirah:900']
  ];
  NEW.forEach(([k, b, g, r]) => { if (PLACE_INDEX[k]) return; PLACE_DEFS.push([k, b, g, r]); const toks = r.split(/\s+/).filter(Boolean).map(s => { const fg = s[0] === '>'; const [n, ...a] = (fg ? s.slice(1) : s).split(':'); return { fg, n, a: a.join(':') }; }); PLACE_INDEX[k] = { bn: b, group: g, toks, outdoor: toks.some(x => x.n === 'sky') }; PLACES[k] = b; });
  Object.assign(PLACE_ALIASES, { jail: 'prison', prison_cell: 'prison', hajat: 'prison', thana: 'police_station', police: 'police_station', officer: 'officer_room', dc_office: 'officer_room', tahsil: 'land_office', land: 'land_office', shalish: 'salish', village_court: 'salish', hut_inside: 'mud_house', mud: 'mud_house', cow_shed: 'cowshed', goal: 'cowshed' });
  if (typeof CTX_PLACES !== 'undefined') CTX_PLACES.push([/জেলখানা|কারাগার|হাজতে|জেলে ঢুক/, 'prison'], [/থানায়|থানার/, 'police_station'], [/ভূমি অফিস|তহসিল/, 'land_office'], [/সালিশ/, 'salish'], [/মাটির ঘর|কুঁড়েঘর/, 'mud_house'], [/গোয়ালঘর|গোয়ালে/, 'cowshed']);

  /* ---------- "place+obj:x+obj" → that place with the things added (every part) ---------- */
  const SLOTS = { floor: [170, 910, 540], wall: [540, 250, 830], out: [880, 200, 540] };
  function objToks(list, base) {
    const used = { floor: 0, wall: 0, out: 0 }; return list.map(([n, x]) => { const kind = OBJ[n][1], xx = x || SLOTS[kind][used[kind]++ % 3]; return { fg: false, n: 'o_' + n, a: String(xx) }; });
  }
  function comboKey(base, list) { return base + list.map(([n, x]) => '+' + n + (x ? ':' + x : '')).join(''); }
  function buildCombo(key) {
    if (PLACE_INDEX[key]) return key; const parts = key.split('+'), base = parts[0], b = PLACE_INDEX[base]; if (!b) return null;
    const list = parts.slice(1).map(s => { const [n, x] = s.split(':'); return [n, +x || 0]; }).filter(([n]) => OBJ[n]); if (!list.length) return null;
    const btoks = b.toks || []; const toks = btoks.slice(), extra = objToks(list, b);
    // background objects go before the foreground desk/table but after the wall/floor (so they sit in the room)
    toks.push(...extra); PLACE_INDEX[key] = Object.assign({}, b, { toks, combo: true, legacy: false }); PLACES[key] = b.bn;
    if (b.legacy) { const lg = base; PLACE_INDEX[key].toks = [{ fg: false, n: '_legacy', a: lg }].concat(extra, [{ fg: true, n: '_legacyfg', a: lg }]); }
    return key;
  }
  E._legacy = (c, t, tm, a) => { (BG[a] || BG.abstract)(c, t, tm); };
  FGE._legacyfg = (c, t, tm, a) => { if (FG[a]) FG[a](c, t); };
  const _np = normPlace;
  normPlace = function (p) {
    const s = String(p || '').trim().toLowerCase().replace(/\s+/g, '_');
    if (s.includes('+')) { if (PLACE_INDEX[s]) return s; const base = _np(s.split('+')[0]); const key = base + s.slice(s.indexOf('+')); const k2 = buildCombo(key); if (k2) return k2; }
    return _np(p);
  };
  window.TF_OBJ = { OBJ, WORDS, buildCombo, isObj: n => !!OBJ[n] };

  /* ---------- auto: the things a scene talks about ---------- */
  const _ad = autoDirect;
  autoDirect = function (st) {
    const r = _ad.apply(this, arguments);
    try {
      if (typeof S !== 'undefined' && (S.ctxBg === false || S.autoObj === false)) return r;
      (st.scenes || []).forEach(sc => {
        if (sc.type !== 'story' || !sc.place) return;
        const base = String(sc.place).split('+')[0], b = PLACE_INDEX[base]; if (!b) return;
        const have = new Set(((PLACE_INDEX[sc.place] || b).toks || []).map(x => x.n)); if (b.legacy) ['desk', 'table'].forEach(n => /office|cabin|meeting|bank|dining|restaurant|tea/.test(base) && have.add(n));
        const text = [sc.badge || ''].concat((sc.lines || []).map(l => l.cap || '')).join(' ');
        const add = []; WORDS.forEach(([re, n]) => { if (add.length >= 3 || add.includes(n) || have.has('o_' + n)) return; if ((SAME[n] || []).some(x => have.has(x))) return; if (OUTDOOR(n) !== !!b.outdoor) return; if (OBJ[n][1] === 'wall' && b.outdoor) return; if (re.test(text)) add.push(n); });
        // a chair goes with a table, not on top of it
        if (add.includes('table') && add.includes('chair')) { const i = add.indexOf('chair'); add.splice(i, 1); add.push('chair'); }
        if (!add.length) return;
        const prev = String(sc.place).includes('+') ? String(sc.place).slice(String(sc.place).indexOf('+') + 1).split('+').map(s => s.split(':')) : [];
        const key = comboKey(base, prev.map(([n, x]) => [n, +x || 0]).concat(add.map(n => [n, 0])));
        const k2 = buildCombo(key); if (k2) sc.place = k2;
      });
    } catch (e) { console.warn('auto objects', e); }
    return r;
  };

  /* ---------- step 2 place picker: combos are not listed, the current one is ---------- */
  if (typeof placeSelect === 'function') {
    placeSelect = function (cur, onchange) {
      const s = el('select', { onchange }); const groups = {};
      Object.entries(PLACE_INDEX).forEach(([k, v]) => { if (v.combo && k !== cur) return; (groups[v.group] = groups[v.group] || []).push([k, v.combo ? v.bn + ' + ' + k.split('+').slice(1).map(x => (OBJ[x.split(':')[0]] || [x])[0]).join(', ') : v.bn]); });
      Object.entries(groups).forEach(([g, arr]) => { const og = el('optgroup', { label: g }); arr.forEach(([k, b]) => og.append(el('option', { value: k, text: b }))); s.append(og); }); s.value = cur; return s;
    };
  }

  /* ---------- new hand props ---------- */
  const NP = {
    file: ['ফাইল', c => { rr(c, -70, -50, 140, 100, 6, '#E9C46A', '#B08A2E', 3); rect(c, -70, -50, 140, 16, '#D4A93F'); rr(c, -40, -20, 80, 10, 3, '#fff'); }],
    pen: ['কলম', c => { c.rotate(-.5); rr(c, -60, -8, 110, 16, 6, '#1E3A8A'); P(c, 'M50,-8 L74,0 L50,8Z', '#E0C27A'); rect(c, -40, -12, 6, 24, '#C0C0C0'); }],
    candle: ['মোমবাতি', (c, t) => { rr(c, -14, -40, 28, 90, 4, '#FFF8E1', '#E0D3B0', 2); flame(c, 0, -42, 1, t); }],
    lantern: ['হারিকেন', (c, t) => { rr(c, -36, 30, 72, 20, 5, '#B71C1C'); P(c, 'M-28,30 Q-40,-20 -24,-60 L24,-60 Q40,-20 28,30Z', 'rgba(255,236,179,.85)', '#8D6E63', 3); flame(c, 0, 6, 1.1, t); rr(c, -30, -74, 60, 14, 5, '#B71C1C'); P(c, 'M-26,-74 Q0,-120 26,-74', null, '#424242', 4); }],
    photo: ['ছবি / ফটো', c => { rr(c, -60, -70, 120, 140, 6, '#fff', '#ccc', 3); rr(c, -48, -58, 96, 96, 3, '#9CC9E0'); P(c, 'M-48,38 L-14,0 L10,22 L28,6 L48,38Z', '#5B8C5A'); }],
    cheque: ['চেক', c => { rr(c, -90, -40, 180, 80, 6, '#E3F2FD', '#90CAF9', 3); line(c, -70, -10, 40, -10, '#90A4AE', 3); line(c, -70, 12, 70, 12, '#90A4AE', 3); P(c, 'M30,24 q10,-14 20,0 t20,0', null, '#1E3A8A', 3); }],
    certificate: ['সনদ / সার্টিফিকেট', c => { rr(c, -80, -60, 160, 120, 6, '#FFFDF4', '#C9A24A', 4); line(c, -50, -24, 50, -24, '#8D6E63', 4); line(c, -50, 0, 50, 0, '#BCAAA4', 3); line(c, -50, 16, 30, 16, '#BCAAA4', 3); circ(c, 52, 34, 16, '#C62828'); }],
    stamp: ['সিল', c => { rr(c, -16, -60, 32, 50, 10, '#5D4037'); rr(c, -40, -12, 80, 30, 6, '#3E2723'); rr(c, -36, 18, 72, 10, 3, '#B71C1C'); }],
    stick: ['লাঠি', c => { line(c, -10, -120, 10, 120, '#6D4C41', 14); P(c, 'M-10,-120 Q-40,-130 -40,-100', null, '#6D4C41', 14); }],
    basket: ['ঝুড়ি', c => { P(c, 'M-70,-20 L70,-20 L52,50 L-52,50Z', '#C8A165', '#8D6E63', 3); for (let i = 0; i < 5; i++) line(c, -60 + i * 30, -20, -46 + i * 24, 50, '#8D6E63', 2); P(c, 'M-60,-20 Q0,-90 60,-20', null, '#8D6E63', 6); }],
    broom: ['ঝাড়ু', c => { line(c, 0, -120, 0, 30, '#8D6E63', 10); P(c, 'M-10,30 L-50,120 L50,120 L10,30Z', '#D4B26A', '#A88A3E', 2); }]
  };
  Object.entries(NP).forEach(([k, [bn, f]]) => { if (!PX[k]) PX[k] = f; if (!PROPS.includes(k)) PROPS.push(k); if (typeof PROP_BN !== 'undefined' && !PROP_BN[k]) PROP_BN[k] = bn; });
  if (typeof AUTO_HOLD !== 'undefined') AUTO_HOLD.push([/ফাইলটা|ফাইল হাতে|ফাইল এগিয়ে|ফাইল/, 'file'], [/কলম/, 'pen'], [/মোমবাতি/, 'candle'], [/হারিকেন|লণ্ঠন/, 'lantern'], [/ফটো|ছবিটা/, 'photo'], [/চেকটা|চেক বই|চেকে সই/, 'cheque'], [/সনদ|সার্টিফিকেট/, 'certificate'], [/সিল/, 'stamp'], [/লাঠি/, 'stick'], [/ঝুড়ি/, 'basket'], [/ঝাড়ু/, 'broom']);

  /* ---------- tell the AI (every prompt that lists places) ---------- */
  if (typeof PLACE_LIST_FOR_PROMPT === 'function') {
    const _pl = PLACE_LIST_FOR_PROMPT;
    PLACE_LIST_FOR_PROMPT = function () { return _pl.apply(this, arguments) + ' | জায়গায় জিনিস যোগ করতে জায়গার পরে +জিনিস লিখুন (যেমন: govt_office+table+chair+flag, mud_house+hurricane+kolshi), দৃশ্যে যা দরকার: ' + Object.keys(OBJ).filter(k => !/mudwall|almanac/.test(k)).join(', '); };
  }
})();
