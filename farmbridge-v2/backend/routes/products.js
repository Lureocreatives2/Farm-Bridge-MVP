// routes/products.js
const express = require("express");
const { body, query, validationResult } = require("express-validator");
const prisma = require("../lib/prisma");
const { upload } = require("../lib/cloudinary");

const router = express.Router();

const VALID_CATEGORIES = ["GRAINS","VEGETABLES","FRUITS","TUBERS","LEGUMES","LIVESTOCK","DAIRY","OTHER"];
const VALID_LANGS = ["EN","YO","HA","IG","PC"];

const ok = (req, res) => {
  const e = validationResult(req);
  if (!e.isEmpty()) { res.status(422).json({ success: false, errors: e.array() }); return false; }
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products
// List a new product (multipart/form-data)
//
// Fields: farmerName, phone, farmName, state, preferredLanguage?,
//         name, category, price, unit, description, image (file)
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/",
  upload.single("image"),
  [
    body("farmerName").trim().notEmpty().withMessage("Farmer name required"),
    body("phone").trim().matches(/^(\+234|0)[789][01]\d{8}$/).withMessage("Invalid Nigerian phone number"),
    body("farmName").trim().notEmpty().withMessage("Farm name required"),
    body("state").trim().notEmpty().withMessage("State required"),
    body("name").trim().notEmpty().withMessage("Product name required"),
    body("category").isIn(VALID_CATEGORIES).withMessage("Invalid category"),
    body("price").isFloat({ min: 1 }).withMessage("Price must be at least ₦1"),
    body("unit").trim().notEmpty().withMessage("Unit required"),
    body("description").trim().isLength({ min: 10, max: 500 }).withMessage("Description: 10–500 chars"),
    body("preferredLanguage").optional().isIn(VALID_LANGS),
  ],
  async (req, res, next) => {
    try {
      if (!ok(req, res)) return;
      if (!req.file) return res.status(400).json({ success: false, error: "Product image required" });

      const {
        farmerName, phone, farmName, state,
        name, category, price, unit, description,
        preferredLanguage = "EN",
      } = req.body;

      // Upsert user (keyed on phone number)
      const user = await prisma.user.upsert({
        where: { phone },
        update: { fullName: farmerName, preferredLanguage },
        create: { fullName: farmerName, phone, role: "FARMER", preferredLanguage },
      });

      // Upsert farmer profile
      const farmer = await prisma.farmer.upsert({
        where: { userId: user.id },
        update: { farmName, state },
        create: { userId: user.id, farmName, state },
      });

      const product = await prisma.product.create({
        data: {
          farmerId:    farmer.id,
          name,
          category,
          price:       parseFloat(price),
          unit,
          description,
          imageUrl:    req.file.path,
        },
        include: {
          farmer: {
            include: { user: { select: { fullName: true, phone: true } } },
          },
        },
      });

      res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products
// Browse products with optional filtering + pagination
//
// Query: search, category, state, page (default 1), limit (default 12)
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  async (req, res, next) => {
    try {
      const { search, category, state, page = 1, limit = 12 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where = {
        ...(category && { category }),
        ...(state && { farmer: { state: { contains: state, mode: "insensitive" } } }),
        ...(search && {
          OR: [
            { name:        { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            farmer: {
              select: {
                id:       true,
                farmName: true,
                state:    true,
                user:     { select: { fullName: true, phone: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
        }),
        prisma.product.count({ where }),
      ]);

      res.json({
        success: true,
        data: products,
        meta: {
          total,
          page:  Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/:id
// Single product + 3 related products from same farmer
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        farmer: {
          include: {
            user:     { select: { fullName: true, phone: true } },
            products: {
              where:  { id: { not: req.params.id } },
              take:   3,
              select: { id: true, name: true, imageUrl: true, price: true, unit: true, farmer: { select: { farmName: true, state: true, user: { select: { fullName: true, phone: true } } } } },
            },
          },
        },
      },
    });

    if (!product)
      return res.status(404).json({ success: false, error: "Product not found" });

    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

module.exports = router;

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/products/:id
// Remove a product listing. Phone number used as lightweight ownership check.
//
// Body: { phone: "08012345678" }
// Response: { success: true, message: "Product deleted" }
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: "Phone number required to confirm ownership" });
    }

    // Find the product and verify the farmer's phone matches
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        farmer: {
          include: { user: { select: { phone: true } } }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const ownerPhone = product.farmer.user.phone;
    // Normalise both to digits for comparison
    const normalise = p => p.replace(/\D/g, "").replace(/^0/, "234");
    if (normalise(ownerPhone) !== normalise(phone)) {
      return res.status(403).json({ success: false, error: "Phone number does not match this listing" });
    }

    await prisma.product.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: "Product listing removed successfully" });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/products/:id
// Update a product listing. Phone required to verify ownership.
//
// Body (multipart/form-data or JSON):
//   phone (required), + any of: name, category, price, unit, description, image
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  "/:id",
  upload.single("image"),
  [
    body("phone").trim().matches(/^(\+234|0)[789][01]\d{8}$/).withMessage("Valid phone required"),
    body("price").optional().isFloat({ min: 1 }).withMessage("Price must be positive"),
    body("category").optional().isIn(VALID_CATEGORIES).withMessage("Invalid category"),
    body("description").optional().isLength({ min: 10, max: 500 }).withMessage("Description: 10–500 chars"),
  ],
  async (req, res, next) => {
    try {
      if (!ok(req, res)) return;
      const { phone, name, category, price, unit, description } = req.body;

      // Verify ownership
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: { farmer: { include: { user: { select: { phone: true } } } } }
      });
      if (!product) return res.status(404).json({ success: false, error: "Product not found" });

      const norm = p => p.replace(/\D/g, "").replace(/^0/, "234");
      if (norm(product.farmer.user.phone) !== norm(phone)) {
        return res.status(403).json({ success: false, error: "Phone does not match this listing" });
      }

      // Build update payload — only include fields that were sent
      const data = {
        ...(name        && { name }),
        ...(category    && { category }),
        ...(price       && { price: parseFloat(price) }),
        ...(unit        && { unit }),
        ...(description && { description }),
        ...(req.file    && { imageUrl: req.file.path }),
      };

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ success: false, error: "No fields to update" });
      }

      const updated = await prisma.product.update({
        where: { id: req.params.id },
        data,
        include: { farmer: { include: { user: { select: { fullName: true, phone: true } } } } },
      });

      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  }
);
