const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Load .env
const envPath = fs.existsSync(path.resolve(__dirname, ".env"))
  ? path.resolve(__dirname, ".env")
  : path.resolve(__dirname, "..", ".env");

require("dotenv").config({ path: envPath });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkConnection() {
  console.log("\n==============================================");
  console.log("   Farmers Direct Marketplace - DB Check");
  console.log("==============================================");

  if (!uri) {
    console.error("❌ FAILED: No connection URI found!");
    console.error("   Please ensure MONGODB_URI is set in backend/.env");
    console.log("==============================================\n");
    process.exit(1);
  }

  // Sanitize URI for safe display (hide password)
  const safeUri = uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
  console.log(`📡 Connecting to: ${safeUri}`);

  try {
    const startTime = Date.now();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const elapsed = Date.now() - startTime;

    console.log(`✅ SUCCESS: MongoDB connected in ${elapsed}ms!`);
    console.log(`   Database Name : ${mongoose.connection.name}`);
    console.log(`   Host          : ${mongoose.connection.host}`);
    console.log(`   Ready State   : Connected (${mongoose.connection.readyState})`);

    // Fetch collection stats
    const User = require("./models/User");
    const Product = require("./models/Product");
    const Order = require("./models/Order");
    const MarketPrice = require("./models/MarketPrice");
    const Notification = require("./models/Notification");

    const [userCount, productCount, sampleCount, orderCount, marketPriceCount, notifCount] =
      await Promise.all([
        User.countDocuments().catch(() => 0),
        Product.countDocuments().catch(() => 0),
        Product.countDocuments({ isSample: true }).catch(() => 0),
        Order.countDocuments().catch(() => 0),
        MarketPrice.countDocuments().catch(() => 0),
        Notification.countDocuments().catch(() => 0)
      ]);

    console.log(`   Collections   :`);
    console.log(`   - Users        : ${userCount}`);
    console.log(`   - Products     : ${productCount} (${sampleCount} sample Tamil Nadu crops)`);
    console.log(`   - Mandi Prices : ${marketPriceCount} (AGMARKNET records)`);
    console.log(`   - Orders       : ${orderCount}`);
    console.log(`   - Alerts/SMS   : ${notifCount}`);
    console.log("==============================================\n");
  } catch (error) {
    console.error("❌ FAILED: Could not connect to MongoDB!");
    console.error("   Error:", error.message);
    console.log("==============================================\n");
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkConnection();
