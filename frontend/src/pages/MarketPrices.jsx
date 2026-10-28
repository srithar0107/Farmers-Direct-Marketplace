import { useEffect, useState } from "react";
import api, { errMsg, formatPrice, formatDate, TN_DISTRICTS } from "../api.js";

export default function MarketPrices() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const loadPrices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDistrict !== "All") params.district = selectedDistrict;
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (search.trim()) params.commodity = search.trim();

      const { data } = await api.get("/market-prices", { params });
      setPrices(data.data || []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, [selectedDistrict, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPrices();
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await api.post("/market-prices/refresh");
      await loadPrices();
    } catch (e) {
      alert("Refresh error: " + errMsg(e));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="market-prices pb-5">
      {/* HEADER BANNER */}
      <div
        className="card border-0 shadow-sm rounded-4 mb-4 text-white p-4"
        style={{ background: "linear-gradient(135deg, #1b5e20, #00796b)" }}
      >
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="fs-3">📈</span>
              <h2 className="fw-bold mb-0 text-white">
                Tamil Nadu Mandi Market Prices
              </h2>
            </div>
            <p className="text-white-50 mb-0">
              Official wholesale agricultural market rates from AGMARKNET / e-NAM & APMC Mandis across Tamil Nadu.
            </p>
          </div>
          <button
            className="btn btn-warning fw-bold text-dark d-flex align-items-center gap-2 px-3 py-2 shadow-sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <span>🔄</span>
            <span>{refreshing ? "Updating..." : "Refresh Mandi Rates"}</span>
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger shadow-sm rounded-3">{error}</div>}

      {/* FILTER BAR */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 p-3 bg-white">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">🔍</span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search crop e.g. Tomato, Onion, Banana..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="All">All Tamil Nadu Districts</option>
              {TN_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Grains">Grains & Cereals</option>
              <option value="Pulses">Pulses & Legumes</option>
              <option value="Plantation">Plantation & Coconut</option>
              <option value="Spices">Spices</option>
            </select>
          </div>

          <div className="col-md-2">
            <button type="submit" className="btn btn-success w-100 fw-semibold">
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* PRICING TABLE */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0 text-success">
            🏛️ Official APMC Wholesale Price Feed ({prices.length} commodities)
          </h5>
          <span className="badge bg-light text-secondary border">
            Source: AGMARKNET / e-NAM
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status" />
              <p className="mt-2 text-muted">Fetching verified mandi rates...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Commodity</th>
                    <th>Category</th>
                    <th>APMC Market & District</th>
                    <th className="text-center">Min Price</th>
                    <th className="text-center">Max Price</th>
                    <th className="text-center bg-success-subtle fw-bold">Modal Rate (Ref)</th>
                    <th className="text-end pe-4">Reported Date</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((p) => (
                    <tr key={p._id}>
                      <td className="ps-4">
                        <div className="fw-bold text-dark">{p.commodity}</div>
                        <div className="small text-muted">Official Grade: Standard</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border">
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{p.market}</div>
                        <div className="small text-muted">📍 {p.district} District</div>
                      </td>
                      <td className="text-center font-monospace text-muted">
                        {formatPrice(p.minPrice)} / {p.unit}
                      </td>
                      <td className="text-center font-monospace text-muted">
                        {formatPrice(p.maxPrice)} / {p.unit}
                      </td>
                      <td className="text-center font-monospace fw-bold text-success bg-success-subtle fs-6">
                        {formatPrice(p.modalPrice)} / {p.unit}
                      </td>
                      <td className="text-end pe-4 text-muted small">
                        {formatDate(p.priceDate)}
                      </td>
                    </tr>
                  ))}

                  {prices.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No mandi records found matching your filters. Try selecting "All Districts" or clearing the search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* FARMER PRICING GUIDE NOTE */}
      <div className="card border-0 shadow-sm rounded-4 mt-4 bg-light p-4">
        <h6 className="fw-bold text-success mb-2">💡 How to Use Mandi Prices for Direct Selling</h6>
        <p className="small text-muted mb-1">
          • <strong>Modal Rate</strong> represents the most frequent wholesale transaction price at that market.
        </p>
        <p className="small text-muted mb-1">
          • As a farmer, setting your retail price slightly above the wholesale modal rate ensures higher profit margins for you while still offering significant savings to retail buyers compared to city supermarkets!
        </p>
        <p className="small text-muted mb-0">
          • In Farmers' Direct Marketplace, you retain 100% of your chosen crop price with zero intermediary deductions.
        </p>
      </div>
    </div>
  );
}
