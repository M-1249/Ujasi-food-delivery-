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
            .then((cred) => resolve(cred.user))
            .catch((err) => {
              console.error("UJASI: anonymous sign-in imeshindikana:", err);
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

  function attachListener() {
    if (listenerAttached || !firebaseReady()) return;
    listenerAttached = true;
    ensureAuth().then(() => {
      db.collection(ORDERS_COL).onSnapshot(
        (snap) => {
          cache = snap.docs
            .map(fromDoc)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          notifyUpdated();
        },
        (err) => {
          console.error("UJASI: orders onSnapshot error:", err);
          if (typeof showToast === "function") {
            showToast("Muunganiko wa oda za wakati halisi umeshindikana", "error");
          }
        }
      );
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
    attachListener();
    const uid = typeof auth !== "undefined" && auth.currentUser ? auth.currentUser.uid : null;
    if (!uid) return [];
    return cache.filter((o) => o.customerUid === uid);
  };

  window.getOrderByCode = function (code) {
    attachListener();
    const hit = cache.find((o) => o.orderCode === code);
    if (hit) return hit;
    // Fallback: soma moja kwa moja kutoka Firestore ikiwa haijafika
    // bado kwenye cache (mfano ukurasa wa order-track umepakiwa kabla
    // ya listener kuu kumaliza sync ya kwanza) - hii haizuii sehemu
    // nyingine za mfumo kwa sababu ni "best effort" tu.
    return null;
  };

  window.saveOrder = async function (order) {
    attachListener();
    const user = await ensureAuth();
    if (!user) {
      if (typeof showToast === "function") {
        showToast("Imeshindikana kuunganisha na mtandao - jaribu tena", "error");
      }
      throw new Error("Hakuna auth - imeshindikana kutuma oda");
    }
    const payload = Object.assign({}, order, {
      customerUid: user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await db.collection(ORDERS_COL).doc(order.orderCode).set(payload);
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
