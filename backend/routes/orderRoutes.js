const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const User = require("../models/User");
const { calculateDeliveryCharge, PRICING_CONFIG } = require("../services/distanceService");
const { sendSmsAlert } = require("../services/smsService");
const { protect, allow } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// Helper to generate unique numbers
function generateOrderNumber() {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${new Date().getFullYear()}-${rand}`;
}

function generateInvoiceNumber() {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `INV-${new Date().getFullYear()}-${rand}`;
}

// 1. PLACE ORDER (With Atomic Stock Validation & Transparent Delivered Price Calculation)
router.post("/", async (req, res) => {
  const buyerId = req.user.id;
  const { items, deliveryAddress, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "No items provided in order" });
  }

  if (!deliveryAddress || !deliveryAddress.name || !deliveryAddress.phone || !deliveryAddress.address) {
    return res.status(400).json({ message: "Please provide a complete delivery name, phone, and address" });
  }

  const buyer = await User.findById(buyerId);
  if (!buyer) return res.status(404).json({ message: "Buyer profile not found" });

  const deductedProducts = [];
  const processedItems = [];
  let subtotal = 0;
  const farmerShipments = new Map(); // group by farmer to calculate delivery fee

  try {
    // Stage 1: Validate and atomically deduct stock for all items
    for (const item of items) {
      const prodId = item.productId || item.product;
      const orderQty = Math.max(1, Number(item.quantity) || 1);

      // Atomic update ensures no two buyers can oversell available stock
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: prodId, quantity: { $gte: orderQty } },
        {
          $inc: { quantity: -orderQty, soldQuantity: orderQty }
        },
        { returnDocument: "after" }
      ).populate("farmer", "name phone location district");

      if (!updatedProduct) {
        // Find product to give descriptive error
        const currentProd = await Product.findById(prodId);
        const name = currentProd ? currentProd.name : "Product";
        const avail = currentProd ? currentProd.quantity : 0;
        throw new Error(
          `Insufficient stock for "${name}". Only ${avail} available, but you requested ${orderQty}.`
        );
      }

      deductedProducts.push({
        product: updatedProduct,
        quantity: orderQty
      });

      // Update availability if stock reached 0
      if (updatedProduct.quantity === 0) {
        updatedProduct.availability = "Out of Stock";
        await updatedProduct.save();
      }

      const lineTotal = updatedProduct.price * orderQty;
      subtotal += lineTotal;

      processedItems.push({
        product: updatedProduct._id,
        farmer: updatedProduct.farmer._id,
        name: updatedProduct.name,
        category: updatedProduct.category,
        price: updatedProduct.price,
        quantity: orderQty,
        unit: updatedProduct.unit,
        lineTotal
      });

      // Group by farmer for delivery fee calculation
      const fId = String(updatedProduct.farmer._id);
      if (!farmerShipments.has(fId)) {
        farmerShipments.set(fId, {
          farmer: updatedProduct.farmer,
          items: []
        });
      }
      farmerShipments.get(fId).items.push(updatedProduct);
    }

    // Stage 2: Calculate delivery charges per farmer shipment
    let totalDeliveryCharge = 0;
    const buyerLocation = `${deliveryAddress.address}, ${deliveryAddress.district || ""} ${deliveryAddress.location || ""}`.trim();

    for (const shipment of farmerShipments.values()) {
      const calc = calculateDeliveryCharge(
        shipment.farmer.location || shipment.farmer.district,
        buyerLocation
      );
      totalDeliveryCharge += calc.deliveryFee;
    }

    // Minimum base delivery charge
    if (totalDeliveryCharge === 0) totalDeliveryCharge = PRICING_CONFIG.DELIVERY.BASE_FEE;

    // Apply transparent pricing breakdown:
    // Final delivered price = Item subtotal + Transport charge + Handling charge + Platform fee + Applicable tax - Discounts
    const handlingCharge = PRICING_CONFIG.HANDLING_FEE;
    const platformFee = PRICING_CONFIG.PLATFORM_FEE;
    const taxAmount = Math.round(subtotal * PRICING_CONFIG.TAX_RATE);
    const discountAmount = PRICING_CONFIG.DISCOUNT;
    const grandTotal = subtotal + totalDeliveryCharge + handlingCharge + platformFee + taxAmount - discountAmount;

    // Stage 3: Create Order document
    const orderNumber = generateOrderNumber();
    const invoiceNumber = generateInvoiceNumber();

    const order = await Order.create({
      orderNumber,
      invoiceNumber,
      invoiceDate: new Date(),
      buyer: buyerId,
      items: processedItems,
      deliveryAddress: {
        name: deliveryAddress.name.trim(),
        phone: deliveryAddress.phone.trim(),
        address: deliveryAddress.address.trim(),
        district: deliveryAddress.district || "",
        location: deliveryAddress.location || ""
      },
      subtotal,
      deliveryCharge: totalDeliveryCharge,
      handlingCharge,
      platformFee,
      taxAmount,
      discountAmount,
      totalAmount: grandTotal,
      status: "Confirmed",
      paymentMethod: paymentMethod || "Pay on Delivery (Cash / UPI to Farmer)",
      paymentStatus: "Pending"
    });

    // Stage 4: Clear buyer's cart in database
    await Cart.findOneAndUpdate({ user: buyerId }, { $set: { items: [] } });

    // Stage 5: Trigger Stock Alerts & SMS notifications for farmers (asynchronously)
    for (const deducted of deductedProducts) {
      const p = deducted.product;
      const rem = p.quantity;
      const farmer = p.farmer;

      if (rem === 0) {
        // Sold out alert
        const msg = `Sold Out Alert: Your ${p.name} product is now out of stock. New orders have been disabled. Please restock in Farmers Direct Marketplace.`;
        sendSmsAlert({
          farmer,
          product: p,
          alertType: "sold_out",
          title: `Sold Out: ${p.name}`,
          message: msg,
          phone: farmer.phone
        }).catch((err) => console.error("Alert error:", err.message));
      } else if (rem <= (p.lowStockThreshold || 10)) {
        // Low stock alert
        const msg = `Stock Alert: Your ${p.name} product has only ${rem} ${p.unit} remaining. Please update your stock in Farmers Direct Marketplace.`;
        sendSmsAlert({
          farmer,
          product: p,
          alertType: "low_stock",
          title: `Low Stock Alert: ${p.name}`,
          message: msg,
          phone: farmer.phone
        }).catch((err) => console.error("Alert error:", err.message));
      }

      // New Order notification to farmer
      const orderNotice = `New Order! Customer ${deliveryAddress.name} ordered ${deducted.quantity} ${p.unit} of ${p.name}. Order: ${orderNumber}.`;
      sendSmsAlert({
        farmer,
        product: p,
        alertType: "new_order",
        title: `New Order Received (${orderNumber})`,
        message: orderNotice,
        phone: farmer.phone
      }).catch((err) => console.error("Order notice error:", err.message));
    }

    res.status(201).json({
      message: "Order placed successfully!",
      order
    });
  } catch (err) {
    // ROLLBACK STAGE: If anything failed, return already deducted quantities to stock
    console.error("Order placement failed, rolling back stock:", err.message);
    for (const item of deductedProducts) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { quantity: item.quantity, soldQuantity: -item.quantity },
        $set: { availability: "Available" }
      }).catch((rbErr) => console.error("Rollback error:", rbErr.message));
    }

    res.status(400).json({ message: err.message || "Failed to process order" });
  }
});

// 2. BUYER ORDERS: History of orders placed by logged in buyer
router.get("/buyer", async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate("items.farmer", "name phone location district farmerId")
      .sort("-createdAt");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

// 3. FARMER ORDERS: Orders containing products grown by this farmer
router.get("/farmer", allow("farmer", "admin"), async (req, res) => {
  try {
    const farmerId = req.user.id;
    const orders = await Order.find({ "items.farmer": farmerId })
      .populate("buyer", "name email phone location address")
      .sort("-createdAt");

    // Filter items to show only this farmer's products within each order
    const farmerOrders = orders.map((ord) => {
      const doc = ord.toObject();
      const myItems = doc.items.filter((it) => String(it.farmer) === String(farmerId));
      const mySubtotal = myItems.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
      return {
        ...doc,
        myItems,
        mySubtotal
      };
    });

    res.json(farmerOrders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch farmer orders", error: err.message });
  }
});

// 4. GET SINGLE ORDER DETAILS
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("buyer", "name email phone location address")
      .populate("items.farmer", "name phone location district farmerId");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Authorization: Must be the buyer, one of the farmers, or an admin
    const isBuyer = String(order.buyer._id || order.buyer) === req.user.id;
    const isFarmer = order.items.some((it) => String(it.farmer?._id || it.farmer) === req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isBuyer && !isFarmer && !isAdmin) {
      return res.status(403).json({ message: "Access denied to this order" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch order", error: err.message });
  }
});

// 5. UPDATE ORDER STATUS (Farmer or Admin)
router.put("/:id/status", allow("farmer", "admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Cannot change status of a cancelled order" });
    }

    order.status = status;
    if (status === "Delivered") {
      order.paymentStatus = "Paid";
    }

    await order.save();
    res.json({ message: `Order status updated to ${status}`, order });
  } catch (err) {
    res.status(500).json({ message: "Failed to update order status", error: err.message });
  }
});

// 6. CANCEL ORDER (Restores stock atomically)
router.put("/:id/cancel", async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isBuyer = String(order.buyer) === req.user.id;
    const isFarmer = order.items.some((it) => String(it.farmer) === req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isBuyer && !isFarmer && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({ message: "Delivered orders cannot be cancelled" });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    // Restore stock for all items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity, soldQuantity: -item.quantity },
        $set: { availability: "Available" }
      });
    }

    order.status = "Cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason || "Cancelled by user";
    await order.save();

    res.json({ message: "Order cancelled and product stock restored", order });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel order", error: err.message });
  }
});

module.exports = router;
