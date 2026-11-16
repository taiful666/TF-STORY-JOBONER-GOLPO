/* TF Story Studio — the one Gmail login shared by every page of the app (home screen, Story part, Islamic parts).
   Firebase keeps the signed-in account per site, so signing in on any page signs in everywhere (web and Android app).
   This file is used by home.html and islamic/index.html; index.html has its own copy of the same login (Cloud).
   The config values are public by design; Firestore rules decide who can read what (see firestore.rules). */
(function () {
  'use strict';
  const CFG = { apiKey: 'AIzaSyAfZ29i4FwMlsDKoXqLvVpKN4uZWkJ4Edw', authDomain: 'tf-story-studio.firebaseapp.com', projectId: 'tf-story-studio', appId: '1:91248581816:web:d900f083014d5cbee8a84d' };
  const me = document.currentScript, base = me ? me.src.replace(/cloud-core\.js.*$/, '') : '';
  const isAndroid = !!window.TFAndroid;
  const C = window.TFCloud = {
    user: null, auth: null, db: null, err: '', listeners: [], started: false,
    native() { return !!(window.TFAndroid && window.TFAndroid.googleSignIn); },
    usable() { return !isAndroid || this.native(); },
    on(fn) { this.listeners.push(fn); try { fn(this.user); } catch (e) { } },
    emit() { this.listeners.forEach(fn => { try { fn(this.user); } catch (e) { console.warn(e); } }); },
    load(src) { return new Promise((res, rej) => { if (window.firebase && /app-compat/.test(src) && window.firebase.initializeApp) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src)); document.head.append(s); }); },
    async start() {
      if (this.started) return; this.started = true;
      if (!this.usable()) { this.emit(); return; }
      try { for (const m of ['app', 'auth', 'firestore']) await this.load(`${base}vendor/firebase-${m}-compat.js`); }
      catch (e) { this.err = 'লগইন চালু করা গেল না (ইন্টারনেট আছে কি?) — পেজ রিফ্রেশ করুন'; this.emit(); return; }
      try {
        if (!firebase.apps.length) firebase.initializeApp(CFG);
        this.auth = firebase.auth(); this.db = firebase.firestore();
        try { await this.db.enablePersistence({ synchronizeTabs: true }); } catch (e) { }
        this.auth.onAuthStateChanged(u => { this.user = u; this.err = ''; this.emit(); });
      } catch (e) { this.err = 'ক্লাউড সেটআপে ভুল আছে: ' + e.message; this.emit(); }
    },
    msg(e) {
      const c = (e && e.code) || '';
      if (c.includes('permission-denied')) return 'এই Gmail-কে ঢোকার অনুমতি দেওয়া হয়নি — সঠিক Gmail দিয়ে ঢুকুন';
      if (c.includes('popup-blocked')) return 'পপআপ আটকে গেছে — ব্রাউজারে এই সাইটের পপআপ চালু করে আবার চাপুন';
      if (c.includes('unauthorized-domain')) return 'এই ওয়েবসাইটটা Firebase-এ "Authorized domains"-এ যোগ করা হয়নি';
      if (c.includes('network')) return 'ইন্টারনেট নেই — একটু পরে আবার চেষ্টা করুন';
      if (c.includes('no-account')) return 'ফোনে কোনো Google অ্যাকাউন্ট পাওয়া যায়নি — Settings → Accounts থেকে Gmail যোগ করুন';
      if (c.startsWith('native/')) return 'Google লগইন হয়নি — ইন্টারনেট দেখে আবার চেষ্টা করুন (' + c.slice(7) + ')';
      return 'সমস্যা হয়েছে, আবার চেষ্টা করুন (' + ((e && e.message) || c) + ')';
    },
    async signIn() {
      if (!this.auth) throw { code: 'loading', message: this.err || 'লগইন এখনো লোড হচ্ছে, একটু পরে চাপুন' };
      if (this.native()) { // Android app: Google blocks web sign-in inside apps, so use the phone's account picker
        const r = await new Promise(res => { window.TFAuthResult = res; window.TFAndroid.googleSignIn(); });
        if (!r || r.status === 'cancel') return false;
        if (r.status !== 'ok') throw { code: 'native/' + r.value, message: r.value };
        await this.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(r.value));
      } else { const pr = new firebase.auth.GoogleAuthProvider(); pr.setCustomParameters({ prompt: 'select_account' }); await this.auth.signInWithPopup(pr); }
      return true;
    },
    async signOut() {
      if (!this.auth || !this.user) return;
      try { await Promise.race([this.db.waitForPendingWrites(), new Promise(r => setTimeout(r, 6000))]); } catch (e) { }
      try { await this.auth.signOut(); } catch (e) { }
      if (this.native()) try { window.TFAndroid.googleSignOut(); } catch (e) { }
    },
    ref() { return this.db.collection('users').doc(this.user.uid); }
  };
})();
