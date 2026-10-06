import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errMsg, CATEGORY_ICONS } from "../api.js";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

const money = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function ProductDetails() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  const [imgFailed, setImgFailed] = useState(false);
  const [qty, setQty] = useState(1);

  const [deliverTo, setDeliverTo] = useState(localStorage.getItem("deliveryLocation") || "");
  const [editingLoc, setEditingLoc] = useState(false);
  const [locDraft, setLocDraft] = useState(deliverTo);

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((r) => setP(r.data))
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  const saveLocation = () => {
    const v = locDraft.trim();
    setDeliverTo(v);
    if (v) localStorage.setItem("deliveryLocation", v);
    else localStorage.removeItem("deliveryLocation");
    setEditingLoc(false);
  };

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!p) return <p className="text-muted">Loading product... (the first load can take up to a minute)</p>;

  const inStock = p.availability === "Available" && p.quantity > 0;
  const maxQty = Math.max(1, p.quantity);
  const safeQty = Math.min(Math.max(1, qty), maxQty);
  const productTotal = p.price * safeQty;
  const showImage = p.image && !imgFailed;

  const changeQty = (v) => {
    const n = Math.floor(Number(v));
    if (Number.isNaN(n)) return setQty(1);
    setQty(Math.min(Math.max(1, n), maxQty));
  };

  const later = <span className="pd-later">Calculated after delivery location</span>;

  return (
    <div className="pd">
      <style>{`
        .pd-back { display: inline-block; margin-bottom: 14px; font-weight: 600; text-decoration: none; }
        .pd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
        .pd-media {
          background: #eef6e6; border-radius: 22px; overflow: hidden; min-height: 340px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(30,80,30,0.12); position: relative;
        }
        .pd-media img { width: 100%; height: 100%; max-height: 520px; object-fit: cover; display: block; }
        .pd-emoji { font-size: 120px; }
        .pd-organic {
          position: absolute; top: 14px; left: 14px; background: #fff; color: #1c8a35;
          font-weight: 700; font-size: 13px; padding: 5px 12px; border-radius: 20px;
        }
        .pd-panel {
          background: #fff; border-radius: 22px; padding: 26px;
          box-shadow: 0 8px 24px rgba(30,80,30,0.10);
        }
        .pd-title { font-size: clamp(26px, 4vw, 36px); font-weight: 800; margin: 0; color: #172b18; letter-spacing: -1px; }
        .pd-cat { color: #6b7b6b; margin-bottom: 12px; }
        .pd-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #6b7b6b; margin-top: 12px; }
        .pd-price { font-size: 34px; font-weight: 800; color: #176b35; line-height: 1.1; }
        .pd-price span { font-size: 16px; font-weight: 600; color: #6b7b6b; }
        .pd-status { font-weight: 700; margin-top: 4px; }
        .pd-status.ok { color: #1c8a35; }
        .pd-status.out { color: #b42318; }
        .pd-desc { margin: 14px 0; color: #34453a; line-height: 1.6; }
        .pd-box { background: #f4f8ed; border-radius: 16px; padding: 14px 16px; margin-top: 14px; }
        .pd-box h3 { font-size: 15px; font-weight: 800; margin: 0 0 8px; color: #172b18; }
        .pd-row { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; font-size: 15px; }
        .pd-row.total { border-top: 1px solid #cfe0c6; margin-top: 6px; padding-top: 10px; font-weight: 800; }
        .pd-later { color: #8a6d00; font-size: 13px; font-style: italic; text-align: right; }
        .pd-qty { display: inline-flex; align-items: center; gap: 8px; }
        .pd-qty button {
          width: 40px; height: 40px; border-radius: 12px; border: 1px solid #cfe0c6;
          background: #fff; font-size: 20px; font-weight: 700; color: #176b35;
        }
        .pd-qty input { width: 80px; height: 40px; text-align: center; border: 1px solid #cfe0c6; border-radius: 12px; font-size: 16px; }
        .pd-loc-edit { display: flex; gap: 8px; flex-wrap: wrap; }
        .pd-loc-edit input { flex: 1 1 160px; }
        @media (max-width: 800px) {
          .pd-grid { grid-template-columns: 1fr; }
          .pd-media { min-height: 240px; }
          .pd-emoji { font-size: 90px; }
        }
      `}</style>

      <Link to="/marketplace" className="pd-back">← Back to marketplace</Link>

      <div className="pd-grid">
        {/* LEFT: image */}
        <div className="pd-media">
          {showImage ? (
            <img src={p.image} alt={p.name} onError={() => setImgFailed(true)} />
          ) : (
            <div className="pd-emoji">{CATEGORY_ICONS[p.category] || "🧺"}</div>
          )}
          {p.organic && <span className="pd-organic">🍃 Organic</span>}
        </div>

        {/* RIGHT: details */}
        <div className="pd-panel">
          <h1 className="pd-title">{p.name}</h1>
          <div className="pd-cat">{CATEGORY_ICONS[p.category] || ""} {p.category}</div>

          <div className="pd-label">Farmer price</div>
          <div className="pd-price">
            {money(p.price)} <span>/ {p.unit}</span>
          </div>
          <div className={`pd-status ${inStock ? "ok" : "out"}`}>
            {inStock ? `🟢 Available: ${p.quantity} ${p.unit}` : "🔴 Out of stock"}
          </div>

          <p className="pd-desc">{p.description}</p>

          <div className="pd-box">
            <h3>👨‍🌾 Farmer</h3>
            <div className="pd-row"><span>Name</span><strong>{p.farmer?.name || "Farmer"}</strong></div>
            <div className="pd-row"><span>Farm location</span><strong>📍 {p.location}</strong></div>
            {p.farmer?.phone && (
              <div className="pd-row"><span>Phone</span><strong>{p.farmer.phone}</strong></div>
            )}
            {p.harvestDate && (
              <div className="pd-row"><span>Harvest date</span><strong>🌾 {fmtDate(p.harvestDate)}</strong></div>
            )}
          </div>

          <div className="pd-box">
            <h3>📍 Delivery location</h3>
            {editingLoc ? (
              <div className="pd-loc-edit">
                <input
                  autoFocus
                  className="form-control"
                  placeholder="City / village / area"
                  value={locDraft}
                  onChange={(e) => setLocDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveLocation()}
                />
                <button type="button" className="btn btn-success" onClick={saveLocation}>Save</button>
              </div>
            ) : (
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <strong>{deliverTo || "Not selected yet"}</strong>
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={() => {
                    setLocDraft(deliverTo);
                    setEditingLoc(true);
                  }}
                >
                  {deliverTo ? "Change" : "Select location"}
                </button>
              </div>
            )}
            <div className="text-muted small mt-2">
              Distance and delivery time will be shown here once delivery pricing is added.
            </div>
          </div>

          <div className="pd-box">
            <h3>Quantity</h3>
            <div className="pd-qty">
              <button type="button" onClick={() => changeQty(safeQty - 1)} disabled={!inStock || safeQty <= 1}>−</button>
              <input
                type="number"
                min="1"
                max={maxQty}
                value={safeQty}
                disabled={!inStock}
                onChange={(e) => changeQty(e.target.value)}
              />
              <button type="button" onClick={() => changeQty(safeQty + 1)} disabled={!inStock || safeQty >= maxQty}>+</button>
              <span className="text-muted">{p.unit}</span>
            </div>
          </div>

          <div className="pd-box">
            <h3>Price breakdown</h3>
            <div className="pd-row">
              <span>Farmer price ({safeQty} {p.unit} × {money(p.price)})</span>
              <strong>{money(productTotal)}</strong>
            </div>
            <div className="pd-row"><span>Transport</span>{later}</div>
            <div className="pd-row"><span>Handling</span>{later}</div>
            <div className="pd-row"><span>Platform fee</span>{later}</div>
            <div className="pd-row"><span>Tax</span>{later}</div>
            <div className="pd-row total">
              <span>Final delivered price</span>
              <span className="pd-later">Calculated at checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}