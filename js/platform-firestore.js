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
  function attachPromoListener() {
    if (promoListenerOn || !fbReady()) return;
    promoListenerOn = true;
    db.collection(PROMO_COL).onSnapshot((snap) => {
      promoCache = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      window.dispatchEvent(new CustomEvent("ujasi-promotions-updated"));
      if (typeof window.onUjasiPromotionsUpdate === "function") {
        try { window.onUjasiPromotionsUpdate(); } catch (e) { console.error(e); }
      }
    }, (err) => console.error("UJASI: promotions onSnapshot error:", err));
  }
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

  /* ---------- reviews/{id} ---------- */
  const REVIEWS_COL = "reviews";
  let reviewsCache = [];
  let reviewsListenerOn = false;
  function attachReviewsListener() {
    if (reviewsListenerOn || !fbReady()) return;
    reviewsListenerOn = true;
    db.collection(REVIEWS_COL).onSnapshot((snap) => {
      reviewsCache = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      window.dispatchEvent(new CustomEvent("ujasi-reviews-updated"));
      if (typeof window.onUjasiReviewsUpdate === "function") {
        try { window.onUjasiReviewsUpdate(); } catch (e) { console.error(e); }
      }
    }, (err) => console.error("UJASI: reviews onSnapshot error:", err));
  }
  window.getAllReviews = function () {
    attachReviewsListener();
    return reviewsCache.slice();
  };
  window.getReviewsForRestaurant = function (restaurantId) {
    return window.getAllReviews().filter((r) => r.restaurantId === restaurantId);
  };
  window.hasReviewedOrder = function (orderCode) {
    return window.getAllReviews().some((r) => r.orderCode === orderCode);
  };
  window.addReview = async function (review) {
    const user = auth && auth.currentUser ? auth.currentUser : null;
    const payload = Object.assign({}, review, {
      customerUid: user ? user.uid : null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    const ref = await db.collection(REVIEWS_COL).add(payload);

    // Sasisha wastani wa rating wa mgahawa (soma-hesabu-andika salama
    // zaidi kupitia transaction, kuepuka mgongano wa "reads mbili
    // zikiandikiana wakati mmoja").
    await db.runTransaction(async (tx) => {
      const restRef = db.collection("restaurants").doc(review.restaurantId);
      const restDoc = await tx.get(restRef);
      if (!restDoc.exists) return;
      const allForRest = window.getReviewsForRestaurant(review.restaurantId).concat([review]);
      const avg = allForRest.reduce((s, r) => s + r.rating, 0) / allForRest.length;
      tx.update(restRef, { rating: Math.round(avg * 10) / 10, reviews: allForRest.length });
    });
    return Object.assign({ id: ref.id }, payload);
  };
  window.deleteReview = async function (id) {
    await db.collection(REVIEWS_COL).doc(id).delete();
  };

  attachPromoListener();
  attachReviewsListener();
})();
