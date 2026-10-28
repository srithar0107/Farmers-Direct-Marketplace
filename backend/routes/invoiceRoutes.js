const express = require("express");
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// GET INVOICE BY ORDER ID
router.get("/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("buyer", "name email phone location address")
      .populate("items.farmer", "name phone location district farmerId");

    if (!order) {
      return res.status(404).json({ message: "Invoice not found for this order" });
    }

    // Verify user authorization: buyer, involved farmer, or admin
    const isBuyer = String(order.buyer?._id || order.buyer) === req.user.id;
    const isFarmer = order.items.some(
      (it) => String(it.farmer?._id || it.farmer) === req.user.id
    );
    const isAdmin = req.user.role === "admin";

    if (!isBuyer && !isFarmer && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to view this invoice" });
    }

    const invoiceData = {
      invoiceNumber: order.invoiceNumber,
      invoiceDate: order.invoiceDate || order.createdAt,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      orderStatus: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,

      // Buyer / Customer Info
      buyer: {
        name: order.deliveryAddress.name || order.buyer?.name,
        phone: order.deliveryAddress.phone || order.buyer?.phone,
        address: order.deliveryAddress.address,
        district: order.deliveryAddress.district,
        location: order.deliveryAddress.location
      },

      // Items purchased
      items: order.items.map((it) => ({
        productName: it.name,
        category: it.category,
        quantity: it.quantity,
        unit: it.unit,
        pricePerUnit: it.price,
        lineTotal: it.lineTotal,
        farmerName: it.farmer?.name || "Verified Farmer",
        farmerPhone: it.farmer?.phone || "",
        farmerLocation: it.farmer?.location || "",
        farmerId: it.farmer?.farmerId || ""
      })),

      // Pricing Breakdown
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      handlingCharge: order.handlingCharge !== undefined ? order.handlingCharge : 10,
      platformFee: order.platformFee !== undefined ? order.platformFee : 5,
      tax: order.taxAmount || 0,
      taxLabel: "0% GST (Exempted for raw agricultural produce)",
      discountAmount: order.discountAmount || 0,
      totalAmount: order.totalAmount,

      // Marketplace metadata
      marketplace: {
        name: "Farmers' Direct Marketplace",
        tagline: "Farm Fresh Produce Directly From Farmers to You",
        supportEmail: "support@farmersdirect.in",
        state: "Tamil Nadu, India"
      }
    };

    res.json(invoiceData);
  } catch (err) {
    res.status(500).json({ message: "Failed to generate invoice", error: err.message });
  }
});

module.exports = router;
