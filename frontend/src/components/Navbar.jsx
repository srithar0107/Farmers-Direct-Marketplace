import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const cp = role === "customer" ? "/change-password" : `/${role}/change-password`;

  const links = !user ? [] : role === "admin"
    ? [["Dashboard", "/admin/dashboard"], ["Products", "/admin/products"], ["Users", "/admin/users"], ["Marketplace", "/marketplace"]]
    : role === "farmer"
    ? [["Dashboard", "/farmer/dashboard"], ["My Products", "/farmer/products"], ["Add Product", "/farmer/products/add"]]
    : [["Marketplace", "/marketplace"]];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">Farmers' Direct</Link>
        <button className="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#nav" aria-label="Toggle menu">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav me-auto">
            {links.map(([label, to]) => (
              <li className="nav-item" key={to}><Link className="nav-link" to={to}>{label}</Link></li>
            ))}
          </ul>
          <ul className="navbar-nav align-items-lg-center">
            {user ? (
              <>
                <li className="nav-item text-white me-lg-3">{user.name} ({role})</li>
                <li className="nav-item"><Link className="nav-link" to={cp}>Change Password</Link></li>
                <li className="nav-item">
                  <button className="btn btn-light btn-sm" onClick={() => { logout(); navigate("/login"); }}>Logout</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/register">Register</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
