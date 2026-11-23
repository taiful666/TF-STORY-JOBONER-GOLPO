/* TF Story Studio — লাইব্রেরি স্টুডিও (every library: story short/long, Islamic short/long/series, explainer).
   A card on top of the library: pick category + style + single (×N) or series (N parts) + length + topic + own
   instructions → a ready prompt for Gemini / ChatGPT / Claude (shown live, one tap to copy). The AI's answer is pasted
   back here and lands in THIS section's library: singles as stories, a series as one series (Islamic long) or as
   numbered parts (other sections). The base prompt is each section's own prompt, so quality rules stay the same.
   Answer format: TF Script code blocks ("=== …"); a series adds "ধারাবাহিক: <name> | মোট পর্ব: N" and per part
   "=== <name> | পর্ব k: <part name>" + "সারাংশ: …". JSON ({stories:[…]} / {series:{title,parts:[{script}]}}) also works. */
(function () {
  'use strict';
  if (typeof S === 'undefined' || typeof el !== 'function') return;
  const $ = id => document.getElementById(id);
  const BNUM = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  const toNum = s => +String(s).replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));

  /* ---------- which library is on screen ---------- */
  function section() {
    if (typeof TF_EXP !== 'undefined' && TF_EXP) return 'exp';
    const L = isLongMode();
    if (typeof TF_ISL !== 'undefined' && TF_ISL) { if (!L) return 'isl_short'; if (S.islLongKind === 'series') return S.islSerLen === 'mid' ? 'isl_mid' : 'isl_big'; return 'isl_long'; }
    return L ? 'long' : 'short';
  }
  const ISLW = () => window.ISL_API || {}, ISLL = () => window.ISL_LONG || {};
  const EXP_CATS = ['ব্যবসার হিসাব', 'টাকা ও ব্যাংক', 'দাম ও বাজার', 'কোম্পানির উত্থান-পতন', 'প্রযুক্তি ও অ্যাপ', 'অর্থনীতি ও দেশ', 'বিজ্ঞান ও স্বাস্থ্য'];
  const ISL_LONG_CATS = () => ISLL().CATS || ['জীবন গঠনমূলক গল্প', 'কুরআনের ঘটনা', 'হাদিসের গল্প', 'নবীদের কাহিনি', 'সাহাবিদের জীবন', 'ইসলামের ইতিহাস'];
  const islStyles = () => [['auto', 'অটো (প্রতিবার ভিন্ন বর্ণনা)']].concat((ISLW().STYLES || []).map((x, i) => [String(i), x.replace(/^বর্ণনার ধরন:\s*/, '').split('—')[0].trim()]));
  const CFG = {
    short: { name: 'গল্প · শর্ট ভিডিও (রিলস)', cats: () => LIFE_AREAS, styles: () => [['twist', 'টুইস্ট গল্প'], ['classic', 'দুই অঙ্কের গল্প']], long: false, maxN: 10, defMin: 1 },
    long: { name: 'গল্প · লং ভিডিও', cats: () => LONG_TOPICS[(get().style) || S.longStyle || 'life'] || [], styles: () => Object.entries(LONG_STYLE_BN), long: true, maxN: 5, defMin: 10 },
    isl_short: { name: 'ইসলামিক · শর্ট ভিডিও', cats: () => ISLW().LIFE_TOPICS || [], styles: islStyles, long: false, maxN: 10, defMin: 1 },
    isl_long: { name: 'ইসলামিক · একক লং গল্প', cats: ISL_LONG_CATS, styles: islStyles, long: true, maxN: 5, defMin: 10 },
    isl_big: { name: 'ইসলামিক · বড় ধারাবাহিক', cats: ISL_LONG_CATS, styles: islStyles, long: true, maxN: 5, defMin: 8, series: true },
    isl_mid: { name: 'ইসলামিক · মাঝারি ধারাবাহিক (৩ পর্ব × ~৫ মিনিট)', cats: ISL_LONG_CATS, styles: islStyles, long: true, maxN: 5, defMin: 5, series: true, parts: 3 },
    exp: { name: 'এক্সপ্লেনার ভিডিও', cats: () => EXP_CATS, styles: () => [], long: true, maxN: 5, defMin: 8 }
  };
  /* remembered choices per section */
  const KEY = () => 'tf_xls_' + section();
  function get() { try { return JSON.parse(localStorage.getItem(KEY()) || '{}') || {}; } catch (e) { return {}; } }
  function put(o) { try { localStorage.setItem(KEY(), JSON.stringify(Object.assign(get(), o))); } catch (e) { } }

  /* ---------- the prompt ---------- */
  function opts() {
    const sec = section(), c = CFG[sec], g = get();
    const catSel = $('xlsCat').value, cat = catSel === '__own' ? $('xlsCatOwn').value.trim() : catSel;
    const series = c.series || $('xlsKind').dataset.v === 'series';
    return { sec, c, cat, style: $('xlsStyle').value, series, n: Math.max(1, +$('xlsN').value || 1), parts: Math.max(2, +$('xlsParts').value || c.parts || 3), mins: +$('xlsMin').value || c.defMin,
      topic: $('xlsTopic').value.trim(), own: $('xlsOwn').value.trim(), engage: $('xlsEngage').checked, g };
  }
  function basePrompt(o) {
    const topic = [o.topic, o.cat && o.sec !== 'isl_short' ? 'ক্যাটাগরি: ' + o.cat : ''].filter(Boolean).join(' — ');
    const one = o.series || o.n === 1;
    switch (o.sec) {
      case 'short': return buildStoryPrompt(promptOpts({ count: one ? 1 : o.n, topic, style: o.style, lesson: '', book: '', author: '' }));
      case 'long': { const lo = Object.assign(longOpts(), { longStyle: o.style || 'life', minutes: o.mins, topic, facts: '', link: '', book: '', author: '', lesson: '' }); return one ? buildLongPrompt(lo) : buildLongBulkPrompt(lo, o.n); }
      case 'exp': return window.EXP_PROMPT ? window.EXP_PROMPT(Object.assign(longOpts(), { minutes: o.mins, topic, facts: '', link: '' })) : buildLongPrompt(Object.assign(longOpts(), { minutes: o.mins, topic }));
      case 'isl_short': { const p = ISLW().buildLifePrompt ? ISLW().buildLifePrompt(o.cat || o.topic || 'আল্লাহর দিকে ফেরা', o.cat ? o.topic : '') : ''; return o.style && o.style !== 'auto' ? p.replace(/^- বর্ণনার ধরন:.*$/m, '') : p; }
      default: return ISLL().longPrompt ? ISLL().longPrompt({ cat: o.cat || ISL_LONG_CATS()[0], topic: o.topic, mins: o.mins, of: 1 }) : '';
    }
  }
  function stylePick(o) {
    if (!o.style || o.style === 'auto') return '';
    if (/^isl_/.test(o.sec)) { const x = (ISLW().STYLES || [])[+o.style]; return x ? `- ${x} (এই বর্ণনার ধরনই মানবে, অন্য কোনো ধরন নয়)` : ''; }
    const lab = (CFG[o.sec].styles().find(s => s[0] === o.style) || [])[1]; return lab ? `- গল্পের ধরন/স্টাইল: ${lab}` : '';
  }
  function buildPrompt() {
    const o = opts(), c = o.c, isl = /^isl_/.test(o.sec), lenTxt = c.long ? `প্রায় ${BNUM(o.mins)} মিনিট` : 'শর্ট ভিডিও (রিলস/শর্টস) মাপের';
    const pick = [
      o.cat ? `- ক্যাটাগরি/ক্ষেত্র: ${o.cat} (গল্প অবশ্যই এই ক্যাটাগরির ভেতরে থাকবে${c.long || o.sec === 'short' ? `; স্ক্রিপ্টে "ক্ষেত্র: ${o.cat}" লাইন থাকবে` : ''})` : '- ক্যাটাগরি: তুমি সবচেয়ে মানানসইটা বেছে নাও',
      stylePick(o), o.topic ? `- বিষয়/ভাবনা: ${o.topic}` : '',
      o.series ? `- কী লিখবে: একটা ধারাবাহিক, মোট ${BNUM(o.parts)} পর্ব, প্রতি পর্ব ${lenTxt}` : `- কী লিখবে: ${o.n > 1 ? BNUM(o.n) + 'টা আলাদা গল্প' : 'একটা গল্প'}, প্রতিটা ${lenTxt}`,
      o.own ? `- আমার বিশেষ নির্দেশ (সবচেয়ে বেশি গুরুত্ব দেবে): ${o.own}` : ''
    ].filter(Boolean).join('\n');
    const engage = o.engage ? `- দর্শক ধরে রাখো: শুরুতে কৌতূহল জাগানো প্রশ্ন (উত্তর শেষে), মাঝে অপ্রত্যাশিত টুইস্ট, শেষের আগে একটা ছোট কুইজ (ক/খ/গ, "কমেন্টে লিখুন"), আর শেষে কমেন্ট, লাইক, শেয়ার (কাকে শেয়ার করবে বলে দাও) ও সাবস্ক্রাইবের ছোট ছোট ডাক।` : '';
    let wrap = '';
    if (o.series) wrap = `## এটা একটা ধারাবাহিক — একসাথে ${BNUM(o.parts)}টা পর্ব লিখবে (সবচেয়ে জরুরি নিয়ম)
- আগে মনে মনে পুরো কাহিনির পরিকল্পনা করো: একটাই গল্প, শুরু থেকে শেষ, ${BNUM(o.parts)} ভাগে। প্রতিটা পর্বে নিজের একটা মোড়।
- ধারাবাহিকের একটা নাম ঠিক করো (৩-৭ শব্দ)। প্রথম কোড ব্লকের একদম প্রথম লাইনে হুবহু লিখবে: "ধারাবাহিক: <নাম> | মোট পর্ব: ${BNUM(o.parts)}"
- প্রতিটা পর্ব আলাদা কোড ব্লকে, আলাদা পূর্ণ স্ক্রিপ্ট (নিচের পূর্ণ নির্দেশ মেনে), দৈর্ঘ্য প্রতি পর্ব ${lenTxt}।
- প্রতিটা পর্বের শিরোনাম হুবহু: "=== <ধারাবাহিকের নাম> | পর্ব ১: <পর্বের নাম>" (পর্ব ২, পর্ব ৩ …)। ঠিক তার পরের লাইনে "সারাংশ: <এই পর্বে কী ঘটে, এক বাক্যে>"।
- সব পর্বে একই চরিত্র: একই কোড, একই নাম, একই ধরন (role)। পরের পর্বে নতুন চরিত্র যোগ হতে পারে, পুরোনোটা বদলাবে না।
- পর্ব ২ থেকে: শুরুতে ২-৩ লাইনে "আগের পর্বে আমরা দেখেছি…"${o.engage ? ', তারপর আগের পর্বের কুইজের সঠিক উত্তর' : ''}।
- শেষ পর্ব ছাড়া প্রতিটা পর্ব একটা টানটান প্রশ্নে থামবে, উত্তর দেবে না। সেই পর্বের "## cta"-তে পরের পর্বের এক লাইনের টিজার, "পরের পর্ব মিস করতে না চাইলে এখনই সাবস্ক্রাইব করুন, বেল আইকন চাপুন", আর "কমেন্টে লিখুন, কী হবে বলে মনে হয়?"
- পূর্ণ সমাধান আর শিক্ষা (takeaways) শুধু শেষ পর্বে। শেষ পর্বের cta-তে পুরো ধারাবাহিক কেমন লাগল জানতে চাও।
- কোনো পর্ব অর্ধেক রাখবে না। উত্তর কেটে গেলে আমি "চালিয়ে যাও" লিখব; তখন ঠিক যেখানে থেমেছিলে সেখান থেকে একই ফরম্যাটে লিখবে।

---
## প্রতিটা পর্বের পূর্ণ নির্দেশ
`;
    else if (o.n > 1 && !['short', 'long'].includes(o.sec)) wrap = `## একসাথে ${BNUM(o.n)}টা আলাদা গল্প লিখবে
- প্রতিটা গল্প সম্পূর্ণ আলাদা: শিরোনাম, চরিত্র, ঘটনা, মোড় আর শিক্ষা। একই ক্যাটাগরির ভেতরে থেকেও বৈচিত্র্য রাখবে, একটার ছাঁচ আরেকটায় নকল করবে না।
- প্রতিটা গল্প নিজের আলাদা কোড ব্লকে, "===" দিয়ে শুরু। কোনো গল্প অর্ধেক রাখবে না; উত্তর কেটে গেলে আমি "চালিয়ে যাও" লিখব।

---
## প্রতিটা গল্পের পূর্ণ নির্দেশ
`;
    const fmt = `## উত্তরের ফরম্যাট (উত্তরটা সরাসরি অ্যাপে পেস্ট হবে — হুবহু মানবে)
- ${o.series ? 'প্রতিটা পর্ব আলাদা কোড ব্লকে' : 'গল্প কোড ব্লকে'}, প্রতিটা "===" লাইন দিয়ে শুরু। কোড ব্লকের বাইরে কোনো কথা, ভূমিকা বা ব্যাখ্যা লিখবে না।
- ওপরের "TF Script" ফরম্যাট, জায়গা, চরিত্রের ধরন, ভাব ও কাজের তালিকার বাইরে কিছু ব্যবহার করবে না।${isl ? '\n- আয়াত/হাদিস শুধু সেটাই, যার নম্বর তুমি নিশ্চিত জানো, আর কুরআনের ক্ষেত্রে "উৎস: q সূরা:আয়াত" লাইন অবশ্যই দেবে। নবী, সাহাবি বা ফেরেশতা কখনো পর্দার চরিত্র নয়।' : ''}
- মনে রাখবে: ক্যাটাগরি "${o.cat || 'তোমার বাছাই'}"${o.own ? `, আর আমার বিশেষ নির্দেশ: ${o.own}` : ''}।`;
    return `${o.series ? 'একটা ধারাবাহিক গল্প' : o.n > 1 ? BNUM(o.n) + 'টা গল্প' : 'একটা গল্প'} লিখে দাও। আগে এবারের বাছাই পড়ো, তারপর পুরো নির্দেশ।

## এবারের বাছাই (সবার আগে মানবে)
${pick}
${engage}

${wrap}${basePrompt(o)}

${fmt}`;
  }

  /* ---------- reading the pasted answer ---------- */
  const SER_HEAD = /^\s*ধারাবাহিক\s*[:：]\s*([^|\n]+?)\s*(?:\|\s*মোট\s*পর্ব\s*[:：]?\s*([০-৯\d]+))?\s*$/m;
  const PART_T = /^\s*===\s*(.+?)\s*[|·—-]\s*পর্ব\s*([০-৯\d]+)\s*[:：]?\s*(.*)$/m;
  function fromJSON(t) {
    let j; try { j = JSON.parse(t); } catch (e) { const m = t.match(/[\[{][\s\S]*[\]}]/); if (!m) return null; try { j = JSON.parse(m[0]); } catch (e2) { return null; } }
    const scr = x => typeof x === 'string' ? x : (x && (x.script || x.txt || x.text)) || '';
    const out = [];
    const ser = j && (j.series || (j.parts && j));
    if (ser && Array.isArray(ser.parts)) { out.push(`ধারাবাহিক: ${ser.title || 'ধারাবাহিক'} | মোট পর্ব: ${ser.parts.length}`); ser.parts.forEach(p => out.push(scr(p))); }
    else (Array.isArray(j) ? j : (j.stories || [j])).forEach(x => out.push(scr(x)));
    return out.filter(Boolean).join('\n\n');
  }
  function parsePack(text) {
    let t = String(text || '').replace(/\r/g, '');
    if (/^\s*[\[{]/.test(t)) { const r = fromJSON(t.trim()); if (r) t = r; }
    t = t.replace(/```[a-z]*\s*/gi, '\n');
    const sh = t.match(SER_HEAD), serName = sh ? sh[1].trim() : '', total = sh && sh[2] ? toNum(sh[2]) : 0;
    t = t.replace(new RegExp(SER_HEAD.source, 'gm'), '');
    const chunks = t.split(/^(?=\s*===)/m).map(x => x.trim()).filter(x => /^===/.test(x));
    const pack = { singles: [], series: [] }, byName = {};
    chunks.forEach(ch => {
      const sm = ch.match(/^\s*সারাংশ\s*[:：]\s*(.*)$/m), body = ch.replace(/^\s*সারাংশ\s*[:：].*$\n?/gm, '').trim();
      const pm = body.split('\n')[0].match(PART_T);
      if (pm) { const name = serName || pm[1].trim(), k = toNum(pm[2]);
        const ser = byName[name] || (byName[name] = { title: name, total: name === serName ? total : 0, parts: [] }); if (!pack.series.includes(ser)) pack.series.push(ser);
        ser.parts = ser.parts.filter(q => q.k !== k).concat({ k, t: pm[3].trim(), s: sm ? sm[1].trim() : '', txt: body }); }
      else pack.singles.push(body);
    });
    pack.series.forEach(s => s.parts.sort((a, b) => a.k - b.k));
    return pack;
  }
  // sections without a series list keep a series as numbered stories: "নাম · পর্ব ১: পর্বের নাম"
  const flatTitle = (txt, ser, q) => txt.replace(/^\s*===.*$/m, `=== ${ser.title} · পর্ব ${BNUM(q.k)}${q.t ? ': ' + q.t : ''}`);
  function setArea(txt, cat) {
    if (!cat) return txt; const L = txt.split('\n'); const i = L.findIndex(l => /^\s*ক্ষেত্র\s*[:：]/.test(l));
    if (i >= 0) { const sub = L[i].split(/[:：]/).slice(1).join(':').split('·').slice(1).join('·').trim(); L[i] = 'ক্ষেত্র: ' + cat + (sub ? ' · ' + sub : ''); }
    else { const ti = L.findIndex(l => /^\s*===/.test(l)); let at = ti + 1; while (at < L.length && /^\s*(ফরম্যাট|format)\s*[:：]/i.test(L[at])) at++; L.splice(at, 0, 'ক্ষেত্র: ' + cat); }
    return L.join('\n');
  }
  async function addPasted() {
    const raw = $('xlsIn').value; if (!raw.trim()) { toast('আগে AI-এর উত্তর পেস্ট করুন', 'err'); return; }
    const o = opts(), pack = parsePack(raw), btn = $('xlsAdd');
    if (!pack.singles.length && !pack.series.length) { toast('কোনো গল্প পাওয়া গেল না — উত্তরে "===" দিয়ে শুরু হওয়া স্ক্রিপ্ট থাকতে হবে', 'err', 7000); return; }
    btn.disabled = true; const old = btn.textContent; btn.textContent = 'যোগ হচ্ছে…'; let msg = '';
    try {
      if (/^isl_(long|big|mid)$/.test(o.sec) && ISLL().importPack) {
        if (o.sec === 'isl_long' && pack.series.length) { S.islLongKind = 'series'; } // a pasted series goes to the series list
        if (o.sec !== 'isl_long' && pack.singles.length && !pack.series.length) { pack.series.push({ title: (titleOf0(pack.singles[0]) || 'ধারাবাহিক'), total: pack.singles.length, parts: pack.singles.map((x, i) => ({ k: i + 1, t: '', s: '', txt: x })) }); pack.singles = []; }
        const mins = o.sec === 'isl_mid' ? 5 : o.sec === 'isl_big' ? Math.max(7, o.mins) : o.mins;
        const r = await ISLL().importPack(pack, { cat: o.cat && ISL_LONG_CATS().includes(o.cat) ? o.cat : '', mins, topic: o.topic });
        if (pack.series.length) { S.islLongKind = 'series'; S.islSerLen = mins <= 6 ? 'mid' : 'big'; saveSettings(); ISLL().render(); }
        msg = [r.singles ? `${BNUM(r.singles)}টা একক গল্প` : '', r.series.length ? `ধারাবাহিক "${r.series.join('", "')}" (${BNUM(r.parts)}টা পর্ব)` : ''].filter(Boolean).join(' আর ');
        if (r.bad.length) toast('কিছু অংশ বাদ গেছে: ' + r.bad.slice(0, 3).join(' · '), 'err', 9000);
      } else {
        const V = typeof TF_ISL !== 'undefined' && TF_ISL && ISLW().verifyQuran;
        let list = pack.singles.map(x => ({ txt: x }));
        pack.series.forEach(ser => ser.parts.forEach(q => list.push({ txt: flatTitle(q.txt, ser, q), part: true })));
        const keepCat = o.cat && (o.sec === 'short' || o.sec === 'exp' || o.sec === 'long');
        const texts = []; for (const it of list) { let t = keepCat ? setArea(it.txt, o.cat) : it.txt; if (V) { try { t = await V(t, null); } catch (e) { } } texts.push(t); }
        const r = await addStoriesToLib(texts.join('\n\n'));
        try { if (ISLW().islRenderLib) ISLW().islRenderLib(); } catch (e) { }
        msg = r.ok ? `${BNUM(r.ok)}টা ${pack.series.length ? 'পর্ব/গল্প' : 'গল্প'}` : '';
        if (r.dup) toast(`${BNUM(r.dup)}টা আগে থেকেই লাইব্রেরিতে ছিল`, '', 5000);
        if (r.bad && r.bad.length) toast('কিছু গল্প পড়া গেল না: ' + r.bad.slice(0, 2).join(' · '), 'err', 9000);
      }
      if (msg) { $('xlsDone').textContent = '✓ লাইব্রেরিতে যোগ হয়েছে: ' + msg; $('xlsDone').classList.remove('hidden'); $('xlsIn').value = ''; toast('✓ ' + msg + ' লাইব্রেরিতে যোগ হয়েছে', 'ok', 6000); }
      else if (!$('xlsDone').classList.contains('hidden')) $('xlsDone').classList.add('hidden');
    } catch (e) { console.error(e); toast(e.message, 'err', 8000); }
    finally { btn.disabled = false; btn.textContent = old; }
  }
  const titleOf0 = t => ((String(t).match(/^\s*===\s*(.*)$/m) || [, ''])[1] || '').split('|')[0].trim();

  /* ---------- the card ---------- */
  const opt = (v, t) => el('option', { value: v, text: t });
  function build() {
    if ($('xlsBox') || !$('libList')) return;
    const kindSeg = el('nav', { class: 'seg sub small', id: 'xlsKind', 'data-v': 'single' },
      el('button', { type: 'button', 'data-k': 'single', text: 'একক গল্প' }), el('button', { type: 'button', 'data-k': 'series', text: 'ধারাবাহিক (পর্বে পর্বে)' }));
    const box = el('details', { id: 'xlsBox', class: 'xls isl-form' },
      el('summary', null, el('b', { text: '✍ বাইরের AI দিয়ে লিখে লাইব্রেরিতে যোগ' }), el('span', { class: 'muted sm', id: 'xlsSec' })),
      el('p', { class: 'muted sm', text: '১) নিচে বাছাই করুন, চাইলে নিজের নির্দেশ লিখুন। ২) প্রম্পট কপি করে Gemini / ChatGPT / Claude-এ দিন। ৩) পুরো উত্তর কপি করে নিচের বক্সে পেস্ট করে "লাইব্রেরিতে যোগ" চাপুন — এই সেকশনেই জমা হবে।' }),
      el('label', null, 'ক্যাটাগরি', el('select', { id: 'xlsCat' })),
      el('input', { id: 'xlsCatOwn', class: 'hidden', placeholder: 'নিজের ক্যাটাগরি লিখুন — যেমন: প্রবাসীর ঈদ' }),
      el('label', { id: 'xlsStyleRow' }, 'স্টাইল', el('select', { id: 'xlsStyle' })),
      el('div', { id: 'xlsKindRow' }, el('span', { class: 'muted sm', text: 'কী লেখাবেন' }), kindSeg),
      el('div', { class: 'grid3' },
        el('label', { id: 'xlsNRow' }, 'কয়টা গল্প', el('select', { id: 'xlsN' })),
        el('label', { id: 'xlsPartsRow' }, 'মোট পর্ব', el('select', { id: 'xlsParts' }, ...[2, 3, 4, 5, 6, 8].map(n => opt(n, BNUM(n) + 'টা')))),
        el('label', { id: 'xlsMinRow' }, 'দৈর্ঘ্য', el('select', { id: 'xlsMin' }, ...[4, 5, 6, 8, 10, 12, 15].map(n => opt(n, BNUM(n) + ' মিনিট'))))),
      el('label', null, 'বিষয় বা ভাবনা (ঐচ্ছিক)', el('textarea', { id: 'xlsTopic', rows: 2, placeholder: 'যেমন: প্রবাসী ছেলের ঈদের রাত / ধার নিয়ে দুই বন্ধুর বিচ্ছেদ' })),
      el('label', null, 'আপনার বিশেষ নির্দেশ (ঐচ্ছিক)', el('textarea', { id: 'xlsOwn', rows: 2, placeholder: 'যেমন: গ্রামের পটভূমি, শেষে সুখের সমাপ্তি, নারী চরিত্র প্রধান, সংলাপ বেশি' })),
      el('label', { class: 'chk' }, el('input', { type: 'checkbox', id: 'xlsEngage' }), ' দর্শক ধরে রাখার কৌশল (টুইস্ট, কুইজ, কমেন্ট-সাবস্ক্রাইবের ডাক)'),
      el('div', { class: 'row' }, el('b', { text: 'প্রম্পট (নিচে লেখা আছে)' }), el('button', { type: 'button', class: 'primary sm', id: 'xlsCopy', text: '📋 প্রম্পট কপি' })),
      el('textarea', { id: 'xlsPrompt', rows: 6, readonly: '', class: 'xls-prompt' }),
      el('b', { text: 'AI-এর উত্তর এখানে পেস্ট করুন' }),
      el('textarea', { id: 'xlsIn', rows: 5, placeholder: 'পুরো উত্তর এখানে — একাধিক উত্তর হলে (চালিয়ে যাও) সব একসাথে' }),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'ghost sm', id: 'xlsPaste', text: '📥 ক্লিপবোর্ড থেকে' }), el('button', { type: 'button', class: 'primary', id: 'xlsAdd', text: 'লাইব্রেরিতে যোগ' })),
      el('p', { class: 'ok sm hidden', id: 'xlsDone' }));
    const chips = $('libChips'); (chips && chips.parentNode === $('libList').parentNode ? chips : $('libList')).insertAdjacentElement(chips && chips.parentNode === $('libList').parentNode ? 'afterend' : 'beforebegin', box);
    const css = document.createElement('style'); css.id = 'xlsCss';
    css.textContent = '.xls{margin:10px 0 14px;border:1px solid var(--line);border-radius:14px;padding:10px 12px;background:var(--card,transparent)}.xls>summary{cursor:pointer;display:flex;flex-direction:column;gap:2px;list-style:none}.xls>summary::-webkit-details-marker{display:none}.xls[open]>summary{margin-bottom:8px}.xls label{display:block;margin:8px 0}.xls select,.xls input:not([type=checkbox]),.xls textarea{width:100%;box-sizing:border-box}.xls .chk{display:flex;gap:8px;align-items:center}.xls .row{display:flex;gap:8px;align-items:center;justify-content:space-between;margin:10px 0 6px}.xls-prompt{font-size:12px;opacity:.85}#xlsKindRow{margin:8px 0}#xlsKindRow .seg{margin-top:4px}.xls .ok{color:var(--ok,#1f7a4d);font-weight:600}';
    document.head.append(css);
    // events
    const upd = () => { save(); refreshPrompt(); };
    ['xlsCat', 'xlsStyle', 'xlsN', 'xlsParts', 'xlsMin', 'xlsEngage'].forEach(id => $(id).addEventListener('change', () => { if (id === 'xlsCat') $('xlsCatOwn').classList.toggle('hidden', $('xlsCat').value !== '__own'); if (id === 'xlsStyle' && section() === 'long') fillCats(); upd(); }));
    ['xlsCatOwn', 'xlsTopic', 'xlsOwn'].forEach(id => $(id).addEventListener('input', debounce(upd, 350)));
    kindSeg.addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (!b) return; kindSeg.dataset.v = b.dataset.k; syncKind(); upd(); });
    $('xlsCopy').onclick = () => { refreshPrompt(); copyText($('xlsPrompt').value, 'প্রম্পট কপি হয়েছে — Gemini / ChatGPT / Claude-এ পেস্ট করুন'); };
    $('xlsPaste').onclick = async () => { try { const t = await navigator.clipboard.readText(); if (t) { $('xlsIn').value = t; toast('পেস্ট হয়েছে', 'ok'); } else toast('ক্লিপবোর্ড খালি'); } catch (e) { toast('বক্সে চেপে ধরে "Paste" চাপুন', '', 5000); $('xlsIn').focus(); } };
    $('xlsAdd').onclick = addPasted;
    box.addEventListener('toggle', () => { if (box.open) load(); });
    // the section can change under the card (short ↔ long, single ↔ series, big ↔ mid)
    document.addEventListener('click', e => { if (e.target.closest('#fmtPick, #islLKind, #islLSerLen, #srcTabs, [data-fmt]')) setTimeout(load, 60); }, true);
    load();
  }
  const debounce = (f, ms) => { let t; return () => { clearTimeout(t); t = setTimeout(f, ms); }; };
  function fillCats() {
    const c = CFG[section()], g = get(), sel = $('xlsCat'), cats = (c.cats() || []).slice();
    sel.innerHTML = ''; sel.append(opt('', 'AI বেছে নিক'), ...cats.map(x => opt(x, x)), opt('__own', '✎ নিজে লিখুন…'));
    const v = g.cat || ''; if (v && !cats.includes(v) && v !== '__own') { sel.value = '__own'; $('xlsCatOwn').value = v; } else sel.value = v;
    $('xlsCatOwn').classList.toggle('hidden', sel.value !== '__own');
  }
  function load() {
    if (!$('xlsBox')) return; const sec = section(), c = CFG[sec], g = get();
    $('xlsSec').textContent = 'এই লাইব্রেরি: ' + c.name;
    const st = c.styles(); $('xlsStyleRow').classList.toggle('hidden', !st.length); $('xlsStyle').innerHTML = ''; st.forEach(([v, t]) => $('xlsStyle').append(opt(v, t)));
    if (st.length) $('xlsStyle').value = g.style && st.some(s => s[0] === g.style) ? g.style : (sec === 'long' ? (S.longStyle || 'life') : sec === 'short' ? (S.storyStyle === 'classic' ? 'classic' : 'twist') : st[0][0]);
    fillCats();
    $('xlsN').innerHTML = ''; for (let i = 1; i <= c.maxN; i++) $('xlsN').append(opt(i, BNUM(i) + 'টা')); $('xlsN').value = Math.min(c.maxN, g.n || 1);
    $('xlsParts').value = c.parts || g.parts || 3; $('xlsParts').disabled = !!c.parts;
    $('xlsMin').value = c.series && c.parts ? 5 : (g.mins || c.defMin); if (!$('xlsMin').value) $('xlsMin').value = c.defMin;
    $('xlsMin').disabled = !!(c.series && c.parts);
    $('xlsKind').dataset.v = c.series ? 'series' : (g.kind === 'series' ? 'series' : 'single');
    $('xlsEngage').checked = g.engage != null ? !!g.engage : !!c.series;
    syncKind(); refreshPrompt();
  }
  function syncKind() {
    const c = CFG[section()], ser = c.series || $('xlsKind').dataset.v === 'series';
    $('xlsKindRow').classList.toggle('hidden', !!c.series);
    $('xlsKind').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === (ser ? 'series' : 'single')));
    $('xlsNRow').classList.toggle('hidden', ser); $('xlsPartsRow').classList.toggle('hidden', !ser); $('xlsMinRow').classList.toggle('hidden', !c.long);
  }
  function save() {
    const sel = $('xlsCat').value;
    put({ cat: sel === '__own' ? $('xlsCatOwn').value.trim() : sel, style: $('xlsStyle').value, n: +$('xlsN').value, parts: +$('xlsParts').value, mins: +$('xlsMin').value, kind: $('xlsKind').dataset.v, engage: $('xlsEngage').checked });
  }
  function refreshPrompt() { try { $('xlsPrompt').value = buildPrompt(); } catch (e) { console.warn('xls prompt', e); $('xlsPrompt').value = 'প্রম্পট বানানো গেল না: ' + e.message; } }

  window.TF_LIBSTUDIO = { build, load, parsePack, buildPrompt, section };
  const start = () => { try { build(); } catch (e) { console.error('lib studio', e); } };
  if (document.readyState === 'complete') setTimeout(start, 300); else window.addEventListener('load', () => setTimeout(start, 300));
})();
