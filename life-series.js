/* TF Story Studio — জীবন পাঠ (Story part) LONG library: একক লং গল্প / ধারাবাহিক (বড় · মাঝারি).
   Same idea as islamic/long.js, for the main story part (not Islamic, not explainer):
   - "একক লং গল্প" = the normal long library (renderLib), untouched.
   - "ধারাবাহিক" = one story told in parts, built for engagement: part 2+ opens with a recap (+ last part's quiz answer),
     every part but the last ends on a cliffhanger + next-part teaser + subscribe / follow / comment call.
     বড় = parts of ~8+ minutes, মাঝারি = 3 parts × ~5 minutes with a twist and a ক/খ/গ quiz in every part.
   Storage (USERLIB, synced like every own story; hidden from the normal library):
     plan   → id life_ser_<x>      txt "=== title\nফরম্যাট: series-plan\n{json}"
     part k → id life_ser_<x>_p<k> a normal long script
   Series come in from lib-studio.js (paste from Gemini/ChatGPT: importPack) or are written in-app with a key. */
(function () {
  'use strict';
  if (typeof S === 'undefined' || typeof TF_ISL === 'undefined' || TF_ISL || TF_EXP) return;
  const PLAN_RE = /^\s*ফরম্যাট\s*[:：]\s*series-plan/m, IS_SER = id => /^life_ser_/.test(String(id || ''));
  const titleOf = txt => ((String(txt).match(/^\s*===\s*(.*)$/m) || [, ''])[1] || '').split('|')[0].trim();
  const planOf = u => { try { return JSON.parse(String(u.txt).slice(String(u.txt).indexOf('{'))); } catch (e) { return null; } };
  const partId = (sid, k) => sid + '_p' + k;
  const minsOf = txt => { const n = String(txt).split('\n').filter(l => l.trim() && !/^\s*(##|===|(ফরম্যাট|ক্ষেত্র|ইউটিউব টাইটেল|থাম্বনেল|চরিত্র|বই|হ্যাশট্যাগ)\s*[:：])/.test(l)).map(l => l.replace(/\{[^}]*\}/g, '').replace(/^\s*\w+:\w+:\w+\s*>?/, '')).join(' ').split(/\s+/).filter(Boolean).length; return Math.max(1, Math.round(n / 110)); };
  const on = () => isLongMode() && S.lifeLongKind === 'series';
  const serLen = () => (S.lifeSerLen === 'mid' ? 'mid' : 'big'), isMid = pl => (+pl.mins || 8) <= 6;
  const plans = () => USERLIB.filter(u => /^life_ser_[^_]+$/.test(u.id) && PLAN_RE.test(u.txt));
  const findPart = (sid, k) => USERLIB.find(u => u.id === partId(sid, k));
  const used = id => usedList().includes('LIB:' + id);
  function toggleUsed(id) {
    const s = 'LIB:' + id, u = usedList(), i = u.indexOf(s);
    if (i >= 0) { u.splice(i, 1); try { localStorage.setItem(LK('tf_used'), JSON.stringify(u)); } catch (e) { } } else addUsed(s);
  }
  const OPEN = new Set(); let BUSY = false;

  /* keep series plans/parts out of the normal (single) libraries */
  const _items = libItems; libItems = function () { return _items.apply(this, arguments).filter(x => !IS_SER(x.id)); };
  const _render = renderLib; renderLib = function () { init(); sync(); if (on()) return render(); return _render.apply(this, arguments); };

  /* ---------- prompts ---------- */
  function engageRules(o) {
    const k = o.part, n = o.of, mid = o.mins <= 6;
    return [
      k > 1 ? `- শুরুর ২০-৩০ সেকেন্ডে "আগের পর্বে আমরা দেখেছি…" ২-৩ লাইনে${mid ? ', তারপর আগের পর্বের কুইজের সঠিক উত্তর ("গত পর্বের প্রশ্নের সঠিক উত্তর ছিল…, যারা ঠিক লিখেছেন তাদের অভিনন্দন")' : ''}।` : '- শুরুতেই জোরালো হুক, আর দর্শককে একটা প্রশ্ন ("আপনি হলে কী করতেন? কমেন্টে লিখুন"), যার উত্তর গল্পের শেষে মিলবে।',
      mid ? '- অন্তত একটা অপ্রত্যাশিত টুইস্ট। শেষের আগে একটা কুইজ দৃশ্য: গল্প থেকে ক/খ/গ তিন বিকল্পের প্রশ্ন, "কমেন্টে শুধু ক, খ বা গ লিখুন, সঠিক উত্তর পরের পর্বে"।' : '- পর্বের মাঝে অন্তত একটা বড় মোড়, যাতে দর্শক মাঝপথে চলে না যায়।',
      k < n ? `- শেষে টানটান মোড়ে থামবে (cliffhanger) — প্রশ্ন রেখে যাবে, উত্তর দেবে না। শেষ দৃশ্য "## cta": পরের পর্বের এক লাইনের টিজার${o.outline ? ` ("পর্ব ${bn(k + 1)}-এ: ${o.outline[k].t}")` : ''}, "পরের পর্ব মিস করতে না চাইলে এখনই চ্যানেলটা সাবস্ক্রাইব করুন, বেল আইকন চাপুন, আর ফেসবুক পেজটা ফলো করে রাখুন", "কমেন্টে লিখুন, এরপর কী হবে বলে মনে হয়?"`
        : '- এটা শেষ পর্ব: পূর্ণ সমাধান, তারপর "## takeaways" (৩-৫টা শিক্ষা), শেষে "## cta": "পুরো ধারাবাহিকটা কেমন লাগল, কমেন্টে লিখুন। গল্পটা যাকে দরকার তাকে শেয়ার করুন। এমন আরও ধারাবাহিক গল্পের জন্য সাবস্ক্রাইব আর পেজ ফলো করে রাখুন।"',
      '- লাইক, শেয়ার (কাকে শেয়ার করবে বলে দাও — যেমন "যে বন্ধু ধার দিয়ে বিপদে আছে"), কমেন্টের ডাক ছোট ছোট লাইনে, গল্পের ছন্দ না ভেঙে।'
    ].join('\n');
  }
  function partPrompt(plan, k, chars) {
    const o = Object.assign(longOpts(), { longStyle: plan.style || 'life', minutes: plan.mins, topic: [plan.topic, plan.cat ? 'ক্যাটাগরি: ' + plan.cat : ''].filter(Boolean).join(' — '), facts: '', link: '', book: '', author: '', lesson: '' });
    return `এটা "${plan.title}" ধারাবাহিকের পর্ব ${bn(k)} (মোট ${bn(plan.parts.length)} পর্ব)। প্রতি পর্ব প্রায় ${bn(plan.mins)} মিনিট।

## পুরো ধারাবাহিকের পরিকল্পনা (এর বাইরে যাবে না)
${plan.parts.map((x, i) => `পর্ব ${bn(i + 1)}: ${x.t}${x.s ? ' — ' + x.s : ''}`).join('\n')}

## এই পর্ব (পর্ব ${bn(k)}: ${plan.parts[k - 1].t})
- এই পর্বে শুধু এটুকু ঘটবে: ${plan.parts[k - 1].s || 'পরিকল্পনা মেনে'}
${engageRules({ part: k, of: plan.parts.length, mins: plan.mins, outline: plan.parts })}
${chars ? `- আগের পর্বের চরিত্রগুলোই রাখো, একই কোড ও নাম: চরিত্র: ${chars}` : ''}
- শিরোনাম হুবহু: "=== ${plan.title} | পর্ব ${bn(k)}: <এই পর্বের নাম>"; ইউটিউব টাইটেলেও "পর্ব ${bn(k)}" থাকবে।
- পুরো স্ক্রিপ্ট একটাই কোড ব্লকে, ব্লকের বাইরে কোনো কথা নয়।

---
${buildLongPrompt(o)}`;
  }
  function planPrompt(f) {
    return `তুমি একজন দক্ষ বাংলা গল্পকার ও ইউটিউব স্ক্রিপ্ট লেখক। "${S.series || 'জীবন পাঠ'}" চ্যানেলের জন্য একটা ধারাবাহিক গল্পের পরিকল্পনা বানাও — মোট ${bn(f.of)} পর্ব, প্রতি পর্ব প্রায় ${bn(f.mins)} মিনিট।
- ধরন: ${LONG_STYLE_BN[f.style] || 'জীবনের গল্প'}${f.cat ? ' · ' + f.cat : ''}
- বিষয়/ভাবনা: ${f.topic || 'তুমি বেছে নাও — চেনা জীবনের, শিক্ষণীয়, আবেগময়'}
- প্রতিটা পর্বে নিজের একটা মোড়, শেষ পর্ব ছাড়া প্রতিটা পর্ব টানটান প্রশ্নে থামবে, যাতে দর্শক পরের পর্বের অপেক্ষায় পেজ ফলো/সাবস্ক্রাইব করে রাখে। শেষ পর্বে পূর্ণ সমাধান ও শিক্ষা।
শুধু এই JSON দাও, আর কিছু না:
{"title": "ধারাবাহিকের নাম (৩-৭ শব্দ)", "parts": [{"t": "পর্বের নাম", "s": "এই পর্বে কী ঘটে, ২-৩ বাক্যে, শেষ মোড়সহ"}]}`;
  }

  /* ---------- writing / storing ---------- */
  const strip = x => String(x || '').replace(/```[a-z]*\s*/gi, '').trim();
  function fixHead(t, style, cat) {
    let L = strip(t).split('\n'); const ti = L.findIndex(l => /^\s*===/.test(l)); if (ti < 0) throw new Error('স্ক্রিপ্টে শিরোনাম (===) নেই');
    L = L.slice(ti).filter(l => !/^\s*ফরম্যাট\s*[:：]/.test(l) && !(cat && /^\s*ক্ষেত্র\s*[:：]/.test(l)));
    L.splice(1, 0, 'ফরম্যাট: long | ' + (style || 'life'), ...(cat ? ['ক্ষেত্র: ' + cat] : [])); return L.join('\n');
  }
  const ai = () => (S.aiTab === 'claude' ? 'claude' : 'gemini');
  const hasKey = () => !!getKey(ai() === 'claude' ? 'aKey' : 'gKey');
  async function run(msg, fn) {
    if (BUSY) { toast('একটা লেখা চলছে — একটু অপেক্ষা করুন'); return; }
    BUSY = true; toast(msg, '', 6000); render();
    try { await fn(); } catch (e) { console.error(e); toast(e.message, 'err', 8000); } finally { BUSY = false; render(); }
  }
  function form() { return { style: $('lifeSStyle').value || 'life', cat: '', topic: $('lifeSTopic').value.trim(), of: serLen() === 'mid' ? 3 : (+$('lifeSParts').value || 3), mins: serLen() === 'mid' ? 5 : (+$('lifeSMin').value || 8) }; }
  function makePlan() {
    const f = form();
    if (!hasKey()) { toast('অ্যাপের AI-এর key নেই — ওপরের "✍ Gemini দিয়ে লিখুন" থেকে Gemini দিয়ে পুরো ধারাবাহিক লিখিয়ে পেস্ট করুন', 'err', 9000); const x = $('xlsBox'); if (x) { x.open = true; x.scrollIntoView({ behavior: 'smooth' }); } return; }
    run('পর্বগুলোর পরিকল্পনা হচ্ছে…', async () => {
      const tx = await aiComplete(planPrompt(f), ai()), m = strip(tx).match(/\{[\s\S]*\}/); let j = null; try { j = JSON.parse(m ? m[0] : ''); } catch (e) { }
      if (!j || !Array.isArray(j.parts) || j.parts.length < 2) throw new Error('পরিকল্পনা পড়া গেল না — আবার চেষ্টা করুন');
      const plan = { title: String(j.title || f.topic || 'ধারাবাহিক').trim(), style: f.style, cat: f.cat, topic: f.topic, mins: f.mins, parts: j.parts.slice(0, 12).map(x => ({ t: String(x.t || '').trim(), s: String(x.s || '').trim() })) };
      const id = 'life_ser_' + Date.now().toString(36);
      USERLIB.push({ id, txt: `=== ${plan.title}\nফরম্যাট: series-plan\n${JSON.stringify(plan)}`, at: Date.now() }); await saveUserLib(); updateMyLibInfo();
      OPEN.add(id); toast(`"${plan.title}" — ${bn(plan.parts.length)} পর্বের পরিকল্পনা তৈরি। এবার পর্ব ১-এ চাপ দিন।`, 'ok', 7000);
    });
  }
  function writePart(sid, k) {
    const pu = USERLIB.find(u => u.id === sid), plan = pu && planOf(pu); if (!plan) return;
    const prev = findPart(sid, k - 1) || findPart(sid, 1), chars = prev ? ((prev.txt.match(/^\s*চরিত্র\s*[:：]\s*(.*)$/m) || [, ''])[1] || '').trim() : '';
    const prompt = partPrompt(plan, k, chars);
    if (!hasKey()) { // no key: copy the prompt, the answer goes into the lib-studio paste box and joins this series by its title
      copyText(prompt, `পর্ব ${bn(k)}-এর প্রম্পট কপি হয়েছে — Gemini-তে দিন, উত্তর কপি করে ওপরের কার্ডে "পেস্ট করে লাইব্রেরিতে যোগ" চাপুন`);
      const x = $('xlsBox'); if (x) { x.open = true; x.scrollIntoView({ behavior: 'smooth' }); } return;
    }
    run(`পর্ব ${bn(k)} লেখা হচ্ছে… (১-৩ মিনিট)`, async () => {
      const tx = await aiLong(prompt, ai(), {}, () => { });
      let t = fixHead(splitStories(strip(tx))[0] || tx, plan.style, plan.cat); validateStory(t);
      const id = partId(sid, k), old = USERLIB.find(u => u.id === id); if (old) USERLIB.splice(USERLIB.indexOf(old), 1);
      USERLIB.push({ id, txt: t, at: Date.now() }); await saveUserLib(); updateMyLibInfo();
      if (await loadAny(t, { libId: id })) { app.libId = id; autosave(); }
      toast(`পর্ব ${bn(k)} তৈরি — দৃশ্য দেখে কণ্ঠ দিন`, 'ok', 6000);
    });
  }
  async function openPart(u) { if (await loadAny(u.txt, { libId: u.id })) { app.libId = u.id; autosave(); render(); } }
  async function del(id, what) {
    if (!confirm(`${what} মুছে ফেলবেন?`)) return;
    for (let i = USERLIB.length - 1; i >= 0; i--) if (USERLIB[i].id === id || USERLIB[i].id.startsWith(id + '_p')) USERLIB.splice(i, 1);
    await saveUserLib(); updateMyLibInfo(); render();
  }

  /* ---------- import (from lib-studio.js) ---------- */
  async function importPack(pack, o) {
    o = o || {}; const res = { singles: 0, parts: 0, series: [], bad: [] };
    for (const ser of pack.series) {
      let planU = plans().find(u => (planOf(u) || {}).title === ser.title); // same title → add parts to it (paste part by part)
      const sid = planU ? planU.id : 'life_ser_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
      const plan = planU ? planOf(planU) : { title: ser.title, style: o.style || 'life', cat: o.cat || '', topic: o.topic || '', mins: o.mins || 8, parts: [] };
      const total = Math.max(ser.total || 0, plan.parts.length, ...ser.parts.map(x => x.k));
      for (let k = 1; k <= total; k++) plan.parts[k - 1] = plan.parts[k - 1] || { t: 'পর্ব ' + bn(k), s: '' };
      for (const q of ser.parts) {
        try { const t = fixHead(q.txt, plan.style, plan.cat); validateStory(t);
          const id = partId(sid, q.k), old = USERLIB.find(u => u.id === id); if (old) USERLIB.splice(USERLIB.indexOf(old), 1);
          USERLIB.push({ id, txt: t, at: Date.now() }); res.parts++;
          plan.parts[q.k - 1] = { t: q.t || plan.parts[q.k - 1].t, s: q.s || plan.parts[q.k - 1].s }; }
        catch (e) { res.bad.push(`${ser.title} পর্ব ${bn(q.k)}: ${e.message}`); }
      }
      const ptxt = `=== ${plan.title}\nফরম্যাট: series-plan\n${JSON.stringify(plan)}`;
      if (planU) planU.txt = ptxt; else USERLIB.push({ id: sid, txt: ptxt, at: Date.now() });
      OPEN.add(sid); res.series.push(plan.title);
      S.lifeSerLen = isMid(plan) ? 'mid' : 'big';
    }
    if (pack.series.length) { S.lifeLongKind = 'series'; saveSettings(); }
    await saveUserLib(); updateMyLibInfo(); renderLib(); return res;
  }

  /* ---------- UI ---------- */
  let inited = false;
  function init() {
    if (inited || !$('libList')) return; inited = true;
    const opt = (v, t) => el('option', { value: v, text: t });
    const box = el('div', { id: 'lifeLongBox', class: 'hidden' },
      el('div', { class: 'life-row' },
        el('nav', { class: 'xls-seg', id: 'lifeKind' }, ...[['single', 'একক লং'], ['series', 'ধারাবাহিক']].map(([v, t]) => el('button', { type: 'button', 'data-k': v, text: t }))),
        el('nav', { class: 'xls-seg', id: 'lifeSerLen' }, ...[['big', 'বড়'], ['mid', 'মাঝারি']].map(([v, t]) => el('button', { type: 'button', 'data-l': v, text: t })))),
      el('details', { id: 'lifeSNew', class: 'xls' },
        el('summary', { id: 'lifeSNewS', text: '＋ অ্যাপের AI দিয়ে লিখুন (API key)' }),
        el('p', { class: 'muted sm', id: 'lifeSNote' }),
        el('label', null, 'ধরন', el('select', { id: 'lifeSStyle' }, ...Object.entries(LONG_STYLE_BN).map(([v, t]) => opt(v, t)))),
        el('label', null, 'বিষয় বা ভাবনা (ঐচ্ছিক)', el('textarea', { id: 'lifeSTopic', rows: 2, placeholder: 'যেমন: ধার দিয়ে বন্ধু হারানো / প্রবাসীর টাকায় গড়া বাড়ি' })),
        el('div', { class: 'grid3', id: 'lifeSBig' },
          el('label', null, 'মোট পর্ব', el('select', { id: 'lifeSParts' }, ...[2, 3, 4, 5, 6, 8].map(n => opt(n, `${bn(n)}টা`)))),
          el('label', null, 'প্রতি পর্ব', el('select', { id: 'lifeSMin' }, ...[6, 8, 10, 12, 15].map(n => opt(n, `${bn(n)} মিনিট`))))),
        el('button', { type: 'button', class: 'primary wide', id: 'lifeSGo', text: 'পর্বগুলোর পরিকল্পনা বানান' })));
    const ul = $('libList'); ul.parentNode.insertBefore(box, ul);
    const css = document.createElement('style'); css.textContent = '#lifeLongBox{margin:0 0 8px}#lifeSNew{margin-top:8px}#lifeSNew label{display:block;margin:6px 0}#lifeSNew select,#lifeSNew textarea{width:100%;box-sizing:border-box}'; document.head.append(css);
    $('lifeSParts').value = '3'; $('lifeSMin').value = '8';
    $('lifeKind').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (!b) return; S.lifeLongKind = b.dataset.k; saveSettings(); renderLib(); });
    $('lifeSerLen').addEventListener('click', e => { const b = e.target.closest('button[data-l]'); if (!b) return; S.lifeSerLen = b.dataset.l; saveSettings(); renderLib(); });
    $('lifeSGo').onclick = makePlan;
  }
  function sync() { // the kind switch only in the long library; the single list's own filters only outside series
    const b = $('lifeLongBox'); if (!b) return; const L = isLongMode(), ser = on();
    if (window.TF_LIBSTUDIO) TF_LIBSTUDIO.mount();
    b.classList.toggle('hidden', !L);
    document.querySelectorAll('#lifeKind button').forEach(x => x.classList.toggle('on', x.dataset.k === (ser ? 'series' : 'single')));
    $('lifeSerLen').classList.toggle('hidden', !ser); $('lifeSNew').classList.toggle('hidden', !ser || !hasKey());
    const ar = $('libArea'), mc = $('libMineChip'); if (ar) ar.style.display = ser ? 'none' : ''; if (ser && mc) mc.classList.add('hidden');
  }
  function render() {
    const ul = $('libList'); if (!ul) return; ul.innerHTML = ''; sync();
    const MID = serLen() === 'mid';
    document.querySelectorAll('#lifeSerLen button').forEach(b => b.classList.toggle('on', b.dataset.l === serLen()));
    $('lifeSBig').classList.toggle('hidden', MID); $('lifeSGo').disabled = BUSY;
    $('lifeSNote').textContent = MID ? '৩ পর্ব × ~৫ মিনিট, প্রতি পর্বে টুইস্ট ও কুইজ।' : 'আগে পর্বের পরিকল্পনা, তারপর পর্বে চাপলে লেখা হবে।';
    const tab = (LIBUI && LIBUI.tab) || 'new', wantUsed = tab === 'used', q = ($('libSearch').value || '').trim().toLowerCase();
    const serUsed = p => { const pl = planOf(p); if (!pl) return false; const ws = pl.parts.map((_, i) => findPart(p.id, i + 1)).filter(Boolean); return ws.length === pl.parts.length && ws.every(u => used(u.id)); };
    const items = plans().slice().reverse().filter(p => { const pl = planOf(p); return pl && isMid(pl) === MID; });
    const nU = items.filter(serUsed).length; $('libNewN').textContent = bn(items.length - nU); $('libUsedN').textContent = bn(nU);
    document.querySelectorAll('#libChips [data-lt]').forEach(c => { const o = c.dataset.lt === tab; c.classList.toggle('on', o); c.setAttribute('aria-pressed', String(o)); });
    const list = items.filter(p => serUsed(p) === wantUsed && (!q || p.txt.slice(0, 600).toLowerCase().includes(q)));
    $('libCount').textContent = bn(list.length);
    const frag = document.createDocumentFragment();
    list.forEach(p => {
      const pl = planOf(p), n = pl.parts.length, ws = pl.parts.map((_, k) => findPart(p.id, k + 1));
      const nW = ws.filter(Boolean).length, nUs = ws.filter(u => u && used(u.id)).length, open = OPEN.has(p.id);
      frag.append(el('li', { class: 'islser' + (open ? ' open' : ''), onclick: e => { if (e.target.closest('.del')) return; open ? OPEN.delete(p.id) : OPEN.add(p.id); render(); } },
        el('span', { class: 'no', text: bn(n) + ' পর্ব' }),
        el('span', { class: 't' }, el('b', { text: pl.title }), el('span', { text: `${LONG_STYLE_BN[pl.style] || 'জীবনের গল্প'}${pl.cat ? ' · ' + pl.cat : ''} · প্রতি পর্ব ~${bn(pl.mins)} মিনিট · লেখা ${bn(nW)}/${bn(n)} · ব্যবহৃত ${bn(nUs)}` })),
        el('span', { class: 'islside' }, el('span', { class: 'islst', text: open ? '▾' : '▸' })),
        el('button', { type: 'button', class: 'islre del', title: 'পুরো ধারাবাহিক মুছুন', 'aria-label': 'মুছুন', text: '🗑', onclick: e => { e.stopPropagation(); del(p.id, `"${pl.title}" ধারাবাহিকের সব পর্ব`); } })));
      if (!open) return;
      pl.parts.forEach((x, k) => {
        const u = ws[k], us = u && used(u.id), canWrite = !u && (k === 0 || ws[k - 1]);
        frag.append(el('li', { class: 'islpart' + (u && app.libId === u.id ? ' cur' : '') + (us ? ' usedrow' : '') + (!u ? ' todorow' : ''), onclick: e => { if (e.target.closest('.del')) return; if (u) openPart(u); else if (canWrite) writePart(p.id, k + 1); else toast(`আগে পর্ব ${bn(k)} লিখুন`); } },
          el('span', { class: 'no', text: bn(k + 1) }),
          el('span', { class: 't' }, el('b', { text: `পর্ব ${bn(k + 1)}: ${x.t}` }), el('span', { text: u ? `প্রায় ${bn(minsOf(u.txt))} মিনিট · ${k < n - 1 ? 'শেষে পর্ব ' + bn(k + 2) + '-এর ডাক' : 'শেষ পর্ব'}` : (canWrite ? (hasKey() ? '✍ চাপ দিন — এই পর্ব লেখা হবে' : '✍ চাপ দিন — প্রম্পট কপি হবে') : 'আগের পর্ব লেখা হলে লেখা যাবে') })),
          el('span', { class: 'islside' }, u ? el('button', { type: 'button', class: 'islst del ' + (us ? 'ok used' : 'ok2'), title: us ? 'ব্যবহৃত — চাপলে টিক উঠে যাবে' : 'ভিডিও বানানো হলে টিক দিন', text: us ? '✓' : '○', onclick: e => { e.stopPropagation(); toggleUsed(u.id); render(); } }) : el('span', { class: 'islst todo', text: BUSY ? '…' : '✍' })),
          u ? el('button', { type: 'button', class: 'islre del', title: 'নতুন করে লিখুন', 'aria-label': 'নতুন করে লিখুন', text: '↻', onclick: e => { e.stopPropagation(); if (confirm(`পর্ব ${bn(k + 1)} নতুন করে লিখবেন? আগের লেখা মুছে যাবে।`)) writePart(p.id, k + 1); } }) : null));
      });
    });
    if (!list.length) frag.append(el('li', { class: 'lib-empty', text: wantUsed ? 'কোনো ধারাবাহিক এখনো পুরো ব্যবহার হয়নি' : `এখনো কোনো ${MID ? 'মাঝারি ' : ''}ধারাবাহিক নেই — ওপরে "✍ Gemini দিয়ে লিখুন"` }));
    ul.append(frag);
  }

  window.LIFE_SER = { importPack, render: () => renderLib(), on, serLen };
  const start = () => { try { init(); renderLib(); } catch (e) { console.error('life series', e); } };
  if (document.readyState === 'complete') setTimeout(start, 200); else window.addEventListener('load', () => setTimeout(start, 200));
})();
