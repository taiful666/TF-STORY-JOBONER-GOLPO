/* TF Story — ছায়া-পুতুল থিয়েটার (shadow puppet theatre look)
   নতুন অ্যানিমেশন স্টাইল: সেটিংসে "ছায়া-পুতুল থিয়েটার" বাছলে গল্পের দৃশ্য বদলে যায় —
   1. পেছনে প্রদীপের আলোয় জ্বলা কাপড়ের পর্দা (দিন = সোনালি, সন্ধ্যা = কমলা, রাত = নীল জেল)
   2. চরিত্র, জিনিস আর সামনের সাজ কালো কাটআউট পুতুল হয়ে যায়: ছোট ছিদ্রের কাটওয়ার্ক, নিচে নামানো লাঠি
   3. দূরের দৃশ্য ঝাপসা ছায়া হয়ে পর্দায় পড়ে; উপরে ঝালর, নিচে মঞ্চের কাঠ; কাপড়ের বুনন ও দানা
   4. ইসলামিক অংশে নবী–রাসুল, ফেরেশতা ও সাহাবিদের (L.sacred) কোনো ছায়াও আঁকা হয় না — শুধু খালি আলো
   উক্তি-কার্ড, ক্যাপশন ও মোশন-লেখা আগের মতো রঙিন থাকে। সব ক্যানভাসে, তাই ওয়েব ও অ্যান্ড্রয়েড অ্যাপে এক।
   আলো-কাপড়-কাটআউটের ধারণা Shadow Puppet Theatre kit (S9 · Grow With AST, MIT) থেকে নেওয়া; কোড নতুন লেখা। */
(function () {
  'use strict';
  if (typeof StoryRenderer === 'undefined') return;
  const SR = StoryRenderer.prototype;
  const INK = 'rgb(20,8,4)';
  const on = r => !!(r && r.settings && r.settings.animStyle === 'shadow');
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  /* ---------- reusable layers (made once) ---------- */
  let LAYER = null, SOFT = null, HOLES = null, WEAVE = null, GRAIN = null;
  function layers() {
    if (LAYER) return;
    LAYER = mk(W, H); SOFT = mk(Math.round(W / 8), Math.round(H / 8));
    // cut-work: tiny punched holes in a staggered grid
    const hc = mk(46, 46), hx = hc.getContext('2d'); hx.fillStyle = '#000';
    [[11, 11, 2.4], [34, 34, 2.4], [34, 11, 1.2], [11, 34, 1.2]].forEach(([x, y, r]) => { hx.beginPath(); hx.arc(x, y, r, 0, Math.PI * 2); hx.fill(); });
    HOLES = hc;
    // cloth weave (fixed seed so every export looks the same)
    const wc = mk(192, 192), wx = wc.getContext('2d'), wd = wx.createImageData(192, 192); let s = 1234567;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const row = Array.from({ length: 192 }, rnd), col = Array.from({ length: 192 }, rnd);
    for (let y = 0; y < 192; y++) for (let x = 0; x < 192; x++) {
      const th = (y % 3 === 0 ? 1 : y % 3 === 1 ? .35 : 0) * row[y], tv = (x % 3 === 0 ? 1 : x % 3 === 1 ? .3 : 0) * col[x];
      const v = 255 - Math.round((th + tv) * 34 + rnd() * 14), i = (y * 192 + x) * 4;
      wd.data[i] = wd.data[i + 1] = wd.data[i + 2] = v; wd.data[i + 3] = 255;
    }
    wx.putImageData(wd, 0, 0); WEAVE = wc;
    // film grain: three tiles, cycled per frame
    GRAIN = [0, 1, 2].map(() => { const g = mk(160, 160), gx = g.getContext('2d'), gd = gx.createImageData(160, 160); for (let i = 0; i < gd.data.length; i += 4) { const v = 128 + (rnd() - .5) * 90; gd.data[i] = gd.data[i + 1] = gd.data[i + 2] = v; gd.data[i + 3] = 255; } gx.putImageData(gd, 0, 0); return g; });
  }

  /* ---------- lamp-lit cloth (gel by time of day / mood) ---------- */
  const GELS = {
    day: ['#ffe4a8', '#f0a95a', '#6e3412'],
    evening: ['#ffd08a', '#e07a3a', '#5a1f0c'],
    night: ['#bcd6e8', '#4f7c9c', '#0c1d2c'],
    tense: ['#ffc89a', '#c8553a', '#3c0c08']
  };
  function cloth(c, t, sc) {
    const g0 = GELS[sc.mood === 'tense' ? 'tense' : sc.time === 'night' ? 'night' : sc.time === 'evening' ? 'evening' : 'day'];
    const fl = .93 + .035 * Math.sin(t * 7.3) + .025 * Math.sin(t * 13.1 + 1.7); // lamp flicker
    const cx = W * .5 + Math.sin(t * .4) * 14, cy = H * .36;
    const g = c.createRadialGradient(cx, cy, 30, cx, cy, Math.max(W, H) * .78 * fl);
    g.addColorStop(0, g0[0]); g.addColorStop(.45, g0[1]); g.addColorStop(1, g0[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }

  /* ---------- the painted background, turned into soft far shadows on the cloth ---------- */
  function farShadow(r, si) {
    r._shFar = r._shFar || new Map();
    if (r._shFar.has(si)) return r._shFar.get(si);
    let out = null;
    try {
      const bg = SR.bgFor.call(r, si), w = Math.round(W / 5), h = Math.round(H / 5), cv = mk(w, h), x = cv.getContext('2d', { willReadFrequently: true });
      x.drawImage(bg, 0, 0, w, h); const d = x.getImageData(0, 0, w, h), px = d.data, lum = new Float32Array(w * h), hist = new Uint32Array(64);
      for (let i = 0, j = 0; i < px.length; i += 4, j++) { const L = (px[i] * .3 + px[i + 1] * .59 + px[i + 2] * .11) / 255; lum[j] = L; hist[Math.min(63, L * 64 | 0)]++; }
      let acc = 0, thr = .5; for (let b = 0; b < 64; b++) { acc += hist[b]; if (acc >= lum.length * .42) { thr = (b + 1) / 64; break; } }
      for (let j = 0; j < lum.length; j++) { const a = clamp01((thr + .07 - lum[j]) / .14); px[j * 4] = 20; px[j * 4 + 1] = 8; px[j * 4 + 2] = 4; px[j * 4 + 3] = Math.round(a * 255); }
      x.putImageData(d, 0, 0); out = cv;
    } catch (e) { out = null; }
    r._shFar.set(si, out); return out;
  }

  /* ---------- stage frame: scalloped valance on top, wooden ledge below ---------- */
  function frame(c, t) {
    c.save(); c.fillStyle = INK;
    const vh = H * .045; c.fillRect(0, 0, W, vh);
    c.beginPath(); for (let x = 0; x <= W; x += 60) { c.moveTo(x - 30, vh); c.quadraticCurveTo(x, vh + 34 + Math.sin(t * 1.4 + x * .02) * 3, x + 30, vh); } c.fill();
    const ly = H * .935; c.fillRect(0, ly, W, H - ly);
    c.globalCompositeOperation = 'destination-out'; for (let x = 24; x < W; x += 36) { c.beginPath(); c.arc(x, ly + 18, 3, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }

  /* ---------- puppet rods + no sacred figures ---------- */
  let DRAWING = false;
  const _person = drawPerson;
  drawPerson = function (c, o) {
    if (!DRAWING) return _person(c, o);
    if (o && o.L && o.L.sacred) return; // never a silhouette or stand-in for prophets, angels or companions
    _person(c, o);
    try {
      let s = o.s || 1; if (o.L && o.L.kid) s *= .74; else if (o.L && o.L.teen) s *= .92;
      const side = o.flip ? -1 : 1, hx = o.x + side * 95 * s, hy = o.y - 150 * s;
      c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.strokeStyle = '#000'; c.lineCap = 'round';
      c.lineWidth = 6 * s; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + side * 60 * s, o.y + 1500 * s); c.stroke();
      c.lineWidth = 7 * s; c.beginPath(); c.moveTo(o.x - side * 10 * s, o.y - 260 * s); c.lineTo(o.x - side * 40 * s, o.y + 1500 * s); c.stroke();
      c.fillStyle = '#000'; c.beginPath(); c.arc(hx, hy, 9 * s, 0, Math.PI * 2); c.fill();
      c.restore();
    } catch (_) { }
  };

  /* ---------- the story scene, drawn as a shadow play ---------- */
  const _story = SR.drawStory;
  SR.drawStory = function (c, si, t) {
    if (!on(this)) return _story.call(this, c, si, t);
    layers();
    const sc = this.story.scenes[si];
    const far = farShadow(this, si);
    // 1) lit cloth + far shadows (the screen itself does not move with the camera)
    cloth(c, t, sc);
    if (far) { c.save(); c.globalAlpha = sc.time === 'night' ? .42 : .34; c.drawImage(far, -20, -10, W + 40, H + 20); c.restore(); }
    // 2) puppets: the normal scene without its background, tints, weather, name tags or cards, on a scratch layer
    const lx = LAYER.getContext('2d'); lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalAlpha = 1; lx.globalCompositeOperation = 'source-over'; lx.filter = 'none'; lx.clearRect(0, 0, W, H);
    const keep = { bgFor: Object.prototype.hasOwnProperty.call(this, 'bgFor') ? this.bgFor : undefined, jump: this.jump, tag: this.nameTag, noCard: this._noCard };
    const blank = this._shBlank || (this._shBlank = mk(2, 2));
    this.story.scenes[si] = Object.assign({}, sc, { time: undefined, weather: undefined, mood: sc.mood === 'tense' ? undefined : sc.mood });
    this.bgFor = () => blank; this.jump = null; this.nameTag = {}; this._noCard = true; DRAWING = true;
    try { _story.call(this, lx, si, t); }
    catch (e) { if (!this._she) { this._she = 1; console.error('shadow fx:', e); } }
    finally {
      DRAWING = false; this.story.scenes[si] = sc; this.jump = keep.jump; this.nameTag = keep.tag; this._noCard = keep.noCard;
      if (keep.bgFor === undefined) delete this.bgFor; else this.bgFor = keep.bgFor;
    }
    // cut-work holes, then everything becomes black ink (alpha kept, so fades still work)
    lx.setTransform(1, 0, 0, 1, 0, 0); lx.filter = 'none'; lx.globalAlpha = 1;
    lx.globalCompositeOperation = 'destination-out'; lx.fillStyle = lx.createPattern(HOLES, 'repeat'); lx.fillRect(0, 0, W, H);
    lx.globalCompositeOperation = 'source-in'; lx.fillStyle = INK; lx.fillRect(0, 0, W, H);
    lx.globalCompositeOperation = 'source-over';
    // soft second shadow (puppet a little away from the cloth), then the sharp one
    const sx = SOFT.getContext('2d'); sx.clearRect(0, 0, SOFT.width, SOFT.height); sx.drawImage(LAYER, 0, 0, SOFT.width, SOFT.height);
    c.save(); c.globalAlpha = .3; c.drawImage(SOFT, 18 + Math.sin(t * 1.1) * 4, 12, W, H); c.restore();
    c.save(); c.globalAlpha = .95; c.drawImage(LAYER, 0, 0, W, H); c.restore();
    // 3) stage frame, cloth weave, grain, edge falloff
    frame(c, t);
    c.save();
    c.globalCompositeOperation = 'multiply'; c.globalAlpha = .55; c.fillStyle = c.createPattern(WEAVE, 'repeat'); c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'overlay'; c.globalAlpha = .1; c.fillStyle = c.createPattern(GRAIN[Math.floor(t * 24) % 3], 'repeat'); c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    const v = c.createRadialGradient(W / 2, H * .42, Math.min(W, H) * .35, W / 2, H * .45, Math.max(W, H) * .72); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,3,0,.55)');
    c.fillStyle = v; c.fillRect(0, 0, W, H);
    c.restore();
    // 4) weather + cards stay in colour, on top
    if (sc.weather) { try { drawWeather(c, sc.weather, t); } catch (_) { } }
    if (!keep.noCard) {
      try {
        const [a, b] = this.shotRangeOfScene(si); let k = this.shotAt(t); if (k < a) k = a; if (k > b) k = b;
        const sh = this.tl.shots[k], ln = sc.lines[sh.li];
        CARD_CINE = this.cine2; if (ln && ln.card) drawCard(c, ln.card, t - sh.start, sh.dur + .2, t);
      } catch (_) { }
    }
  };

  // shadow play = wide stage: whole puppets with their rods, never a face-only close-up
  const _cam2 = SR.camFor2;
  SR.camFor2 = function (sc, idx, ln) {
    const cam = _cam2.call(this, sc, idx, ln);
    if (!on(this) || !cam || sc.type !== 'story') return cam;
    const z = Math.min(cam.z, idx % 2 ? 1.18 : 1.06), k = (z - 1) / Math.max(.001, cam.z - 1);
    return { x: 540 + (cam.x - 540) * k, y: 960 + (cam.y - 960) * k + 40, z };
  };

  // new story → forget the cached far shadows
  const _load = SR.load;
  SR.load = function (story, tl, settings) { this._shFar = null; return _load.call(this, story, tl, settings); };

  window.TF_SHADOW = { version: 1 };
})();
