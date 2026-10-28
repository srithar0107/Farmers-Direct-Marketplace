const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect); // All cart operations require authentication

// GET Cart items
router.get("/", async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate({
      path: "items.product",
      populate: { path: "farmer", select: "name phone location district farmerId" }
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Filter out any products that were deleted from database
    const validItems = cart.items.filter((item) => item.product != null);
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cart", error: err.message });
  }
});

// ADD item to cart
router.post("/add", async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Math.max(1, Number(quantity) || 1);

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.availability === "Out of Stock" || product.quantity <= 0) {
      return res.status(400).json({ message: "Sorry, this product is currently out of stock." });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => String(item.product) === String(productId)
    );

    if (existingIndex > -1) {
      const newTotal = cart.items[existingIndex].quantity + qty;
      if (newTotal > product.quantity) {
        return res.status(400).json({
          message: `Cannot add more. Only ${product.quantity} ${product.unit} available in stock.`
        });
      }
      cart.items[existingIndex].quantity = newTotal;
      cart.items[existingIndex].price = product.price;
    } else {
      if (qty > product.quantity) {
        return res.status(400).json({
          message: `Only ${product.quantity} ${product.unit} available in stock.`
        });
      }
      cart.items.push({
        product: product._id,
        quantity: qty,
        price: product.price
      });
    }

    await cart.save();

    const populated = await Cart.findById(cart._id).populate({
      path: "items.product",
      populate: { path: "farmer", select: "name phone location district farmerId" }
    });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to add to cart", error: err.message });
  }
});

// UPDATE item quantity
router.put("/update", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity);

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    if (qty <= 0) {
      // Remove item if quantity is zero or less
      cart.items = cart.items.filter((item) => String(item.product) !== String(productId));
    } else {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });

      if (qty > product.quantity) {
        return res.status(400).json({
          message: `Cannot exceed available stock of ${product.quantity} ${product.unit}.`
        });
      }

      const item = cart.items.find((item) => String(item.product) === String(productId));
      if (item) {
        item.quantity = qty;
        item.price = product.price;
      }
    }

    await cart.save();

    const populated = await Cart.findById(cart._id).populate({
      path: "items.product",
      populate: { path: "farmer", select: "name phone location district farmerId" }
    });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update cart", error: err.message });
  }
});

// REMOVE single item
router.delete("/item/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => String(item.product) !== String(productId));
    await cart.save();

    const populated = await Cart.findById(cart._id).populate({
      path: "items.product",
      populate: { path: "farmer", select: "name phone location district farmerId" }
    });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to remove item", error: err.message });
  }
});

// CLEAR cart
router.delete("/clear", async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: "Cart cleared", items: [] });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear cart", error: err.message });
  }
});

module.exports = router;
