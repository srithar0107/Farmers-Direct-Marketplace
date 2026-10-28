import { useEffect, useState } from "react";
import api, { errMsg, formatPrice, formatDate } from "../api.js";

export default function InvoiceModal({ orderId, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    api
      .get(`/invoices/${orderId}`)
      .then((res) => setInvoice(res.data))
      .catch((err) => setError(errMsg(err)))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (!orderId) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0 rounded-4">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title fw-bold">
              📑 Tax Invoice & Bill of Supply
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          <div className="modal-body p-4" id="printable-invoice">
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status" />
                <p className="mt-2 text-muted">Generating invoice...</p>
              </div>
            )}

            {error && <div className="alert alert-danger">{error}</div>}

            {invoice && (
              <div>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                  <div>
                    <h3 className="fw-bold text-success mb-1">
                      🌾 Farmers' Direct Marketplace
                    </h3>
                    <p className="text-muted small mb-0">
                      Direct Farm-to-Consumer Agricultural Platform
                    </p>
                    <p className="text-muted small mb-0">
                      State: Tamil Nadu, India | support@farmersdirect.in
                    </p>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-success fs-6 mb-1">
                      {invoice.orderStatus}
                    </span>
                    <div className="fw-bold font-monospace fs-5 text-dark">
                      {invoice.invoiceNumber}
                    </div>
                    <div className="small text-muted">
                      Date: {formatDate(invoice.invoiceDate)}
                    </div>
                    <div className="small text-muted">
                      Order: {invoice.orderNumber}
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-success mb-2">
                        📦 Delivery Address (Buyer)
                      </h6>
                      <div className="fw-semibold">{invoice.buyer.name}</div>
                      <div className="small text-muted">{invoice.buyer.address}</div>
                      {invoice.buyer.district && (
                        <div className="small text-muted">
                          District: {invoice.buyer.district}
                        </div>
                      )}
                      <div className="small text-muted">
                        Phone: {invoice.buyer.phone}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border">
                      <h6 className="fw-bold text-success mb-2">
                        💳 Payment & Shipping
                      </h6>
                      <div className="small">
                        <strong>Payment Method:</strong> {invoice.paymentMethod}
                      </div>
                      <div className="small">
                        <strong>Payment Status:</strong>{" "}
                        <span
                          className={`badge ${
                            invoice.paymentStatus === "Paid"
                              ? "bg-success"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {invoice.paymentStatus}
                        </span>
                      </div>
                      <div className="small mt-1 text-muted">
                        Direct settlement to registered farmer on delivery.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="table-responsive mb-3">
                  <table className="table table-bordered align-middle">
                    <thead className="table-success text-dark">
                      <tr>
                        <th>#</th>
                        <th>Product & Category</th>
                        <th>Farmer / Producer</th>
                        <th className="text-center">Qty & Unit</th>
                        <th className="text-end">Price / Unit</th>
                        <th className="text-end">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="fw-bold">{it.productName}</div>
                            <span className="badge bg-light text-secondary border">
                              {it.category}
                            </span>
                          </td>
                          <td>
                            <div className="small fw-semibold">{it.farmerName}</div>
                            {it.farmerId && (
                              <span className="badge bg-warning text-dark font-monospace small">
                                {it.farmerId}
                              </span>
                            )}
                            <div className="small text-muted">{it.farmerLocation}</div>
                          </td>
                          <td className="text-center font-monospace">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="text-end font-monospace">
                            {formatPrice(it.pricePerUnit)}
                          </td>
                          <td className="text-end fw-bold font-monospace">
                            {formatPrice(it.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="row justify-content-end">
                  <div className="col-md-6">
                    <div className="bg-light p-3 rounded-3 border">
                      <div className="d-flex justify-content-between py-1">
                        <span>Produce Subtotal:</span>
                        <span className="fw-bold font-monospace">
                          {formatPrice(invoice.subtotal)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between py-1">
                        <span>Distance Transport Charge:</span>
                        <span className="fw-bold font-monospace">
                          {formatPrice(invoice.deliveryCharge)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between py-1">
                        <span>Produce Packaging & Careful Handling:</span>
                        <span className="fw-bold font-monospace">
                          {formatPrice(invoice.handlingCharge || 10)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between py-1">
                        <span>Platform Maintenance & Farmer Support:</span>
                        <span className="fw-bold font-monospace">
                          {formatPrice(invoice.platformFee || 5)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between py-1">
                        <span>Agricultural Tax (0% GST Exempted):</span>
                        <span className="text-muted font-monospace">₹0.00</span>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between py-1 fs-5 text-success fw-bold">
                        <span>Grand Total:</span>
                        <span className="font-monospace">
                          {formatPrice(invoice.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top text-center text-muted small">
                  <p className="mb-0">
                    Thank you for empowering our local farmers and buying direct fresh harvest!
                  </p>
                  <p className="mb-0">
                    This is an electronically generated valid invoice by Farmers' Direct Marketplace.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer bg-light">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-success d-flex align-items-center gap-2 fw-semibold"
              onClick={handlePrint}
              disabled={!invoice}
            >
              <span>🖨️</span>
              <span>Print / Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
