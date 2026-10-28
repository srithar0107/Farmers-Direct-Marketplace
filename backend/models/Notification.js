const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    alertType: {
      type: String,
      enum: ["low_stock", "sold_out", "new_order", "system"],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      default: ""
    },
    smsStatus: {
      type: String,
      enum: ["SENT", "SIMULATED", "PENDING_PROVIDER", "FAILED"],
      default: "PENDING_PROVIDER"
    },
    smsProvider: {
      type: String,
      default: "In-App / System"
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
