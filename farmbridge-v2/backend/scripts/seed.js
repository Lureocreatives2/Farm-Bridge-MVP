// scripts/seed.js
// Populates the database with realistic sample data for development.
// Run: node scripts/seed.js
//
// This script is SAFE to run multiple times — it clears old seed data first.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Sample data — real Nigerian crops, farms, states ────────────────────────
const FARMERS = [
  { name: "Emeka Okafor",    phone: "08012345601", farm: "Okafor Farms",          state: "Benue",      lang: "IG" },
  { name: "Aminu Danladi",   phone: "08023456702", farm: "Danladi Agro",           state: "Kano",       lang: "HA" },
  { name: "Adunola Bakare",  phone: "08034567803", farm: "Bakare Green Fields",    state: "Oyo",        lang: "YO" },
  { name: "Chinyere Eze",    phone: "08045678904", farm: "Eze Harvest Co.",        state: "Anambra",    lang: "IG" },
  { name: "Musa Garba",      phone: "08056789005", farm: "Garba Integrated Farms", state: "Kaduna",     lang: "HA" },
  { name: "Tobi Adeleke",    phone: "08067890106", farm: "Adeleke Organics",       state: "Lagos",      lang: "YO" },
  { name: "Ngozi Nwosu",     phone: "08078901207", farm: "Nwosu Family Farm",      state: "Imo",        lang: "IG" },
  { name: "Babatunde Lawal", phone: "08089012308", farm: "Lawal Poultry & Crops",  state: "Osun",       lang: "YO" },
  { name: "Fatima Abdullahi",phone: "08090123409", farm: "Abdullahi Dairy",        state: "Sokoto",     lang: "HA" },
  { name: "Chukwudi Nkem",   phone: "08001234510", farm: "Nkem Agrofoods",         state: "Enugu",      lang: "IG" },
];

const PRODUCTS = [
  { farmer: 0, name: "White Maize (Corn)",        category: "GRAINS",     price: 18000, unit: "bag",    desc: "Freshly harvested white maize from our 40-acre farm in Benue. Dried to 14% moisture content. Suitable for flour milling and animal feed. Available in 50kg bags. Can deliver within Benue and neighbouring states." },
  { farmer: 1, name: "Kano Groundnuts",            category: "LEGUMES",    price: 25000, unit: "bag",    desc: "Premium grade Kano groundnuts, hand-sorted and sun-dried. Excellent for oil extraction or direct consumption. No aflatoxin issues — properly stored in our modern facility. Minimum order 5 bags." },
  { farmer: 2, name: "Fresh Ugu (Fluted Pumpkin)", category: "VEGETABLES", price: 2500,  unit: "basket", desc: "Tender ugu leaves harvested early morning for maximum freshness. Grown without chemicals. Delivered to Ibadan and Oyo town markets every Monday and Thursday morning. Call to pre-order." },
  { farmer: 3, name: "Ogiri Okpei (Locust Bean)", category: "OTHER",      price: 1200,  unit: "piece",  desc: "Traditionally fermented ogiri from Anambra. Rich umami flavour perfect for soups and stews. Wrapped in uma leaves. Made fresh weekly. No preservatives. Widely used in Ofe Onugbu and Egusi soups." },
  { farmer: 4, name: "Sorghum (Guinea Corn)",      category: "GRAINS",     price: 14000, unit: "bag",    desc: "Red sorghum from Kaduna. High quality grain with low moisture. Used for tuwo shinkafa, kunu aya, and animal feed. Our yield this season was excellent — 200 bags available immediately." },
  { farmer: 5, name: "Organically Grown Tomatoes", category: "VEGETABLES", price: 18000, unit: "crate",  desc: "No-pesticide tomatoes from our hydroponic greenhouse in Lagos. Consistent size and sweetness. Roma and plum varieties available. Crate holds approximately 30kg. Local delivery within Lagos Island and Mainland." },
  { farmer: 6, name: "Fresh Ukwa (Breadfruit)",    category: "FRUITS",     price: 3500,  unit: "basket", desc: "Seasonal ukwa freshly harvested from Imo. Sweet and nutty flavour. Ready for cooking as ofe ukwa or roasted snack. Very limited quantity — only 20 baskets available this season. Order early." },
  { farmer: 7, name: "Free-Range Eggs",            category: "DAIRY",      price: 4500,  unit: "crate",  desc: "30-egg crate from our free-range poultry farm in Osun. Birds fed organic maize and soybean. Eggs are large-grade, very rich yolk. Collected fresh daily. Available for weekly subscription deliveries to Oshogbo." },
  { farmer: 8, name: "Fresh Cow Milk",             category: "DAIRY",      price: 800,   unit: "litre",  desc: "Raw, unprocessed cow milk from our Sokoto Gudali herd. Collected twice daily. High fat content (approx 4.5%). Suitable for making kindirmo, fura, and wara. Must be boiled before drinking. 10-litre minimum order." },
  { farmer: 9, name: "Abakaliki Rice",             category: "GRAINS",     price: 32000, unit: "bag",    desc: "Authentic Abakaliki long-grain parboiled rice from Enugu. This season's harvest — clean, stone-free, properly milled. Popular in Igbo households. We supply to restaurants and bulk buyers in the east. 50kg per bag." },
  { farmer: 0, name: "Cassava Tubers",             category: "TUBERS",     price: 12000, unit: "bag",    desc: "TMS 30572 improved cassava variety. High starch content, suitable for garri, fufu, and industrial starch. Freshly harvested — best used within 3 days. Farm gate pickup or delivery within 50km of Makurdi." },
  { farmer: 1, name: "Cowpea (Ewa Oloyin)",        category: "LEGUMES",    price: 22000, unit: "bag",    desc: "Honey beans (ewa oloyin) variety — smooth skin, sweet flavour, cooks fast. Great for moi moi, akara, and ewa agonyin sauce. Sorted and bagged in 50kg sacks. Kano farm-direct price, much cheaper than market." },
  { farmer: 3, name: "Garden Egg (African Eggplant)", category: "VEGETABLES", price: 3000, unit: "basket", desc: "Fresh green garden eggs from Anambra. Bitter variety used in garden egg sauce, ofe akwu, and raw as snack. Harvested twice weekly for maximum freshness. Basket contains approximately 80–100 pieces." },
  { farmer: 4, name: "Ginger (Fresh)",             category: "OTHER",      price: 15000, unit: "bag",    desc: "Kaduna fresh ginger — high volatile oil content, intense aroma. Used in cooking, herbal tea, ginger beer, and spice blends. Our ginger is export-quality, grown without synthetic fertiliser. 25kg bags available." },
  { farmer: 5, name: "Sweet Potatoes",             category: "TUBERS",     price: 8000,  unit: "bag",    desc: "Orange-flesh sweet potatoes from our Lagos farm. High beta-carotene content. Can be boiled, fried, roasted, or used in porridge. 50kg bags. We deliver to markets in Alimosho, Mushin, and Ikeja twice a week." },
];

// Placeholder images (public domain Unsplash farm photos)
const IMAGE_URLS = [
  "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800",
  "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=800",
  "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800",
  "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800",
  "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800",
  "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=800",
  "https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=800",
  "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800",
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱  FarmBridge Seed Script\n");

  // Clear old seed data (by phone number pattern)
  const seedPhones = FARMERS.map(f => f.phone);
  const deleted = await prisma.user.deleteMany({ where: { phone: { in: seedPhones } } });
  console.log(`🗑   Cleared ${deleted.count} old seed users\n`);

  const createdFarmers = [];

  for (const [i, fd] of FARMERS.entries()) {
    const user = await prisma.user.create({
      data: {
        fullName:          fd.name,
        phone:             fd.phone,
        role:              "FARMER",
        preferredLanguage: fd.lang,
      },
    });

    const farmer = await prisma.farmer.create({
      data: { userId: user.id, farmName: fd.farm, state: fd.state },
    });

    createdFarmers.push(farmer);
    console.log(`👨‍🌾  Created farmer: ${fd.name} (${fd.state})`);
  }

  console.log("");

  for (const [i, pd] of PRODUCTS.entries()) {
    const farmer = createdFarmers[pd.farmer];
    await prisma.product.create({
      data: {
        farmerId:    farmer.id,
        name:        pd.name,
        category:    pd.category,
        price:       pd.price,
        unit:        pd.unit,
        description: pd.desc,
        imageUrl:    IMAGE_URLS[i % IMAGE_URLS.length],
      },
    });
    console.log(`🌾  Created product: ${pd.name} @ ₦${pd.price.toLocaleString()}/${pd.unit}`);
  }

  const total = await prisma.product.count();
  console.log(`\n✅  Seed complete — ${total} products in database\n`);
}

main()
  .catch(e => { console.error("\n❌  Seed failed:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
