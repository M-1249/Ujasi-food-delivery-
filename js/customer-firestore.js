/* =====================================================
   CUSTOMER-FIRESTORE.JS — Akaunti ya Mteja (Firestore HALISI)
   =====================================================
   Inachukua nafasi ya localStorage functions ndani ya js/app.js
   (getCart, saveCart, addToCart, removeFromCart, setCartQty,
   cartSubtotal, cartCount, clearCart, getAddresses, saveAddress,
   deleteAddress) - BILA kubadilisha majina.

   Muundo: hati MOJA `customers/{uid}` yenye { name, phone, cart:[],
   addresses:[] } - hii kwa MAKUSUDI ni hati MOJA (si subcollections
   nyingi) ili kuwe na onSnapshot listener MOJA TU kwa kila mteja -
   inapunguza sana idadi ya "reads" za Firebase (kila kitu
   kinafika kwa "push" moja, si maombi mengi tofauti).

   uid: kama mteja ameingia kwa akaunti halisi (customer-login.html),
   hii ni UID ile ile kila kifaa - ndiyo inayowezesha "Mgeni" kubadilika
   kuwa akaunti inayofuatana kwenye vifaa vyote. Kama ni "guest"
   (hajaingia), Firebase Anonymous Auth inatumika (haina uhusiano na
   vifaa vingine - hii ni sahihi kwa mgeni asiye na akaunti).

   MPANGILIO WA KUPAKIA: baada ya firebase-config.js/app.js/
   orders-firestore.js.
   ===================================================== */

(function () {
  const CUST_COL = "customers";
  let cache = { name: "", phone: "", cart: [], addresses: [] };
  let listenerOn = false;
  let authPromise = null;
  let myUid = null;

  function fbReady() {
    return typeof firebase !== "undefined" && firebase.apps && firebase.apps.length && typeof db !== "undefined";
  }

  function ensureAuth() {
    if (!fbReady()) return Promise.resolve(null);
    if (authPromise) return authPromise;
    authPromise = new Promise((resolve) => {
      const unsub = auth.onAuthStateChanged((user) => {
        unsub();
        if (user) { resolve(user); }
        else {
          auth.signInAnonymously().then((cred) => resolve(cred.user))
            .catch((err) => { console.error("UJASI: anonymous sign-in imeshindikana:", err); resolve(null); });
        }
      });
    });
    return authPromise;
  }

  function notify() {
    window.dispatchEvent(new CustomEvent("ujasi-customer-updated"));
    updateCartBadge();
    if (typeof window.onUjasiCustomerUpdate === "function") {
      try { window.onUjasiCustomerUpdate(); } catch (e) { console.error(e); }
    }
  }

  function attachListener() {
    if (listenerOn || !fbReady()) return;
    listenerOn = true;
    ensureAuth().then((user) => {
      if (!user) return;
      myUid = user.uid;
      db.collection(CUST_COL).doc(myUid).onSnapshot((doc) => {
        if (doc.exists) {
          cache = Object.assign({ name: "", phone: "", cart: [], addresses: [] }, doc.data());
        } else {
          cache = { name: "", phone: "", cart: [], addresses: [] };
        }
        notify();
      }, (err) => console.error("UJASI: customer onSnapshot error:", err));
    });
  }

  async function patch(changes) {
    await ensureAuth();
    attachListener();
    if (!myUid) return;
    await db.collection(CUST_COL).doc(myUid).set(changes, { merge: true });
  }

  /* ---------- Jina la Mteja (badala ya "ujasi_guest_name") ---------- */
  window.getCustomerName = function () {
    attachListener();
    return cache.name || "";
  };
  window.saveCustomerName = function (name) {
    return patch({ name: name });
  };

  /* ---------- Kikapu (Cart) ---------- */
  window.getCart = function () {
    attachListener();
    return (cache.cart || []).slice();
  };
  window.saveCart = function (cart) {
    cache = Object.assign({}, cache, { cart: cart }); // sasisho la haraka la ndani ya kumbukumbu (optimistic) ili UI isisubiri mtandao
    notify();
    return patch({ cart: cart });
  };
  window.addToCart = function (item) {
    const cart = window.getCart();
    const existing = cart.find((c) => c.id === item.id);
    if (existing) { existing.qty += item.qty || 1; }
    else { cart.push(Object.assign({}, item, { qty: item.qty || 1 })); }
    window.saveCart(cart);
    showToast(`${item.name} imeongezwa kwenye kikapu`, "success");
  };
  window.removeFromCart = function (id) {
    window.saveCart(window.getCart().filter((c) => c.id !== id));
  };
  window.setCartQty = function (id, qty) {
    const cart = window.getCart();
    const item = cart.find((c) => c.id === id);
    if (item) {
      item.qty = qty;
      if (item.qty <= 0) return window.removeFromCart(id);
    }
    window.saveCart(cart);
  };
  window.cartSubtotal = function () {
    return window.getCart().reduce((sum, c) => sum + c.price * c.qty, 0);
  };
  window.cartCount = function () {
    return window.getCart().reduce((sum, c) => sum + c.qty, 0);
  };
  window.clearCart = function () { window.saveCart([]); };

  /* ---------- Anwani Zilizohifadhiwa ---------- */
  window.getAddresses = function () {
    attachListener();
    return (cache.addresses || []).slice();
  };
  window.saveAddress = function (addr) {
    const list = window.getAddresses();
    list.push(Object.assign({ id: "addr_" + Date.now() + "_" + Math.floor(Math.random() * 9999) }, addr));
    patch({ addresses: list });
    return list;
  };
  window.deleteAddress = function (id) {
    const list = window.getAddresses().filter((a) => a.id !== id);
    patch({ addresses: list });
  };

  attachListener();
})();
