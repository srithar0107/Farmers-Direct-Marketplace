const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    quantity: {
      type: Number,
      required: true,
      min: 0
    },

    unit: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    availability: {
      type: String,
      enum: ["Available", "Out of Stock"],
      default: "Available"
    },

    image: {
      type: String,
      trim: true,
      default: ""
    },

    harvestDate: {
      type: Date
    },

    organic: {
      type: Boolean,
      default: false
    },

    soldQuantity: {
      type: Number,
      default: 0,
      min: 0
    },

    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0
    },

    isSample: {
      type: Boolean,
      default: false
    },

    district: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);