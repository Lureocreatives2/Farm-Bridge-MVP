/**
 * FarmBridge — Admin API Routes
 * Mount at: /api/admin
 *
 * All routes are protected by the adminAuth middleware.
 * In production, replace the hardcoded credentials with
 * environment variables and use proper JWT or session auth.
 */

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────
// MIDDLEWARE — Simple credential check
// In production: use JWT tokens or express-session
// ─────────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"];
  const validToken = process.env.ADMIN_SECRET || "farmbridge-admin-2024";

  if (!token || token !== validToken) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Admin access required.",
    });
  }
  next();
}

// Apply auth to all admin routes
router.use(adminAuth);

// ─────────────────────────────────────────────────────────
// POST /api/admin/login
// Validate credentials and return a session token
// Called BEFORE auth middleware — note the direct handler
// ─────────────────────────────────────────────────────────
router.post("/login", (req, res) => {
  // Skip adminAuth for this one route — it's the auth endpoint
  const { username, password } = req.body;

  const validUser = process.env.ADMIN_USERNAME || "admin";
  const validPass = process.env.ADMIN_PASSWORD || "farmbridge2024";

  if (username === validUser && password === validPass) {
    return res.json({
      success: true,
      token: process.env.ADMIN_SECRET || "farmbridge-admin-2024",
      admin: { username: validUser, role: "Super Admin" },
    });
  }

  res.status(401).json({ success: false, message: "Invalid username or password" });
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/stats
// Dashboard summary numbers
// ─────────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [
      totalProducts,
      pendingProducts,
      approvedProducts,
      flaggedProducts,
      totalFarmers,
      verifiedFarmers,
      totalUsers,
      recentProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "PENDING" } }),
      prisma.product.count({ where: { status: "APPROVED" } }),
      prisma.product.count({ where: { status: "FLAGGED" } }),
      prisma.farmer.count(),
      prisma.farmer.count({ where: { verified: true } }),
      prisma.user.count(),
      prisma.product.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    // Products by category
    const byCategory = await prisma.product.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // Products by state (via farmer)
    const byState = await prisma.farmer.groupBy({
      by: ["state"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    });

    res.json({
      success: true,
      data: {
        products: { total: totalProducts, pending: pendingProducts, approved: approvedProducts, flagged: flaggedProducts, thisWeek: recentProducts },
        farmers: { total: totalFarmers, verified: verifiedFarmers, unverified: totalFarmers - verifiedFarmers },
        users: { total: totalUsers },
        byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.id })),
        byState: byState.map((s) => ({ state: s.state, count: s._count.id })),
      },
    });
  } catch (error) {
    console.error("GET /admin/stats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/products
// All products with filters: status, category, search
// ─────────────────────────────────────────────────────────
router.get("/products", async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
        include: {
          farmer: {
            include: { user: { select: { name: true, phone: true } } },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/admin/products/:id/status
// Approve, reject, or flag a product
// Body: { status: "APPROVED" | "REJECTED" | "FLAGGED" | "PENDING" }
// ─────────────────────────────────────────────────────────
router.patch("/products/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["APPROVED", "REJECTED", "FLAGGED", "PENDING"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        status,
        available: status === "APPROVED",
      },
      include: {
        farmer: { include: { user: { select: { name: true } } } },
      },
    });

    res.json({
      success: true,
      message: `Product "${product.name}" has been ${status.toLowerCase()}`,
      data: product,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(500).json({ success: false, message: "Failed to update product status" });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/admin/products/:id
// Permanently delete a product listing
// ─────────────────────────────────────────────────────────
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await prisma.product.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true, message: `Product "${product.name}" permanently deleted` });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/farmers
// All farmers with verification status
// ─────────────────────────────────────────────────────────
router.get("/farmers", async (req, res) => {
  try {
    const { verified, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (verified !== undefined) where.verified = verified === "true";
    if (search) {
      where.OR = [
        { farmName: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [farmers, total] = await Promise.all([
      prisma.farmer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
        include: {
          user: { select: { name: true, phone: true, createdAt: true } },
          _count: { select: { products: true } },
        },
      }),
      prisma.farmer.count({ where }),
    ]);

    res.json({
      success: true,
      data: farmers,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch farmers" });
  }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/admin/farmers/:id/verify
// Toggle a farmer's verified status
// Body: { verified: true | false }
// ─────────────────────────────────────────────────────────
router.patch("/farmers/:id/verify", async (req, res) => {
  try {
    const { verified } = req.body;

    const farmer = await prisma.farmer.update({
      where: { id: req.params.id },
      data: { verified: Boolean(verified) },
      include: { user: { select: { name: true } } },
    });

    res.json({
      success: true,
      message: `${farmer.farmName} has been ${verified ? "verified" : "unverified"}`,
      data: farmer,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Farmer not found" });
    }
    res.status(500).json({ success: false, message: "Failed to update farmer" });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/admin/farmers/:id
// Remove a farmer and all their products
// ─────────────────────────────────────────────────────────
router.delete("/farmers/:id", async (req, res) => {
  try {
    // Cascade: delete products first, then farmer, then user
    const farmer = await prisma.farmer.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!farmer) return res.status(404).json({ success: false, message: "Farmer not found" });

    await prisma.$transaction([
      prisma.product.deleteMany({ where: { farmerId: req.params.id } }),
      prisma.farmer.delete({ where: { id: req.params.id } }),
      prisma.user.delete({ where: { id: farmer.userId } }),
    ]);

    res.json({ success: true, message: `Farmer "${farmer.farmName}" and all their listings removed` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete farmer" });
  }
});

module.exports = { router, adminLoginHandler };

// Separate export for the login endpoint (no auth middleware needed)
function adminLoginHandler(req, res) {
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USERNAME || "admin";
  const validPass = process.env.ADMIN_PASSWORD || "farmbridge2024";

  if (username === validUser && password === validPass) {
    return res.json({
      success: true,
      token: process.env.ADMIN_SECRET || "farmbridge-admin-2024",
      admin: { username: validUser, role: "Super Admin" },
    });
  }
  res.status(401).json({ success: false, message: "Invalid username or password" });
}
