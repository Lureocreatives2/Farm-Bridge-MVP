/**
 * FarmBridge — API Client & Shared Utilities
 * Root-level file for Netlify hosting
 */

const API_BASE = "https://YOUR-APP.onrender.com/api";
// DEV: const API_BASE = "http://localhost:5000/api";

async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
    return data;
  } catch (err) {
    console.error(`[API] ${endpoint}:`, err.message);
    throw err;
  }
}

const ProductsAPI = {
  getAll: ({ category = "", state = "", search = "", page = 1 } = {}) => {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (state) p.set("state", state);
    if (search) p.set("search", search);
    p.set("page", page); p.set("limit", 12);
    return apiFetch(`/products?${p}`);
  },
  getById: (id) => apiFetch(`/products/${id}`),
  create: async (formData) => {
    const res = await fetch(`${API_BASE}/products`, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed");
    return data;
  },
};

const FarmersAPI = {
  register: (body) => apiFetch("/farmers/register", { method: "POST", body: JSON.stringify(body) }),
  getById: (id) => apiFetch(`/farmers/${id}`),
  lookupByPhone: (phone) => apiFetch(`/farmers/lookup/${phone}`),
};

function toggleNav() {
  document.getElementById("navLinks")?.classList.toggle("open");
}

const Utils = {
  formatNaira: (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n),
  buildWhatsApp: (phone, productName, farmerName) => {
    const msg = encodeURIComponent(`Hello ${farmerName}! I found your listing on FarmBridge and I'm interested in *${productName}*. Is it still available?`);
    return `https://wa.me/${phone.replace(/^0/, "234")}?text=${msg}`;
  },
  titleCase: (s) => s.toLowerCase().split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
  timeAgo: (d) => {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(d).toLocaleDateString("en-NG");
  },
  getParam: (n) => new URLSearchParams(window.location.search).get(n),
  toast: (msg, type = "success") => {
    document.querySelectorAll(".fb-toast").forEach((t) => t.remove());
    const t = document.createElement("div");
    t.className = `fb-toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 3500);
  },
  catColor: { GRAINS:"#d97706",VEGETABLES:"#16a34a",FRUITS:"#ea580c",TUBERS:"#7c3aed",LEGUMES:"#2563eb",LIVESTOCK:"#db2777",DAIRY:"#0891b2",OTHER:"#64748b" },
  catEmoji: { GRAINS:"🌾",VEGETABLES:"🥦",FRUITS:"🍊",TUBERS:"🍠",LEGUMES:"🫘",LIVESTOCK:"🐄",DAIRY:"🥛",OTHER:"📦" },
  card: (p) => `
    <article class="card card--hover product-card" onclick="window.location='product.html?id=${p.id}'">
      <div class="product-card__img">${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy" />` : Utils.catEmoji[p.category]||"🌾"}</div>
      <div class="product-card__body">
        <span class="product-card__cat" style="background:${Utils.catColor[p.category]||"#888"}">${Utils.titleCase(p.category)}</span>
        <h3 class="product-card__name">${p.name}</h3>
        <p class="product-card__loc">📍 ${p.farmer?.state||"Nigeria"} · ${Utils.timeAgo(p.createdAt)}</p>
        <div class="product-card__foot">
          <div><div class="product-card__price">${Utils.formatNaira(p.price)}</div><div class="product-card__unit">per ${p.unit}</div></div>
          <span style="color:var(--g500)">→</span>
        </div>
      </div>
    </article>`,
  skels: (n=6) => Array(n).fill(`<div class="skel-card"><div class="skeleton skel-img"></div><div class="skel-body"><div class="skeleton skel-line w40"></div><div class="skeleton skel-line"></div><div class="skeleton skel-line w60"></div></div></div>`).join(""),
};
