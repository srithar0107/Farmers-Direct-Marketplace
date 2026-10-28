import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg, formatPrice, formatDate } from "../api.js";
import InvoiceModal from "../components/InvoiceModal.jsx";

export default function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders/buyer");
      setOrders(res.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? The reserved stock will be returned to the farmer.")) {
      return;
    }
    try {
      setCancellingId(orderId);
      await api.put(`/orders/${orderId}/cancel`, { reason: "Cancelled by buyer" });
      await loadOrders();
    } catch (e) {
      alert("Could not cancel order: " + errMsg(e));
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return <span className="badge bg-success fs-6">Delivered</span>;
      case "Shipped":
        return <span className="badge bg-primary fs-6">Shipped / Out for Delivery</span>;
      case "Packed":
        return <span className="badge bg-info text-dark fs-6">Packed at Farm</span>;
      case "Confirmed":
        return <span className="badge bg-warning text-dark fs-6">Confirmed</span>;
      case "Cancelled":
        return <span className="badge bg-danger fs-6">Cancelled</span>;
      default:
        return <span className="badge bg-secondary fs-6">{status}</span>;
    }
  };

  return (
    <div className="buyer-orders pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-success mb-1">📑 My Orders & Invoices</h2>
          <p className="text-muted small mb-0">
            Track status, view line items, download tax invoices, and manage past orders
          </p>
        </div>
        <Link to="/marketplace" className="btn btn-outline-success">
          🛒 Continue Shopping
        </Link>
      </div>

      {error && <div className="alert alert-danger shadow-sm rounded-3">{error}</div>}

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status" />
          <p className="mt-2 text-muted">Loading your orders...</p>
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="card border-0 shadow-sm rounded-4 text-center py-5">
          <div className="fs-1 mb-2">📦</div>
          <h4 className="fw-bold text-dark">No orders placed yet</h4>
          <p className="text-muted">
            You haven't ordered any fresh harvest yet. Visit our marketplace to buy directly from farmers!
          </p>
          <div className="mt-2">
            <Link to="/marketplace" className="btn btn-success fw-bold px-4 py-2">
              Explore Marketplace
            </Link>
          </div>
        </div>
      )}

      <div className="d-flex flex-column gap-4">
        {orders.map((ord) => (
          <div key={ord._id} className="card border-0 shadow-sm rounded-4 overflow-hidden">
            {/* ORDER HEADER */}
            <div className="card-header bg-light border-bottom p-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <span className="small text-muted text-uppercase fw-semibold">Order Number</span>
                <div className="fw-bold fs-5 font-monospace text-success">{ord.orderNumber}</div>
                <div className="small text-muted">Placed on {formatDate(ord.createdAt)}</div>
              </div>

              <div>
                <span className="small text-muted text-uppercase fw-semibold d-block">Status</span>
                {getStatusBadge(ord.status)}
              </div>

              <div>
                <span className="small text-muted text-uppercase fw-semibold d-block">Total Amount</span>
                <span className="fw-bold fs-5 text-dark font-monospace">
                  {formatPrice(ord.totalAmount)}
                </span>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-success btn-sm fw-semibold d-flex align-items-center gap-1"
                  onClick={() => setSelectedInvoiceOrderId(ord._id)}
                >
                  <span>📑</span>
                  <span>View / Download Invoice</span>
                </button>

                {(ord.status === "Confirmed" || ord.status === "Pending") && (
                  <button
                    className="btn btn-outline-danger btn-sm"
                    disabled={cancellingId === ord._id}
                    onClick={() => handleCancelOrder(ord._id)}
                  >
                    {cancellingId === ord._id ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>
            </div>

            {/* ORDER BODY */}
            <div className="card-body p-4">
              <div className="row g-4">
                {/* ITEMS */}
                <div className="col-md-7">
                  <h6 className="fw-bold text-muted small text-uppercase mb-3">Items Purchased</h6>
                  <div className="d-flex flex-column gap-3">
                    {ord.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <div className="fw-bold text-dark">{it.name}</div>
                          <div className="small text-muted">
                            Farmer: {it.farmer?.name || "Verified Farmer"} • {it.farmer?.location || ""}
                          </div>
                          <div className="small text-muted">
                            {it.quantity} {it.unit} × {formatPrice(it.price)} / {it.unit}
                          </div>
                        </div>
                        <div className="fw-bold font-monospace text-success">
                          {formatPrice(it.lineTotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DELIVERY & INVOICE SUMMARY */}
                <div className="col-md-5">
                  <div className="p-3 bg-light rounded-3 border h-100">
                    <h6 className="fw-bold text-muted small text-uppercase mb-2">Delivery Details</h6>
                    <div className="fw-bold text-dark">{ord.deliveryAddress.name}</div>
                    <div className="small text-muted">{ord.deliveryAddress.address}</div>
                    <div className="small text-muted">District: {ord.deliveryAddress.district}</div>
                    <div className="small text-muted">Phone: {ord.deliveryAddress.phone}</div>

                    <hr className="my-2" />

                    <div className="small d-flex justify-content-between py-1">
                      <span>Produce Subtotal:</span>
                      <span className="font-monospace fw-semibold">{formatPrice(ord.subtotal)}</span>
                    </div>
                    <div className="small d-flex justify-content-between py-1">
                      <span>Distance Delivery Fee:</span>
                      <span className="font-monospace fw-semibold">{formatPrice(ord.deliveryCharge)}</span>
                    </div>
                    <div className="small d-flex justify-content-between py-1 fw-bold fs-6 text-success border-top mt-1 pt-1">
                      <span>Grand Total:</span>
                      <span className="font-monospace">{formatPrice(ord.totalAmount)}</span>
                    </div>
                    <div className="small text-muted mt-2">
                      Payment: {ord.paymentMethod}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* INVOICE MODAL */}
      {selectedInvoiceOrderId && (
        <InvoiceModal
          orderId={selectedInvoiceOrderId}
          onClose={() => setSelectedInvoiceOrderId(null)}
        />
      )}
    </div>
  );
}
