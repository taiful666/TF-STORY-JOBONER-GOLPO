/* ===================== TF Story Studio — ইসলামিক অংশ (কুরআন ও সহিহ হাদিসের গল্প-ভিডিও) =====================
   Loaded only for index.html?part=islamic, BEFORE the main script. It reuses the Story engine
   (steps, voice, music, export, share) and changes what is Islamic-specific:
   - library of real sources (Quran passages, Sahih al-Bukhari) — the exact text is always DOWNLOADED, never typed by AI
   - AI writes only the retelling; the app inserts the exact quote ("ayah" scene) with its reference
   - no people on screen: landscapes of the stories (desert, sea, cave, palace…) and text
   - its own settings, library and project (separate from the Story part); API keys are shared */
(function () {
  'use strict';
  if (!/[?&]part=islamic\b/.test(location.search)) return;

  /* ---------- first run: this part's own settings (voice/fonts copied from the Story part) ---------- */
  try {
    if (!localStorage.getItem('tf_isl_seeded')) {
      if (!localStorage.getItem('tf_isl_settings')) {
        let o = {}; try { o = JSON.parse(localStorage.getItem('tf_settings') || '{}') || {}; } catch (e) { }
        delete o.roleVoices;
        Object.assign(o, { series: 'প্রশান্তির বার্তা', tagline: 'কুরআন ও হাদিসের আলোয়', logo: 'প্র', music: 'none', sfx: false, pops: false, storyStyle: 'islamic', ctxBg: true, hookCard: true });
        localStorage.setItem('tf_isl_settings', JSON.stringify(o));
      }
      if (localStorage.getItem('tf_isl_logo') === null) {
        let v = null; try { const r = localStorage.getItem('tfpc_logo_islamic'); if (r !== null) v = JSON.parse(r); } catch (e) { }
        localStorage.setItem('tf_isl_logo', v === null ? 'islamic/logo-islamic.webp' : (v || ''));
      }
      localStorage.setItem('tf_isl_seeded', '1');
    }
  } catch (e) { }

  /* ---------- the library: real sources only ---------- */
  const G_PROPHET = 'নবীদের কাহিনি', G_QURAN = 'কুরআনের শিক্ষণীয় ঘটনা', G_HADITH = 'হাদিসের গল্প';
  const Q = (id, s, f, t, title, kw, group, place) => ({ id: 'q-' + id, kind: 'quran', s, f, t, title, kw, group: group || G_PROPHET, place: place || 'desert' });
  const HD = (n, title, kw, place) => ({ id: 'h-' + n, kind: 'hadith', book: 'bukhari', n, title, kw, group: G_HADITH, place: place || 'old_city' });
  const ISL_LIB = [
    Q('yusuf-dream', 12, 4, 6, 'ইউসুফ (আ.)-এর স্বপ্ন: এগারো তারা, সূর্য ও চাঁদ', /ইউসুফ|ইউসূফ/, G_PROPHET, 'night_sky'),
    Q('yusuf-well', 12, 8, 18, 'ভাইদের ষড়যন্ত্র ও অন্ধকার কূপ', /ইউসুফ|ইউসূফ|কূপ/, G_PROPHET, 'desert_well'),
    Q('yusuf-caravan', 12, 19, 22, 'কাফেলা, বিক্রি আর মিসরের নতুন ঘর', /কাফেলা|ইউসুফ|ইউসূফ/, G_PROPHET, 'desert_caravan'),
    Q('yusuf-test', 12, 23, 29, 'প্রলোভনের দরজায় ইউসুফ (আ.)', /ইউসুফ|ইউসূফ|দরজা/, G_PROPHET, 'palace_hall'),
    Q('yusuf-prison', 12, 33, 42, 'কারাগারে দুই সঙ্গীর স্বপ্ন', /কারাগার|জেল|স্বপ্ন/, G_PROPHET, 'prison_cell'),
    Q('yusuf-king', 12, 43, 49, 'বাদশাহর স্বপ্ন ও দুর্ভিক্ষের পরিকল্পনা', /বাদশাহ|গাভী|শীষ/, G_PROPHET, 'palace_hall'),
    Q('yusuf-brothers', 12, 58, 62, 'মিসরে ভাইদের আগমন', /ভাই|ইউসুফ|ইউসূফ/, G_PROPHET, 'old_market'),
    Q('yaqub-patience', 12, 83, 87, 'ইয়াকুব (আ.)-এর ধৈর্য ও আশা', /ধৈর্য|নিরাশ|ইউসুফ|ইউসূফ/, G_PROPHET, 'tent_camp'),
    Q('yusuf-forgive', 12, 88, 92, 'ভাইদের প্রতি ইউসুফ (আ.)-এর ক্ষমা', /ইউসুফ|ইউসূফ|ক্ষমা|অভিযোগ/, G_PROPHET, 'palace_hall'),
    Q('yusuf-reunion', 12, 93, 100, 'বাবার চোখে আলো, পরিবারের মিলন', /জামা|পিতা|ইউসুফ|ইউসূফ/, G_PROPHET, 'palace_hall'),
    Q('musa-basket', 28, 7, 13, 'নদীতে ভাসমান শিশু মূসা (আ.)', /মূসা|মুসা|দরিয়া|নদী/, G_PROPHET, 'river_reeds'),
    Q('musa-flee', 28, 15, 21, 'এক ঘুষি, অনুতাপ আর মিসর ছাড়া', /মূসা|মুসা/, G_PROPHET, 'old_city'),
    Q('musa-madyan', 28, 22, 28, 'মাদইয়ানের কূপের পাশে মূসা (আ.)', /মাদইয়ান|কূপ|মূসা|মুসা/, G_PROPHET, 'desert_well'),
    Q('musa-fire', 28, 29, 32, 'দূরের আগুন আর আল্লাহর ডাক', /আগুন|অগ্নি|মূসা|মুসা/, G_PROPHET, 'rocky_valley'),
    Q('musa-magicians', 20, 65, 73, 'জাদুকরদের ঈমান', /জাদু|যাদু/, G_PROPHET, 'palace_hall'),
    Q('musa-sea', 26, 60, 67, 'সাগরের বুকে শুকনো পথ', /সমুদ্র|সাগর|দরিয়া|মূসা|মুসা/, G_PROPHET, 'sea_shore'),
    Q('musa-calf', 20, 83, 97, 'সামেরির সোনার বাছুর', /বাছুর|সামেরী|সামিরী/, G_PROPHET, 'desert'),
    Q('musa-khidr-1', 18, 60, 70, 'মূসা (আ.) ও আল্লাহর এক জ্ঞানী বান্দা', /মূসা|মুসা|মাছ/, G_PROPHET, 'sea_shore'),
    Q('musa-khidr-2', 18, 71, 77, 'নৌকা ছিদ্র, বালক আর ভাঙা দেয়াল', /নৌকা|দেয়াল|প্রাচীর/, G_PROPHET, 'old_city'),
    Q('musa-khidr-3', 18, 78, 82, 'রহস্যের ব্যাখ্যা', /নৌকা|দেয়াল|প্রাচীর|বালক/, G_PROPHET, 'old_city'),
    Q('cow', 2, 67, 73, 'বনি ইসরাইলের গাভী', /গাভী|গরু/, G_QURAN, 'farm_field'),
    Q('qarun', 28, 76, 82, 'কারুনের ধন ও অহংকারের পরিণাম', /কারুন|কারূন/, G_QURAN, 'palace_hall'),
    Q('ibrahim-stars', 6, 74, 79, 'তারা, চাঁদ ও সূর্য দেখে সত্যের খোঁজ', /নক্ষত্র|তারকা|চন্দ্র|সূর্য/, G_PROPHET, 'night_sky'),
    Q('ibrahim-idols', 21, 51, 58, 'ইব্রাহিম (আ.) ও মূর্তির ঘর', /ইব্রাহীম|ইবরাহীম|ইব্রাহিম|মূর্তি/, G_PROPHET, 'ruined_town'),
    Q('ibrahim-fire', 21, 59, 70, 'আগুন হলো শীতল ও নিরাপদ', /আগুন|অগ্নি|ইব্রাহীম|ইবরাহীম/, G_PROPHET, 'great_fire'),
    Q('ibrahim-king', 2, 258, 258, 'বাদশাহর সামনে ইব্রাহিম (আ.)-এর যুক্তি', /ইব্রাহীম|ইবরাহীম|সূর্য/, G_PROPHET, 'palace_hall'),
    Q('ibrahim-birds', 2, 260, 260, 'চারটি পাখি ও জীবনদানের নিদর্শন', /পাখি|পক্ষী/, G_PROPHET, 'rocky_valley'),
    Q('ibrahim-guests', 11, 69, 73, 'ইব্রাহিম (আ.)-এর অতিথি ও সুসংবাদ', /ইব্রাহীম|ইবরাহীম|বাছুর|সুসংবাদ/, G_PROPHET, 'tent_camp'),
    Q('ibrahim-father', 19, 41, 48, 'বাবার প্রতি কোমল দাওয়াত', /ইব্রাহীম|ইবরাহীম|পিতা|বাবা/, G_PROPHET, 'old_city'),
    Q('ibrahim-dua', 14, 35, 41, 'অনুর্বর উপত্যকায় ইব্রাহিম (আ.)-এর দোয়া', /ইব্রাহীম|ইবরাহীম|উপত্যকা/, G_PROPHET, 'rocky_valley'),
    Q('ibrahim-sacrifice', 37, 99, 111, 'কুরবানির পরীক্ষা', /ইব্রাহীম|ইবরাহীম|জবেহ|যবেহ|স্বপ্ন/, G_PROPHET, 'rocky_valley'),
    Q('nuh-ark', 11, 36, 41, 'নূহ (আ.)-এর নৌকা', /নূহ|নৌকা|কিশতী/, G_PROPHET, 'ark_build'),
    Q('nuh-son', 11, 42, 48, 'প্লাবন ও নূহ (আ.)-এর ছেলে', /নূহ|পুত্র|ছেলে|পাহাড়/, G_PROPHET, 'stormy_sea'),
    Q('hud', 11, 50, 60, 'হূদ (আ.) ও আদ জাতি', /আদ|হূদ|হুদ/, G_PROPHET, 'ruined_town'),
    Q('salih', 11, 61, 68, 'সালেহ (আ.) ও আল্লাহর উটনী', /সালেহ|উষ্ট্রী|উটনী/, G_PROPHET, 'rocky_valley'),
    Q('lut', 11, 77, 83, 'লূত (আ.)-এর জনপদ', /লূত|লুত/, G_PROPHET, 'ruined_town'),
    Q('shuaib', 11, 84, 95, 'শোয়াইব (আ.) ও মাপে কম দেওয়ার পরিণাম', /শোয়ায়েব|শুআইব|শুয়াইব|মাদইয়ান|মাপ/, G_PROPHET, 'old_market'),
    Q('yunus', 37, 139, 148, 'মাছের পেটে ইউনুস (আ.)', /ইউনুস|ইউনূস|মাছ/, G_PROPHET, 'deep_sea'),
    Q('ayyub', 38, 41, 44, 'আইয়ুব (আ.)-এর অসীম ধৈর্য', /আইয়ুব|আইউব|আইয়ূব|ধৈর্য/, G_PROPHET, 'oasis'),
    Q('sulaiman-ant', 27, 15, 19, 'সুলাইমান (আ.) ও পিঁপড়ার উপত্যকা', /পিপীলিকা|পিঁপড়া|পিপড়া/, G_PROPHET, 'rocky_valley'),
    Q('hudhud', 27, 20, 28, 'হুদহুদ পাখির খবর', /হুদহুদ|পাখি|পক্ষী/, G_PROPHET, 'palace_hall'),
    Q('bilqis', 27, 36, 44, 'সাবার রানির ঈমান', /সাবা|রানী|রাণী|সোলায়মান|সুলায়মান/, G_PROPHET, 'palace_hall'),
    Q('sulaiman-staff', 34, 12, 14, 'সুলাইমান (আ.)-এর লাঠি ও জিনদের অজানা', /লাঠি|জিন/, G_PROPHET, 'palace_hall'),
    Q('dawud-judgment', 21, 78, 79, 'শস্যক্ষেতের বিচার', /দাউদ|সোলায়মান|সুলায়মান|শস্য/, G_PROPHET, 'farm_field'),
    Q('talut', 2, 246, 251, 'তালূত, জালূত ও দাউদ (আ.)', /তালূত|জালূত|তালুত|জালুত/, G_PROPHET, 'rocky_valley'),
    Q('maryam-birth', 3, 35, 37, 'মারইয়াম (আ.)-এর জন্ম ও মিহরাবের রিজিক', /মারইয়াম|মরিয়ম|মেহরাব|মিহরাব/, G_PROPHET, 'mihrab_old'),
    Q('zakariya', 19, 2, 11, 'বার্ধক্যে যাকারিয়া (আ.)-এর গোপন দোয়া', /যাকারিয়া|জাকারিয়া|যাকারিয়্যা/, G_PROPHET, 'mihrab_old'),
    Q('maryam-palm', 19, 16, 26, 'খেজুর গাছের নিচে মারইয়াম (আ.)', /মারইয়াম|মরিয়ম|খেজুর/, G_PROPHET, 'oasis'),
    Q('isa-cradle', 19, 27, 34, 'দোলনার শিশু ঈসা (আ.)-এর কথা', /ঈসা|শিশু|কোলে/, G_PROPHET, 'old_city'),
    Q('adam', 2, 30, 37, 'আদম (আ.)-এর সৃষ্টি, ভুল ও তাওবা', /আদম/, G_PROPHET, 'vineyard'),
    Q('adam-sons', 5, 27, 31, 'আদম (আ.)-এর দুই ছেলে', /আদম|কাক/, G_PROPHET, 'rocky_valley'),
    Q('cave-youth', 18, 9, 16, 'গুহার যুবকরা', /গুহা/, G_QURAN, 'cave_mouth'),
    Q('cave-sleep', 18, 17, 22, 'গুহায় দীর্ঘ ঘুম ও জেগে ওঠা', /গুহা|কুকুর/, G_QURAN, 'cave_inside'),
    Q('two-gardens', 18, 32, 44, 'দুই বাগানের মালিক', /বাগান|উদ্যান/, G_QURAN, 'vineyard'),
    Q('dhulqarnain-1', 18, 83, 91, 'যুলকারনাইনের সফর', /যুলকারনাইন|জুলকারনাইন|যুলকারনাঈন/, G_QURAN, 'desert'),
    Q('dhulqarnain-2', 18, 92, 98, 'ইয়াজুজ-মাজুজের প্রাচীর', /ইয়াজুজ|ইয়াজূজ|প্রাচীর/, G_QURAN, 'rocky_valley'),
    Q('luqman', 31, 12, 19, 'ছেলের প্রতি লুকমানের উপদেশ', /লোকমান|লুকমান/, G_QURAN, 'tent_camp'),
    Q('garden-owners', 68, 17, 33, 'বাগানের মালিকদের কৃপণতা', /বাগান|উদ্যান/, G_QURAN, 'vineyard'),
    Q('ditch', 85, 4, 9, 'গর্তের অধিবাসীরা', /গর্ত|অগ্নি|আগুন/, G_QURAN, 'great_fire'),
    Q('elephant', 105, 1, 5, 'হাতির বাহিনী', /হস্তী|হাতি/, G_QURAN, 'desert'),
    Q('yasin-man', 36, 13, 27, 'জনপদের প্রান্ত থেকে ছুটে আসা মানুষটি', /জনপদ|রসূল|রাসূল/, G_QURAN, 'old_city'),
    Q('sabbath', 7, 163, 166, 'শনিবারের জেলেরা', /শনিবার|মাছ/, G_QURAN, 'sea_shore'),
    Q('ruined-town', 2, 259, 259, 'একশো বছর পর জেগে ওঠা', /একশ|শত বছর|গাধা/, G_QURAN, 'ruined_town'),
    Q('hijrah-cave', 9, 40, 40, 'গুহায় দুই সঙ্গী: চিন্তা করো না', /গুহা|সঙ্গী/, G_QURAN, 'cave_mouth'),
    Q('abasa', 80, 1, 10, 'অন্ধ সাহাবির জন্য নাযিল হওয়া আয়াত', /অন্ধ/, G_QURAN, 'old_city'),
    HD(2363, 'তৃষ্ণার্ত কুকুরকে পানি খাওয়ানো লোকটি', /কুকুর|পিপাসা|তৃষ্ণা/, 'desert_well'),
    HD(3467, 'যে নারীর একটি দয়ার কাজে আল্লাহ ক্ষমা করলেন', /কুকুর|কূপ|পিপাসা/, 'desert_well'),
    HD(2272, 'গুহায় আটকে পড়া তিন ব্যক্তি', /গুহা|পাথর/, 'cave_inside'),
    HD(3470, 'নিরানব্বই জনকে হত্যার পরও তাওবার দরজা খোলা', /হত্যা|তওবা|তাওবা|নিরানব্বই/, 'desert'),
    HD(2291, 'হাজার দিনারের ঋণ ও সমুদ্রে ভাসানো কাঠ', /দীনার|দিনার|কাঠ|সমুদ্র|সাগর|নদী/, 'sea_shore'),
    HD(3464, 'তিনজনের পরীক্ষা — কে শুকরিয়া আদায় করল', /কুষ্ঠ|টাক|অন্ধ/, 'desert'),
    HD(2078, 'যে ব্যবসায়ী অভাবীর ঋণ মাফ করে দিতেন', /ঋণ|দেনা|অভাবী|অভাবগ্রস্ত|পাওনা/, 'old_market'),
    HD(3798, 'বাতি নিভিয়ে মেহমানকে খাওয়ানো পরিবার', /মেহমান|অতিথি|বাতি|প্রদীপ|চেরাগ/, 'old_city'),
    HD(1421, 'ভুল হাতে পড়া তিনটি দান', /চোর|ব্যভিচার|যিনা/, 'old_city'),
    HD(652, 'রাস্তা থেকে কাঁটার ডাল সরানো লোকটি', /কাঁটা|কাটা/, 'desert'),
    HD(5999, 'মায়ের মমতা আর আল্লাহর রহমত', /বন্দি|বন্দী|কয়েদি|যুদ্ধবন্দী|দুধ/, 'tent_camp'),
    HD(3472, 'জমিতে পাওয়া সোনার কলস ও দুই সৎ মানুষ', /স্বর্ণ|সোনা|কলস|ঘড়া|জমি/, 'farm_field')
  ];
  const ISL_BY_ID = Object.fromEntries(ISL_LIB.map(x => [x.id, x]));
  const SURAH = ['আল-ফাতিহা','আল-বাকারা','আলে-ইমরান','আন-নিসা','আল-মায়িদাহ','আল-আনআম','আল-আরাফ','আল-আনফাল','আত-তাওবা','ইউনুস','হুদ','ইউসুফ','আর-রাদ','ইব্রাহিম','আল-হিজর','আন-নাহল','আল-ইসরা','আল-কাহফ','মারইয়াম','ত্বা-হা','আল-আম্বিয়া','আল-হাজ্জ','আল-মুমিনুন','আন-নূর','আল-ফুরকান','আশ-শুআরা','আন-নামল','আল-কাসাস','আল-আনকাবুত','আর-রূম','লুকমান','আস-সাজদা','আল-আহযাব','সাবা','ফাতির','ইয়াসিন','আস-সাফফাত','সোয়াদ','আয-যুমার','গাফির','ফুসসিলাত','আশ-শূরা','আয-যুখরুফ','আদ-দুখান','আল-জাসিয়া','আল-আহকাফ','মুহাম্মাদ','আল-ফাতহ','আল-হুজুরাত','ক্বাফ','আয-যারিয়াত','আত-তূর','আন-নাজম','আল-কামার','আর-রাহমান','আল-ওয়াকিয়া','আল-হাদিদ','আল-মুজাদালা','আল-হাশর','আল-মুমতাহিনা','আস-সফ','আল-জুমুআ','আল-মুনাফিকুন','আত-তাগাবুন','আত-তালাক','আত-তাহরিম','আল-মুলক','আল-কলম','আল-হাক্কাহ','আল-মাআরিজ','নূহ','আল-জিন','আল-মুযযাম্মিল','আল-মুদ্দাসসির','আল-কিয়ামাহ','আল-ইনসান','আল-মুরসালাত','আন-নাবা','আন-নাযিয়াত','আবাসা','আত-তাকভির','আল-ইনফিতার','আল-মুতাফফিফিন','আল-ইনশিকাক','আল-বুরুজ','আত-তারিক','আল-আলা','আল-গাশিয়াহ','আল-ফাজর','আল-বালাদ','আশ-শামস','আল-লাইল','আদ-দুহা','আশ-শারহ','আত-তীন','আল-আলাক','আল-কদর','আল-বাইয়্যিনাহ','আয-যিলযাল','আল-আদিয়াত','আল-কারিয়া','আত-তাকাসুর','আল-আসর','আল-হুমাযাহ','আল-ফীল','কুরাইশ','আল-মাউন','আল-কাওসার','আল-কাফিরুন','আন-নাসর','আল-লাহাব','আল-ইখলাস','আল-ফালাক','আন-নাস'];

  const BND = '০১২৩৪৫৬৭৮৯';
  const bnN = n => String(n).replace(/\d/g, d => BND[d]);
  const toEn = s => String(s || '').replace(/[০-৯]/g, d => BND.indexOf(d));
  const QAPI = 'https://api.alquran.cloud/v1/';
  const HAPI = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/';
  const QTRANS = 'bn.bengali';

  async function getJson(url, ms) {
    const c = new AbortController(); const tm = setTimeout(() => c.abort(), ms || 20000);
    try { const r = await fetch(url, { signal: c.signal }); if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; } return await r.json(); }
    catch (e) { if (e.name === 'AbortError') throw new Error('সার্ভার থেকে উত্তর আসেনি — ইন্টারনেট দেখে আবার চেষ্টা করুন'); if (e.status) throw e; throw new Error('উৎস ডাউনলোড হলো না — ইন্টারনেট সংযোগ দেখুন'); }
    finally { clearTimeout(tm); }
  }
  const nrm = s => String(s || '').replace(/[​﻿]/g, '').replace(/\s+/g, ' ').trim();
  const stripBismillah = (ar, s, a) => (a === 1 && s !== 1 && s !== 9 && /^بِسْمِ/.test(ar)) ? ar.split(' ').slice(4).join(' ') : ar;

  /* downloads the exact text: Quran (Arabic + Bangla translation) or Sahih al-Bukhari (Bangla) → numbered parts */
  async function fetchSource(item) {
    if (item.kind === 'quran') {
      const s = item.s, f = item.f, t = item.t, n = t - f + 1; let segs = [];
      try {
        const j = await getJson(`${QAPI}surah/${s}/editions/quran-uthmani,${QTRANS}?offset=${f - 1}&limit=${n}`);
        const ar = j.data && j.data[0] && j.data[0].ayahs, bn = j.data && j.data[1] && j.data[1].ayahs;
        if (ar && bn && ar.length === n && bn.length === n && ar[0].numberInSurah === f) segs = ar.map((x, i) => ({ n: f + i, ar: stripBismillah(nrm(x.text), s, f + i), bn: nrm(bn[i].text) }));
      } catch (e) { if (e.status === 404) throw e; }
      if (!segs.length) for (let a = f; a <= t; a++) {
        const j = await getJson(`${QAPI}ayah/${s}:${a}/editions/quran-uthmani,${QTRANS}`);
        if (j.code !== 200 || !Array.isArray(j.data) || j.data.length < 2) throw new Error('আয়াত পাওয়া যায়নি (' + s + ':' + a + ')');
        segs.push({ n: a, ar: stripBismillah(nrm(j.data[0].text), s, a), bn: nrm(j.data[1].text) });
      }
      return { kind: 'quran', s, f, t, segs, srcName: 'আল-কুরআন', label: 'আয়াত' };
    }
    let j; try { j = await getJson(`${HAPI}ben-${item.book}/${item.n}.min.json`); } catch (e) { if (e.status === 404) throw new Error('এই নম্বরের হাদিস পাওয়া যায়নি'); j = await getJson(`${HAPI}ben-${item.book}/${item.n}.json`); }
    const h = j.hadiths && j.hadiths[0]; if (!h || !h.text) throw new Error('হাদিসের লেখা পাওয়া যায়নি');
    const text = nrm(String(h.text).replace(/^[\s।,.:;\-–—]+/, '').replace(/\s+([,।?!])/g, '$1'));
    const sents = (text.match(/[^।?!]+[।?!]*/g) || [text]).map(nrm).filter(Boolean);
    const segs = []; sents.forEach(x => { const last = segs[segs.length - 1]; if (last && last.bn.split(' ').length < 5) last.bn += ' ' + x; else segs.push({ n: segs.length + 1, bn: x }); });
    return { kind: 'hadith', book: item.book, n: item.n, segs, srcName: 'সহিহ বুখারি', label: 'অংশ' };
  }
  function refOf(src, picked) {
    if (src.kind === 'quran') { const a = picked[0].n, b = picked[picked.length - 1].n; return `সূরা ${SURAH[src.s - 1] || src.s}, আয়াত ${bnN(a)}${b > a ? '–' + bnN(b) : ''}`; }
    return `সহিহ বুখারি, হাদিস ${bnN(src.n)}`;
  }
  function fullRef(item) { return item.kind === 'quran' ? `সূরা ${SURAH[item.s - 1] || item.s} (${bnN(item.s)}), আয়াত ${bnN(item.f)}${item.t > item.f ? '–' + bnN(item.t) : ''}` : `সহিহ বুখারি, হাদিস ${bnN(item.n)}`; }

  const ISL_PLACES_FOR_PROMPT = () => Object.entries(PLACE_INDEX).filter(([k, v]) => v.group === 'ইসলামিক ইতিহাস' || ['mosque_front', 'mosque_inside', 'river_bank', 'hill_view', 'forest', 'beach', 'paddy_field', 'flower_garden'].includes(k)).map(([k, v]) => `${k} (${v.bn})`).join(', ');

  function buildIslPrompt(item, src) {
    const segList = src.segs.map(x => `[${bnN(x.n)}] ${x.bn}`).join('\n');
    const who = src.kind === 'quran' ? 'আল্লাহ তাআলা বলেন,' : 'রাসূলুল্লাহ ﷺ বলেছেন, / হাদিসে এসেছে,';
    return `তুমি একজন দক্ষ বাংলা ইসলামিক গল্পকার ও ভয়েস-স্ক্রিপ্ট লেখক। "${S.series || 'প্রশান্তির বার্তা'}" নামের শর্টস/রিলস চ্যানেলের জন্য নিচের যাচাই করা উৎস থেকে একটা ছোট গল্প-ভিডিওর স্ক্রিপ্ট লেখো — নিচের "TF Script" ফরম্যাটে। পুরোটা একজন কথক এক কণ্ঠে পড়বেন (Cartesia AI)।

## উৎস (অ্যাপ নিজে ডাউনলোড করেছে — এটাই গল্পের একমাত্র ভিত্তি)
বিষয়: ${item.title}
সূত্র: ${fullRef(item)} (${src.srcName})
${src.label}গুলো, নম্বরসহ:
${segList}

## ধর্মীয় সতর্কতা (কঠোরভাবে মানবে)
- গল্প শুধু উপরের লেখায় যা আছে তার ভিত্তিতে। নতুন ঘটনা, নাম, সংখ্যা, সংলাপ বা দৃশ্যের খুঁটিনাটি বানাবে না। প্রসঙ্গ বোঝাতে শুধু সর্বজনস্বীকৃত সাধারণ তথ্য খুব ছোট করে বলতে পারো (যেমন কে কার ছেলে)।
- আল্লাহ, কোনো নবী-রাসূল, ফেরেশতা বা সাহাবির মুখে উদ্ধৃতি চিহ্ন দিয়ে নিজের বানানো কথা বসাবে না। তাঁদের কথা নিজের ভাষায় পরোক্ষভাবে বলো ("আল্লাহ তাঁকে জানালেন যে...")। আসল উদ্ধৃতি শুধু "## ayah" দৃশ্যে — সেটা অ্যাপ নিজে বসাবে।
- নবীদের নামের পরে (আ.), রাসূলুল্লাহর পরে ﷺ, সাহাবির নামের পরে (রা.) লিখবে।
- পর্দায় কোনো মানুষ বা চরিত্র দেখানো হবে না: "চরিত্র:" লাইন দেবে না, লাইনের শুরুতে কোনো চরিত্র-কোড দেবে না, দৃশ্যের লাইনে "কারা পর্দায়" ঘর খালি রাখবে।
- ভাষা কোমল, সম্মানজনক, আশা জাগানো। ভয় দেখানো, কঠোরতা, মাযহাবি বিতর্ক, ফতোয়া, রাজনীতি নয়। "আমিন না লিখে যাবেন না" ধরনের চাপ দেওয়া লাইন নয়।

## গল্পের কাঠামো (এই ক্রমে) — সিনেমার মতো
${CINEMA_RULES}
${styleRule()}
1. হুক দৃশ্য (২-৩ লাইন): ঘটনার সবচেয়ে টানটান মুহূর্ত দিয়ে শুরু — যেন স্ক্রল থেমে যায়।
2. ৪-৬টা গল্পের দৃশ্য: পটভূমি → চাপ বাড়ে → সবচেয়ে অন্ধকার মুহূর্ত → আল্লাহর দিকে ফেরা। ছোট ছোট বাক্যে, চোখে দেখার মতো খুঁটিনাটি (তবে উৎসে নেই এমন ঘটনা নয়)। প্রতিটা দৃশ্যের জায়গা নিচের তালিকা থেকে।
3. "## ayah | নম্বর" — উপরের যে ১-৩টা ${src.label} গল্পের মূল কথা (মোট ৭০ শব্দের মধ্যে হলে ভালো), শুধু তাদের নম্বর দাও, যেমন "## ayah | ${bnN(src.segs[0].n)}" বা "## ayah | ${bnN(src.segs[0].n)}-${bnN(src.segs[Math.min(1, src.segs.length - 1)].n)}"। এই দৃশ্যে শুধু একটা ভূমিকা-লাইন দাও (যেমন "${who}")। আসল লেখা অ্যাপ নিজে বসাবে — তুমি উদ্ধৃতি লিখবে না।
4. "## takeaways": "আমাদের জীবনে" — ২-৩টা ছোট শিক্ষা, আজকের জীবনের সাথে মিলিয়ে। প্রতিটা লাইনে <মূল কথা> দাও।
5. "## cta | প্রশ্ন | বিকল্প": দর্শককে একটা নরম প্রশ্ন, শেষে "কমেন্টে লিখুন।"
- মোট ৩০-৪০টা লাইন (ayah দৃশ্যের লাইন বাদে)।

## কণ্ঠ যেন একদম স্বাভাবিক শোনায়
- প্রতিটা লাইন এক নিঃশ্বাসে বলা যায় এমন: ৫-১৪ শব্দ। লম্বা বাক্য ভেঙে দুই লাইন করো। প্রতিটা লাইনের শেষে দাঁড়ি/প্রশ্নবোধক/বিস্ময় চিহ্ন।
- ইমোজি, বন্ধনীতে স্টেজ-নির্দেশনা, "..." দেবে না। সংখ্যা অঙ্কে লিখতে পারো।
- আবেগ বোঝাতে লাইন শেষে {সোনালি শব্দ} দিয়ে ১-২টা মূল শব্দ চিহ্নিত করো।

## TF Script ফরম্যাট (হুবহু এভাবে, একটা কোড ব্লকে)
\`\`\`
=== শিরোনাম (কৌতূহল জাগানো, ৫-১০ শব্দ)
থাম্বনেল: ছোট প্রসঙ্গ লাইন (৪-৭ শব্দ) | বড় লাইন ১ (২-৪ শব্দ) | বড় লাইন ২ (২-৪ শব্দ, শেষে !) {সোনালি শব্দ} | book | ১
ক্ষেত্র: ইসলামিক
## desert_night night tense | |
একটা অন্ধকার কূপ। চারদিকে শুধু মরুভূমি। {অন্ধকার কূপ}
কে ভেবেছিল, এই কূপ থেকেই শুরু হবে এক বাদশাহর গল্প? {বাদশাহর গল্প}
## old_city day normal | বহু বছর পর |
...
## ayah | ${bnN(src.segs[0].n)}
${who.split(' / ')[0]}
## takeaways
<ধৈর্য> বিপদের দিনেও আল্লাহর ওপর ভরসা ছাড়বেন না। {ভরসা}
## cta | এই ঘটনার কোন অংশটা আপনাকে সবচেয়ে বেশি ছুঁয়ে গেছে? | ধৈর্য, ক্ষমা, ভরসা
কোন অংশটা আপনাকে ছুঁয়ে গেছে? কমেন্টে লিখুন। {কমেন্টে লিখুন}
বর্ণনা: ২ লাইনের বর্ণনা
হ্যাশট্যাগ: #Shorts #ইসলামিক_গল্প #${src.kind === 'quran' ? 'কুরআনের_গল্প' : 'হাদিসের_গল্প'}
\`\`\`
- দৃশ্যের লাইন: "## জায়গা সময় মেজাজ [আবহাওয়া] | ব্যাজ (ঐচ্ছিক, যেমন 'বহু বছর পর') |" — শেষের ঘর খালি।
- জায়গা: ${ISL_PLACES_FOR_PROMPT()}
- গল্পে কোনো প্রাণী থাকলে জায়গার সাথে যোগ করো: যেমন desert+camel:400, rocky_valley+sheep:300+goat:700 (প্রাণী: goat, sheep, dumba, cow, camel, horse, donkey, doves, cat)
- সময়: day, evening, night | মেজাজ: normal, happy, sad, tense, regret | আবহাওয়া: rain, fog, sunny
- থাম্বনেলের আইকন: book, flower, candle নয় — শুধু book বা flower।
শুধু কোড ব্লকটা দাও, আগে-পরে কিছু লিখবে না।`;
  }

  /* exact text → caption-sized lines (joined back they give the same words) */
  function chunkExact(s) {
    s = nrm(s); const out = [];
    (s.match(/[^।?!;]+[।?!;]*/g) || [s]).forEach(x => {
      let w = nrm(x).split(' ').filter(Boolean);
      while (w.length > 16) { let cut = -1; for (let i = Math.min(14, w.length - 4); i >= 5; i--) if (/[,،:]$/.test(w[i - 1])) { cut = i; break; } if (cut < 0) cut = 12; out.push(w.slice(0, cut).join(' ')); w = w.slice(cut); }
      if (w.length) out.push(w.join(' '));
    });
    return out.map(l => l.replace(/\|\|/g, '|').replace(/[{}]/g, m => m === '{' ? '(' : ')').replace(/^[>#=\-•]+\s*/, ''));
  }
  function parseNums(sv, src) {
    const nums = []; String(toEn(sv)).split(/[,،\s]+/).forEach(p => { const m = p.match(/^(\d+)\s*[-–—]\s*(\d+)$/); if (m) { for (let k = +m[1]; k <= +m[2] && nums.length < 20; k++) nums.push(k); } else if (/^\d+$/.test(p)) nums.push(+p); });
    let picked = src.segs.filter(x => nums.includes(x.n));
    if (!picked.length) picked = src.kind === 'hadith' && src.segs.length > 1 ? src.segs.slice(1, 3) : [src.segs[0]]; // hadith: skip the chain of narrators
    // keep it short enough to read on screen: at most ~90 words, at least one part, contiguous order
    const out = []; let words = 0; for (const x of picked) { const n = x.bn.split(' ').length; if (out.length && words + n > 90) break; out.push(x); words += n; }
    return out;
  }
  /* AI answer + downloaded source → the final TF Script (exact quote inserted by the app) */
  function islExpand(text, src, item) {
    const parts = splitStories(text); let t = (parts[0] || String(text || '')).replace(/```[a-z]*/gi, '');
    const lines = t.split(/\r?\n/); const out = []; let inAyah = false, ayahDone = false, introDone = false;
    const charCode = /^\s*[-•]?\s*[A-Za-z_][A-Za-z0-9_]*(?::[A-Za-z_]*){0,3}\s+/;
    const emitAyah = (picked, intro) => {
      out.push('## ayah | ' + refOf(src, picked));
      let it = intro || ''; if (src.kind === 'hadith' && /আল্লাহ\s*তা[ʼ']?আলা\s*বল/.test(it)) it = ''; if (src.kind === 'quran' && /রাসূল|নবী|হাদিস/.test(it)) it = '';
      out.push('- ' + (it || (src.kind === 'quran' ? 'আল্লাহ তাআলা বলেন,' : 'হাদিসে এসেছে,')));
      if (src.kind === 'quran') { const ar = picked.map(x => x.ar).filter(Boolean).join(' ۝ '); if (ar && ar.length <= 520) out.push('আরবি: ' + ar); }
      picked.forEach(x => chunkExact(x.bn).forEach(l => out.push('- ' + l)));
      ayahDone = true;
    };
    let pending = null;
    for (let raw of lines) {
      const ln = raw.trim(); if (!ln) continue;
      if (/^(চরিত্র|characters?|বই|book)\s*[:：]/i.test(ln)) continue;
      const mh = ln.match(/^##\s*ayah\b\s*\|?\s*(.*)$/i);
      if (mh) { if (pending) { emitAyah(pending.picked, pending.intro); pending = null; } inAyah = true; introDone = false; pending = { picked: parseNums(mh[1], src), intro: '' }; continue; }
      if (/^##/.test(ln)) {
        if (pending) { emitAyah(pending.picked, pending.intro); pending = null; } inAyah = false;
        const special = /^##\s*(takeaways|cta|rewind|book|metaphor)\b/i.test(ln);
        out.push(special ? ln : ln.replace(/\|\s*([^|]*)\|\s*[^|]*$/, (m0, badge) => '| ' + badge.trim() + ' |')); continue;
      }
      if (inAyah) { if (!introDone && pending) { let s2 = ln.replace(charCode, '').replace(/^[-•>]\s*/, '').replace(/["“”].*$/, '').trim(); if (s2.split(' ').length <= 8) pending.intro = s2.replace(/[:।]$/, ',') || pending.intro; introDone = true; } continue; }
      if (/^===/.test(ln)) { out.push(ln); out.push(`বই: {REF} | ${src.srcName} | | `); continue; }
      out.push(/^(থাম্বনেল|thumbnail|ক্ষেত্র|area|বর্ণনা|description|হ্যাশট্যাগ|hashtags?)\s*[:：]/i.test(ln) ? ln : ln.replace(charCode, '').replace(/^>\s*/, ''));
    }
    if (pending) emitAyah(pending.picked, pending.intro);
    if (!ayahDone) { // the AI forgot the quote scene: put it before the lessons
      const at = out.findIndex(l => /^##\s*(takeaways|cta)\b/i.test(l)); const keep = out.splice(at < 0 ? out.length : at);
      emitAyah(parseNums(String(src.segs[0].n), src), ''); out.push(...keep);
    }
    if (!out.some(l => /^===/.test(l))) { out.unshift(`বই: {REF} | ${src.srcName} | | `); out.unshift('=== ' + item.title); }
    const ayahHead = out.find(l => /^##\s*ayah\b/i.test(l)); const ref = ayahHead ? ayahHead.split('|').slice(1).join('|').trim() : fullRef(item);
    return out.join('\n').replace('{REF}', ref);
  }

  /* ---------- place art for the stories (no people) ---------- */
  function addPlaces() {
    const night = tm => tm === 'night', eve = tm => tm === 'evening';
    Object.assign(E, {
      dunes(c, t, tm) { const k = night(tm) ? ['#3E3B57', '#2F2D46', '#25233A'] : eve(tm) ? ['#E0A066', '#CC8752', '#B87445'] : ['#EED29C', '#E2BE80', '#D4AC6C'];
        P(c, `M0,${GY - 260} Q240,${GY - 390} 520,${GY - 250} T1080,${GY - 300} L1080,${GY + 10} L0,${GY + 10}Z`, k[0]);
        P(c, `M0,${GY - 150} Q300,${GY - 290} 620,${GY - 140} T1080,${GY - 170} L1080,${GY + 10} L0,${GY + 10}Z`, k[1]);
        P(c, `M0,${GY - 60} Q380,${GY - 160} 760,${GY - 50} T1080,${GY - 80} L1080,${GY + 12} L0,${GY + 12}Z`, k[2]); },
      stars(c, t, tm) { if (!night(tm)) return; for (let i = 0; i < 140; i++) { const x = (i * 197 + 31) % W, y = (i * 113 + 17) % (GY - 330), r = 1.4 + (i % 4) * .7; withA(c, .45 + .45 * Math.abs(Math.sin(t * 1.3 + i)), () => circ(c, x, y, r, '#FFF6DA')); } },
      moon(c, t, tm, a) { const x = +a || 820, y = 250;
        if (night(tm)) { const g = c.createRadialGradient(x, y, 20, x, y, 260); g.addColorStop(0, 'rgba(255,240,200,.35)'); g.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g; c.fillRect(x - 260, y - 260, 520, 520); circ(c, x, y, 72, '#F6EACB'); circ(c, x + 30, y - 16, 66, '#14203a'); }
        else { const g = c.createRadialGradient(x, y + (eve(tm) ? 520 : 0), 10, x, y + (eve(tm) ? 520 : 0), 420); g.addColorStop(0, eve(tm) ? 'rgba(255,190,110,.9)' : 'rgba(255,248,220,.95)'); g.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g; c.fillRect(0, 0, W, GY); circ(c, x, y + (eve(tm) ? 520 : 0), eve(tm) ? 90 : 70, eve(tm) ? '#FFB36B' : '#FFF6D8'); } },
      tent(c, t, tm, a) { const x = +a || 620, b = GY + 10; P(c, `M${x - 260},${b} L${x},${b - 330} L${x + 260},${b}Z`, night(tm) ? '#5B4636' : '#8D6E63'); for (let i = -2; i <= 2; i++) line(c, x, b - 330, x + i * 120, b, 'rgba(0,0,0,.12)', 6);
        P(c, `M${x - 60},${b} L${x},${b - 180} L${x + 60},${b}Z`, '#2B2018'); line(c, x, b - 330, x, b - 380, '#5D4037', 8); if (night(tm)) withA(c, .5 + .2 * Math.sin(t * 7), () => circ(c, x, b - 40, 90, 'rgba(255,170,80,.45)')); },
      oldtown(c, t, tm) { const cols = night(tm) ? ['#5B5368', '#4B4559', '#3E394C'] : ['#D8B48C', '#C9A27A', '#B88E66'];
        [[0, 330, 260], [230, 420, 300], [500, 300, 240], [720, 470, 280], [960, 360, 200]].forEach(([x, h, w], i) => { rect(c, x, GY - h, w, h + 10, cols[i % 3]); rect(c, x - 8, GY - h - 14, w + 16, 18, shade(cols[i % 3], -.12));
          for (let k = 0; k < 2; k++) rr(c, x + 40 + k * (w - 110), GY - h + 70, 40, 60, [20, 20, 0, 0], night(tm) ? 'rgba(255,200,110,.85)' : '#4E3B2C'); rr(c, x + w / 2 - 34, GY - 120, 68, 120, [34, 34, 0, 0], '#4E3B2C'); });
        E.palm(c, t, tm, 600); },
      palace(c, t, tm) { const g = c.createLinearGradient(0, 0, 0, 1380); g.addColorStop(0, '#E9D8B4'); g.addColorStop(1, '#D6BF92'); rect(c, 0, 0, W, 1380, g);
        for (let i = 0; i < 3; i++) { const x = 70 + i * 360; P(c, `M${x + 60},1380 L${x + 60},640 Q${x + 180},440 ${x + 300},640 L${x + 300},1380Z`, night(tm) ? '#1b2440' : eve(tm) ? '#F2B27A' : '#9ED3EE'); }
        for (let i = 0; i < 4; i++) { const x = 40 + i * 360; rect(c, x, 520, 90, 860, '#F3E6C8'); rect(c, x - 14, 500, 118, 40, '#C9A24A'); rect(c, x - 14, 1350, 118, 30, '#C9A24A'); }
        rect(c, 0, 470, W, 40, '#C9A24A'); E.floor(c, t, tm, 'marble'); P(c, `M440,1380 L640,1380 L760,1920 L320,1920Z`, '#8E1D1D');
        rr(c, 470, 1000, 140, 220, 20, '#C9A24A'); rr(c, 490, 1020, 100, 120, 14, '#8E1D1D'); rect(c, 460, 1210, 160, 40, '#B08A36'); E.lantern(c, t); },
      stonewall(c, t, tm) { rect(c, 0, 0, W, H, '#5D5348'); for (let y = 0; y < 1380; y += 90) for (let x = (y / 90) % 2 ? -70 : 0; x < W; x += 140) rr(c, x + 4, y + 4, 132, 82, 10, (x + y) % 3 ? '#6B6054' : '#635849'); withA(c, .35, () => rect(c, 0, 0, W, H, '#000')); },
      cellwin(c, t) { const x = 640, y = 330; rr(c, x, y, 220, 170, 10, '#1d1a16'); withA(c, .9, () => rr(c, x + 10, y + 10, 200, 150, 6, '#BFE3F2')); for (let i = 1; i < 5; i++) rect(c, x + i * 44, y, 10, 170, '#2b2621');
        withA(c, .22 + .05 * Math.sin(t), () => P(c, `M${x + 10},${y + 160} L${x + 210},${y + 160} L${x - 120},1380 L${x - 480},1380Z`, '#FFF4C8')); },
      well(c, t, tm, a) { const x = +a || 540, b = GY + 20; ell(c, x, b - 150, 190, 46, '#6D5B4A'); rect(c, x - 190, b - 150, 380, 150, '#8B7560'); ell(c, x, b, 190, 46, '#7A6552'); ell(c, x, b - 150, 160, 34, '#1d1712');
        for (let i = 0; i < 4; i++) line(c, x - 190, b - 115 + i * 35, x + 190, b - 115 + i * 35, 'rgba(0,0,0,.15)', 4); line(c, x - 170, b - 150, x - 170, b - 400, '#5D4037', 16); line(c, x + 170, b - 150, x + 170, b - 400, '#5D4037', 16); line(c, x - 190, b - 400, x + 190, b - 400, '#5D4037', 16); line(c, x, b - 400, x, b - 250 + Math.sin(t) * 6, '#C8B08A', 4); rr(c, x - 30, b - 250 + Math.sin(t) * 6, 60, 54, 8, '#6D4C41'); },
      rocks(c, t, tm) { const k = night(tm) ? ['#3B3346', '#2E2838'] : eve(tm) ? ['#A0634A', '#86503B'] : ['#B08A6E', '#937056'];
        P(c, `M0,${GY - 380} L120,${GY - 560} L250,${GY - 420} L380,${GY - 640} L520,${GY - 450} L660,${GY - 600} L820,${GY - 400} L960,${GY - 540} L1080,${GY - 420} L1080,${GY} L0,${GY}Z`, k[0]);
        P(c, `M0,${GY - 180} L160,${GY - 300} L320,${GY - 200} L500,${GY - 330} L700,${GY - 190} L880,${GY - 290} L1080,${GY - 170} L1080,${GY + 10} L0,${GY + 10}Z`, k[1]); },
      cavemouth(c, t, tm) { P(c, `M120,${GY + 10} Q180,${GY - 760} 540,${GY - 820} Q900,${GY - 760} 960,${GY + 10}Z`, night(tm) ? '#2E2838' : '#7D6450'); P(c, `M360,${GY + 10} Q380,${GY - 420} 540,${GY - 440} Q700,${GY - 420} 720,${GY + 10}Z`, '#120e0b'); withA(c, .25, () => P(c, `M120,${GY + 10} Q180,${GY - 760} 540,${GY - 820} L540,${GY - 440} Q380,${GY - 420} 360,${GY + 10}Z`, '#000')); },
      cave(c, t, tm) { rect(c, 0, 0, W, H, '#1f1915'); c.save(); c.beginPath(); c.ellipse(540, 760, 300, 420, 0, 0, Math.PI * 2); c.clip(); E.sky(c, t, tm); E.stars(c, t, tm); E.moon(c, t, tm, 650); E.dunes(c, t, tm); c.restore();
        P(c, `M0,0 L1080,0 L1080,1920 L0,1920Z M240,760 a300,420 0 1,0 600,0 a300,420 0 1,0 -600,0Z`, '#2a221c'); withA(c, .4, () => { for (let i = 0; i < 9; i++) P(c, `M${i * 130},0 l60,${120 + (i % 3) * 70} l60,${-120 - (i % 3) * 70}Z`, '#15110e'); }); rect(c, 0, 1380, W, 540, '#3a3029'); withA(c, .25, () => P(c, `M240,1380 L840,1380 L1080,1920 L0,1920Z`, '#d9c9a0')); },
      stormsea(c, t) { withA(c, .65, () => rect(c, 0, 0, W, GY, '#1c2733')); for (let i = 0; i < 3; i++) withA(c, .1 + .05 * i, () => ell(c, 200 + i * 340, 240 + i * 40, 320, 110, '#5d6b78'));
        const yb = GY - 300; for (let k = 0; k < 4; k++) { const y = yb + k * 120; P(c, `M0,${y} ${Array.from({ length: 9 }, (_, i) => `Q${i * 120 + 60},${y - 70 - Math.sin(t * 1.4 + i + k) * 40} ${(i + 1) * 120},${y}`).join(' ')} L1080,1920 L0,1920Z`, ['#24435A', '#1E3A4F', '#183245', '#132a3b'][k]); }
        if (Math.sin(t * 2.3) > .97) withA(c, .5, () => rect(c, 0, 0, W, H, '#fff')); },
      ark(c, t, tm, a) { const bob = a === 'land' ? 0 : Math.sin(t * 1.2) * 18, rot = a === 'land' ? 0 : Math.sin(t * .9) * .04, x = 540, y = (a === 'land' ? GY - 40 : GY - 220) + bob;
        c.save(); c.translate(x, y); c.rotate(rot); P(c, 'M-420,-60 L420,-60 Q380,120 260,140 L-260,140 Q-380,120 -420,-60Z', '#6D4C41'); for (let i = 0; i < 4; i++) line(c, -400 + i * 10, -30 + i * 40, 400 - i * 10, -30 + i * 40, '#5D4037', 5);
        rr(c, -230, -260, 460, 200, 12, '#8D6E63'); P(c, 'M-260,-260 L0,-360 L260,-260Z', '#5D4037'); for (let i = 0; i < 4; i++) rr(c, -190 + i * 110, -210, 60, 60, 6, '#3E2723'); c.restore(); },
      deepsea(c, t) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d3550'); g.addColorStop(1, '#020b14'); rect(c, 0, 0, W, H, g);
        for (let i = 0; i < 5; i++) withA(c, .07, () => P(c, `M${150 + i * 200},0 L${250 + i * 200},0 L${60 + i * 230},${H} L${-80 + i * 230},${H}Z`, '#9fd6ff'));
        const wx = 540 + Math.sin(t * .25) * 60, wy = 1050; c.save(); c.translate(wx, wy); ell(c, 0, 0, 360, 150, '#071a26'); P(c, 'M330,0 Q430,-90 470,-160 Q480,-40 450,0 Q480,40 470,160 Q430,90 330,0Z', '#071a26'); circ(c, -240, -30, 10, '#2c5d7a'); c.restore();
        for (let i = 0; i < 18; i++) { const y = H - ((t * 60 + i * 140) % H), x = (i * 173) % W + Math.sin(t + i) * 10; withA(c, .35, () => circ(c, x, y, 5 + i % 4, null, '#bfe6ff', 2)); } },
      reeds(c, t) { for (let i = 0; i < 46; i++) { const x = (i * 47) % W, h = 160 + (i * 37) % 140, sw = Math.sin(t * 1.5 + i) * 10; P(c, `M${x},${GY + 30} Q${x + sw / 2},${GY - h / 2} ${x + sw},${GY - h}`, null, i % 2 ? '#6E8B3D' : '#58752F', 6); if (i % 3 === 0) ell(c, x + sw, GY - h, 7, 22, '#7B5A3A'); } },
      vines(c, t) { for (let r = 0; r < 3; r++) { const y = GY - 40 - r * 90; line(c, 0, y - 70, W, y - 70, '#6D4C41', 5); for (let x = 30 + r * 40; x < W; x += 130) { circ(c, x, y - 70, 54, r % 2 ? '#558B2F' : '#689F38'); for (let k = 0; k < 6; k++) circ(c, x - 12 + (k % 3) * 12, y - 30 + Math.floor(k / 3) * 14, 8, '#6A1B9A'); } } },
      flames(c, t) { const g = c.createRadialGradient(540, 1250, 50, 540, 1250, 900); g.addColorStop(0, 'rgba(255,170,60,.65)'); g.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        for (let i = 0; i < 14; i++) { const x = 140 + i * 58, h = 380 + Math.sin(t * 6 + i * 1.7) * 90 + (i % 3) * 60; P(c, `M${x - 70},1500 Q${x - 40},${1500 - h * .6} ${x + Math.sin(t * 5 + i) * 20},${1500 - h} Q${x + 40},${1500 - h * .6} ${x + 70},1500Z`, i % 2 ? '#FF7A1A' : '#FFB12E'); }
        for (let i = 0; i < 10; i++) { const x = 220 + i * 70; P(c, `M${x - 30},1500 Q${x},${1340 + Math.sin(t * 7 + i) * 30} ${x + 30},1500Z`, '#FFE58A'); } rect(c, 0, 1500, W, 420, '#2a1a12'); },
      ruins(c, t, tm) { const col = night(tm) ? '#5b5368' : '#C9AE88'; [[90, 520], [300, 360], [720, 460], [930, 300]].forEach(([x, h]) => { rect(c, x, GY - h, 80, h + 10, col); rect(c, x - 14, GY - h - 20, 108, 24, shade(col, -.1)); });
        P(c, `M420,${GY + 10} L420,${GY - 260} L520,${GY - 300} L560,${GY - 200} L640,${GY - 240} L640,${GY + 10}Z`, shade(col, -.08)); for (let i = 0; i < 9; i++) rr(c, 60 + i * 115, GY - 30 - (i % 2) * 20, 70, 40, 8, shade(col, -.18)); },
      pool(c, t) { ell(c, 540, GY + 80, 330, 70, '#3D9BC9'); for (let i = 0; i < 4; i++) withA(c, .5, () => P(c, `M${360 + i * 90},${GY + 70 + (i % 2) * 18} q20,-8 40,0`, null, '#E3F4FA', 4)); },
      camel(c, t, tm, a) { const x0 = +a || 500, x = x0 + ((t * 30) % 300) - 150, y = GY - 20, col = night(tm) ? '#1b1626' : '#6B4A2E', k = Math.sin(t * 3) * 8;
        c.save(); c.translate(x, y); ell(c, 0, -170, 130, 60, col); ell(c, -30, -230, 50, 40, col); ell(c, 50, -220, 45, 34, col); P(c, 'M120,-180 Q170,-260 190,-300 L215,-300 Q215,-270 200,-260 Q170,-200 140,-160Z', col);
        [-80, -40, 60, 95].forEach((lx, i) => line(c, lx, -140, lx + (i % 2 ? k : -k), 0, col, 16)); c.restore(); }
    });
    const ISL_DEFS = [
      ['desert', 'মরুভূমি', 'sky moon stars dunes palm:930 ground:sand'],
      ['desert_night', 'রাতের মরুভূমি', 'sky stars moon dunes ground:sand'],
      ['desert_caravan', 'মরুভূমিতে কাফেলা', 'sky stars moon dunes camel:420 camel:700 ground:sand'],
      ['oasis', 'মরূদ্যান', 'sky stars moon dunes pool palm:150 palm:930 ground:sand'],
      ['tent_camp', 'তাঁবুর পাশে', 'sky stars moon dunes tent:600 palm:170 ground:sand'],
      ['old_city', 'প্রাচীন শহর', 'sky stars moon oldtown ground:sand'],
      ['old_market', 'প্রাচীন বাজার', 'sky moon oldtown umbrellas ground:sand'],
      ['palace_hall', 'রাজপ্রাসাদ', 'palace'],
      ['prison_cell', 'কারাগার', 'stonewall cellwin floor:concrete'],
      ['desert_well', 'মরুভূমির কূপ', 'sky stars moon dunes well:540 tree:930 ground:sand'],
      ['cave_inside', 'গুহার ভেতর', 'cave'],
      ['cave_mouth', 'গুহার মুখ', 'sky stars moon rocks cavemouth ground:sand'],
      ['rocky_valley', 'পাহাড়ি উপত্যকা', 'sky stars moon rocks ground:sand'],
      ['stormy_sea', 'ঝড়ের সমুদ্র', 'sky stormsea ark'],
      ['ark_build', 'নৌকা তৈরির মাঠ', 'sky moon hills ark:land ground:sand'],
      ['deep_sea', 'গভীর সমুদ্র', 'deepsea'],
      ['river_reeds', 'নলখাগড়ার নদী', 'sky moon river reeds palm:950 ground:grass'],
      ['sea_shore', 'সমুদ্রতীর', 'sky stars moon waves ground:sand'],
      ['vineyard', 'আঙুর-খেজুরের বাগান', 'sky moon vines palm:110 palm:980 ground:grass'],
      ['great_fire', 'আগুনের কুণ্ড', 'dark flames'],
      ['ruined_town', 'ধ্বংসপ্রাপ্ত জনপদ', 'sky stars moon ruins ground:sand'],
      ['night_sky', 'তারাভরা আকাশ', 'sky stars moon hills'],
      ['mihrab_old', 'মিহরাব', 'wall:#E8DCC0 mihrab lantern floor:carpet'],
      ['farm_field', 'শস্যক্ষেত', 'sky moon hills ground:field']
    ];
    ISL_DEFS.forEach(([k, b, r]) => {
      PLACE_DEFS.push([k, b, 'ইসলামিক ইতিহাস', r]);
      const toks = r.split(/\s+/).filter(Boolean).map(s => { const fg = s[0] === '>'; const [n, ...a] = (fg ? s.slice(1) : s).split(':'); return { fg, n, a: a.join(':') }; });
      PLACE_INDEX[k] = { bn: b, group: 'ইসলামিক ইতিহাস', toks, outdoor: toks.some(x => x.n === 'sky') }; PLACES[k] = b;
    });
    // words in the narration → background (the scene follows the story)
    const CTX = [[/গভীর সমুদ্র|মাছের পেট|তিমি/, 'deep_sea'], [/ঝড়|প্লাবন|ঢেউ/, 'stormy_sea'], [/নৌকা তৈরি|নৌকা বানা/, 'ark_build'], [/সমুদ্র|সাগর/, 'sea_shore'], [/নদী|দরিয়া|ঝুড়ি|সিন্দুক/, 'river_reeds'], [/কূপ/, 'desert_well'], [/গুহা/, 'cave_mouth'],
      [/কারাগার|জেলখানা|বন্দি/, 'prison_cell'], [/প্রাসাদ|দরবার|সিংহাসন|বাদশাহ|রাজা|ফেরাউন|রানি|রানী/, 'palace_hall'], [/বাজার|কাফেলা/, 'desert_caravan'], [/বাগান|আঙুর/, 'vineyard'], [/আগুন|অগ্নিকুণ্ড/, 'great_fire'],
      [/তাঁবু/, 'tent_camp'], [/শহর|নগর|জনপদ|গ্রাম/, 'old_city'], [/পাহাড়|উপত্যকা|পর্বত/, 'rocky_valley'], [/খেজুর|মরূদ্যান|ঝরনা|ঝর্ণা/, 'oasis'], [/মরুভূমি|মরুপ্রান্তর/, 'desert'], [/আকাশ|তারা|চাঁদ/, 'night_sky'], [/মিহরাব|ইবাদতখানা/, 'mihrab_old'], [/ধ্বংস/, 'ruined_town'], [/ক্ষেত|শস্য/, 'farm_field']];
    CTX_PLACES.length = 0; CTX.forEach(x => CTX_PLACES.push(x));
  }

  /* ---------- the quote scene: exact text with its reference ---------- */
  function drawAyah(c, si, t) {
    const R = this, sc = R.story.scenes[si], lt = t - sc.start;
    const g = c.createRadialGradient(540, 820, 80, 540, 900, 1300); g.addColorStop(0, '#1E5A40'); g.addColorStop(1, '#06170F'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (!R._pat) { const cv = document.createElement('canvas'); cv.width = cv.height = 180; const pc = cv.getContext('2d'); pc.strokeStyle = 'rgba(233,196,106,.12)'; pc.lineWidth = 3;
      const star = (x, y, r) => { pc.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, rr2 = i % 2 ? r * .55 : r; pc.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } pc.closePath(); pc.stroke(); };
      star(90, 90, 70); star(0, 0, 40); star(180, 0, 40); star(0, 180, 40); star(180, 180, 40); R._pat = c.createPattern(cv, 'repeat'); }
    c.save(); c.fillStyle = R._pat; c.translate(0, -(t * 6) % 180); c.fillRect(0, 0, W, H + 180); c.restore();
    for (let i = 0; i < 26; i++) { const x = (i * 197) % W, y = (i * 331 + t * 14 * (1 + i % 3)) % H; withA(c, .1 + (i % 4) * .05, () => circ(c, x, y, 2 + i % 3, '#F3E3C6')); }
    const k = back(lt, .05, .55); if (k <= 0) return;
    const isQ = !/বুখারি|হাদিস/.test(sc.ref || '') ; const label = isQ ? 'আল-কুরআন' : 'হাদিস';
    const [a, b] = R.shotRangeOfScene(si); let cur = R.shotAt(t); if (cur < a) cur = a; if (cur > b) cur = b; const curLi = R.tl.shots[cur] ? R.tl.shots[cur].li : 0;
    const intro = sc.lines[0] ? sc.lines[0].cap : ''; const qlines = sc.lines.slice(1);
    const qtxt = qlines.map(l => l.cap); const qlen = qtxt.join(' ').length; let size = qlen > 260 ? 52 : qlen > 160 ? 58 : 64;
    let wrapped = []; const wrapAll = () => { wrapped = []; qtxt.forEach((s, i) => wrapText(c, s, size, 860, 700, 'TFSerif').forEach(w => wrapped.push({ w, i: i + 1 }))); };
    wrapAll(); while (size > 36 && wrapped.length * size * 1.42 > 1080) { size -= 4; wrapAll(); } // long passages: smaller text so it fits
    const lh = size * 1.42; const arL = sc.arabic ? (() => { c.font = `600 50px "Amiri","Noto Naskh Arabic","Scheherazade New",serif`; const ws = sc.arabic.split(' '), out = []; let lineS = ''; ws.forEach(w => { const tst = lineS ? lineS + ' ' + w : w; if (c.measureText(tst).width > 860 && lineS) { out.push(lineS); lineS = w; } else lineS = tst; }); if (lineS) out.push(lineS); return out.length <= 4 ? out : []; })() : [];
    const top = 300, boxH = 250 + arL.length * 78 + wrapped.length * lh + 150 + (sc.trans ? 40 : 0); const y0 = Math.max(220, 960 - boxH / 2);
    popAt(c, 540, y0 + boxH / 2, k, () => {
      c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; c.shadowOffsetY = 14; rr(c, 70, y0, 940, boxH, 44, 'rgba(8,30,20,.88)'); c.restore();
      rr(c, 86, y0 + 16, 908, boxH - 32, 34, null, 'rgba(233,196,106,.55)', 3);
      c.font = `700 40px ${FONT_BN}, ${FONT_FALLBACK}`; const lw = c.measureText(label).width + 80; rr(c, 540 - lw / 2, y0 - 34, lw, 68, 34, '#E9C46A'); txt(c, label, 540, y0 + 12, 40, '#0B2A1C', 400, 'center', 'TFGalada');
      let y = y0 + 110;
      if (intro) { txt(c, intro, 540, y, 44, '#E9C46A', 400, 'center', 'TFGalada', 860); y += 40; }
      if (arL.length) { c.save(); c.direction = 'rtl'; c.font = `600 50px "Amiri","Noto Naskh Arabic","Scheherazade New",serif`; c.textAlign = 'center'; c.fillStyle = '#F6E7BF'; arL.forEach((l, i) => c.fillText(l, 540, y + 70 + i * 78)); c.restore(); y += arL.length * 78 + 30; line(c, 380, y + 10, 700, y + 10, 'rgba(233,196,106,.6)', 3); y += 10; }
      y += 30;
      wrapped.forEach((o, i) => { const on = o.i === curLi || curLi === 0; withA(c, on ? 1 : .42, () => txt(c, o.w, 540, y + lh * (i + .8), size, on ? '#FFF6E2' : '#D9CFB8', 700, 'center', 'TFSerif', 900)); });
      y += wrapped.length * lh + 40;
      withA(c, fin(lt, .6, .5), () => txt(c, '— ' + (sc.ref || ''), 540, y + 30, 38, '#E9C46A', 700, 'center', 'TFSerif', 880));
      if (sc.trans) withA(c, fin(lt, .8, .5) * .75, () => txt(c, 'অনুবাদ: ' + sc.trans, 540, y + 76, 28, '#CFC3A6', 400, 'center', 'TFSerif', 880));
    });
  }

  /* ---------- YouTube / Facebook texts for an Islamic story ---------- */
  function islPublishPack(st) {
    const b = st.book || {}, ref = b.title || '', src = b.author || ''; const isQ = !/বুখারি|হাদিস/.test(ref + src);
    const hook = (st.title || '').split('|')[0].trim(); const ser = S.series || 'প্রশান্তির বার্তা', tag = S.tagline || 'কুরআন ও হাদিসের আলোয়';
    const ay = st.scenes.find(x => x.type === 'ayah'); const intro = ay && ay.lines[0] ? ay.lines[0].cap : ''; const quote = ay ? ay.lines.slice(1).map(l => l.cap).join(' ') : '';
    const tk = st.scenes.filter(x => x.type === 'takeaways').flatMap(x => x.lines.map(l => { const it = String(l.item || '').trim(), cap = String(l.cap || '').trim(); return it && cap.startsWith(it) ? it + ': ' + cap.slice(it.length).trim() : cap; })).slice(0, 3);
    const cta = (st.scenes.find(x => x.type === 'cta') || {}).cta || {}; const q = cta.question || '';
    const y = st.youtube || {}; let hs = (y.hashtags || []).filter(h => /^#/.test(h)); ['#Shorts', '#' + ser.replace(/\s+/g, '_'), '#ইসলামিক_গল্প', isQ ? '#কুরআনের_গল্প' : '#হাদিসের_গল্প'].forEach(h => { if (!hs.some(x => x.toLowerCase() === h.toLowerCase())) hs.push(h); }); hs = hs.slice(0, 8);
    let ytTitle = hook; if (ref && (ytTitle + ' | ' + ref).length <= 100) ytTitle += ' | ' + ref; ytTitle = ytTitle.slice(0, 100);
    const desc = [hook, '', y.description || '', '', quote ? (intro ? intro + ' ' : '') + '“' + quote + '”' : '', ref ? '📖 সূত্র: ' + ref + (src ? ' (' + src + ')' : '') : '', '', tk.length ? 'আমাদের জীবনে:' : '', ...tk.map(x => '• ' + x), '', q ? `💬 ${q} কমেন্টে লিখুন।` : '', '', `▶ ${ser} — ${tag}`, 'ভিডিওটি উপকারী মনে হলে প্রিয়জনদের সাথে শেয়ার করুন।', 'নতুন গল্প পেতে চ্যানেলটি সাবস্ক্রাইব করে রাখুন।', '', hs.join(' ')]
      .filter((x, i, a) => x || (a[i - 1] && i < a.length - 1)).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    const name = ref.replace(/,.*$/, '').trim();
    const tags = [hook, ref, name, src, 'ইসলামিক গল্প', isQ ? 'কুরআনের গল্প' : 'হাদিসের গল্প', /\(আ\.\)/.test(st.title) ? 'নবীদের কাহিনি' : '', isQ ? 'quran story bangla' : 'hadith story bangla', 'islamic story bangla', 'ইসলামিক ভিডিও', ser].filter(Boolean).map(x => String(x).replace(/,/g, ' ').replace(/\s+/g, ' ').trim()).filter((x, i, a) => x && a.indexOf(x) === i);
    let tagStr = ''; for (const x of tags) { if ((tagStr + ', ' + x).length > 480) break; tagStr = tagStr ? tagStr + ', ' + x : x; }
    const fb = [hook, '', y.description || '', '', quote ? '“' + quote + '”' : '', ref ? '— ' + ref : '', '', ...tk.slice(0, 2).map(x => '• ' + x), '', q ? `💬 ${q}` : '', q ? 'কমেন্টে লিখুন 👇' : '', '', `${ser} | ${tag}`, '', hs.filter(h => h !== '#Shorts').concat(['#Reels']).join(' ')]
      .filter((x, i, a) => x || (a[i - 1] && i < a.length - 1)).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    return { ytTitle, desc, tags: tagStr, fb };
  }

  // places that already show people in prayer: no extra characters there
  const CROWD = /^(mosque_salah|eid_salah|tahajjud_room|night_dua|kaaba_view)\b/;

  /* ---------- how every story should feel (ready-made, AI or pasted from Gemini/ChatGPT) ---------- */
  const CINEMA_RULES = `- গল্পটা একটা ছোট আবেগময় নাটকের মতো: আগে মানুষের কষ্ট, টানাপোড়েন, নীরবতা — তারপর ধীরে ধীরে আল্লাহর দিকে ফেরা, তারপর আয়াত/হাদিস, তারপর বদলে যাওয়া।
- প্রতিটা বাক্যে দর্শক যেন আটকে থাকে: ছোট বাক্য, বর্তমান কাল, চোখে দেখা যায় এমন খুঁটিনাটি (ঘড়ির টিকটিক, ঠান্ডা মেঝে, বৃষ্টির শব্দ, কাঁপা হাত, পুরোনো জায়নামাজ)।
- মাঝে মাঝে এক লাইনের নীরব মুহূর্ত ("ঘরটা চুপ।"), মনের ভেতরের কথা, আর একটা প্রতীকী জিনিস (মায়ের চিঠি, পুরোনো তাসবিহ, বাবার ছাতা) যা শেষে আবার ফিরে আসে।
- কান্না আসবে সত্যিকারের অনুভূতি থেকে, অতিরঞ্জন থেকে নয়। শেষটা আশা আর আল্লাহর রহমতের দিকে।
- দোয়া করলেই দুনিয়াবি জিনিস নিশ্চিত পাওয়া যায় — এমন দাবি নয়; ফল আল্লাহর ইচ্ছায়, আর শান্তি আসে ভরসায়।`;
  const STYLES = [
    'বর্ণনার ধরন: ফ্ল্যাশব্যাক — শেষের কাছাকাছি একটা মুহূর্ত দিয়ে শুরু করো, তারপর "কয়েক মাস আগে..." বলে পেছনে যাও।',
    'বর্ণনার ধরন: চিঠি/ডায়েরি — গল্পের একটা অংশ কোনো চরিত্রের চিঠি বা ডায়েরির ভাষায় বলা হবে।',
    'বর্ণনার ধরন: "আপনি" — শুরুতে দর্শককে সরাসরি "আপনি" বলে গল্পের ভেতরে টেনে নাও, তারপর চরিত্রের গল্প।',
    'বর্ণনার ধরন: একটা জিনিসের চোখে — পুরোনো জায়নামাজ, তাসবিহ বা ঘড়ি নিজে গল্পটা বলছে, শেষে মানুষের কণ্ঠে ফেরা।',
    'বর্ণনার ধরন: দুই সময় — "তখন" আর "এখন" পাশাপাশি কাটাকাটি করে দেখাও।',
    'বর্ণনার ধরন: রহস্য — শুরুতে একটা প্রশ্ন রেখে দাও, উত্তরটা শেষে একটা নরম টুইস্টে খুলবে।',
    'বর্ণনার ধরন: সময় গুনে — রাত ২:৪৭, ২:৫৩, ৩:০০... এভাবে সময় ধরে উত্তেজনা বাড়াও।',
    'বর্ণনার ধরন: সংলাপ-নির্ভর — দুই চরিত্রের ছোট ছোট কথোপকথনে গল্প এগোবে, মাঝে কথকের বর্ণনা।'
  ];
  function styleRule() { let n = 0; try { n = +(localStorage.getItem('tf_isl_style') || 0); localStorage.setItem('tf_isl_style', String((n + 1) % STYLES.length)); } catch (e) { } return '- ' + STYLES[n % STYLES.length] + ' (প্রতিবার ভিন্ন ধরন, যাতে ভিডিওগুলো একঘেয়ে না হয়)'; }
  const LIFE_TOPICS = ['তাহাজ্জুদ ও শেষ রাতের দোয়া', 'ধৈর্য ও আশা', 'বাবা-মায়ের খেদমত', 'হালাল রুজি ও সততা', 'তাওবা ও ফিরে আসা', 'ক্ষমা ও রাগ নিয়ন্ত্রণ', 'দান ও মানবতা', 'শুকরিয়া', 'মৃত্যু ও আখিরাতের স্মরণ', 'নামাজে ফেরা', 'প্রবাস জীবন', 'অসুস্থতা ও ধৈর্য', 'দাম্পত্য ও পরিবার', 'সন্তান হারানো মা'];
  function buildLifePrompt(topic, idea) {
    const places = Object.entries(PLACE_INDEX).filter(([k, v]) => !v.legacy).map(([k, v]) => `${k} (${v.bn})`).slice(0, 400).join(', ');
    return `তুমি একজন দক্ষ বাংলা চিত্রনাট্যকার ও ইসলামিক গল্পকার। "${S.series || 'প্রশান্তির বার্তা'}" চ্যানেলের জন্য বাস্তব জীবনের একটা আবেগময়, সিনেমাটিক ইসলামিক গল্প লেখো — নিচের "TF Script" ফরম্যাটে। এক কথকের কণ্ঠে পড়া হবে (Cartesia AI)।

## বিষয়
${topic}${idea ? '\nগল্পের ভাবনা: ' + idea : ''}

## কীভাবে লিখবে
${CINEMA_RULES}
${styleRule()}
- কাঠামো: হুক → পটভূমি → চাপ বাড়ে (২-৩ ধাপে) → সবচেয়ে ভাঙা মুহূর্ত → আল্লাহর দিকে ফেরা (ওজু, সিজদা, মনে পড়া একটা কথা) → "## ayah" দৃশ্য → বাস্তবসম্মত বদল → "## takeaways" → "## cta"।
- মোট ৩০-৪০ লাইন (ayah দৃশ্যের লাইন বাদে), ৫-৭টা গল্পের দৃশ্য।
- চরিত্র শুধু সাধারণ মানুষ (নবী, সাহাবি বা ফেরেশতাকে কখনো চরিত্র বানাবে না)। পর্দায় মুখ দেখা যায় না, তাই মুখের বর্ণনা নয়, শরীরের ভাষা ও পরিবেশ দিয়ে আবেগ বোঝাও।
- নবীদের নামের পরে (আ.), রাসূলুল্লাহর পরে ﷺ, সাহাবির পরে (রা.)।

## আয়াত/হাদিস (খুব সাবধানে)
- গল্পের মূল কথার সাথে মেলে এমন একটা সুপরিচিত আয়াত দাও, যার সূরা ও আয়াত নম্বর তুমি নিশ্চিত জানো। অথবা সহিহ বুখারি/সহিহ মুসলিমের একটা সুপরিচিত হাদিস, নম্বরসহ — নিশ্চিত না হলে হাদিস নয়, আয়াত দাও।
- ayah দৃশ্যের লেখা হুবহু এই ফরম্যাটে (কুরআনের ক্ষেত্রে "উৎস: q সূরা:আয়াত" লাইনটা অবশ্যই দেবে — অ্যাপ ইন্টারনেট থাকলে মূল অনুবাদ বসিয়ে নেবে):
## ayah | সূরা আল-বাকারা, আয়াত ১৫৩
উৎস: q 2:153
- আল্লাহ তাআলা বলেন,
- (আয়াতের বাংলা অর্থ, ছোট ছোট লাইনে)
- হাদিস হলে: "## ayah | সহিহ বুখারি, হাদিস ৬১১৪", "উৎস: h bukhari 6114", "- রাসূলুল্লাহ ﷺ বলেছেন," তারপর অর্থ।

## কণ্ঠ যেন স্বাভাবিক শোনায়
- প্রতিটা লাইন ৫-১৪ শব্দ, শেষে দাঁড়ি/প্রশ্নবোধক/বিস্ময়। ইমোজি, বন্ধনীতে নির্দেশনা, "..." দেবে না।
- প্রতিটা লাইনের শেষে {১-২টা মূল শব্দ} সোনালি করার জন্য।

## TF Script ফরম্যাট (হুবহু, একটা কোড ব্লকে)
\`\`\`
=== শিরোনাম (কৌতূহল জাগানো, আবেগের, ৫-১০ শব্দ)
থাম্বনেল: লাল ফিতার কৌতূহল-লাইন (৪-৭ শব্দ) | বড় লাইন ১ (২-৪ শব্দ) | বড় লাইন ২-এর {মূল শব্দ} | book | ১
চরিত্র: rafiq=রফিক/pious_young/m, ma=মা/hijabi_mother/f
## tahajjud_room night sad | রাত ৩টা |
একটা লাইন। {মূল শব্দ}
rafiq:crying:pray_hands চরিত্রের ভাব দেখাতে লাইনের শুরুতে কোড:ভাব:কাজ। {শব্দ}
## ayah | ...
...
## takeaways
<মূল শব্দ> একটা শিক্ষা। {শব্দ}
## cta | দর্শকের জন্য নরম প্রশ্ন? | বিকল্প ১, বিকল্প ২, বিকল্প ৩
প্রশ্নটা আবার, শেষে কমেন্টে লিখুন। {কমেন্টে লিখুন}
বর্ণনা: ২ লাইনের বর্ণনা
হ্যাশট্যাগ: #Shorts #ইসলামিক_গল্প #...
\`\`\`
- দৃশ্যের লাইন: "## জায়গা সময় মেজাজ [rain/fog] | ব্যাজ | চরিত্র-কোড,চরিত্র-কোড" (কেউ না থাকলে শেষ ঘর খালি)।
- জায়গা: ${places}
- প্রাণী দেখাতে: জায়গা+প্রাণী:x, যেমন village_yard+goat:300+cow:760 (goat, sheep, dumba, cow, camel, horse, donkey, doves, cat)।
- চরিত্রের ধরন: pious_young, imam, hujur, hajji, muezzin, talib, madrasa_boy, muslimah, hijabi_mother, hijabi_girl, alima, nani_hijab, father, mother, son, daughter, husband, wife, uncle, doctor_m, teacher_m, shopkeeper, rickshaw_puller, student_m, boss_m, little_boy, little_girl (নারী চরিত্রে muslimah/hijabi_* ভালো)।
- ভাব: neutral, happy, sad, worried, surprised, angry, crying, tired, proud, shy | কাজ: idle, talk, phone, hold, pray_hands, head_down, hands_on_head, wave
- সময়: day, evening, night | মেজাজ: normal, happy, sad, tense, regret
শুধু কোড ব্লকটা দাও।`;
  }
  async function lifeGenerate(topic, idea) {
    if (BUSY) { busyToast(); return; }
    const prompt = buildLifePrompt(topic, idea), ai = whichAI();
    if (ai === 'chat') { PENDING = { life: true, prompt }; const box = $('islChat'); showSrc('lib'); box.classList.remove('hidden'); $('islChatTitle').textContent = 'নতুন জীবনের গল্প — ' + topic; $('islChatIn').value = ''; box.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    BUSY = 'life'; showSrc('lib'); islRenderLib();
    try { setStat(`${ai === 'claude' ? 'Claude' : 'Gemini'} নতুন গল্প লিখছে… (৩০-৯০ সেকেন্ড)`); const tx = await aiComplete(prompt, ai); await saveLife(tx); }
    catch (e) { setStat(e.message, 'err'); toast(e.message, 'err', 8000); } finally { BUSY = false; islRenderLib(); }
  }
  async function saveLife(tx) {
    let t = (splitStories(tx)[0] || tx).replace(/```[a-z]*/gi, '').trim(); validateStory(t);
    const id = 'isl_life_' + Date.now().toString(36); t = await verifyQuran(t, null);
    USERLIB.push({ id, txt: t, at: Date.now() }); await saveUserLib(); updateMyLibInfo();
    setStat('✓ নতুন গল্প লাইব্রেরিতে রাখা হয়েছে (নিজের যোগ করা)', 'ok');
    if (await loadAny(t, { libId: id })) { app.libId = id; autosave(); toast('গল্প তৈরি — দৃশ্য দেখে কণ্ঠ দিন', 'ok', 6000); }
  }
  /* ---------- library UI ---------- */
  let BUSY = false, PENDING = null, CUR_TITLE = '';
  /* batch writing: SEL = ticked stories waiting to be written, Q = the running queue */
  const SEL = new Set(), WQ = { running: false, stop: false, total: 0, done: 0, wait: new Set() };
  const busyToast = () => toast('এখন লেখা হচ্ছে: "' + (CUR_TITLE || 'একটা গল্প') + '"' + (WQ.running ? ` (${bn(WQ.done + 1)}/${bn(WQ.total)})` : '') + ' — শেষ হলে বাকিটা চাপুন', '', 4200);
  const genOf = id => USERLIB.slice().reverse().find(u => u.src === id) || null;
  const G_OWN = 'নিজের যোগ করা', G_LIFE = 'জীবনের গল্প';
  const PRE = () => (window.ISL_STORIES || []);
  /* used list + history (when it was used) */
  const HKEY = 'tf_isl_hist';
  const hist = () => { try { return JSON.parse(localStorage.getItem(HKEY) || '{}') || {}; } catch (e) { return {}; } };
  const setHist = h => { try { localStorage.setItem(HKEY, JSON.stringify(h)); } catch (e) { } };
  const usedId = id => !!id && usedList().includes('LIB:' + id);
  const usedU = u => !!u && usedId(u.id);
  function toggleUsed(id) {
    const key = 'LIB:' + id, u = usedList(), h = hist();
    if (u.includes(key)) { try { localStorage.setItem(LK('tf_used'), JSON.stringify(u.filter(x => x !== key))); } catch (e) { } delete h[id]; toast('ব্যবহৃত তালিকা থেকে সরানো হলো'); }
    else { addUsed(key); h[id] = Date.now(); toast('✓ ব্যবহৃত হিসেবে চিহ্নিত', 'ok'); }
    setHist(h); islRenderLib();
  }
  const dateBn = ts => { const d = new Date(ts); return bn(d.getDate()) + ' ' + ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলাই', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'][d.getMonth()]; };
  const titleOf = txt => ((String(txt).match(/^\s*===\s*(.*)$/m) || [, ''])[1] || '').trim();
  const ayahRefOf = txt => ((String(txt).match(/^\s*##\s*ayah\s*\|\s*([^|\n]*)/m) || [, ''])[1] || '').trim();
  function rows() {
    const q = ($('libSearch').value || '').trim().toLowerCase(), grp = $('libBook').value, f = $('libFilter').value, h = hist();
    const pre = PRE().map(x => ({ pre: true, id: x.id, title: titleOf(x.txt), ref: ayahRefOf(x.txt), group: G_LIFE + ' · ' + x.cat, top: G_LIFE, u: { id: x.id, txt: x.txt } }));
    const own = USERLIB.filter(u => !u.src || !ISL_BY_ID[u.src]).map(u => { const m = libMeta(u.txt, u.id, 0, true); return { own: true, id: u.id, title: m.title, ref: (u.txt.match(/^\s*বই:\s*([^|\n]*)/m) || [, ''])[1].trim(), group: G_OWN, top: G_OWN, u }; });
    const src = ISL_LIB.map(it => ({ it, id: it.id, title: it.title, ref: fullRef(it), group: it.group, top: it.group, u: genOf(it.id) }));
    const all = pre.concat(src, own.reverse());
    all.forEach((r, i) => { r.n = i + 1; r.at = r.u ? h[r.u.id] || 0 : 0; });
    let list = all.filter(r => (!grp || r.group === grp || r.top === grp) && (f === 'all' || (f === 'ready' ? !!r.u : f === 'todo' ? !r.u : f === 'used' || f === 'hist' ? usedU(r.u) : !usedU(r.u))) && (!q || (r.title + ' ' + r.ref + ' ' + r.group).toLowerCase().includes(q)));
    if (f === 'hist') list = list.slice().sort((a, b) => b.at - a.at);
    return { all, list };
  }
  function islRenderLib() {
    const ul = $('libList'); if (!ul) return; ul.innerHTML = ''; const { all, list } = rows();
    { const nU = all.filter(r => usedU(r.u)).length, a = $('libNewN'), b = $('libUsedN'); if (a) a.textContent = bn(all.length - nU); if (b) b.textContent = bn(nU); document.querySelectorAll('#libChips .lchip[data-lt]').forEach(c => { const fv = $('libFilter').value, on = c.dataset.lt === (fv === 'used' || fv === 'hist' ? 'used' : fv === 'new' ? 'new' : ''); /* "সব" lights no chip */ c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); }); }
    $('libCount').textContent = `${bn(list.length)}টা দেখাচ্ছে · ✅ লেখা আছে ${bn(all.filter(r => r.u).length)} · ⬜ লেখা হয়নি ${bn(all.filter(r => !r.u).length)} · ব্যবহৃত ${bn(all.filter(r => usedU(r.u)).length)}`;
    const frag = document.createDocumentFragment();
    list.forEach(r => {
      const used = usedU(r.u), writing = BUSY === r.id, queued = WQ.wait.has(r.id), canPick = !!r.it && !r.u;
      /* status badge: ✅ written (in the library) · ⬜ not written yet · ✍️ writing now · ⏳ waiting in the queue */
      const badge = writing ? el('span', { class: 'islst wr', text: '✍', title: 'লেখা হচ্ছে' })
        : queued ? el('span', { class: 'islst qd', text: '⏳', title: 'লাইনে আছে' })
        : r.u ? null
        : el('span', { class: 'islst todo', text: '○', title: 'লেখা হয়নি' });
      const second = r.u
        ? el('button', { type: 'button', class: 'islst del ' + (used ? 'ok used' : 'ok2'), title: used ? 'ব্যবহৃত — চাপলে টিক উঠে যাবে' : 'ভিডিও বানানো হলে এখানে টিক দিন', text: used ? '✓' : '○', onclick: e => { e.stopPropagation(); toggleUsed(r.u.id); } })
        : (canPick && !WQ.running ? el('label', { class: 'islst del pick' + (SEL.has(r.id) ? ' on' : ''), onclick: e => e.stopPropagation() },
          el('input', { type: 'checkbox', checked: SEL.has(r.id), onchange: e => { e.target.checked ? SEL.add(r.id) : SEL.delete(r.id); islRenderLib(); } }), '') : null);
      const re = r.u && r.it ? el('button', { type: 'button', class: 'islre del', title: 'নতুন করে লিখুন', 'aria-label': 'নতুন করে লিখুন', text: '↻', onclick: e => { e.stopPropagation(); islGenerate(r.it, { fresh: true }); } }) : null;
      frag.append(el('li', { class: (r.u && app.libId === r.u.id ? 'cur' : '') + (writing ? ' busy' : '') + (used ? ' usedrow' : '') + (!r.u ? ' todorow' : '') + (SEL.has(r.id) ? ' picked' : ''), onclick: e => { if (e.target.closest('.del')) return; islOpen(r); } },
        el('span', { class: 'no', text: bn(r.n) }), el('span', { class: 't' }, el('b', { text: r.title }), el('span', { text: `${r.ref} · ${r.group}` + (r.pre ? ' · অফলাইনে তৈরি' : '') })), el('span', { class: 'islside' }, badge, second), re));
    });
    if (!list.length) frag.append(el('li', { class: 'muted', text: 'কিছু পাওয়া যায়নি' }));
    ul.append(frag); updateSelBar();
  }
  function islFillFilters() {
    const b = $('libBook'), f = $('libFilter'); const cb = b.value, cf = f.value;
    const cats = Array.from(new Set(PRE().map(x => x.cat)));
    const groups = [[G_LIFE, `${G_LIFE} (তৈরি, অফলাইন)`]].concat(cats.map(c => [G_LIFE + ' · ' + c, '— ' + c]), [[G_PROPHET, G_PROPHET], [G_QURAN, G_QURAN], [G_HADITH, G_HADITH], [G_OWN, G_OWN]]);
    b.className = 'lchip'; b.removeAttribute('aria-hidden'); b.tabIndex = 0; b.style.display = 'inline-flex'; const ch = $('libChips'); if (ch && b.parentNode !== ch) ch.append(b); const ar = $('libArea'); if (ar) ar.style.display = 'none'; b.innerHTML = ''; b.append(el('option', { value: '', text: 'সব ধরন' }), ...groups.map(([v, tx]) => el('option', { value: v, text: tx }))); b.value = groups.some(g => g[0] === cb) ? cb : '';
    if (!f.dataset.isl) { f.innerHTML = ''; f.append(...[['all', 'সব'], ['new', 'অব্যবহৃত'], ['used', 'ব্যবহৃত'], ['hist', 'ইতিহাস (সাম্প্রতিক আগে)'], ['ready', 'তৈরি আছে'], ['todo', 'এখনো লেখা হয়নি']].map(([v, tx]) => el('option', { value: v, text: tx }))); f.dataset.isl = '1'; f.value = 'new'; } else f.value = cf || 'new'; /* start on "নতুন" (unused) — the chip that is lit */
  }
  async function islOpen(r) {
    if (BUSY) { busyToast(); return; }
    if (r.u) { const txt = await verifyQuran(r.u.txt, r.u.id); await loadLib({ id: r.u.id, txt }); islRenderLib(); return; }
    if (r.it) islGenerate(r.it);
  }
  /* ready-made stories carry "উৎস: q 2:153": with internet the app swaps in the official translation (and Arabic), once, and keeps it */
  async function verifyQuran(txt, id) {
    const m = String(txt).match(/^\s*উৎস\s*[:：]\s*q\s+(\d+):(\d+)(?:-(\d+))?\s*$/m); if (!m || /^\s*অনুবাদ\s*[:：]/m.test(txt)) return txt;
    const s = +m[1], f = +m[2], t = +(m[3] || m[2]), key = `tf_isl_qv:${s}:${f}-${t}`;
    let v = null; try { v = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { }
    if (!v) {
      try {
        setStat('আয়াতের মূল অনুবাদ মিলিয়ে নেওয়া হচ্ছে…');
        const j = await getJson(`${QAPI}surah/${s}/editions/quran-uthmani,${QTRANS}?offset=${f - 1}&limit=${t - f + 1}`, 7000);
        const ar = j.data && j.data[0] && j.data[0].ayahs, bnA = j.data && j.data[1] && j.data[1].ayahs;
        if (ar && bnA && ar.length === t - f + 1 && ar[0].numberInSurah === f) { v = { ar: ar.map((x, i) => stripBismillah(nrm(x.text), s, f + i)).join(' ۝ '), bn: bnA.map(x => nrm(x.text)) }; try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } }
        setStat('');
      } catch (e) { setStat(''); return txt; } // offline: keep the built-in meaning
    }
    if (!v) return txt;
    const lines = String(txt).split('\n'), out = []; let i = 0;
    for (; i < lines.length; i++) {
      out.push(lines[i]);
      if (/^\s*##\s*ayah\b/i.test(lines[i])) {
        let j2 = i + 1, intro = null; const keep = [];
        for (; j2 < lines.length && !/^\s*##/.test(lines[j2]); j2++) { const l = lines[j2].trim(); if (/^উৎস\s*[:：]/.test(l)) keep.push(l); else if (intro === null && /^-\s*/.test(l)) intro = l; }
        out.push(...keep); if (intro) out.push(intro);
        if (v.ar.length <= 520) out.push('আরবি: ' + v.ar);
        v.bn.forEach(b => chunkExact(b).forEach(c => out.push('- ' + c)));
        out.push('অনুবাদ: মুহিউদ্দীন খান');
        i = j2 - 1;
      }
    }
    const nt = out.join('\n');
    const pre = PRE().find(x => x.id === id); if (pre) pre.txt = nt; else { const u = USERLIB.find(x => x.id === id); if (u) { u.txt = nt; saveUserLib(); } }
    return nt;
  }
  function setStat(s, kind) { const e = $('islStat'); if (!e) return; e.textContent = s || ''; e.className = 'keystat' + (kind === 'ok' ? ' ok' : kind === 'err' ? ' bad' : ''); e.classList.toggle('hidden', !s); }
  function whichAI() {
    const has = id => !!getKey(id); const pref = S.aiTab;
    if (pref === 'claude' && has('aKey')) return 'claude'; if (pref === 'gemini' && has('gKey')) return 'gemini'; if (pref === 'chat') return 'chat';
    return has('aKey') ? 'claude' : has('gKey') ? 'gemini' : 'chat';
  }
  async function islGenerate(item, o) {
    o = o || {}; if (BUSY) { busyToast(); return false; }
    BUSY = item.id; CUR_TITLE = item.title; islRenderLib();
    try {
      setStat('আসল লেখা ডাউনলোড হচ্ছে… (' + fullRef(item) + ')');
      const src = await fetchSource(item);
      if (item.kw && !item.kw.test(src.segs.map(x => x.bn).join(' ')) && !o.quiet) {
        if (!confirm(`ডাউনলোড করা লেখায় এই গল্পের মূল শব্দ পাওয়া যায়নি (${fullRef(item)})। তবুও এগোবেন?\n\nশুরু: ${src.segs[0].bn.slice(0, 140)}…`)) { setStat(''); return false; }
      }
      const prompt = buildIslPrompt(item, src); const ai = o.ai || whichAI();
      if (ai === 'chat') { if (o.quiet) throw new Error('API key নেই'); openChat(item, src, prompt); setStat(''); return false; }
      setStat(`${ai === 'claude' ? 'Claude' : 'Gemini'} গল্প লিখছে… (২০-৬০ সেকেন্ড)`);
      const text = await aiComplete(prompt, ai); if (!String(text).trim()) throw new Error('AI খালি উত্তর দিয়েছে — আবার চেষ্টা করুন');
      return await saveAndOpen(item, src, text, o);
    } catch (e) { setStat(e.message, 'err'); if (!o.quiet) toast(e.message, 'err', 8000); return false; }
    finally { BUSY = false; islRenderLib(); }
  }
  async function saveAndOpen(item, src, text, o) {
    const final = islExpand(text, src, item); validateStory(final);
    const id = 'isl_' + item.id.replace(/[^a-z0-9-]/gi, '') + '_' + Date.now().toString(36);
    if (o && o.fresh) { const old = genOf(item.id); if (old) USERLIB.splice(USERLIB.indexOf(old), 1); }
    USERLIB.push({ id, txt: final, at: Date.now(), src: item.id }); await saveUserLib(); updateMyLibInfo();
    setStat('✓ "' + item.title + '" তৈরি হয়ে লাইব্রেরিতে রাখা হয়েছে', 'ok');
    if (!o || !o.noLoad) { if (await loadAny(final, { libId: id })) { app.libId = id; autosave(); toast('গল্প তৈরি — পরের ধাপে দৃশ্য দেখুন, তারপর কণ্ঠ দিন', 'ok', 6000); } }
    islRenderLib(); return true;
  }
  function openChat(item, src, prompt) {
    PENDING = { item, src, prompt }; const box = $('islChat'); box.classList.remove('hidden');
    $('islChatTitle').textContent = item.title + ' — ' + fullRef(item); $('islChatIn').value = '';
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  /* ----- tick several unwritten stories → write them all one after another into the library ----- */
  function updateSelBar() {
    const bar = $('islSelBar'); if (!bar) return;
    const { list } = rows(), todo = list.filter(r => r.it && !r.u).length, n = [...SEL].filter(id => ISL_BY_ID[id] && !genOf(id)).length;
    bar.classList.toggle('hidden', !todo && !n && !WQ.running);
    $('islSelInfo').textContent = WQ.running ? `✍️ ${bn(WQ.done)}/${bn(WQ.total)} লেখা হয়েছে${CUR_TITLE && BUSY ? ' — এখন: ' + CUR_TITLE : ''}` : n ? `${bn(n)}টা গল্প বাছা আছে` : `এই তালিকায় ${bn(todo)}টা গল্প এখনো লেখা হয়নি`;
    $('islSelAll').classList.toggle('hidden', WQ.running || !todo); $('islSelClr').classList.toggle('hidden', WQ.running || !n);
    const go = $('islSelGo'); go.classList.toggle('hidden', WQ.running || !n); go.textContent = `✍️ বাছা ${bn(n)}টা একসাথে লিখে লাইব্রেরিতে রাখুন`;
    $('islSelStop').classList.toggle('hidden', !WQ.running);
  }
  async function runSelected() {
    if (BUSY || WQ.running) { busyToast(); return; }
    const ai = whichAI(); if (ai === 'chat') { toast('একসাথে লেখাতে সেটিংসে Claude বা Gemini key দিন', 'err', 6000); openSettings('key'); return; }
    const items = [...SEL].map(id => ISL_BY_ID[id]).filter(it => it && !genOf(it.id)); if (!items.length) { SEL.clear(); islRenderLib(); toast('বাছা গল্পগুলো আগেই লেখা হয়ে গেছে', 'ok'); return; }
    if (items.length > 10 && !confirm(`${bn(items.length)}টা গল্প লিখতে ${bn(items.length)}বার AI চলবে (সময় ও খরচ লাগবে)। শুরু করবেন?`)) return;
    WQ.running = true; WQ.stop = false; WQ.total = items.length; WQ.done = 0; WQ.wait = new Set(items.map(i => i.id)); let ok = 0, fail = 0, streak = 0;
    for (const it of items) {
      if (WQ.stop) break; WQ.wait.delete(it.id);
      const r = await islGenerate(it, { quiet: true, noLoad: true, ai });
      if (r) { ok++; streak = 0; SEL.delete(it.id); } else { fail++; if (++streak >= 2) break; }
      WQ.done++;
    }
    const left = WQ.wait.size; WQ.running = false; WQ.wait = new Set(); CUR_TITLE = '';
    setStat(`✓ ${bn(ok)}টা গল্প লিখে লাইব্রেরিতে রাখা হয়েছে` + (fail ? ` · ${bn(fail)}টা হয়নি (বাছা আছে, আবার চাপুন)` : '') + (WQ.stop && left ? ` · ${bn(left)}টা বাদ দেওয়া হলো` : ''), ok && !fail ? 'ok' : 'err');
    toast(`${bn(ok)}টা গল্প তৈরি হয়ে লাইব্রেরিতে যোগ হয়েছে`, ok ? 'ok' : 'err', 5000); islRenderLib();
  }
  async function bulk(n) {
    if (BUSY) return; const ai = whichAI(); if (ai === 'chat') { toast('একসাথে লেখাতে সেটিংসে Claude বা Gemini key দিন', 'err', 6000); openSettings('key'); return; }
    const todo = ISL_LIB.filter(it => !genOf(it.id)).slice(0, n); if (!todo.length) { toast('সব গল্প আগেই তৈরি হয়ে আছে', 'ok'); return; }
    const btn = $('islBulk'); btn.disabled = true; let ok = 0;
    for (let i = 0; i < todo.length; i++) { setStat(`${bn(i + 1)}/${bn(todo.length)} লেখা হচ্ছে: ${todo[i].title}`); if (await islGenerate(todo[i], { quiet: true, noLoad: true, ai })) ok++; }
    btn.disabled = false; setStat(`✓ ${bn(ok)}টা নতুন গল্প লাইব্রেরিতে তৈরি হয়ে আছে`, ok ? 'ok' : 'err'); islRenderLib();
  }
  function customItem() {
    const kind = $('islKind').value; const title = ($('islTitle').value || '').trim();
    if (kind === 'quran') { const s = +toEn($('islSurah').value), f = +toEn($('islFrom').value), t = +toEn($('islTo').value || $('islFrom').value);
      if (!(s >= 1 && s <= 114) || !(f >= 1) || !(t >= f)) throw new Error('সূরা নম্বর (১-১১৪) আর আয়াত নম্বর ঠিকমতো দিন'); if (t - f > 14) throw new Error('একবারে সর্বোচ্চ ১৫টা আয়াত দিন');
      return { id: `c-q-${s}-${f}-${t}`, kind: 'quran', s, f, t, title: title || `সূরা ${SURAH[s - 1]}, আয়াত ${bnN(f)}${t > f ? '–' + bnN(t) : ''}`, group: 'নিজের যোগ করা' }; }
    const n = +toEn($('islHadith').value); if (!(n >= 1 && n <= 7563)) throw new Error('সহিহ বুখারির হাদিস নম্বর দিন (১-৭৫৬৩)');
    return { id: 'c-h-' + n, kind: 'hadith', book: 'bukhari', n, title: title || `সহিহ বুখারি, হাদিস ${bnN(n)}`, group: 'নিজের যোগ করা' };
  }

  /* ---------- page changes for this part ---------- */
  function css() {
    const s = document.createElement('style'); s.textContent = `
      body.isl #charEditor, body.isl .castbox, body.isl .lgrid5, body.isl #btnGallery, body.isl #usedInfo, body.isl #btnRandom { display:none!important }
      body.isl .brand b::after { content:" · ইসলামিক"; color:#2C7A55; font-size:.82em }
      #libList li .islst { flex:none; font-size:12px; padding:3px 9px; border-radius:999px; background:#f1efe8; color:#6b7470; margin-left:6px; white-space:nowrap }
      #libList li .islst.ok { background:#e2f1e8; color:#1f6b45 }
      #libList li .islre { flex:none; width:34px; height:34px; border-radius:10px; border:1px solid var(--line); background:#fff; margin-left:6px; cursor:pointer; font-size:16px }
      #libList li.busy { opacity:.55 }
      #libList li .islst.del { border:0; cursor:pointer; font:inherit; font-size:12px }
      #libList li.usedrow .t b { color:#6b7470 }
      #libList li .islst.used { background:#1f6b45; color:#fff }
      #libList li .islside { flex:none; display:flex; flex-direction:column; align-items:flex-end; gap:5px }
      #libList li .islside .islst { margin-left:0 }
      #libList li .islst.ok2 { background:#fff; color:#1f6b45; border:1px dashed #9cc7ae }
      #libList li .islst.todo { background:#fff3d6; color:#8a5a00 }
      #libList li .islst.wr { background:#dbeafe; color:#1d4ed8 }
      #libList li .islst.qd { background:#ede9fe; color:#6d28d9 }
      #libList li .islst.pick { display:inline-flex; align-items:center; gap:4px; background:#fff; color:#8a5a00; border:1px dashed #e0b45a; cursor:pointer }
      #libList li .islst.pick.on { background:#1f6b45; color:#fff; border-color:#1f6b45 }
      #libList li .islst.pick input { width:16px; height:16px; margin:0; accent-color:#1f6b45 }
      #libList li.todorow .t b { color:#4b5563 }
      #libList li.picked { outline:2px solid #1f6b45; outline-offset:-2px; background:#f1f8f4 }
      .islsel { position:sticky; top:0; z-index:5; display:grid; gap:6px; margin:8px 0; padding:10px 12px; border:1px solid #9cc7ae; border-radius:14px; background:#f1f8f4 }
      .islsel .row { flex-wrap:wrap; gap:8px }
      .islbar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:8px 0 }
      .islbar .seg button { padding:6px 12px }
      #islChat { border:1px solid var(--line); border-radius:16px; padding:14px; margin:12px 0; background:#fff }
      #islChat textarea { width:100%; min-height:140px }
      .isl-form { display:grid; gap:10px; margin-top:8px }
      .isl-form .grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px }
      .startpick .islcards { border-style:dashed }
    `; document.head.append(s);
  }
  function domTweaks() {
    document.body.classList.add('isl'); document.title = 'TF Story Studio — ইসলামিক গল্প-ভিডিও';
    const lg = $('appLogo'); if (lg) lg.src = 'islamic/logo-islamic.webp';
    const ad = $('btnAutoDirect'); if (ad) { const row = ad.closest('.row'); const h = row && row.querySelector('h3'); if (h) h.textContent = 'পর্দায় মানুষ নেই — গল্পের জায়গা ও আসল লেখা'; const pp = row && row.nextElementSibling; if (pp && pp.tagName === 'P') pp.textContent = 'জায়গা বদলাতে নিচের "বিস্তারিত এডিট" খুলুন। আয়াত/হাদিসের দৃশ্যে আসল লেখা হুবহু থাকে।'; }
    const sb = $('btnSuite'); if (sb) { sb.href = 'islamic/index.html'; sb.textContent = '🖼'; sb.title = 'ছবি-কার্ড ও ছোট রিল (পোস্ট মেকার)'; sb.setAttribute('aria-label', 'ছবি-কার্ড ও রিল'); }
    const pick = $('srcPick');
    if (pick) {
      const set = (k, b, s) => { const x = pick.querySelector(`[data-pick="${k}"]`); if (x) { const bb = x.querySelector('b'), ss = x.querySelector('span'); if (bb) bb.textContent = b; if (ss) ss.textContent = s; } };
      set('lib', 'কুরআন ও হাদিসের গল্প', `${bn(PRE().length)}টা তৈরি গল্প (নেট ছাড়াই) + ${bn(ISL_LIB.length)}টা উৎস থেকে নতুন গল্প`);
      set('ai', 'নিজের পছন্দের আয়াত বা হাদিস', 'সূরা-আয়াত বা বুখারির হাদিস নম্বর দিন');
      set('paste', 'লেখা স্ক্রিপ্ট পেস্ট করুন', 'আগে লেখা TF Script থাকলে');
      const cards = el('button', { type: 'button', class: 'islcards', onclick: () => { location.href = 'islamic/index.html'; } }, el('i', { text: '🖼' }), el('b', { text: 'ছবি-কার্ড ও ছোট রিল' }), el('span', { text: 'আয়াত, হাদিস, বাণীর পোস্ট — পোস্ট মেকার' }));
      pick.append(cards);
    }
    const tabs = $('srcTabs'); if (tabs) tabs.querySelectorAll('button').forEach(b => { if (b.dataset.src === 'lib') b.textContent = 'গল্পের তালিকা'; if (b.dataset.src === 'ai') b.textContent = 'নিজের উৎস'; });
    if (typeof SRC_TITLES === 'object') Object.assign(SRC_TITLES, { lib: 'কুরআন ও হাদিসের গল্প বাছুন', ai: 'নিজের পছন্দের আয়াত বা হাদিস দিন', paste: 'লেখা স্ক্রিপ্ট পেস্ট করুন' });
    const more = $('srcPickMore'); if (more) more.classList.add('hidden');
    const sub = $('s1Sub'); if (sub) sub.textContent = 'নিচের যেকোনো একটা বেছে নিন — তালিকার গল্পে চাপ দিলেই বাকিটা অ্যাপ করবে।';
    // library pane: status, AI choice, bulk writing, copy-prompt box
    const lib = $('src-lib');
    if (lib) {
      $('libSearch').placeholder = 'খুঁজুন: ইউসুফ, ধৈর্য, গুহা, ক্ষমা...';
      const seg = el('nav', { class: 'seg sub small', id: 'islAI' }, ...[['claude', 'Claude লিখবে'], ['gemini', 'Gemini লিখবে'], ['chat', 'ChatGPT-এ কপি']].map(([v, tx]) => el('button', { type: 'button', 'data-ai': v, class: whichAI() === v ? 'on' : '', text: tx, onclick: () => { S.aiTab = v; saveSettings(); seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.ai === v)); keyNote(); } })));
      const note = el('span', { class: 'muted sm', id: 'islKeyNote' });
      const bar = el('div', { class: 'islbar' }, seg, el('button', { type: 'button', class: 'ghost sm', id: 'islBulk', text: 'পরের ৫টা আগেই লিখে রাখুন', onclick: () => bulk(5) }));
      const how = el('p', { class: 'muted sm', text: 'যেকোনো গল্পে চাপ দিন: অ্যাপ আসল আয়াত/হাদিস ডাউনলোড করবে, AI শুধু গল্পের ভাষা লিখবে, আর ভিডিওতে আসল লেখা হুবহু সূত্রসহ বসবে। পর্দায় কোনো মানুষের ছবি থাকবে না।' });
      const stat = el('p', { class: 'keystat hidden', id: 'islStat' });
      const chat = el('div', { id: 'islChat', class: 'hidden' },
        el('b', { id: 'islChatTitle' }),
        el('p', { class: 'muted sm', text: '১) প্রম্পট কপি করে ChatGPT / Gemini / Claude-এ দিন। ২) উত্তরটা পুরো কপি করে নিচে পেস্ট করুন। ৩) "গল্প বানান" চাপুন — আসল আয়াত/হাদিস অ্যাপ নিজে বসাবে।' }),
        el('div', { class: 'row' }, el('button', { type: 'button', class: 'primary', text: 'প্রম্পট কপি করুন', onclick: () => PENDING && copyText(PENDING.prompt, 'প্রম্পট কপি হয়েছে — চ্যাটে পেস্ট করুন') }), el('button', { type: 'button', class: 'ghost', text: 'বন্ধ', onclick: () => { $('islChat').classList.add('hidden'); PENDING = null; } })),
        el('textarea', { id: 'islChatIn', placeholder: 'AI-এর উত্তর এখানে পেস্ট করুন' }),
        el('button', { type: 'button', class: 'primary wide', text: 'গল্প বানান', onclick: async () => { if (!PENDING) return; const tx = $('islChatIn').value.trim(); if (!tx) { toast('আগে উত্তর পেস্ট করুন', 'err'); return; } try { if (PENDING.life) await saveLife(tx); else await saveAndOpen(PENDING.item, PENDING.src, tx, {}); $('islChat').classList.add('hidden'); PENDING = null; } catch (e) { toast('পড়া গেল না: ' + e.message, 'err', 7000); } } }));
      const firstRow = lib.querySelector('.row');
      const selBar = el('div', { id: 'islSelBar', class: 'islsel hidden' }, el('span', { id: 'islSelInfo', class: 'muted sm' }),
        el('div', { class: 'row' },
          el('button', { type: 'button', class: 'ghost sm', id: 'islSelAll', text: '⬜ সব "লেখা হয়নি" বাছুন', onclick: () => { rows().list.filter(r => r.it && !r.u).forEach(r => SEL.add(r.id)); islRenderLib(); } }),
          el('button', { type: 'button', class: 'ghost sm', id: 'islSelClr', text: 'বাছাই মুছুন', onclick: () => { SEL.clear(); islRenderLib(); } }),
          el('button', { type: 'button', class: 'primary', id: 'islSelGo', onclick: runSelected }),
          el('button', { type: 'button', class: 'ghost sm hidden', id: 'islSelStop', text: '⏹ থামান', onclick: () => { WQ.stop = true; toast('চলতি গল্পটা শেষ হলে থামবে'); } })));
      lib.insertBefore(el('div', null, how, bar, note, stat, chat, selBar), firstRow);
      $('libRandom').onclick = () => { const { all } = rows(); const pool = all.filter(r => !usedU(r.u) && r.it); if (!pool.length) { toast('সব গল্প ব্যবহার হয়ে গেছে'); return; } islOpen(pool[Math.floor(Math.random() * pool.length)]); };
      ['libSearch'].forEach(id => $(id).addEventListener('input', islRenderLib)); ['libBook', 'libFilter'].forEach(id => $(id).addEventListener('change', islRenderLib));
    }
    // "own source" pane
    const ai = $('src-ai');
    if (ai) {
      Array.from(ai.children).forEach(ch => ch.classList.add('hidden'));
      const kind = el('select', { id: 'islKind' }, el('option', { value: 'quran', text: 'কুরআন (সূরা ও আয়াত)' }), el('option', { value: 'hadith', text: 'সহিহ বুখারি (হাদিস নম্বর)' }));
      const qb = el('div', { class: 'grid3', id: 'islQBox' }, el('label', null, 'সূরা নম্বর', el('input', { id: 'islSurah', inputmode: 'numeric', placeholder: '১২' })), el('label', null, 'আয়াত থেকে', el('input', { id: 'islFrom', inputmode: 'numeric', placeholder: '৮৮' })), el('label', null, 'আয়াত পর্যন্ত', el('input', { id: 'islTo', inputmode: 'numeric', placeholder: '৯২' })));
      const hb = el('label', { class: 'hidden', id: 'islHBox' }, 'হাদিস নম্বর', el('input', { id: 'islHadith', inputmode: 'numeric', placeholder: '২২৭২' }));
      kind.onchange = () => { qb.classList.toggle('hidden', kind.value !== 'quran'); hb.classList.toggle('hidden', kind.value === 'quran'); };
      ai.append(el('div', { class: 'isl-form' },
        el('p', { class: 'muted sm', text: 'যে আয়াত বা হাদিস নিয়ে গল্প চান, তার নম্বর দিন। অ্যাপ আসল লেখা ডাউনলোড করবে, AI গল্প সাজাবে।' }),
        el('label', null, 'উৎস', kind), qb, hb,
        el('label', null, 'শিরোনাম (ঐচ্ছিক)', el('input', { id: 'islTitle', placeholder: 'যেমন: ক্ষমার শক্তি' })),
        el('button', { type: 'button', class: 'primary wide', text: 'আয়াত/হাদিস থেকে গল্প বানান', onclick: () => { try { const it = customItem(); showSrc('lib'); islGenerate(it); } catch (e) { toast(e.message, 'err', 6000); } } })));
    }
    if (ai) {
      const topic = el('select', { id: 'islLifeTopic' }, ...LIFE_TOPICS.map(x => el('option', { value: x, text: x })));
      const idea = el('textarea', { id: 'islLifeIdea', rows: 3, placeholder: 'ঐচ্ছিক: গল্পের ভাবনা — যেমন "প্রবাসী ছেলে ঈদের রাতে মাকে ফোন করতে পারছে না"' });
      ai.append(el('div', { class: 'isl-form', style: 'margin-top:22px;border-top:1px solid var(--line);padding-top:16px' },
        el('b', { text: 'নতুন জীবনের গল্প লেখান (একই সিনেমাটিক ধাঁচে)' }),
        el('p', { class: 'muted sm', text: 'বিষয় বাছুন, চাইলে ভাবনা লিখুন। Claude/Gemini key থাকলে অ্যাপেই লেখা হবে; না থাকলে প্রম্পট কপি করে Gemini/ChatGPT-এ দিন, উত্তর পেস্ট করুন। প্রতিবার লেখার ধরন বদলে যায়।' }),
        el('label', null, 'বিষয়', topic), el('label', null, 'ভাবনা (ঐচ্ছিক)', idea),
        el('div', { class: 'row' },
          el('button', { type: 'button', class: 'primary', text: 'গল্প লেখান', onclick: () => lifeGenerate(topic.value, idea.value.trim()) }),
          el('button', { type: 'button', class: 'ghost', text: 'শুধু প্রম্পট কপি', onclick: () => copyText(buildLifePrompt(topic.value, idea.value.trim()), 'প্রম্পট কপি হয়েছে — Gemini/ChatGPT-এ দিন, উত্তর "পেস্ট" অংশে দিন') }))));
    }
    keyNote();
    if (window.ISL_ART_DOM) window.ISL_ART_DOM();
  }
  function keyNote() { const n = $('islKeyNote'); if (!n) return; const w = whichAI(); n.textContent = w === 'chat' ? 'API key ছাড়া: প্রম্পট কপি করে বাইরে লেখাবেন (সেটিংসে key দিলে অ্যাপেই লেখা হবে)' : (w === 'claude' ? 'Claude' : 'Gemini') + ' key দিয়ে অ্যাপেই লেখা হবে'; }

  /* ---------- patch the Story engine (runs right before init) ---------- */
  window.ISL_PATCH = function () {
    css(); addPlaces();
    SCENE_TYPES.push('ayah'); TYPE_BN.ayah = 'আয়াত/হাদিস';
    // honorifics read aloud in full
    const _spoken = spoken;
    spoken = function (s) { s = String(s || '').replace(/\s*\(আ\.\)|\s*\(আঃ\)/g, ' আলাইহিস সালাম').replace(/\s*ﷺ/g, ' সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম').replace(/\s*\(রা\.\)|\s*\(রাঃ\)/g, ' রাদিয়াল্লাহু আনহু').replace(/\s*\(সা\.\)/g, ' সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম'); return _spoken(s); };
    const _normPlace = normPlace;
    normPlace = function (p) { const r = _normPlace(p); const k = String(p || '').toLowerCase().trim(); if (k === 'abstract') return 'abstract'; return (r === 'abstract' || r === 'living_room') ? 'desert' : r; };
    const _parse = parseTFScript;
    parseTFScript = function (text) {
      const raw = _parse(text);
      // people are allowed only when the script declares them (ordinary people, drawn without faces); prophets' stories declare none
      const ok = new Set(raw.characters.map(ch => ch.id)); raw._noPeople = !ok.size;
      raw.scenes.forEach(sc => {
        if (sc.type === 'story' && /^(ayah|quote|আয়াত)$/i.test(sc.place || '')) {
          sc.type = 'ayah'; sc.ref = sc.badge || ''; sc.badge = ''; sc.cast = []; sc.place = 'abstract';
          sc.lines = sc.lines.filter(l => { const cap = String(l.cap || ''); let m = cap.match(/^আরবি\s*[:：]\s*(.*)$/); if (m) { sc.arabic = m[1].trim(); return false; } m = cap.match(/^উৎস\s*[:：]\s*(.*)$/); if (m) { sc.src = m[1].trim(); return false; } m = cap.match(/^অনুবাদ\s*[:：]\s*(.*)$/); if (m) { sc.trans = m[1].trim(); return false; } return true; });
        }
        if (sc.cast) sc.cast = sc.cast.filter(id => ok.has(id));
        sc.lines.forEach(l => { if (!l.who || !ok.has(l.who)) { l.who = undefined; l.speak = false; } });
      });
      return raw;
    };
    const _norm = normalizeStory;
    normalizeStory = function (raw, hero) {
      const extra = (raw.scenes || []).filter(sc => Array.isArray(sc.lines) ? sc.lines.length : sc.lines).map(sc => ({ type: sc.type, ref: sc.ref || '', arabic: sc.arabic || '', src: sc.src || '', trans: sc.trans || '', cast: (sc.cast || []).length }));
      const r = _norm(raw, hero); let k = 0; r.story._noPeople = !!raw._noPeople;
      r.story.scenes.forEach(sc => { const x = extra[k++]; if (x && x.type === 'ayah' && sc.type === 'ayah') { sc.ref = x.ref; sc.arabic = x.arabic; sc.src = x.src; sc.trans = x.trans; }
        if (raw._noPeople || sc.type === 'ayah') { sc.cast = []; sc.lines.forEach(l => { l.who = null; l.focus = null; l.speak = false; }); }
        else if (x && x.type === 'story' && sc.type === 'story' && !x.cast && !sc.lines.some(l => l.who)) sc.cast = [];
        if (sc.type === 'story' && CROWD.test(sc.place || '')) { sc.cast = []; sc.lines.forEach(l => { l.who = null; l.focus = null; l.speak = false; }); } });
      r.warnings = r.warnings.filter(w => !/চরিত্র|নায়ক|বইয়ের রেফারেন্স|book/.test(w));
      return r;
    };
    const _auto = autoDirect;
    autoDirect = function (st) {
      if (!st._noPeople) { const keep = S.ctxBg; S.ctxBg = false; try { _auto(st); } finally { S.ctxBg = keep; } st.scenes.forEach(sc => { if (sc.type === 'ayah' || (sc.type === 'story' && CROWD.test(sc.place || ''))) { sc.cast = []; sc.lines.forEach(l => { l.who = null; l.focus = null; l.speak = false; }); } }); return; } // ordinary people (faceless)
      splitByContext(st); st.scenes.forEach(sc => { sc.cast = []; sc.lines.forEach(l => { l.who = null; l.focus = null; l.speak = false; l.do = ''; l.hold = ''; }); });
    };
    const _cam = camFor; camFor = function (sc, i, ln) { if (sc.type === 'story' && !sc.cast.length) return { x: 540, y: 900 + (i % 2) * 60, z: 1.04 + (i % 3) * .05 }; return _cam(sc, i, ln); };
    const RP = StoryRenderer.prototype;
    const _cam2 = RP.camFor2; RP.camFor2 = function (sc, idx, ln) { if (sc.type === 'story' && !sc.cast.length) return { x: 540 + ((idx % 3) - 1) * 50, y: 880 + (idx % 2) * 70, z: 1.06 + (idx % 3) * .06 }; return _cam2.call(this, sc, idx, ln); };
    const _scene = RP.drawScene; RP.drawScene = function (c, si, t) { const sc = this.story.scenes[si]; if (sc && sc.type === 'ayah') { c.save(); drawAyah.call(this, c, si, t); c.restore(); return; } return _scene.call(this, c, si, t); };
    const _cap = RP.drawCaption; RP.drawCaption = function (c, t, fw, fh, u) { const k = this.shotAt(t), sh = this.tl.shots[k]; if (sh && this.story.scenes[sh.si].type === 'ayah') return; return _cap.call(this, c, t, fw, fh, u); };
    publishPack = islPublishPack;
    if (window.ISL_ART_PATCH) window.ISL_ART_PATCH();
    renderLib = islRenderLib; fillLibFilters = islFillFilters; updateUsedInfo = function () { };
    const _loadQ = loadAny; loadAny = async function (t, o) { try { if (typeof t === 'string') t = await verifyQuran(t, o && o.libId); } catch (e) { } return _loadQ(t, o); };
    const _addUsed = addUsed; addUsed = function (x) { _addUsed(x); if (/^LIB:/.test(x)) { const h = hist(), id = String(x).slice(4); if (!h[id]) { h[id] = Date.now(); setHist(h); } } };
    const _init = init;
    init = async function () { await _init(); try { domTweaks(); islFillFilters(); islRenderLib(); } catch (e) { console.error(e); } };
  };
})();
