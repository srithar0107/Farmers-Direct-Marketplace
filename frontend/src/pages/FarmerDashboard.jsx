import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg, formatPrice, formatDate, CATEGORY_ICONS } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { t, getLang, setLang } from "../i18n.js";
import InvoiceModal from "../components/InvoiceModal.jsx";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [lang, setLanguage] = useState(getLang());
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [marketRef, setMarketRef] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState(null);

  // Quick edit modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editStatus, setEditStatus] = useState("Available");
  const [saveBusy, setSaveBusy] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, prodRes, ordRes, notifRes, mandiRes] = await Promise.all([
        api.get("/products/farmer-stats"),
        api.get("/products/mine"),
        api.get("/orders/farmer"),
        api.get("/notifications"),
        api.get("/market-prices?limit=5")
      ]);
      setStats(statsRes.data);
      setProducts(prodRes.data);
      setOrders(ordRes.data);
      setNotifications(notifRes.data.notifications || []);
      setMarketRef(mandiRes.data.data?.slice(0, 5) || []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openQuickEdit = (p) => {
    setEditingProduct(p);
    setEditPrice(p.price);
    setEditQty(p.quantity);
    setEditStatus(p.availability);
  };

  const saveQuickEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setSaveBusy(true);
      await api.put(`/products/${editingProduct._id}`, {
        price: Number(editPrice),
        quantity: Number(editQty),
        availability: Number(editQty) > 0 ? editStatus : "Out of Stock"
      });
      setEditingProduct(null);
      await loadData();
    } catch (err) {
      alert("Error saving: " + errMsg(err));
    } finally {
      setSaveBusy(false);
    }
  };

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      loadData();
    } catch (e) {
      alert(errMsg(e));
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      loadData();
    } catch (e) {
      alert(errMsg(e));
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.warn(e);
    }
  };

  // Find products that are low stock or out of stock
  const alertProducts = products.filter(
    (p) => p.quantity === 0 || p.quantity <= (p.lowStockThreshold || 10)
  );

  return (
    <div className="farmer-dashboard pb-5">
      {/* 1. FARMER PROFILE HEADER */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" style={{ background: "linear-gradient(135deg, #1b5e20, #2e7d32)" }}>
        <div className="card-body p-4 text-white">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="fs-3">🧑‍🌾</span>
                <h2 className="fw-bold mb-0 text-white">{user?.name}</h2>
                {user?.farmerId && (
                  <span className="badge bg-warning text-dark font-monospace fs-6 px-3 py-2">
                    ID: {user.farmerId}
                  </span>
                )}
              </div>
              <p className="text-white-50 mb-0">
                📍 {user?.location || user?.district || "Tamil Nadu, India"} | 📞 {user?.phone || "No phone added"}
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* LANGUAGE SELECTOR */}
              <div className="btn-group btn-group-sm me-2 bg-white bg-opacity-25 rounded-pill p-1">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold ${lang === "en" ? "btn-light text-success" : "text-white"}`}
                  onClick={() => {
                    setLang("en");
                    setLanguage("en");
                  }}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold ${lang === "ta" ? "btn-light text-success" : "text-white"}`}
                  onClick={() => {
                    setLang("ta");
                    setLanguage("ta");
                  }}
                >
                  தமிழ்
                </button>
              </div>

              <Link to="/farmer/products/add" className="btn btn-warning fw-bold text-dark px-4 py-2 shadow-sm">
                ➕ {t("addNewCrop", lang)}
              </Link>
              <Link to="/market-prices" className="btn btn-outline-light px-3 py-2">
                📈 {t("mandiLiveRates", lang)}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger shadow-sm rounded-3">{error}</div>}

      {/* 2. CRITICAL LOW STOCK & SOLD OUT ALERTS */}
      {alertProducts.length > 0 && (
        <div className="card border-danger border-2 shadow-sm rounded-4 mb-4 bg-danger-subtle">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="fw-bold text-danger mb-0 d-flex align-items-center gap-2">
                <span>⚠️</span> {t("stockAlertTitle", lang)} ({alertProducts.length})
              </h5>
              <span className="badge bg-danger">Critical Alerts</span>
            </div>
            <p className="text-muted small mb-3">
              {lang === "ta"
                ? "கீழே உள்ள பயிர்கள் விற்றுத் தீர்ந்துள்ளன அல்லது கையிருப்பு மிகக் குறைவாக உள்ளன. புதிய ஆர்டர்களைப் பெற கையிருப்பை புதுப்பிக்கவும்."
                : "The following crops are low in stock or sold out. SMS alerts have been logged for these items. Update their stock to accept new orders."}
            </p>
            <div className="row g-2">
              {alertProducts.map((p) => {
                const isZero = p.quantity === 0;
                return (
                  <div className="col-md-6 col-lg-4" key={p._id}>
                    <div className="p-3 bg-white rounded-3 border border-danger-subtle shadow-sm d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold text-dark">{p.name}</div>
                        <div className="small text-danger fw-semibold">
                          {isZero ? "🔴 SOLD OUT (0 remaining)" : `🟠 LOW STOCK (${p.quantity} ${p.unit} remaining)`}
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-success fw-bold"
                        onClick={() => openQuickEdit(p)}
                      >
                        {t("restockBtn", lang)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. KEY METRICS CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 text-center p-3 h-100 bg-white">
            <div className="fs-1 text-success fw-bold">{stats?.totalProducts ?? products.length}</div>
            <div className="text-muted small fw-semibold text-uppercase">{t("listedCrops", lang)}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 text-center p-3 h-100 bg-white">
            <div className="fs-1 text-primary fw-bold">{stats?.totalStockUnits ?? 0}</div>
            <div className="text-muted small fw-semibold text-uppercase">{t("inStockUnits", lang)}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 text-center p-3 h-100 bg-white">
            <div className="fs-1 text-info fw-bold">{stats?.totalSoldUnits ?? 0}</div>
            <div className="text-muted small fw-semibold text-uppercase">{t("soldUnits", lang)}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 text-center p-3 h-100 bg-white">
            <div className="fs-1 text-success fw-bold">{formatPrice(stats?.totalRevenue ?? 0)}</div>
            <div className="text-muted small fw-semibold text-uppercase">{t("salesRevenue", lang)}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* LEFT COLUMN: LISTED PRODUCTS MANAGEMENT */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-success">🌱 My Listed Produce & Stock</h5>
              <Link to="/farmer/products/add" className="btn btn-sm btn-success fw-semibold">
                + Add Crop
              </Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Crop</th>
                      <th>Category</th>
                      <th>Selling Price</th>
                      <th>Available Stock</th>
                      <th>Sold</th>
                      <th>Status</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const isLow = p.quantity > 0 && p.quantity <= (p.lowStockThreshold || 10);
                      const isOut = p.quantity === 0 || p.availability === "Out of Stock";

                      return (
                        <tr key={p._id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center gap-2">
                              <span className="fs-4">{CATEGORY_ICONS[p.category] || "🧺"}</span>
                              <div>
                                <div className="fw-bold text-dark">{p.name}</div>
                                <div className="small text-muted">{p.location}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary border">
                              {p.category}
                            </span>
                          </td>
                          <td className="fw-bold text-success font-monospace">
                            {formatPrice(p.price)} / {p.unit}
                          </td>
                          <td className="font-monospace">
                            <span className={`fw-bold ${isOut ? "text-danger" : isLow ? "text-warning" : "text-dark"}`}>
                              {p.quantity} {p.unit}
                            </span>
                          </td>
                          <td className="font-monospace text-muted">
                            {p.soldQuantity || 0} {p.unit}
                          </td>
                          <td>
                            {isOut ? (
                              <span className="badge bg-danger">Sold Out</span>
                            ) : isLow ? (
                              <span className="badge bg-warning text-dark">Low Stock</span>
                            ) : (
                              <span className="badge bg-success">In Stock</span>
                            )}
                          </td>
                          <td className="text-end pe-4">
                            <button
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => openQuickEdit(p)}
                              title="Quick update price & stock"
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteProduct(p._id, p.name)}
                              title="Delete listing"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {products.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          You haven't listed any crops yet. Click "Add New Crop" above to start selling directly to customers!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RECENT ORDERS RECEIVED */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
              <h5 className="fw-bold mb-0 text-success">📦 Recent Orders for Your Crops</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Order #</th>
                      <th>Customer & Address</th>
                      <th>Crops Ordered</th>
                      <th>Your Earnings</th>
                      <th>Status</th>
                      <th className="text-end pe-4">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => (
                      <tr key={ord._id}>
                        <td className="ps-4">
                          <div className="fw-bold font-monospace text-success">{ord.orderNumber}</div>
                          <div className="small text-muted">{formatDate(ord.createdAt)}</div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{ord.deliveryAddress.name}</div>
                          <div className="small text-muted text-truncate" style={{ maxWidth: 200 }}>
                            {ord.deliveryAddress.address}, {ord.deliveryAddress.district}
                          </div>
                          <div className="small text-muted">📞 {ord.deliveryAddress.phone}</div>
                        </td>
                        <td>
                          {(ord.myItems || ord.items).map((it, idx) => (
                            <div key={idx} className="small">
                              • <strong>{it.quantity} {it.unit}</strong> of {it.name}
                            </div>
                          ))}
                        </td>
                        <td className="fw-bold text-success font-monospace">
                          {formatPrice(ord.mySubtotal || ord.subtotal)}
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={ord.status}
                            disabled={ord.status === "Cancelled" || ord.status === "Delivered"}
                            onChange={(e) => updateOrderStatus(ord._id, e.target.value)}
                          >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Packed">Packed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="text-end pe-4">
                          <button
                            className="btn btn-sm btn-outline-success fw-semibold"
                            onClick={() => setSelectedInvoiceOrderId(ord._id)}
                          >
                            View Invoice
                          </button>
                        </td>
                      </tr>
                    ))}

                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">
                          No orders received yet. Once customers buy your harvest, orders will appear here!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MANDI LIVE RATES & NOTIFICATION HISTORY */}
        <div className="col-lg-4">
          {/* MANDI MARKET PRICE REFERENCE CARD */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-success">📈 Mandi Live Rates</h5>
              <Link to="/market-prices" className="btn btn-sm btn-outline-success">
                View All
              </Link>
            </div>
            <div className="card-body p-4 pt-2">
              <p className="small text-muted mb-3">
                Official APMC / AGMARKNET wholesale prices across Tamil Nadu. Use these modal rates to price your direct produce competitively!
              </p>
              <div className="d-flex flex-column gap-2">
                {marketRef.map((m, idx) => (
                  <div key={idx} className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold text-dark">{m.commodity}</div>
                      <div className="small text-muted">{m.market} ({m.district})</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-success font-monospace">
                        {formatPrice(m.modalPrice)} / {m.unit}
                      </div>
                      <div className="small text-muted">Modal Price</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NOTIFICATION LOG & SMS ALERTS */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-success">🔔 In-App & SMS Alerts</h5>
              {notifications.length > 0 && (
                <button className="btn btn-sm btn-link text-muted" onClick={markAllRead}>
                  Mark read
                </button>
              )}
            </div>
            <div className="card-body p-4 pt-2">
              <div className="d-flex flex-column gap-2" style={{ maxHeight: 420, overflowY: "auto" }}>
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`p-3 rounded-3 border ${
                      n.alertType === "sold_out"
                        ? "bg-danger-subtle border-danger"
                        : n.alertType === "low_stock"
                        ? "bg-warning-subtle border-warning"
                        : "bg-light border-secondary-subtle"
                    }`}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <strong className="text-dark small">{n.title}</strong>
                      <span className="badge bg-secondary font-monospace" style={{ fontSize: "10px" }}>
                        {n.smsStatus}
                      </span>
                    </div>
                    <p className="small text-muted mb-1">{n.message}</p>
                    <div className="text-muted" style={{ fontSize: "11px" }}>
                      {formatDate(n.createdAt)} • Provider: {n.smsProvider}
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <p className="text-center text-muted py-4 mb-0 small">
                    No alerts yet. When stock gets low or an order is placed, alerts will appear here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK EDIT MODAL */}
      {editingProduct && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <form onSubmit={saveQuickEdit}>
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title fw-bold">
                    Update {editingProduct.name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setEditingProduct(null)}
                  />
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Selling Price (₹ per {editingProduct.unit})
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Available Stock Quantity ({editingProduct.unit})
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      required
                    />
                    <div className="form-text">
                      Set to 0 to mark as Sold Out. Setting higher will automatically make it Available.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Availability Status</label>
                    <select
                      className="form-select"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="Available">Available</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setEditingProduct(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success fw-bold" disabled={saveBusy}>
                    {saveBusy ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW INVOICE MODAL */}
      {selectedInvoiceOrderId && (
        <InvoiceModal
          orderId={selectedInvoiceOrderId}
          onClose={() => setSelectedInvoiceOrderId(null)}
        />
      )}
    </div>
  );
}
