import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg, TN_DISTRICTS } from "../api.js";
import { t, getLang, setLang } from "../i18n.js";
import farmerImage from "../assets/farmer-login.jpg";

export default function FarmerRegister() {
  const [lang, setLanguage] = useState(getLang());
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    district: "Dindigul",
    location: "",
    password: "",
    confirmPassword: "",
    consent: true
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdFarmerId, setCreatedFarmerId] = useState(null);

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
      return setError(lang === "ta" ? "உங்கள் முழு பெயரை உள்ளிடவும்" : "Please enter your full name");
    }

    const cleanPhone = form.phone.trim().replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      return setError(
        lang === "ta"
          ? "சரியான 10-இலக்க கைபேசி எண்ணை உள்ளிடவும் (எஸ்.எம்.எஸ் செய்திகளுக்கு அவசியம்)"
          : "Please enter a valid 10-digit mobile number for order and stock SMS alerts"
      );
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
        phone: cleanPhone,
        email: form.email.trim(),
        role: "farmer",
        district: form.district,
        location: form.location.trim(),
        password: form.password,
        preferredLanguage: lang
      };

      const { data } = await api.post("/auth/register", payload);
      if (data.user?.farmerId) {
        setCreatedFarmerId(data.user.farmerId);
      } else {
        navigate("/farmer-login");
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="farmer-reg-page">
      <style>{`
        .farmer-reg-page {
          min-height: calc(100vh - 70px);
          background: #eef6e6;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }
        .fr-card {
          width: 100%;
          max-width: 1100px;
          min-height: 640px;
          background: #fff;
          border-radius: 28px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 44% 56%;
          box-shadow: 0 20px 60px rgba(27, 94, 32, 0.16);
          border: 1px solid #d9e9d4;
        }
        .fr-visual {
          position: relative;
          min-height: 640px;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #fff;
          background: linear-gradient(135deg, rgba(20, 108, 40, 0.90), rgba(46, 125, 50, 0.82)), url(${farmerImage});
          background-size: cover;
          background-position: center;
        }
        .fr-form-area {
          padding: 44px 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .fr-lang-bar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .fr-lang-btn {
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
        .fr-lang-btn.active {
          background: #1e7e34;
          color: #fff;
          border-color: #1e7e34;
        }
        .fr-title {
          font-size: clamp(26px, 3.2vw, 34px);
          font-weight: 800;
          color: #172b18;
          margin: 0 0 6px;
          letter-spacing: -0.5px;
        }
        .fr-sub {
          color: #556b57;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 20px;
        }
        .fr-input {
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
        .fr-input:focus {
          border-color: #2e7d32;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.12);
        }
        .fr-btn {
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
        .fr-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(30, 126, 52, 0.25);
        }
        @media (max-width: 880px) {
          .fr-card { grid-template-columns: 1fr; }
          .fr-visual { min-height: 220px; padding: 26px; }
          .fr-form-area { padding: 30px 20px; }
        }
      `}</style>

      <div className="fr-card">
        {/* LEFT VISUAL */}
        <div className="fr-visual">
          <div>
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="fs-2">🌾</span>
              <span className="fs-4 fw-bold">{t("brandName", lang)}</span>
            </div>
            <div className="badge bg-white text-success px-3 py-2 rounded-pill fw-bold">
              🌱 {lang === "ta" ? "விவசாயி பதிவு" : "Farmer Portal Registration"}
            </div>
          </div>

          <div>
            <h2 className="fw-bold display-6 mb-3">
              {lang === "ta"
                ? "விளைவித்தவருக்கு முழு பலன் கிடைக்கட்டும்!"
                : "Empowering Local Tamil Nadu Farmers."}
            </h2>
            <p className="text-white-50 mb-0">
              {lang === "ta"
                ? "உங்கள் சொந்த பண்ணை தயாரிப்புகளை இடைத்தரகர்கள் இல்லாமல் நேரடியாக நுகர்வோருக்கு விற்கலாம்."
                : "List your agricultural produce directly, set your own selling price, and receive automatic SMS alerts for orders and stock."}
            </p>
          </div>
        </div>

        {/* RIGHT REGISTRATION FORM */}
        <div className="fr-form-area">
          {/* LANGUAGE SELECTOR */}
          <div className="fr-lang-bar">
            <span className="small text-muted fw-semibold">🌐 {t("language", lang)}:</span>
            <button
              type="button"
              className={`fr-lang-btn ${lang === "en" ? "active" : ""}`}
              onClick={() => handleLangChange("en")}
            >
              English
            </button>
            <button
              type="button"
              className={`fr-lang-btn ${lang === "ta" ? "active" : ""}`}
              onClick={() => handleLangChange("ta")}
            >
              தமிழ்
            </button>
          </div>

          {createdFarmerId ? (
            /* CELEBRATION CARD FOR GENERATED FARMER ID */
            <div className="text-center py-4">
              <div className="fs-1 mb-2">🎉</div>
              <h2 className="fw-bold text-success mb-2">{t("farmerSuccessTitle", lang)}</h2>
              <p className="text-muted">{t("farmerSuccessMsg", lang)}</p>

              <div className="p-4 bg-warning bg-opacity-25 rounded-4 border border-warning text-center my-4">
                <span className="small text-muted text-uppercase d-block fw-bold mb-1">
                  {lang === "ta" ? "உங்கள் தனித்துவமான விவசாயி அடையாள எண்" : "Your Unique Farmer ID"}
                </span>
                <span className="fs-1 fw-bold font-monospace text-dark">{createdFarmerId}</span>
              </div>

              <p className="small text-muted mb-4">{t("farmerSuccessNote", lang)}</p>

              <Link to="/farmer-login" className="btn btn-success fw-bold px-4 py-3 w-100 shadow-sm rounded-3">
                {t("proceedToFarmerLogin", lang)}
              </Link>
            </div>
          ) : (
            <>
              <h2 className="fr-title">👨‍🌾 {t("farmerRegTitle", lang)}</h2>
              <p className="fr-sub">{t("farmerRegSub", lang)}</p>

              {error && <div className="alert alert-danger py-2 rounded-3 small">{error}</div>}

              <form onSubmit={submit}>
                <div className="row g-2 mb-2">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark mb-1">
                      {t("fullNameLabel", lang)} *
                    </label>
                    <input
                      type="text"
                      className="fr-input"
                      placeholder={t("fullNamePlaceholder", lang)}
                      value={form.name}
                      onChange={setField("name")}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark mb-1">
                      {t("mobileLabel", lang)} *
                    </label>
                    <input
                      type="tel"
                      className="fr-input"
                      placeholder={t("mobilePlaceholder", lang)}
                      value={form.phone}
                      onChange={setField("phone")}
                      required
                    />
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark mb-1">
                      {t("districtLabel", lang)} *
                    </label>
                    <select
                      className="fr-input"
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
                      {t("farmLocationLabel", lang)} *
                    </label>
                    <input
                      type="text"
                      className="fr-input"
                      placeholder={t("farmLocationPlaceholder", lang)}
                      value={form.location}
                      onChange={setField("location")}
                      required
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label fw-bold small text-dark mb-1">
                    {t("emailLabel", lang)}
                  </label>
                  <input
                    type="email"
                    className="fr-input"
                    placeholder={t("emailPlaceholder", lang)}
                    value={form.email}
                    onChange={setField("email")}
                  />
                  <div className="form-text small" style={{ fontSize: "11px" }}>
                    {lang === "ta"
                      ? "மின்னஞ்சல் இல்லாதவர்கள் இதை காலியாக விடலாம். உங்கள் கைபேசி எண்ணே போதும்."
                      : "Optional for farmers without an email. Your phone number is sufficient."}
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark mb-1">
                      {t("passwordLabel", lang)} *
                    </label>
                    <input
                      type="password"
                      className="fr-input"
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
                      className="fr-input"
                      placeholder={lang === "ta" ? "கடவுச்சொல் உறுதி" : "Confirm password"}
                      value={form.confirmPassword}
                      onChange={setField("confirmPassword")}
                      required
                    />
                  </div>
                </div>

                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="consentCheck"
                    checked={form.consent}
                    onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                    required
                  />
                  <label className="form-check-label small text-muted" htmlFor="consentCheck">
                    {lang === "ta"
                      ? "விவசாயிகள் நேரடி சந்தையின் விதிமுறைகள் மற்றும் நேரடி விற்பனை நிபந்தனைகளை ஒப்புக்கொள்கிறேன்."
                      : "I agree to the terms of direct agricultural trade and SMS order notifications."}
                  </label>
                </div>

                <button type="submit" className="fr-btn" disabled={loading}>
                  {loading ? t("processing", lang) : t("farmerSubmitBtn", lang)}
                </button>
              </form>

              <div className="mt-3 text-center">
                <p className="small text-muted mb-0">
                  {t("alreadyHaveAccount", lang)}{" "}
                  <Link to="/farmer-login" className="fw-bold text-success text-decoration-none">
                    {t("signInHere", lang)} →
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
