import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function ProductList() {
  const { user } = useAuth();
  const admin = user.role === "admin";
  const base = admin ? "/admin" : "/farmer";
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  const load = () =>
    api.get(admin ? "/products" : "/products/mine").then((r) => setProducts(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await api.delete(`/products/${id}`); load(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">{admin ? "All products" : "My products"}</h2>
        {!admin && <Link className="btn btn-success" to="/farmer/products/add">Add product</Link>}
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead><tr>
            <th>Name</th><th>Category</th><th>Price</th><th>Qty</th><th>Status</th>{admin && <th>Farmer</th>}<th></th>
          </tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td><td>{p.category}</td><td>Rs. {p.price}/{p.unit}</td><td>{p.quantity}</td>
                <td>{p.availability}</td>{admin && <td>{p.farmer?.name}</td>}
                <td className="text-nowrap">
                  <Link className="btn btn-sm btn-outline-primary me-1" to={`${base}/products/edit/${p._id}`}>Edit</Link>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => remove(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan="7" className="text-center text-muted">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
