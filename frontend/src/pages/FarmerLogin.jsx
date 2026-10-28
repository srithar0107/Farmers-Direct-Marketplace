import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { t, getLang, setLang } from "../i18n.js";
import farmerImage from "../assets/farmer-login.jpg";

export default function FarmerLogin() {
  const [lang, setLanguage] = useState(getLang());
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLangChange = (newLang) => {
    setLang(newLang);
    setLanguage(newLang);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { identifier, password });
      if (data.user.role !== "farmer" && data.user.role !== "admin") {
        setError(
          lang === "ta"
            ? "இது வாடிக்கையாளர் கணக்கு. தயவுசெய்து வாடிக்கையாளர் உள்நுழைவைப் பயன்படுத்தவும்."
            : "This is a buyer account. Please use the Buyer Login page."
        );
        setLoading(false);
        return;
      }
      login(data);
      navigate("/farmer/dashboard");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="farmer-login-page">
      <style>{`
        .farmer-login-page {
          min-height: calc(100vh - 70px);
          background: #eef6e6;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }
        .fl-card {
          width: 100%;
          max-width: 1080px;
          min-height: 600px;
          background: #fff;
          border-radius: 28px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 48% 52%;
          box-shadow: 0 20px 60px rgba(27, 94, 32, 0.16);
          border: 1px solid #d9e9d4;
        }
        .fl-visual {
          position: relative;
          min-height: 600px;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #fff;
          background: linear-gradient(135deg, rgba(20, 108, 40, 0.90), rgba(46, 125, 50, 0.82)), url(${farmerImage});
          background-size: cover;
          background-position: center;
        }
        .fl-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.22);
          backdrop-filter: blur(8px);
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 13px;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .fl-form-area {
          padding: 48px 52px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .fl-lang-bar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .fl-lang-btn {
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
        .fl-lang-btn.active {
          background: #1e7e34;
          color: #fff;
          border-color: #1e7e34;
        }
        .fl-title {
          font-size: clamp(28px, 3.5vw, 36px);
          font-weight: 800;
          color: #172b18;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }
        .fl-sub {
          color: #556b57;
          font-size: 15px;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .fl-input {
          width: 100%;
          height: 52px;
          border: 1px solid #cfe0cb;
          border-radius: 14px;
          padding: 0 16px;
          font-size: 15px;
          outline: none;
          transition: 0.2s;
          background: #fafdf9;
        }
        .fl-input:focus {
          border-color: #2e7d32;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.12);
        }
        .fl-btn {
          width: 100%;
          height: 52px;
          background: linear-gradient(135deg, #1e7e34, #28a745);
          color: #fff;
          border: 0;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .fl-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(30, 126, 52, 0.25);
        }
        @media (max-width: 860px) {
          .fl-card { grid-template-columns: 1fr; }
          .fl-visual { min-height: 240px; padding: 28px; }
          .fl-form-area { padding: 32px 24px; }
        }
      `}</style>

      <div className="fl-card">
        {/* LEFT FARMER VISUAL */}
        <div className="fl-visual">
          <div>
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="fs-2">🌾</span>
              <span className="fs-4 fw-bold">{t("brandName", lang)}</span>
            </div>
            <div className="fl-badge">👨‍🌾 {lang === "ta" ? "விவசாயிகள் தளம்" : "Farmer Portal"}</div>
          </div>

          <div>
            <h1 className="fw-bold display-6 mb-3">
              {lang === "ta" ? (
                <>
                  உங்கள் பயிர்.
                  <br />
                  உங்கள் விலை.
                  <br />
                  உங்கள் சந்தை.
                </>
              ) : (
                <>
                  Your Harvest.
                  <br />
                  Your Price.
                  <br />
                  Your Direct Market.
                </>
              )}
            </h1>
            <p className="mb-0 text-white-50" style={{ fontSize: "16px" }}>
              {lang === "ta"
                ? "இடைத்தரகர் இல்லாத நேரடி விவசாய வர்த்தகம். உங்களின் உழைப்பிற்கு முழுமையான லாபம்!"
                : "Zero intermediary deductions. Receive buyer orders directly and retain 100% of your crop value."}
            </p>
          </div>
        </div>

        {/* RIGHT FARMER FORM */}
        <div className="fl-form-area">
          {/* LANGUAGE SELECTOR */}
          <div className="fl-lang-bar">
            <span className="small text-muted fw-semibold">🌐 {t("language", lang)}:</span>
            <button
              type="button"
              className={`fl-lang-btn ${lang === "en" ? "active" : ""}`}
              onClick={() => handleLangChange("en")}
            >
              English
            </button>
            <button
              type="button"
              className={`fl-lang-btn ${lang === "ta" ? "active" : ""}`}
              onClick={() => handleLangChange("ta")}
            >
              தமிழ்
            </button>
          </div>

          <h2 className="fl-title">👨‍🌾 {t("farmerLoginTitle", lang)}</h2>
          <p className="fl-sub">{t("farmerLoginSub", lang)}</p>

          {error && <div className="alert alert-danger py-2 rounded-3 small">{error}</div>}

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-bold small text-dark">
                {t("farmerLoginIdentifierLabel", lang)}
              </label>
              <input
                type="text"
                className="fl-input"
                placeholder={t("farmerLoginIdentifierPlaceholder", lang)}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
              <div className="form-text small" style={{ fontSize: "11px" }}>
                {lang === "ta"
                  ? "உங்கள் 10-இலக்க கைபேசி எண் அல்லது FMR-XXXXXX ஐடி கொண்டு நுழையலாம்."
                  : "You can enter your 10-digit mobile number or system-generated Farmer ID."}
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold small text-dark">
                {t("farmerLoginPasswordLabel", lang)}
              </label>
              <input
                type="password"
                className="fl-input"
                placeholder={t("farmerLoginPasswordPlaceholder", lang)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="fl-btn" disabled={loading}>
              {loading ? t("processing", lang) : t("farmerLoginButton", lang)}
            </button>
          </form>

          <div className="mt-4 pt-3 border-top text-center">
            <p className="small text-muted mb-2">{t("noFarmerAccount", lang)}</p>
            <Link to="/farmer/register" className="btn btn-outline-success fw-bold w-100 py-2 rounded-3">
              🌾 {t("registerFarmerNow", lang)}
            </Link>
          </div>

          <div className="mt-3 text-center">
            <Link to="/login" className="small text-muted text-decoration-none">
              🛒 {lang === "ta" ? "வாடிக்கையாளரா? இங்கு உள்நுழையவும்" : "Are you a buyer? Sign in to Buyer Portal"} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
