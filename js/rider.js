/* =====================================================
   RIDER.JS — Vitendo vya paneli ya Rider
   =====================================================
   getCurrentRiderId, createNewRider, getRiderProfile,
   saveRiderProfile, toggleRiderOnline - HAZIPO TENA hapa
   (localStorage imeondolewa kabisa) - zimehamia
   js/riders-firestore.js (Firestore HALISI, onSnapshot).
   Faili hii sasa ina TU functions zinazotegemea getOrders()
   (js/orders-firestore.js) kuchuja/kusimamia oda za rider huyu.
   ===================================================== */

/* ---------- Foleni ya Oda Zinazopatikana (bado hazijachukuliwa) ---------- */
function getAvailableDeliveries(){
  return getOrders().filter(o => o.status === "ready_for_pickup" && !o.riderId);
}

/* ---------- Oda za Rider Huyu ---------- */
function getMyDeliveries(){
  const riderId = getCurrentRiderId();
  if(!riderId) return [];
  return getOrders().filter(o => o.riderId === riderId);
}
function getMyActiveDeliveries(){
  return getMyDeliveries().filter(o => o.status === "on_the_way");
}
function getMyCompletedDeliveries(){
  return getMyDeliveries().filter(o => o.status === "delivered");
}

/* ---------- Vitendo ---------- */
function acceptDelivery(code){
  return updateOrder(code, { riderId: getCurrentRiderId(), status: "on_the_way", pickedUpAt: new Date().toISOString() });
}
function completeDelivery(code){
  return updateOrder(code, { status: "delivered", deliveredAt: new Date().toISOString() });
}

/* ---------- Takwimu za Dashboard (leo) ---------- */
function getRiderStats(){
  const mine = getMyDeliveries();
  const today = new Date().toDateString();
  const completedToday = mine.filter(o => o.status === "delivered" && new Date(o.deliveredAt || o.createdAt).toDateString() === today);
  const earnings = completedToday.reduce((s,o) => s + (o.deliveryFee || 0), 0);
  return {
    deliveredToday: completedToday.length,
    earningsToday: earnings,
    activeCount: getMyActiveDeliveries().length,
    availableCount: getAvailableDeliveries().length
  };
}
