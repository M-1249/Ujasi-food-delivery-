# UJASI FOOD DELIVERY — Sehemu ya 1: Customer Web App

Mtindo wa muonekano: **"Duka la Dawa"** — usafi, uaminifu, na uthibitisho.
Rangi kuu: teal ya kliniki (`#0C6B58`) + mango ya joto la chakula (`#FF9F1C`).
Alama maalum (signature): **lebo ya dawa (prescription label)** yenye mstari
wa vitone — inatumika kwenye namba za oda, risiti, na sehemu ya Lipa Namba,
ili "ahadi ya usafi wa duka la dawa" ionekane katika mfumo mzima.

## Marekebisho Muhimu (Round ya Mwisho)

**1. Hitilafu kubwa ya Rider Login imepatikana na kurekebishwa**: `rider/login.html`
ilikuwa ikijaribu kuingia kwa "namba ya simu → barua-pepe ya kubuni"
(`simu@ujasi.app`), lakini `rider/register.html` inasajili kwa barua pepe
HALISI — hazikufanana, hivyo **rider yeyote aliyesajili kamwe asingeweza
kuingia**. Sasa zote mbili zinatumia barua pepe halisi kwa uwiano kamili.

**2. Logout haikuwa inatoka Firebase Auth kikamilifu**: Kurasa za
`restaurant-admin/profile.html`, `rider/profile.html`,
`admin-layer1/settings.html`, na `super-admin/settings.html` zilikuwa
hazijapakia Firebase SDK kabisa — kitufe cha "Toka" kilikuwa kinafuta tu
alama ya kwenye kifaa (localStorage), si session halisi ya Firebase. Sasa
zote zinaita `firebase.auth().signOut()` kikamilifu kabla ya kutoka.

**3. Umesahau Nenosiri (Forgot Password)** — imeongezwa kwenye LOGIN ZOTE
TANO (Customer, Restaurant Admin, Rider, Admin Layer 1, Super Admin).
Inatumia `firebase.auth().sendPasswordResetEmail()` halisi — mtumiaji
anapokea barua-pepe yenye link ya kubadilisha nenosiri moja kwa moja
kutoka Firebase (si mfumo wetu). Kwa akaunti za mteja zilizosajiliwa kwa
namba ya simu tu (bila barua pepe), mfumo unaonyesha ujumbe sahihi
badala ya kujaribu kutuma barua-pepe isiyopo.

**4. Promotions/Banners hazikuonekana kwenye customer/home.html** —
chanzo kilikuwa hitilafu ya tarehe: "Tarehe ya Mwisho" ilihesabiwa kama
saa 00:00 (mwanzo wa siku) badala ya 23:59:59 (mwisho wa siku), hivyo ofa
yoyote yenye tarehe ya "leo" ilionekana "imeisha muda" papo hapo
ilipoundwa. Sasa imesahihishwa `js/super-admin.js` → `getActivePromotions()`.

**5. Service Worker imepandishwa toleo** (`ujasi-v1` → `ujasi-v2`) ili
vifaa vilivyokwishasakinisha programu au kuhifadhi cache kabla ya
marekebisho haya yapate JS/CSS mpya papo hapo, si za zamani zilizohifadhiwa.

## Uthibitisho: Login 5 Hazingiliani (Firebase Authentication)

| Paneli | Njia ya kuingia | `role` ya Firestore | Register ya umma? |
|---|---|---|---|
| Customer | Simu AU Barua pepe | `customer` | Ndiyo (`auth/register.html`) |
| Restaurant Admin | Barua pepe halisi | `restaurant_admin` | Ndiyo (`restaurant-admin/register.html`) |
| Rider | Barua pepe halisi | `rider` | Ndiyo (`rider/register.html`) |
| Admin Layer 1 | Barua pepe halisi | `admin_layer1` | Hapana (kwa makusudi — Firebase Console tu) |
| Super Admin | Barua pepe halisi | `super_admin` | Hapana (kwa makusudi — Firebase Console tu) |

Kila `login.html` (isipokuwa Customer awali, sasa imerekebishwa pia)
inasoma `users/{uid}.role` MARA MOJA baada ya kuingia, na ikiwa haifanani
na paneli husika, mtumiaji anatolewa nje papo hapo
(`firebase.auth().signOut()`) na ujumbe wazi unaonyeshwa. Barua pepe moja
haiwezi kuwa na `role` mbili — mtu anayehitaji majukumu mawili (mfano
Rider NA Mmiliki wa Mgahawa) lazima atumie barua pepe mbili tofauti.

## Muundo wa Folda — SASA NI BAPA (FLAT) KABISA

**MUHIMU: Toleo hili halina folda za ndani za HTML kabisa (hakuna
`customer/`, `auth/`, `restaurant-admin/`, n.k.) — kila ukurasa wa HTML
uko moja kwa moja kwenye mzizi wa repo, na jina lake linaonyesha sehemu
yake (`customer-`, `restaurant-`, `rider-`, `adminlayer1-`,
`superadmin-`).** Hii ni kwa makusudi: muundo wa folda nyingi za ndani
ulikuwa unasababisha faili kupotea kimya wakati wa kunakili kwa mkono
kwenye Spck (Android Scoped Storage + kunakili folda kwa folda kwa
mkono). Muundo bapa unaondoa hatari hiyo kabisa — faili 58 zote ziko
ngazi moja, rahisi kunakili/kuangalia zote kwa mara moja.

Folda pekee zilizobaki ni za **assets** (`css/`, `js/`, `icons/`) — hizi
hazina hatari ya kupotea kwa sababu hazibadiliki mara kwa mara na ni
chache.

```
(mzizi wa repo)
├── index.html                      ← Splash / Landing
├── 404.html
├── manifest.json, service-worker.js ← PWA
├── robots.txt, sitemap.xml, firestore.rules
├── css/global.css
├── js/  (app.js, data.js, firebase-config.js, location.js,
│        admin-layer1.js, restaurant-admin.js, rider.js, super-admin.js)
├── icons/  (icon-192.png, icon-512.png, icon-maskable-512.png)
│
├── customer-login.html, customer-register.html      ← (zamani: auth/)
├── customer-home.html, customer-restaurant.html,
│   customer-cart.html, customer-checkout.html,
│   customer-order-track.html, customer-orders.html,
│   customer-receipt.html, customer-profile.html,
│   customer-addresses.html, customer-notifications.html,
│   customer-promotions.html                          ← (zamani: customer/)
├── water-delivery.html                                ← (zamani: water/)
│
├── restaurant-login.html, restaurant-register.html,
│   restaurant-dashboard.html, restaurant-orders.html,
│   restaurant-menu.html, restaurant-profile.html       ← (zamani: restaurant-admin/)
│
├── rider-login.html, rider-register.html,
│   rider-dashboard.html, rider-deliveries.html,
│   rider-profile.html                                  ← (zamani: rider/)
│
├── adminlayer1-login.html, adminlayer1-dashboard.html,
│   adminlayer1-orders.html, adminlayer1-restaurants.html,
│   adminlayer1-riders.html, adminlayer1-settings.html   ← (zamani: admin-layer1/)
│
└── superadmin-login.html, superadmin-dashboard.html,
    superadmin-approvals.html, superadmin-promotions.html,
    superadmin-reviews.html, superadmin-reports.html,
    superadmin-settings.html                             ← (zamani: super-admin/)
```

**Jinsi ya kufikia kila paneli sasa** (badilisha domain yako):
- Mteja: `yourdomain.com/index.html`
- Mgahawa: `yourdomain.com/restaurant-login.html`
- Rider: `yourdomain.com/rider-login.html`
- Admin Layer 1: `yourdomain.com/adminlayer1-login.html`
- Super Admin: `yourdomain.com/superadmin-login.html`

## Jinsi ya Kuanzisha

1. **Firebase**: Fungua `js/firebase-config.js` na badilisha `firebaseConfig`
   na funguo za mradi wako halisi (Firebase Console → Project Settings).
2. **Firestore Rules**: Bandika `firestore.rules` kwenye Firebase Console
   → Firestore → Rules → Publish.
3. **Netlify/Vercel**: HAKUNA mipangilio ya "Base directory"/"Publish
   directory"/"Root Directory" inayohitajika — acha wazi/default kabisa,
   kwa sababu faili hizi ZENYEWE ndizo mzizi wa repo.
4. **Spck Editor / mobile**: Faili zote ni JS ya kawaida (hakuna
   `import`/`export`), hivyo zinafanya kazi moja kwa moja kupitia
   `<script src="...">` bila mfumo wa build.

## Marekebisho ya Hivi Karibuni

- **Huduma bila akaunti (Guest Access)**: Splash inampeleka mtumiaji moja kwa
  moja "Nyumbani" bila kulazimika kujisajili/kuingia. Kujisajili ni hiari
  (kuhifadhi historia kwenye vifaa vingine). Wakati wa checkout, mtumiaji
  bila akaunti anaweka Jina lake tu (kwa mawasiliano na rider).
- **Animation safi**: Kila ukurasa una mwendo laini wa kuingia (`page-in`),
  vitufe/kadi vina mwendo wa "press" wa asili zaidi, picha zina fade-in,
  na hatua ya sasa kwenye ufuatiliaji wa oda ina mpigo mdogo (pulse) badala
  ya kutuama tuli.

## Hali ya Sasa (Demo Mode)

- Migahawa/vyakula: `js/data.js` (data tuli, kwa ajili ya kuonyesha UI).
  Baadaye itabadilishwa kusoma moja kwa moja kutoka Firestore
  (`restaurants`, `foods`).
- Kikapu, anwani, na oda: zinahifadhiwa kwa `localStorage` kwa sasa
  (`ujasi_cart_v1`, `ujasi_addresses_v1`, `ujasi_orders_v1`). Zitahamishwa
  kwenda Firestore wakati Sehemu ya 2 (Admin Panel + backend) itakapokamilika.
- **Malipo (Lipa Namba)**: Mtumiaji anachagua mtandao, analipa nje ya app,
  kisha anaingiza Namba ya Muamala. Hali ya oda inabaki
  `pending_verification` mpaka backend/webhook ithibitishe malipo — client
  KAMWE haiandiki hali ya "imelipwa" moja kwa moja (kanuni ile ile
  uliyotumia PHARMAVERSE).

## Eneo la Ramani Halisi (Google Maps)

- `customer/addresses.html` na `water/water-delivery.html` zina ramani ya
  kuweka eneo (angalia sehemu "Eneo la Ramani — Sasa BURE" hapa chini kwa
  maelezo kamili ya jinsi inavyofanya kazi bila malipo/funguo ya API).
- **MUHIMU kwa Admin Layer 1 (siyo Super Admin)**: Wakati wa `checkout.html`
  na `water-delivery.html`, anwani NZIMA (pamoja na `lat`/`lng`) inabandikwa
  moja kwa moja ndani ya kumbukumbu ya oda (`order.deliveryAddress`) — si
  `addressId` tu — kwa sababu Admin Layer 1 (paneli ya uendeshaji/dispatch)
  itafanya kazi kwenye kifaa/mtandao tofauti na wa mteja, hivyo haiwezi
  kufikia `localStorage` ya mteja. Hii inahakikisha kila oda inabeba eneo
  lake kamili tayari kwa ramani ya dispatch ya Admin Layer 1.
- `restaurant-admin/orders.html`, `rider/deliveries.html`, na
  `customer/order-track.html` sasa vinaonyesha anwani na kiungo cha
  "Fungua kwenye Google Maps →".

## Eneo la Ramani — Sasa BURE (Hakuna Malipo/Funguo ya API)

Awali tulitumia Google Maps JavaScript API (inahitaji funguo/malipo).
Sasa `customer/addresses.html` na `water/water-delivery.html` zinatumia:

- **Utafutaji wa mahali**: Nominatim (OpenStreetMap) — bure kabisa, hauhitaji
  funguo ya API. (`js/location.js` → `searchPlace()`)
- **Uonyeshaji wa ramani**: Google Maps Embed kupitia `<iframe>` na
  `output=embed` — hii nayo ni BURE na haihitaji funguo ya API.
- **Eneo la sasa**: Geolocation API ya kivinjari (native, bure).
- Vitufe vya "Sahihisha kidogo ▲▼◀▶" vinaruhusu kusogeza pini kidogo kwa
  usahihi zaidi (badala ya kuburuta alama moja kwa moja, jambo ambalo
  halifanyiki kwenye iframe ya bure).

_Kumbuka_: Nominatim ina kikomo cha matumizi (~ombi 1/sekunde) — inafaa
kwa matumizi ya kawaida ya programu. Ukikua sana baadaye, unaweza kuhamia
huduma ya kulipia (km. Google Places API au Mapbox) bila kubadilisha
muundo wa `deliveryAddress` (bado ina `lat`/`lng`/`details`).

## Ulinzi wa Kuingia (Auth Guards) kwa Paneli za Admin

Kurasa zote za `restaurant-admin/` na `rider/` (isipokuwa `login.html`)
sasa zina ukaguzi wa kuingia mwanzoni kabisa mwa `<head>`: ikiwa hakuna
`ujasi_restaurant_session` (au `ujasi_rider_session`), mtumiaji
anaelekezwa moja kwa moja kwenye `login.html` ya paneli husika kabla
ukurasa haujaonekana. Session hii inawekwa ama kwa kuingia halisi
(Firebase Auth + role check) au kwa kitufe cha "Hali ya Demo".

## Sehemu ya 2B — Rider Panel (IMEKAMILIKA)

Folda: `rider/`

- `login.html` — kuingia (Firebase Auth + role check `rider`), na kitufe cha
  "Hali ya Demo".
- `dashboard.html` — swichi Mtandaoni/Nje ya Mtandao, mapato ya leo, idadi ya
  oda zilizofikishwa, na oda zilizo njiani sasa.
- `deliveries.html` — vichupo vitatu:
  - **Zinapatikana**: oda zenye hali `ready_for_pickup` ambazo hazijachukuliwa
    na rider yeyote — bofya "🏍️ Kubali Oda" kuzichukua.
  - **Njiani**: oda alizokubali rider huyu, zenye kiungo cha moja kwa moja
    cha Google Maps kwenda kwa mteja (kutoka `deliveryAddress.lat/lng`).
  - **Zimekamilika**: historia ya kufikisha.
- `profile.html` — jina, namba, aina ya chombo (Pikipiki/Baiskeli/Gari),
  namba ya bango.

**Mzunguko kamili wa demo sasa unafanya kazi mwanzo hadi mwisho**: Mteja
anaagiza → Mgahawa anathibitisha malipo → anaandaa → "Tayari Kuchukuliwa" →
Rider anakubali (hali inakuwa `on_the_way`) → Rider anathibitisha kufika
(`delivered`) → Mteja anaona hali kwenye `order-track.html` ikiwa
imesasishwa papo hapo (localStorage moja).

## Sehemu ya 2A — Restaurant Admin Panel (IMEKAMILIKA)

Folda: `restaurant-admin/`

- `login.html` — kuingia (Firebase Auth + role check `restaurant_admin`), pia
  kuna kitufe cha "Hali ya Demo" cha kuingia moja kwa moja bila akaunti kwa
  ajili ya majaribio.
- `dashboard.html` — muhtasari wa mauzo ya leo, oda zinazosubiri, swichi ya
  Wazi/Imefungwa, na oda 5 za hivi karibuni.
- `orders.html` — oda zote za mgahawa huu (zilizochujwa moja kwa moja kutoka
  oda za wateja), na vitufe vya kusonga hali mbele:
  `pending_verification → payment_confirmed → preparing → ready_for_pickup`.
- `menu.html` — CRUD kamili ya vyakula (ongeza/hariri/ficha/futa).
- `profile.html` — mipangilio ya mgahawa (jina, aina, ada ya usafirishaji,
  muda wa kuandaa, picha ya jalada).

**Muunganiko wa moja kwa moja**: Ukiagiza kama mteja (Sehemu ya 1) kutoka
"Mama Ntilie Kitchen", oda hiyo itaonekana papo hapo kwenye
`restaurant-admin/orders.html` (zote zinatumia `localStorage` moja hadi
Firestore itakapounganishwa) — hii inaruhusu kujaribu mzunguko mzima:
Mteja anaagiza → Mgahawa anathibitisha → Anaandaa → Tayari kuchukuliwa.

_Kikomo cha hali ya demo_: mabadiliko ya profaili ya mgahawa (km. kufunga/
kufungua, ada ya usafirishaji) bado hayaakisiwi moja kwa moja kwenye orodha
ya migahawa ya mteja (`js/data.js` bado ni data tuli) — hii itaunganishwa na
Firestore pamoja na Super Admin Panel.

## Usajili wa Mgahawa Mpya (Kipengele Kilichoongezwa)

Awali paneli ya Restaurant Admin ilikuwa "imefungwa" kwenye mgahawa mmoja
wa demo (`r1` — Mama Ntilie Kitchen). Sasa:

- `restaurant-admin/register.html` — fomu kamili ya kusajili mgahawa mpya
  (jina, aina, ada ya usafirishaji, muda wa kuandaa, jina/simu/barua pepe
  ya mmiliki, nenosiri). Baada ya kusajili, mgahawa mpya unapata `id` yake
  ya kipekee na anaingizwa moja kwa moja kwenye `dashboard.html` yake.
- `js/restaurant-admin.js` sasa ni **dynamic** kwa `restaurantId`
  (`getCurrentRestaurantId()` inasoma kutoka session), badala ya "r1"
  iliyowekwa kwa mkono — hivyo migahawa MINGI inaweza kutumia paneli hii
  hii, kila mmoja akiona data yake tu (menyu, oda, mauzo).
- **Muhimu**: `js/app.js` sasa ina `getAllPlatformRestaurants()` inayounga
  migahawa ya demo (`js/data.js`) na migahawa mipya iliyosajiliwa — hivyo
  `customer/home.html`, `restaurant.html`, `cart.html`, na `checkout.html`
  zote zinaonyesha/zinatambua migahawa mipya moja kwa moja, si demo tu.
- `admin-layer1/restaurants.html` tayari ilikuwa ikisoma migahawa yote
  kwa kuchambua (scan) `localStorage`, hivyo migahawa mipya inaonekana
  papo hapo huko pia bila mabadiliko zaidi.

## Promotions/Banners/Discounts + Reviews & Ratings (Vipya)

- **Ofa/Banners**: `super-admin/promotions.html` — Super Admin anaongeza
  kichwa, maelezo, picha, punguzo (%), msimbo wa ofa, na tarehe ya mwisho.
  Zinaonekana kwa wateja kwenye `customer/promotions.html` na kama banner
  ya kuvutia juu ya `customer/home.html` (ofa ya kwanza inayotumika).
- **Reviews & Ratings**: mteja anaweza kutoa nyota (1-5) + maoni kwa oda
  zilizofika (`customer/orders.html` → "⭐ Toa Rating na Review", mara moja
  tu kwa kila oda). Rating ya mgahawa (`⭐ 4.7 (238)`) inasasishwa
  kiotomatiki. Reviews zinaonekana kwenye ukurasa wa mgahawa
  (`customer/restaurant.html`), na Super Admin anaweza kuona/kufuta
  reviews zote kwenye `super-admin/reviews.html` (moderation, kwa
  kuchuja kwa mgahawa).

## 🚀 PRODUCTION — Firebase Halisi Imeunganishwa

`js/firebase-config.js` sasa ina funguo halisi za mradi wako
`ujasi-food-delivery`. Vitufe vyote vya "Hali ya Demo" (kwenye Restaurant
Admin, Rider, Admin Layer 1, Super Admin) vimeondolewa kabisa — sasa njia
pekee ya kuingia kwenye paneli hizo ni kupitia Firebase Authentication
halisi.

### Kuhusu Usalama wa API Key
Funguo ya Firebase (`apiKey`) SI siri kama funguo za kawaida za API — ni
sehemu ya config ya "client-side" na Google wenyewe wanasema ni salama
kuonekana kwenye code ya mbele (frontend). Ulinzi wa kweli unatoka kwa:
1. **Firestore Security Rules** (`firestore.rules` - tazama faili
   iliyoambatanishwa; bandika kwenye Firebase Console → Firestore
   Database → Rules → Publish).
2. **API key restrictions** kwenye Google Cloud Console → APIs & Services
   → Credentials → chagua funguo yako → "Application restrictions" → HTTP
   referrers → ongeza domain yako ya Vercel (mfano
   `https://ujasi-food-delivery.vercel.app/*`) ili funguo isitumike na
   tovuti nyingine.
3. **Firebase Authentication** yenyewe inalinda nani anaweza kuandika wapi.

### Firebase Auth — Jinsi Login 5 Zinavyotofautiana (Hazingiliani)

Firebase Authentication ya mradi mmoja ina **orodha MOJA** ya watumiaji
(kwa barua pepe), lakini majukumu (roles) yanatofautishwa kwa uwanja
`role` ndani ya hati ya `users/{uid}` kwenye Firestore — SI kwa akaunti
tofauti za Firebase:

| Paneli | Barua pepe ya kuingia | `role` inayohitajika kwenye Firestore |
|---|---|---|
| Customer | simu@ujasi.app (auto) au email halisi | `customer` (au haipo - guest) |
| Restaurant Admin | email ya mmiliki wa mgahawa | `restaurant_admin` + `restaurantId` |
| Rider | email ya rider | `rider` + `riderId` |
| Admin Layer 1 | email ya msimamizi wa uendeshaji | `admin_layer1` |
| Super Admin | email ya msimamizi mkuu | `super_admin` |

**Jinsi zinavyojitenga bila kugongana**:
- Kila ukurasa wa `login.html` (restaurant-admin, rider, admin-layer1,
  super-admin) baada ya `signInWithEmailAndPassword()` kwanza unasoma
  `users/{uid}` kutoka Firestore, kisha unakagua `data.role`. Ikiwa
  `role` haifanani na paneli husika, mtumiaji anatolewa nje mara moja
  (`firebase.auth().signOut()`) na kuonyeshwa ujumbe "Akaunti hii si ya
  [paneli husika]". Hii inazuia, mfano, rider kujaribu kuingia kwenye
  paneli ya Super Admin hata kama anajua nenosiri lake sahihi.
- **Barua pepe MOJA haiwezi kuwa na `role` mbili kwa wakati mmoja** —
  ikiwa mtu anajaribu kujisajili tena kwa barua pepe aliyokwishatumia
  kwenye jukumu jingine, Firebase Auth itakataa ("email already in use").
  Hii ni sahihi kiusalama: mtu mmoja = akaunti moja = jukumu moja. Kama
  mtu anahitaji kuwa Rider NA Mmiliki wa Mgahawa, atumie barua pepe
  mbili tofauti.
- Session za localStorage (`ujasi_restaurant_session`,
  `ujasi_rider_session`, `ujasi_admin1_session`,
  `ujasi_superadmin_session`) ni ZA KWENYE KIFAA TU (kuonyesha paneli
  gani imefunguliwa mwisho kwenye kivinjari hicho) — SI chanzo cha
  ukweli wa ruhusa. Ukweli wa ruhusa unatoka Firestore `role` daima.

**Hatua inayofuata muhimu**: unda watumiaji wa kwanza (Restaurant Admin
mmoja, Rider mmoja, Admin Layer 1 mmoja, Super Admin mmoja) kupitia
kurasa za `register.html` zilizopo (restaurant-admin, rider) au moja kwa
moja kwenye Firebase Console → Authentication → Add User, kisha uweke
`role` sahihi kwenye hati yao ya `users/{uid}` kwenye Firestore Console
(Restaurant Admin/Rider registration tayari inaandika `role` kiotomatiki;
Admin Layer 1 na Super Admin bado hawana ukurasa wa "register" wa umma
kwa makusudi — waundwe na wewe binafsi kupitia Firestore Console kwa
usalama, kwani hawa wana madaraka makubwa).

### Kupandisha (Deploy) kwenye Vercel

1. Pakia MAUDHUI YOTE ya mradi (index.html, css/, js/, customer/, n.k.)
   moja kwa moja kwenye MZIZI wa GitHub repo yako — SI ndani ya folda ya
   `frontend/` (au tumia Vercel CLI: `vercel --prod` ukiwa ndani ya
   folda ya mradi).
2. Kwenye Vercel Dashboard → New Project → chagua repo yako.
3. Framework Preset: chagua "Other". **Root Directory: acha wazi/default**
   (hakuna haja ya kuweka chochote hapa tena, kwa kuwa mradi wenyewe
   NDIYO mzizi wa repo sasa).
4. Framework Preset: chagua "Other" (si React/Next.js - ni tovuti tuli
   ya HTML/CSS/JS).
5. Build Command: acha wazi (hakuna build inayohitajika).
6. Output Directory: acha wazi/default.
7. Bofya "Deploy". Baada ya kukamilika, ongeza domain hiyo kwenye
   "Authorized domains" ya Firebase Console → Authentication →
   Settings, la sivyo login itashindwa kwa kosa la "unauthorized-domain".
8. Faili `vercel.json` iliyoambatanishwa inahakikisha
   `service-worker.js` haikai kwenye cache ya muda mrefu (ili
   masasisho ya baadaye yafike kwa watumiaji haraka).

### Kuhakikisha "Install App" Inafanya Kazi Bila Shida

Baada ya deploy kwenye Vercel (HTTPS halisi), kitufe cha "📲 Install App"
kitafanya kazi kikamilifu ikiwa masharti haya manne yametimia (Chrome
kwenye Android huyakagua kiotomatiki kabla ya kutoa `beforeinstallprompt`):
1. Tovuti iko juu ya HTTPS ✅ (Vercel inatoa hii kiotomatiki)
2. `manifest.json` inapatikana na ina `icons`, `name`, `start_url` ✅
3. `service-worker.js` imesajiliwa kikamilifu (angalia DevTools →
   Application → Service Workers ionyeshe "activated and running") ✅
4. Mtumiaji ameshatembelea/ameshaingiliana na tovuti angalau mara moja
   (heuristic ya Chrome - si kosa la code, ni tabia ya kivinjari)

Ukibofya "Install App" na dirisha halisi halionekani, kitufe
kitaonyesha maelekezo sahihi ya mkono kulingana na kifaa chako (Android:
menyu ya kivinjari ⋮ → "Install app"; iOS Safari: Share → "Add to Home
Screen"). Hii ni tabia ya kawaida ya PWA duniani kote, si hitilafu.

## Vitufe vya "Sakinisha" na "Shiriki Kiungo"

- **📲 Sakinisha Programu** — kwenye `index.html` (splash) na
  `customer/profile.html`. Kwenye Android/Chrome, kitufe hiki kinachochea
  dirisha halisi la "Install App" (kupitia `beforeinstallprompt` event) —
  hakihitaji mtumiaji kutafuta menyu ya kivinjari. Kwenye iOS/Safari
  (isiyoruhusu hili moja kwa moja), kitufe kinaonyesha maelekezo ya mkono
  ("Share → Add to Home Screen"). Kitufe kinajificha kiotomatiki kama
  programu tayari imesakinishwa (`display-mode: standalone`).
- **🔗 Shiriki Kiungo** — inatumia Web Share API ya kifaa (inafungua
  WhatsApp/SMS/n.k. moja kwa moja kwenye simu); kwenye kompyuta ambako
  Web Share haipo, kiungo kinanakiliwa moja kwa moja kwenye clipboard.
- Vitendo vyote viko kwenye `js/app.js` (`triggerInstall()`, `shareApp()`)
  hivyo vinapatikana popote `app.js` inapopakiwa.

## PWA (Inasakinishwa kama "APK") + Caching ya Kupunguza Data

- **manifest.json** + **service-worker.js** vimeongezwa — tovuti sasa
  inaweza "kusakinishwa" kwenye simu (Android/iOS) kupitia "Ongeza kwenye
  Skrini ya Nyumbani / Add to Home Screen" kwenye kivinjari, na kufunguka
  kama programu (APK-kama) yenye ikoni yake, bila anwani ya kivinjari.
- **Caching kupunguza fetch ya data** (muhimu kwa gharama za intaneti):
  - Kurasa za HTML: *network-first* na fallback kwenye cache (toleo jipya
    likiwepo, la zamani likiwa nje ya mtandao).
  - CSS/JS/icons za ndani: *cache-first* — hazipakuliwi tena baada ya
    ziara ya kwanza.
  - Fonti/Firebase SDK (CDN za nje): *stale-while-revalidate* — haraka
    kutoka cache, zinasasishwa kimya nyuma.
  - Nominatim/Google Maps: HAZIHIFADHIWI kamwe — matokeo ya ramani na
    utafutaji yanabaki mapya kila wakati.
- `js/app.js` inajisajili Service Worker kiotomatiki kwenye kila ukurasa.
- **Muhimu**: Service Worker HAIFANYI kazi kwenye `file://` (jaribio la
  moja kwa moja kwenye Spck/simu bila seva) — inahitaji HTTPS (km. baada
  ya Netlify/Vercel deploy) au `localhost`. Njia zote za PWA ni
  root-relative (`/service-worker.js`, `/manifest.json`) — zinafanya
  kazi moja kwa moja kwa sababu mradi huu wenyewe ndio mzizi wa tovuti.
- Icons za PWA (msalaba wa "duka la dawa" juu ya teal) zipo kwenye
  `icons/icon-192.png`, `icon-512.png`, na `icon-maskable-512.png`.

## Marekebisho — Malipo ya Maji

`water/water-delivery.html` awali haikuwa na hatua ya malipo (Lipa Namba)
licha ya chupa za maji kuwa na bei. Sasa ina uteuzi kamili wa mtandao
(Vodacom/Tigo-Yas/Airtel/Halotel/TTCL), namba ya kulipia (inasomwa moja
kwa moja kutoka mipangilio ya Admin Layer 1), na sehemu ya Namba ya
Muamala — sawa na `customer/checkout.html`.

## Sehemu ya 2D — Super Admin / Layer 2-3 (IMEKAMILIKA)

Folda: `super-admin/`

- `login.html` — kuingia (role `super_admin`) + Hali ya Demo.
- `dashboard.html` — takwimu za jukwaa MUDA WOTE (si za leo tu): oda zote,
  mauzo yote yaliyokamilika, jumla ya migahawa na riders, na tahadhari ya
  akaunti zinazosubiri idhini.
- `approvals.html` — **Idhini za akaunti mpya**: migahawa na riders
  waliojisajili wanaonekana hapa na hawawezi "kufungua"/"kwenda
  mtandaoni" mpaka Super Admin awaidhinishe (✔ Idhinisha / ✕ Kataa).
- `reports.html` — chati ya mauzo ya siku 7 zilizopita (imejengwa kwa
  CSS/JS safi, hakuna maktaba ya nje), pamoja na utendaji wa kila mgahawa
  (mauzo na idadi ya oda).
- `settings.html` — mipangilio mikubwa ya jukwaa (asilimia ya tozo,
  namba ya msaada, masharti ya huduma) + kiungo cha haraka kwenda
  mipangilio ya Lipa Namba (Admin Layer 1).

**Mzunguko wa idhini sasa umekamilika**: Mgahawa/Rider anasajili →
haonekani kwa wateja/hawezi mtandaoni (`approved:false`) → Super Admin
anaidhinisha kwenye `approvals.html` → sasa anaonekana kwa wateja na
anaweza kufanya kazi kikamilifu.

## Sera ya Kuingia (Nani Anahitaji Akaunti)

- **Mteja pekee** ndiye anayeruhusiwa kutumia programu BILA kujisajili
  (`index.html` → `customer/home.html` moja kwa moja, checkout inaomba
  jina tu). Kujisajili kwa mteja ni hiari.
- **Sehemu zote nyingine zinahitaji kuingia (login) kwanza**: Restaurant
  Admin, Rider, na Admin Layer 1. Kila ukurasa wao (isipokuwa `login.html`
  yenyewe) una ukaguzi wa session mwanzoni kabisa mwa `<head>` — asiye na
  session anaelekezwa moja kwa moja kwenye `login.html` husika.

## Sehemu ya 2C — Admin Layer 1 (Uendeshaji/Dispatch) — IMEKAMILIKA

Folda: `admin-layer1/` (**Kumbuka: hii SI Super Admin** — ni ngazi ya
uendeshaji wa kila siku; Super Admin/Layer 2-3 itakuja baadaye kwa mambo
makubwa zaidi kama idhinisho la akaunti mpya na ripoti za kina)

- `login.html` — kuingia (role `admin_layer1`) + kitufe cha Hali ya Demo.
- `dashboard.html` — takwimu za JUKWAA LOTE (si mgahawa mmoja): oda za leo,
  mauzo ya leo, riders mtandaoni, migahawa wazi, na tahadhari ya oda
  zinazohitaji uangalizi (zinasubiri malipo / hazina rider).
- `orders.html` — **Dispatch**: oda ZOTE kutoka migahawa yote, kila moja
  ikiwa na ramani midogo (embed, bure) ya eneo la kufikisha, na uwezo wa
  kugawa au kubadilisha rider moja kwa moja kutoka orodha ya riders wote
  waliosajiliwa (Admin Layer 1 anaweza kuingilia kati kama rider
  hajajitolea kuchukua oda mwenyewe kwenye Rider Panel).
- `restaurants.html` — orodha ya migahawa yote na hali zao (Wazi/Imefungwa).
- `riders.html` — orodha ya riders wote na hali zao (Mtandaoni/Nje).
- `settings.html` — **Mipangilio ya Lipa Namba** yanayotumika moja kwa moja
  kwenye `customer/checkout.html` (badilisha namba/jina hapa, wateja wote
  wataona mabadiliko papo hapo — hakuna tena kuandika namba kwa mkono
  kwenye faili la checkout).

## Kinachofuata (Hiari) — Super Admin / Layer 2-3

- Idhinisho la akaunti mpya za migahawa na riders (approval workflow)
- Ripoti za kina (mauzo kwa muda, migahawa bora, riders bora)
- Mipangilio ya jumla ya mfumo (masharti ya huduma, tozo za jukwaa, n.k.)
- Backend/Cloud Functions kwa uthibitisho wa malipo (Lipa Namba webhook)
