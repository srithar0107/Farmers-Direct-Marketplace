import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg, homeFor } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import farmerImage from "../assets/farmer-login.jpg";

export default function Login() {
  const [mode, setMode] = useState("farmer");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const isFarmer = mode === "farmer";

  const visualStyle = isFarmer
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(19, 125, 42, 0.82), rgba(75, 180, 58, 0.62)), url(${farmerImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      login(data);
      navigate(homeFor(data.user.role));
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="login-page">
      <style>{`
        * { box-sizing: border-box; }

        .login-page {
          min-height: calc(100vh - 70px);
          background: #f4f8ed;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
        }

        .login-card {
          width: 100%;
          max-width: 1100px;
          min-height: 620px;
          background: white;
          border-radius: 28px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 46% 54%;
          box-shadow: 0 18px 50px rgba(30, 80, 30, 0.12);
        }

        .login-visual {
          position: relative;
          min-height: 620px;
          padding: 55px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
          overflow: hidden;
          transition: background 0.3s ease;
        }

        .login-visual.farmer { background-color: #176b35; }
        .login-visual.buyer { background: linear-gradient(145deg, #176b35, #4caf45); }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 27px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .login-visual-content { max-width: 480px; }

        .login-visual-content h1 {
          font-size: clamp(36px, 4vw, 52px);
          line-height: 1.08;
          margin: 0 0 20px;
          font-weight: 750;
          letter-spacing: -1.5px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
        }

        .login-visual-content p {
          font-size: 18px;
          line-height: 1.65;
          margin: 0;
          color: rgba(255, 255, 255, 0.94);
          text-shadow: 0 1px 6px rgba(0, 0, 0, 0.25);
        }

        .login-form-area {
          padding: 55px 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login-heading h2 {
          margin: 0;
          font-size: 36px;
          color: #172b18;
          letter-spacing: -1px;
        }

        .login-heading p {
          margin: 8px 0 28px;
          color: #687568;
          font-size: 16px;
        }

        .login-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #eef1e7;
          padding: 5px;
          border-radius: 16px;
          margin-bottom: 28px;
        }

        .login-switch button {
          border: 0;
          background: transparent;
          padding: 14px 10px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          color: #566052;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .login-switch button.active {
          background: white;
          color: #187c2e;
          box-shadow: 0 4px 12px rgba(30, 80, 30, 0.10);
        }

        .login-group { margin-bottom: 17px; }

        .login-group label {
          display: block;
          margin-bottom: 7px;
          font-weight: 600;
          color: #263426;
          font-size: 14px;
        }

        .login-input {
          width: 100%;
          height: 50px;
          border: 1px solid #dce3d7;
          border-radius: 12px;
          padding: 0 15px;
          font-size: 15px;
          outline: none;
          transition: 0.2s ease;
          background: #fff;
        }

        .login-input:focus {
          border-color: #2fa43a;
          box-shadow: 0 0 0 4px rgba(47, 164, 58, 0.10);
        }

        .login-button {
          width: 100%;
          height: 52px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(90deg, #16872c, #51bc43);
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 5px;
          transition: 0.2s ease;
        }

        .login-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(34, 137, 47, 0.22);
        }

        .login-error {
          background: #fff0f0;
          color: #b42318;
          border: 1px solid #f3c5c5;
          padding: 11px 14px;
          border-radius: 10px;
          margin-bottom: 18px;
          font-size: 14px;
        }

        .login-link {
          text-align: center;
          margin: 20px 0 0;
          color: #697469;
          font-size: 14px;
        }

        .login-link a {
          color: #17842d;
          font-weight: 700;
          text-decoration: none;
        }

        .login-link a:hover { text-decoration: underline; }

        @media (max-width: 850px) {
          .login-card { grid-template-columns: 1fr; }
          .login-visual { min-height: 300px; padding: 35px; }
          .login-visual-content h1 { font-size: 36px; }
          .login-form-area { padding: 40px 30px; }
        }

        @media (max-width: 500px) {
          .login-page { padding: 12px; }
          .login-card { border-radius: 18px; }
          .login-visual { min-height: 280px; padding: 25px; }
          .login-form-area { padding: 30px 20px; }
          .login-heading h2 { font-size: 30px; }
        }
      `}</style>

      <div className="login-card">
        {/* LEFT SIDE */}
        <div
          className={`login-visual ${isFarmer ? "farmer" : "buyer"}`}
          style={visualStyle}
        >
          <div className="login-brand">
            <span>🌿</span>
            <span>Farmers' Direct</span>
          </div>

          <div className="login-visual-content">
            {isFarmer ? (
              <>
                <h1>
                  Your harvest.
                  <br />
                  Your price.
                  <br />
                  Your market.
                </h1>
                <p>
                  Connect directly with customers and get more value from the
                  produce you grow.
                </p>
              </>
            ) : (
              <>
                <h1>
                  Know your food.
                  <br />
                  Know your farmer.
                </h1>
                <p>
                  Discover fresh produce from nearby farms with transparent
                  prices and convenient delivery.
                </p>
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="login-form-area">
          <div className="login-heading">
            <h2>{isFarmer ? "Farmer Login" : "Customer Login"}</h2>
            <p>
              {isFarmer
                ? "Welcome back. Manage your harvest and products."
                : "Welcome back. Find fresh produce from local farms."}
            </p>
          </div>

          <div className="login-switch">
            <button
              type="button"
              className={isFarmer ? "active" : ""}
              onClick={() => setMode("farmer")}
            >
              Farmer
            </button>
            <button
              type="button"
              className={!isFarmer ? "active" : ""}
              onClick={() => setMode("customer")}
            >
              Customer
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="login-group">
              <label>Email</label>
              <input
                className="login-input"
                type="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="login-group">
              <label>Password</label>
              <input
                className="login-input"
                type="password"
                placeholder="Enter your password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button className="login-button" type="submit">
              {isFarmer ? "Login as Farmer" : "Login as Customer"}
            </button>
          </form>

          <p className="login-link">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}