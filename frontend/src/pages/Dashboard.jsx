import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

const Stat = ({ label, value }) => (
  <div className="col-6 col-md-3">
    <div className="card text-center"><div className="card-body">
      <div className="fs-2 fw-bold text-success">{value}</div><div className="text-muted">{label}</div>
    </div></div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const admin = user.role === "admin";

  useEffect(() => {
    const load = admin
      ? api.get("/users/stats").then((r) => r.data)
      : api.get("/products/mine").then((r) => ({
          total: r.data.length,
          available: r.data.filter((p) => p.availability === "Available").length,
          out: r.data.filter((p) => p.availability !== "Available").length
        }));
    load.then(setStats).catch((e) => setError(errMsg(e)));
  }, [admin]);

  return (
    <>
      <h2 className="mb-3">Welcome, {user.name}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {stats && (
        <div className="row g-3 mb-4">
          {admin ? (
            <>
              <Stat label="Total users" value={stats.users} /><Stat label="Farmers" value={stats.farmers} />
              <Stat label="Customers" value={stats.customers} /><Stat label="Products" value={stats.products} />
            </>
          ) : (
            <>
              <Stat label="My products" value={stats.total} /><Stat label="Available" value={stats.available} />
              <Stat label="Out of stock" value={stats.out} />
            </>
          )}
        </div>
      )}
      <h5>What you can do</h5>
      {admin ? (
        <ul>
          <li><Link to="/admin/users">Manage users</Link>: add, edit, remove, change roles</li>
          <li><Link to="/admin/products">Manage products</Link>: view, update, delete any listing</li>
        </ul>
      ) : (
        <ul>
          <li><Link to="/farmer/products/add">Add a product</Link></li>
          <li><Link to="/farmer/products">View, update or delete my products</Link></li>
        </ul>
      )}
    </>
  );
}
