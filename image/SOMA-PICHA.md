# Picha za Hero Section — Tayari Zimewekwa

Picha 3 ulizonitumia (zilizotengenezwa kwa AI) tayari zimewekwa hapa
na kuunganishwa kwenye `index.html`. Hakuna hatua ya ziada
inayohitajika — zitaonekana moja kwa moja kwenye hero carousel.

| Faili | Slide | Maelezo |
|---|---|---|
| `hero-food.jpg` | Chakula Kitamu | Picha ya chakula mezani |
| `hero-delivery.jpg` | Uwasilishaji wa Haraka | Rider kwenye pikipiki, "ARRIVING NOW" |
| `hero-community.jpg` | Huduma Kamili UJASI | Mandhari ya jumla — migahawa, riders, wateja |

Faili zote zimepunguzwa ukubwa (compressed kwenda JPG, upana 900px)
ili zisitumie data nyingi ya mtumiaji — kila moja iko chini ya 130KB.

## Ukitaka kubadilisha picha yoyote baadaye
Badilisha faili yenye jina lile lile (mf. pakia `hero-food.jpg` mpya
juu ya ya zamani) — usibadilishe majina, kwa sababu `index.html`
inatafuta majina haya HASA. Ukitaka jina tofauti kabisa, utahitaji pia
kubadilisha `background: url('images/...')` husika ndani ya
`index.html`.

Kumbuka: baada ya kupandisha picha mpya, badilisha `CACHE_VERSION`
kwenye `service-worker.js` ili simu za watumiaji zichukue picha mpya
badala ya iliyohifadhiwa (cached) tayari.
