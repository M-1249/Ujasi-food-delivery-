/* =====================================================
   ORDERS-FIRESTORE.JS — Muunganiko HALISI wa Oda na Firebase
   =====================================================
   Hii inachukua nafasi ya "engine" ya zamani ya oda
   (iliyokuwa ndani ya js/app.js, ikitumia localStorage) BILA
   kubadilisha majina ya functions zinazotumika kila mahali
   (getOrders, saveOrder, getOrderByCode, updateOrderStatus,
   updateOrder). Kwa sababu faili hii inapakiwa BAADA ya
   js/app.js, "window.getOrders = ..." hapa chini inaandika
   juu ya version ya zamani ya localStorage - kurasa zote
   (checkout, water-delivery, order-track, orders, restaurant-
   orders/dashboard, rider-deliveries/dashboard, adminlayer1-
   orders/dashboard, superadmin-dashboard/reports) zinaendelea
   kufanya kazi bila kuguswa, sasa na data HALISI ya wakati
   halisi kutoka Firestore (onSnapshot - SI polling tena).

   MPANGILIO WA KUPAKIA (muhimu):
   firebase-app-compat.js, firebase-auth-compat.js,
   firebase-firestore-compat.js  →  js/firebase-config.js  →
   js/app.js  →  js/orders-firestore.js  →  (data.js/
   restaurant-admin.js/rider.js/admin-layer1.js/super-admin.js
   kama zinahitajika)  →  script ya ukurasa mwenyewe.

   Ukurasa wowote usiopakia faili hii unaendelea kutumia
   localStorage ya zamani bila mabadiliko (hakuna madhara).
   ===================================================== */

(function () {
  const ORDERS_COL = "orders";
  let cache = [];
  let listenerAttached = false;
  let authPromise = null;
  let lastAuthError = null; // sababu HALISI ya mwisho ya kushindwa kwa anonymous sign-in (kwa ajili ya ujumbe sahihi kwa mtumiaji)

  function firebaseReady() {
    return (
      typeof firebase !== "undefined" &&
      firebase.apps &&
      firebase.apps.length > 0 &&
      typeof db !== "undefined"
    );
  }

  /* Guest/mteja bila akaunti anaingizwa "anonymous" kiotomatiki ili
     aweze kuandika/kusoma Firestore (Security Rules zinahitaji
     request.auth != null). Mgahawa/Rider/Admin wanaoingia kwa
     barua-pepe halisi wanabaki na akaunti yao halisi - hatuwabadilishi. */
  function ensureAuth() {
    if (!firebaseReady()) return Promise.resolve(null);
    if (authPromise) return authPromise;
    authPromise = new Promise((resolve) => {
      const unsub = auth.onAuthStateChanged((user) => {
        unsub();
        if (user) {
          resolve(user);
        } else {
          auth
            .signInAnonymously()
            .then((cred) => { lastAuthError = null; resolve(cred.user); })
            .catch((err) => {
              console.error("UJASI: anonymous sign-in imeshindikana:", err);
              lastAuthError = err; // tunaihifadhi ili saveOrder() iweze kutoa sababu sahihi, si "hakuna mtandao" kwa jumla
              resolve(null);
            });
        }
      });
    });
    return authPromise;
  }

  function fromDoc(doc) {
    const d = doc.data() || {};
    return Object.assign({}, d, {
      orderCode: d.orderCode || doc.id,
      createdAt:
        d.createdAt && d.createdAt.toDate
          ? d.createdAt.toDate().toISOString()
          : d.createdAt || new Date().toISOString(),
      updatedAt:
        d.updatedAt && d.updatedAt.toDate
          ? d.updatedAt.toDate().toISOString()
          : d.updatedAt || null,
    });
  }

  function notifyUpdated() {
    window.dispatchEvent(new CustomEvent("ujasi-orders-updated"));
    // Hook rahisi: kila ukurasa unaweza kuweka
    // window.onUjasiOrdersUpdate = renderYakoFunction; nayo itaitwa
    // kila mara data mpya inapofika kutoka Firestore (real-time).
    if (typeof window.onUjasiOrdersUpdate === "function") {
      try {
        window.onUjasiOrdersUpdate();
      } catch (e) {
        console.error("UJASI: onUjasiOrdersUpdate error:", e);
      }
    }
  }

  /* ---------- Listener ya oda kulingana na CHEO (role) ----------
     Rules za Firestore si "kichujio": query lazima iulize TU data ambayo
     role hiyo inaruhusiwa kuona. Pia hii inalinda kikomo cha reads
     (50,000/siku kwenye Spark): staff HAWASOMI historia yote ya oda,
     ni siku chache za mwisho tu (default 2). Ukurasa wa ripoti unaweza
     kuweka window.UJASI_ORDERS_WINDOW_DAYS = 7 kabla ya getOrders() ya kwanza.
       - Admin Layer 1 / Super Admin : oda zote za siku hizo
       - Mgahawa (umeidhinishwa)     : oda zake zilizolipiwa tu
       - Rider (aliyeidhinishwa)     : zake + foleni ya "ready_for_pickup"
       - Mteja/guest                 : hakuna listener hapa - anatumia
                                       listenMyOrders()/listenToOrder() */
  const PAID_STATUSES = ["payment_confirmed", "preparing", "ready_for_pickup", "on_the_way", "delivered"];

  function windowStart() {
    const days = Number(window.UJASI_ORDERS_WINDOW_DAYS) || 2;
    return firebase.firestore.Timestamp.fromDate(new Date(Date.now() - days * 86400000));
  }

  function handleOrdersError(err) {
    console.error("UJASI: orders onSnapshot error:", err);
    if (typeof showToast !== "function") return;
    if (err && err.code === "failed-precondition") {
      // Query inahitaji composite index - Firebase inaweka LINK ya kuiunda ndani ya err.message (angalia Console).
      showToast("Firestore inahitaji 'index' ya oda - fungua Console ya kivinjari (Inspect) ubofye link ya kuiunda", "error", 8000);
    } else {
      showToast("Muunganiko wa oda za wakati halisi umeshindikana", "error");
    }
  }

  function attachListener() {
    if (listenerAttached || !firebaseReady()) return;
    listenerAttached = true;
    ensureAuth().then(async (user) => {
      if (!user) return;
      let role = null;
      try {
        const ud = await db.collection("users").doc(user.uid).get();
        role = ud.exists ? ud.data().role : null;
      } catch (e) {
        console.error("UJASI: imeshindikana kusoma cheo (role):", e);
      }

      const col = db.collection(ORDERS_COL);
      let queries = [];
      if (role === "admin_layer1" || role === "super_admin") {
        queries = [col.where("createdAt", ">=", windowStart())];
      } else if (role === "restaurant_admin") {
        queries = [col.where("restaurantId", "==", user.uid).where("status", "in", PAID_STATUSES).where("createdAt", ">=", windowStart())];
      } else if (role === "rider") {
        queries = [
          col.where("riderId", "==", user.uid),
          col.where("status", "==", "ready_for_pickup").where("riderId", "==", null),
        ];
      } else {
        return; // mteja/guest: hana ruhusa ya kusoma oda za wengine
      }

      const parts = [];
      const rebuild = () => {
        const merged = {};
        parts.forEach((list) => (list || []).forEach((o) => { merged[o.orderCode] = o; }));
        cache = Object.keys(merged)
          .map((k) => merged[k])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        notifyUpdated();
      };
      queries.forEach((q, i) => {
        q.onSnapshot((snap) => {
          parts[i] = snap.docs.map(fromDoc);
          rebuild();
        }, handleOrdersError);
      });
    });
  }

  /* ---------- API ya umma (majina yale yale ya zamani) ---------- */

  // Sawa na awali: SYNCHRONOUS - inarudisha cache ya sasa (imejazwa na
  // onSnapshot listener). Mara ya kwanza kabisa ukurasa unapopakia,
  // cache inaweza kuwa tupu kwa muda mfupi (mpaka snapshot ya kwanza
  // ifike) - kwa hiyo kila ukurasa unapaswa pia kuweka
  // window.onUjasiOrdersUpdate ili ku-render upya data ikishafika.
  window.getOrders = function () {
    attachListener();
    return cache.slice();
  };

  // MUHIMU: getOrders() inarudisha oda ZOTE za jukwaa (inahitajika na
  // Mgahawa/Rider/Admin Layer 1/Super Admin - kila mmoja anachuja kwa
  // functions zao maalum: getRestaurantOrders(), getMyDeliveries(),
  // getAllOrdersSorted() n.k.). Kwa ukurasa wa MTEJA (customer-orders.html
  // - "Oda Zangu"), TUMIA getMyOrders() badala yake, la sivyo mteja
  // ataona oda za wateja WENGINE pia.
  window.getMyOrders = function () {
    // MUHIMU: HATUITI attachListener() hapa (soma maelezo kwenye
    // saveOrder() hapo juu - collection nzima haipitishwi na Security
    // Rules kwa mteja). Kwa "Oda Zangu" tumia listenMyOrders() badala
    // yake (query iliyochujwa kwa where(customerUid==...) - hiyo pekee
    // inaruhusiwa na Security Rules kwa mteja).
    const uid = typeof auth !== "undefined" && auth.currentUser ? auth.currentUser.uid : null;
    if (!uid) return [];
    return cache.filter((o) => o.customerUid === uid);
  };

  window.getOrderByCode = function (code) {
    // MUHIMU: HATUITI attachListener() hapa - ni collection nzima isiyo
    // na "where" filter, ambayo Security Rules zinaikataa kwa MTEJA
    // (soma maelezo ndani ya saveOrder() hapo juu). Kurasa za mteja
    // zinatumia listenToOrder() badala yake (hati MOJA - salama).
    const hit = cache.find((o) => o.orderCode === code);
    if (hit) return hit;
    // Fallback: soma moja kwa moja kutoka Firestore ikiwa haijafika
    // bado kwenye cache (mfano ukurasa wa order-track umepakiwa kabla
    // ya listener kuu kumaliza sync ya kwanza) - hii haizuii sehemu
    // nyingine za mfumo kwa sababu ni "best effort" tu.
    return null;
  };

  window.saveOrder = async function (order) {
    // MUHIMU: HATUITI attachListener() hapa - saveOrder() ni WRITE tu.
    const user = await ensureAuth();
    if (!user) {
      // Error yenye "code" halisi ili explainUjasiError() itoe ujumbe sahihi.
      const e = new Error("Hakuna auth - imeshindikana kutuma oda");
      e.code = (lastAuthError && lastAuthError.code) || "no-auth";
      throw e;
    }
    // Namba ya Muamala: herufi kubwa na bila nafasi (rules zinadai muundo huu).
    const txnId = String(order.txnId || "").trim().toUpperCase();
    const payload = Object.assign({}, order, {
      txnId: txnId,
      customerUid: user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    // BATCH (atomiki): oda + "kufuli" ya Namba ya Muamala (txns/{txnId}).
    // Ikiwa namba hiyo imeshatumika kwenye oda nyingine, batch yote
    // inakataliwa na rules - hakuna oda inayotengenezwa.
    const batch = db.batch();
    batch.set(db.collection(ORDERS_COL).doc(order.orderCode), payload);
    batch.set(db.collection("txns").doc(txnId), {
      orderCode: order.orderCode,
      customerUid: user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    try {
      await batch.commit();
    } catch (err) {
      if (err && err.code === "permission-denied") err.code = "ujasi/txn-rejected";
      throw err;
    }
    return order;
  };

  window.updateOrder = async function (code, changes) {
    attachListener();
    await ensureAuth();
    const payload = Object.assign({}, changes, {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await db.collection(ORDERS_COL).doc(code).update(payload);
    return window.getOrderByCode(code);
  };

  window.updateOrderStatus = function (code, status) {
    return window.updateOrder(code, { status: status });
  };

  // Kwa ukurasa wa "Fuatilia Oda" (customer-order-track.html) - listener
  // ya moja kwa moja kwenye hati MOJA (bora zaidi ya kusoma collection
  // nzima kama mteja hana ruhusa ya kuona oda za wengine kwenye baadhi
  // ya usanidi wa Security Rules wa baadaye). Si lazima itumike - ukurasa
  // unaweza pia kutegemea tu getOrderByCode() + onUjasiOrdersUpdate.
  window.listenToOrder = function (code, callback, onDenied) {
    ensureAuth().then(() => {
      db.collection(ORDERS_COL)
        .doc(code)
        .onSnapshot(
          (doc) => callback(doc.exists ? fromDoc(doc) : null),
          (err) => {
            console.error("UJASI: listenToOrder error:", err);
            if (typeof onDenied === "function") onDenied();
          }
        );
    });
  };

  // Kwa "Oda Zangu" (customer-orders.html) - query iliyochujwa moja kwa
  // moja na Firestore (customerUid == mimi), badala ya kupakua oda ZOTE
  // za jukwaa kisha kuchuja kwa JS - haraka zaidi na haitoi taarifa za
  // wateja wengine kwenye kifaa cha mteja huyu.
  window.listenMyOrders = function (callback) {
    ensureAuth().then((user) => {
      if (!user) { callback([]); return; }
      db.collection(ORDERS_COL)
        .where("customerUid", "==", user.uid)
        .onSnapshot(
          (snap) => {
            const list = snap.docs
              .map(fromDoc)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            callback(list);
          },
          (err) => console.error("UJASI: listenMyOrders error:", err)
        );
    });
  };

  // MUHIMU: HATUANZISHI listener ya collection nzima hapa moja kwa moja -
  // inaanzishwa TU pale getOrders()/getOrderByCode() zinapoitwa (yaani
  // kwenye paneli za Mgahawa/Rider/Admin Layer 1/Super Admin). Kurasa za
  // mteja wa "guest" (checkout, order-track, receipt, orders zangu)
  // zinatumia listenToOrder()/listenMyOrders() badala yake - hazihitaji
  // kupakua oda za wateja wengine wote.
})();
