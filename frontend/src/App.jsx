import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import FarmerLogin from "./pages/FarmerLogin.jsx";
import FarmerRegister from "./pages/FarmerRegister.jsx";
import Marketplace from "./pages/Marketplace.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import Dashboard from "./pages/Dashboard.jsx"; // Admin dashboard
import FarmerDashboard from "./pages/FarmerDashboard.jsx"; // Dedicated Farmer dashboard
import CartPage from "./pages/CartPage.jsx"; // Buyer cart & checkout
import BuyerOrders from "./pages/BuyerOrders.jsx"; // Buyer order history & invoices
import MarketPrices from "./pages/MarketPrices.jsx"; // AGMARKNET mandi prices
import ProductList from "./pages/ProductList.jsx";
import ProductForm from "./pages/ProductForm.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";

const R = ({ roles, children }) => <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <Navbar />
      <div className="container py-4">
        <Routes>
          {/* Public / Common Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/farmer-login" element={<FarmerLogin />} />
          <Route path="/farmer/register" element={<FarmerRegister />} />
          <Route path="/farmer-register" element={<FarmerRegister />} />
          <Route path="/market-prices" element={<MarketPrices />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          {/* Buyer / Customer Only Routes (Farmers cannot access) */}
          <Route path="/cart" element={<R roles={["customer"]}><CartPage /></R>} />
          <Route path="/buyer/orders" element={<R roles={["customer"]}><BuyerOrders /></R>} />
          <Route path="/change-password" element={<R roles={["customer"]}><ChangePassword /></R>} />

          {/* Farmer Only Routes (Buyers cannot access) */}
          <Route path="/farmer/dashboard" element={<R roles={["farmer"]}><FarmerDashboard /></R>} />
          <Route path="/farmer/products" element={<R roles={["farmer"]}><ProductList /></R>} />
          <Route path="/farmer/products/add" element={<R roles={["farmer"]}><ProductForm /></R>} />
          <Route path="/farmer/products/edit/:id" element={<R roles={["farmer"]}><ProductForm /></R>} />
          <Route path="/farmer/change-password" element={<R roles={["farmer"]}><ChangePassword /></R>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<R roles={["admin"]}><Dashboard /></R>} />
          <Route path="/admin/products" element={<R roles={["admin"]}><ProductList /></R>} />
          <Route path="/admin/products/edit/:id" element={<R roles={["admin"]}><ProductForm /></R>} />
          <Route path="/admin/users" element={<R roles={["admin"]}><AdminUsers /></R>} />
          <Route path="/admin/change-password" element={<R roles={["admin"]}><ChangePassword /></R>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}
