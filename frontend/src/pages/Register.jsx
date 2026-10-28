import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg, TN_DISTRICTS } from "../api.js";
import { t, getLang, setLang } from "../i18n.js";
import customerImage from "../assets/customer-login.jpg";

export default function Register() {
  const [lang, setLanguage] = useState(getLang());
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    district: "Chennai",
    address: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLangChange = (newLang) => {
    setLang(newLang);
    setLanguage(newLang);
  };

  const setField = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      return setError(lang === "ta" ? "உங்கள் பெயரை உள்ளிடவும்" : "Please enter your name");
    }

    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
      return setError(lang === "ta" ? "சரியான மின்னஞ்சலை உள்ளிடவும்" : "Please enter a valid email address");
    }

    if (form.password.length < 6) {
      return setError(
        lang === "ta"
          ? "கடவுச்சொல் குறைந்தது 6 எழுத்துக்கள் இருக்க வேண்டும்"
          : "Password must be at least 6 characters"
      );
    }

    if (form.confirmPassword && form.password !== form.confirmPassword) {
      return setError(
        lang === "ta" ? "கடவுச்சொற்கள் பொருந்தவில்லை" : "Passwords do not match"
      );
    }

    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim(),
        role: "customer",
        district: form.district,
        address: form.address.trim(),
        password: form.password,
        preferredLanguage: lang
      };

      await api.post("/auth/register", payload);
      navigate("/login");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="buyer-reg-page">
      <style>{`
        .buyer-reg-page {
          min-height: calc(100vh - 70px);
          background: #f4f8ed;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }
        .br-card {
          width: 100%;
          max-width: 1080px;
          min-height: 640px;
          background: #fff;
          border-radius: 28px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 44% 56%;
          box-shadow: 0 18px 50px rgba(30, 80, 30, 0.12);
          border: 1px solid #dce8d6;
        }
        .br-visual {
          position: relative;
          min-height: 640px;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #fff;
          background: linear-gradient(180deg, rgba(23, 107, 53, 0.65), rgba(23, 107, 53, 0.94)), url(${customerImage});
          background-size: cover;
          background-position: center top;
        }
        .br-form-area {
          padding: 44px 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .br-lang-bar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .br-lang-btn {
          border: 1px solid #c8dcc3;
          background: #f7faf5;
          color: #2e6633;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .br-lang-btn.active {
          background: #1e7e34;
          color: #fff;
          border-color: #1e7e34;
        }
        .br-title {
          font-size: clamp(26px, 3.2vw, 34px);
          font-weight: 800;
          color: #172b18;
          margin: 0 0 6px;
          letter-spacing: -0.5px;
        }
        .br-sub {
          color: #556b57;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 20px;
        }
        .br-input {
          width: 100%;
          height: 48px;
          border: 1px solid #cfe0cb;
          border-radius: 12px;
          padding: 0 14px;
          font-size: 14px;
          outline: none;
          transition: 0.2s;
          background: #fafdf9;
        }
        .br-input:focus {
          border-color: #2e7d32;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.12);
        }
        .br-btn {
          width: 100%;
          height: 50px;
          background: linear-gradient(135deg, #1e7e34, #28a745);
          color: #fff;
          border: 0;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .br-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(30, 126, 52, 0.25);
        }
        @media (max-width: 880px) {
          .br-card { grid-template-columns: 1fr; }
          .br-visual { min-height: 220px; padding: 26px; }
          .br-form-area { padding: 30px 20px; }
        }
      `}</style>

      <div className="br-card">
        {/* LEFT VISUAL */}
        <div className="br-visual">
          <div>
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="fs-2">🌿</span>
              <span className="fs-4 fw-bold">{t("brandName", lang)}</span>
            </div>
            <div className="badge bg-white text-success px-3 py-2 rounded-pill fw-bold">
              🛒 {lang === "ta" ? "வாடிக்கையாளர் பதிவு" : "Buyer Account Registration"}
            </div>
          </div>

          <div>
            <h2 className="fw-bold display-6 mb-3">
              {lang === "ta"
                ? "நம்பகமான பண்ணை பொருட்கள், நேரடியாக!"
                : "Farm Fresh Direct to Your Kitchen."}
            </h2>
            <p className="text-white-50 mb-0">
              {lang === "ta"
                ? "விவசாயிகளிடமிருந்து அறுவடை செய்யப்பட்ட புதிய காய்கறிகள் மற்றும் பழங்கள் வெளிப்படையான விலையில்."
                : "Get farm-to-door fresh produce with complete price transparency and fair farmer pricing."}
            </p>
          </div>
        </div>

        {/* RIGHT REGISTRATION FORM */}
        <div className="br-form-area">
          {/* LANGUAGE SELECTOR */}
          <div className="br-lang-bar">
            <span className="small text-muted fw-semibold">🌐 {t("language", lang)}:</span>
            <button
              type="button"
              className={`br-lang-btn ${lang === "en" ? "active" : ""}`}
              onClick={() => handleLangChange("en")}
            >
              English
            </button>
            <button
              type="button"
              className={`br-lang-btn ${lang === "ta" ? "active" : ""}`}
              onClick={() => handleLangChange("ta")}
            >
              தமிழ்
            </button>
          </div>

          <h2 className="br-title">🛒 {t("buyerRegTitle", lang)}</h2>
          <p className="br-sub">{t("buyerRegSub", lang)}</p>

          {error && <div className="alert alert-danger py-2 rounded-3 small">{error}</div>}

          <form onSubmit={submit}>
            <div className="row g-2 mb-2">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-dark mb-1">
                  {t("fullNameLabel", lang)} *
                </label>
                <input
                  type="text"
                  className="br-input"
                  placeholder={t("fullNamePlaceholder", lang)}
                  value={form.name}
                  onChange={setField("name")}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold small text-dark mb-1">
                  {t("emailLabel", lang)} *
                </label>
                <input
                  type="email"
                  className="br-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={setField("email")}
                  required
                />
              </div>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-dark mb-1">
                  {t("deliveryDistrictLabel", lang)} *
                </label>
                <select
                  className="br-input"
                  value={form.district}
                  onChange={setField("district")}
                  required
                >
                  {TN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold small text-dark mb-1">
                  {t("mobileLabel", lang)}
                </label>
                <input
                  type="tel"
                  className="br-input"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={setField("phone")}
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label fw-bold small text-dark mb-1">
                {t("deliveryAddressLabel", lang)}
              </label>
              <input
                type="text"
                className="br-input"
                placeholder={t("deliveryAddressPlaceholder", lang)}
                value={form.address}
                onChange={setField("address")}
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold small text-dark mb-1">
                  {t("passwordLabel", lang)} *
                </label>
                <input
                  type="password"
                  className="br-input"
                  placeholder={t("passwordPlaceholder", lang)}
                  value={form.password}
                  onChange={setField("password")}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold small text-dark mb-1">
                  {lang === "ta" ? "கடவுச்சொல்லை மீண்டும் உள்ளிடவும் *" : "Confirm Password *"}
                </label>
                <input
                  type="password"
                  className="br-input"
                  placeholder={lang === "ta" ? "கடவுச்சொல் உறுதி" : "Confirm password"}
                  value={form.confirmPassword}
                  onChange={setField("confirmPassword")}
                  required
                />
              </div>
            </div>

            <button type="submit" className="br-btn" disabled={loading}>
              {loading ? t("processing", lang) : t("buyerSubmitBtn", lang)}
            </button>
          </form>

          <div className="mt-3 text-center">
            <p className="small text-muted mb-0">
              {t("alreadyHaveAccount", lang)}{" "}
              <Link to="/login" className="fw-bold text-success text-decoration-none">
                {t("signInHere", lang)} →
              </Link>
            </p>
          </div>

          <div className="mt-3 p-2 bg-light rounded-3 border text-center">
            <span className="small text-muted">
              🌾 {lang === "ta" ? "விவசாயியா? பண்ணை பதிவு செய்ய:" : "Are you a Farmer? Register your farm:"}{" "}
              <Link to="/farmer/register" className="fw-bold text-success text-decoration-none">
                {lang === "ta" ? "விவசாயி பதிவு" : "Farmer Registration"} →
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}