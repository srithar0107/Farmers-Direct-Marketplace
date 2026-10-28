import { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api, { errMsg, CATEGORY_ICONS, TN_DISTRICTS, formatPrice, formatDate } from "../api.js";
import { useCart } from "../CartContext.jsx";
import { useAuth } from "../AuthContext.jsx";
import { t, getLang } from "../i18n.js";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const { user } = useAuth();
  const lang = getLang();

  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  const [imgFailed, setImgFailed] = useState(false);
  const [qty, setQty] = useState(1);

  // Cart actions state
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedSuccessToast, setAddedSuccessToast] = useState("");
  const [buyingNow, setBuyingNow] = useState(false);

  // Delivery Location State (Defaults from user profile or saved local storage)
  const [deliverToDistrict, setDeliverToDistrict] = useState(
    user?.district || localStorage.getItem("deliveryDistrict") || "Chennai"
  );
  const [customArea, setCustomArea] = useState(
    localStorage.getItem("deliveryArea") || ""
  );
  const [editingLocation, setEditingLocation] = useState(false);

  // Calculated Pricing Breakdown State
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Mandi Wholesale Reference Price State
  const [mandiRef, setMandiRef] = useState(null);
  const [mandiLoading, setMandiLoading] = useState(false);

  // 1. Fetch Product Details
  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((r) => {
        setP(r.data);
        // Look up market price reference for this product
        if (r.data?.name) {
          fetchMandiReference(r.data.name);
        }
      })
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  // 2. Fetch Mandi Reference
  const fetchMandiReference = async (productName) => {
    try {
      setMandiLoading(true);
      const cleanName = productName.split(" ")[0]; // e.g. "Tomato" from "Country Tomato"
      const res = await api.get(`/market-prices/reference?query=${encodeURIComponent(cleanName)}`);
      if (res.data?.found && res.data.records?.length > 0) {
        setMandiRef(res.data.records[0]);
      }
    } catch (e) {
      console.warn("Mandi ref notice:", e.message);
    } finally {
      setMandiLoading(false);
    }
  };

  // 3. Recalculate Final Delivered Price Breakdown automatically whenever qty, location, or product changes
  useEffect(() => {
    if (!p) return;

    if (!deliverToDistrict) {
      setPriceBreakdown(null);
      return;
    }

    const calcDeliveredPrice = async () => {
      try {
        setCalcLoading(true);
        const buyerFullLoc = `${customArea ? customArea + ", " : ""}${deliverToDistrict}, Tamil Nadu`;
        const res = await api.post("/delivery/calculate", {
          farmerLocation: p.location || p.district,
          buyerLocation: buyerFullLoc,
          unitPrice: p.price,
          quantity: qty,
          productId: p._id
        });
        setPriceBreakdown(res.data);
      } catch (err) {
        console.warn("Delivery price calculation fallback:", err.message);
        // Fallback local calculation
        const subtotal = p.price * qty;
        const isSame =
          p.district &&
          deliverToDistrict &&
          p.district.toLowerCase() === deliverToDistrict.toLowerCase();
        const deliveryCharge = isSame ? 35 : 60;
        setPriceBreakdown({
          subtotal,
          deliveryCharge,
          distanceKm: isSame ? 12 : 65,
          isSameDistrict: isSame,
          farmerDistrict: p.district || p.location,
          buyerDistrict: deliverToDistrict,
          handlingCharge: 10,
          platformFee: 5,
          taxAmount: 0,
          taxLabel: "0% GST (Exempt for raw agricultural produce)",
          discountAmount: 0,
          totalDeliveredPrice: subtotal + deliveryCharge + 10 + 5,
          isEstimated: true
        });
      } finally {
        setCalcLoading(false);
      }
    };

    calcDeliveredPrice();
  }, [p, qty, deliverToDistrict, customArea]);

  const handleDistrictChange = (d) => {
    setDeliverToDistrict(d);
    localStorage.setItem("deliveryDistrict", d);
    setEditingLocation(false);
  };

  const handleAreaSave = () => {
    localStorage.setItem("deliveryArea", customArea);
    setEditingLocation(false);
  };

  const inStock = p && p.availability === "Available" && p.quantity > 0;
  const maxQty = Math.max(1, p?.quantity || 1);
  const safeQty = Math.min(Math.max(1, qty), maxQty);
  const showImage = p?.image && !imgFailed;

  const changeQty = (v) => {
    const n = Math.floor(Number(v));
    if (Number.isNaN(n)) return setQty(1);
    setQty(Math.min(Math.max(1, n), maxQty));
  };

  // ADD TO CART WITHOUT REDIRECTION
  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!inStock || addingToCart) return;

    try {
      setAddingToCart(true);
      await addToCart(p._id, safeQty);
      setAddedSuccessToast(
        lang === "ta"
          ? `✓ ${safeQty} ${p.unit} ${p.name} கூடையில் வெற்றிகரமாக சேர்க்கப்பட்டது!`
          : `✓ Added ${safeQty} ${p.unit} of ${p.name} to your cart!`
      );
      setTimeout(() => setAddedSuccessToast(""), 4000);
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setAddingToCart(false);
    }
  };

  // BUY NOW ACTION: Adds item and directs straight to Checkout / Cart
  const handleBuyNow = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!inStock || buyingNow) return;

    try {
      setBuyingNow(true);
      await addToCart(p._id, safeQty);
      navigate("/cart");
    } catch (err) {
      alert(errMsg(err));
      setBuyingNow(false);
    }
  };

  if (error) return <div className="alert alert-danger shadow-sm rounded-4">{error}</div>;
  if (!p) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status" />
        <p className="mt-2 text-muted">Loading fresh produce from farm...</p>
      </div>
    );
  }

  // Mandi benchmark comparison indicator
  const mandiDiff = mandiRef ? p.price - mandiRef.modalPrice : 0;
  const mandiDiffAbs = Math.abs(mandiDiff);

  return (
    <div className="pd-wrapper pb-5">
      <style>{`
        .pd-wrapper { font-family: inherit; }
        .pd-back { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 16px; font-weight: 700; color: #1e7e34; text-decoration: none; font-size: 14px; }
        .pd-back:hover { text-decoration: underline; }
        .pd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
        .pd-media {
          background: #eef6e6; border-radius: 26px; overflow: hidden; min-height: 420px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 12px 36px rgba(30,80,30,0.12); position: relative; border: 1px solid #dce8d6;
        }
        .pd-media img { width: 100%; height: 100%; max-height: 540px; object-fit: cover; display: block; }
        .pd-emoji { font-size: 140px; }
        .pd-organic {
          position: absolute; top: 16px; left: 16px; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
          color: #1c8a35; font-weight: 800; font-size: 13px; padding: 6px 14px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .pd-panel {
          background: #fff; border-radius: 26px; padding: 32px;
          box-shadow: 0 12px 36px rgba(30,80,30,0.10); border: 1px solid #e2ece0;
        }
        .pd-title { font-size: clamp(28px, 4vw, 38px); font-weight: 800; margin: 0; color: #172b18; letter-spacing: -1px; }
        .pd-cat { color: #5b6f5d; font-size: 15px; margin: 4px 0 16px; display: flex; align-items: center; gap: 6px; }
        .pd-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; }
        .pd-price { font-size: 38px; font-weight: 900; color: #176b35; line-height: 1; }
        .pd-price span { font-size: 18px; font-weight: 600; color: #6b7b6b; }
        .pd-status-pill {
          display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700;
          padding: 4px 12px; border-radius: 12px; margin-bottom: 16px;
        }
        .pd-status-pill.ok { background: #e8f5e9; color: #1e7e34; }
        .pd-status-pill.out { background: #ffebee; color: #c62828; }
        .pd-box { background: #f8faf5; border-radius: 18px; padding: 18px 20px; margin-top: 18px; border: 1px solid #e6eee2; }
        .pd-box h3 { font-size: 15px; font-weight: 800; margin: 0 0 10px; color: #172b18; display: flex; align-items: center; gap: 6px; }
        .pd-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 6px 0; font-size: 14.5px; }
        .pd-row.total { border-top: 2px dashed #c8dec3; margin-top: 8px; padding-top: 14px; font-size: 18px; font-weight: 800; color: #176b35; }
        .pd-qty-control { display: inline-flex; align-items: center; gap: 8px; }
        .pd-qty-btn {
          width: 44px; height: 44px; border-radius: 12px; border: 1px solid #c8dcc3;
          background: #fff; font-size: 20px; font-weight: 700; color: #176b35; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .pd-qty-btn:hover:not(:disabled) { background: #176b35; color: #fff; }
        .pd-qty-input { width: 80px; height: 44px; text-align: center; border: 1px solid #c8dcc3; border-radius: 12px; font-size: 17px; font-weight: 800; font-family: monospace; }
        @media (max-width: 860px) {
          .pd-grid { grid-template-columns: 1fr; }
          .pd-media { min-height: 280px; }
          .pd-panel { padding: 22px; }
        }
      `}</style>

      {/* BACK NAVIGATION */}
      <Link to="/marketplace" className="pd-back">
        ← {lang === "ta" ? "சந்தைக்குத் திரும்பு" : "Back to Fresh Produce Marketplace"}
      </Link>

      {/* FLOATING SUCCESS NOTIFICATION WHEN ADDED TO CART */}
      {addedSuccessToast && (
        <div className="alert alert-success d-flex justify-content-between align-items-center shadow-lg rounded-4 p-3 mb-4 border-2 border-success">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-4">🎉</span>
            <strong className="fs-6">{addedSuccessToast}</strong>
          </div>
          <div className="d-flex gap-2">
            <Link to="/cart" className="btn btn-sm btn-success fw-bold px-3">
              🛒 {lang === "ta" ? "கூடைக்கு செல்" : "View Cart & Checkout"} →
            </Link>
            <button
              type="button"
              className="btn-close"
              onClick={() => setAddedSuccessToast("")}
            />
          </div>
        </div>
      )}

      <div className="pd-grid">
        {/* LEFT COLUMN: PRODUCT IMAGE & QUALITY METADATA */}
        <div>
          <div className="pd-media">
            {showImage ? (
              <img src={p.image} alt={p.name} onError={() => setImgFailed(true)} />
            ) : (
              <div className="pd-emoji">{CATEGORY_ICONS[p.category] || "🧺"}</div>
            )}
            {p.organic && <span className="pd-organic">🍃 100% Organic Certified</span>}
          </div>

          {/* FARMER PROFILE & TRACEABILITY CARD */}
          <div className="pd-box mt-3">
            <h3>👨‍🌾 {lang === "ta" ? "விவசாயி தகவல் & பண்ணை பின்னணி" : "Farmer & Farm-to-Table Traceability"}</h3>
            <div className="pd-row">
              <span className="text-muted">Grower / Producer:</span>
              <div className="text-end">
                <strong>{p.farmer?.name || "Verified Farmer"}</strong>
                {p.farmer?.farmerId && (
                  <span className="badge bg-warning text-dark font-monospace ms-2" style={{ fontSize: "11px" }}>
                    {p.farmer.farmerId}
                  </span>
                )}
              </div>
            </div>
            <div className="pd-row">
              <span className="text-muted">Farm Location:</span>
              <strong>📍 {p.location || p.district}</strong>
            </div>
            {p.farmer?.phone && (
              <div className="pd-row">
                <span className="text-muted">Registered Phone:</span>
                <strong className="font-monospace">📞 {p.farmer.phone}</strong>
              </div>
            )}
            {p.harvestDate && (
              <div className="pd-row">
                <span className="text-muted">Fresh Harvest Date:</span>
                <strong className="text-success">🌾 {formatDate(p.harvestDate)}</strong>
              </div>
            )}
            <div className="pd-row">
              <span className="text-muted">Platform Assurance:</span>
              <span className="badge bg-success-subtle text-success border border-success-subtle">
                ✓ 100% Direct Farmer Payout
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRICING BREAKDOWN, LOCATION CALCULATOR & ACTIONS */}
        <div className="pd-panel">
          <h1 className="pd-title">{p.name}</h1>
          <div className="pd-cat">
            <span>{CATEGORY_ICONS[p.category] || "🧺"}</span>
            <span className="fw-semibold">{p.category}</span>
            <span>•</span>
            <span>📍 {p.district || p.location}</span>
          </div>

          {/* FARMER SELLING PRICE */}
          <div className="pd-price-row">
            <div className="pd-price">
              {formatPrice(p.price)} <span>/ {p.unit}</span>
            </div>
          </div>

          {/* STOCK STATUS */}
          <div className={`pd-status-pill ${inStock ? "ok" : "out"}`}>
            {inStock ? (
              <>🟢 {lang === "ta" ? `கையிருப்பில் உள்ளது: ${p.quantity} ${p.unit}` : `In Stock: ${p.quantity} ${p.unit} available`}</>
            ) : (
              <>🔴 {lang === "ta" ? "விற்றுத் தீர்ந்தது (Sold Out)" : "Currently Out of Stock"}</>
            )}
          </div>

          {/* OFFICIAL MANDI WHOLESALE BENCHMARK RATE CARD */}
          {mandiRef && (
            <div className="p-3 mb-3 rounded-4 bg-success bg-opacity-10 border border-success border-opacity-25">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-bold text-success d-flex align-items-center gap-1">
                  <span>🏛️</span> {t("mandiBenchmark", lang)}
                </span>
                <span className="badge bg-success font-monospace" style={{ fontSize: "11px" }}>
                  Official AGMARKNET
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-baseline">
                <div>
                  <div className="fw-bold fs-5 text-dark font-monospace">
                    {formatPrice(mandiRef.modalPrice)} / {mandiRef.unit}
                  </div>
                  <div className="small text-muted" style={{ fontSize: "11px" }}>
                    Mandi: {mandiRef.market} ({mandiRef.district}) • Date: {formatDate(mandiRef.priceDate)}
                  </div>
                </div>
                <div className="text-end">
                  {mandiDiff < 0 ? (
                    <span className="badge bg-success p-2">
                      Save {formatPrice(mandiDiffAbs)}/{p.unit} vs wholesale!
                    </span>
                  ) : mandiDiff === 0 ? (
                    <span className="badge bg-primary p-2">Matches mandi benchmark</span>
                  ) : (
                    <span className="badge bg-light text-secondary border p-2">
                      Fresh farm direct quality
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <p className="text-secondary mb-3" style={{ lineHeight: "1.6" }}>
            {p.description || "Farm fresh harvest sourced directly from registered growers in Tamil Nadu."}
          </p>

          {/* QUANTITY CONTROLS */}
          <div className="pd-box">
            <h3>⚖️ {lang === "ta" ? "தேவையான அளவு" : "Select Quantity"}</h3>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="pd-qty-control">
                <button
                  type="button"
                  className="pd-qty-btn"
                  onClick={() => changeQty(safeQty - 1)}
                  disabled={!inStock || safeQty <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  className="pd-qty-input"
                  min="1"
                  max={maxQty}
                  value={safeQty}
                  disabled={!inStock}
                  onChange={(e) => changeQty(e.target.value)}
                />
                <button
                  type="button"
                  className="pd-qty-btn"
                  onClick={() => changeQty(safeQty + 1)}
                  disabled={!inStock || safeQty >= maxQty}
                >
                  +
                </button>
                <span className="fw-bold text-dark ms-2">{p.unit}</span>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">Item Subtotal:</span>
                <strong className="fs-5 text-success font-monospace">
                  {formatPrice(p.price * safeQty)}
                </strong>
              </div>
            </div>
          </div>

          {/* DELIVERY LOCATION SELECTOR */}
          <div className="pd-box">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3>📍 {t("deliveryLocation", lang)}</h3>
              <button
                type="button"
                className="btn btn-sm btn-link text-success p-0 fw-bold"
                onClick={() => setEditingLocation(!editingLocation)}
              >
                {editingLocation ? "Cancel" : deliverToDistrict ? "Change District" : "Select District"}
              </button>
            </div>

            {editingLocation ? (
              <div className="p-3 bg-white rounded-3 border">
                <label className="form-label small fw-bold text-dark">
                  Select your Tamil Nadu Delivery District:
                </label>
                <div className="d-flex gap-2 mb-2">
                  <select
                    className="form-select form-select-sm"
                    value={deliverToDistrict}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                  >
                    {TN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Specific locality / area (Optional e.g. Anna Nagar)"
                    value={customArea}
                    onChange={(e) => setCustomArea(e.target.value)}
                  />
                  <button type="button" className="btn btn-sm btn-success px-3" onClick={handleAreaSave}>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong className="text-dark fs-6">
                    {customArea ? `${customArea}, ` : ""}
                    {deliverToDistrict || "Not selected yet"}
                  </strong>
                  <div className="small text-muted">
                    {priceBreakdown?.isSameDistrict
                      ? "🟢 Local Delivery (Same district as farm)"
                      : priceBreakdown
                      ? `🚚 Inter-District (${priceBreakdown.distanceKm} km from ${priceBreakdown.farmerDistrict})`
                      : "Delivery charge will be calculated automatically."}
                  </div>
                </div>
                <span className="badge bg-light text-dark border">Tamil Nadu</span>
              </div>
            )}
          </div>

          {/* LIVE PRICE BREAKDOWN BOX WITH FORMULA CALCULATIONS */}
          <div className="pd-box border-success border-opacity-50">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <h3 className="mb-0 text-success">
                💵 {t("priceBreakdown", lang)}
              </h3>
              {calcLoading && <span className="spinner-border spinner-border-sm text-success" />}
            </div>
            <p className="small text-muted mb-3" style={{ fontSize: "12px" }}>
              Formula: Delivered Price = Produce Subtotal + Transport Charge + Handling + Platform Fee + Tax - Discounts
            </p>

            {/* Produce Subtotal */}
            <div className="pd-row">
              <span>
                Farmer Produce Price ({safeQty} {p.unit} × {formatPrice(p.price)})
              </span>
              <strong className="font-monospace">{formatPrice(p.price * safeQty)}</strong>
            </div>

            {/* Transport / Delivery */}
            <div className="pd-row">
              <span className="d-flex align-items-center gap-1">
                <span>Transport / Delivery Charge:</span>
                {priceBreakdown?.isSameDistrict && (
                  <span className="badge bg-success-subtle text-success" style={{ fontSize: "10px" }}>
                    Flat Local Rate
                  </span>
                )}
              </span>
              {priceBreakdown ? (
                <strong className="font-monospace">
                  {formatPrice(priceBreakdown.deliveryCharge)}
                </strong>
              ) : (
                <span className="text-warning fw-semibold small">
                  Select district to calculate
                </span>
              )}
            </div>

            {/* Packaging & Handling */}
            <div className="pd-row">
              <span>Packaging & Careful Produce Handling:</span>
              <strong className="font-monospace">
                {priceBreakdown ? formatPrice(priceBreakdown.handlingCharge) : "₹10.00"}
              </strong>
            </div>

            {/* Platform Maintenance & Farmer Support Fee */}
            <div className="pd-row">
              <span>Platform Maintenance & Support Fee:</span>
              <strong className="font-monospace">
                {priceBreakdown ? formatPrice(priceBreakdown.platformFee) : "₹5.00"}
              </strong>
            </div>

            {/* Agricultural Tax */}
            <div className="pd-row">
              <span>Agricultural Produce Tax:</span>
              <span className="text-muted font-monospace small">
                ₹0.00 (0% GST Exempted)
              </span>
            </div>

            {/* Final Delivered Price */}
            <div className="pd-row total">
              <span>{t("finalDeliveredPrice", lang)}:</span>
              <span className="font-monospace fs-4">
                {priceBreakdown
                  ? formatPrice(priceBreakdown.totalDeliveredPrice)
                  : formatPrice(p.price * safeQty + 50)}
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS: ADD TO CART & BUY NOW */}
          <div className="mt-4 d-flex gap-2 flex-wrap">
            {/* ADD TO CART: DOES NOT REDIRECT */}
            <button
              type="button"
              className={`btn btn-lg flex-grow-1 fw-bold ${
                inStock ? "btn-warning text-dark shadow-sm" : "btn-secondary"
              }`}
              disabled={!inStock || addingToCart}
              onClick={handleAddToCart}
            >
              {addingToCart
                ? t("processing", lang)
                : inStock
                ? `🛒 ${t("addToCart", lang)} (${safeQty} ${p.unit})`
                : t("outOfStock", lang)}
            </button>

            {/* BUY NOW: TAKES USER TO CHECKOUT / CART */}
            <button
              type="button"
              className="btn btn-success btn-lg fw-bold px-4 shadow-sm"
              disabled={!inStock || buyingNow}
              onClick={handleBuyNow}
            >
              {buyingNow ? "..." : `⚡ ${t("buyNow", lang)}`}
            </button>

            {/* VIEW CART LINK */}
            <Link to="/cart" className="btn btn-outline-success btn-lg fw-semibold px-3">
              📑 {t("viewCart", lang)}
            </Link>
          </div>

          <div className="text-center mt-3 text-muted small">
            🔒 Secure checkout • Pay on Delivery (Cash or UPI directly to Farmer)
          </div>
        </div>
      </div>
    </div>
  );
}