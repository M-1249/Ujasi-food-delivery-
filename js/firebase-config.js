/* =====================================================
   FIREBASE CONFIG — UJASI FOOD DELIVERY
   Badilisha maadili haya na yale ya mradi wako Firebase
   (Project Settings → General → Your apps → SDK config).
   Hii inatumia Firebase COMPAT SDK (script tags), si ES
   Modules — hii inafanya kazi vizuri kwenye Spck Editor
   na file:// bila mfumo wa build.
   ===================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBEQCl44UgPDdDiEDt7nKdo1Xqq1bprp38",
  authDomain: "ujasi-food-delivery.firebaseapp.com",
  projectId: "ujasi-food-delivery",
  storageBucket: "ujasi-food-delivery.firebasestorage.app",
  messagingSenderId: "773421850712",
  appId: "1:773421850712:web:a8e3ef15c96b9d588c6a2d",
  measurementId: "G-GQ6VZ0HG82"
};

// Anzisha Firebase (compat) — script hii inapaswa kupakiwa
// BAADA ya CDN script za firebase-app-compat.js, firebase-auth-compat.js,
// firebase-firestore-compat.js (angalia sehemu ya <head> ya kila ukurasa).
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// CACHE YA LOCAL (IndexedDB, SI localStorage) — inapunguza sana idadi
// ya "reads" za Firebase: data inayoshasomwa mara moja inabaki kwenye
// kifaa, hivyo ukurasa unapopakiwa tena (au onSnapshot inapoanzishwa
// upya), data ya awali inaonekana MARA MOJA kutoka kwenye cache hii
// bila kusubiri mtandao, kisha inasasishwa kimya kimya endapo kuna
// mabadiliko halisi kwenye server.
try{
  db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if(err.code === "failed-precondition"){
      // Tabo/dirisha zaidi ya moja ya kivinjari ziko wazi - persistence
      // inaruhusiwa dirisha MOJA tu kwa wakati mmoja katika hali fulani.
      console.warn("UJASI: Firestore persistence - tabo nyingine tayari inatumika:", err);
    } else if(err.code === "unimplemented"){
      console.warn("UJASI: kivinjari hiki hakiungi mkono Firestore offline persistence.");
    }
  });
}catch(e){ console.warn("UJASI: enablePersistence haikuweza kuanzishwa:", e); }

// Mipangilio ya biashara (Lipa Namba) — hizi zinapaswa kusomwa kutoka
// koleksheni ya Firestore "settings/payment" na Super Admin, hapa ni
// default za kuanzia (fallback) endapo mtandao/soma-data unashindwa.
const UJASI_DEFAULT_SETTINGS = {
  lipaNamba: "351154293",
  lipaJina: "UMOJA HISA",
  waterEnabled: true,
  deliveryFee: 2000
};
