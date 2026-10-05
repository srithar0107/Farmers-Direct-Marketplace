import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg, homeFor } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      login(data);
      navigate(homeFor(data.user.role));
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <h2 className="mb-3">Login</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <input className="form-control mb-3" type="email" placeholder="Email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="form-control mb-3" type="password" placeholder="Password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn btn-success w-100">Login</button>
        </form>
        <p className="mt-3">New here? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
