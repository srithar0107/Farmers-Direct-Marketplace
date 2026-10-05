import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errMsg } from "../api.js";

export default function ProductDetails() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => setP(r.data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!p) return <p>Loading...</p>;

  return (
    <div className="card">
      <div className="card-body">
        <h3>{p.name}</h3>
        <span className="badge bg-secondary me-1">{p.category}</span>
        <span className={`badge ${p.availability === "Available" ? "bg-success" : "bg-danger"}`}>{p.availability}</span>
        <p className="mt-3">{p.description}</p>
        <p><strong>Price:</strong> Rs. {p.price} per {p.unit}</p>
        <p><strong>Quantity available:</strong> {p.quantity} {p.unit}</p>
        <p><strong>Location:</strong> {p.location}</p>
        <hr />
        <h6>Farmer</h6>
        <p className="mb-1">{p.farmer?.name}</p>
        <p className="mb-3">Phone: {p.farmer?.phone || "Not provided"}</p>
        <Link to="/marketplace" className="btn btn-outline-success">Back to marketplace</Link>
      </div>
    </div>
  );
}
