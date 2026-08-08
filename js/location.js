/* =====================================================
   0LOCATION.JS — Chombo cha BURE cha eneo (hakihitaji funguo
   ya API wala malipo):
   - Utafutaji wa mahali: Nominatim (OpenStreetMap) — bure.
     Heshimu matumizi ya haki: si zaidi ya ombi 1 kwa sekunde,
     na tuma "User-Agent"/sifa inapohitajika kwa matumizi makubwa.
   - Uonyeshaji wa ramani: Google Maps Embed (iframe) — hii
     hufanya kazi BILA funguo ya API kwa muundo wa "output=embed".
   - Eneo la sasa: Geolocation API ya kivinjari (native, bure).
   ===================================================== */

function buildEmbedUrl(lat, lng, zoom){
  zoom = zoom || 16;
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

function locateMe(onSuccess, onError){
  if(!navigator.geolocation){
    if(onError) onError("Kifaa chako hakiwezeshi GPS");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => onSuccess(pos.coords.latitude, pos.coords.longitude),
    (err) => { console.error(err); if(onError) onError("Imeshindikana kupata eneo lako. Ruhusu GPS kwenye kivinjari."); },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// Utafutaji wa mahali (bure, hauhitaji funguo) - Nominatim/OpenStreetMap
async function searchPlace(query){
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=tz&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "Accept-Language": "sw,en" } });
  if(!res.ok) throw new Error("Utafutaji umeshindikana");
  return res.json(); // [{ display_name, lat, lon }, ...]
}

// Geocoding ya kinyume: kutoka lat/lng kwenda anwani ya maandishi (bure)
async function reverseGeocodePlace(lat, lng){
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { "Accept-Language": "sw,en" } });
  if(!res.ok) throw new Error("Imeshindikana kutafsiri eneo");
  const data = await res.json();
  return data.display_name || "";
}
