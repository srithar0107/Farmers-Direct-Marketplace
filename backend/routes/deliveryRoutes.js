const express = require("express");
const {
  calculateDeliveryCharge,
  calculateFullPriceBreakdown,
  PRICING_CONFIG
} = require("../services/distanceService");
const User = require("../models/User");
const Product = require("../models/Product");

const router = express.Router();

// CALCULATE Delivery Fee & Transparent Delivered Price Breakdown
router.post("/calculate", async (req, res) => {
  try {
    let { farmerLocation, farmerId, buyerLocation, unitPrice, quantity, productId } = req.body;

    if (!farmerLocation && productId) {
      const prod = await Product.findById(productId).populate("farmer", "location district");
      if (prod) {
        farmerLocation = prod.location || prod.district || prod.farmer?.location || prod.farmer?.district;
        if (unitPrice === undefined) unitPrice = prod.price;
      }
    } else if (!farmerLocation && farmerId) {
      const farmer = await User.findById(farmerId);
      if (farmer) farmerLocation = farmer.location || farmer.district;
    }

    if (!buyerLocation) {
      buyerLocation = "Tamil Nadu";
    }

    if (unitPrice !== undefined) {
      const breakdown = calculateFullPriceBreakdown({
        unitPrice: Number(unitPrice) || 0,
        quantity: Math.max(1, Number(quantity) || 1),
        farmerLocation,
        buyerLocation
      });
      return res.json(breakdown);
    }

    const result = calculateDeliveryCharge(farmerLocation, buyerLocation);
    res.json({
      ...result,
      handlingCharge: PRICING_CONFIG.HANDLING_FEE,
      platformFee: PRICING_CONFIG.PLATFORM_FEE,
      taxRate: PRICING_CONFIG.TAX_RATE,
      taxLabel: PRICING_CONFIG.TAX_LABEL,
      rules: PRICING_CONFIG
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to calculate delivery fee", error: err.message });
  }
});

// GET Current Configured Pricing Rules
router.get("/rules", (req, res) => {
  res.json({
    pricingConfig: PRICING_CONFIG,
    formula: "Final delivered price = Item subtotal + Transport charge + Handling charge + Platform fee + Applicable tax - Discounts"
  });
});

// GET Tamil Nadu Districts for Delivery Selector
router.get("/districts", (req, res) => {
  const districts = [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
    "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
    "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
    "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
    "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
    "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
    "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
    "Vellore", "Villupuram", "Virudhunagar"
  ];
  res.json(districts);
});

module.exports = router;

