/* =====================================================
   SUPER-ADMIN.JS — Ngazi ya juu kabisa ya usimamizi
   =====================================================
   Promotions, Reviews, idhini ya Migahawa/Riders, Mipangilio
   Makubwa - HAZIPO TENA hapa (localStorage imeondolewa kabisa):
     - Promotions/Reviews/Platform settings → js/platform-firestore.js
     - Idhini ya Migahawa (pending/approve/reject) → js/restaurants-firestore.js
     - Idhini ya Riders (pending/approve/reject)   → js/riders-firestore.js
   Faili hii sasa ina TU takwimu zinazotegemea getOrders()
   (js/orders-firestore.js) + moduli nyingine tayari zilizopakiwa.
   ===================================================== */

/* ---------- Takwimu za Jukwaa Lote (Muda Wote) ---------- */
function getAllTimeStats(){
  const orders = getOrders();
  const delivered = orders.filter(o => o.status === "delivered");
  const revenue = delivered.reduce((s,o) => s + o.total, 0);
  return {
    totalOrders: orders.length,
    deliveredOrders: delivered.length,
    totalRevenue: revenue,
    totalRestaurants: (typeof getAllRestaurantProfiles === "function") ? getAllRestaurantProfiles().length : 0,
    totalRiders: (typeof getAllRiderProfiles === "function") ? getAllRiderProfiles().length : 0,
    pendingRestaurants: (typeof getPendingRestaurants === "function") ? getPendingRestaurants().length : 0,
    pendingRiders: (typeof getPendingRiders === "function") ? getPendingRiders().length : 0
  };
}

/* ---------- Mauzo ya Siku 7 Zilizopita (kwa ripoti) ---------- */
function getRevenueLast7Days(){
  const days = [];
  for(let i = 6; i >= 0; i--){
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: d, label: d.toLocaleDateString("sw-TZ", { weekday: "short" }), total: 0 });
  }
  const orders = getOrders().filter(o => o.status !== "cancelled");
  orders.forEach(o => {
    const od = new Date(o.createdAt).toDateString();
    const match = days.find(d => d.date.toDateString() === od);
    if(match) match.total += o.total;
  });
  return days;
}
