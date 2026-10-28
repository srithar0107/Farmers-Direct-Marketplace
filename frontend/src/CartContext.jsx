import { createContext, useContext, useState, useEffect } from "react";
import api from "./api.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user || user.role !== "customer") {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get("/cart");
      setCart(data);
    } catch (e) {
      console.warn("Cart fetch notice:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    const { data } = await api.post("/cart/add", { productId, quantity });
    setCart(data);
    return data;
  };

  const updateQuantity = async (productId, quantity) => {
    const { data } = await api.put("/cart/update", { productId, quantity });
    setCart(data);
    return data;
  };

  const removeItem = async (productId) => {
    const { data } = await api.delete(`/cart/item/${productId}`);
    setCart(data);
    return data;
  };

  const clearCart = async () => {
    await api.delete("/cart/clear");
    setCart((prev) => (prev ? { ...prev, items: [] } : null));
  };

  const itemCount = (cart?.items || []).reduce((acc, item) => acc + (item.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
