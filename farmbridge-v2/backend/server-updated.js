require("dotenv").config();
const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/products");
const farmerRoutes  = require("./routes/farmers");
const { router: adminRoutes, adminLoginHandler } = require("./routes/admin");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "FarmBridge API running", ts: new Date().toISOString() });
});

// ── Public routes ──────────────────────────────────────
app.use("/api/products", productRoutes);
app.use("/api/farmers",  farmerRoutes);

// ── Admin login (no auth middleware) ──────────────────
app.post("/api/admin/login", adminLoginHandler);

// ── Admin routes (protected by x-admin-token header) ─
app.use("/api/admin", adminRoutes);

// ── 404 ────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// ── Error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`\n🌾 FarmBridge API → http://localhost:${PORT}`);
  console.log(`🔐 Admin panel  → http://localhost:${PORT}/api/admin/*`);
});

module.exports = app;
