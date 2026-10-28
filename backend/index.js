const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Load .env from backend folder or workspace root
const envPath = fs.existsSync(path.resolve(__dirname, ".env"))
  ? path.resolve(__dirname, ".env")
  : path.resolve(__dirname, "..", ".env");

require("dotenv").config({ path: envPath });

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Route handlers
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/market-prices", require("./routes/marketPriceRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/delivery", require("./routes/deliveryRoutes"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: "ok",
    message: "Farmers' Direct Marketplace API is running",
    database: isDbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Farmers' Direct Marketplace API is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

// Database connection logic
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established successfully.");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB connection disconnected.");
});

async function startServer() {
  if (!MONGO_URI) {
    console.error("=================================================");
    console.error("❌ MongoDB Connection Error:");
    console.error("Neither MONGODB_URI nor MONGO_URI is defined in your .env file.");
    console.error("Please add MONGODB_URI=your_connection_string to backend/.env");
    console.error("=================================================");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    // Run idempotent seeds (checks if already seeded before inserting)
    const { seed50Products } = require("./seeds/seed50Products");
    const { seedMarketPrices } = require("./seeds/seedMarketPrices");
    await seed50Products().catch((err) => console.error("50 products seed error:", err.message));
    await seedMarketPrices().catch((err) => console.error("Market prices seed error:", err.message));

    app.listen(PORT, () => {
      console.log(`Farmers Direct server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();