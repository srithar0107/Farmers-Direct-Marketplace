const express = require("express");
const MarketPrice = require("../models/MarketPrice");
const { seedMarketPrices } = require("../seeds/seedMarketPrices");

const router = express.Router();

// GET all market prices with filtering
router.get("/", async (req, res) => {
  try {
    const { commodity, district, market, category } = req.query;
    const filter = {};

    if (commodity && commodity !== "All") {
      filter.commodity = { $regex: commodity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }
    if (district && district !== "All") {
      filter.district = { $regex: district.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }
    if (market && market !== "All") {
      filter.market = { $regex: market.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }
    if (category && category !== "All") {
      filter.category = category;
    }

    const prices = await MarketPrice.find(filter).sort("-priceDate");

    res.json({
      count: prices.length,
      source: "AGMARKNET / e-NAM Government of India / TN Agricultural Marketing Board",
      lastUpdated: prices[0]?.retrievedAt || new Date(),
      data: prices
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load market prices", error: err.message });
  }
});

// GET reference price for a specific crop/commodity
router.get("/reference", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Commodity query required" });

    // Look for matching market price records
    const records = await MarketPrice.find({
      commodity: { $regex: query.trim().split(" ")[0], $options: "i" }
    }).sort("-priceDate").limit(5);

    if (records.length === 0) {
      return res.json({ found: false, message: "No official mandi price record found for this item." });
    }

    // Compute average modal price
    const avgModal = Math.round(
      records.reduce((acc, r) => acc + r.modalPrice, 0) / records.length
    );

    res.json({
      found: true,
      commodity: records[0].commodity,
      averageModalPrice: avgModal,
      records
    });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch reference price", error: err.message });
  }
});

// GET unique districts and commodities for filter dropdowns
router.get("/meta", async (req, res) => {
  try {
    const [districts, commodities, markets] = await Promise.all([
      MarketPrice.distinct("district"),
      MarketPrice.distinct("commodity"),
      MarketPrice.distinct("market")
    ]);
    res.json({
      districts: districts.sort(),
      commodities: commodities.sort(),
      markets: markets.sort()
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch market metadata", error: err.message });
  }
});

// REFRESH / SYNC MARKET PRICES
router.post("/refresh", async (req, res) => {
  try {
    await seedMarketPrices();
    const count = await MarketPrice.countDocuments();
    res.json({
      message: "Market prices updated and verified successfully",
      totalRecords: count,
      refreshedAt: new Date()
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to refresh market prices", error: err.message });
  }
});

module.exports = router;
