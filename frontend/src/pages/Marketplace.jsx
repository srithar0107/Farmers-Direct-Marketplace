import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg, CATEGORIES, CATEGORY_ICONS } from "../api.js";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

function ProductCard({ p }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = p.image && !imgFailed;
  const inStock = p.availability === "Available" && p.quantity > 0;

  return (
    <div className="mp-card">
      <div className="mp-card-media">
        {showImage ? (
          <img src={p.image} alt={p.name} onError={() => setImgFailed(true)} />
        ) : (
          <div className="mp-card-emoji">{CATEGORY_ICONS[p.category] || "🧺"}</div>
        )}
        {p.organic && <span className="mp-organic">🍃 Organic</span>}
      </div>

      <div className="mp-card-body">
        <h3 className="mp-card-title">{p.name}</h3>
        <div className="mp-card-cat">{p.category}</div>

        <div className="mp-card-farmer">👨‍🌾 {p.farmer?.name || "Farmer"}</div>
        <div className="mp-card-loc">📍 {p.location}</div>
        {p.harvestDate && <div className="mp-card-loc">🌾 Harvested {fmtDate(p.harvestDate)}</div>}

        <div className="mp-price-label">Farmer price</div>
        <div className="mp-price">
          ₹{p.price} <span>/ {p.unit}</span>
        </div>

        <div className="mp-card-qty">
          Available: {p.quantity} {p.unit}
        </div>

        <div className={`mp-status ${inStock ? "ok" : "out"}`}>
          {inStock ? "🟢 Available" : "🔴 Out of stock"}
        </div>

        <Link className="btn btn-success w-100 mt-3" to={`/product/${p._id}`}>
          View details
        </Link>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("");
  const [farmer, setFarmer] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("recommended");

  const [deliverTo, setDeliverTo] = useState(localStorage.getItem("deliveryLocation") || "");
  const [editingLoc, setEditingLoc] = useState(false);
  const [locDraft, setLocDraft] = useState(deliverTo);

  useEffect(() => {
    api
      .get("/products")
      .then((r) => setProducts(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const farmers = useMemo(
    () => [...new Set(products.map((p) => p.farmer?.name).filter(Boolean))].sort(),
    [products]
  );
  const locations = useMemo(
    () => [...new Set(products.map((p) => p.location).filter(Boolean))].sort(),
    [products]
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.category} ${p.farmer?.name || ""} ${p.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (category && p.category !== category) return false;
      if (organicOnly && !p.organic) return false;
      if (minPrice !== "" && p.price < Number(minPrice)) return false;
      if (maxPrice !== "" && p.price > Number(maxPrice)) return false;
      if (availability === "Available" && !(p.availability === "Available" && p.quantity > 0)) return false;
      if (farmer && p.farmer?.name !== farmer) return false;
      if (location && p.location !== location) return false;
      return true;
    });

    const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "recent") list = [...list].sort(byNewest);
    else {
      const rank = (p) => (p.availability === "Available" && p.quantity > 0 ? 0 : 1);
      list = [...list].sort((a, b) => rank(a) - rank(b) || byNewest(a, b));
    }
    return list;
  }, [products, search, category, organicOnly, minPrice, maxPrice, availability, farmer, location, sort]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setOrganicOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setAvailability("");
    setFarmer("");
    setLocation("");
    setSort("recommended");
  };

  const saveLocation = () => {
    const v = locDraft.trim();
    setDeliverTo(v);
    if (v) localStorage.setItem("deliveryLocation", v);
    else localStorage.removeItem("deliveryLocation");
    setEditingLoc(false);
  };

  return (
    <div className="mp">
      <style>{`
        .mp-hero {
          background: linear-gradient(135deg, #176b35, #4caf45);
          color: #fff;
          border-radius: 24px;
          padding: 34px 32px;
          margin-bottom: 22px;
          box-shadow: 0 12px 30px rgba(30, 80, 30, 0.15);
        }
        .mp-hero h1 { font-size: clamp(28px, 4vw, 40px); font-weight: 800; margin: 0 0 6px; letter-spacing: -1px; }
        .mp-hero p { margin: 0 0 20px; font-size: 17px; color: rgba(255,255,255,0.93); }
        .mp-search-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .mp-search {
          flex: 1 1 280px; height: 52px; border: 0; border-radius: 14px;
          padding: 0 18px; font-size: 16px; outline: none;
        }
        .mp-loc {
          flex: 0 1 auto; display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.35);
          border-radius: 14px; padding: 0 14px; min-height: 52px; color: #fff;
        }
        .mp-loc button {
          border: 0; background: #fff; color: #176b35; font-weight: 700;
          border-radius: 10px; padding: 6px 12px; font-size: 14px;
        }
        .mp-loc input {
          border: 0; border-radius: 8px; padding: 6px 10px; outline: none; min-width: 150px;
        }

        .mp-cats { display: flex; gap: 10px; overflow-x: auto; padding: 4px 2px 12px; margin-bottom: 8px; }
        .mp-cat {
          flex: 0 0 auto; border: 1px solid #d5e3cf; background: #fff; border-radius: 16px;
          padding: 10px 16px; font-weight: 600; color: #35503a; cursor: pointer;
          box-shadow: 0 2px 8px rgba(30,80,30,0.06); white-space: nowrap;
        }
        .mp-cat.active { background: #1c8a35; color: #fff; border-color: #1c8a35; }

        .mp-filters {
          background: #fff; border-radius: 18px; padding: 16px;
          box-shadow: 0 4px 14px rgba(30,80,30,0.08); margin-bottom: 18px;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; align-items: end;
        }
        .mp-filters label { display: block; font-size: 12px; font-weight: 700; color: #5a6b5a; margin-bottom: 4px; }
        .mp-count { color: #5a6b5a; margin-bottom: 12px; font-weight: 600; }

        .mp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .mp-card {
          background: #fff; border-radius: 20px; overflow: hidden;
          box-shadow: 0 6px 20px rgba(30,80,30,0.10); display: flex; flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .mp-card:hover { transform: translateY(-4px); box-shadow: 0 12px 26px rgba(30,80,30,0.18); }
        .mp-card-media { position: relative; height: 180px; background: #eef6e6; }
        .mp-card-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .mp-card-emoji { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 64px; }
        .mp-organic {
          position: absolute; top: 10px; left: 10px; background: #fff; color: #1c8a35;
          font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px;
        }
        .mp-card-body { padding: 16px; display: flex; flex-direction: column; flex: 1; }
        .mp-card-title { font-size: 20px; font-weight: 800; margin: 0; color: #172b18; }
        .mp-card-cat { color: #6b7b6b; font-size: 13px; margin-bottom: 8px; }
        .mp-card-farmer, .mp-card-loc, .mp-card-qty { font-size: 14px; color: #3d4d3d; margin-bottom: 2px; }
        .mp-price-label { margin-top: 10px; font-size: 12px; color: #6b7b6b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .mp-price { font-size: 26px; font-weight: 800; color: #176b35; line-height: 1.1; }
        .mp-price span { font-size: 14px; font-weight: 600; color: #6b7b6b; }
        .mp-status { margin-top: 6px; font-size: 14px; font-weight: 700; }
        .mp-status.ok { color: #1c8a35; }
        .mp-status.out { color: #b42318; }

        .mp-empty { text-align: center; padding: 50px 10px; color: #5a6b5a; }

        @media (max-width: 576px) {
          .mp-hero { padding: 24px 18px; border-radius: 18px; }
          .mp-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* HEADER */}
      <div className="mp-hero">
        <h1>Fresh from Farmers</h1>
        <p>Buy directly from local farmers with transparent pricing.</p>

        <div className="mp-search-row">
          <input
            className="mp-search"
            placeholder="Search vegetables, fruits, grains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="mp-loc">
            {editingLoc ? (
              <>
                <input
                  autoFocus
                  placeholder="City / village / area"
                  value={locDraft}
                  onChange={(e) => setLocDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveLocation()}
                />
                <button type="button" onClick={saveLocation}>Save</button>
              </>
            ) : (
              <>
                <span>📍 Deliver to: <strong>{deliverTo || "Select location"}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setLocDraft(deliverTo);
                    setEditingLoc(true);
                  }}
                >
                  {deliverTo ? "Change" : "Select"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CATEGORY CARDS */}
      <div className="mp-cats">
        <button className={`mp-cat ${category === "" ? "active" : ""}`} onClick={() => setCategory("")}>
          🛒 All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`mp-cat ${category === c ? "active" : ""}`}
            onClick={() => setCategory(category === c ? "" : c)}
          >
            {CATEGORY_ICONS[c]} {c}
          </button>
        ))}
        <button
          className={`mp-cat ${organicOnly ? "active" : ""}`}
          onClick={() => setOrganicOnly(!organicOnly)}
        >
          🍃 Organic
        </button>
      </div>

      {/* FILTERS */}
      <div className="mp-filters">
        <div>
          <label>Min price (₹)</label>
          <input className="form-control" type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        </div>
        <div>
          <label>Max price (₹)</label>
          <input className="form-control" type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
        <div>
          <label>Availability</label>
          <select className="form-select" value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="">All</option>
            <option value="Available">Available only</option>
          </select>
        </div>
        <div>
          <label>Farmer</label>
          <select className="form-select" value={farmer} onChange={(e) => setFarmer(e.target.value)}>
            <option value="">All farmers</option>
            {farmers.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label>Location</label>
          <select className="form-select" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">All locations</option>
            {locations.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label>Sort by</label>
          <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recommended">Recommended</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
            <option value="recent">Recently added</option>
            <option value="nearest" disabled>Nearest farmer (coming soon)</option>
          </select>
        </div>
        <div>
          <button type="button" className="btn btn-outline-success w-100" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p className="mp-empty">Loading fresh produce... (the first load can take up to a minute)</p>
      ) : (
        <>
          <div className="mp-count">{shown.length} product{shown.length === 1 ? "" : "s"} found</div>

          {shown.length === 0 ? (
            <div className="mp-empty">
              <div style={{ fontSize: 48 }}>🌾</div>
              <p>No products match your search. Try clearing the filters.</p>
            </div>
          ) : (
            <div className="mp-grid">
              {shown.map((p) => (
                <ProductCard key={p._id} p={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}