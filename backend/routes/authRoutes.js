const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || "");
const passOk = (p) => typeof p === "string" && p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
const PASS_MSG = "Password must be at least 8 characters with a letter and a number";
const safe = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
    if (!emailOk(email)) return res.status(400).json({ message: "Enter a valid email" });
    if (!passOk(password)) return res.status(400).json({ message: PASS_MSG });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: "Email already registered" });
    // Public sign-up can NEVER create an admin
    const safeRole = role === "farmer" ? "farmer" : "customer";
    const user = await User.create({
      name, email, password: await bcrypt.hash(password, 10),
      role: safeRole, phone, location
    });
    res.status(201).json({ message: "Registration successful", user: safe(user) });
  } catch (e) {
    res.status(500).json({ message: "Registration failed", error: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.password)))
      return res.status(401).json({ message: "Invalid email or password" });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Login successful", token, user: safe(user) });
  } catch (e) {
    res.status(500).json({ message: "Login failed", error: e.message });
  }
});

router.put("/change-password", protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || !(await bcrypt.compare(oldPassword || "", user.password)))
      return res.status(400).json({ message: "Old password is incorrect" });
    if (!passOk(newPassword)) return res.status(400).json({ message: PASS_MSG });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (e) {
    res.status(500).json({ message: "Could not change password", error: e.message });
  }
});

module.exports = router;
