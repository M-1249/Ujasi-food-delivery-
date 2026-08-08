/* =====================================================
   APP.JS — Shared utilities kwa UJASI FOOD DELIVERY
   Faili hii haitumii ES Modules (haina import/export) ili
   ifanye kazi moja kwa moja kupitia <script src="..."></script>
   ndani ya Spck Editor / file:// protocol.
   ===================================================== */

/* ---------- Mitandao ya Lipa Namba (Tanzania) ---------- */
const MOBILE_NETWORKS = [
  { id: "vodacom", name: "M-Pesa",   operator: "Vodacom", color: "#E60000" },
  { id: "tigo",    name: "Mixx by Yas", operator: "Tigo/Yas", color: "#0072CE" },
  { id: "airtel",  name: "Airtel Money", operator: "Airtel", color: "#FF0000" },
  { id: "halotel", name: "HaloPesa", operator: "Halotel", color: "#F7941D" },
  { id: "ttcl",    name: "T-Pesa",   operator: "TTCL", color: "#005BAA" }
];

function networkInitial(name){
  return name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
}

/* ---------- Toast ---------- */
function showToast(msg, type, durationMs){
  const duration = durationMs || (msg.length > 40 ? 5000 : 3000);
  let host = document.getElementById("toast-host");
  if(!host){
    host = document.createElement("div");
    host.id = "toast-host";
    document.body.appendChild(host);
  }
  const t = document.createElement("div");
  t.className = "toast";
  if(type === "error") t.style.background = "var(--alert)";
  if(type === "success") t.style.background = "var(--success)";
  const fadeOutDelay = Math.max(duration - 400, 200) / 1000;
  t.style.animation = `toast-in .32s cubic-bezier(.16,.8,.24,1) forwards, toast-out .28s ease ${fadeOutDelay}s forwards`;
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

/* ---------- Order / Transaction code generator ----------
   Muundo: UJ-XXXX-XXXX (kama namba ya lebo ya dawa) */
function generateOrderCode(){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function block(n){
    let s = "";
    for(let i=0;i<n;i++) s += chars[Math.floor(Math.random()*chars.length)];
    return s;
  }
  return `UJ-${block(4)}-${block(4)}`;
}

function generateReceiptNumber(){
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  return `RCT-${stamp}-${Math.floor(1000 + Math.random()*9000)}`;
}

/* ---------- Currency ---------- */
function formatTZS(amount){
  return "TSh " + Number(amount).toLocaleString("en-TZ");
}

/* ---------- Cart (localStorage) ----------
   Muundo: [{ id, restaurantId, restaurantName, name, price, qty, photo }] */
const CART_KEY = "ujasi_cart_v1";

function getCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch(e){ return []; }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function addToCart(item){
  const cart = getCart();
  const existing = cart.find(c => c.id === item.id);
  if(existing){ existing.qty += item.qty || 1; }
  else{ cart.push({ ...item, qty: item.qty || 1 }); }
  saveCart(cart);
  showToast(`${item.name} imeongezwa kwenye kikapu`, "success");
}
function removeFromCart(id){
  saveCart(getCart().filter(c => c.id !== id));
}
function setCartQty(id, qty){
  const cart = getCart();
  const item = cart.find(c => c.id === id);
  if(item){
    item.qty = qty;
    if(item.qty <= 0) return removeFromCart(id);
  }
  saveCart(cart);
}
function cartSubtotal(){
  return getCart().reduce((sum, c) => sum + (c.price * c.qty), 0);
}
function cartCount(){
  return getCart().reduce((sum, c) => sum + c.qty, 0);
}
function clearCart(){ saveCart([]); }
function updateCartBadge(){
  const badge = document.querySelectorAll("[data-cart-badge]");
  const n = cartCount();
  badge.forEach(b => {
    b.textContent = n;
    b.style.display = n > 0 ? "inline-flex" : "none";
  });
}
document.addEventListener("DOMContentLoaded", updateCartBadge);

/* ---------- Saved delivery addresses (localStorage demo) ---------- */
const ADDR_KEY = "ujasi_addresses_v1";
function getAddresses(){
  try{ return JSON.parse(localStorage.getItem(ADDR_KEY)) || []; }
  catch(e){ return []; }
}
function saveAddress(addr){
  const list = getAddresses();
  list.push({ id: "addr_" + Date.now(), ...addr });
  localStorage.setItem(ADDR_KEY, JSON.stringify(list));
  return list;
}
function deleteAddress(id){
  const list = getAddresses().filter(a => a.id !== id);
  localStorage.setItem(ADDR_KEY, JSON.stringify(list));
}

/* ---------- Order history (localStorage demo, hadi Firestore itakapounganishwa) ---------- */
const ORDERS_KEY = "ujasi_orders_v1";
function getOrders(){
  try{ return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
  catch(e){ return []; }
}
function saveOrder(order){
  const list = getOrders();
  list.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
}
function getOrderByCode(code){
  return getOrders().find(o => o.orderCode === code);
}
function updateOrderStatus(code, status){
  const list = getOrders();
  const o = list.find(x => x.orderCode === code);
  if(o){ o.status = status; localStorage.setItem(ORDERS_KEY, JSON.stringify(list)); }
}
function updateOrder(code, changes){
  const list = getOrders();
  const o = list.find(x => x.orderCode === code);
  if(o){ Object.assign(o, changes); localStorage.setItem(ORDERS_KEY, JSON.stringify(list)); }
  return o;
}

/* ---------- Migahawa Yote ya Jukwaa (demo + iliyosajiliwa upya) ----------
   Hii inaunganisha DEMO_RESTAURANTS (js/data.js) na migahawa yoyote
   mipya iliyosajiliwa kupitia restaurant-admin/register.html, ili
   ionekane kwa wateja wote kwenye home.html/restaurant.html. */
function getAllPlatformRestaurants(){
  const list = (typeof DEMO_RESTAURANTS !== "undefined") ? DEMO_RESTAURANTS.slice() : [];
  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    if(key && key.indexOf("ujasi_restaurant_profile_") === 0){
      const id = key.replace("ujasi_restaurant_profile_", "");
      if(list.some(r => r.id === id)) continue; // tayari ipo (mgahawa wa demo)
      try{
        const profile = JSON.parse(localStorage.getItem(key));
        if(profile.approved === false) continue; // bado haijaidhinishwa na Super Admin
        const menuRaw = localStorage.getItem("ujasi_menu_" + id);
        const foods = menuRaw ? JSON.parse(menuRaw).filter(f => f.available !== false) : [];
        list.push({
          id, name: profile.name, category: profile.category, cover: profile.cover,
          logo: profile.logo, rating: profile.rating || 0, reviews: profile.reviews || 0,
          prepTime: profile.prepTime, distanceKm: profile.distanceKm || 1.5,
          deliveryFee: profile.deliveryFee, isOpen: profile.isOpen, foods
        });
      }catch(e){ console.warn("Imeshindikana kusoma mgahawa", id, e); }
    }
  }
  return list;
}
function findAnyRestaurant(id){
  return getAllPlatformRestaurants().find(r => r.id === id);
}

/* ---------- Query param helper ---------- */
function qParam(key){
  return new URLSearchParams(window.location.search).get(key);
}

/* ---------- Reveal-on-scroll (mwendo/animation ya kawaida) ---------- */
function initScrollReveal(){
  const items = document.querySelectorAll(".scroll-reveal");
  if(!("IntersectionObserver" in window)){
    items.forEach(el => el.classList.add("reveal"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("reveal");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(el => io.observe(el));
}
/* ---------- Umesahau Nenosiri (Password Reset) ----------
   Function moja inayotumika na kurasa zote 5 za login (customer,
   restaurant-admin, rider, admin-layer1, super-admin). Inatuma
   barua-pepe halisi yenye link ya kubadilisha nenosiri kupitia
   Firebase Authentication (sendPasswordResetEmail). */
function sendPasswordReset(email){
  if(!email){
    showToast("Weka barua pepe yako kwanza, kisha bofya 'Umesahau Nenosiri?'", "error");
    return;
  }
  if(typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length){
    showToast("Huduma ya Firebase haipatikani kwa sasa", "error");
    return;
  }
  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      showToast("Tumetuma link ya kubadilisha nenosiri kwa " + email, "success", 6000);
    })
    .catch((err) => {
      console.error(err);
      const map = {
        "auth/user-not-found": "Hakuna akaunti yenye barua pepe hii.",
        "auth/invalid-email": "Barua pepe si sahihi."
      };
      showToast(map[err.code] || "Imeshindikana kutuma link. Jaribu tena.", "error");
    });
}

/* ---------- PWA: Kitufe cha Kusakinisha (Install) ----------
   Chrome/Android hutoa "beforeinstallprompt" - tunauhifadhi ili
   uweze kuchochewa na kitufe cha kawaida cha UI (badala ya kutegemea
   arifa ya kivinjari pekee). iOS/Safari haiungi mkono hili - kwa
   hiyo tunaonyesha maelekezo ya mkono badala yake. */
let deferredInstallPrompt = null;

function isRunningStandalone(){
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function isIOSDevice(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  document.querySelectorAll("[data-install-btn]").forEach(b => b.style.display = "none");
  showToast("Programu imesakinishwa — Karibu!", "success");
});

function isAndroidDevice(){
  return /android/i.test(navigator.userAgent);
}
function isSafari(){
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);
}

function triggerInstall(){
  if(isRunningStandalone()){
    showToast("Tayari umesha sakinisha programu hii", "success");
    return;
  }
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(() => { deferredInstallPrompt = null; });
    return;
  }
  if(isIOSDevice() && isSafari()){
    showToast('Bofya kitufe cha "Share" (⬆️) chini, kisha chagua "Add to Home Screen"', "error");
    return;
  }
  if(isAndroidDevice()){
    showToast('Fungua menyu ya kivinjari (⋮) juu kulia, kisha "Ongeza kwenye Skrini ya Nyumbani" / "Install app"', "error");
    return;
  }
  showToast('Tumia menyu ya kivinjari chako kuchagua "Install" au "Add to Home Screen"', "error");
}

document.addEventListener("DOMContentLoaded", () => {
  if(isRunningStandalone()){
    document.querySelectorAll("[data-install-btn]").forEach(b => b.style.display = "none");
  }
});

/* ---------- Shiriki Kiungo (Web Share API + fallback ya kunakili) ---------- */
async function shareApp(){
  const shareData = {
    title: "UJASI Food Delivery",
    text: "🍽️💧 UJASI Food Delivery — Agiza chakula na maji safi Dodoma, Tanzania. Chakula chako, kimeandaliwa na kufikishwa kwa uangalifu, kama duka la dawa.",
    url: window.location.origin + "/index.html"
  };
  if(navigator.share){
    try{ await navigator.share(shareData); }
    catch(e){ /* mtumiaji ameghairi - hakuna hitilafu */ }
    return;
  }
  if(navigator.clipboard){
    try{
      await navigator.clipboard.writeText(shareData.url);
      showToast("Kiungo kimenakiliwa — bandika popote kushiriki", "success");
      return;
    }catch(e){}
  }
  showToast("Kiungo: " + shareData.url);
}

document.addEventListener("DOMContentLoaded", initScrollReveal);

/* ---------- PWA: Sajili Service Worker (caching kupunguza fetch) ----------
   Hii inajisajili moja kwa moja kwenye kila ukurasa unaopakia app.js.
   Njia "/service-worker.js" ni root-relative - inafanya kazi baada ya
   Netlify deploy (publish directory = frontend). Haifanyi kazi kwenye
   file:// (jambo la kawaida - Service Workers zinahitaji https/localhost),
   hivyo hairudishi kosa linaloonekana kwa mtumiaji. */
if("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .catch((err) => console.warn("Service Worker haikusajiliwa:", err));
  });
}

/* ---------- PWA: Weka <link rel="manifest"> kiotomatiki kwenye kila ukurasa ---------- */
(function ensureManifestLink(){
  if(!document.querySelector('link[rel="manifest"]')){
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/manifest.json";
    document.head.appendChild(link);
  }
})();
