// routes/farmers.js
// Public farmer profile — shows all listings from a single farmer.
// Useful for "View all from this farmer" links.

const express = require("express");
const prisma   = require("../lib/prisma");
const { readLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// ── GET /api/farmers/:id ──────────────────────────────────────────────────────
// Returns farmer info + all their active products.
// Response: { success, data: { farmer, products, meta } }
router.get("/:id", readLimiter, async (req, res, next) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where:  { id: req.params.id },
      include: {
        user:     { select: { fullName: true, phone: true, preferredLanguage: true, createdAt: true } },
        products: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, name: true, category: true,
            price: true, unit: true, imageUrl: true, createdAt: true,
          },
        },
      },
    });

    if (!farmer) {
      return res.status(404).json({ success: false, error: "Farmer not found" });
    }

    res.json({
      success: true,
      data: {
        id:              farmer.id,
        farmName:        farmer.farmName,
        state:           farmer.state,
        farmerName:      farmer.user.fullName,
        phone:           farmer.user.phone,
        memberSince:     farmer.user.createdAt,
        preferredLanguage: farmer.user.preferredLanguage,
        products:        farmer.products,
        totalProducts:   farmer.products.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
