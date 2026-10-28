
const path = require("path");
const fs = require("fs");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Support backend node_modules fallback
module.paths.push(path.join(__dirname, "backend", "node_modules"));
const mongoose = require(path.join(__dirname, "backend", "node_modules", "mongoose"));

// Load .env from workspace root or backend/.env
const envPath = fs.existsSync(path.join(__dirname, ".env"))
  ? path.join(__dirname, ".env")
  : path.join(__dirname, "backend", ".env");
dotenv.config({ path: envPath });

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Mount backend API routes
app.use("/api/auth", require("./backend/routes/authRoutes"));
app.use("/api/products", require("./backend/routes/productRoutes"));
app.use("/api/users", require("./backend/routes/userRoutes"));
app.use("/api/cart", require("./backend/routes/cartRoutes"));
app.use("/api/orders", require("./backend/routes/orderRoutes"));
app.use("/api/invoices", require("./backend/routes/invoiceRoutes"));
app.use("/api/market-prices", require("./backend/routes/marketPriceRoutes"));
app.use("/api/notifications", require("./backend/routes/notificationRoutes"));
app.use("/api/delivery", require("./backend/routes/deliveryRoutes"));

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

// Serve frontend dist if built, otherwise provide helpful status
const distPath = path.join(__dirname, "frontend", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      message: "Farmers' Direct Marketplace backend is running",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      frontend: "Run 'npm run frontend' (or 'cd frontend && npm run dev') to start the React interface."
    });
  });
}

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

async function startServer() {
  if (!MONGO_URI) {
    console.error("Please configure MONGODB_URI in your .env file.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully.");

    // Run idempotent seeds
    const { seed50Products } = require("./backend/seeds/seed50Products");
    const { seedMarketPrices } = require("./backend/seeds/seedMarketPrices");
    await seed50Products().catch((err) => console.error("50 products seed error:", err.message));
    await seedMarketPrices().catch((err) => console.error("Market prices seed error:", err.message));

    app.listen(PORT, () => {
      console.log(`Farmers' Direct Marketplace running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Connection failed:", error.message);
    process.exit(1);
  }
}

startServer();

