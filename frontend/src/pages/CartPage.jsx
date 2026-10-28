import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg, formatPrice, TN_DISTRICTS, CATEGORY_ICONS } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { useCart } from "../CartContext.jsx";
import InvoiceModal from "../components/InvoiceModal.jsx";

export default function CartPage() {
  const { user } = useAuth();
  const { cart, loading, updateQuantity, removeItem, fetchCart } = useCart();
  const navigate = useNavigate();

  const [deliveryName, setDeliveryName] = useState(user?.name || "");
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || "");
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || "");
  const [deliveryDistrict, setDeliveryDistrict] = useState(
    user?.district || localStorage.getItem("deliveryDistrict") || "Chennai"
  );

  const [deliveryFee, setDeliveryFee] = useState(35);
  const [shipmentDetails, setShipmentDetails] = useState([]);
  const [handlingFee] = useState(10);
  const [platformFee] = useState(5);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [error, setError] = useState("");
  const [successOrder, setSuccessOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const items = cart?.items || [];
  const subtotal = items.reduce(
    (acc, it) => acc + (it.product ? it.product.price * it.quantity : 0),
    0
  );

  // Recalculate distance-based delivery fee when items or district changes
  useEffect(() => {
    if (items.length === 0) {
      setDeliveryFee(0);
      setShipmentDetails([]);
      return;
    }

    const calcFee = async () => {
      try {
        setCalculatingFee(true);
        // Group items by farmer to show distinct shipments
        const farmerMap = new Map();
        for (const it of items) {
          const p = it.product;
          if (!p) continue;
          const farmerKey = String(p.farmer?._id || p.farmer?.name || p.location || "Farm");
          if (!farmerMap.has(farmerKey)) {
            farmerMap.set(farmerKey, {
              farmerName: p.farmer?.name || "Verified Farmer",
              farmerId: p.farmer?.farmerId || "",
              location: p.location || p.district || "Tamil Nadu",
              items: []
            });
          }
          farmerMap.get(farmerKey).items.push(p);
        }

        let totalFee = 0;
        const details = [];

        for (const shipment of farmerMap.values()) {
          const res = await api.post("/delivery/calculate", {
            farmerLocation: shipment.location,
            buyerLocation: deliveryDistrict
          });
          const fee = res.data.deliveryFee || 35;
          totalFee += fee;
          details.push({
            farmerName: shipment.farmerName,
            farmerId: shipment.farmerId,
            origin: res.data.farmerDistrict || shipment.location,
            fee,
            distanceKm: res.data.distanceKm,
            isSameDistrict: res.data.isSameDistrict,
            itemCount: shipment.items.length
          });
        }

        setDeliveryFee(Math.max(35, totalFee));
        setShipmentDetails(details);
      } catch (e) {
        setDeliveryFee(40);
      } finally {
        setCalculatingFee(false);
      }
    };

    calcFee();
  }, [items.length, deliveryDistrict]);

  const handleDistrictChange = (district) => {
    setDeliveryDistrict(district);
    localStorage.setItem("deliveryDistrict", district);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError("");

    if (!deliveryName.trim()) return setError("Please enter recipient name");
    if (!deliveryPhone.trim() || deliveryPhone.trim().length < 10)
      return setError("Please enter a valid 10-digit mobile number for delivery updates");
    if (!deliveryAddress.trim()) return setError("Please enter complete delivery address");

    try {
      setCheckoutBusy(true);
      const payload = {
        items: items.map((it) => ({
          productId: it.product._id,
          quantity: it.quantity
        })),
        deliveryAddress: {
          name: deliveryName.trim(),
          phone: deliveryPhone.trim(),
          address: deliveryAddress.trim(),
          district: deliveryDistrict,
          location: `${deliveryDistrict}, Tamil Nadu`
        },
        paymentMethod: "Pay on Delivery (Cash / UPI to Farmer)"
      };

      const { data } = await api.post("/orders", payload);
      setSuccessOrder(data.order);
      await fetchCart();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setCheckoutBusy(false);
    }
  };

  // SUCCESS SCREEN
  if (successOrder) {
    return (
      <div className="container py-5 text-center">
        <div className="card border-0 shadow-lg rounded-4 p-5 mx-auto" style={{ maxWidth: 640 }}>
          <div className="fs-1 mb-3">🎉</div>
          <h2 className="fw-bold text-success mb-2">Order Confirmed Successfully!</h2>
          <p className="text-muted mb-4">
            Thank you for ordering direct fresh harvest from our local farmers.
          </p>

          <div className="bg-light p-3 rounded-3 text-start mb-4 border">
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted">Order Number:</span>
              <strong className="font-monospace text-success">{successOrder.orderNumber}</strong>
            </div>
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted">Invoice Number:</span>
              <strong className="font-monospace">{successOrder.invoiceNumber}</strong>
            </div>
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted">Delivering To:</span>
              <strong>{successOrder.deliveryAddress.name} ({successOrder.deliveryAddress.district})</strong>
            </div>
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted">Total Amount:</span>
              <strong className="text-success fs-5">{formatPrice(successOrder.totalAmount)}</strong>
            </div>
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted">Payment:</span>
              <span className="badge bg-warning text-dark">Pay on Delivery</span>
            </div>
          </div>

          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <button
              className="btn btn-success fw-bold px-4 py-2"
              onClick={() => setShowInvoice(true)}
            >
              📑 View & Download Invoice
            </button>
            <Link to="/buyer/orders" className="btn btn-outline-success px-4 py-2">
              📦 View My Orders
            </Link>
            <Link to="/marketplace" className="btn btn-link text-muted">
              Continue Shopping
            </Link>
          </div>
        </div>

        {showInvoice && (
          <InvoiceModal
            orderId={successOrder._id}
            onClose={() => setShowInvoice(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="cart-page pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-success mb-1">🛒 Your Harvest Cart</h2>
          <p className="text-muted small mb-0">
            Fresh produce sourced directly from registered Tamil Nadu farmers
          </p>
        </div>
        <Link to="/marketplace" className="btn btn-outline-success btn-sm">
          ← Back to Marketplace
        </Link>
      </div>

      {error && <div className="alert alert-danger shadow-sm rounded-3 mb-4">{error}</div>}

      {items.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 text-center py-5">
          <div className="fs-1 mb-2">🧺</div>
          <h4 className="fw-bold text-dark">Your cart is currently empty</h4>
          <p className="text-muted">
            Explore fresh vegetables, fruits, grains and coconut directly from farmers.
          </p>
          <div className="mt-2">
            <Link to="/marketplace" className="btn btn-success fw-bold px-4 py-2">
              Browse Marketplace
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {/* CART ITEMS LIST */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
                <h5 className="fw-bold mb-0">Produce Items ({items.length})</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4">Item & Farmer</th>
                        <th className="text-center">Price</th>
                        <th className="text-center" style={{ width: 140 }}>Quantity</th>
                        <th className="text-end">Line Total</th>
                        <th className="pe-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => {
                        const p = it.product;
                        if (!p) return null;
                        const lineTotal = p.price * it.quantity;

                        return (
                          <tr key={it._id}>
                            <td className="ps-4">
                              <div className="d-flex align-items-center gap-3">
                                {p.image ? (
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    style={{
                                      width: 54,
                                      height: 54,
                                      objectFit: "cover",
                                      borderRadius: 12
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: 54, height: 54, borderRadius: 12, fontSize: 24 }}
                                  >
                                    {CATEGORY_ICONS[p.category] || "🧺"}
                                  </div>
                                )}
                                <div>
                                  <div className="fw-bold text-dark">{p.name}</div>
                                  <div className="small text-muted">
                                    🧑‍🌾 {p.farmer?.name || "Farmer"} • 📍 {p.location}
                                  </div>
                                  <div className="small text-muted">
                                    Stock remaining: {p.quantity} {p.unit}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="text-center font-monospace">
                              {formatPrice(p.price)} / {p.unit}
                            </td>

                            <td className="text-center">
                              <div className="input-group input-group-sm">
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => updateQuantity(p._id, it.quantity - 1)}
                                  disabled={it.quantity <= 1}
                                >
                                  −
                                </button>
                                <input
                                  type="text"
                                  readOnly
                                  className="form-control text-center font-monospace fw-bold"
                                  value={`${it.quantity} ${p.unit}`}
                                />
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => updateQuantity(p._id, it.quantity + 1)}
                                  disabled={it.quantity >= p.quantity}
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="text-end fw-bold font-monospace text-success">
                              {formatPrice(lineTotal)}
                            </td>

                            <td className="pe-4 text-end">
                              <button
                                className="btn btn-link text-danger p-0"
                                onClick={() => removeItem(p._id)}
                                title="Remove item"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* CHECKOUT & DELIVERY FORM */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: "85px" }}>
              <h5 className="fw-bold mb-3 text-success">🚚 Delivery & Checkout</h5>

              <form onSubmit={handleCheckout}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Recipient Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={deliveryName}
                    onChange={(e) => setDeliveryName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Mobile Phone (For Delivery SMS)</label>
                  <input
                    type="tel"
                    className="form-control form-control-sm"
                    placeholder="10-digit mobile number"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Delivery District (Tamil Nadu)</label>
                  <select
                    className="form-select form-select-sm"
                    value={deliveryDistrict}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    required
                  >
                    {TN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <div className="form-text small" style={{ fontSize: "11px" }}>
                    Delivery charge is calculated from farmer's field to this district.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Delivery Address</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    placeholder="House/Door No, Street name, Locality, Pincode"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    required
                  />
                </div>

                <hr />

                {/* PRICE BREAKDOWN */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between py-1 small">
                    <span className="text-muted">Produce Subtotal:</span>
                    <span className="fw-semibold font-monospace">{formatPrice(subtotal)}</span>
                  </div>

                  {/* Multi-farmer Shipment Breakdown if > 1 farmer */}
                  {shipmentDetails.length > 1 ? (
                    <div className="p-2 my-2 bg-light rounded-3 border small">
                      <div className="fw-bold text-success mb-1" style={{ fontSize: "11px" }}>
                        📦 Multi-Farmer Shipments ({shipmentDetails.length}):
                      </div>
                      {shipmentDetails.map((s, idx) => (
                        <div key={idx} className="d-flex justify-content-between py-1" style={{ fontSize: "11px" }}>
                          <span className="text-muted text-truncate" style={{ maxWidth: 170 }}>
                            {s.farmerName} ({s.origin}):
                          </span>
                          <span className="font-monospace fw-semibold">{formatPrice(s.fee)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="d-flex justify-content-between py-1 small">
                    <span className="text-muted">
                      Distance Transport Charge:
                      {calculatingFee && <span className="spinner-border spinner-border-sm ms-1" />}
                    </span>
                    <span className="fw-semibold font-monospace">{formatPrice(deliveryFee)}</span>
                  </div>

                  <div className="d-flex justify-content-between py-1 small">
                    <span className="text-muted">Packaging & Careful Handling:</span>
                    <span className="fw-semibold font-monospace">{formatPrice(handlingFee)}</span>
                  </div>

                  <div className="d-flex justify-content-between py-1 small">
                    <span className="text-muted">Platform Maintenance & Farmer Support:</span>
                    <span className="fw-semibold font-monospace">{formatPrice(platformFee)}</span>
                  </div>

                  <div className="d-flex justify-content-between py-1 small">
                    <span className="text-muted">Agricultural Tax (0% GST Exempted):</span>
                    <span className="text-muted font-monospace">₹0.00</span>
                  </div>

                  <hr className="my-2" />

                  <div className="d-flex justify-content-between py-1 fs-5 fw-bold text-success">
                    <span>Grand Total:</span>
                    <span className="font-monospace">
                      {formatPrice(subtotal + deliveryFee + handlingFee + platformFee)}
                    </span>
                  </div>
                </div>

                <div className="p-2 mb-3 rounded-2 bg-light border text-center small text-muted">
                  💳 <strong>Payment Method:</strong> Pay on Delivery (Cash or UPI directly to Farmer)
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 fw-bold py-2 shadow-sm"
                  disabled={checkoutBusy || items.length === 0}
                >
                  {checkoutBusy
                    ? "Processing Order..."
                    : `Place Order • ${formatPrice(subtotal + deliveryFee + handlingFee + platformFee)}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
