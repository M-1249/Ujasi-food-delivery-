/* =====================================================
   RIDERS-FIRESTORE.JS — Riders (Firestore HALISI)
   =====================================================
   Inachukua nafasi ya localStorage functions ndani ya
   js/rider.js (getCurrentRiderId, createNewRider,
   getRiderProfile, saveRiderProfile, toggleRiderOnline) na
   js/admin-layer1.js/js/super-admin.js (getAllRiderProfiles,
   getPendingRiders, approveRider, rejectRider) - BILA
   kubadilisha majina.

   riders/{riderId} - riderId ya usajili MPYA = Firebase Auth
   UID ya rider (inaruhusu kuingia kwa "username" (barua pepe)
   kwenye kifaa/kivinjari kingine na kuona akaunti yake HALISI,
   sio ya kifaa - chanzo cha ukweli ni Firestore, si localStorage).

   MPANGILIO WA KUPAKIA: baada ya firebase-config.js/app.js/
   orders-firestore.js, KABLA ya rider.js.
   ===================================================== */

(function () {
  const RIDERS_COL = "riders";
  let ridersCache = [];
  let ridersListenerOn = false;
  let myRiderId = null;
  let authWatched = false;

  function fbReady() {
    return typeof firebase !== "undefined" && firebase.apps && firebase.apps.length && typeof db !== "undefined";
  }

  function notify() {
    window.dispatchEvent(new CustomEvent("ujasi-riders-updated"));
    if (typeof window.onUjasiRidersUpdate === "function") {
      try { window.onUjasiRidersUpdate(); } catch (e) { console.error(e); }
    }
  }

  function attachListener() {
    if (ridersListenerOn || !fbReady()) return;
    ridersListenerOn = true;
    db.collection(RIDERS_COL).onSnapshot((snap) => {
      ridersCache = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      notify();
    }, (err) => console.error("UJASI: riders onSnapshot error:", err));
  }

  function watchMyRiderId() {
    if (authWatched || !fbReady()) return;
    authWatched = true;
    auth.onAuthStateChanged((user) => {
      if (!user) { myRiderId = null; return; }
      db.collection("users").doc(user.uid).get().then((doc) => {
        const data = doc.exists ? doc.data() : null;
        myRiderId = (data && data.riderId) || null;
        notify();
      }).catch((e) => console.error("UJASI: imeshindikana kupata riderId:", e));
    });
  }

  window.getCurrentRiderId = function () {
    watchMyRiderId();
    return myRiderId;
  };

  /* ---------- Usajili wa Rider Mpya ---------- */
  window.createNewRider = async function (data) {
    const user = await (auth.currentUser ? Promise.resolve(auth.currentUser) : new Promise((res) => {
      const unsub = auth.onAuthStateChanged((u) => { unsub(); res(u); });
    }));
    if (!user) throw new Error("Hakuna mtumiaji aliyeingia");
    const id = user.uid;
    const profile = {
      name: data.name, phone: data.phone, vehicle: data.vehicle || "Pikipiki",
      plate: data.plate || "", online: false, rating: 0, approved: false,
      ownerUid: id, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection(RIDERS_COL).doc(id).set(profile);
    myRiderId = id;
    return Object.assign({ id }, profile);
  };

  /* ---------- Profaili ya Rider ---------- */
  window.getRiderProfile = function () {
    const id = window.getCurrentRiderId();
    if (!id) return null;
    attachListener();
    return ridersCache.find((r) => r.id === id) || null;
  };
  window.saveRiderProfile = async function (p) {
    const id = window.getCurrentRiderId();
    if (!id) return;
    const changes = Object.assign({}, p);
    delete changes.id;
    await db.collection(RIDERS_COL).doc(id).set(changes, { merge: true });
  };
  window.toggleRiderOnline = async function () {
    const p = window.getRiderProfile();
    if (!p || !p.approved) return p ? p.online : false;
    const next = !p.online;
    await db.collection(RIDERS_COL).doc(p.id).update({ online: next });
    return next;
  };

  /* ---------- Riders Wote (Admin) ---------- */
  window.getAllRiderProfiles = function () {
    attachListener();
    return ridersCache.slice();
  };
  window.getPendingRiders = function () {
    attachListener();
    return ridersCache.filter((r) => r.approved === false);
  };
  window.approveRider = async function (id) {
    await db.collection(RIDERS_COL).doc(id).update({ approved: true });
  };
  window.rejectRider = async function (id) {
    await db.collection(RIDERS_COL).doc(id).delete();
  };

  attachListener();
  watchMyRiderId();
})();
