/* =====================================================
   RIDER.JS — Vitendo vya paneli ya Rider
   Hali ya sasa: localStorage (demo), muunganiko wa moja kwa
   moja na oda za mgahawa/mteja (ujasi_orders_v1).
   Baadaye: Firestore query orders where riderId == uid,
   na "available" queue itakuwa Cloud Function inayochagua
   rider aliye karibu zaidi (geohash/distance) badala ya
   orodha ya "chagua mwenyewe".
   ===================================================== */

// Rider anayeingia kwa sasa - inasomwa kutoka session
// (imewekwa na login.html au register.html). Hii inaruhusu
// riders WENGI kutumia paneli hii, kila mmoja akiona data yake tu.
function getCurrentRiderId(){
  return localStorage.getItem("ujasi_rider_session") || "rider1";
}

/* ---------- Usajili wa Rider Mpya ----------
   Rider mpya anaanza na approved:false — hawezi kuwa "Mtandaoni"
   mpaka Super Admin amthibitishe kwenye approvals.html */
function createNewRider(data){
  const id = "rider_" + Date.now();
  const profile = {
    id: id, name: data.name, phone: data.phone,
    vehicle: data.vehicle || "Pikipiki", plate: data.plate || "",
    online: false, rating: 0, approved: false
  };
  localStorage.setItem("ujasi_rider_profile_" + id, JSON.stringify(profile));
  return profile;
}

/* ---------- Profaili ya Rider ---------- */
function getRiderProfile(){
  const riderId = getCurrentRiderId();
  const key = "ujasi_rider_profile_" + riderId;
  const saved = localStorage.getItem(key);
  if(saved){
    const p = JSON.parse(saved);
    // Uhamisho wa data: profaili zilizohifadhiwa KABLA ya uwanja wa
    // "approved" kuongezwa hazina uwanja huu kabisa (undefined), jambo
    // linalozifanya zionekane "hazijaidhinishwa" kimakosa. Rider yeyote
    // aliyekuwepo tayari (created kabla ya mfumo huu wa idhini) anahesabiwa
    // ameshaidhinishwa moja kwa moja.
    if(p.approved === undefined){
      p.approved = true;
      saveRiderProfile(p);
    }
    return p;
  }
  // Rider wa demo (rider1) ameshathibitishwa tayari (grandfathered)
  const profile = {
    id: riderId, name: "Juma Rider", phone: "0712000000",
    vehicle: "Pikipiki", plate: "T 123 ABC", online: true, rating: 4.8, approved: true
  };
  saveRiderProfile(profile);
  return profile;
}
function saveRiderProfile(p){
  localStorage.setItem("ujasi_rider_profile_" + getCurrentRiderId(), JSON.stringify(p));
}
function toggleRiderOnline(){
  const p = getRiderProfile();
  if(!p.approved) return p.online; // hawezi kwenda mtandaoni kama hajaidhinishwa
  p.online = !p.online;
  saveRiderProfile(p);
  return p.online;
}

/* ---------- Foleni ya Oda Zinazopatikana (bado hazijachukuliwa) ---------- */
function getAvailableDeliveries(){
  return getOrders().filter(o => o.status === "ready_for_pickup" && !o.riderId);
}

/* ---------- Oda za Rider Huyu ---------- */
function getMyDeliveries(){
  const riderId = getCurrentRiderId();
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
