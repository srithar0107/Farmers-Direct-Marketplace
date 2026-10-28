import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg, CATEGORIES, CATEGORY_ICONS, TN_DISTRICTS, formatPrice } from "../api.js";
import { useCart } from "../CartContext.jsx";
import { useAuth } from "../AuthContext.jsx";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

function ProductCard({ p, deliverToDistrict }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const showImage = p.image && !imgFailed;
  const inStock = p.availability === "Available" && p.quantity > 0;

  // Approximate delivery charge display based on location
  const isSame =
    p.district &&
    deliverToDistrict &&
    p.district.toLowerCase() === deliverToDistrict.toLowerCase();
  const estDeliveryFee = isSame ? 35 : 60;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!inStock || adding) return;

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setAdding(true);
      await addToCart(p._id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mp-card">
      <div className="mp-card-media">
        {showImage ? (
          <img src={p.image} alt={p.name} onError={() => setImgFailed(true)} loading="lazy" />
        ) : (
          <div className="mp-card-emoji">{CATEGORY_ICONS[p.category] || "🧺"}</div>
        )}
        {p.organic && <span className="mp-organic">🍃 Organic</span>}
        {p.isSample && (
          <span
            className="badge bg-dark bg-opacity-75 text-white position-absolute bottom-0 end-0 m-2 font-monospace"
            style={{ fontSize: "10px" }}
          >
            Verified Produce
          </span>
        )}
      </div>

      <div className="mp-card-body">
        <h3 className="mp-card-title">{p.name}</h3>
        <div className="mp-card-cat">{p.category}</div>

        <div className="mp-card-farmer d-flex align-items-center gap-1 flex-wrap">
          <span>🧑‍🌾 {p.farmer?.name || "Verified Farmer"}</span>
          {p.farmer?.farmerId && (
            <span className="badge bg-warning text-dark font-monospace" style={{ fontSize: "10px" }}>
              {p.farmer.farmerId}
            </span>
          )}
        </div>

        <div className="mp-card-loc">📍 {p.location || p.district}</div>
        {p.harvestDate && <div className="mp-card-loc text-muted small">🌾 Harvested {fmtDate(p.harvestDate)}</div>}

        <div className="d-flex justify-content-between align-items-baseline mt-2">
          <div>
            <div className="mp-price-label">Farmer price</div>
            <div className="mp-price">
              ₹{p.price} <span>/ {p.unit}</span>
            </div>
          </div>
          <div className="text-end">
            <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: "11px" }}>
              🚚 Est: ₹{estDeliveryFee}
            </span>
          </div>
        </div>

        <div className="mp-card-qty text-muted mt-1 small">
          Available: <strong className={inStock ? "text-dark" : "text-danger"}>{p.quantity} {p.unit}</strong>
        </div>

        <div className={`mp-status ${inStock ? "ok" : "out"} mt-1 small`}>
          {inStock ? "🟢 Available In Stock" : "🔴 Sold Out"}
        </div>

        <div className="mt-3 d-flex gap-2">
          <Link className="btn btn-outline-success flex-grow-1 btn-sm fw-semibold" to={`/product/${p._id}`}>
            Details
          </Link>
          <button
            className={`btn btn-sm px-3 fw-bold ${
              added ? "btn-success" : inStock ? "btn-warning text-dark" : "btn-secondary"
            }`}
            onClick={handleAddToCart}
            disabled={!inStock || adding}
          >
            {added ? "Added ✓" : adding ? "..." : inStock ? "Add 🛒" : "Sold Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { itemCount } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("All");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("recommended");
  const [visibleCount, setVisibleCount] = useState(16);

  const [deliverTo, setDeliverTo] = useState(
    localStorage.getItem("deliveryDistrict") || "Chennai"
  );
  const [editingLoc, setEditingLoc] = useState(false);
  const [locDraft, setLocDraft] = useState(deliverTo);

  useEffect(() => {
    api
      .get("/products?limit=150")
      .then((r) => setProducts(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.category} ${p.farmer?.name || ""} ${p.location} ${p.district || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (category && p.category !== category) return false;
      if (district && district !== "All" && p.district && !p.district.toLowerCase().includes(district.toLowerCase()))
        return false;
      if (organicOnly && !p.organic) return false;
      if (minPrice !== "" && p.price < Number(minPrice)) return false;
      if (maxPrice !== "" && p.price > Number(maxPrice)) return false;
      if (availability === "Available" && !(p.availability === "Available" && p.quantity > 0)) return false;
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
  }, [products, search, category, district, organicOnly, minPrice, maxPrice, availability, sort]);

  const saveLocation = () => {
    const v = locDraft.trim();
    setDeliverTo(v);
    if (v) localStorage.setItem("deliveryDistrict", v);
    setEditingLoc(false);
  };

  return (
    <div className="mp pb-5">
      <style>{`
        .mp-hero {
          background: linear-gradient(135deg, #176b35, #2e7d32);
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
          display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; align-items: end;
        }
        .mp-filters label { display: block; font-size: 12px; font-weight: 700; color: #5a6b5a; margin-bottom: 4px; }
        .mp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
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
        .mp-card-title { font-size: 19px; font-weight: 800; margin: 0; color: #172b18; }
        .mp-card-cat { color: #6b7b6b; font-size: 13px; margin-bottom: 6px; }
        .mp-price-label { font-size: 11px; text-transform: uppercase; color: #6b7b6b; font-weight: 700; }
        .mp-price { font-size: 22px; font-weight: 800; color: #176b35; }
        .mp-price span { font-size: 14px; color: #6b7b6b; font-weight: 600; }
        .mp-status.ok { color: #1c8a35; font-weight: 700; }
        .mp-status.out { color: #b42318; font-weight: 700; }
      `}</style>

      {/* HERO SECTION */}
      <div className="mp-hero">
        <h1>Fresh from Tamil Nadu Farms to Your Doorstep</h1>
        <p>
          Direct harvest from 50+ local growers in Dindigul, Salem, Thanjavur, Pollachi & Nilgiris. Zero middlemen.
        </p>

        <div className="mp-search-row">
          <input
            className="mp-search"
            placeholder="Search crops e.g. Tomato, Small Onion, Seeraga Samba, Tender Coconut..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="mp-loc">
            <span>📍 Deliver to:</span>
            {editingLoc ? (
              <div className="d-flex gap-1">
                <select
                  className="form-select form-select-sm"
                  value={locDraft}
                  onChange={(e) => setLocDraft(e.target.value)}
                  style={{ width: "160px" }}
                >
                  {TN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={saveLocation}>
                  OK
                </button>
              </div>
            ) : (
              <>
                <strong>{deliverTo}</strong>
                <button type="button" onClick={() => setEditingLoc(true)}>
                  Change
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PERSISTENT CART BAR WHEN ITEMS IN CART */}
      {itemCount > 0 && (
        <div className="alert alert-warning d-flex justify-content-between align-items-center rounded-4 shadow-sm border border-warning mb-3 px-4 py-3">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-5">🛒</span>
            <span>
              You have <strong>{itemCount} item(s)</strong> in your harvest cart.
            </span>
          </div>
          <Link to="/cart" className="btn btn-sm btn-success fw-bold px-3">
            View Cart & Checkout →
          </Link>
        </div>
      )}

      {/* QUICK MANDI TICKER BANNER */}
      <div className="alert alert-success d-flex justify-content-between align-items-center rounded-4 shadow-sm border-0 mb-3 px-4 py-3">
        <div className="d-flex align-items-center gap-2">
          <span>📈</span>
          <span className="small">
            <strong>Check Official Wholesale Rates:</strong> Compare our farmer direct prices with AGMARKNET Mandi benchmark rates.
          </span>
        </div>
        <Link to="/market-prices" className="btn btn-sm btn-outline-success fw-bold text-nowrap">
          View Mandi Rates →
        </Link>
      </div>

      {/* CATEGORY FILTER PILLS */}
      <div className="mp-cats">
        <button
          className={`mp-cat ${category === "" ? "active" : ""}`}
          onClick={() => setCategory("")}
        >
          🧺 All Harvest ({products.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`mp-cat ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(category === cat ? "" : cat)}
          >
            {CATEGORY_ICONS[cat] || "🧺"} {cat}
          </button>
        ))}
      </div>

      {/* FILTER CONTROLS */}
      <div className="mp-filters">
        <div>
          <label>Filter by District</label>
          <select
            className="form-select form-select-sm"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="All">All Tamil Nadu</option>
            {TN_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Availability</label>
          <select
            className="form-select form-select-sm"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Available">In Stock Only</option>
          </select>
        </div>

        <div>
          <label>Sort By</label>
          <select
            className="form-select form-select-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recommended">Recommended</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
            <option value="recent">Recently Harvested</option>
          </select>
        </div>

        <div className="d-flex align-items-center pb-2">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="orgCheck"
              checked={organicOnly}
              onChange={(e) => setOrganicOnly(e.target.checked)}
            />
            <label className="form-check-label small fw-semibold" htmlFor="orgCheck">
              🍃 Organic Only
            </label>
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              setSearch("");
              setCategory("");
              setDistrict("All");
              setOrganicOnly(false);
              setAvailability("");
              setSort("recommended");
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* COUNT INFO */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-muted fw-semibold">
          Showing {Math.min(visibleCount, shown.length)} of {shown.length} available produce listings
        </span>
      </div>

      {/* PRODUCT GRID */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status" />
          <p className="mt-2 text-muted">Loading fresh produce...</p>
        </div>
      ) : (
        <>
          <div className="mp-grid">
            {shown.slice(0, visibleCount).map((p) => (
              <ProductCard key={p._id} p={p} deliverToDistrict={deliverTo} />
            ))}
          </div>

          {shown.length === 0 && (
            <div className="text-center py-5 bg-white rounded-4 shadow-sm">
              <div className="fs-1">🌾</div>
              <h5 className="fw-bold mt-2">No matching harvest found</h5>
              <p className="text-muted small">Try selecting "All Categories" or changing your district filter.</p>
            </div>
          )}

          {visibleCount < shown.length && (
            <div className="text-center mt-5">
              <button
                className="btn btn-success fw-bold px-5 py-2 shadow-sm"
                onClick={() => setVisibleCount((prev) => prev + 16)}
              >
                Load More Produce ({shown.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}