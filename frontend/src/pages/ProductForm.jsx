import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { errMsg, CATEGORIES } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

const empty = { name: "", category: "Fruits", description: "", price: "", quantity: "", unit: "kg", location: "", availability: "Available" };

export default function ProductForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const back = user.role === "admin" ? "/admin/products" : "/farmer/products";
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (id) api.get(`/products/${id}`).then((r) => setForm({ ...empty, ...r.data })).catch((e) => setError(errMsg(e)));
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (Number(form.price) < 0 || Number(form.quantity) < 0) return setError("Price and quantity cannot be negative");
    try {
      if (id) await api.put(`/products/${id}`, form);
      else await api.post("/products", form);
      navigate(back);
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-7">
        <h2 className="mb-3">{id ? "Edit product" : "Add product"}</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <input className="form-control mb-3" placeholder="Product name (e.g. Grapes)" required value={form.name} onChange={set("name")} />
          <select className="form-select mb-3" value={form.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <textarea className="form-control mb-3" rows="3" placeholder="Description" required value={form.description} onChange={set("description")} />
          <div className="row">
            <div className="col-md-4"><input className="form-control mb-3" type="number" placeholder="Price" required value={form.price} onChange={set("price")} /></div>
            <div className="col-md-4"><input className="form-control mb-3" type="number" placeholder="Quantity" required value={form.quantity} onChange={set("quantity")} /></div>
            <div className="col-md-4">
              <select className="form-select mb-3" value={form.unit} onChange={set("unit")}>
                {["kg", "quintal", "dozen", "piece", "litre"].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <input className="form-control mb-3" placeholder="Location" required value={form.location} onChange={set("location")} />
          <select className="form-select mb-3" value={form.availability} onChange={set("availability")}>
            <option>Available</option><option>Out of Stock</option>
          </select>
          <button className="btn btn-success me-2">Save</button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(back)}>Cancel</button>
        </form>
      </div>
    </div>
  );
}
