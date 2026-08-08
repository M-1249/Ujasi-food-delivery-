/* =====================================================
   RESTAURANT-ADMIN.JS — Vitendo vya paneli ya Mgahawa
   Hali ya sasa: localStorage (demo), imeunganishwa moja kwa
   moja na oda za wateja (ujasi_orders_v1) ili uwezekano wa
   majaribio kamili ya mzunguko: Mteja anaagiza → Mgahawa
   anaona oda → Mgahawa anasasisha hali.
   Baadaye: kila kazi hapa itabadilishwa kuwa Firestore query
   (restaurants/{id}, restaurants/{id}/foods, orders where
   restaurantId == id) chini ya Firestore Security Rules
   zinazothibitisha ownerId == request.auth.uid.
   ===================================================== */

// Mgahawa unaoingia kwa sasa - inasomwa kutoka session
// (imewekwa na login.html au register.html). Hii inaruhusu
// migahawa MINGI kutumia paneli hii, kila mmoja akiona data
// yake tu.
function getCurrentRestaurantId(){
  return localStorage.getItem("ujasi_restaurant_session") || "r1";
}

/* ---------- Orodha ya Migahawa Yote (kwa ajili ya usajili mpya) ---------- */
const ALL_RESTAURANT_IDS_KEY = "ujasi_all_restaurant_ids";

function getAllRestaurantIds(){
  const saved = localStorage.getItem(ALL_RESTAURANT_IDS_KEY);
  const list = saved ? JSON.parse(saved) : [];
  // Hakikisha migahawa ya demo (js/data.js) inaonekana pia
  if(typeof DEMO_RESTAURANTS !== "undefined"){
    DEMO_RESTAURANTS.forEach(r => { if(!list.includes(r.id)) list.push(r.id); });
  }
  return list;
}
function registerNewRestaurantId(id){
  const list = getAllRestaurantIds();
  if(!list.includes(id)){
    list.push(id);
    localStorage.setItem(ALL_RESTAURANT_IDS_KEY, JSON.stringify(list));
  }
}

/* ---------- Usajili wa Mgahawa Mpya ---------- */
function createNewRestaurant(data){
  const id = "r_" + Date.now();
  const profile = {
    id: id,
    name: data.name,
    category: data.category,
    cover: data.cover || "",
    logo: (data.name || "MG").slice(0,2).toUpperCase(),
    rating: 0,
    reviews: 0,
    prepTime: data.prepTime || "20-30 dk",
    deliveryFee: data.deliveryFee || 2000,
    isOpen: true,
    approved: false,
    ownerPhone: data.phone || "",
    ownerEmail: data.email || ""
  };
  localStorage.setItem("ujasi_restaurant_profile_" + id, JSON.stringify(profile));
  localStorage.setItem("ujasi_menu_" + id, JSON.stringify([]));
  registerNewRestaurantId(id);
  return profile;
}

/* ---------- Profaili ya Mgahawa ---------- */
function getRestaurantProfile(){
  const restaurantId = getCurrentRestaurantId();
  const key = "ujasi_restaurant_profile_" + restaurantId;
  const saved = localStorage.getItem(key);
  if(saved){
    const p = JSON.parse(saved);
    // Uhamisho wa data: profaili za zamani (kabla ya "approved" kuongezwa)
    // hazina uwanja huu - zinahesabiwa zimeidhinishwa moja kwa moja.
    if(p.approved === undefined){
      p.approved = true;
      saveRestaurantProfile(p);
    }
    return p;
  }
  const base = (typeof DEMO_RESTAURANTS !== "undefined") ? findRestaurant(restaurantId) : null;
  const profile = base ? {
    id: base.id, name: base.name, category: base.category, cover: base.cover, logo: base.logo,
    rating: base.rating, reviews: base.reviews, prepTime: base.prepTime, deliveryFee: base.deliveryFee, isOpen: base.isOpen, approved: true
  } : { id: restaurantId, name: "Mgahawa Wangu", category: "Kienyeji", cover: "", logo: "MW", rating: 0, reviews: 0, prepTime: "20-30 dk", deliveryFee: 2000, isOpen: true, approved: true };
  saveRestaurantProfile(profile);
  return profile;
}
function saveRestaurantProfile(profile){
  localStorage.setItem("ujasi_restaurant_profile_" + getCurrentRestaurantId(), JSON.stringify(profile));
}
function toggleRestaurantOpen(){
  const p = getRestaurantProfile();
  if(!p.approved) return p.isOpen; // hawezi kufungua kama hajaidhinishwa
  p.isOpen = !p.isOpen;
  saveRestaurantProfile(p);
  return p.isOpen;
}

/* ---------- Menyu ya Mgahawa (CRUD) ---------- */
function getMenu(){
  const key = "ujasi_menu_" + getCurrentRestaurantId();
  const saved = localStorage.getItem(key);
  if(saved) return JSON.parse(saved);
  const base = (typeof DEMO_RESTAURANTS !== "undefined") ? findRestaurant(getCurrentRestaurantId()) : null;
  const menu = base ? base.foods.map(f => ({ ...f, available: true })) : [];
  saveMenu(menu);
  return menu;
}
function saveMenu(menu){
  localStorage.setItem("ujasi_menu_" + getCurrentRestaurantId(), JSON.stringify(menu));
}
function addMenuItem(item){
  const menu = getMenu();
  const newItem = { id: "f_" + Date.now(), available: true, ...item };
  menu.push(newItem);
  saveMenu(menu);
  return newItem;
}
function updateMenuItem(id, changes){
  const menu = getMenu();
  const item = menu.find(m => m.id === id);
  if(item) Object.assign(item, changes);
  saveMenu(menu);
}
function deleteMenuItem(id){
  saveMenu(getMenu().filter(m => m.id !== id));
}
function toggleMenuAvailability(id){
  const menu = getMenu();
  const item = menu.find(m => m.id === id);
  if(item) item.available = !item.available;
  saveMenu(menu);
}

/* ---------- Oda za Mgahawa Huu ---------- */
function getRestaurantOrders(){
  const restaurantId = getCurrentRestaurantId();
  return getOrders().filter(o => o.items.some(i => i.restaurantId === restaurantId));
}
function getRestaurantOrdersByStatus(status){
  const all = getRestaurantOrders();
  if(!status || status === "zote") return all;
  return all.filter(o => o.status === status);
}

/* ---------- Takwimu za Dashboard (demo, siku ya leo) ---------- */
function getRestaurantStats(){
  const orders = getRestaurantOrders();
  const today = new Date().toDateString();
  const todays = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const revenue = todays.filter(o => o.status !== "cancelled").reduce((s,o) => s + o.total, 0);
  const pending = orders.filter(o => o.status === "pending_verification" || o.status === "payment_confirmed").length;
  const preparing = orders.filter(o => o.status === "preparing").length;
  return {
    ordersToday: todays.length,
    revenueToday: revenue,
    pendingCount: pending,
    preparingCount: preparing,
    totalOrders: orders.length
  };
}
