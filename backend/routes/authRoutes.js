const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || "");
const passOk = (p) => typeof p === "string" && p.length >= 6;
const PASS_MSG = "Password must be at least 6 characters";

const safe = (u) => ({
  id: u._id,
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone || "",
  location: u.location || "",
  district: u.district || "",
  address: u.address || "",
  farmerId: u.farmerId || null,
  preferredLanguage: u.preferredLanguage || "en"
});

// Generate a guaranteed unique farmer ID e.g. FMR-582914
async function generateUniqueFarmerId() {
  let isUnique = false;
  let candidate = "";
  while (!isUnique) {
    const num = Math.floor(100000 + Math.random() * 900000);
    candidate = `FMR-${num}`;
    const exists = await User.findOne({ farmerId: candidate });
    if (!exists) isUnique = true;
  }
  return candidate;
}

// REGISTER (Supports both Farmer and Customer/Buyer)
router.post("/register", async (req, res) => {
  try {
    let { name, email, password, role, phone, location, district, address, preferredLanguage } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
    if (!passOk(password)) return res.status(400).json({ message: PASS_MSG });

    phone = (phone || "").trim().replace(/\s+/g, "");
    const safeRole = role === "farmer" ? "farmer" : "customer";

    // For farmers, mobile phone is essential
    if (safeRole === "farmer" && (!phone || phone.length < 10)) {
      return res.status(400).json({ message: "A valid 10-digit mobile number is required for farmers" });
    }

    // Auto-generate placeholder email if farmer registers with phone only
    if (!email || !email.trim()) {
      if (phone) {
        email = `${phone}@farmers.direct`;
      } else {
        return res.status(400).json({ message: "Email or mobile number is required" });
      }
    } else if (!emailOk(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    email = email.toLowerCase().trim();

    // Check duplicate email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "This email is already registered. Please login instead." });
    }

    // Check duplicate phone for farmers
    if (phone) {
      const existingPhone = await User.findOne({ phone, role: safeRole });
      if (existingPhone) {
        return res.status(400).json({ message: "This mobile number is already registered. Please login instead." });
      }
    }

    let farmerId = null;
    if (safeRole === "farmer") {
      farmerId = await generateUniqueFarmerId();
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      name: name.trim(),
      email,
      password: hashedPassword,
      role: safeRole,
      phone,
      location: location || "",
      district: district || "",
      address: address || "",
      preferredLanguage: preferredLanguage === "ta" ? "ta" : "en"
    };

    if (safeRole === "farmer" && farmerId) {
      userData.farmerId = farmerId;
    }

    const user = await User.create(userData);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: safeRole === "farmer"
        ? `Farmer registered successfully! Your unique Farmer ID is ${farmerId}`
        : "Buyer registration successful!",
      token,
      user: safe(user)
    });
  } catch (e) {
    console.error("Register error:", e);
    res.status(500).json({ message: "Registration failed", error: e.message });
  }
});

// LOGIN (Supports login with Email, Mobile Number, or Farmer ID)
router.post("/login", async (req, res) => {
  try {
    const { email, password, identifier } = req.body;
    const loginQuery = (identifier || email || "").trim();

    if (!loginQuery) {
      return res.status(400).json({ message: "Please enter your Email, Mobile Number, or Farmer ID" });
    }
    if (!password) {
      return res.status(400).json({ message: "Please enter your password" });
    }

    // Search user by email, mobile number, or farmer ID
    const user = await User.findOne({
      $or: [
        { email: loginQuery.toLowerCase() },
        { phone: loginQuery },
        { farmerId: loginQuery.toUpperCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Account not found with provided Email, Mobile, or Farmer ID" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password. Please try again." });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      user: safe(user)
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Login failed", error: e.message });
  }
});

// GET CURRENT USER PROFILE
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(safe(user));
  } catch (e) {
    res.status(500).json({ message: "Could not fetch profile", error: e.message });
  }
});

// UPDATE PROFILE (Location, Address, Phone, District)
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone, location, district, address, preferredLanguage } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (location !== undefined) user.location = location.trim();
    if (district !== undefined) user.district = district.trim();
    if (address !== undefined) user.address = address.trim();
    if (preferredLanguage && (preferredLanguage === "ta" || preferredLanguage === "en")) {
      user.preferredLanguage = preferredLanguage;
    }

    await user.save();
    res.json({ message: "Profile updated successfully", user: safe(user) });
  } catch (e) {
    res.status(500).json({ message: "Profile update failed", error: e.message });
  }
});

// CHANGE PASSWORD
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
