const express = require("express");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { protect, allow } = require("../middleware/auth");

const router = express.Router();

const FIELDS = [
  "name",
  "category",
  "description",
  "price",
  "quantity",
  "unit",
  "location",
  "district",
  "availability",
  "image",
  "harvestDate",
  "organic",
  "lowStockThreshold"
];

const pick = (body) => {
  const result = {};
  for (const f of FIELDS) {
    if (body[f] !== undefined) {
      if (f === "harvestDate") {
        result[f] = body[f] ? new Date(body[f]) : null;
      } else if (f === "price" || f === "quantity" || f === "lowStockThreshold") {
        result[f] = Math.max(0, Number(body[f]) || 0);
      } else {
        result[f] = body[f];
      }
    }
  }
  return result;
};

const IMAGE_OK = /^(https?:\/\/|data:image\/(jpeg|png|webp);base64,)/i;
const badImage = (body) =>
  body.image && (!IMAGE_OK.test(body.image) || body.image.length > 800000);
const IMAGE_MSG = "Please choose a valid photo (JPG, PNG or WebP, max 800KB)";

// PUBLIC: List with full search, category, district, organic filters, and sorting
router.get("/", async (req, res) => {
  try {
    const { q, category, district, organic, sort, limit = 100, page = 1 } = req.query;
    const filter = {};

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { location: { $regex: escaped, $options: "i" } },
        { district: { $regex: escaped, $options: "i" } }
      ];
    }

    if (category && category !== "All") filter.category = category;
    if (district && district !== "All") filter.district = { $regex: district, $options: "i" };
    if (organic === "true") filter.organic = true;

    let sortOption = { createdAt: -1 };
    if (sort === "price-low") sortOption = { price: 1 };
    else if (sort === "price-high") sortOption = { price: -1 };
    else if (sort === "name") sortOption = { name: 1 };
    else if (sort === "stock") sortOption = { quantity: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .populate("farmer", "name phone location district farmerId")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter)
    ]);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
});

// FARMER STATS: Comprehensive summary for farmer dashboard
router.get("/farmer-stats", protect, allow("farmer"), async (req, res) => {
  try {
    const farmerId = req.user.id;
    const products = await Product.find({ farmer: farmerId });

    let totalProducts = products.length;
    let availableCount = 0;
    let lowStockCount = 0;
    let soldOutCount = 0;
    let totalStockUnits = 0;
    let totalSoldUnits = 0;

    for (const p of products) {
      totalStockUnits += p.quantity;
      totalSoldUnits += p.soldQuantity || 0;
      if (p.quantity === 0 || p.availability === "Out of Stock") {
        soldOutCount++;
      } else if (p.quantity <= (p.lowStockThreshold || 10)) {
        lowStockCount++;
        availableCount++;
      } else {
        availableCount++;
      }
    }

    // Calculate revenue from orders containing this farmer's products
    const orders = await Order.find({
      "items.farmer": farmerId,
      status: { $ne: "Cancelled" }
    });

    let totalRevenue = 0;
    let totalOrdersCount = orders.length;

    for (const ord of orders) {
      for (const item of ord.items) {
        if (String(item.farmer) === String(farmerId)) {
          totalRevenue += item.lineTotal || 0;
        }
      }
    }

    res.json({
      totalProducts,
      availableCount,
      lowStockCount,
      soldOutCount,
      totalStockUnits,
      totalSoldUnits,
      totalRevenue,
      totalOrdersCount
    });
  } catch (err) {
    res.status(500).json({ message: "Could not calculate farmer stats", error: err.message });
  }
});

// FARMER: Own products
router.get("/mine", protect, allow("farmer"), async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user.id }).sort("-createdAt");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch farmer products", error: err.message });
  }
});

// GET ONE PRODUCT
router.get("/:id", async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).populate(
      "farmer",
      "name phone location district farmerId address"
    );
    if (!p) return res.status(404).json({ message: "Product not found" });
    res.json(p);
  } catch {
    res.status(400).json({ message: "Invalid product id" });
  }
});

// CREATE PRODUCT (Farmer only)
router.post("/", protect, allow("farmer"), async (req, res) => {
  try {
    if (badImage(req.body)) return res.status(400).json({ message: IMAGE_MSG });
    const data = pick(req.body);
    const qty = Number(data.quantity) || 0;
    data.availability = qty > 0 ? "Available" : "Out of Stock";
    data.farmer = req.user.id;

    const p = await Product.create(data);
    const populated = await Product.findById(p._id).populate("farmer", "name phone location district farmerId");
    res.status(201).json(populated || p);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// HELPER: Check authorization for product updates
async function ownerOrAdmin(req, res) {
  const p = await Product.findById(req.params.id);
  if (!p) {
    res.status(404).json({ message: "Product not found" });
    return null;
  }
  if (req.user.role !== "admin" && String(p.farmer) !== req.user.id) {
    res.status(403).json({ message: "You can only modify your own products" });
    return null;
  }
  return p;
}

// UPDATE PRODUCT
router.put("/:id", protect, allow("farmer", "admin"), async (req, res) => {
  try {
    if (badImage(req.body)) return res.status(400).json({ message: IMAGE_MSG });
    const p = await ownerOrAdmin(req, res);
    if (!p) return;

    const data = pick(req.body);
    if (data.quantity !== undefined) {
      data.availability = data.quantity > 0 ? "Available" : "Out of Stock";
    }

    Object.assign(p, data);
    await p.save();

    const populated = await Product.findById(p._id).populate("farmer", "name phone location district farmerId");
    res.json(populated || p);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE PRODUCT
router.delete("/:id", protect, allow("farmer", "admin"), async (req, res) => {
  try {
    const p = await ownerOrAdmin(req, res);
    if (!p) return;
    await p.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;