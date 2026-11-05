/* =====================================================
   PLATFORM-FIRESTORE.JS — Mipangilio + Promotions + Reviews
   =====================================================
   Inachukua nafasi ya localStorage functions ndani ya
   js/admin-layer1.js (getPaymentSettings, savePaymentSettings,
   getWaterSettings, saveWaterSettings) na js/super-admin.js
   (getAllPromotions, getActivePromotions, savePromotion,
   deletePromotion, togglePromotionActive, getAllReviews,
   getReviewsForRestaurant, hasReviewedOrder, addReview,
   deleteReview, getPlatformSettings, savePlatformSettings) -
   BILA kubadilisha majina.

   Muundo: settings/payment, settings/water, settings/platform
   (hati moja kila moja), promotions/{id}, reviews/{id}.

   MPANGILIO WA KUPAKIA: baada ya firebase-config.js/app.js/
   orders-firestore.js/restaurants-firestore.js, KABLA ya
   admin-layer1.js/super-admin.js.
   ===================================================== */

(function () {
  function fbReady() {
    return typeof firebase !== "undefined" && firebase.apps && firebase.apps.length && typeof db !== "undefined";
  }

  /* ---------- settings/{docId} - kwa jozi ya get/save ---------- */
  function makeSettingsPair(docId, defaults, publicName) {
    let cache = null;
    let listenerOn = false;
    function attach() {
      if (listenerOn || !fbReady()) return;
      listenerOn = true;
      db.collection("settings").doc(docId).onSnapshot((doc) => {
        if (doc.exists) {
          cache = doc.data();
        } else {
          cache = defaults;
          db.collection("settings").doc(docId).set(defaults).catch((e) => console.error(e));
        }
        window.dispatchEvent(new CustomEvent("ujasi-settings-updated"));
        if (typeof window.onUjasiSettingsUpdate === "function") {
          try { window.onUjasiSettingsUpdate(); } catch (e) { console.error(e); }
        }
      }, (err) => console.error("UJASI: settings(" + docId + ") onSnapshot error:", err));
    }
    window["get" + publicName] = function () {
      attach();
      return cache || defaults;
    };
    window["save" + publicName] = async function (s) {
      await db.collection("settings").doc(docId).set(s, { merge: true });
    };
  }
  makeSettingsPair("payment", { lipaNamba: "351154293", lipaJina: "UMOJA HISA" }, "PaymentSettings");
  makeSettingsPair("water", { bottlePrice: 3000, qtyOptions: [1, 2, 3, 4, 5, 6] }, "WaterSettings");
  makeSettingsPair("platform", { commissionPercent: 12, supportPhone: "0700 000 000", termsText: "" }, "PlatformSettings");

  /* ---------- promotions/{id} ---------- */
  const PROMO_COL = "promotions";
  let promoCache = [];
  let promoListenerOn = false;
  let promoFirstSnapshotReceived = false; // sawa na isRestaurantsDataReady() - tofautisha "inapakia" na "hakuna"
  function attachPromoListener() {
    if (promoListenerOn || !fbReady()) return;
    promoListenerOn = true;
    db.collection(PROMO_COL).onSnapshot((snap) => {
      promoCache = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      promoFirstSnapshotReceived = true;
      window.dispatchEvent(new CustomEvent("ujasi-promotions-updated"));
      if (typeof window.onUjasiPromotionsUpdate === "function") {
        try { window.onUjasiPromotionsUpdate(); } catch (e) { console.error(e); }
      }
    }, (err) => console.error("UJASI: promotions onSnapshot error:", err));
  }
  window.isPromotionsDataReady = function () {
    attachPromoListener();
    return promoFirstSnapshotReceived;
  };
  window.getAllPromotions = function () {
    attachPromoListener();
    return promoCache.slice();
  };
  window.getActivePromotions = function () {
    const now = new Date();
    return window.getAllPromotions().filter((p) => {
      if (p.active === false) return false;
      if (p.endDate) {
        const endOfDay = new Date(p.endDate + "T23:59:59");
        if (endOfDay < now) return false;
      }
      return true;
    });
  };
  window.savePromotion = async function (promo) {
    const payload = Object.assign({}, promo);
    const id = payload.id;
    delete payload.id;
    if (id) {
      await db.collection(PROMO_COL).doc(id).set(payload, { merge: true });
      return Object.assign({ id }, payload);
    }
    const ref = await db.collection(PROMO_COL).add(payload);
    return Object.assign({ id: ref.id }, payload);
  };
  window.deletePromotion = async function (id) {
    await db.collection(PROMO_COL).doc(id).delete();
  };
  window.togglePromotionActive = async function (id) {
    const p = promoCache.find((x) => x.id === id);
    if (!p) return;
    await db.collection(PROMO_COL).doc(id).update({ active: !p.active });
  };

  /* ---------- reviews/{orderCode} ----------
     MUHIMU (kikomo cha reads): zamani ukurasa WOWOTE ulisoma reviews ZOTE
     kila ulipofunguliwa - kadiri reviews zinavyoongezeka, reads zingeisha
     ndani ya wiki. Sasa:
       - ukurasa wa mgahawa: reviews 20 za karibuni za mgahawa HUO tu
       - "Oda Zangu": reviews za mteja huyu tu (kujua ipi imeshatolewa)
       - Super Admin: zote (ukurasa wa admin pekee unaoita getAllReviews)
     Kitambulisho cha review = orderCode => review MOJA kwa kila oda. */
  const REVIEWS_COL = "reviews";
  const reviewsByRest = {};
  const restReviewListeners = {};
  let allReviews = [];
  let allReviewsListenerOn = false;
  let myReviewedCodes = {};
  let myReviewsWatch = false;

  function notifyReviews() {
    window.dispatchEvent(new CustomEvent("ujasi-reviews-updated"));
    if (typeof window.onUjasiReviewsUpdate === "function") {
      try { window.onUjasiReviewsUpdate(); } catch (e) { console.error(e); }
    }
  }
  function sortNewest(list) {
    return list.slice().sort((a, b) => {
      const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });
  }

  window.getAllReviews = function () { // Super Admin tu
    if (!allReviewsListenerOn && fbReady()) {
      allReviewsListenerOn = true;
      db.collection(REVIEWS_COL).onSnapshot((snap) => {
        allReviews = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
        notifyReviews();
      }, (err) => console.error("UJASI: reviews(all) onSnapshot error:", err));
    }
    return allReviews.slice();
  };
  window.getReviewsForRestaurant = function (restaurantId) {
    if (restaurantId && !restReviewListeners[restaurantId] && fbReady()) {
      restReviewListeners[restaurantId] = true;
      // Inahitaji composite index: restaurantId (Ascending) + createdAt (Descending).
      db.collection(REVIEWS_COL).where("restaurantId", "==", restaurantId)
        .orderBy("createdAt", "desc").limit(20)
        .onSnapshot((snap) => {
          reviewsByRest[restaurantId] = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
          notifyReviews();
        }, (err) => console.error("UJASI: reviews(" + restaurantId + ") onSnapshot error (index inahitajika?):", err));
    }
    return sortNewest(reviewsByRest[restaurantId] || []);
  };
  window.hasReviewedOrder = function (orderCode) {
    if (!myReviewsWatch && fbReady()) {
      myReviewsWatch = true;
      let unsub = null;
      auth.onAuthStateChanged((user) => {
        if (unsub) { unsub(); unsub = null; }
        myReviewedCodes = {};
        if (!user) { notifyReviews(); return; }
        unsub = db.collection(REVIEWS_COL).where("customerUid", "==", user.uid).onSnapshot((snap) => {
          myReviewedCodes = {};
          snap.docs.forEach((d) => { myReviewedCodes[d.id] = true; });
          notifyReviews();
        }, (err) => console.error("UJASI: my reviews onSnapshot error:", err));
      });
    }
    return !!myReviewedCodes[orderCode];
  };
  window.addReview = async function (review) {
    const user = auth && auth.currentUser ? auth.currentUser : null;
    if (!user) throw new Error("Hakuna mtumiaji aliyeingia");
    const payload = Object.assign({}, review, {
      customerUid: user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    // Kitambulisho = orderCode (review moja kwa oda; rules zinakagua oda ni ya mteja na imekamilika).
    // Wastani wa rating (restaurants/{id}.rating) HAUSASISHWI tena na mteja - rules
    // haziruhusu mteja kuandika kwenye hati ya mgahawa. Angalia HATUA-ZA-DEPLOY.md (awamu ya 2).
    await db.collection(REVIEWS_COL).doc(review.orderCode).set(payload);
    return Object.assign({ id: review.orderCode }, payload);
  };
  window.deleteReview = async function (id) {
    await db.collection(REVIEWS_COL).doc(id).delete();
  };

  attachPromoListener();
})();
