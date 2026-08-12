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

/* ---------- Cart, Anwani, Oda, Migahawa ----------
   HAZIPO TENA hapa (localStorage imeondolewa KABISA). Sasa zinatoka
   Firestore HALISI (onSnapshot, live, cross-device):
     - Kikapu (Cart) + Anwani  → js/customer-firestore.js
     - Oda (Orders)            → js/orders-firestore.js
     - Migahawa + Menyu        → js/restaurants-firestore.js
   Faili hizi lazima zipakiwe KWENYE UKURASA unaozihitaji (baada ya
   firebase-config.js, kabla ya restaurant-admin.js/rider.js/
   admin-layer1.js/super-admin.js zinazotegemea baadhi ya functions
   hizi). getAllPlatformRestaurants()/findAnyRestaurant() nazo
   zimehamia js/restaurants-firestore.js. */
function updateCartBadge(){
  if(typeof cartCount !== "function") return; // ukurasa huu haujapakia customer-firestore.js (hauna kikapu)
  const badge = document.querySelectorAll("[data-cart-badge]");
  const n = cartCount();
  badge.forEach(b => {
    b.textContent = n;
    b.style.display = n > 0 ? "inline-flex" : "none";
  });
}
document.addEventListener("DOMContentLoaded", updateCartBadge);

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
/* ---------- Ulinzi wa Paneli (Role Guard) — Firebase HALISI ----------
   Inachukua nafasi ya ile-mwanzo-kabisa localStorage guard
   ("ujasi_xxx_session") iliyokuwa juu ya kila dashibodi. Sasa
   inatumia Firebase Auth + Firestore users/{uid}.role moja kwa
   moja - kuingia kwenye kifaa/kivinjari kingine (username) bado
   kunamtambua mtumiaji sahihi kila mahali, bila localStorage. */
function guardRole(requiredRole, loginPage){
  auth.onAuthStateChanged(function(user){
    if(!user){ window.location.replace(loginPage); return; }
    db.collection("users").doc(user.uid).get().then(function(doc){
      const data = doc.exists ? doc.data() : null;
      if(!data || data.role !== requiredRole){
        auth.signOut();
        window.location.replace(loginPage);
      }
    }).catch(function(){ window.location.replace(loginPage); });
  });
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
   Netlify/Vercel deploy (mzizi wa repo NDIYO mzizi wa tovuti - hakuna
   Base/Publish directory inayohitajika tena). Haifanyi kazi kwenye
   file:// (jambo la kawaida - Service Workers zinahitaji https/localhost),
   hivyo hairudishi kosa linaloonekana kwa mtumiaji. */
if("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .catch((err) => console.warn("Service Worker haikusajiliwa:", err));
  });
}

/* ---------- PWA: Weka <link rel="manifest"> sahihi kwa kila paneli ----------
   Kila sehemu (Mteja, Mgahawa, Rider, Admin Layer 1, Super Admin) ina
   manifest yake YENYEWE (jina tofauti + start_url tofauti), ili
   mtu akisakinisha "app" kutoka ukurasa wake, aikoni yake IMFUNGULIE
   MOJA KWA MOJA dashibodi yake mwenyewe - siyo ukurasa wa mteja. */
(function ensureManifestLink(){
  if(document.querySelector('link[rel="manifest"]')) return;
  const file = window.location.pathname.split("/").pop() || "index.html";
  let manifestFile = "/manifest.json"; // default: Mteja
  if(file.startsWith("restaurant-")) manifestFile = "/manifest-restaurant.json";
  else if(file.startsWith("rider-")) manifestFile = "/manifest-rider.json";
  else if(file.startsWith("adminlayer1-")) manifestFile = "/manifest-adminlayer1.json";
  else if(file.startsWith("superadmin-")) manifestFile = "/manifest-superadmin.json";
  const link = document.createElement("link");
  link.rel = "manifest";
  link.href = manifestFile;
  document.head.appendChild(link);
})();
