/* =====================================================
   ADMIN-LAYER1.JS — Paneli ya Uendeshaji (Dispatch)
   Hii ni tofauti na "Super Admin" (Layer 2/3) — Layer 1
   inashughulikia uendeshaji wa kila siku: kuona oda zote,
   kugawa/kubadilisha rider, kuona hali ya migahawa na
   riders, na mipangilio ya Lipa Namba inayotumika moja kwa
   moja kwenye checkout ya wateja.
   Hali ya sasa: localStorage (demo). Baadaye: Firestore
   collections zenye Security Rules za role == "admin_layer1".
   ===================================================== */

/* ---------- Mipangilio ya Malipo (Lipa Namba) ----------
   Hii ndiyo chanzo halisi kinachotumika na customer/checkout.html */
const PAYMENT_SETTINGS_KEY = "ujasi_payment_settings";

function getPaymentSettings(){
  const saved = localStorage.getItem(PAYMENT_SETTINGS_KEY);
  if(saved) return JSON.parse(saved);
  const defaults = { lipaNamba: "351154293", lipaJina: "UMOJA HISA" };
  savePaymentSettings(defaults);
  return defaults;
}
function savePaymentSettings(settings){
  localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(settings));
}

/* ---------- Mipangilio ya Huduma ya Maji ----------
   Admin anaweza kubadilisha bei ya chupa na chaguo za idadi
   zinazoonekana kwa mteja. Usafirishaji unabaki BURE daima
   (haibadilishwi hapa kwa makusudi). */
const WATER_SETTINGS_KEY = "ujasi_water_settings";
function getWaterSettings(){
  const saved = localStorage.getItem(WATER_SETTINGS_KEY);
  if(saved) return JSON.parse(saved);
  const defaults = { bottlePrice: 3000, qtyOptions: [1,2,3,4,5,6] };
  saveWaterSettings(defaults);
  return defaults;
}
function saveWaterSettings(s){
  localStorage.setItem(WATER_SETTINGS_KEY, JSON.stringify(s));
}
function getAllRestaurantProfiles(){
  const list = [];
  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    if(key && key.indexOf("ujasi_restaurant_profile_") === 0){
      try{ list.push(JSON.parse(localStorage.getItem(key))); }catch(e){}
    }
  }
  return list;
}

/* ---------- Riders Wote (scan localStorage kwa profaili zote) ---------- */
function getAllRiderProfiles(){
  const list = [];
  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    if(key && key.indexOf("ujasi_rider_profile_") === 0){
      try{ list.push(JSON.parse(localStorage.getItem(key))); }catch(e){}
    }
  }
  return list;
}

/* ---------- Oda Zote (dispatch) ---------- */
function getAllOrdersSorted(){
  return getOrders().slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function getUnassignedReadyOrders(){
  return getOrders().filter(o => o.status === "ready_for_pickup" && !o.riderId);
}
function assignRiderToOrder(code, riderId){
  return updateOrder(code, { riderId: riderId, status: "on_the_way", pickedUpAt: new Date().toISOString(), assignedByAdmin: true });
}

/* ---------- Takwimu za Jumla (Dashboard) ---------- */
function getPlatformStats(){
  const orders = getOrders();
  const today = new Date().toDateString();
  const todays = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const revenueToday = todays.filter(o => o.status !== "cancelled").reduce((s,o) => s + o.total, 0);
  const riders = getAllRiderProfiles();
  const restaurants = getAllRestaurantProfiles();
  return {
    ordersToday: todays.length,
    revenueToday: revenueToday,
    pendingCount: orders.filter(o => o.status === "pending_verification").length,
    unassignedCount: getUnassignedReadyOrders().length,
    onlineRiders: riders.filter(r => r.online).length,
    totalRiders: riders.length,
    openRestaurants: restaurants.filter(r => r.isOpen).length,
    totalRestaurants: restaurants.length
  };
}
