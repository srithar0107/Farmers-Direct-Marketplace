const mongoose = require("mongoose");

const marketPriceSchema = new mongoose.Schema(
  {
    commodity: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: "Vegetables",
      trim: true
    },
    market: {
      type: String,
      required: true,
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    minPrice: {
      type: Number,
      required: true
    },
    maxPrice: {
      type: Number,
      required: true
    },
    modalPrice: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: "kg"
    },
    priceDate: {
      type: Date,
      required: true
    },
    source: {
      type: String,
      default: "AGMARKNET / e-NAM Government of India"
    },
    retrievedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index to avoid duplicate market prices for same market & commodity on same date
marketPriceSchema.index({ commodity: 1, market: 1, priceDate: 1 }, { unique: true });

module.exports = mongoose.model("MarketPrice", marketPriceSchema);
