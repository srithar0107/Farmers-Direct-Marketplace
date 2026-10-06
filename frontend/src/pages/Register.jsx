import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api.js";
import farmerImage from "../assets/farmer-login.jpg";
import customerImage from "../assets/customer-login.jpg";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "farmer",
    phone: "",
    location: "",
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      return setError("Enter a valid email");
    }

    if (
      form.password.length < 8 ||
      !/[A-Za-z]/.test(form.password) ||
      !/\d/.test(form.password)
    ) {
      return setError(
        "Password must be at least 8 characters with a letter and a number"
      );
    }

    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const isFarmer = form.role === "farmer";

  const visualStyle = {
    backgroundImage: isFarmer
      ? `linear-gradient(135deg, rgba(19, 125, 42, 0.82), rgba(75, 180, 58, 0.62)), url(${farmerImage})`
      : `linear-gradient(180deg, rgba(23, 107, 53, 0.55), rgba(23, 107, 53, 0.9)), url(${customerImage})`,
    backgroundSize: "cover",
    backgroundPosition: isFarmer ? "center" : "center top",
  };

  return (
    <div className="register-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .register-page {
          min-height: calc(100vh - 70px);
          background: #f4f8ed;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
        }

        .register-card {
          width: 100%;
          max-width: 1180px;
          min-height: 700px;
          background: white;
          border-radius: 28px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 46% 54%;
          box-shadow: 0 18px 50px rgba(30, 80, 30, 0.12);
        }

        .register-visual {
          position: relative;
          min-height: 700px;
          padding: 55px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
          overflow: hidden;
          background-color: #176b35;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 27px;
          font-weight: 700;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .brand-icon {
          font-size: 30px;
        }

        .visual-content {
          max-width: 480px;
        }

        .visual-content h1 {
          font-size: clamp(36px, 4vw, 54px);
          line-height: 1.08;
          margin: 0 0 20px;
          font-weight: 750;
          letter-spacing: -1.5px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .visual-content p {
          font-size: 18px;
          line-height: 1.65;
          margin: 0;
          color: rgba(255, 255, 255, 0.95);
          text-shadow: 0 1px 6px rgba(0, 0, 0, 0.3);
        }

        .visual-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 28px;
          padding: 10px 16px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.28);
          font-size: 14px;
        }

        .register-form-area {
          padding: 55px 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .form-heading h2 {
          margin: 0;
          font-size: 36px;
          color: #172b18;
          letter-spacing: -1px;
        }

        .form-heading p {
          margin: 8px 0 28px;
          color: #687568;
          font-size: 16px;
        }

        .role-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #eef1e7;
          padding: 5px;
          border-radius: 16px;
          margin-bottom: 28px;
        }

        .role-button {
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

        .role-button.active {
          background: white;
          color: #187c2e;
          box-shadow: 0 4px 12px rgba(30, 80, 30, 0.10);
        }

        .form-group {
          margin-bottom: 17px;
        }

        .form-group label {
          display: block;
          margin-bottom: 7px;
          font-weight: 600;
          color: #263426;
          font-size: 14px;
        }

        .form-input {
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

        .form-input:focus {
          border-color: #2fa43a;
          box-shadow: 0 0 0 4px rgba(47, 164, 58, 0.10);
        }

        .register-button {
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

        .register-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(34, 137, 47, 0.22);
        }

        .error-box {
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

        .login-link a:hover {
          text-decoration: underline;
        }

        @media (max-width: 850px) {
          .register-card {
            grid-template-columns: 1fr;
          }

          .register-visual {
            min-height: 320px;
            padding: 35px;
          }

          .visual-content h1 {
            font-size: 38px;
          }

          .register-form-area {
            padding: 40px 30px;
          }
        }

        @media (max-width: 500px) {
          .register-page {
            padding: 12px;
          }

          .register-card {
            border-radius: 18px;
          }

          .register-visual {
            min-height: 300px;
            padding: 25px;
          }

          .register-form-area {
            padding: 30px 20px;
          }

          .form-heading h2 {
            font-size: 30px;
          }
        }
      `}</style>

      <div className="register-card">
        {/* LEFT SIDE */}
        <div className="register-visual" style={visualStyle}>
          <div className="brand">
            <span className="brand-icon">🌿</span>
            <span>Farmers' Direct</span>
          </div>

          <div className="visual-content">
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

                <div className="visual-badge">🌱 Sell directly to customers</div>
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

                <div className="visual-badge">🥕 Discover fresh local produce</div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="register-form-area">
          <div className="form-heading">
            <h2>Create your account</h2>

            <p>
              {isFarmer
                ? "Start selling your harvest directly to customers."
                : "Discover fresh produce from farmers near you."}
            </p>
          </div>

          {/* FARMER / BUYER SWITCH */}
          <div className="role-switch">
            <button
              type="button"
              className={`role-button ${isFarmer ? "active" : ""}`}
              onClick={() => setForm({ ...form, role: "farmer" })}
            >
              I'm a Farmer
            </button>

            <button
              type="button"
              className={`role-button ${!isFarmer ? "active" : ""}`}
              onClick={() => setForm({ ...form, role: "customer" })}
            >
              I'm a Buyer
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label>Full name</label>
              <input
                className="form-input"
                type="text"
                placeholder={isFarmer ? "Enter your full name" : "Enter your name"}
                required
                value={form.name}
                onChange={set("name")}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={set("email")}
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                className="form-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={set("phone")}
              />
            </div>

            <div className="form-group">
              <label>{isFarmer ? "Farm location" : "Delivery location"}</label>
              <input
                className="form-input"
                type="text"
                placeholder={
                  isFarmer ? "Village, District, State" : "City, District, State"
                }
                value={form.location}
                onChange={set("location")}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="8+ characters, letter and number"
                required
                value={form.password}
                onChange={set("password")}
              />
            </div>

            <button className="register-button" type="submit">
              {isFarmer ? "Create Farmer Account" : "Create Buyer Account"}
            </button>
          </form>

          <p className="login-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}