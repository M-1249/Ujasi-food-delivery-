/* =====================================================
   ADMIN-LAYER1.JS — Paneli ya Uendeshaji (Dispatch)
   =====================================================
   getPaymentSettings/savePaymentSettings, getWaterSettings/
   saveWaterSettings, getAllRestaurantProfiles, getAllRiderProfiles -
   HAZIPO TENA hapa (localStorage imeondolewa kabisa):
     - Mipangilio (payment/water)  → js/platform-firestore.js
     - Migahawa                    → js/restaurants-firestore.js
     - Riders                      → js/riders-firestore.js
   Faili hii sasa ina TU functions zinazotegemea getOrders()
   (js/orders-firestore.js) kwa ajili ya dispatch/takwimu.
   ===================================================== */

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
  const riders = (typeof getAllRiderProfiles === "function") ? getAllRiderProfiles() : [];
  const restaurants = (typeof getAllRestaurantProfiles === "function") ? getAllRestaurantProfiles() : [];
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
