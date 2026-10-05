import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg, CATEGORIES } from "../api.js";

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/products", { params: { q, category } })
      .then((r) => setProducts(r.data))
      .catch((e) => setError(errMsg(e)));
  }, [q, category]);

  return (
    <>
      <h2 className="mb-3">Marketplace</h2>
      <div className="row g-2 mb-4">
        <div className="col-md-8"><input className="form-control" placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="col-md-4">
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {products.length === 0 && !error && <p className="text-muted">No products found.</p>}
      <div className="row g-3">
        {products.map((p) => (
          <div className="col-sm-6 col-lg-4" key={p._id}>
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{p.name}</h5>
                <span className="badge bg-secondary me-1">{p.category}</span>
                <span className={`badge ${p.availability === "Available" ? "bg-success" : "bg-danger"}`}>{p.availability}</span>
                <p className="mt-2 mb-1 fw-bold">Rs. {p.price} / {p.unit}</p>
                <p className="text-muted small mb-2">{p.location} · by {p.farmer?.name}</p>
                <Link className="btn btn-outline-success btn-sm" to={`/product/${p._id}`}>View details</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
