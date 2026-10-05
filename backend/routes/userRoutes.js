const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Product = require("../models/Product");
const { protect, allow } = require("../middleware/auth");

const router = express.Router();
router.use(protect, allow("admin"));

router.get("/stats", async (req, res) => {
  const [users, farmers, customers, products] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: "farmer" }),
    User.countDocuments({ role: "customer" }), Product.countDocuments()
  ]);
  res.json({ users, farmers, customers, products });
});

router.get("/", async (req, res) => res.json(await User.find().select("-password").sort("-createdAt")));

router.post("/", async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;
    if (!name || !email || !password || password.length < 8)
      return res.status(400).json({ message: "Name, email and a password of 8+ characters are required" });
    const user = await User.create({
      name, email, password: await bcrypt.hash(password, 10),
      role: ["admin", "farmer", "customer"].includes(role) ? role : "customer", phone, location
    });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    res.status(400).json({ message: e.code === 11000 ? "Email already registered" : e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, email, role, phone, location, password } = req.body;
    const update = { name, email, role, phone, location };
    if (password) update.password = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ message: "You cannot delete yourself" });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await Product.deleteMany({ farmer: user._id });
  res.json({ message: "User and their products removed" });
});

module.exports = router;
