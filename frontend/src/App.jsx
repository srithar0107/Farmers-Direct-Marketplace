import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Marketplace from "./pages/Marketplace.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
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
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/marketplace" element={<R roles={["customer", "farmer", "admin"]}><Marketplace /></R>} />
          <Route path="/product/:id" element={<R roles={["customer", "farmer", "admin"]}><ProductDetails /></R>} />
          <Route path="/change-password" element={<R roles={["customer"]}><ChangePassword /></R>} />

          <Route path="/farmer/dashboard" element={<R roles={["farmer"]}><Dashboard /></R>} />
          <Route path="/farmer/products" element={<R roles={["farmer"]}><ProductList /></R>} />
          <Route path="/farmer/products/add" element={<R roles={["farmer"]}><ProductForm /></R>} />
          <Route path="/farmer/products/edit/:id" element={<R roles={["farmer"]}><ProductForm /></R>} />
          <Route path="/farmer/change-password" element={<R roles={["farmer"]}><ChangePassword /></R>} />

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
