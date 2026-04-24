// routes/health.js
// GET /health — used by Render/Railway to verify the service is alive
// GET /api/stats — quick summary numbers for the homepage

const express = require("express");
const prisma   = require("../lib/prisma");

const router = express.Router();

// ── GET /health ───────────────────────────────────────────────────────────────
// Returns 200 when the server AND database are reachable.
// Render uses this for zero-downtime deploys.
router.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`; // ping the DB
    res.json({
      status:    "ok",
      service:   "farmbridge-api",
      version:   "2.0.0",
      timestamp: new Date().toISOString(),
      db:        "connected",
    });
  } catch (err) {
    res.status(503).json({ status: "error", db: "unreachable", error: err.message });
  }
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
// Used by the frontend hero section to show live counts.
// Results are aggregated in a single DB round-trip.
router.get("/api/stats", async (req, res, next) => {
  try {
    const [products, farmers, states] = await Promise.all([
      prisma.product.count(),
      prisma.farmer.count(),
      // Distinct states that have at least one product
      prisma.farmer.findMany({
        where:    { products: { some: {} } },
        select:   { state: true },
        distinct: ["state"],
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalProducts: products,
        totalFarmers:  farmers,
        activeStates:  states.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
