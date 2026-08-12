/* =====================================================
   RESTAURANTS-FIRESTORE.JS — Migahawa + Menyu (Firestore HALISI)
   =====================================================
   Inachukua nafasi ya DEMO_RESTAURANTS (js/data.js) na functions
   za localStorage ndani ya js/restaurant-admin.js (getCurrentRestaurantId,
   createNewRestaurant, getRestaurantProfile, saveRestaurantProfile,
   toggleRestaurantOpen, getMenu, saveMenu, addMenuItem, updateMenuItem,
   deleteMenuItem, toggleMenuAvailability) na js/app.js
   (getAllPlatformRestaurants, findAnyRestaurant) na js/admin-layer1.js/
   js/super-admin.js (getAllRestaurantProfiles, getPendingRestaurants,
   approveRestaurant, rejectRestaurant) - BILA kubadilisha majina.

   Muundo wa Firestore:
     restaurants/{restaurantId}                 (profaili)
     restaurants/{restaurantId}/menu/{itemId}    (bidhaa za menyu)

   restaurantId ya usajili MPYA = Firebase Auth UID ya mmiliki
   (rahisisha Security Rules + huepuka mgongano wa ID).

   MPANGILIO WA KUPAKIA: baada ya firebase-config.js/app.js/
   orders-firestore.js, KABLA ya restaurant-admin.js.
   ===================================================== */

(function () {
  const REST_COL = "restaurants";
  let restaurantsCache = [];
  let restaurantsListenerOn = false;
  const menuCache = {};      // { restaurantId: [items] }
  const menuListeners = {};  // { restaurantId: true }
  let myRestaurantId = null; // cache ya mmiliki wa sasa (badala ya localStorage)
  let authWatched = false;

  function fbReady() {
    return typeof firebase !== "undefined" && firebase.apps && firebase.apps.length && typeof db !== "undefined";
  }

  function notify(evt) {
    window.dispatchEvent(new CustomEvent(evt));
    if (evt === "ujasi-restaurants-updated" && typeof window.onUjasiRestaurantsUpdate === "function") {
      try { window.onUjasiRestaurantsUpdate(); } catch (e) { console.error(e); }
    }
    if (evt === "ujasi-menu-updated" && typeof window.onUjasiMenuUpdate === "function") {
      try { window.onUjasiMenuUpdate(); } catch (e) { console.error(e); }
    }
  }

  function attachRestaurantsListener() {
    if (restaurantsListenerOn || !fbReady()) return;
    restaurantsListenerOn = true;
    db.collection(REST_COL).onSnapshot((snap) => {
      restaurantsCache = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      notify("ujasi-restaurants-updated");
    }, (err) => console.error("UJASI: restaurants onSnapshot error:", err));
  }

  function attachMenuListener(restaurantId) {
    if (menuListeners[restaurantId] || !fbReady()) return;
    menuListeners[restaurantId] = true;
    db.collection(REST_COL).doc(restaurantId).collection("menu").onSnapshot((snap) => {
      menuCache[restaurantId] = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      notify("ujasi-menu-updated");
    }, (err) => console.error("UJASI: menu onSnapshot error:", err));
  }

  /* ---------- Anajua "mimi ni mgahawa gani" - kwa uid ya sasa ----------
     Chanzo cha ukweli ni users/{uid}.restaurantId (Firestore, si
     localStorage) - hivyo kuingia kwenye kifaa/kivinjari kingine
     kunampeleka mmiliki moja kwa moja kwenye mgahawa wake sahihi. */
  function watchMyRestaurantId() {
    if (authWatched || !fbReady()) return;
    authWatched = true;
    auth.onAuthStateChanged((user) => {
      if (!user) { myRestaurantId = null; return; }
      db.collection("users").doc(user.uid).get().then((doc) => {
        const data = doc.exists ? doc.data() : null;
        myRestaurantId = (data && data.restaurantId) || null;
        notify("ujasi-restaurants-updated");
      }).catch((e) => console.error("UJASI: imeshindikana kupata restaurantId:", e));
    });
  }

  window.getCurrentRestaurantId = function () {
    watchMyRestaurantId();
    return myRestaurantId;
  };

  /* ---------- Usajili wa Mgahawa Mpya ---------- */
  window.createNewRestaurant = async function (data) {
    const user = await (auth.currentUser ? Promise.resolve(auth.currentUser) : new Promise((res) => {
      const unsub = auth.onAuthStateChanged((u) => { unsub(); res(u); });
    }));
    if (!user) throw new Error("Hakuna mtumiaji aliyeingia");
    const id = user.uid;
    const profile = {
      name: data.name, category: data.category, cover: data.cover || "",
      logo: (data.name || "MG").slice(0, 2).toUpperCase(),
      rating: 0, reviews: 0, prepTime: data.prepTime || "20-30 dk",
      deliveryFee: data.deliveryFee || 2000, isOpen: true, approved: false,
      ownerUid: id, ownerPhone: data.phone || "", ownerEmail: data.email || "",
      distanceKm: 1.5, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection(REST_COL).doc(id).set(profile);
    myRestaurantId = id;
    return Object.assign({ id }, profile);
  };

  /* ---------- Profaili ya Mgahawa ---------- */
  window.getRestaurantProfile = function () {
    const id = window.getCurrentRestaurantId();
    if (!id) return null;
    attachRestaurantsListener();
    return restaurantsCache.find((r) => r.id === id) || null;
  };
  window.saveRestaurantProfile = async function (profile) {
    const id = window.getCurrentRestaurantId();
    if (!id) return;
    const changes = Object.assign({}, profile);
    delete changes.id;
    await db.collection(REST_COL).doc(id).set(changes, { merge: true });
  };
  window.toggleRestaurantOpen = async function () {
    const p = window.getRestaurantProfile();
    if (!p || !p.approved) return p ? p.isOpen : false;
    const next = !p.isOpen;
    await db.collection(REST_COL).doc(p.id).update({ isOpen: next });
    return next;
  };

  /* ---------- Menyu ya Mgahawa (CRUD) ---------- */
  window.getMenu = function () {
    const id = window.getCurrentRestaurantId();
    if (!id) return [];
    attachMenuListener(id);
    return (menuCache[id] || []).slice();
  };
  window.getMenuForRestaurant = function (restaurantId) {
    attachMenuListener(restaurantId);
    return (menuCache[restaurantId] || []).slice();
  };
  window.addMenuItem = async function (item) {
    const id = window.getCurrentRestaurantId();
    if (!id) return null;
    const payload = Object.assign({ available: true }, item);
    const ref = await db.collection(REST_COL).doc(id).collection("menu").add(payload);
    return Object.assign({ id: ref.id }, payload);
  };
  window.updateMenuItem = async function (itemId, changes) {
    const id = window.getCurrentRestaurantId();
    if (!id) return;
    await db.collection(REST_COL).doc(id).collection("menu").doc(itemId).update(changes);
  };
  window.deleteMenuItem = async function (itemId) {
    const id = window.getCurrentRestaurantId();
    if (!id) return;
    await db.collection(REST_COL).doc(id).collection("menu").doc(itemId).delete();
  };
  window.toggleMenuAvailability = async function (itemId) {
    const id = window.getCurrentRestaurantId();
    if (!id) return;
    const item = (menuCache[id] || []).find((m) => m.id === itemId);
    if (!item) return;
    await db.collection(REST_COL).doc(id).collection("menu").doc(itemId).update({ available: !item.available });
  };

  /* ---------- Migahawa Yote ya Jukwaa (kwa Wateja/Admin) ---------- */
  window.getAllPlatformRestaurants = function () {
    attachRestaurantsListener();
    restaurantsCache.forEach((r) => attachMenuListener(r.id)); // kwa ajili ya utafutaji wa chakula (search) - onSnapshot moja tu kwa kila mgahawa, kisha inatoka kwenye cache
    return restaurantsCache
      .filter((r) => r.approved !== false)
      .map((r) => Object.assign({}, r, { foods: (menuCache[r.id] || []).filter((f) => f.available !== false) }));
  };
  window.findAnyRestaurant = function (id) {
    attachRestaurantsListener();
    attachMenuListener(id);
    const r = restaurantsCache.find((x) => x.id === id);
    // MUHIMU: mteja HAAWEZI kuona (wala kuagiza) chakula ambacho mgahawa
    // amekificha ("Ficha" kwenye Menyu) - kinachukuliwa kama "hakipo".
    return r ? Object.assign({}, r, { foods: (menuCache[id] || []).filter((f) => f.available !== false) }) : null;
  };
  window.getAllRestaurantProfiles = function () {
    attachRestaurantsListener();
    return restaurantsCache.slice();
  };

  /* ---------- Idhini (Super Admin) ---------- */
  window.getPendingRestaurants = function () {
    attachRestaurantsListener();
    return restaurantsCache.filter((r) => r.approved === false);
  };
  window.approveRestaurant = async function (id) {
    await db.collection(REST_COL).doc(id).update({ approved: true });
  };
  window.rejectRestaurant = async function (id) {
    await db.collection(REST_COL).doc(id).delete();
  };

  attachRestaurantsListener();
  watchMyRestaurantId();
})();
