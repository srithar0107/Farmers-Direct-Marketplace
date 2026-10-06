const express = require("express");
const Product = require("../models/Product");
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
  "availability",
  "image",
  "harvestDate",
  "organic"
];

const pick = (body) =>
  Object.fromEntries(
    FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]])
  );

// Image can be: empty, an http(s) link, or a small uploaded photo (base64)
const IMAGE_OK = /^(https?:\/\/|data:image\/(jpeg|png|webp);base64,)/i;
const badImage = (body) =>
  body.image && (!IMAGE_OK.test(body.image) || body.image.length > 600000);
const IMAGE_MSG = "Please choose a valid photo (JPG, PNG or WebP, small size)";

// Public: list with search/filter
router.get("/", async (req, res) => {
  const { q, category } = req.query;
  const filter = {};
  if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (category) filter.category = category;
  const products = await Product.find(filter)
    .populate("farmer", "name phone location")
    .sort("-createdAt");
  res.json(products);
});

// Farmer: own products (must be before /:id)
router.get("/mine", protect, allow("farmer"), async (req, res) => {
  res.json(await Product.find({ farmer: req.user.id }).sort("-createdAt"));
});

router.get("/:id", async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).populate(
      "farmer",
      "name phone location"
    );
    if (!p) return res.status(404).json({ message: "Product not found" });
    res.json(p);
  } catch {
    res.status(400).json({ message: "Invalid product id" });
  }
});

router.post("/", protect, allow("farmer"), async (req, res) => {
  try {
    if (badImage(req.body)) return res.status(400).json({ message: IMAGE_MSG });
    const p = await Product.create({ ...pick(req.body), farmer: req.user.id });
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

async function ownerOrAdmin(req, res) {
  const p = await Product.findById(req.params.id);
  if (!p) {
    res.status(404).json({ message: "Product not found" });
    return null;
  }
  if (req.user.role !== "admin" && String(p.farmer) !== req.user.id) {
    res.status(403).json({ message: "You can only change your own products" });
    return null;
  }
  return p;
}

router.put("/:id", protect, allow("farmer", "admin"), async (req, res) => {
  try {
    if (badImage(req.body)) return res.status(400).json({ message: IMAGE_MSG });
    const p = await ownerOrAdmin(req, res);
    if (!p) return;
    Object.assign(p, pick(req.body));
    await p.save();
    res.json(p);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete("/:id", protect, allow("farmer", "admin"), async (req, res) => {
  try {
    const p = await ownerOrAdmin(req, res);
    if (!p) return;
    await p.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;