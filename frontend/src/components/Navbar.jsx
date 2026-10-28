import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { useCart } from "../CartContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const role = user?.role;
  const cp = role === "customer" ? "/change-password" : `/${role}/change-password`;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <span style={{ fontSize: "1.4rem" }}>🌾</span>
          <span>Farmers' Direct</span>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-lg-center">
            {role === "farmer" && (
              <>
                <li className="nav-item">
                  <Link className="nav-link fw-semibold" to="/farmer/dashboard">
                    📊 Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/farmer/products">
                    📦 My Products
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/farmer/products/add">
                    ➕ Add Crop
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-warning fw-semibold" to="/market-prices">
                    📈 Mandi Prices
                  </Link>
                </li>
              </>
            )}

            {role === "customer" && (
              <>
                <li className="nav-item">
                  <Link className="nav-link fw-semibold" to="/marketplace">
                    🛒 Marketplace
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/buyer/orders">
                    📑 My Orders & Invoices
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-warning fw-semibold" to="/market-prices">
                    📈 Mandi Live Rates
                  </Link>
                </li>
              </>
            )}

            {role === "admin" && (
              <>
                <li className="nav-item">
                  <Link className="nav-link fw-semibold" to="/admin/dashboard">
                    Admin Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin/products">
                    All Products
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin/users">
                    Users
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/marketplace">
                    Marketplace View
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-warning" to="/market-prices">
                    Mandi Rates
                  </Link>
                </li>
              </>
            )}

            {!user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/marketplace">
                    Marketplace
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-warning" to="/market-prices">
                    Mandi Rates
                  </Link>
                </li>
              </>
            )}
          </ul>

          <ul className="navbar-nav align-items-lg-center gap-2">
            {/* Buyer Cart Button */}
            {role === "customer" && (
              <li className="nav-item me-lg-2">
                <Link
                  className="btn btn-warning btn-sm d-flex align-items-center gap-2 fw-bold text-dark px-3 py-1 shadow-sm"
                  to="/cart"
                >
                  <span>🛒 Cart</span>
                  {itemCount > 0 ? (
                    <span className="badge bg-danger rounded-pill">{itemCount}</span>
                  ) : (
                    <span className="badge bg-secondary rounded-pill">0</span>
                  )}
                </Link>
              </li>
            )}

            {user ? (
              <>
                <li className="nav-item text-white text-nowrap d-flex align-items-center gap-1">
                  <span>{user.name}</span>
                  {user.farmerId && (
                    <span className="badge bg-warning text-dark font-monospace">
                      {user.farmerId}
                    </span>
                  )}
                  <span className="badge bg-light text-success text-capitalize">
                    {role === "customer" ? "Buyer" : role}
                  </span>
                </li>

                <li className="nav-item">
                  <Link className="nav-link text-white-50 small" to={cp}>
                    Change Password
                  </Link>
                </li>

                <li className="nav-item">
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="btn btn-outline-light btn-sm px-2 text-nowrap" to="/farmer-login">
                    👨‍🌾 Farmer Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-light btn-sm px-2 text-success fw-semibold text-nowrap" to="/login">
                    🛒 Buyer Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-warning btn-sm px-3 fw-bold text-dark text-nowrap" to="/register">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
