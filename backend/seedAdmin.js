const path = require("path");
const fs = require("fs");

const envPath = fs.existsSync(path.resolve(__dirname, ".env"))
  ? path.resolve(__dirname, ".env")
  : path.resolve(__dirname, "..", ".env");

require("dotenv").config({ path: envPath });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("Please configure MONGODB_URI or MONGO_URI in backend/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    const email = "admin@farmers.com";
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("Admin account already exists:", email);
    } else {
      await User.create({
        name: "Admin",
        email,
        password: await bcrypt.hash("Admin@123", 10),
        role: "admin",
        phone: "9876543210",
        location: "Headquarters"
      });
      console.log("Admin created successfully -> admin@farmers.com / Admin@123");
    }
  } catch (err) {
    console.error("Failed to seed admin:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();

