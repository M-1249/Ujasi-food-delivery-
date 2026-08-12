/* =====================================================
   RESTAURANT-ADMIN.JS — Vitendo vya paneli ya Mgahawa
   =====================================================
   getCurrentRestaurantId, createNewRestaurant, getRestaurantProfile,
   saveRestaurantProfile, toggleRestaurantOpen, getMenu, addMenuItem,
   updateMenuItem, deleteMenuItem, toggleMenuAvailability - HAZIPO
   TENA hapa (localStorage imeondolewa kabisa) - zote zimehamia
   js/restaurants-firestore.js (Firestore HALISI, onSnapshot).
   Faili hii sasa ina TU functions zinazotegemea getOrders()
   (js/orders-firestore.js) kuchuja oda za mgahawa huu peke yake.
   ===================================================== */

/* ---------- Oda za Mgahawa Huu ---------- */
function getRestaurantOrders(){
  const restaurantId = getCurrentRestaurantId();
  if(!restaurantId) return [];
  return getOrders().filter(o => o.restaurantId === restaurantId || o.items.some(i => i.restaurantId === restaurantId));
}
function getRestaurantOrdersByStatus(status){
  const all = getRestaurantOrders();
  if(!status || status === "zote") return all;
  return all.filter(o => o.status === status);
}

/* ---------- Takwimu za Dashboard (leo) ---------- */
function getRestaurantStats(){
  const orders = getRestaurantOrders();
  const today = new Date().toDateString();
  const todays = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  // MUHIMU: mapato ya MGAHAWA ni bei ya CHAKULA TU (subtotal) - SI jumla
  // yote (total), kwa sababu "total" inajumuisha ada ya usafiri ambayo
  // ni fedha za Rider, si za mgahawa.
  const revenue = todays.filter(o => o.status !== "cancelled").reduce((s,o) => s + (o.subtotal != null ? o.subtotal : o.total), 0);
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
