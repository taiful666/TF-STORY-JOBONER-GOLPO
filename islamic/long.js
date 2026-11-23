/* TF Story Studio — Islamic part: LONG videos (16:9, YouTube)
   Two kinds, chosen in step 1 after "লং ভিডিও":
   - একক গল্প: one long story (5-15 min) by category (life-building, Quran events, hadith, prophets, sahaba, history)
   - ধারাবাহিক: one big story told in parts (পর্ব ১, ২, ৩…). The AI first makes a plan (part titles + what happens),
     then each part is written on its own; every part but the last ends on a cliffhanger + "next part is coming,
     follow / subscribe" call; part 2+ open with a short recap.
   Storage (USERLIB, so it syncs with Gmail like every own story):
     single  → id isl_long_*            txt has "ফরম্যাট: long | life" and "ক্ষেত্র: <category>"
     plan    → id isl_ser_*             txt "=== title\nফরম্যাট: series-plan\n{json}"
     part k  → id isl_ser_*_p<k>        a normal long script
   The exact Quran text is still put in by the app (ISL_API.verifyQuran), never typed by the AI. */
(function () {
  'use strict';
  const CATS = ['জীবন গঠনমূলক গল্প', 'কুরআনের ঘটনা', 'হাদিসের গল্প', 'নবীদের কাহিনি', 'সাহাবিদের জীবন', 'ইসলামের ইতিহাস'];
  const LONG_RE = /^\s*ফরম্যাট\s*[:：]\s*long/m, PLAN_RE = /^\s*ফরম্যাট\s*[:：]\s*series-plan/m;
  const API = () => window.ISL_API || {};
  const kind = () => (S.islLongKind === 'series' ? 'series' : 'single');
  const titleOf = txt => ((String(txt).match(/^\s*===\s*(.*)$/m) || [, ''])[1] || '').split('|')[0].trim();
  const catOf = txt => ((String(txt).match(/^\s*ক্ষেত্র\s*[:：]\s*(.*)$/m) || [, ''])[1] || '').trim();
  // spoken words / ~110 per minute (measured from a real export: ~1130 words → 10:44)
  const minsOf = txt => { const n = String(txt).split('\n').filter(l => l.trim() && !/^\s*(##|===|(ফরম্যাট|ক্ষেত্র|ইউটিউব টাইটেল|থাম্বনেল|চরিত্র|বর্ণনা|হ্যাশট্যাগ|উৎস)\s*[:：])/.test(l)).map(l => l.replace(/\{[^}]*\}/g, '').replace(/^\s*\w+:\w+:\w+\s*>?/, '')).join(' ').split(/\s+/).filter(Boolean).length; return Math.max(1, Math.round(n / 110)); };
  const planOf = u => { try { return JSON.parse(String(u.txt).slice(String(u.txt).indexOf('{'))); } catch (e) { return null; } };
  const partId = (sid, k) => sid + '_p' + k;
  /* বিল্ট-ইন ধারাবাহিক: window.ISL_LONG_SERIES (islamic/long-series.js, বড়, পর্ব ~৮ মিনিট) + window.ISL_MID_SERIES (islamic/mid-series.js, মাঝারি, ৩ পর্ব × ~৫ মিনিট) — পরিকল্পনা আর সব পর্ব তৈরি, মোছা/নতুন-লেখা যায় না */
  const PRE_SER = () => (window.ISL_LONG_SERIES || []).concat(window.ISL_MID_SERIES || []);
  const serLen = () => (S.islSerLen === 'mid' ? 'mid' : 'big'), isMidPlan = pl => (+pl.mins || 8) <= 6;
  const preSeries = () => PRE_SER().map(x => ({ id: x.id, pre: true, txt: `=== ${x.title}\nফরম্যাট: series-plan\n${JSON.stringify({ title: x.title, cat: x.cat, mins: x.mins, parts: x.parts.map(q => ({ t: q.t, s: q.s || '' })) })}` }));
  const findPart = (sid, k) => USERLIB.find(u => u.id === partId(sid, k)) || (() => { const x = PRE_SER().find(y => y.id === sid), q = x && x.parts[k - 1]; return q && q.txt ? { id: partId(sid, k), txt: q.txt, pre: true } : null; })();
  let inited = false, PEND = null;

  /* ---------- prompts ---------- */
  function rulesTail() { // the Islamic part's own rules for quotes, voice and the TF Script codes (from the short life-story prompt)
    const p = API().buildLifePrompt ? API().buildLifePrompt('—', '') : ''; const i = p.indexOf('## আয়াত/হাদিস'); return i >= 0 ? p.slice(i) : p;
  }
  function catRule(cat) {
    if (/নবী|সাহাবি/.test(cat)) return '- নবী বা সাহাবি কখনো পর্দার চরিত্র হবেন না, তাঁদের মুখে বানানো সংলাপও নয়। তাঁদের ঘটনা কথক বলবে; পর্দায় থাকবে জায়গা, প্রকৃতি, জিনিস আর সাধারণ মানুষ (যেমন গ্রামের লোক, পথিক)। ঘটনা শুধু কুরআন ও সহিহ হাদিসে যা আছে — নিজে থেকে ঘটনা বানাবে না; অনিশ্চিত হলে সেটা বাদ দাও।';
    if (/কুরআনের|হাদিসের|ইতিহাস/.test(cat)) return '- মূল ঘটনা কুরআন/সহিহ হাদিস/নির্ভরযোগ্য ইতিহাস থেকে; বানানো অংশ শুধু সাধারণ মানুষের আবেগ ও পরিবেশ বোঝাতে, মূল ঘটনা বদলাবে না।';
    return '- আজকের সাধারণ মানুষের জীবনের গল্প (পরিবার, রুজি, পড়াশোনা, প্রবাস, অসুখ), যেখানে চরিত্র কুরআন-হাদিসের শিক্ষায় ফিরে আসে।';
  }
  function longPrompt(o) {
    const mins = Math.max(4, Math.min(20, +o.mins || 10)), lines = Math.round(mins * 16), sr = o.of > 1;
    const head = `তুমি একজন দক্ষ বাংলা ইসলামিক গল্পকার ও ইউটিউব স্ক্রিপ্ট লেখক। "${S.series || 'প্রশান্তির বার্তা'}" চ্যানেলের জন্য প্রায় ${bn(mins)} মিনিটের একটা লং ভিডিওর (ইউটিউব, ১৬:৯) স্ক্রিপ্ট লেখো।${sr ? ` এটা "${o.stitle}" ধারাবাহিকের পর্ব ${bn(o.part)} (মোট ${bn(o.of)} পর্ব)।` : ''}

## বিষয়
- ধরন: ${o.cat}
- বিষয়/ভাবনা: ${o.topic || 'তুমি বেছে নাও — শিক্ষণীয়, আবেগময়, চেনা জীবনের'}
${catRule(o.cat)}
${sr ? `
## পুরো ধারাবাহিকের পরিকল্পনা (এর বাইরে যাবে না)
${o.outline.map((x, i) => `পর্ব ${bn(i + 1)}: ${x.t} — ${x.s}`).join('\n')}

## এই পর্ব (পর্ব ${bn(o.part)}: ${o.outline[o.part - 1].t})
- এই পর্বে শুধু এটুকু ঘটবে: ${o.outline[o.part - 1].s}
${o.part > 1 ? `- শুরুর ২০-৩০ সেকেন্ডে আগের পর্বের ছোট সারাংশ ("আগের পর্বে আমরা দেখেছি…"), তারপর গল্প এগোবে।` : '- শুরুতেই একটা জোরালো হুক, যাতে দর্শক পুরো ধারাবাহিক দেখতে চায়।'}
${o.part < o.of ? `- শেষে একটা টানটান মোড়ে থামবে (cliffhanger) — প্রশ্ন রেখে যাবে, উত্তর দেবে না।
- শেষ দৃশ্য "## cta | পর্ব ${bn(o.part + 1)}-এ কী হবে বলে মনে হয়? | বিকল্প ১, বিকল্প ২": পরের পর্বের এক লাইনের টিজার ("পর্ব ${bn(o.part + 1)}-এ: ${o.outline[o.part].t}"), তারপর "পরের পর্ব মিস করতে না চাইলে এখনই চ্যানেলটা সাবস্ক্রাইব করুন, বেল আইকন চাপুন, আর ফেসবুকে পেজটা ফলো করে রাখুন।" আর "কমেন্টে লিখুন, কী হবে বলে মনে হয়?"` : `- এটা শেষ পর্ব: গল্পের পূর্ণ সমাধান, শিক্ষা ("## takeaways"), তারপর "## cta": "পুরো ধারাবাহিকটা কেমন লাগল, কমেন্টে লিখুন। এমন আরও ধারাবাহিক গল্পের জন্য চ্যানেলটা সাবস্ক্রাইব করুন।"`}
${mins <= 6 ? `- মাঝারি ধারাবাহিক (প্রতি পর্ব ~৫ মিনিট): অন্তত একটা অপ্রত্যাশিত টুইস্ট রাখো। শেষের আগে একটা "## sky day normal | কুইজ |" দৃশ্য দাও: ঘটনা বা আয়াত/হাদিস থেকে ক/খ/গ তিন বিকল্পের একটা প্রশ্ন, "কমেন্টে শুধু ক, খ বা গ লিখুন, উত্তর পরের পর্বে"।${o.part > 1 ? ' সারাংশের ঠিক পরে আগের পর্বের কুইজের সঠিক উত্তর বলো।' : ' শুরুতেই দর্শককে একটা প্রশ্ন করো, যার উত্তর শেষ পর্বে মিলবে, আর কমেন্টে আন্দাজ লিখতে বলো।'} লাইক, শেয়ার (কাকে শেয়ার করবে বলে দাও), সাবস্ক্রাইব-বেল আর কমেন্টের ডাক ছোট ছোট লাইনে।` : ''}
${o.chars ? `- আগের পর্বের চরিত্রগুলোই রাখো, একই কোড ও নাম: চরিত্র: ${o.chars}` : ''}
- শিরোনাম: "=== ${o.stitle} | পর্ব ${bn(o.part)}: <এই পর্বের নাম>"; ইউটিউব টাইটেলেও "পর্ব ${bn(o.part)}" থাকবে।` : ''}

## লং ভিডিওর নিয়ম (নিচের ফরম্যাটের চেয়ে এগুলো অগ্রাধিকার পাবে)
${API().CINEMA_RULES || ''}
- মোট প্রায় ${bn(Math.round(lines * .9))}-${bn(Math.round(lines * 1.1))}টা লাইন (ayah দৃশ্যের লাইন বাদে), ২০-৪০টা দৃশ্য, প্রতি দৃশ্যে ৩-১০ লাইন। একই জায়গা পরপর দুই দৃশ্যে নয়।
- ৩-৫টা অধ্যায়: "## chapter | অধ্যায় ১ | অধ্যায়ের নাম" দিয়ে ভাগ করো।
- গল্পের ভেতরে ২-৪টা আলাদা "## ayah" দৃশ্য (প্রতিটায় নিজের "উৎস:" লাইন) — যেখানে আয়াত/হাদিসটা গল্পের মোড় ঘোরায়। শুধু সেই আয়াত দেবে যার সূরা ও আয়াত নম্বর তুমি নিশ্চিত জানো।
- শেষের আগে "## takeaways" (৩-৫টা শিক্ষা), শেষে "## cta"।
- শিরোনামের ঠিক পরের লাইনে হুবহু: "ফরম্যাট: long | life" আর "ক্ষেত্র: ${o.cat}"। একটা "ইউটিউব টাইটেল:" লাইন দাও। হ্যাশট্যাগে #Shorts দেবে না।
- পুরো স্ক্রিপ্ট শেষ পর্যন্ত লিখবে (শেষ লাইন "## cta" দৃশ্যের), মাঝপথে থামবে না।

${rulesTail()}`;
    return head;
  }
  function planPrompt(o) {
    return `তুমি একজন দক্ষ বাংলা ইসলামিক গল্পকার। "${S.series || 'প্রশান্তির বার্তা'}" ইউটিউব চ্যানেলের জন্য একটা ধারাবাহিক গল্পের পরিকল্পনা বানাও — মোট ${bn(o.of)} পর্ব, প্রতি পর্ব প্রায় ${bn(o.mins)} মিনিট।
- ধরন: ${o.cat}
- বিষয়/ভাবনা: ${o.topic || 'তুমি বেছে নাও — শিক্ষণীয়, আবেগময়'}
${catRule(o.cat)}
- প্রতিটা পর্বে নিজের একটা ছোট মোড় থাকবে, আর শেষ পর্ব ছাড়া প্রতিটা পর্ব একটা টানটান প্রশ্নে থামবে, যাতে দর্শক পরের পর্বের অপেক্ষায় থাকে। শেষ পর্বে পূর্ণ সমাধান ও শিক্ষা।
শুধু এই JSON দাও, আর কিছু না:
{"title": "ধারাবাহিকের নাম (৩-৭ শব্দ)", "parts": [{"t": "পর্বের নাম", "s": "এই পর্বে কী ঘটে, ২-৩ বাক্যে, শেষ মোড়সহ"}]}`;
  }

  /* ---------- writing ---------- */
  const clean = x => String(x || '').replace(/```[a-z]*\s*/gi, '').trim();
  function fixHead(t, cat) { // make sure the script says it is long and carries its category
    let L = clean(t).split('\n'); const ti = L.findIndex(l => /^\s*===/.test(l)); if (ti < 0) throw new Error('স্ক্রিপ্টে শিরোনাম (===) নেই');
    L = L.slice(ti).filter(l => !/^\s*(ফরম্যাট|ক্ষেত্র)\s*[:：]/.test(l)); L.splice(1, 0, 'ফরম্যাট: long | life', 'ক্ষেত্র: ' + cat); return L.join('\n');
  }
  async function keep(id, tx, cat, open) {
    let t = fixHead((splitStories(tx)[0] || tx), cat); validateStory(t);
    t = await API().verifyQuran(t, null);
    const old = USERLIB.find(u => u.id === id); if (old) USERLIB.splice(USERLIB.indexOf(old), 1);
    USERLIB.push({ id, txt: t, at: Date.now() }); await saveUserLib(); updateMyLibInfo();
    if (open && await loadAny(t, { libId: id })) { app.libId = id; autosave(); }
    return t;
  }
  function needKey(ai) { if (ai === 'chat') return false; if (!getKey(ai === 'claude' ? 'aKey' : 'gKey')) { toast(`আগে সেটিংসে ${ai === 'claude' ? 'Claude' : 'Gemini'} API key দিন — অথবা "ChatGPT-এ কপি" বাছুন`, 'err', 7000); openSettings('key'); return true; } return false; }
  async function run(label, fn) {
    const A = API(); if (A.isBusy && A.isBusy()) { A.busyToast(); return; }
    A.setBusy('long'); render();
    try { await fn(); } catch (e) { console.error(e); A.setStat(e.message, 'err'); toast(e.message, 'err', 8000); }
    finally { A.setBusy(false); render(); }
  }
  /* ChatGPT route: copy the prompt, paste the answer back */
  function viaChat(title, prompt, then) { PEND = { prompt, then }; const b = $('islLChat'); b.classList.remove('hidden'); $('islLChatT').textContent = title; $('islLChatIn').value = ''; copyText(prompt, 'প্রম্পট কপি হয়েছে — ChatGPT/Gemini-এ দিন, উত্তরটা নিচে পেস্ট করুন'); b.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

  function form() { return { cat: $('islLCat').value, topic: $('islLTopic').value.trim(), mins: +$('islLMin').value || 10, of: +$('islLParts').value || 3, pmins: +$('islLPMin').value || 8 }; }
  function writeSingle() {
    const f = form(), ai = API().whichAI(), id = 'isl_long_' + Date.now().toString(36), prompt = longPrompt({ cat: f.cat, topic: f.topic, mins: f.mins, of: 1 });
    if (ai === 'chat') return viaChat('নতুন লং গল্প — ' + f.cat, prompt, async tx => { await keep(id, tx, f.cat, true); toast('গল্প তৈরি — দৃশ্য দেখে কণ্ঠ দিন', 'ok', 6000); });
    if (needKey(ai)) return;
    run('single', async () => {
      API().setStat(`${ai === 'claude' ? 'Claude' : 'Gemini'} ${bn(f.mins)} মিনিটের গল্প লিখছে… (১-৩ মিনিট)`);
      const tx = await aiLong(prompt, ai, {}, s => API().setStat(s)); await keep(id, tx, f.cat, true);
      API().setStat('✓ লং গল্প লাইব্রেরিতে রাখা হয়েছে', 'ok'); toast('গল্প তৈরি — দৃশ্য দেখে কণ্ঠ দিন', 'ok', 6000);
    });
  }
  async function savePlan(tx, f) {
    const m = clean(tx).match(/\{[\s\S]*\}/); let j = null; try { j = JSON.parse(m ? m[0] : ''); } catch (e) { }
    if (!j || !Array.isArray(j.parts) || j.parts.length < 2) throw new Error('পরিকল্পনা পড়া গেল না — আবার চেষ্টা করুন');
    const plan = { title: String(j.title || f.topic || 'ধারাবাহিক').trim(), cat: f.cat, topic: f.topic, mins: f.pmins, parts: j.parts.slice(0, 12).map(x => ({ t: String(x.t || '').trim(), s: String(x.s || '').trim() })) };
    const id = 'isl_ser_' + Date.now().toString(36);
    USERLIB.push({ id, txt: `=== ${plan.title}\nফরম্যাট: series-plan\n${JSON.stringify(plan)}`, at: Date.now() }); await saveUserLib(); updateMyLibInfo();
    OPEN.add(id); toast(`"${plan.title}" — ${bn(plan.parts.length)} পর্বের পরিকল্পনা তৈরি। এবার পর্ব ১ লিখুন।`, 'ok', 7000);
  }
  function makePlan() {
    const f = form(), ai = API().whichAI(), prompt = planPrompt({ cat: f.cat, topic: f.topic, of: f.of, mins: f.pmins });
    if (ai === 'chat') return viaChat('ধারাবাহিকের পরিকল্পনা', prompt, async tx => { await savePlan(tx, f); });
    if (needKey(ai)) return;
    run('plan', async () => { API().setStat('পর্বগুলোর পরিকল্পনা হচ্ছে…'); await savePlan(await aiComplete(prompt, ai), f); API().setStat(''); });
  }
  function writePart(sid, k) {
    const pu = USERLIB.find(u => u.id === sid), plan = pu && planOf(pu); if (!plan) return;
    const prev = USERLIB.find(u => u.id === partId(sid, k - 1)) || USERLIB.find(u => u.id === partId(sid, 1));
    const chars = prev ? ((prev.txt.match(/^\s*চরিত্র\s*[:：]\s*(.*)$/m) || [, ''])[1] || '').trim() : '';
    const prompt = longPrompt({ cat: plan.cat, topic: plan.topic, mins: plan.mins, of: plan.parts.length, part: k, outline: plan.parts, stitle: plan.title, chars });
    const id = partId(sid, k), done = async tx => { await keep(id, tx, plan.cat, true); toast(`পর্ব ${bn(k)} তৈরি — দৃশ্য দেখে কণ্ঠ দিন`, 'ok', 6000); };
    const ai = API().whichAI();
    if (ai === 'chat') return viaChat(`${plan.title} — পর্ব ${bn(k)}`, prompt, done);
    if (needKey(ai)) return;
    run('part', async () => { API().setStat(`পর্ব ${bn(k)} লেখা হচ্ছে… (১-৩ মিনিট)`); await done(await aiLong(prompt, ai, {}, s => API().setStat(s))); API().setStat(`✓ পর্ব ${bn(k)} লাইব্রেরিতে রাখা হয়েছে`, 'ok'); });
  }
  async function openItem(u) {
    const A = API(); if (A.isBusy && A.isBusy()) { A.busyToast(); return; }
    const txt = await A.verifyQuran(u.txt, u.id); await loadLib({ id: u.id, txt }); render();
  }
  async function del(id, what) {
    if (!confirm(`${what} মুছে ফেলবেন?`)) return;
    for (let i = USERLIB.length - 1; i >= 0; i--) if (USERLIB[i].id === id || USERLIB[i].id.startsWith(id + '_p')) USERLIB.splice(i, 1);
    await saveUserLib(); updateMyLibInfo(); render();
  }

  /* ---------- UI ---------- */
  const OPEN = new Set();
  function init() {
    if (inited || !$('libList')) return; inited = true;
    const fp = $('fmtPick');
    if (fp) {
      fp.classList.remove('hidden');
      const sp = fp.querySelector('[data-fmt="short"] span'), lp = fp.querySelector('[data-fmt="long"] span');
      if (sp) sp.textContent = 'রিলস · শর্টস · ১-৩ মিনিট'; if (lp) lp.textContent = 'ইউটিউব · একক গল্প বা পর্বে পর্বে';
      fp.addEventListener('click', e => { const b = e.target.closest('button[data-fmt]'); if (!b) return; S.vidFmt = b.dataset.fmt; saveSettings(); syncFmt(); API().islRenderLib(); });
    }
    const opt = (v, t) => el('option', { value: v, text: t });
    const box = el('div', { id: 'islLongBox', class: 'isllong hidden' },
      el('nav', { class: 'seg sub small', id: 'islLKind' }, ...[['single', 'একক লং গল্প'], ['series', 'ধারাবাহিক (পর্বে পর্বে)']].map(([v, t]) => el('button', { type: 'button', 'data-k': v, text: t }))),
      el('nav', { class: 'seg sub small', id: 'islLSerLen' }, ...[['big', 'বড় ধারাবাহিক (পর্ব ~৮ মিনিট)'], ['mid', 'মাঝারি ধারাবাহিক (৩ পর্ব × ~৫ মিনিট)']].map(([v, t]) => el('button', { type: 'button', 'data-l': v, text: t }))),
      el('details', { id: 'islLNew', class: 'isl-form' },
        el('summary', { id: 'islLNewS', text: '＋ নতুন লং গল্প লেখান' }),
        el('label', null, 'ধরন', el('select', { id: 'islLCat' }, ...CATS.map(c => opt(c, c)))),
        el('label', null, 'বিষয় বা ভাবনা (ঐচ্ছিক)', el('textarea', { id: 'islLTopic', rows: 2, placeholder: 'যেমন: হারাম রুজি ছেড়ে হালালে ফেরা এক দোকানির গল্প / ইউসুফ (আ.)-এর ধৈর্য' })),
        el('div', { class: 'grid3', id: 'islLSingle' }, el('label', null, 'দৈর্ঘ্য', el('select', { id: 'islLMin' }, ...[5, 8, 10, 12, 15].map(n => opt(n, `${bn(n)} মিনিট`))))),
        el('div', { class: 'grid3', id: 'islLSeries' },
          el('label', null, 'মোট পর্ব', el('select', { id: 'islLParts' }, ...[2, 3, 4, 5, 6, 8].map(n => opt(n, `${bn(n)}টা`)))),
          el('label', null, 'প্রতি পর্বের দৈর্ঘ্য', el('select', { id: 'islLPMin' }, ...[5, 6, 8, 10, 12, 15].map(n => opt(n, `${bn(n)} মিনিট`))))),
        el('p', { class: 'muted sm', id: 'islLNote' }),
        el('button', { type: 'button', class: 'primary wide', id: 'islLGo' })),
      el('div', { id: 'islLChat', class: 'hidden isl-form' },
        el('b', { id: 'islLChatT' }),
        el('p', { class: 'muted sm', text: '১) প্রম্পট কপি হয়েছে — ChatGPT/Gemini/Claude-এ দিন। ২) পুরো উত্তর কপি করে নিচে পেস্ট করুন। ৩) "বানান" চাপুন।' }),
        el('div', { class: 'row' }, el('button', { type: 'button', class: 'ghost sm', text: 'আবার কপি', onclick: () => PEND && copyText(PEND.prompt, 'প্রম্পট কপি হয়েছে') }), el('button', { type: 'button', class: 'ghost sm', text: 'বন্ধ', onclick: () => { PEND = null; $('islLChat').classList.add('hidden'); } })),
        el('textarea', { id: 'islLChatIn', rows: 4, placeholder: 'AI-এর উত্তর এখানে পেস্ট করুন' }),
        el('button', { type: 'button', class: 'primary wide', text: 'বানান', onclick: async () => { if (!PEND) return; const tx = $('islLChatIn').value.trim(); if (!tx) { toast('আগে উত্তর পেস্ট করুন', 'err'); return; } const p = PEND; try { await p.then(tx); PEND = null; $('islLChat').classList.add('hidden'); render(); } catch (e) { toast(e.message, 'err', 8000); } } })));
    const ul = $('libList'); ul.parentNode.insertBefore(box, ul);
    $('islLMin').value = '10'; $('islLParts').value = '3'; $('islLPMin').value = '8';
    $('islLKind').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (!b) return; S.islLongKind = b.dataset.k; saveSettings(); render(); });
    $('islLSerLen').addEventListener('click', e => { const b = e.target.closest('button[data-l]'); if (!b) return; S.islSerLen = b.dataset.l; saveSettings(); $('islLParts').value = '3'; $('islLPMin').value = b.dataset.l === 'mid' ? '5' : '8'; render(); });
    if (serLen() === 'mid') $('islLPMin').value = '5';
    $('islLGo').onclick = () => (kind() === 'series' ? makePlan() : writeSingle());
    syncFmt();
  }
  function syncFmt() { const L = isLongMode(); document.querySelectorAll('#fmtPick button[data-fmt]').forEach(b => b.classList.toggle('on', b.dataset.fmt === (L ? 'long' : 'short'))); }
  /* short mode: hide the long box, show the short-only tools again */
  function shortMode() { init(); syncFmt(); const b = $('islLongBox'); if (b) b.classList.add('hidden'); toggleShortTools(true); }
  function toggleShortTools(on) {
    ['islBulk', 'islSelBar'].forEach(id => { const x = $(id); if (x) x.style.display = on ? '' : 'none'; });
    const lb = $('libBook'); if (lb) lb.style.display = on ? '' : 'none';
  }
  function render() {
    init(); syncFmt(); toggleShortTools(false);
    const ul = $('libList'); if (!ul) return; ul.innerHTML = '';
    const K = kind(), busy = API().isBusy && API().isBusy(); $('islLongBox').classList.remove('hidden');
    document.querySelectorAll('#islLKind button').forEach(b => b.classList.toggle('on', b.dataset.k === K));
    $('islLSingle').classList.toggle('hidden', K !== 'single'); $('islLSeries').classList.toggle('hidden', K !== 'series');
    const MID = K === 'series' && serLen() === 'mid'; $('islLSerLen').classList.toggle('hidden', K !== 'series');
    document.querySelectorAll('#islLSerLen button').forEach(b => b.classList.toggle('on', b.dataset.l === serLen()));
    $('islLNewS').textContent = K === 'series' ? (MID ? '＋ নতুন মাঝারি ধারাবাহিক বানান' : '＋ নতুন ধারাবাহিক বানান') : '＋ নতুন লং গল্প লেখান';
    $('islLGo').textContent = K === 'series' ? 'পর্বগুলোর পরিকল্পনা বানান' : 'গল্প লিখুন'; $('islLGo').disabled = !!busy;
    $('islLNote').textContent = MID ? 'মাঝারি ধারাবাহিক: ৩ পর্ব, প্রতি পর্ব ~৫ মিনিট। প্রতি পর্বে টুইস্ট, ক/খ/গ কুইজ (উত্তর পরের পর্বে), শেষে পরের পর্বের টানটান প্রশ্ন আর সাবস্ক্রাইব-কমেন্টের ডাক থাকবে।' : K === 'series' ? 'আগে AI পুরো গল্পটা পর্বে ভাগ করে পরিকল্পনা দেবে, তারপর প্রতিটা পর্ব আলাদা করে লিখবেন। প্রতি পর্বের শেষে থাকবে "পরের পর্ব আসছে — সাবস্ক্রাইব/ফলো করুন"।' : 'আয়াত/হাদিসের আসল লেখা অ্যাপ নিজে বসাবে; AI শুধু গল্প লিখবে। ভিডিও হবে ১৬:৯ (ইউটিউব)।';
    const f = $('libFilter').value, wantUsed = f === 'used' || f === 'hist', q = ($('libSearch').value || '').trim().toLowerCase();
    const used = id => API().usedId(id), match = s => !q || String(s).toLowerCase().includes(q);
    const mine = USERLIB.filter(u => /^isl_long_/.test(u.id) && LONG_RE.test(u.txt)).slice().reverse(), have = new Set(mine.map(u => u.id));
    const singles = mine.concat((window.ISL_LONG_STORIES || []).filter(x => !have.has(x.id)).map(x => ({ id: x.id, txt: x.txt, pre: true })));
    const plans = USERLIB.filter(u => /^isl_ser_[^_]+$/.test(u.id) && PLAN_RE.test(u.txt)).slice().reverse().concat(preSeries()).filter(p => { const pl = planOf(p); return pl && isMidPlan(pl) === MID; });
    // chips: নতুন / ব্যবহৃত — a series counts as used when every written part is used
    const serUsed = p => { const pl = planOf(p); if (!pl) return false; const ws = pl.parts.map((_, i) => findPart(p.id, i + 1)).filter(Boolean); return ws.length === pl.parts.length && ws.every(u => used(u.id)); };
    const items = K === 'series' ? plans : singles, isUsed = K === 'series' ? serUsed : u => used(u.id);
    const nU = items.filter(isUsed).length; const a = $('libNewN'), b = $('libUsedN'); if (a) a.textContent = bn(items.length - nU); if (b) b.textContent = bn(nU);
    document.querySelectorAll('#libChips .lchip[data-lt]').forEach(c => { const on = c.dataset.lt === (wantUsed ? 'used' : f === 'new' ? 'new' : ''); c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); });
    const list = items.filter(u => (f === 'all' || f === 'ready' || f === 'todo' || isUsed(u) === wantUsed) && match(u.txt.slice(0, 400)));
    $('libCount').textContent = K === 'series' ? `${bn(list.length)}টা ${MID ? 'মাঝারি ' : ''}ধারাবাহিক দেখাচ্ছে` : `${bn(list.length)}টা লং গল্প দেখাচ্ছে`;
    const frag = document.createDocumentFragment();
    if (K === 'single') list.forEach((u, i) => {
      const us = used(u.id);
      frag.append(el('li', { class: (app.libId === u.id ? 'cur' : '') + (us ? ' usedrow' : ''), onclick: e => { if (e.target.closest('.del')) return; openItem(u); } },
        el('span', { class: 'no', text: bn(i + 1) }), el('span', { class: 't' }, el('b', { text: titleOf(u.txt) }), el('span', { text: `${catOf(u.txt) || 'লং'} · প্রায় ${bn(minsOf(u.txt))} মিনিট` })),
        el('span', { class: 'islside' }, el('button', { type: 'button', class: 'islst del ' + (us ? 'ok used' : 'ok2'), title: us ? 'ব্যবহৃত — চাপলে টিক উঠে যাবে' : 'ভিডিও বানানো হলে এখানে টিক দিন', text: us ? '✓' : '○', onclick: e => { e.stopPropagation(); API().toggleUsed(u.id); render(); } })),
        u.pre ? el('span', { class: 'islre', title: 'বিল্ট-ইন গল্প', text: '📌' }) : el('button', { type: 'button', class: 'islre del', title: 'মুছুন', 'aria-label': 'মুছুন', text: '🗑', onclick: e => { e.stopPropagation(); del(u.id, `"${titleOf(u.txt)}"`); } })));
    });
    else list.forEach((p, i) => {
      const pl = planOf(p); if (!pl) return; const n = pl.parts.length, ws = pl.parts.map((_, k) => findPart(p.id, k + 1));
      const nW = ws.filter(Boolean).length, nUs = ws.filter(u => u && used(u.id)).length, open = OPEN.has(p.id);
      frag.append(el('li', { class: 'islser' + (open ? ' open' : ''), onclick: e => { if (e.target.closest('.del')) return; open ? OPEN.delete(p.id) : OPEN.add(p.id); render(); } },
        el('span', { class: 'no', text: bn(n) + ' পর্ব' }), el('span', { class: 't' }, el('b', { text: pl.title }), el('span', { text: `${pl.cat} · প্রতি পর্ব ~${bn(pl.mins)} মিনিট · লেখা ${bn(nW)}/${bn(n)} · ব্যবহৃত ${bn(nUs)}` })),
        el('span', { class: 'islside' }, el('span', { class: 'islst', text: open ? '▾' : '▸' })),
        (p.pre ? el('span', { class: 'islre', title: 'বিল্ট-ইন ধারাবাহিক', text: '📌' }) : el('button', { type: 'button', class: 'islre del', title: 'পুরো ধারাবাহিক মুছুন', 'aria-label': 'মুছুন', text: '🗑', onclick: e => { e.stopPropagation(); del(p.id, `"${pl.title}" ধারাবাহিকের সব পর্ব`); } }))));
      if (!open) return;
      pl.parts.forEach((x, k) => {
        const u = ws[k], us = u && used(u.id), canWrite = !u && (k === 0 || ws[k - 1]);
        frag.append(el('li', { class: 'islpart' + (u && app.libId === u.id ? ' cur' : '') + (us ? ' usedrow' : '') + (!u ? ' todorow' : ''), onclick: e => { if (e.target.closest('.del')) return; if (u) openItem(u); else if (canWrite) writePart(p.id, k + 1); else toast(`আগে পর্ব ${bn(k)} লিখুন`); } },
          el('span', { class: 'no', text: bn(k + 1) }), el('span', { class: 't' }, el('b', { text: `পর্ব ${bn(k + 1)}: ${x.t}` }), el('span', { text: u ? `প্রায় ${bn(minsOf(u.txt))} মিনিট · ${k < n - 1 ? 'শেষে পর্ব ' + bn(k + 2) + '-এর ডাক' : 'শেষ পর্ব'}` : (canWrite ? '✍ চাপ দিন — এই পর্ব লেখা হবে' : 'আগের পর্ব লেখা হলে লেখা যাবে') })),
          el('span', { class: 'islside' }, u ? el('button', { type: 'button', class: 'islst del ' + (us ? 'ok used' : 'ok2'), title: us ? 'ব্যবহৃত' : 'ভিডিও বানানো হলে টিক দিন', text: us ? '✓' : '○', onclick: e => { e.stopPropagation(); API().toggleUsed(u.id); render(); } }) : el('span', { class: 'islst todo', text: busy ? '…' : '✍' })),
          u && !u.pre ? el('button', { type: 'button', class: 'islre del', title: 'নতুন করে লিখুন', 'aria-label': 'নতুন করে লিখুন', text: '↻', onclick: e => { e.stopPropagation(); if (confirm(`পর্ব ${bn(k + 1)} নতুন করে লিখবেন? আগের লেখা মুছে যাবে।`)) writePart(p.id, k + 1); } }) : null));
      });
    });
    if (!list.length) frag.append(el('li', { class: 'muted', text: K === 'series' ? (wantUsed ? 'কোনো ধারাবাহিক এখনো পুরো ব্যবহার হয়নি' : 'এখনো কোনো ধারাবাহিক নেই — ওপরে "＋ নতুন ধারাবাহিক বানান" চাপুন') : (wantUsed ? 'কোনো লং গল্প এখনো ব্যবহার হয়নি' : 'এখনো কোনো লং গল্প নেই — ওপরে "＋ নতুন লং গল্প লেখান" চাপুন') }));
    ul.append(frag);
    if (!list.length && !wantUsed) { const d = $('islLNew'); if (d) d.open = true; }
  }
  /* ---------- import from lib-studio.js (one or many single stories, or a whole series pasted from an outside AI) ---------- */
  async function importPack(pack, o) {
    o = o || {}; const V = API().verifyQuran, res = { singles: 0, parts: 0, series: [], bad: [] };
    for (const tx of pack.singles) {
      try { let t = fixHead(tx, o.cat || catOf(tx) || CATS[0]); validateStory(t); if (V) t = await V(t, null);
        USERLIB.push({ id: 'isl_long_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), txt: t, at: Date.now() }); res.singles++; }
      catch (e) { res.bad.push((titleOf(tx) || 'গল্প') + ': ' + e.message); }
    }
    for (const ser of pack.series) {
      const cat = o.cat || catOf((ser.parts[0] || {}).txt || '') || CATS[0];
      // same title already in the library → add the new parts to it (lets him paste part by part)
      let planU = USERLIB.find(u => /^isl_ser_[^_]+$/.test(u.id) && PLAN_RE.test(u.txt) && (planOf(u) || {}).title === ser.title);
      const sid = planU ? planU.id : 'isl_ser_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
      const plan = planU ? planOf(planU) : { title: ser.title, cat, topic: o.topic || '', mins: o.mins || 8, parts: [] };
      const total = Math.max(ser.total || 0, plan.parts.length, ...ser.parts.map(x => x.k));
      for (let k = 1; k <= total; k++) plan.parts[k - 1] = plan.parts[k - 1] || { t: 'পর্ব ' + bn(k), s: '' };
      for (const q of ser.parts) {
        try { let t = fixHead(q.txt, plan.cat || cat); validateStory(t); if (V) t = await V(t, null);
          const id = partId(sid, q.k), old = USERLIB.find(u => u.id === id); if (old) USERLIB.splice(USERLIB.indexOf(old), 1);
          USERLIB.push({ id, txt: t, at: Date.now() }); res.parts++;
          plan.parts[q.k - 1] = { t: q.t || plan.parts[q.k - 1].t, s: q.s || plan.parts[q.k - 1].s }; }
        catch (e) { res.bad.push(`${ser.title} পর্ব ${bn(q.k)}: ${e.message}`); }
      }
      const ptxt = `=== ${plan.title}\nফরম্যাট: series-plan\n${JSON.stringify(plan)}`;
      if (planU) planU.txt = ptxt; else USERLIB.push({ id: sid, txt: ptxt, at: Date.now() });
      OPEN.add(sid); res.series.push(plan.title);
    }
    await saveUserLib(); updateMyLibInfo(); render(); return res;
  }
  window.ISL_LONG = { render, shortMode, CATS, longPrompt, importPack };
})();
