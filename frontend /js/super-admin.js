/* =====================================================
   SUPER-ADMIN.JS — Ngazi ya juu kabisa ya usimamizi
   Tofauti na Admin Layer 1 (uendeshaji wa kila siku), Super
   Admin anashughulikia: kuidhinisha akaunti mpya za migahawa
   na riders, ripoti za kina, na mipangilio mikubwa ya jukwaa
   (km. asilimia ya tozo ya jukwaa).
   Hali ya sasa: localStorage (demo).
   ===================================================== */

/* ---------- Promotions / Banners / Discounts ----------
   Yanaonekana kwa wateja wote kwenye customer/promotions.html
   na kwenye banner ya juu ya customer/home.html. */
const PROMOTIONS_KEY = "ujasi_promotions";

function getAllPromotions(){
  const saved = localStorage.getItem(PROMOTIONS_KEY);
  return saved ? JSON.parse(saved) : [];
}
function getActivePromotions(){
  const now = new Date();
  return getAllPromotions().filter(p => {
    if(p.active === false) return false; // default: onekana, isipokuwa imefichwa wazi
    if(p.endDate){
      // Tarehe ya mwisho inahesabiwa hadi MWISHO wa siku hiyo (23:59:59),
      // si mwanzo wake (00:00) - la sivyo ofa "inaisha" papo hapo siku
      // hiyo hiyo inapowekwa.
      const endOfDay = new Date(p.endDate + "T23:59:59");
      if(endOfDay < now) return false;
    }
    return true;
  });
}
function savePromotion(promo){
  const list = getAllPromotions();
  if(promo.id){
    const i = list.findIndex(p => p.id === promo.id);
    if(i >= 0) list[i] = promo;
    else list.push(promo);
  } else {
    promo.id = "promo_" + Date.now();
    list.unshift(promo);
  }
  localStorage.setItem(PROMOTIONS_KEY, JSON.stringify(list));
  return promo;
}
function deletePromotion(id){
  localStorage.setItem(PROMOTIONS_KEY, JSON.stringify(getAllPromotions().filter(p => p.id !== id)));
}
function togglePromotionActive(id){
  const list = getAllPromotions();
  const p = list.find(x => x.id === id);
  if(p) p.active = !p.active;
  localStorage.setItem(PROMOTIONS_KEY, JSON.stringify(list));
}

/* ---------- Reviews & Ratings ----------
   Mteja anaweza kutoa review baada ya oda kufika (customer/orders.html).
   Super Admin anaweza kuona/kufuta reviews zote (moderation). */
const REVIEWS_KEY = "ujasi_reviews";

function getAllReviews(){
  const saved = localStorage.getItem(REVIEWS_KEY);
  return saved ? JSON.parse(saved) : [];
}
function getReviewsForRestaurant(restaurantId){
  return getAllReviews().filter(r => r.restaurantId === restaurantId);
}
function hasReviewedOrder(orderCode){
  return getAllReviews().some(r => r.orderCode === orderCode);
}
function addReview(review){
  const list = getAllReviews();
  review.id = "rev_" + Date.now();
  review.createdAt = new Date().toISOString();
  list.unshift(review);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));

  // Sasisha wastani wa rating wa mgahawa
  const profileKey = "ujasi_restaurant_profile_" + review.restaurantId;
  const savedProfile = localStorage.getItem(profileKey);
  if(savedProfile){
    const profile = JSON.parse(savedProfile);
    const allForRest = getReviewsForRestaurant(review.restaurantId);
    const avg = allForRest.reduce((s,r) => s + r.rating, 0) / allForRest.length;
    profile.rating = Math.round(avg * 10) / 10;
    profile.reviews = allForRest.length;
    localStorage.setItem(profileKey, JSON.stringify(profile));
  }
  return review;
}
function deleteReview(id){
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(getAllReviews().filter(r => r.id !== id)));
}

/* ---------- Migahawa Inayosubiri Idhini ---------- */
function getPendingRestaurants(){
  const list = [];
  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    if(key && key.indexOf("ujasi_restaurant_profile_") === 0){
      try{
        const p = JSON.parse(localStorage.getItem(key));
        if(p.approved === false) list.push(p);
      }catch(e){}
    }
  }
  return list;
}
function approveRestaurant(id){
  const key = "ujasi_restaurant_profile_" + id;
  const p = JSON.parse(localStorage.getItem(key));
  p.approved = true;
  localStorage.setItem(key, JSON.stringify(p));
}
function rejectRestaurant(id){
  localStorage.removeItem("ujasi_restaurant_profile_" + id);
  localStorage.removeItem("ujasi_menu_" + id);
}

/* ---------- Riders Wanaosubiri Idhini ---------- */
function getPendingRiders(){
  const list = [];
  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    if(key && key.indexOf("ujasi_rider_profile_") === 0){
      try{
        const p = JSON.parse(localStorage.getItem(key));
        if(p.approved === false) list.push(p);
      }catch(e){}
    }
  }
  return list;
}
function approveRider(id){
  const key = "ujasi_rider_profile_" + id;
  const p = JSON.parse(localStorage.getItem(key));
  p.approved = true;
  localStorage.setItem(key, JSON.stringify(p));
}
function rejectRider(id){
  localStorage.removeItem("ujasi_rider_profile_" + id);
}

/* ---------- Mipangilio Mikubwa ya Jukwaa ---------- */
const PLATFORM_SETTINGS_KEY = "ujasi_platform_settings";
function getPlatformSettings(){
  const saved = localStorage.getItem(PLATFORM_SETTINGS_KEY);
  if(saved) return JSON.parse(saved);
  const defaults = { commissionPercent: 12, supportPhone: "0700 000 000", termsText: "" };
  savePlatformSettings(defaults);
  return defaults;
}
function savePlatformSettings(s){
  localStorage.setItem(PLATFORM_SETTINGS_KEY, JSON.stringify(s));
}

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
    pendingRestaurants: getPendingRestaurants().length,
    pendingRiders: getPendingRiders().length
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
