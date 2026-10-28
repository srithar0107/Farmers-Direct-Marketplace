import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg, homeFor } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { t, getLang, setLang } from "../i18n.js";
import customerImage from "../assets/customer-login.jpg";

export default function Login() {
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
      login(data);
      navigate(homeFor(data.user.role));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="buyer-login-page">
      <style>{`
        .buyer-login-page {
          min-height: calc(100vh - 70px);
          background: #f4f8ed;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }
        .bl-card {
          width: 100%;
          max-width: 1080px;
          min-height: 600px;
          background: #fff;
          border-radius: 28px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 48% 52%;
          box-shadow: 0 18px 50px rgba(30, 80, 30, 0.12);
          border: 1px solid #dce8d6;
        }
        .bl-visual {
          position: relative;
          min-height: 600px;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #fff;
          background: linear-gradient(180deg, rgba(23, 107, 53, 0.65), rgba(23, 107, 53, 0.94)), url(${customerImage});
          background-size: cover;
          background-position: center top;
        }
        .bl-badge {
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
        .bl-form-area {
          padding: 48px 52px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .bl-lang-bar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .bl-lang-btn {
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
        .bl-lang-btn.active {
          background: #1e7e34;
          color: #fff;
          border-color: #1e7e34;
        }
        .bl-title {
          font-size: clamp(28px, 3.5vw, 36px);
          font-weight: 800;
          color: #172b18;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }
        .bl-sub {
          color: #556b57;
          font-size: 15px;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .bl-input {
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
        .bl-input:focus {
          border-color: #2e7d32;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.12);
        }
        .bl-btn {
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
        .bl-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(30, 126, 52, 0.25);
        }
        @media (max-width: 860px) {
          .bl-card { grid-template-columns: 1fr; }
          .bl-visual { min-height: 240px; padding: 28px; }
          .bl-form-area { padding: 32px 24px; }
        }
      `}</style>

      <div className="bl-card">
        {/* LEFT BUYER VISUAL */}
        <div className="bl-visual">
          <div>
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="fs-2">🌿</span>
              <span className="fs-4 fw-bold">{t("brandName", lang)}</span>
            </div>
            <div className="bl-badge">🛒 {lang === "ta" ? "வாடிக்கையாளர் தளம்" : "Buyer Marketplace"}</div>
          </div>

          <div>
            <h1 className="fw-bold display-6 mb-3">
              {lang === "ta" ? (
                <>
                  உங்கள் உணவை அறியுங்கள்.
                  <br />
                  உங்கள் விவசாயியை அறியுங்கள்.
                </>
              ) : (
                <>
                  Know your food.
                  <br />
                  Know your farmer.
                </>
              )}
            </h1>
            <p className="mb-0 text-white-50" style={{ fontSize: "16px" }}>
              {lang === "ta"
                ? "தமிழக விவசாயிகளின் புதிய அறுவடை விளைபொருட்கள் இடைத்தரகர் இன்றி உங்கள் இல்லத்திற்கு."
                : "Discover farm-fresh vegetables, fruits, coconut, and grains directly from verified Tamil Nadu growers."}
            </p>
          </div>
        </div>

        {/* RIGHT BUYER FORM */}
        <div className="bl-form-area">
          {/* LANGUAGE SELECTOR */}
          <div className="bl-lang-bar">
            <span className="small text-muted fw-semibold">🌐 {t("language", lang)}:</span>
            <button
              type="button"
              className={`bl-lang-btn ${lang === "en" ? "active" : ""}`}
              onClick={() => handleLangChange("en")}
            >
              English
            </button>
            <button
              type="button"
              className={`bl-lang-btn ${lang === "ta" ? "active" : ""}`}
              onClick={() => handleLangChange("ta")}
            >
              தமிழ்
            </button>
          </div>

          <h2 className="bl-title">🛒 {t("buyerLoginTitle", lang)}</h2>
          <p className="bl-sub">{t("buyerLoginSub", lang)}</p>

          {error && <div className="alert alert-danger py-2 rounded-3 small">{error}</div>}

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-bold small text-dark">
                {t("buyerLoginIdentifierLabel", lang)}
              </label>
              <input
                type="text"
                className="bl-input"
                placeholder={t("buyerLoginIdentifierPlaceholder", lang)}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold small text-dark">
                {t("buyerLoginPasswordLabel", lang)}
              </label>
              <input
                type="password"
                className="bl-input"
                placeholder={t("buyerLoginPasswordPlaceholder", lang)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="bl-btn" disabled={loading}>
              {loading ? t("processing", lang) : t("buyerLoginButton", lang)}
            </button>
          </form>

          <div className="mt-4 pt-3 border-top text-center">
            <p className="small text-muted mb-2">{t("noBuyerAccount", lang)}</p>
            <Link to="/register" className="btn btn-outline-success fw-bold w-100 py-2 rounded-3">
              🛒 {t("registerBuyerNow", lang)}
            </Link>
          </div>

          {/* PROMINENT LINK TO FARMER LOGIN */}
          <div className="mt-4 p-3 bg-light rounded-3 border text-center">
            <span className="small text-muted d-block mb-1">
              {lang === "ta" ? "நீங்கள் ஒரு விவசாயியா?" : "Are you a Tamil Nadu farmer?"}
            </span>
            <Link to="/farmer-login" className="fw-bold text-success text-decoration-none">
              🌾 {lang === "ta" ? "விவசாயி உள்நுழைவு தளம்" : "Go to Dedicated Farmer Login Portal"} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}