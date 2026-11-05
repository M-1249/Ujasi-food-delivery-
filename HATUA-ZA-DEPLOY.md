# Ujasi — Hatua za kuweka toleo salama (v19)

Lengo: wateja 100 wa chakula + 30 wa maji kwa siku, ndani ya Firebase Spark
(reads 50,000 / writes 20,000 kwa siku), pesa na ruhusa zikiwa salama.

## KABLA ya kubonyeza Publish (muhimu, la sivyo utajifungia nje)
0. Firebase Console → Authentication → Sign-in method → hakikisha **Anonymous** imewashwa
   (wateja wa guest hawawezi kuagiza bila hiyo) na **Email/Password** imewashwa.
1. Firebase Console → Firestore → Data → `users/{uid yako}` → hakikisha
   `role` = `super_admin` (andika kwa mkono). Admin Layer 1: `admin_layer1`.
2. Hakikisha migahawa na riders waliopo wana `approved: true`, na kitambulisho
   cha hati yao (`restaurants/{id}`, `riders/{id}`) = uid ya mmiliki.
3. Hakikisha `settings/payment` na `settings/water` zipo (ziunde kupitia
   paneli ya admin). Wateja hawawezi kuziunda tena.
4. Hifadhi rules za zamani (`firestore.rules.v2-old` ni nakala).

## Mpangilio wa deploy (fanya karibu pamoja)
1. Deploy site mpya kwenye Netlify (zip hii). Service worker = `ujasi-v19`.
2. Mara moja: Firestore → Rules → bandika `firestore.rules` → Publish.
   (Code mpya inahitaji rules mpya kwa `txns`; rules mpya zinahitaji code mpya.)

## Indexes 2 za kuunda (mara moja)
Fungua ukurasa husika ukiwa umeingia; Console ya kivinjari itaonyesha link ya
"create index" — bofya. Au unda kwa mkono (Firestore → Indexes → Composite):
- `orders`: restaurantId (Asc), status (Asc), createdAt (Asc)   [paneli ya mgahawa]
- `reviews`: restaurantId (Asc), createdAt (Desc)               [ukurasa wa mgahawa]

## Jaribio la lazima baada ya Publish
1. Mteja guest: weka oda ya chakula na Namba ya Muamala → inapita.
2. Rudia oda nyingine kwa Namba ILE ILE → lazima ikataliwe.
3. Admin: anaona oda, bonyeza "Thibitisha Malipo", andika kiasi kisicho sawa → inakataliwa; kiasi sahihi → inapita.
4. Mgahawa: haoni oda hadi malipo yathibitishwe; kisha Anza Kuandaa → Tayari.
5. Rider: anaona foleni ya "Tayari", anachukua, anakamilisha.
6. Jaribu kama mteja kuandika `users/{uid}` na `role: "super_admin"` → lazima ikataliwe.
7. Mgahawa mpya: sajili kupitia `restaurant-register.html` → hauonekani kwa wateja bado (sahihi) →
   Super Admin afungue `superadmin-approvals.html` na aidhinishe → unaonekana kwenye home →
   mmiliki aongeze menyu (kupitia ukurasa wa Menyu) → mteja anaona vyakula na kuagiza.
   MUHIMU: mgahawa HAUONEKANI kwa wateja hadi Super Admin auidhinishe. Hii ndiyo sababu ya kawaida ya "mgahawa haonekani".

## Mabadiliko ya tabia (unayopaswa kujua)
- Uthibitisho wa malipo ni wa Admin TU (si mgahawa). Mgahawa unaona oda baada ya malipo.
- `settings/payment` (Lipa Namba) inabadilishwa na Super Admin TU.
- Mteja anaweza kughairi oda tu kabla ya malipo kuthibitishwa.
- Ripoti ya Super Admin inasoma siku 7 (ili kulinda reads).
- Utafutaji wa chakula unatumia `foodNames`; mgahawa uliopo huijaza mmiliki
  anapofungua ukurasa wa menyu mara moja.
- Rating ya mgahawa haisasishwi tena na mteja (ilikuwa inashindwa kimya kimya).

## Bado haijafanyika (awamu ya 2)
- Rating: tumia `ratingSum` + `ratingCount` zinazothibitishwa na rules.
- `ownerPhone`/`ownerEmail` bado zinasomeka hadharani kwenye `restaurants` — zihamishe kwenye koleksheni ya siri.
- App Check (reCAPTCHA) kuzuia bots; fikiria Blaze + Cloud Functions ili bei za chakula zihakikiwe na server.
- `index.html`/`sitemap.xml` bado zinaelekeza Vercel.
- Angalia matumizi kila siku: Firebase → Usage. Ukiwa juu ya 70% mara kwa mara, pandisha kwenda Blaze na weka budget alert.
