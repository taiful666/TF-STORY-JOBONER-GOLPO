/* ===================== TF Story Studio — ইসলামিক অংশ: পূর্ণাঙ্গ চরিত্র, আরও রিসোর্স ও লং-ভিডিও স্টাইলের লেখা =====================
   Loaded only for index.html?part=islamic (after islamic/art.js). Everything here is a patch on top of the Story engine:
   1. people are shown HEAD TO FEET (the camera no longer crops them at the chest): both hands with fingers, legs and feet,
      walking / running / sitting / kneeling / dua / salam / folded hands … (faceless, as before)
   2. many more resources: props, animals, effects (light rays, fireflies, sand, petals …) and places
   3. the long-video caption style (big words that pop in one by one, key words in gold with an underline) as a second
      caption look next to "ইসলামিক ক্লাসিক"                                                                      */
(function () {
  'use strict';
  if (!/[?&]part=islamic\b/.test(location.search)) return;

  const _patch = window.ISL_ART_PATCH, _dom = window.ISL_ART_DOM;
  window.ISL_ART_PATCH = function () {
    if (_patch) _patch();
    const A = window.ISL_ART_API; if (!A) { console.warn('ISL_ART_API missing'); return; }
    [patchPeople, patchProps, patchResources, patchCaptions, patchCover, patchCoverSymbol].forEach(f => { try { f(A); } catch (e) { console.error('isl art2:', f.name, e); } });
  };
  window.ISL_ART_DOM = function () { if (_dom) _dom(); try { domTweaks(); } catch (e) { console.error(e); } };

  const BN = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  const dirAng = (dx, dy) => Math.atan2(-dx, dy); // rotation that points a hand's fingers along (dx,dy)

  /* =========================================================================================
     1. PEOPLE — head to toe
     ========================================================================================= */
  const NEW_ACTS = {
    walk: 'হেঁটে চলছে', run: 'দৌড়াচ্ছে', sit: 'মেঝেতে বসা', kneel: 'হাঁটু গেড়ে বসা', dua: 'দোয়ার হাত তোলা', salam: 'বুকে হাত (সালাম)',
    namaz: 'নামাজের হাত বাঁধা', point_up: 'শাহাদাত আঙুল তোলা', open_hands: 'দুই হাত মেলে ধরা', embrace: 'দুই হাত বাড়িয়ে আলিঙ্গন', cover_face: 'হাতে মুখ ঢাকা', carry: 'দুই হাতে বয়ে নিচ্ছে'
  };
  const ROBE = new Set(['saree', 'burqa', 'abaya', 'frock', 'salwar', 'kurti', 'uniform_f', 'vestlungi', 'jubba']);

  function pantFor(L) {
    const o = L.outfit;
    return L.pants || (o === 'panjabi' || o === 'jubba' ? '#F1ECE0' : o === 'suit' || o === 'blazer' ? shade(L.c1, -.25) : o === 'uniform' ? '#2E3440' : o === 'nurse' ? L.c1 : o === 'coat' ? '#3d4a55' : '#3A4150');
  }

  function patchPeople(A) {
    NEW_ACTS && Object.keys(NEW_ACTS).forEach(k => { if (!ACTIONS.includes(k)) ACTIONS.push(k); });
    try { Object.assign(DO_BN, NEW_ACTS); } catch (e) { }
    const _dl = drawLegs;

    /* ---- legs ---- */
    function legsWalk(c, L, sk, ph, run, robe) { // trousers / robe with real legs: thigh + shin + shoe, one foot lifts while the other is planted
      const Y = LEG_LEN, gap = 22, pant = pantFor(L), shoeCol = L.female ? '#6b3a2a' : '#2b2522';
      const legs = [-1, 1].map(side => {
        const f = Math.sin(ph + (side < 0 ? 0 : Math.PI)), lift = Math.max(0, f) * (robe ? .3 : 1), hx = side * (gap + 24);
        return { side, f, hx, kx: hx + side * 6 + f * (robe ? 6 : run ? 22 : 12), ky: 120 - lift * (run ? 52 : 30), ax: hx + side * 4 + f * (robe ? 10 : run ? 40 : 22), ay: Y - 24 - lift * (run ? 78 : 46), lift };
      }).sort((a, b) => a.lift - b.lift); // the lifted foot is drawn last (in front)
      legs.forEach(g => {
        c.lineCap = 'round'; c.lineJoin = 'round';
        line(c, g.hx, 0, g.kx, g.ky, pant, 60); line(c, g.kx, g.ky, g.ax, g.ay, pant, 48);
        line(c, g.kx, g.ky, g.ax, g.ay, shade(pant, -.12), 6);
        P(c, `M${g.ax - 28},${g.ay + 14} Q${g.ax - 30},${g.ay - 12} ${g.ax - 4},${g.ay - 14} L${g.ax + 20},${g.ay - 12} Q${g.ax + 46},${g.ay - 2} ${g.ax + 44},${g.ay + 16}Z`, shoeCol);
        rect(c, g.ax - 28, g.ay + 12, 74, 6, '#15110f');
      });
    }
    function legsSit(c, L, sk, kneel) { // folded legs in front of the lower body (drawn after the torso)
      const col = L.outfit === 'vestlungi' ? (L.c2 || shade(L.c1, .35)) : ROBE.has(L.outfit) ? L.c1 : pantFor(L), dk = shade(col, -.14), shoe = L.female ? '#6b3a2a' : '#2b2522';
      if (kneel) {
        P(c, 'M-100,8 Q-118,40 -78,64 L78,64 Q118,40 100,8 Q0,-22 -100,8Z', col, dk, 3);
        P(c, 'M-60,60 Q-70,74 -38,80 L-14,80 Q-10,68 -14,60Z M60,60 Q70,74 38,80 L14,80 Q10,68 14,60Z', shade(sk, -.05));
        line(c, 0, 4, 0, 60, dk, 3);
      } else {
        P(c, 'M-190,34 Q-196,2 -110,-10 Q0,-34 110,-10 Q196,2 190,34 Q190,70 120,70 L-120,70 Q-190,70 -190,34Z', col, dk, 3);
        P(c, 'M-196,42 Q-130,22 40,52 Q50,64 20,76 Q-120,84 -196,60Z', shade(col, .06), dk, 3); // left shin crosses over
        P(c, 'M196,42 Q130,26 -40,56 Q-50,68 -20,78 Q120,86 196,60Z', shade(col, -.04), dk, 3);
        ell(c, -150, 66, 34, 13, shade(sk, -.04)); ell(c, 150, 66, 34, 13, shade(sk, -.04));
      }
    }

    /* ---- hands: palm + thumb + fingers ---- */
    const hnd = (c, x, y, sk, ang, open) => A.hand(c, x, y, sk, ang, open, 2.1);

    /* ---- the whole person ---- */
    drawPerson = function (c, o) {
      const act = o.act || 'idle';
      const L = o.L, t = o.t || 0, seed = o.seed || 0, sk = L.skin, sk2 = shade(sk, -.18);
      let s = o.s || 1; if (L.kid) s *= .74; else if (L.teen) s *= .92;
      const feel = o.feel || 'neutral';
      const walking = act === 'walk' || act === 'run', run = act === 'run', sitting = act === 'sit' || act === 'kneel';
      const ph = t * (run ? 9.5 : 5.4) + seed * 3, sw = Math.sin(ph);
      let bob = Math.sin(t * 2.2 + seed) * 3; if (walking) bob = -Math.abs(sw) * (run ? 20 : 11); if (sitting) bob = Math.sin(t * 1.7 + seed) * 2.2;
      let tilt = (o.tilt || 0) + Math.sin(t * 1.3 + seed) * 1.6;
      if (act === 'head_down' || feel === 'shy' || act === 'cover_face') tilt += 4; if (feel === 'proud' || act === 'point_up') tilt -= 3; if (run) tilt += 4; if (walking) tilt += sw * 1.8;
      const blink = ((t + seed * 1.7) % 3.4) < .13, drop = act === 'sit' ? LEG_LEN - 40 : act === 'kneel' ? LEG_LEN - 60 : 0;
      c.save(); c.translate(o.x, o.y + bob); c.scale(o.flip ? -s : s, s);
      if (o.alpha != null) c.globalAlpha *= o.alpha;
      ell(c, 0, LEG_LEN + 14, sitting ? 210 : 130, 16, 'rgba(0,0,0,.12)');

      // legs (standing / walking)
      if (!sitting) {
        if (walking) {
          if (ROBE.has(L.outfit) && L.outfit !== 'jubba') { c.save(); c.rotate(sw * .035); c.translate(0, Math.abs(sw) * -4); _dl(c, L, sk, false); c.restore(); }
          else { legsWalk(c, L, sk, ph, run, L.outfit === 'jubba'); if (L.outfit === 'jubba') { const hy = LEG_LEN - 46, hw = sw * 8; P(c, `M-128,0 L${-120 - hw},${hy} Q${hw * .5},${hy + 8 + Math.abs(sw) * 4} ${120 - hw},${hy} L128,0Z`, L.c1); P(c, `M${-120 - hw},${hy} Q${hw * .5},${hy + 8 + Math.abs(sw) * 4} ${120 - hw},${hy}`, null, shade(L.c1, -.16), 4); } }
        } else _dl(c, L, sk, feel === 'shy' || act === 'head_down');
      }
      c.save(); c.translate(0, drop);
      // hair behind the head
      const hairCol = L.hair && L.hair.startsWith('grey') ? HAIR_GREY : (L.hair === 'bald_grey' ? HAIR_WHITE : HAIR_DARK);
      if (L.hair === 'long') P(c, 'M-86,-330 Q-100,-200 -92,-150 L92,-150 Q100,-200 86,-330 Q0,-410 -86,-330Z', HAIR_DARK);
      if (L.hair === 'braid') { P(c, 'M-80,-320 Q-90,-240 -70,-220 L70,-220 Q90,-240 80,-320Z', HAIR_DARK); for (let i = 0; i < 4; i++) ell(c, 70 + i * 4, -200 + i * 34, 18, 20, HAIR_DARK); }
      if (L.hair === 'ponytail') P(c, 'M60,-360 Q130,-330 110,-220 Q100,-180 80,-170 Q100,-250 50,-330Z', HAIR_DARK);
      if (L.hair === 'pigtails') { ell(c, -95, -300, 26, 34, HAIR_DARK); ell(c, 95, -300, 26, 34, HAIR_DARK); }
      if (L.hair === 'hijab') P(c, 'M-104,-300 Q-110,-410 0,-418 Q110,-410 104,-300 Q112,-200 70,-185 L-70,-185 Q-112,-200 -104,-300Z', L.c1);
      if (L.hair === 'hood' || L.hair === 'hood_white') P(c, 'M-100,-215 Q-118,-410 0,-415 Q118,-410 100,-215 L80,-205 Q78,-330 0,-338 Q-78,-330 -80,-205Z', L.c1);
      drawOutfit(c, L, sk);
      if (sitting) legsSit(c, L, sk, act === 'kneel');

      // arms (+ what they hold)
      const col = armCol(L), late = []; let holdPt = null;
      const arm = (side, cx, cy, hx, hy, open, dx, dy, c2) => { // shoulder → (control) → hand; the hand follows the last bit of the arm unless dx,dy are given
        P(c, `M${side * 112},-185 Q${cx},${cy} ${hx},${hy}`, null, c2 || col, 46);
        const a = dx != null ? dirAng(dx, dy) : dirAng(hx - cx, hy - cy); hnd(c, hx, hy, sk, a, open);
      };
      const sway = Math.sin(t * 1.6 + seed) * 3, A0 = act;
      if (A0 === 'arms_crossed') { P(c, 'M-112,-185 Q-150,-110 -60,-110 L70,-125', null, col, 46); P(c, 'M112,-185 Q150,-120 60,-130 L-60,-140', null, col, 46); hnd(c, 70, -125, sk, dirAng(1, .1), false); hnd(c, -62, -140, sk, dirAng(-1, .1), false); }
      else if (A0 === 'hands_on_head') { arm(-1, -175, -260, -80, -370, false, 1, -1); arm(1, 175, -260, 80, -370, false, -1, -1); }
      else if (A0 === 'pray_hands') { arm(-1, -130, -110, -14, -150, true, .15, -1); arm(1, 130, -110, 14, -150, true, -.15, -1); }
      else if (A0 === 'hold') { arm(-1, -140, -90, -40, -112, false, 1, 0); arm(1, 140, -90, 40, -112, false, -1, 0); holdPt = [0, -135, 'chest']; }
      else if (A0 === 'namaz') { arm(-1, -150, -100, -26, -126, false, 1, .1); arm(1, 150, -108, 24, -132, false, -1, .1); }
      else if (A0 === 'dua') { arm(-1, -158, -140, -50, -176, true, .2, -1); arm(1, 158, -140, 50, -176, true, -.2, -1); late.push(c => { c.save(); c.globalAlpha *= .9; sparkle(c, 0, -200, 14, t, seed); c.restore(); }); }
      else if (A0 === 'open_hands') { const k = Math.sin(t * 2 + seed) * 6; arm(-1, -178, -150, -214, -100 + k, true, -.5, .9); arm(1, 178, -150, 214, -100 - k, true, .5, .9); }
      else if (A0 === 'embrace') { const k = Math.sin(t * 2.2 + seed) * 8; arm(-1, -200, -215, -262, -150 + k, true, -1, .5); arm(1, 200, -215, 262, -150 - k, true, 1, .5); }
      else if (A0 === 'cover_face') { late.push(c => { P(c, 'M-112,-185 Q-150,-270 -40,-292', null, col, 46); P(c, 'M112,-185 Q150,-270 40,-292', null, col, 46); hnd(c, -36, -296, sk, dirAng(.5, -1), true); hnd(c, 36, -296, sk, dirAng(-.5, -1), true); }); }
      else if (A0 === 'carry') { arm(-1, -150, -90, -62, -72, false, 1, 0); arm(1, 150, -90, 62, -72, false, -1, 0); holdPt = [0, -88, 'carry']; }
      else if (A0 === 'sit') { arm(-1, -178, -90, -128, 14, true, 0, 1); arm(1, 178, -90, 128, 14, true, 0, 1); }
      else if (A0 === 'kneel') { arm(-1, -150, -90, -80, -6, true, .6, 1); arm(1, 150, -90, 80, -6, true, -.6, 1); }
      else if (walking) {
        if (run) { arm(-1, -150, -140, -96, -150 + sw * 52, false, .8, 1); arm(1, 150, -140, 96, -150 - sw * 52, false, -.8, 1); }
        else { arm(-1, -142, -100, -128 - Math.abs(sw) * 4, -8 + sw * 44, false, 0, 1); arm(1, 142, -100, 128 + Math.abs(sw) * 4, -8 - sw * 44, false, 0, 1); }
      } else {
        // left arm hangs unless the action uses it
        arm(-1, -140, -100, -132 + sway * .3, -5, false, 0, 1);
        if (A0 === 'idle' || A0 === 'head_down') arm(1, 140, -100, 132 - sway * .3, -5, false, 0, 1);
        if (A0 === 'talk') { const w = o.talk ? Math.sin(t * 3.1 + seed) * 7 : 0; arm(1, 160, -110, 120 + w, -150, o.talk, -.3, -1); }
        if (A0 === 'phone') { arm(1, 150, -80, 40, -122, false, -1, -.1); holdPt = [30, -175, 'phone_small']; }
        if (A0 === 'raise_phone') { const wv = Math.sin(t * 3) * 4; arm(1, 175, -230, 160, -330 + wv, false, 0, -1); holdPt = [160, -470 + wv, 'phone_big']; }
        if (A0 === 'cup') { arm(1, 145, -90, 80, -100, false, -1, 0); holdPt = [80, -130, 'cup']; }
        if (A0 === 'give') { arm(1, 175, -150, 248, -176, true, 1, 0); holdPt = [300, -180, 'give']; }
        if (A0 === 'point') { arm(1, 175, -200, 248, -236, false, 1, -.2); P(c, 'M262,-240 L302,-252', null, sk, 14); }
        if (A0 === 'wave') { const w = Math.sin(t * 8) * 12; arm(1, 175, -250, 150 + w, -360, true, w * .02, -1); }
        if (A0 === 'salam') { arm(1, 150, -120, 16, -150, true, -1, .2); }
        if (A0 === 'point_up') { arm(1, 170, -210, 150, -330, false, 0, -1); P(c, 'M150,-340 L150,-404', null, sk, 15); circ(c, 150, -408, 8, sk); }
      }

      // neck & head
      rr(c, -22, -245, 44, 45, 10, sk2);
      c.save(); c.translate(0, -215); c.rotate(tilt * Math.PI / 180); c.translate(0, 215);
      if (L.hair !== 'hijab') { circ(c, -72, -295, 15, sk); circ(c, 72, -295, 15, sk); }
      ell(c, 0, -300, 72, 81, sk);
      drawHairFront(c, L, hairCol);
      drawFace(c, L, o, feel, blink, t, seed);
      c.restore();
      late.forEach(f => f(c));

      // the held thing (in front of the hands, then the fingers on top)
      const prop = o.hold || (holdPt ? ({ phone_small: 'phone', phone_big: 'phone', cup: 'cup', give: 'envelope', chest: 'book', carry: null })[holdPt[2]] : null);
      if (holdPt && prop) {
        c.save(); c.translate(holdPt[0], holdPt[1]); if (o.flip) c.scale(-1, 1);
        const big = holdPt[2] === 'phone_big'; drawProp(c, prop, big ? 1.05 : (holdPt[2] === 'give' ? 1 : .8), t, big); c.restore();
        if (holdPt[2] === 'phone_small') hnd(c, 40, -122, sk, dirAng(-1, -.1), false);
        if (holdPt[2] === 'cup') hnd(c, 80, -100, sk, dirAng(-1, 0), false);
        if (holdPt[2] === 'give') hnd(c, 248, -176, sk, dirAng(1, 0), true);
        if (holdPt[2] === 'chest') { hnd(c, -40, -112, sk, dirAng(1, 0), false); hnd(c, 40, -112, sk, dirAng(-1, 0), false); }
        if (holdPt[2] === 'carry') { hnd(c, -62, -72, sk, dirAng(1, 0), false); hnd(c, 62, -72, sk, dirAng(-1, 0), false); }
      }
      c.restore(); c.restore();
    };

    /* ---- camera: nobody is cut off any more — head to feet, the camera drifts slowly between a closer and a wider full-body frame ---- */
    const RP = StoryRenderer.prototype, _cam2 = RP.camFor2;
    RP.camFor2 = function (sc, idx, ln) {
      if (sc.type !== 'story' || !sc.cast.length) return _cam2.call(this, sc, idx, ln);
      const n = Math.min(3, sc.cast.length || 1), pos = CAST_POS[n] || CAST_POS[1];
      const kf = id => { const cr = this.chars[id]; return cr ? (cr.L.kid ? .74 : cr.L.teen ? .92 : 1) : 1; };
      let top = 1e9, bot = -1e9, xs = [];
      for (let i = 0; i < n; i++) { const p = pos[i] || pos[0], k = kf(sc.cast[i]); top = Math.min(top, p[1] - 430 * p[2] * k); bot = Math.max(bot, p[1] + (LEG_LEN + 36) * p[2] * k); xs.push(p[0]); }
      const sp = ln.who ? sc.cast.indexOf(ln.who) : (ln.focus ? sc.cast.indexOf(ln.focus) : -1);
      const wide = [1.0, 1.12, 1.2, 1.08][idx % 4];
      let z = n === 1 ? 1.06 + (wide - 1) * 1.1 : n === 2 ? 1.0 + (wide - 1) * .7 : 1.0;
      const need = (bot - top + 120); z = Math.max(1, Math.min(z, H / need)); // always keep the whole body in the frame
      const x = 540 + (sp >= 0 && n > 1 ? (pos[sp][0] - 540) * .18 : 0), vh = H / z;
      return { x, y: Math.min((top + bot) / 2 - 10, H - vh / 2), z };
    };
  }

  /* =========================================================================================
     2. PROPS
     ========================================================================================= */
  const NEW_PROPS = ['quran', 'tasbih', 'staff', 'jug', 'bread', 'basket', 'lantern_h', 'scroll', 'rope', 'dates_bowl', 'candle', 'mat', 'bowl', 'sack', 'coins', 'olive', 'wheat', 'hourglass', 'compass', 'pen'];
  function patchProps(A) {
    NEW_PROPS.forEach(k => { if (!PROPS.includes(k)) PROPS.push(k); });
    const GOLD = '#C9A24A', _dp = drawProp;
    const D = {
      quran(c) { rr(c, -62, -80, 124, 160, 8, '#1F5A43'); rr(c, -62, -80, 14, 160, 4, '#123D2B'); rr(c, -34, -46, 76, 92, 8, null, GOLD, 4); circ(c, 4, -2, 20, GOLD); circ(c, 12, -6, 17, '#1F5A43'); P(c, 'M18,-18 l3,8 8,0 -6,5 2,8 -7,-5 -7,5 2,-8 -6,-5 8,0z', GOLD); },
      tasbih(c, t) { for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; circ(c, Math.cos(a) * 34, Math.sin(a) * 40, 7.5, i === Math.floor(t * 2) % 20 ? '#E9C46A' : '#6D4C41'); } line(c, 0, 40, 0, 74, '#6D4C41', 4); ell(c, 0, 82, 8, 12, '#6D4C41'); },
      staff(c) { line(c, 0, 150, 0, -170, '#6B4A2B', 14); P(c, 'M0,-170 Q26,-196 20,-150', null, '#6B4A2B', 12); line(c, 0, 20, 0, 26, '#4E3520', 15); },
      jug(c) { P(c, 'M-34,-30 Q-58,10 -40,52 Q0,74 40,52 Q58,10 34,-30 Q22,-48 -22,-48Z', '#B0643A', '#8A4A2A', 4); rr(c, -20, -66, 40, 24, 8, '#9A5530'); line(c, -34, -4, 34, -4, '#8A4A2A', 4); P(c, 'M36,-18 Q70,-10 52,22', null, '#8A4A2A', 8); },
      bread(c) { ell(c, 0, 0, 62, 20, '#E3B76A'); ell(c, 0, -6, 52, 13, '#EFCB86'); for (let i = 0; i < 4; i++) line(c, -30 + i * 20, -10, -22 + i * 20, 0, '#C99A4E', 3); },
      basket(c) { P(c, 'M-62,-14 Q-66,50 -36,60 L36,60 Q66,50 62,-14Z', '#B88A4E', '#8A6330', 4); for (let i = 0; i < 5; i++) line(c, -50 + i * 25, -12, -44 + i * 22, 58, '#8A6330', 3); P(c, 'M-62,-14 Q0,-90 62,-14', null, '#8A6330', 7); for (let i = 0; i < 5; i++) circ(c, -34 + i * 17, -22 + (i % 2) * 6, 13, ['#D5483A', '#E8B04B', '#7FB77E'][i % 3]); },
      lantern_h(c, t) { const g = c.createRadialGradient(0, 8, 4, 0, 8, 110); g.addColorStop(0, 'rgba(255,200,100,.55)'); g.addColorStop(1, 'rgba(255,200,100,0)'); c.fillStyle = g; c.fillRect(-120, -110, 240, 240); P(c, 'M-26,-30 L26,-30 L34,50 L-34,50Z', 'rgba(255,214,130,.85)', '#6D4C41', 5); rr(c, -34, 46, 68, 12, 4, '#6D4C41'); rr(c, -30, -42, 60, 14, 6, '#6D4C41'); P(c, 'M-18,-44 Q0,-86 18,-44', null, '#6D4C41', 6); P(c, `M0,40 Q-10,18 0,2 Q${10 + Math.sin(t * 8) * 3},18 0,40Z`, '#FF9A2E'); },
      scroll(c) { rr(c, -70, -44, 140, 88, 8, '#F2E4C3', '#C9B07C', 3); for (let i = 0; i < 4; i++) line(c, -50, -24 + i * 18, 50 - (i % 2) * 24, -24 + i * 18, '#8A7448', 3); rr(c, -78, -52, 14, 104, 7, '#B88A4E'); rr(c, 64, -52, 14, 104, 7, '#B88A4E'); },
      rope(c) { for (let i = 0; i < 4; i++) ell(c, 0, i * 5, 52 - i * 5, 26 - i * 3, null, '#B89A64', 9); },
      dates_bowl(c) { P(c, 'M-60,-8 Q-50,46 0,50 Q50,46 60,-8Z', '#7A5230', '#5A3A20', 4); for (let i = 0; i < 9; i++) ell(c, -40 + (i % 5) * 20, -14 - Math.floor(i / 5) * 12 + (i % 2) * 4, 13, 8, '#5B2A14'); },
      candle(c, t) { rr(c, -14, -20, 28, 80, 6, '#F6EAD0', '#D9C8A0', 3); line(c, 0, -20, 0, -30, '#333', 3); P(c, `M0,-30 Q${-10 + Math.sin(t * 9) * 2},-52 0,-72 Q10,-52 0,-30Z`, '#FFC24A'); const g = c.createRadialGradient(0, -52, 4, 0, -52, 90); g.addColorStop(0, 'rgba(255,200,100,.4)'); g.addColorStop(1, 'rgba(255,200,100,0)'); c.fillStyle = g; c.fillRect(-90, -142, 180, 180); },
      mat(c) { rr(c, -60, -70, 120, 150, 14, '#2E5E4E', GOLD, 4); P(c, 'M-34,50 L-34,-20 Q0,-62 34,-20 L34,50Z', null, GOLD, 4); circ(c, 0, 8, 9, GOLD); },
      bowl(c, t) { P(c, 'M-52,-10 Q-44,40 0,44 Q44,40 52,-10Z', '#F6F1E6', '#D8CDB5', 4); ell(c, 0, -10, 52, 12, '#C9A06A'); steam(c, 0, -22, t); },
      sack(c) { P(c, 'M-50,-40 Q-70,20 -48,60 L48,60 Q70,20 50,-40 Q30,-60 0,-52 Q-30,-60 -50,-40Z', '#BFA06A', '#8F7444', 4); P(c, 'M-26,-48 Q0,-34 26,-48', null, '#8F7444', 6); },
      coins(c) { for (let i = 0; i < 6; i++) ell(c, -30 + (i % 3) * 30, 8 - Math.floor(i / 3) * 14, 24, 9, '#F2C14E', '#C99A2E', 3); },
      olive(c) { line(c, 0, 70, 0, -50, '#6B5B3A', 6); for (let i = 0; i < 7; i++) { const sd = i % 2 ? 1 : -1; P(c, `M0,${50 - i * 16} q${sd * 30},-10 ${sd * 42},-30 q${-sd * 24},4 ${-sd * 42},30z`, '#5E8C4A'); } circ(c, 12, -20, 7, '#3B4A2A'); },
      wheat(c) { line(c, 0, 80, 0, -50, '#C9A24A', 5); for (let i = 0; i < 7; i++) { ell(c, -9, -50 + i * 14, 6, 11, '#E3C36A'); ell(c, 9, -44 + i * 14, 6, 11, '#E3C36A'); } },
      hourglass(c, t) { P(c, 'M-34,-60 L34,-60 L4,0 L34,60 L-34,60 L-4,0Z', 'rgba(220,235,245,.6)', '#6D4C41', 5); P(c, 'M-24,56 L24,56 L6,24 L-6,24Z', '#E3B76A'); line(c, 0, -2, 0, 22, '#E3B76A', 3); rr(c, -42, -70, 84, 12, 5, '#6D4C41'); rr(c, -42, 58, 84, 12, 5, '#6D4C41'); },
      compass(c, t) { circ(c, 0, 0, 52, '#F4EFE6', GOLD, 8); const a = Math.sin(t * 1.3) * .5 - .8; P(c, `M${Math.cos(a) * 40},${Math.sin(a) * 40} L${-Math.sin(a) * 8},${Math.cos(a) * 8} L${Math.sin(a) * 8},${-Math.cos(a) * 8}Z`, '#C0392B'); P(c, `M${-Math.cos(a) * 40},${-Math.sin(a) * 40} L${-Math.sin(a) * 8},${Math.cos(a) * 8} L${Math.sin(a) * 8},${-Math.cos(a) * 8}Z`, '#2B2B2B'); circ(c, 0, 0, 5, GOLD); },
      pen(c) { c.rotate(.6); rr(c, -8, -70, 16, 120, 6, '#2B3A55'); P(c, 'M-8,50 L8,50 L0,76Z', '#E3B76A'); rr(c, -8, -70, 16, 18, 6, GOLD); }
    };
    drawProp = function (c, kind, s, t, big) { if (D[kind]) { c.save(); c.scale(s, s); D[kind](c, t); c.restore(); return; } return _dp(c, kind, s, t, big); };
  }

  /* =========================================================================================
     3. RESOURCES — effects, animals, places
     ========================================================================================= */
  function patchResources(A) {
    const AN = A.ANIMALS, beast = A.beast, legs = A.legs;
    const FX = {}; // "+fx_name:x" works like an animal in a place heading and is drawn every frame
    const rnd = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
    Object.assign(AN, {
      /* ---------- effects (drawn like animals: "## desert_night+fx_fireflies:500") ---------- */
      fx_lightrays(c, t, x) { const cx = x || 540; c.save(); c.globalCompositeOperation = 'screen'; for (let i = 0; i < 6; i++) { const a = -1.2 + i * .34 + Math.sin(t * .4 + i) * .05, g = c.createLinearGradient(cx, 0, cx + Math.sin(a) * 1500, Math.cos(a) * 1500); g.addColorStop(0, 'rgba(255,238,170,.32)'); g.addColorStop(1, 'rgba(255,238,170,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(cx - 30, -40); c.lineTo(cx + 30, -40); c.lineTo(cx + Math.sin(a) * 1700 + 160, Math.cos(a) * 1700); c.lineTo(cx + Math.sin(a) * 1700 - 160, Math.cos(a) * 1700); c.closePath(); c.fill(); } c.restore(); },
      fx_fireflies(c, t) { for (let i = 0; i < 26; i++) { const x = (rnd(i, 1) * W + Math.sin(t * .6 + i) * 60 + W) % W, y = 700 + rnd(i, 2) * 900 + Math.cos(t * .5 + i * 2) * 40, a = .35 + .65 * Math.max(0, Math.sin(t * 2 + i * 1.7)); const g = c.createRadialGradient(x, y, 0, x, y, 26); g.addColorStop(0, `rgba(255,240,150,${a})`); g.addColorStop(1, 'rgba(255,240,150,0)'); c.fillStyle = g; c.fillRect(x - 26, y - 26, 52, 52); } },
      fx_sandblow(c, t) { c.save(); for (let i = 0; i < 90; i++) { const sp = 380 + rnd(i, 3) * 520, x = (rnd(i, 4) * (W + 400) + t * sp) % (W + 400) - 200, y = 500 + rnd(i, 5) * 1300 + Math.sin(t * 2 + i) * 14; c.globalAlpha = .18 + rnd(i, 6) * .3; line(c, x, y, x - 50 - rnd(i, 7) * 60, y + 8, '#D9BC82', 3 + rnd(i, 8) * 3); } c.globalAlpha = 1; const g = c.createLinearGradient(0, 700, 0, 1700); g.addColorStop(0, 'rgba(221,190,130,0)'); g.addColorStop(1, 'rgba(221,190,130,.35)'); c.fillStyle = g; c.fillRect(0, 700, W, 1000); c.restore(); },
      fx_petals(c, t) { for (let i = 0; i < 28; i++) { const x = (rnd(i, 1) * W + Math.sin(t * .8 + i) * 80 + W) % W, y = ((t * (60 + rnd(i, 2) * 70) + rnd(i, 3) * 2200) % 2200) - 120; c.save(); c.translate(x, y); c.rotate(t * (1 + rnd(i, 4)) + i); ell(c, 0, 0, 13, 7, ['#F7C6D0', '#FBE3E8', '#F2A7B8'][i % 3]); c.restore(); } },
      fx_dust(c, t) { for (let i = 0; i < 34; i++) { const x = (rnd(i, 1) * W + t * 12 * (1 + rnd(i, 2))) % W, y = (rnd(i, 3) * 1700 + Math.sin(t * .5 + i) * 30 + 150), a = .2 + .5 * Math.max(0, Math.sin(t * 1.2 + i)); c.fillStyle = `rgba(255,245,215,${a})`; c.beginPath(); c.arc(x, y, 2.5 + rnd(i, 4) * 4, 0, 7); c.fill(); } },
      fx_birds(c, t, x) { for (let i = 0; i < 9; i++) { const px = ((x || 100) + t * 90 + i * 150 + (i % 3) * 40) % (W + 300) - 150, py = 260 + (i % 4) * 70 + Math.sin(t * 1.3 + i) * 24, w = Math.sin(t * 7 + i * 1.3) * 14; P(c, `M${px - 26},${py + w} Q${px - 12},${py - 14} ${px},${py} Q${px + 12},${py - 14} ${px + 26},${py + w}`, null, '#2B2B2B', 4); } },
      fx_smoke(c, t, x) { const cx = x || 540; for (let i = 0; i < 9; i++) { const o = ((t * .35 + i / 9) % 1); withA(c, .5 * (1 - o), () => circ(c, cx + Math.sin(o * 6 + i) * 40, GY - 60 - o * 520, 30 + o * 90, '#8C8C8C')); } },
      fx_stars(c, t) { for (let i = 0; i < 70; i++) { const x = rnd(i, 1) * W, y = rnd(i, 2) * 900, a = .35 + .65 * Math.abs(Math.sin(t * (.8 + rnd(i, 3)) + i)); c.fillStyle = `rgba(255,248,220,${a})`; c.beginPath(); c.arc(x, y, 1.5 + rnd(i, 4) * 2.4, 0, 7); c.fill(); } },
      fx_rain(c, t) { c.save(); c.strokeStyle = 'rgba(200,220,255,.5)'; c.lineWidth = 3; c.beginPath(); for (let i = 0; i < 120; i++) { const x = (i * 97 + t * 240) % 1180 - 50, y = (i * 173 + t * 1500) % 2000 - 60; c.moveTo(x, y); c.lineTo(x - 14, y + 44); } c.stroke(); c.restore(); },
      fx_campfire(c, t, x) { const cx = x || 540, y = GY + 70; ell(c, cx, y + 18, 90, 16, 'rgba(0,0,0,.25)'); for (let i = 0; i < 3; i++) line(c, cx - 60 + i * 12, y + 12, cx + 56 - i * 14, y - 6 - i * 4, '#4A3321', 14); const g = c.createRadialGradient(cx, y - 60, 6, cx, y - 60, 420); g.addColorStop(0, 'rgba(255,170,70,.45)'); g.addColorStop(1, 'rgba(255,170,70,0)'); c.fillStyle = g; c.fillRect(cx - 420, y - 480, 840, 900);
        for (let i = 0; i < 4; i++) { const k = 1 - i * .2, w = Math.sin(t * 9 + i * 2) * 6; P(c, `M${cx - 46 * k},${y} Q${cx - 50 * k + w},${y - 70 * k} ${cx + w},${y - 150 * k} Q${cx + 50 * k - w},${y - 70 * k} ${cx + 46 * k},${y}Z`, ['#E8541E', '#F58A22', '#FFC24A', '#FFF1A8'][i]); } },
      /* ---------- more animals ---------- */
      lion(c, t, x, y, s, f) { beast(c, x, y, s * 1.1, f, () => { const col = '#C99A5B', g = Math.sin(t * 1.3) * 5; legs(c, [-70, -42, 48, 74], -80, shade(col, -.18), t); ell(c, -10, -112, 100, 44, col); P(c, 'M-104,-118 Q-140,-96 -128,-50', null, shade(col, -.15), 9); circ(c, -128, -46, 9, '#6B4423');
        c.save(); c.translate(86, -128 + g); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; circ(c, Math.cos(a) * 44, Math.sin(a) * 44, 22, '#7A4A22'); } circ(c, 0, 0, 38, col); ell(c, 14, 10, 18, 12, '#E8CFA4'); circ(c, -8, -8, 4, '#2B2B2B'); circ(c, 14, -8, 4, '#2B2B2B'); ell(c, 8, 4, 6, 4, '#3B2A1E'); c.restore(); }); },
      elephant(c, t, x, y, s, f) { beast(c, x, y, s * 1.35, f, () => { const col = '#8C8F94', sw = Math.sin(t * 1.2) * 10; legs(c, [-70, -34, 42, 78], -110, shade(col, -.18), t * .5); for (const lx of [-70, -34, 42, 78]) line(c, lx, -110, lx, -4, shade(col, -.18), 30);
        ell(c, -10, -190, 112, 82, col); ell(c, 70, -222, 52, 62, shade(col, -.05)); c.save(); c.translate(120, -238); circ(c, 0, 0, 52, col); P(c, `M20,20 Q74,${60 + sw} 60,${150 + sw * .5} Q50,${180 + sw} 30,${176 + sw}`, null, col, 34); P(c, 'M30,24 Q86,16 74,-4', null, '#F4EFE0', 12); circ(c, 12, -10, 5, '#2B2B2B'); ell(c, -34, 4, 30, 44, shade(col, .06), shade(col, -.2), 3); c.restore(); P(c, 'M-118,-190 Q-134,-150 -122,-110', null, shade(col, -.2), 8); }); },
      wolf(c, t, x, y, s, f) { beast(c, x, y, s, f, () => { const col = '#7C7A78', g = Math.sin(t * 1.5) * 4; legs(c, [-58, -34, 40, 62], -70, shade(col, -.2), t); ell(c, 0, -98, 86, 36, col); P(c, `M-82,-100 Q-124,${-86 + Math.sin(t * 2) * 8} -118,-50`, null, col, 18); c.save(); c.translate(70, -108 + g); P(c, 'M0,0 L40,-22 L74,-6 L66,14 L22,22Z', col); P(c, 'M18,-18 L22,-52 L38,-24Z M36,-24 L46,-54 L54,-18Z', col); circ(c, 44, -8, 4, '#FFE08A'); circ(c, 74, -4, 6, '#222'); c.restore(); }); },
      snake(c, t, x, y) { const cx = x || 540, by = GY + 120; c.save(); c.lineCap = 'round'; c.strokeStyle = '#5E7A3A'; c.lineWidth = 26; c.beginPath(); for (let i = 0; i <= 40; i++) { const px = cx - 200 + i * 10, py = by + Math.sin(i * .5 + t * 3) * 22 - i * 1.2; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); c.strokeStyle = '#8FB05A'; c.lineWidth = 8; c.stroke(); const hx = cx + 200, hy = by + Math.sin(40 * .5 + t * 3) * 22 - 48; circ(c, hx, hy, 24, '#5E7A3A'); circ(c, hx + 8, hy - 6, 4, '#FFE08A'); line(c, hx + 22, hy + 2, hx + 44, hy + 2, '#C0392B', 3); c.restore(); },
      hoopoe(c, t, x) { const px = x || 540, py = 560 + Math.sin(t * 1.6) * 24, w = Math.sin(t * 8) * 22; P(c, `M${px - 20},${py} Q${px - 70},${py - 40 - w} ${px - 110},${py - 10 - w}`, null, '#D9A066', 18); P(c, `M${px + 10},${py} Q${px + 60},${py - 40 - w} ${px + 100},${py - 10 - w}`, null, '#D9A066', 18); for (let i = 0; i < 4; i++) { line(c, px - 40 - i * 16, py - 14 - w * .6 - i * 3, px - 40 - i * 16, py - 4 - w * .6, '#222', 5); } ell(c, px, py + 8, 34, 22, '#E7B98A'); circ(c, px + 36, py - 8, 18, '#E7B98A'); P(c, `M${px + 28},${py - 22} L${px + 22},${py - 52} L${px + 36},${py - 28} L${px + 40},${py - 56} L${px + 46},${py - 24}Z`, '#D9863A'); P(c, `M${px + 52},${py - 8} L${px + 92},${py + 6}`, null, '#5A3A20', 6); circ(c, px + 42, py - 12, 3, '#222'); },
      whale(c, t, x) { const cx = x || 540, cy = 1180 + Math.sin(t * .9) * 22, tail = Math.sin(t * 1.3) * 16; c.save(); c.translate(cx, cy); P(c, `M-330,0 Q-300,-120 -80,-130 Q180,-140 300,-40 Q330,-10 380,${-70 + tail} Q350,${20 + tail} 420,${60 + tail} Q330,60 280,50 Q100,150 -120,130 Q-300,110 -330,0Z`, '#3E5C7A'); P(c, 'M-300,40 Q-100,150 220,70 Q100,120 -120,120 Q-270,100 -300,40Z', '#B9CCDA'); circ(c, -230, -28, 9, '#111'); P(c, 'M-310,18 Q-250,34 -190,18', null, '#2B4258', 5); P(c, 'M-100,-130 Q-110,-190 -80,-230', null, 'rgba(190,225,245,.7)', 9); P(c, 'M-100,-130 Q-60,-186 -30,-212', null, 'rgba(190,225,245,.7)', 9); c.restore(); },
      fish(c, t, x) { for (let i = 0; i < 7; i++) { const px = ((x || 100) + t * 50 * (1 + i % 3 * .3) + i * 140) % (W + 200) - 100, py = 1250 + (i % 4) * 90 + Math.sin(t * 2 + i) * 14; c.save(); c.translate(px, py); ell(c, 0, 0, 34, 16, ['#F2A65A', '#8FB8D8', '#E8D26A'][i % 3]); P(c, `M-30,0 L-54,${-14 + Math.sin(t * 9 + i) * 6} L-54,${14 + Math.sin(t * 9 + i) * 6}Z`, ['#F2A65A', '#8FB8D8', '#E8D26A'][i % 3]); circ(c, 18, -3, 3, '#222'); c.restore(); } },
      ant(c, t, x) { const cx = x || 540, y = GY + 150; for (let i = 0; i < 9; i++) { const px = cx - 260 + ((t * 40 + i * 62) % 520), py = y + Math.sin(px * .03) * 10; circ(c, px, py, 7, '#2B2B2B'); circ(c, px + 10, py - 2, 5, '#2B2B2B'); circ(c, px - 10, py, 8, '#2B2B2B'); for (let k = 0; k < 3; k++) line(c, px - 6 + k * 7, py + 2, px - 8 + k * 7, py + 12 + Math.sin(t * 12 + i + k) * 2, '#2B2B2B', 2); } },
      spider(c, t, x) { const cx = x || 540, y = 420 + Math.sin(t * 1.4) * 14; for (let r = 40; r <= 200; r += 40) { c.beginPath(); for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI * 2; k ? c.lineTo(cx + Math.cos(a) * r, 520 + Math.sin(a) * r) : c.moveTo(cx + Math.cos(a) * r, 520 + Math.sin(a) * r); } c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2; c.stroke(); } for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; line(c, cx, 520, cx + Math.cos(a) * 200, 520 + Math.sin(a) * 200, 'rgba(255,255,255,.45)', 2); } line(c, cx, 200, cx, y, 'rgba(255,255,255,.55)', 2); ell(c, cx, y + 14, 14, 18, '#2B2B2B'); circ(c, cx, y - 6, 9, '#2B2B2B'); for (let k = 0; k < 4; k++) { P(c, `M${cx - 8},${y + 10 + k * 4} q-24,${-8 + k * 6} -34,${14 + k * 6}`, null, '#2B2B2B', 3); P(c, `M${cx + 8},${y + 10 + k * 4} q24,${-8 + k * 6} 34,${14 + k * 6}`, null, '#2B2B2B', 3); } },
      eagle(c, t, x) { const px = ((x || 200) + t * 80) % (W + 400) - 200, py = 320 + Math.sin(t * .8) * 50, w = Math.sin(t * 3) * 14; P(c, `M${px - 140},${py + w} Q${px - 60},${py - 50} ${px},${py} Q${px + 60},${py - 50} ${px + 140},${py + w} Q${px + 60},${py - 18} ${px},${py + 16} Q${px - 60},${py - 18} ${px - 140},${py + w}Z`, '#4A3626'); circ(c, px, py + 6, 14, '#F4EFE6'); P(c, `M${px + 8},${py + 8} L${px + 26},${py + 16} L${px + 8},${py + 18}Z`, '#E3B04B'); },
      raven(c, t, x) { for (let i = 0; i < 5; i++) { const px = ((x || 100) + t * 110 + i * 170) % (W + 300) - 150, py = 300 + i * 46 + Math.sin(t * 2 + i) * 26, w = Math.sin(t * 10 + i) * 16; P(c, `M${px - 30},${py + w} Q${px - 14},${py - 16} ${px},${py} Q${px + 14},${py - 16} ${px + 30},${py + w}`, null, '#1C1C1C', 6); ell(c, px, py + 4, 9, 6, '#1C1C1C'); } }
    });
    // effects are drawn in front of the scene and every frame (so they move); animals stay as they were
    const FXN = Object.keys(AN).filter(k => k.startsWith('fx_'));
    const MOVING = ['whale', 'fish', 'hoopoe', 'eagle', 'raven', 'spider', 'ant', 'snake'].concat(FXN);
    try { FGE.animal = E.animal; FGE.animalIn = E.animalIn; } catch (e) { }
    const _np = normPlace; // "+whale:500" etc.: the extra tokens are drawn in the foreground layer so they animate every frame
    normPlace = function (p) {
      const key = _np(p); const pi = PLACE_INDEX[key]; if (pi && String(key).includes('+')) pi.toks.forEach(tk => { if (tk.n === 'animal' || tk.n === 'animalIn') { const nm = String(tk.a).split(':')[0]; if (MOVING.includes(nm)) tk.fg = true; } });
      return key;
    };
    // the default animals of existing places also move when they are in the list above
    Object.values(PLACE_INDEX).forEach(pi => { if (pi && pi.toks) pi.toks.forEach(tk => { if ((tk.n === 'animal' || tk.n === 'animalIn') && MOVING.includes(String(tk.a).split(':')[0])) { tk.fg = true; tk.n = 'animal'; } }); });

    /* ---------- more places ---------- */
    Object.assign(E, {
      greendome(c, t, tm) { const night = tm === 'night'; rect(c, 0, GY - 20, W, 360, night ? '#8E8A80' : '#EBE5D8'); rr(c, 250, GY - 300, 580, 320, 8, night ? '#B8B09C' : '#F4EEDC'); for (let i = 0; i < 7; i++) rr(c, 276 + i * 78, GY - 250, 48, 120, [24, 24, 0, 0], night ? '#FFD36B' : '#2F6B4F');
        P(c, `M360,${GY - 300} Q540,${GY - 640} 720,${GY - 300}Z`, '#2F8A5A'); rect(c, 520, GY - 700, 40, 64, '#C9A24A'); circ(c, 540, GY - 712, 14, '#C9A24A');
        [150, 930].forEach(x => { rect(c, x - 28, GY - 700, 56, 710, '#EDE3CF'); rr(c, x - 44, GY - 560, 88, 22, 6, '#C9A24A'); P(c, `M${x - 32},${GY - 700} Q${x},${GY - 800} ${x + 32},${GY - 700}Z`, '#2F6B4F'); line(c, x, GY - 800, x, GY - 840, '#C9A24A', 5); }); },
      arafat(c, t, tm) { rect(c, 0, GY - 30, W, 400, '#D9C196'); P(c, `M560,${GY - 30} Q700,${GY - 270} 860,${GY - 30}Z`, '#B59A74'); rect(c, 800, GY - 150, 14, 120, '#F4F1EA'); for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { const x = 40 + i * 120 + (r % 2) * 56, y = GY + 60 + r * 110, k = .6 + r * .25; P(c, `M${x - 46 * k},${y} L${x},${y - 60 * k} L${x + 46 * k},${y}Z`, '#F7F5EF', '#CFC8B6', 2); rect(c, x - 10 * k, y - 22 * k, 20 * k, 22 * k, '#BDB6A2'); } },
      zamzam(c, t) { rect(c, 0, GY - 20, W, 400, '#E7E1D3'); rr(c, 380, GY - 130, 320, 160, 10, '#CFC6B0', '#9C927A', 6); ell(c, 540, GY - 130, 160, 40, '#2E6F95'); for (let i = 0; i < 12; i++) { const o = ((t * .8 + i / 12) % 1); withA(c, 1 - o, () => line(c, 500 + i * 7, GY - 130 - o * 90, 500 + i * 7 + (i - 6) * 3, GY - 130 - o * 90 + 24, '#9FD3F0', 5)); } for (let i = 0; i < 5; i++) { const x = 140 + i * 190; rr(c, x, GY - 20, 14, 60, 4, '#B0A68C'); rr(c, x - 20, GY - 38, 54, 24, 8, '#C9BFA6'); } },
      lowdesks(c) { for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const x = 90 + i * 240 + r * 50, y = 1320 + r * 150; rr(c, x, y, 190, 46, 8, '#8A5A34'); rect(c, x + 12, y + 46, 10, 34, '#6B4423'); rect(c, x + 168, y + 46, 10, 34, '#6B4423'); rr(c, x + 40, y - 18, 110, 22, 5, '#1F5A43'); line(c, x + 95, y - 18, x + 95, y + 4, '#C9A24A', 3); } },
      pond(c, t, tm) { const g = c.createLinearGradient(0, GY, 0, 1700); g.addColorStop(0, tm === 'night' ? '#1D3550' : '#6FB5C9'); g.addColorStop(1, tm === 'night' ? '#10243A' : '#3E8CA8'); ell(c, 540, GY + 330, 520, 230, g, '#7AA45A', 10); for (let i = 0; i < 7; i++) { const x = 220 + (i * 137) % 640, y = GY + 260 + (i * 61) % 150; ell(c, x, y, 36, 14, '#4C8F43'); if (i % 3 === 0) { circ(c, x + 6, y - 8, 9, '#F3A6C0'); } } for (let i = 0; i < 4; i++) withA(c, .5, () => ell(c, 540 + Math.sin(t + i) * 120, GY + 330 + i * 24, 90 + Math.sin(t * 2 + i) * 16, 10, null, 'rgba(255,255,255,.7)', 3)); [[380, 1.0], [620, .8]].forEach(([x, k], i) => { const px = x + Math.sin(t * .7 + i) * 50, py = GY + 360 + i * 40; ell(c, px, py, 34 * k, 20 * k, '#F6F1E6'); circ(c, px + 28 * k, py - 20 * k, 13 * k, '#F6F1E6'); P(c, `M${px + 38 * k},${py - 20 * k} l18,6 l-18,6z`, '#E8A33A'); }); },
      wetroad(c, t, tm) { rect(c, 0, GY, W, H - GY, '#4B525C'); rect(c, 0, GY, W, 24, '#6E7782'); for (let i = 0; i < 6; i++) ell(c, 120 + i * 170, 1380 + (i % 3) * 120, 90, 18, 'rgba(160,190,225,.45)'); for (let x = 0; x < W; x += 200) rr(c, x + 40, 1560, 110, 14, 6, 'rgba(238,238,238,.7)'); },
      streetlamp(c, t, tm, a) { const x = +a || 300, g = c.createRadialGradient(x, GY - 480, 10, x, GY - 480, 420); g.addColorStop(0, 'rgba(255,214,130,.55)'); g.addColorStop(1, 'rgba(255,214,130,0)'); c.fillStyle = g; c.fillRect(x - 420, GY - 900, 840, 900); rect(c, x - 8, GY - 500, 16, 520, '#2B2F36'); P(c, `M${x - 40},${GY - 500} Q${x},${GY - 560} ${x + 40},${GY - 500}Z`, '#2B2F36'); ell(c, x, GY - 494, 26, 12, '#FFE9A8'); },
      sunrise(c, t) { const g = c.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, '#6B7FB8'); g.addColorStop(.55, '#F2A66B'); g.addColorStop(1, '#FBE0A0'); rect(c, 0, 0, W, GY, g); const rise = Math.min(1, t / 8) * 40; const sg = c.createRadialGradient(540, GY - 90 - rise, 20, 540, GY - 90 - rise, 420); sg.addColorStop(0, 'rgba(255,236,170,.9)'); sg.addColorStop(1, 'rgba(255,236,170,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, GY); circ(c, 540, GY - 90 - rise, 90, '#FFF0B8'); },
      sandstormbg(c) { const g = c.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, '#C7A878'); g.addColorStop(1, '#E3CBA0'); rect(c, 0, 0, W, GY, g); },
      shipdeck(c, t) { const s = Math.sin(t * 1.2) * 2; c.save(); c.translate(0, s * 4); rect(c, 0, 1250, W, 670, '#8A5A34'); for (let i = 0; i < 9; i++) line(c, 0, 1280 + i * 70, W, 1280 + i * 70, '#6B4423', 4); rect(c, 0, 1230, W, 30, '#6B4423'); line(c, 540, 1230, 540, 240, '#5A3A20', 22); P(c, 'M556,300 L556,1100 L960,1000Z', '#F4EEDC', '#D9CFB4', 4); for (let x = 20; x < W; x += 110) line(c, x, 1230, x, 1130, '#6B4423', 12); line(c, 0, 1130, W, 1130, '#6B4423', 12); c.restore(); },
      gardenbg(c, t) { rect(c, 0, GY, W, H - GY, '#7DB85A'); for (let i = 0; i < 16; i++) { const x = 40 + (i * 71) % 1000, y = GY + 40 + (i * 97) % 500; line(c, x, y, x, y - 40, '#4C8F43', 4); circ(c, x, y - 48, 11, ['#F2A7B8', '#F6D36A', '#FFFFFF', '#B58BD9'][i % 4]); circ(c, x, y - 48, 4, '#E8B04B'); } for (let i = 0; i < 4; i++) { const x = 120 + i * 270; rect(c, x - 14, GY - 180, 28, 190, '#7A5230'); circ(c, x, GY - 230, 100, '#5E9C48'); circ(c, x - 50, GY - 190, 70, '#6BAA52'); circ(c, x + 50, GY - 190, 70, '#6BAA52'); } }
    });
    const DEFS = [
      ['madinah_mosque', 'মসজিদে নববি (সবুজ গম্বুজ)', 'sky moon greendome ground:sand'],
      ['arafat_plain', 'আরাফার ময়দান', 'sky ground:sand arafat'],
      ['zamzam_well', 'জমজম কূপের পাশে', 'sky ground:sand zamzam'],
      ['madrasa_class', 'মাদ্রাসার ক্লাস', 'wall:#EFE6D2 calligraphy lantern floor:carpet >lowdesks'],
      ['village_pond', 'গ্রামের পুকুর', 'sky trees ground:grass pond'],
      ['rainy_road', 'বৃষ্টিভেজা রাস্তা', 'sky skyline wetroad streetlamp:260 streetlamp:820 >fxr'],
      ['night_alley', 'রাতের গলি', 'sky stars moon skyline ground:road streetlamp:540'],
      ['sunrise_dunes', 'ভোরের মরুভূমি', 'sunrise dunes ground:sand'],
      ['sandstorm', 'বালুঝড়', 'sandstormbg dunes ground:sand'],
      ['ship_deck', 'জাহাজের ডেক', 'sky waves shipdeck'],
      ['spring_garden', 'বসন্তের বাগান', 'sky hills gardenbg']
    ];
    FGE.fxr = (c, t) => AN.fx_rain(c, t); FGE.lowdesks = E.lowdesks;
    DEFS.forEach(([k, b, r]) => {
      if (PLACE_INDEX[k]) return; PLACE_DEFS.push([k, b, 'ইসলামিক জীবন', r]);
      const toks = r.split(/\s+/).filter(Boolean).map(s => { const fg = s[0] === '>'; const [n, ...a] = (fg ? s.slice(1) : s).split(':'); return { fg, n, a: a.join(':') }; });
      PLACE_INDEX[k] = { bn: b, group: 'ইসলামিক জীবন', toks, outdoor: toks.some(x => x.n === 'sky') }; PLACES[k] = b;
    });
    // the Quran stand goes BEHIND the people (they are visible head to toe now and it used to cover their body)
    try { PLACE_INDEX.quran_room.toks.forEach(tk => { if (tk.n === 'rehalq') tk.fg = false; }); } catch (e) { }
    // moving things that belong to some places by default
    const ADD = { madinah_mosque: '+fx_birds:80', sunrise_dunes: '+fx_birds:300', sandstorm: '+fx_sandblow', village_pond: '+fx_dust', spring_garden: '+fx_petals', night_alley: '+fx_fireflies', rainy_road: '' };
    Object.entries(ADD).forEach(([k, plus]) => { const p = PLACE_INDEX[k]; if (p && plus) A.parsePlus(plus).forEach(an => { an.fg = true; p.toks.push(an); }); });
  }

  /* =========================================================================================
     4. CAPTIONS — the long-video look: big words that pop in one by one, key words gold with an underline
     ========================================================================================= */
  function patchCaptions(A) {
    const RP = StoryRenderer.prototype, _cap = RP.drawCaption;
    const KT_P = /[।,.!?“”"'‘’:;()]/g;
    function chunksOf(R, k) { // a few words at a time (the same rhythm as the long videos)
      R._islKT = R._islKT || {}; const sh = R.tl.shots[k], key = k + ':' + sh.start.toFixed(2) + ':' + sh.dur.toFixed(2); if (R._islKT[k] && R._islKT[k].key === key) return R._islKT[k];
      const sc = R.story.scenes[sh.si], ln = sc.lines[sh.li], ws = ktWords(ln, sh), out = []; let cur = [];
      ws.forEach((w, i) => { cur.push(i); const left = ws.length - i - 1; if (/[,।?!—:;]$/.test(w.w) || (cur.length >= 3 && left !== 1) || cur.length >= 4) { out.push(cur); cur = []; } });
      if (cur.length) { if (cur.length === 1 && out.length && out[out.length - 1].length < 4) out[out.length - 1].push(cur[0]); else out.push(cur); }
      const ch = out.map((ix, j) => ({ ix, t0: ws[ix[0]].t0 - .06, t1: j + 1 < out.length ? ws[out[j + 1][0]].t0 - .06 : sh.end + .15 }));
      return (R._islKT[k] = { key, ws, ch });
    }
    function ktCap(c, t, fw, fh, u) {
      fw = fw || W; fh = fh || H; u = u || 1;
      const R = this, k = R.shotAt(t), sh = R.tl.shots[k]; if (!sh) return;
      const sc = R.story.scenes[sh.si]; if (sc.type !== 'story') return; const ln = sc.lines[sh.li]; if (!ln || (ln.card && ln.card.type === 'statement')) return;
      const D = chunksOf(R, k), chk = D.ch.find(x => t >= x.t0 && t < x.t1); if (!chk) return;
      const words = D.ws, land = fw > fh, hook = sh.si === R.firstStory && sh.li === 0, S0 = R.settings;
      let size = (land ? 74 : 94) * u * (hook ? 1.12 : 1) * Math.max(.75, Math.min(1.4, (S0.capSize || 58) / 58)); const padX = 30 * u, maxW = fw * (land ? .78 : .92);
      const meas = sz => { c.font = `800 ${sz}px ${FONT_BN}, ${FONT_FALLBACK}`; const sp = c.measureText(' ').width * .9; const ws = chk.ix.map(i => c.measureText(words[i].w).width); return { sp, ws, tot: ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1) }; };
      let M = meas(size); while (M.tot > maxW - padX * 2 && size > 34 * u) { size -= 3 * u; M = meas(size); }
      const bw = M.tot + padX * 2, bh = size * 1.6, bx = (fw - bw) / 2;
      // people are drawn head to toe now, so the line sits ABOVE them; scenes without people use the lower third / middle
      let by; const people = sc.cast && sc.cast.length;
      if (people) by = (land ? 120 : 250) * u; else { const spot = hook ? 'mid' : ['bot', 'mid', 'bot', 'top'][(k * 5 + 3) % 4]; by = spot === 'mid' ? fh * .5 - bh / 2 : spot === 'top' ? (land ? 120 : 250) * u : fh - bh - (land ? 80 : 300) * u; }
      const lt = t - chk.t0, e0 = eo(cl(lt / .14)), out = cl((chk.t1 + .02 - t) / .08);
      c.save(); c.globalAlpha *= e0 * out;
      if (ln.speak && ln.who && R.chars[ln.who]) { const nm = R.chars[ln.who].ch.name, q = land ? 1 : 1.3; c.font = `700 ${30 * u * q}px ${FONT_BN}, ${FONT_FALLBACK}`; const nw = c.measureText(nm).width + 28 * u * q; rr(c, bx, by - 48 * u * q, nw, 42 * u * q, 6 * u, 'rgba(242,193,78,.96)'); txt(c, nm, bx + 14 * u * q, by - 16 * u * q, 30 * u * q, '#1A1405', 700, 'left', FONT_BN); }
      const sIdx = ktStyleOf(R, k, D.ch.indexOf(chk), kk => chunksOf(R, kk).ch);
      ktPaint(c, { t, ch: chk, words, M, size, u, bx, by, bw, bh, padX, y: by + bh * .68, font: sz => `800 ${sz}px ${FONT_BN}, ${FONT_FALLBACK}`, pal: { dark: 'rgba(10,26,20,.84)', stroke: 'rgba(233,196,106,.55)', bar: 'rgba(233,196,106,.9)', key: '#FFC93C' }, style: sIdx });
      c.restore();
    }
    RP.drawCaption = function (c, t, fw, fh, u) { if ((this.settings.capLook || 'islamic') === 'longkt') return ktCap.call(this, c, t, fw, fh, u); return _cap.call(this, c, t, fw, fh, u); };
    // first time: make the new look the default (the old "ইসলামিক ক্লাসিক" stays in the list)
    try { if (!localStorage.getItem('tf_isl_v4')) { S.capLook = 'longkt'; saveSettings(); localStorage.setItem('tf_isl_v4', '1'); } } catch (e) { }
  }


  /* =========================================================================================
     5. THUMBNAIL — the scene inside a mihrab arch with noor light, gold ornaments, a curiosity strap and a huge headline
     ========================================================================================= */
  const PAL = { 'সবুজ-সোনালি': ['#0D4430', '#041A11', '#F2C14E'], 'রাতের নীল': ['#14295A', '#050B1E', '#9FD3FF'], 'পুরোনো পার্চমেন্ট': ['#58361A', '#1E1008', '#FFC46B'], 'কাচের কালো': ['#1A1A1A', '#050505', '#F2C14E'], 'ভোরের আলো': ['#86331F', '#2B100A', '#FFB38A'], 'পান্না': ['#0B5442', '#031B15', '#E9C46A'] };
  function star8(c, x, y, r) { c.beginPath(); for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8 - Math.PI / 2, rr0 = k % 2 ? r * .62 : r; k ? c.lineTo(x + Math.cos(a) * rr0, y + Math.sin(a) * rr0) : c.moveTo(x + Math.cos(a) * rr0, y + Math.sin(a) * rr0); } c.closePath(); }
  function archPath(x0, x1, yTop, yBot, shoulder) { const m = (x0 + x1) / 2, w = x1 - x0; return `M${x0},${yBot} L${x0},${shoulder} C${x0},${shoulder - w * .26} ${x0 + w * .24},${yTop + (shoulder - yTop) * .42} ${m},${yTop} C${x1 - w * .24},${yTop + (shoulder - yTop) * .42} ${x1},${shoulder - w * .26} ${x1},${shoulder} L${x1},${yBot}Z`; }
  function patchCover(A) {
    const _dc = drawCover;
    function pickShot(st, tl) { return A.pickCoverShot ? A.pickCoverShot(st, tl) : { si: 0, t: 0 }; }
    drawCover = function (c, R, k) { const key = k || S.coverTheme; if (key === 'islamic') return coverIsl(c, R); if (key === 'islamic_classic' && A.drawCoverClassic) return A.drawCoverClassic(c, R); return _dc(c, R, k); };
    function coverIsl(c, R) {
      const st = R.story, tl = R.tl; if (!st || !tl) return; const d = coverData(st), Sx = (typeof S !== 'undefined' ? S : {}), cp = coverCopy(st, d, 'isl');
      const V = A.getVar(), pal = PAL[V.name] || PAL['সবুজ-সোনালি'], gold = pal[2], P0 = pickShot(st, tl), sc = st.scenes[P0.si] || {}, people = (sc.cast || []).length;
      c.save();
      // background: deep colour, khatam star lattice, vignette
      const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, pal[0]); bg.addColorStop(1, pal[1]); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.save(); c.globalAlpha = .07; c.strokeStyle = gold; c.lineWidth = 2.4; for (let y = 0, r = 0; y < H + 120; y += 120, r++) for (let x = (r % 2) * 60; x < W + 120; x += 120) { star8(c, x, y, 54); c.stroke(); } c.restore();
      const vg = c.createRadialGradient(540, 700, 260, 540, 960, 1300); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
      // the arch window with the scene
      const AX0 = 90, AX1 = 990, AY = 215, AB = 1090, SH = 640, ap = archPath(AX0, AX1, AY, AB, SH), p2 = P2(ap);
      c.save(); c.shadowColor = gold; c.shadowBlur = 60; c.fillStyle = pal[1]; c.fill(p2); c.restore();
      const off = document.createElement('canvas'); off.width = W; off.height = H; const oc = off.getContext('2d', { alpha: false });
      R._camOverride = clampCam({ x: 540, y: people ? 1260 : 1010, z: people ? 1.0 : 1.12 }); try { R.drawScene(oc, P0.si, P0.t); } catch (e) { rect(oc, 0, 0, W, H, pal[0]); } R._camOverride = null;
      c.save(); c.clip(p2); const sy = people ? 760 : 560; c.filter = 'saturate(1.25) contrast(1.08)'; c.drawImage(off, 0, sy, 1080, 1045, AX0, AY, AX1 - AX0, AB - AY); c.filter = 'none';
      c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = V.grade; c.fillRect(AX0, AY, AX1 - AX0, AB - AY); c.restore();
      c.save(); c.globalCompositeOperation = 'screen'; covRays(c, 540, AY - 20, 12, 1300, 'rgba(255,236,170,A)', .2, Math.PI / 2 - .55); c.restore();
      const ag = c.createLinearGradient(0, AY, 0, AB); ag.addColorStop(0, 'rgba(0,0,0,.28)'); ag.addColorStop(.5, 'rgba(0,0,0,0)'); ag.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = ag; c.fillRect(AX0, AY, AX1 - AX0, AB - AY); c.restore();
      // gold double border + apex crescent and star
      c.save(); c.strokeStyle = gold; c.lineWidth = 12; c.shadowColor = gold; c.shadowBlur = 22; c.stroke(p2); c.shadowColor = 'transparent';
      c.lineWidth = 3; c.globalAlpha = .8; c.save(); c.translate(540, (AY + AB) / 2); c.scale(.93, .94); c.translate(-540, -(AY + AB) / 2 + 12); c.stroke(P2(ap)); c.restore(); c.restore();
      c.save(); c.translate(540, AY - 34); c.fillStyle = gold; c.shadowColor = gold; c.shadowBlur = 26; c.beginPath(); c.arc(0, 0, 34, 0, 7); c.clip(); c.beginPath(); c.rect(-40, -40, 80, 80); c.arc(14, -6, 30, 0, 7, true); c.fill('evenodd'); c.restore();
      c.save(); c.fillStyle = gold; star8(c, 584, AY - 52, 13); c.fill(); c.restore();
      // top: source badge + logo
      const ay = st.scenes.find(x => x.type === 'ayah'), isQ = ay ? !/বুখারি|হাদিস|মুসলিম|তিরমিজি|মাজাহ|মুফরাদ/.test(ay.ref || '') : true, badge = isQ ? 'কুরআনের আলোয়' : 'হাদিসের আলোয়';
      c.save(); c.font = `400 44px TFGalada, ${FONT_FALLBACK}`; const bw = c.measureText(badge).width + 74; c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 16; rr(c, 70, 70, bw, 78, 39, V.badge); c.shadowColor = 'transparent'; rr(c, 77, 77, bw - 14, 64, 32, null, gold, 3); txt(c, badge, 70 + bw / 2, 124, 44, '#F6E6B0', 400, 'center', 'TFGalada'); c.restore();
      if (Sx.watermark !== false) { c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 14; drawLogo(c, W - 118, 112, 92, Sx.logo || 'প্র'); c.restore(); }
      // sticker over the arch's lower corner, strap, headline, button
      covChip(c, cp.sticker, 330, AB - 36, 44, gold, '#1A1405', -.05, 'rgba(60,40,0,.4)');
      let y = AB + 52; if (cp.strap) { c.save(); c.font = `800 44px ${FONT_BN}, ${FONT_FALLBACK}`; const sw = Math.min(W - 80, c.measureText('“' + cp.strap + '”').width + 90); rr(c, 540 - sw / 2, y, sw, 86, 43, 'rgba(0,0,0,.35)', gold, 3); richLine(c, '“' + cp.strap + '”', 540, y + 57, 44, sw - 60, '#FFF6DE', gold, FONT_BN, 800); c.restore(); y += 112; }
      const bot = covHeadline(c, cp.lines, 540, y, { font: V.font, weight: 700, size: 150, minSize: 70, maxW: 940, maxH: 1620 - y, mode: 'gold', hi: V.hookHi, hiTop: '#FFF7CE', hiBot: gold, glow: 'rgba(255,200,80,.65)', stroke: 'rgba(3,16,10,.96)', lh: 1.2 });
      // ornamental divider + button
      const dy = Math.min(Math.max(bot + 30, 1560), 1660); c.save(); c.strokeStyle = gold; c.lineWidth = 3; c.globalAlpha = .85; line(c, 250, dy, 500, dy, gold, 3); line(c, 580, dy, 830, dy, gold, 3); c.fillStyle = gold; star8(c, 540, dy, 18); c.fill(); c.restore();
      covCTA(c, cp.cta, 540, dy + 110, 50, gold, '#1A1405', 'rgba(60,40,0,.45)');
      c.restore();
    }
  }

  /* =========================================================================================
     5b. THUMBNAIL "প্রতীক ফ্রেম" — no people at all: one big Islamic symbol (Kaaba / mosque / Quran / lantern / crescent)
         in a glowing gold medallion, an ornamental gold frame around the whole card and a huge hook headline.
     ========================================================================================= */
  const SYM_RULES = [
    ['kaaba', /কাবা|কা'বা|হজ্জ?|ওমরা|মক্কা|তাওয়াফ|হাজরে|kaaba|hajj|umrah/i],
    ['mosque', /মসজিদ|নামাজ|সালাত|আজান|জামাত|জামা'আত|ইমাম|মিম্বর|জুমা|মিনার|mosque|masjid|salah|azan/i],
    ['lantern', /রমজান|রমাদান|রোজা|ইফতার|সেহরি|তারাবি|কদর|ঈদ|ramadan|iftar|sehri|eid/i],
    ['quran', /কুরআন|কোরআন|আয়াত|সূরা|তিলাওয়াত|হাফেজ|quran/i]
  ];
  function pickSymbol(st) {
    const ov = st.cover && st.cover.symbol; if (ov && SYMS[ov]) return ov;
    const bag = []; const add = (s, w) => { if (s) bag.push([String(s), w]); };
    add(st.title, 4); add(st.thumb, 4); if (st.cover) add([st.cover.l1, st.cover.l2, st.cover.ctx].join(' '), 4);
    (st.scenes || []).forEach(sc => { add(sc.place, 1); add(sc.ref, 1); (sc.lines || []).forEach(l => add(l.cap || l.text, 1)); });
    let best = 'crescent', bs = 0;
    SYM_RULES.forEach(([k, re]) => { const g = new RegExp(re.source, 'gi'); let s = 0; bag.forEach(([t, w]) => { s += (t.match(g) || []).length * w; }); if (s > bs) { bs = s; best = k; } });
    return best;
  }
  function star5(c, x, y, r, rot) { c.beginPath(); for (let k = 0; k < 10; k++) { const a = (rot || 0) + k * Math.PI / 5 - Math.PI / 2, q = k % 2 ? r * .42 : r; k ? c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : c.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); }
  function miniCrescent(c, x, y, r, fill) { c.save(); c.translate(x, y); c.fillStyle = fill; c.beginPath(); c.arc(0, 0, r, 0, 7); c.clip(); c.beginPath(); c.rect(-r * 2, -r * 2, r * 4, r * 4); c.arc(r * .55, -r * .25, r * .84, 0, 7, true); c.fill('evenodd'); c.restore(); }
  /* every symbol is drawn around (0,0) inside a box of about ±250; g = { gold, grad(y0,y1) }, pal = palette */
  const SYMS = {
    crescent(c, g, pal) {
      c.save(); c.translate(-30, 0); c.shadowColor = g.gold; c.shadowBlur = 30; c.fillStyle = g.grad(-215, 215);
      c.save(); c.beginPath(); c.arc(0, 0, 215, 0, 7); c.clip(); c.beginPath(); c.rect(-300, -300, 600, 600); c.arc(82, -26, 184, 0, 7, true); c.fill('evenodd'); c.restore();
      c.fillStyle = g.grad(-100, 60); star5(c, 130, -26, 68, .2); c.fill(); c.restore();
    },
    mosque(c, g, pal) {
      const gr = g.grad(-210, 200); c.save(); c.shadowColor = g.gold; c.shadowBlur = 24;
      [-1, 1].forEach(s => { const x = s * 172; rr(c, x - 19, -70, 38, 260, 4, gr); rr(c, x - 31, -82, 62, 16, 6, gr); P(c, `M${x - 21},-82 L${x},-196 L${x + 21},-82Z`, gr); circ(c, x, -204, 7, gr); });
      rr(c, -135, 70, 270, 120, 6, gr); P(c, 'M-125,72 C-125,-52 -62,-112 0,-112 C62,-112 125,-52 125,72Z', gr);
      line(c, 0, -112, 0, -164, g.gold, 8); miniCrescent(c, -4, -190, 34, g.gold); c.restore();
      line(c, -125, 72, 125, 72, 'rgba(0,0,0,.3)', 5);
      P(c, archPath(-38, 38, 108, 190, 140), pal[1]);
      [-108, -62, 62, 108].forEach(x => P(c, archPath(x - 15, x + 15, 100, 160, 120), '#FFE7A0'));
      [-40, 0, 40].forEach(x => P(c, archPath(x - 11, x + 11, -44, 20, -22), '#FFE7A0'));
    },
    kaaba(c, g, pal) {
      c.save(); for (let i = 0; i < 4; i++) ell(c, 0, 172, 150 + i * 38, 34 + i * 9, null, `rgba(255,240,200,${.4 - i * .09})`, 4); c.restore();
      const fg = c.createLinearGradient(0, -60, 0, 170); fg.addColorStop(0, '#2E2E2E'); fg.addColorStop(1, '#0A0A0A');
      c.save(); c.shadowColor = g.gold; c.shadowBlur = 28;
      P(c, 'M-150,-60 L50,-60 L165,-105 L-35,-105Z', '#3C3C3C', g.gold, 5);
      P(c, 'M-150,-60 L50,-60 L50,170 L-150,170Z', fg, g.gold, 5);
      P(c, 'M50,-60 L165,-105 L165,125 L50,170Z', '#121212', g.gold, 5); c.restore();
      P(c, 'M-150,-18 L50,-18 L50,26 L-150,26Z', g.grad(-18, 26)); P(c, 'M50,-18 L165,-63 L165,-19 L50,26Z', g.grad(-60, 26));
      for (let i = 0; i < 9; i++) rr(c, -140 + i * 21, -8, 11, 24, 3, 'rgba(90,50,0,.55)');
      P(c, archPath(-104, -34, 62, 170, 100), g.grad(62, 170)); P(c, archPath(-92, -46, 80, 170, 108), 'rgba(60,30,0,.55)');
    },
    quran(c, g, pal) {
      c.save(); c.globalCompositeOperation = 'screen'; covRays(c, 0, 10, 12, 310, 'rgba(255,236,170,A)', .4, .1); c.restore();
      c.save(); c.shadowColor = g.gold; c.shadowBlur = 36; c.fillStyle = g.grad(-230, -70); star8(c, 0, -150, 80); c.fill(); c.restore();
      star8(c, 0, -150, 46); c.fillStyle = 'rgba(255,255,255,.4)'; c.fill();
      P(c, 'M-100,198 L100,198 L66,252 L-66,252Z', g.grad(198, 252));
      c.save(); c.shadowColor = g.gold; c.shadowBlur = 20; P(c, 'M-176,52 C-110,26 -48,32 0,62 C48,32 110,26 176,52 L176,194 C110,170 48,176 0,212 C-48,176 -110,170 -176,194Z', '#0E5B3B', g.gold, 5); c.restore();
      const pg = c.createLinearGradient(0, 40, 0, 200); pg.addColorStop(0, '#FFF9E8'); pg.addColorStop(1, '#EBD9A8');
      P(c, 'M-6,56 C-56,24 -116,22 -162,40 L-162,176 C-116,158 -56,160 -6,200Z', pg); P(c, 'M6,56 C56,24 116,22 162,40 L162,176 C116,158 56,160 6,200Z', pg);
      for (let i = 0; i < 6; i++) { const y = 78 + i * 18, e = i === 5 ? 70 : 0; line(c, -146, y, -26 - e, y + 6, i === 0 ? '#B8860B' : 'rgba(90,60,20,.55)', i === 0 ? 6 : 4); line(c, 26 + e, y + 6, 146, y, i === 0 ? '#B8860B' : 'rgba(90,60,20,.55)', i === 0 ? 6 : 4); }
      line(c, 0, 62, 0, 208, g.gold, 5);
    },
    lantern(c, g, pal) {
      const gl = c.createRadialGradient(0, 0, 10, 0, 0, 250); gl.addColorStop(0, 'rgba(255,214,120,.55)'); gl.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = gl; c.fillRect(-260, -260, 520, 520);
      const gr = g.grad(-230, 240); line(c, 0, -262, 0, -222, g.gold, 6); circ(c, 0, -264, 9, null, g.gold, 5);
      c.save(); c.shadowColor = g.gold; c.shadowBlur = 22;
      P(c, 'M-78,-168 L-34,-222 L34,-222 L78,-168Z', gr); rr(c, -88, -170, 176, 26, 8, gr);
      const bg = c.createRadialGradient(0, 0, 10, 0, 0, 150); bg.addColorStop(0, '#FFF4C2'); bg.addColorStop(.6, '#FFC857'); bg.addColorStop(1, '#E08A1E');
      P(c, 'M-84,-144 L-112,10 L-84,150 L84,150 L112,10 L84,-144Z', bg, g.gold, 6); c.restore();
      [-40, 40].forEach(x => P(c, `M${x},-144 Q${x * 1.3},10 ${x},150`, null, '#8A4B0E', 5)); [-60, 70].forEach(y => line(c, -96, y, 96, y, '#8A4B0E', 5));
      star8(c, 0, 4, 52); c.fillStyle = '#B5540F'; c.fill(); star8(c, 0, 4, 28); c.fillStyle = '#FFE9A0'; c.fill();
      c.save(); c.shadowColor = g.gold; c.shadowBlur = 18; rr(c, -92, 150, 184, 24, 8, gr); P(c, 'M-92,174 L-44,226 L44,226 L92,174Z', gr); circ(c, 0, 240, 13, gr); c.restore();
    }
  };
  function patchCoverSymbol(A) {
    const _dc = drawCover;
    drawCover = function (c, R, k) { const key = k || S.coverTheme; if (key === 'islamic_sym') return coverSym(c, R, 'mix'); if (key === 'islamic_scene') return coverSym(c, R, 'scene'); if (key === 'islamic_pattern') return coverSym(c, R, 'pattern'); return _dc(c, R, k); };
    try { if (!localStorage.getItem('tf_isl_v6')) { S.coverTheme = 'islamic_sym'; S.coverFirstFrame = true; saveSettings(); localStorage.setItem('tf_isl_v6', '1'); } } catch (e) { }
    const hashS = s => { let h = 2166136261; s = String(s || ''); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    /* two kinds of cover, mixed by the story and the "change style" button: 'scene' = the most striking moment of the video with the words on it,
       'pattern' = an Islamic pattern with the words on it. The symbol is only a small corner medal. Words stay inside the middle band so
       Facebook / YouTube / Reels crops still show them. Fonts: only the bold, eye-catching ones (TFDisp / TFCap / TFSerif). */
    function coverSym(c, R, mode) { const st = R.story; if (!st || !R.tl) return; const old = FONT_BN; try { drawSymCover(c, R, mode); } finally { FONT_BN = old; } }
    function drawSymCover(c, R, mode) {
      const st = R.story, d = coverData(st), Sx = (typeof S !== 'undefined' ? S : {}), cp = coverCopy(st, d, 'isl');
      const V = A.getVar(), pal = PAL[V.name] || PAL['সবুজ-সোনালি'], gold = '#F2C14E', sym = pickSymbol(st);
      const vi = Math.max(0, Object.keys(PAL).indexOf(V.name)), h = hashS(st.title || d.l1 || '');
      const fam = ['TFDisp', 'TFDisp', 'TFCap', 'TFSerif'][(h >> 7) % 4], FW = fam === 'TFDisp' ? 800 : 700; FONT_BN = fam;
      const kind = mode === 'scene' ? 'scene' : mode === 'pattern' ? 'pattern' : (((h >> 2) + vi) % 2 ? 'scene' : 'pattern');
      const LAY = kind === 'scene' ? ['B', 'C'] : ['A', 'B', 'C']; let lay = LAY[((h >> 4) + vi) % LAY.length]; if (lay === 'B' && cp.lines.length < 2) lay = kind === 'scene' ? 'C' : 'A';
      const patt = ((h >> 9) + vi) % 3, left = ((h >> 11) + vi) % 2 === 0; // symbol corner: top-left or top-right
      const g = { gold, grad: (y0, y1) => { const q = c.createLinearGradient(0, y0, 0, y1); q.addColorStop(0, '#FFF3B8'); q.addColorStop(.5, gold); q.addColorStop(1, '#A8691A'); return q; } };
      c.save();
      // ---- background
      const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, pal[0]); bg.addColorStop(1, pal[1]); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      if (kind === 'scene') {
        const P0 = A.pickCoverShot(st, R.tl), sc = st.scenes[P0.si] || {}, people = (sc.cast || []).length;
        const off = document.createElement('canvas'); off.width = W; off.height = H; const oc = off.getContext('2d', { alpha: false });
        R._camOverride = clampCam({ x: 540, y: people ? 1160 : 1000, z: people ? 1.18 : 1.1 }); try { R.drawScene(oc, P0.si, P0.t); } catch (e) { rect(oc, 0, 0, W, H, pal[0]); } R._camOverride = null;
        c.filter = 'saturate(1.25) contrast(1.08)'; c.drawImage(off, 0, 0, W, H); c.filter = 'none';
        c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = V.grade; c.fillRect(0, 0, W, H); c.restore();
        const dk = pal[1].replace('#', ''), rgb = [0, 2, 4].map(i => parseInt(dk.substr(i, 2), 16)).join(',');
        const sh = c.createLinearGradient(0, 0, 0, H);
        if (lay === 'B') { sh.addColorStop(0, `rgba(${rgb},.88)`); sh.addColorStop(.26, `rgba(${rgb},.55)`); sh.addColorStop(.4, `rgba(${rgb},0)`); sh.addColorStop(.58, `rgba(${rgb},0)`); sh.addColorStop(.74, `rgba(${rgb},.78)`); sh.addColorStop(1, `rgba(${rgb},.94)`); }
        else { sh.addColorStop(0, `rgba(${rgb},.7)`); sh.addColorStop(.16, `rgba(${rgb},0)`); sh.addColorStop(.42, `rgba(${rgb},.12)`); sh.addColorStop(.6, `rgba(${rgb},.8)`); sh.addColorStop(1, `rgba(${rgb},.95)`); }
        c.fillStyle = sh; c.fillRect(0, 0, W, H);
      } else {
        c.save(); c.globalAlpha = .1; c.strokeStyle = gold; c.lineWidth = 2.6;
        if (patt === 0) { for (let y = 0, r = 0; y < H + 120; y += 120, r++) for (let x = (r % 2) * 60; x < W + 120; x += 120) { star8(c, x, y, 54); c.stroke(); } }
        else if (patt === 1) { for (let y = 40, r = 0; y < H + 200; y += 150, r++) for (let x = (r % 2) * 80 - 80; x < W + 160; x += 160) { c.stroke(P2(archPath(x, x + 160, y, y + 150, y + 70))); } }
        else { for (let y = -20, r = 0; y < H + 120; y += 78, r++) for (let x = (r % 2) * 90 - 90; x < W + 180; x += 180) { c.beginPath(); c.arc(x, y, 90, 0, 7); c.stroke(); } }
        c.restore();
        const gl = c.createRadialGradient(540, 900, 80, 540, 900, 860); gl.addColorStop(0, 'rgba(255,214,120,.34)'); gl.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = gl; c.fillRect(0, 0, W, H);
        c.save(); c.globalCompositeOperation = 'screen'; covRays(c, 540, 900, 18, 1600, 'rgba(255,230,160,A)', .12, .12 + vi); c.restore();
      }
      const vg = c.createRadialGradient(540, 900, 420, 540, 960, 1300); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
      // ---- big faint symbol behind the words (pattern cover only)
      const symAt = (cx, cy, k, a) => { c.save(); c.globalAlpha = a; c.translate(cx, cy); c.scale(k, k); try { SYMS[sym](c, g, pal); } catch (e) { } c.restore(); };
      if (kind === 'pattern') symAt(540, lay === 'A' ? 930 : lay === 'B' ? 790 : 560, lay === 'A' ? 1.9 : 1.5, .13);
      // ---- ornamental frame
      c.save(); c.strokeStyle = gold; c.shadowColor = gold; c.shadowBlur = 18; c.lineWidth = 9; c.beginPath(); c.roundRect(40, 40, W - 80, H - 80, 46); c.stroke(); c.shadowBlur = 0; c.lineWidth = 3; c.globalAlpha = .8; c.beginPath(); c.roundRect(68, 68, W - 136, H - 136, 30); c.stroke(); c.restore();
      [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]].forEach(([x, y]) => { circ(c, x, y, 36, pal[0], gold, 4); c.save(); c.fillStyle = gold; star8(c, x, y, 25); c.fill(); c.restore(); });
      [[540, 40], [540, H - 40], [40, H / 2], [W - 40, H / 2]].forEach(([x, y]) => { circ(c, x, y, 24, pal[1], gold, 3); c.save(); c.fillStyle = gold; star8(c, x, y, 17); c.fill(); c.restore(); });
      // ---- corner medal with the symbol, source badge on the other side, logo at the bottom
      const mr = 112, mx = left ? 190 : W - 190, my = 214;
      c.save(); c.shadowColor = gold; c.shadowBlur = 36; circ(c, mx, my, mr, pal[1]); c.restore(); circ(c, mx, my, mr, pal[0]);
      c.save(); c.shadowColor = gold; c.shadowBlur = 16; circ(c, mx, my, mr, null, gold, 8); c.restore(); circ(c, mx, my, mr * .86, null, gold, 2.5);
      c.save(); c.translate(mx, my); c.scale(.95 * mr / 300, .95 * mr / 300); try { SYMS[sym](c, g, pal); } catch (e) { console.warn('symbol', sym, e); } c.restore();
      const ay = (st.scenes || []).find(x => x.type === 'ayah'), isQ = ay ? !/বুখারি|হাদিস|মুসলিম|তিরমিজি|মাজাহ|মুফরাদ/.test(ay.ref || '') : true, badge = isQ ? 'কুরআনের আলোয়' : 'হাদিসের আলোয়';
      c.save(); c.font = `700 42px ${fam}, ${FONT_FALLBACK}`; const bw = c.measureText(badge).width + 70, bx = left ? W - 104 - bw : 104; c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 16; rr(c, bx, 168, bw, 74, 37, V.badge); c.shadowColor = 'transparent'; rr(c, bx + 6, 174, bw - 12, 62, 31, null, gold, 3); txt(c, badge, bx + bw / 2, 219, 42, '#F6E6B0', 700, 'center', fam); c.restore();
      if (Sx.watermark !== false) { c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 14; drawLogo(c, left ? W - 140 : 140, 1760, 92, Sx.logo || 'প্র'); c.restore(); }
      // ---- words
      const hb = (lines, y, o) => covHeadline(c, lines, 540, y, Object.assign({ font: fam, weight: FW, maxW: 920, mode: 'gold', hi: V.hookHi, hiTop: '#FFF7CE', hiBot: gold, glow: 'rgba(255,200,80,.6)', stroke: 'rgba(3,12,8,.97)', strokeK: .2, lh: 1.14 }, o));
      const dry = (lines, o) => covHeadline(document.createElement('canvas').getContext('2d'), lines, 540, 0, Object.assign({ font: fam, weight: FW, maxW: 920, mode: o.mode || 'gold', lh: 1.14 }, o));
      const strapAt = y => { if (!cp.strap) return 0; c.save(); c.font = `700 46px ${fam}, ${FONT_FALLBACK}`; const sw = Math.min(W - 150, c.measureText('“' + cp.strap + '”').width + 90); rr(c, 540 - sw / 2, y, sw, 90, 45, 'rgba(0,0,0,.55)', gold, 3); richLine(c, '“' + cp.strap + '”', 540, y + 60, 46, sw - 60, '#FFF6DE', gold, fam, 700); c.restore(); return 112; };
      const cta = y => covCTA(c, cp.cta, 540, y, 50, gold, '#1A1405', 'rgba(60,40,0,.45)');
      if (lay === 'A') { // everything centred in the middle band
        const sh0 = cp.strap ? 112 : 0, o = { size: 176, minSize: 80, maxH: 860 }, hgt = dry(cp.lines, o), blk = sh0 + hgt + 190, top = Math.max(360, 960 - blk / 2 + 20);
        const y1 = top + strapAt(top); const bot = hb(cp.lines, y1, o);
        covChip(c, cp.sticker, 540, bot + 60, 46, gold, '#1A1405', -.04, 'rgba(60,40,0,.4)'); cta(bot + 180);
      } else if (lay === 'B') { // first line high, the punch line big and low, the picture / pattern in between
        const top = hb([cp.lines[0]], 360, { size: 150, minSize: 70, maxH: 260 });
        covChip(c, cp.sticker, 540, top + 62, 44, gold, '#1A1405', -.03, 'rgba(60,40,0,.4)');
        const rest = cp.lines.slice(1), o = { size: 180, minSize: 80, maxH: kind === 'scene' ? 400 : 560, mode: 'box', boxFill: V.ribbon, boxLine: gold, boxText: '#fff', strokeK: .17 }, hgt = dry(rest, o), yb = Math.max(kind === 'scene' ? 1040 : 900, 1440 - hgt);
        hb(rest, yb, o); cta(1590);
      } else { // headline in the lower part, picture / pattern above
        const base = kind === 'scene' ? 1050 : 860, st0 = strapAt(base); covChip(c, cp.sticker, left ? 340 : W - 340, base - 62, 44, gold, '#1A1405', left ? -.05 : .05, 'rgba(60,40,0,.4)');
        const bot = hb(cp.lines, base + st0, { size: 178, minSize: 80, maxH: 1500 - base - st0 }); cta(Math.min(1620, Math.max(bot + 90, 1540)));
      }
      c.restore();
    }
  }

  function domTweaks() {
    const ct = $('coverTheme');
    if (ct && !ct.querySelector('option[value="islamic_sym"]')) { ct.prepend(el('option', { value: 'islamic_pattern', text: 'ইসলামিক নকশা + বড় লেখা (কোণে ছোট প্রতীক)' })); ct.prepend(el('option', { value: 'islamic_scene', text: 'ভিডিওর সেরা দৃশ্য + বড় লেখা (কোণে ছোট প্রতীক)' })); ct.prepend(el('option', { value: 'islamic_sym', text: 'ইসলামিক মিক্স (দৃশ্য ও নকশা পালা করে, স্টাইল বদলালে বদলায়)' })); }
    if (ct) ct.value = S.coverTheme || 'islamic_sym';
    if (ct) { const o = ct.querySelector('option[value="islamic"]'); if (o) o.textContent = 'ইসলামিক খিলান (মিহরাব ফ্রেম + কৌতূহলী হেডলাইন)'; if (!ct.querySelector('option[value="islamic_classic"]')) ct.append(el('option', { value: 'islamic_classic', text: 'ইসলামিক আগের ধাঁচ (পূর্ণ ছবি + নিচে লেখা)' })); ct.value = S.coverTheme || 'islamic'; }
    const sel = $('sCapLook');
    if (sel && !sel.querySelector('option[value="longkt"]')) { sel.prepend(el('option', { value: 'longkt', text: 'লং ভিডিও স্টাইল (বড় শব্দ, একটা একটা করে, সোনালি হাইলাইট)' })); sel.value = S.capLook || 'longkt'; }
  }
})();
