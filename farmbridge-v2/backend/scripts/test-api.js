// scripts/test-api.js
// Run: node scripts/test-api.js  (requires server running on localhost:5000)

const BASE = process.env.API_URL || "http://localhost:5000";
let passed = 0, failed = 0;

async function get(path) {
  const r = await fetch(`${BASE}${path}`);
  return { status: r.status, body: await r.json() };
}
async function req(path, method, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
}
function assert(label, cond, note="") {
  if (cond) { console.log(`  ✅  ${label}`); passed++; }
  else       { console.error(`  ❌  ${label}${note ? " — "+note : ""}`); failed++; }
}

async function testHealth() {
  console.log("\n── Health & Stats ──────────────────────────────────");
  const h = await get("/health");
  assert("GET /health → 200",         h.status === 200);
  assert("DB connected",              h.body.db === "connected");
  const s = await get("/api/stats");
  assert("GET /api/stats → 200",      s.status === 200);
  assert("stats.totalProducts exists",typeof s.body.data?.totalProducts === "number");
}

async function testGetProducts() {
  console.log("\n── GET /api/products ───────────────────────────────");
  const { status, body } = await get("/api/products");
  assert("→ 200",                  status === 200);
  assert("success: true",          body.success === true);
  assert("data is array",          Array.isArray(body.data));
  assert("meta.total is number",   typeof body.meta?.total === "number");
  assert("meta.page defaults to 1",body.meta?.page === 1);
  if (body.data[0]) {
    const p = body.data[0];
    assert("product has id",          !!p.id);
    assert("product has imageUrl",    !!p.imageUrl);
    assert("farmer.id present",       !!p.farmer?.id, "farmer.id needed for profile links");
    assert("farmer.user.phone",       !!p.farmer?.user?.phone);
  }
  return body.data[0]?.id;
}

async function testFilters() {
  console.log("\n── GET /api/products (filters) ─────────────────────");
  const { body } = await get("/api/products?category=GRAINS");
  assert("GRAINS filter → all GRAINS", body.data.every(p => p.category === "GRAINS"));
  const pg = await get("/api/products?page=1&limit=3");
  assert("limit=3 respected",          pg.body.data.length <= 3);
  const sr = await get("/api/products?search=maize");
  assert("search returns 200",         sr.status === 200);
}

async function testGetSingle(id) {
  console.log("\n── GET /api/products/:id ───────────────────────────");
  if (!id) { console.log("  ⏭   Skipped"); return null; }
  const { status, body } = await get(`/api/products/${id}`);
  assert("→ 200",            status === 200);
  assert("correct id",       body.data?.id === id);
  assert("has description",  !!body.data?.description);
  assert("farmer.id present",!!body.data?.farmer?.id);
  const nf = await get("/api/products/nonexistent-xyz");
  assert("bad id → 404",     nf.status === 404);
  return body.data?.farmer?.id;
}

async function testGetFarmer(farmerId) {
  console.log("\n── GET /api/farmers/:id ────────────────────────────");
  if (!farmerId) { console.log("  ⏭   Skipped"); return; }
  const { status, body } = await get(`/api/farmers/${farmerId}`);
  assert("→ 200",                   status === 200);
  assert("has farmName",            !!body.data?.farmName);
  assert("has products array",      Array.isArray(body.data?.products));
  assert("has totalProducts",       typeof body.data?.totalProducts === "number");
  const nf = await get("/api/farmers/bad-id-xyz");
  assert("bad id → 404",            nf.status === 404);
}

async function testPatch() {
  console.log("\n── PATCH /api/products/:id ─────────────────────────");
  const { body } = await get("/api/products?limit=1");
  if (!body.data[0]) { console.log("  ⏭   Skipped"); return; }
  const id = body.data[0].id;
  const bad = await req(`/api/products/${id}`, "PATCH", { phone: "08099999999" });
  assert("Wrong phone → 403 or 422", [403, 422].includes(bad.status));
  const noPhone = await req(`/api/products/${id}`, "PATCH", {});
  assert("No phone → 422",           noPhone.status === 422);
}

async function testDelete() {
  console.log("\n── DELETE /api/products/:id ────────────────────────");
  const { body } = await get("/api/products?limit=1");
  if (!body.data[0]) { console.log("  ⏭   Skipped"); return; }
  const id = body.data[0].id;
  const bad = await req(`/api/products/${id}`, "DELETE", { phone: "08099999999" });
  assert("Wrong phone → 403",   bad.status === 403);
  const noPhone = await req(`/api/products/${id}`, "DELETE", {});
  assert("No phone → 400",      noPhone.status === 400);
}

async function test404() {
  console.log("\n── 404 handler ─────────────────────────────────────");
  const { status } = await get("/api/does-not-exist");
  assert("Unknown route → 404", status === 404);
}

(async () => {
  console.log(`\n🧪  FarmBridge API Tests → ${BASE}`);
  console.log("─".repeat(52));
  try {
    await testHealth();
    const pid = await testGetProducts();
    await testFilters();
    const fid = await testGetSingle(pid);
    await testGetFarmer(fid);
    await testPatch();
    await testDelete();
    await test404();
  } catch (e) {
    console.error("\n💥  Runner crashed:", e.message);
    console.error("    Is the server running?  npm run dev");
  }
  console.log("\n" + "─".repeat(52));
  console.log(`\n🏁  ${passed} passed · ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
