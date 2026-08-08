/* =====================================================
   DATA.JS — Data ya mfano (demo/seed) kwa ajili ya onyesho.
   Katika uzalishaji (production), data hii itasomwa kutoka
   Firestore collections: restaurants, foods, foodCategories.
   ===================================================== */

const DEMO_CATEGORIES = ["Zote", "Kienyeji", "Kuku", "Nyama Choma", "Samaki", "Vitafunwa", "Vinywaji"];

const DEMO_RESTAURANTS = [
  {
    id: "r1", name: "Mama Ntilie Kitchen", category: "Kienyeji",
    cover: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800",
    logo: "MK", rating: 4.7, reviews: 238, prepTime: "20-30 dk",
    distanceKm: 1.2, deliveryFee: 1500, isOpen: true,
    foods: [
      { id: "f1", name: "Wali wa Nazi na Kuku", price: 6500, photo: "https://images.unsplash.com/photo-1631292784640-2b24be784d5d?q=80&w=600", desc: "Wali wa nazi laini, kuku wa kienyeji, mchuzi wa nyanya." },
      { id: "f2", name: "Ugali na Mchicha na Samaki", price: 7000, photo: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=600", desc: "Ugali mweupe, mchicha wa kienyeji, samaki wa kukaanga." },
      { id: "f3", name: "Pilau ya Nyama", price: 7500, photo: "https://images.unsplash.com/photo-1633945274309-2c481bc2a49f?q=80&w=600", desc: "Pilau yenye viungo asili na nyama laini." }
    ]
  },
  {
    id: "r2", name: "Nyama Choma Corner", category: "Nyama Choma",
    cover: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=800",
    logo: "NC", rating: 4.5, reviews: 412, prepTime: "25-35 dk",
    distanceKm: 2.4, deliveryFee: 2000, isOpen: true,
    foods: [
      { id: "f4", name: "Nyama Choma Kg 1", price: 22000, photo: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600", desc: "Nyama choma ya ng'ombe, kachumbari na ugali." },
      { id: "f5", name: "Mishkaki (Fimbo 5)", price: 8000, photo: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=600", desc: "Mishkaki mitano ya nyama iliyoungwa vizuri." }
    ]
  },
  {
    id: "r3", name: "Kuku Fresh TZ", category: "Kuku",
    cover: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800",
    logo: "KF", rating: 4.6, reviews: 305, prepTime: "15-25 dk",
    distanceKm: 0.8, deliveryFee: 1000, isOpen: true,
    foods: [
      { id: "f6", name: "Chips Kuku", price: 9000, photo: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=600", desc: "Chips crispy na kuku wa kukaanga, sosi maalum." },
      { id: "f7", name: "Kuku Broast (Vipande 4)", price: 12000, photo: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=600", desc: "Kuku broast wa viungo, crispy nje laini ndani." }
    ]
  },
  {
    id: "r4", name: "Bahari Samaki Grill", category: "Samaki",
    cover: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=800",
    logo: "BS", rating: 4.8, reviews: 176, prepTime: "20-30 dk",
    distanceKm: 3.1, deliveryFee: 2500, isOpen: false,
    foods: [
      { id: "f8", name: "Samaki wa Kupaka", price: 11000, photo: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=600", desc: "Samaki mzima wa kupaka na tui la nazi." }
    ]
  }
];

function findRestaurant(id){ return DEMO_RESTAURANTS.find(r => r.id === id); }
function findFood(restaurantId, foodId){
  const r = findRestaurant(restaurantId);
  return r ? r.foods.find(f => f.id === foodId) : null;
}
