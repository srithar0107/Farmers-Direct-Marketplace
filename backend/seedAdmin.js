require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = "admin@farmers.com";
  if (await User.findOne({ email })) console.log("Admin already exists");
  else {
    await User.create({ name: "Admin", email, password: await bcrypt.hash("Admin@123", 10), role: "admin" });
    console.log("Admin created -> admin@farmers.com / Admin@123");
  }
  process.exit();
})();
