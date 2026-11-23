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
    if (L && S.lifeLongKind === 'series' && window.LIFE_SER) return S.lifeSerLen === 'mid' ? 'life_mid' : 'life_big';
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
    life_big: { name: 'জীবন পাঠ · বড় ধারাবাহিক', cats: () => LONG_TOPICS[(get().style) || S.longStyle || 'life'] || [], styles: () => Object.entries(LONG_STYLE_BN), long: true, maxN: 5, defMin: 8, series: true },
    life_mid: { name: 'জীবন পাঠ · মাঝারি ধারাবাহিক (৩ পর্ব × ~৫ মিনিট)', cats: () => LONG_TOPICS[(get().style) || S.longStyle || 'life'] || [], styles: () => Object.entries(LONG_STYLE_BN), long: true, maxN: 5, defMin: 5, series: true, parts: 3 },
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
      case 'life_big': case 'life_mid':
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
- ধারাবাহিকের একটা নাম ঠিক করো (৩-৭ শব্দ)। কোড ব্লকের একদম প্রথম লাইনে হুবহু লিখবে: "ধারাবাহিক: <নাম> | মোট পর্ব: ${BNUM(o.parts)}"
- ${BNUM(o.parts)}টা পর্বই একটাই কোড ব্লকের ভেতরে, একটার পর একটা (মাঝে একটা খালি লাইন)। পর্বগুলো আলাদা আলাদা কোড ব্লকে বা আলাদা উত্তরে ভাগ করবে না — আমি এক ক্লিকে পুরো ব্লক কপি করে অ্যাপে একবারে পেস্ট করব। প্রতিটা পর্ব আলাদা পূর্ণ স্ক্রিপ্ট (নিচের পূর্ণ নির্দেশ মেনে), দৈর্ঘ্য প্রতি পর্ব ${lenTxt}।
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
- সব গল্প একটাই কোড ব্লকের ভেতরে, একটার পর একটা, প্রতিটা "===" দিয়ে শুরু (আলাদা আলাদা কোড ব্লকে ভাগ করবে না — আমি এক ক্লিকে পুরো ব্লক কপি করব)। কোনো গল্প অর্ধেক রাখবে না; উত্তর কেটে গেলে আমি "চালিয়ে যাও" লিখব।

---
## প্রতিটা গল্পের পূর্ণ নির্দেশ
`;
    const fmt = `## উত্তরের ফরম্যাট (উত্তরটা সরাসরি অ্যাপে পেস্ট হবে — হুবহু মানবে)
- পুরো উত্তর মাত্র একটা কোড ব্লকে (\`\`\`text দিয়ে শুরু, \`\`\` দিয়ে শেষ)${o.series ? ": ধারাবাহিকের লাইন, তারপর পর্ব ১, পর্ব ২ … সব পর্ব এই একটা ব্লকেই" : o.n > 1 ? ": সব গল্প এই একটা ব্লকেই" : ""}। প্রতিটা ${o.series ? "পর্ব" : "গল্প"} "===" লাইন দিয়ে শুরু। কোড ব্লকের আগে-পরে কোনো কথা, ভূমিকা বা ব্যাখ্যা লিখবে না।
- ওপরের "TF Script" ফরম্যাট, জায়গা, চরিত্রের ধরন, ভাব ও কাজের তালিকার বাইরে কিছু ব্যবহার করবে না।${isl ? '\n- আয়াত/হাদিস শুধু সেটাই, যার নম্বর তুমি নিশ্চিত জানো, আর কুরআনের ক্ষেত্রে "উৎস: q সূরা:আয়াত" লাইন অবশ্যই দেবে। নবী, সাহাবি বা ফেরেশতা কখনো পর্দার চরিত্র নয়।' : ''}
- মনে রাখবে: ক্যাটাগরি "${o.cat || 'তোমার বাছাই'}"${o.own ? `, আর আমার বিশেষ নির্দেশ: ${o.own}` : ''}।
- শেষ কথা: ${o.series ? `${BNUM(o.parts)}টা পর্বই এই একটা উত্তরে, একটাই কোড ব্লকে` : o.n > 1 ? 'সব গল্প একটাই কোড ব্লকে' : 'একটাই কোড ব্লকে'} — যেন কোড ব্লকের কপি বোতাম একবার চাপলেই সব কপি হয়।`;
    return `${o.series ? 'একটা ধারাবাহিক গল্প' : o.n > 1 ? BNUM(o.n) + 'টা গল্প' : 'একটা গল্প'} লিখে দাও। আগে এবারের বাছাই পড়ো, তারপর পুরো নির্দেশ।

## এবারের বাছাই (সবার আগে মানবে)
${pick}
${engage}

${wrap}${basePrompt(o)}

${fmt}`;
  }

  /* ---------- reading the pasted answer ---------- */
  const SER_HEAD = /^\s*ধারাবাহিক\s*[:：]\s*([^|\n]+?)\s*(?:\|\s*মোট\s*পর্ব\s*[:：]?\s*([০-৯\d]+))?\s*$/m;
  // "=== নাম | পর্ব ১: …", "=== নাম — পর্ব-১ …", "=== পর্ব ১: …", "=== Part 1: …"
  const PART_T = /^\s*===\s*(?:(.+?)\s*[|·—–-]\s*)?(?:পর্ব|পর্ব্|এপিসোড|part|episode)\s*[-–]?\s*([০-৯\d]+)\s*[:：.।—–-]?\s*(.*)$/mi;
  /* Gemini/ChatGPT answers come in many shapes: with or without ``` fences (copy button vs. long-press), **bold**,
     "### পর্ব ১" headings, chat lines between the parts. Keep only the scripts (+ the series line). */
  function clean(t) {
    t = String(t || '').replace(/\r/g, '').replace(/\u200b/g, '').replace(/\*\*/g, '');
    t = t.replace(/^[ \t]*#{1,6}[ \t]*(?=(===|ধারাবাহিক\s*[:：]))/gm, '');
    t = t.replace(/^[ \t]*>[ \t]?(?=(===|ধারাবাহিক))/gm, '');
    const fences = t.match(/```[^\n]*\n[\s\S]*?(```|$)/g);
    if (fences && fences.some(f => /^\s*===|\n\s*===/.test(f))) {
      const head = (t.match(SER_HEAD) || [''])[0];
      const body = fences.map(f => f.replace(/^```[^\n]*\n/, '').replace(/```$/, '')).join('\n\n');
      t = (head && !body.includes(head.trim()) ? head + '\n' : '') + body;
    }
    return t.replace(/```[a-z]*\s*/gi, '\n');
  }
  function fromJSON(t) {
    let j; try { j = JSON.parse(t); } catch (e) { const m = t.match(/[\[{][\s\S]*[\]}]/); if (!m) return null; try { j = JSON.parse(m[0]); } catch (e2) { return null; } }
    const scr = x => typeof x === 'string' ? x : (x && (x.script || x.txt || x.text)) || '';
    const out = [];
    const ser = j && (j.series || (j.parts && j));
    if (ser && Array.isArray(ser.parts)) { out.push(`ধারাবাহিক: ${ser.title || 'ধারাবাহিক'} | মোট পর্ব: ${ser.parts.length}`); ser.parts.forEach(p => out.push(scr(p))); }
    else (Array.isArray(j) ? j : (j.stories || [j])).forEach(x => out.push(scr(x)));
    return out.filter(Boolean).join('\n\n');
  }
  function parsePack(text, po) {
    let t = String(text || '').replace(/\r/g, '');
    if (/^\s*[\[{]/.test(t)) { const r = fromJSON(t.trim()); if (r) t = r; }
    t = clean(t);
    const sh = t.match(SER_HEAD), serName = sh ? sh[1].trim() : '', total = sh && sh[2] ? toNum(sh[2]) : 0;
    t = t.replace(new RegExp(SER_HEAD.source, 'gm'), '');
    const chunks = t.split(/^(?=\s*===)/m).map(x => x.trim()).filter(x => /^===/.test(x));
    const pack = { singles: [], series: [] }, byName = {};
    chunks.forEach(ch => {
      const sm = ch.match(/^\s*সারাংশ\s*[:：]\s*(.*)$/m), body = ch.replace(/^\s*সারাংশ\s*[:：].*$\n?/gm, '').trim();
      const pm = body.split('\n')[0].match(PART_T);
      if (pm) { const name = serName || (pm[1] || '').trim() || (pack.series[0] || {}).title || (po && po.last) || 'ধারাবাহিক', k = toNum(pm[2]);
        const ser = byName[name] || (byName[name] = { title: name, total: name === serName ? total : 0, parts: [] }); if (!pack.series.includes(ser)) pack.series.push(ser);
        ser.parts = ser.parts.filter(q => q.k !== k).concat({ k, t: pm[3].trim(), s: sm ? sm[1].trim() : '', txt: body }); }
      else pack.singles.push(body);
    });
    // series chosen but the AI wrote plain "=== title" blocks → they are the parts, in order
    if (po && po.series && !pack.series.length && pack.singles.length) {
      pack.series.push({ title: serName || titleOf0(pack.singles[0]) || 'ধারাবাহিক', total, parts: pack.singles.map((x, i) => ({ k: i + 1, t: titleOf0(x), s: '', txt: x })) });
      pack.singles = [];
    }
    pack.series.forEach(s => s.parts.sort((a, b) => a.k - b.k));
    if (pack.series.length) put({ lastSer: pack.series[0].title });
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
  async function addPasted(auto) {
    const raw = $('xlsIn').value; if (!raw.trim()) { if (auto !== true) toast('আগে AI-এর উত্তর পেস্ট করুন', 'err'); return; }
    if (busy) return; busy = true;
    const o = opts(), pack = parsePack(raw, { series: o.series, last: o.g.lastSer }), btn = $('xlsAdd');
    if (!pack.singles.length && !pack.series.length) { busy = false; toast('কোনো গল্প পাওয়া গেল না — Gemini-র পুরো উত্তরটা কপি করুন (উত্তরের নিচের কপি বোতাম দিয়ে)', 'err', 8000); return; }
    // parts the AI hasn't written yet (answer cut off) → tell him exactly what to do
    const miss = []; pack.series.forEach(sr => { const have = sr.parts.map(q => q.k); for (let k = 1; k <= (sr.total || 0); k++) if (!have.includes(k)) miss.push(k); });
    btn.disabled = true; const old = btn.textContent; btn.textContent = 'যোগ হচ্ছে…'; let msg = '';
    try {
      if (window.LIFE_SER && (/^life_/.test(o.sec) || (o.sec === 'long' && pack.series.length))) {
        // জীবন পাঠ: a real series (plan + parts) in the long library's ধারাবাহিক tab
        if (pack.singles.length && !pack.series.length) { pack.series.push({ title: titleOf0(pack.singles[0]) || 'ধারাবাহিক', total: pack.singles.length, parts: pack.singles.map((x, i) => ({ k: i + 1, t: '', s: '', txt: x })) }); pack.singles = []; }
        const keep = pack.singles; pack.singles = [];
        const mins = o.sec === 'life_mid' ? 5 : Math.max(6, o.mins);
        const r = await LIFE_SER.importPack(pack, { style: o.style || 'life', cat: o.cat, mins, topic: o.topic });
        let nS = 0; if (keep.length) { const r2 = await addStoriesToLib(keep.map(t => o.cat ? setArea(t, o.cat) : t).join('\n\n')); nS = r2.ok; }
        msg = [nS ? `${BNUM(nS)}টা একক গল্প` : '', r.series.length ? `ধারাবাহিক "${r.series.join('", "')}" (${BNUM(r.parts)}টা পর্ব)` : ''].filter(Boolean).join(' আর ');
        if (r.bad.length) toast('কিছু অংশ বাদ গেছে: ' + r.bad.slice(0, 3).join(' · '), 'err', 9000);
      } else if (/^isl_(long|big|mid)$/.test(o.sec) && ISLL().importPack) {
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
      if (msg && miss.length) msg += ` — পর্ব ${miss.map(BNUM).join(', ')} এখনো আসেনি: Gemini-তে লিখুন "চালিয়ে যাও", তারপর সেই উত্তরটাও এখানে পেস্ট করুন (একই ধারাবাহিকে জুড়ে যাবে)`;
      if (msg) { $('xlsBox').open = true; $('xlsDone').textContent = '✓ লাইব্রেরিতে যোগ হয়েছে: ' + msg + ' · আরও কিছু থাকলে আবার "পেস্ট করে লাইব্রেরিতে যোগ" চাপুন'; $('xlsDone').classList.remove('hidden'); $('xlsIn').value = ''; toast('✓ ' + msg + ' লাইব্রেরিতে যোগ হয়েছে', 'ok', 6000); }
      else if (!$('xlsDone').classList.contains('hidden')) $('xlsDone').classList.add('hidden');
    } catch (e) { console.error(e); toast(e.message, 'err', 8000); }
    finally { btn.disabled = false; btn.textContent = old; busy = false; }
  }
  let busy = false;
  const titleOf0 = t => ((String(t).match(/^\s*===\s*(.*)$/m) || [, ''])[1] || '').split('|')[0].trim();

  /* ---------- the card ---------- */
  const opt = (v, t) => el('option', { value: v, text: t });
  function build() {
    if ($('xlsBox') || !$('libList')) return;
    const kindSeg = el('nav', { class: 'seg sub small', id: 'xlsKind', 'data-v': 'single' },
      el('button', { type: 'button', 'data-k': 'single', text: 'একটাতেই শেষ' }), el('button', { type: 'button', 'data-k': 'series', text: 'ধারাবাহিক পর্ব' }));
    const step = (n, t) => el('div', { class: 'xls-step' }, el('span', { class: 'xls-n', text: BNUM(n) }), el('b', { text: t }));
    const box = el('details', { id: 'xlsBox', class: 'xls isl-form' },
      el('summary', null, el('b', { text: '✍ বাইরের AI দিয়ে গল্প যোগ (Gemini / ChatGPT)' }), el('span', { class: 'muted sm', id: 'xlsSec' })),
      step(1, 'কী চান বাছুন'),
      el('div', { id: 'xlsKindRow' }, kindSeg),
      el('div', { class: 'grid3' },
        el('label', { id: 'xlsNRow' }, 'কয়টা গল্প', el('select', { id: 'xlsN' })),
        el('label', { id: 'xlsPartsRow' }, 'কয়টা পর্ব', el('select', { id: 'xlsParts' }, ...[2, 3, 4, 5, 6, 8].map(n => opt(n, BNUM(n) + 'টা')))),
        el('label', { id: 'xlsMinRow' }, 'প্রতিটা কত মিনিট', el('select', { id: 'xlsMin' }, ...[4, 5, 6, 8, 10, 12, 15].map(n => opt(n, BNUM(n) + ' মিনিট'))))),
      el('label', null, 'ক্যাটাগরি', el('select', { id: 'xlsCat' })),
      el('input', { id: 'xlsCatOwn', class: 'hidden', placeholder: 'নিজের ক্যাটাগরি লিখুন — যেমন: প্রবাসীর ঈদ' }),
      el('label', null, 'বিষয় (ঐচ্ছিক, দু-এক কথা)', el('textarea', { id: 'xlsTopic', rows: 2, placeholder: 'যেমন: প্রবাসী ছেলের ঈদের রাত' })),
      el('details', { class: 'xls-more' }, el('summary', { text: '⚙ আরও অপশন (স্টাইল, বিশেষ নির্দেশ)' }),
        el('label', { id: 'xlsStyleRow' }, 'স্টাইল', el('select', { id: 'xlsStyle' })),
        el('label', null, 'আপনার বিশেষ নির্দেশ', el('textarea', { id: 'xlsOwn', rows: 2, placeholder: 'যেমন: গ্রামের পটভূমি, শেষে সুখের সমাপ্তি, সংলাপ বেশি' })),
        el('label', { class: 'chk' }, el('input', { type: 'checkbox', id: 'xlsEngage' }), ' দর্শক ধরে রাখার কৌশল (টুইস্ট, কুইজ, সাবস্ক্রাইবের ডাক)')),
      step(2, 'প্রম্পট কপি করে Gemini-তে পেস্ট করুন'),
      el('button', { type: 'button', class: 'primary xls-big', id: 'xlsCopy', text: '📋 প্রম্পট কপি করুন' }),
      el('details', { class: 'xls-more' }, el('summary', { text: 'প্রম্পটটা দেখুন' }), el('textarea', { id: 'xlsPrompt', rows: 6, readonly: '', class: 'xls-prompt' })),
      step(3, 'Gemini-র পুরো উত্তর কপি করে এখানে আনুন'),
      el('p', { class: 'muted sm', id: 'xlsHint', text: 'সব পর্ব/গল্প একবারেই — উত্তরের নিচের কপি বোতাম চাপুন, তারপর নিচের বোতাম। অ্যাপ নিজেই পর্বগুলো আলাদা করে লাইব্রেরিতে রাখবে, আলাদা আলাদা পেস্ট করতে হবে না।' }),
      el('button', { type: 'button', class: 'primary xls-big', id: 'xlsPaste', text: '📥 পেস্ট করে লাইব্রেরিতে যোগ' }),
      el('textarea', { id: 'xlsIn', rows: 3, placeholder: 'বোতাম কাজ না করলে এখানে চেপে ধরে "Paste" — পেস্ট করলেই নিজে থেকে যোগ হবে' }),
      el('button', { type: 'button', class: 'ghost sm hidden', id: 'xlsAdd', text: 'লাইব্রেরিতে যোগ' }),
      el('p', { class: 'ok sm hidden', id: 'xlsDone' }));
    const chips = $('libChips'); (chips && chips.parentNode === $('libList').parentNode ? chips : $('libList')).insertAdjacentElement(chips && chips.parentNode === $('libList').parentNode ? 'afterend' : 'beforebegin', box);
    const css = document.createElement('style'); css.id = 'xlsCss';
    css.textContent = '.xls{margin:10px 0 14px;border:1px solid var(--line);border-radius:14px;padding:10px 12px;background:var(--card,transparent)}.xls>summary{cursor:pointer;display:flex;flex-direction:column;gap:2px;list-style:none}.xls>summary::-webkit-details-marker{display:none}.xls[open]>summary{margin-bottom:8px}.xls label{display:block;margin:8px 0}.xls select,.xls input:not([type=checkbox]),.xls textarea{width:100%;box-sizing:border-box}.xls .chk{display:flex;gap:8px;align-items:center}.xls .row{display:flex;gap:8px;align-items:center;justify-content:space-between;margin:10px 0 6px}.xls-prompt{font-size:12px;opacity:.85}#xlsKindRow{margin:8px 0}#xlsKindRow .seg{margin-top:4px}.xls .ok{color:var(--ok,#1f7a4d);font-weight:600}.xls-step{display:flex;align-items:center;gap:8px;margin:14px 0 6px}.xls-n{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--accent,#1f7a4d);color:#fff;font-size:13px;font-weight:700;flex:none}.xls-big{width:100%;min-height:48px;font-size:16px;margin:4px 0 8px}.xls-more{margin:6px 0}.xls-more>summary{cursor:pointer;font-size:13px;opacity:.8;padding:4px 0}#xlsKindRow .seg{display:flex}#xlsKindRow .seg button{flex:1;min-height:40px}';
    document.head.append(css);
    // events
    const upd = () => { save(); refreshPrompt(); };
    ['xlsCat', 'xlsStyle', 'xlsN', 'xlsParts', 'xlsMin', 'xlsEngage'].forEach(id => $(id).addEventListener('change', () => { if (id === 'xlsCat') $('xlsCatOwn').classList.toggle('hidden', $('xlsCat').value !== '__own'); if (id === 'xlsStyle' && section() === 'long') fillCats(); upd(); }));
    ['xlsCatOwn', 'xlsTopic', 'xlsOwn'].forEach(id => $(id).addEventListener('input', debounce(upd, 350)));
    kindSeg.addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (!b) return; kindSeg.dataset.v = b.dataset.k; syncKind(); upd(); });
    $('xlsCopy').onclick = () => { refreshPrompt(); copyText($('xlsPrompt').value, 'প্রম্পট কপি হয়েছে — Gemini / ChatGPT / Claude-এ পেস্ট করুন'); };
    $('xlsPaste').onclick = async () => {
      let t = ''; try { t = await navigator.clipboard.readText(); } catch (e) { }
      if (!t && window.TFAndroid && TFAndroid.getClipboard) { try { t = TFAndroid.getClipboard(); } catch (e) { } }
      if (t && t.trim()) { $('xlsIn').value = t; addPasted(); }
      else { toast('নিচের বক্সে চেপে ধরে "Paste" চাপুন — পেস্ট করলেই যোগ হবে', '', 6000); $('xlsIn').focus(); }
    };
    $('xlsAdd').onclick = addPasted;
    // pasting into the box (or a keyboard clipboard chip) adds by itself — no extra button
    let lastLen = 0;
    $('xlsIn').addEventListener('paste', () => setTimeout(() => addPasted(true), 80));
    $('xlsIn').addEventListener('input', () => { const L = $('xlsIn').value.length; if (L - lastLen > 300) setTimeout(() => addPasted(true), 120); lastLen = L; $('xlsAdd').classList.toggle('hidden', !L); });
    box.addEventListener('toggle', () => { if (box.open) load(); });
    // the section can change under the card (short ↔ long, single ↔ series, big ↔ mid)
    document.addEventListener('click', e => { if (e.target.closest('#fmtPick, #islLKind, #islLSerLen, #lifeKind, #lifeSerLen, #srcTabs, [data-fmt]')) setTimeout(load, 60); }, true);
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
