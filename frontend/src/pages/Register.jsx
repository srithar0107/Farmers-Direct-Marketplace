import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api.js";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer", phone: "", location: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Enter a valid email");
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      return setError("Password must be at least 8 characters with a letter and a number");
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h2 className="mb-3">Create account</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <input className="form-control mb-3" placeholder="Full name" required value={form.name} onChange={set("name")} />
          <input className="form-control mb-3" type="email" placeholder="Email" required value={form.email} onChange={set("email")} />
          <input className="form-control mb-3" type="password" placeholder="Password (8+ chars, letter and number)" required value={form.password} onChange={set("password")} />
          <select className="form-select mb-3" value={form.role} onChange={set("role")}>
            <option value="customer">I am a customer</option>
            <option value="farmer">I am a farmer</option>
          </select>
          <input className="form-control mb-3" placeholder="Phone" value={form.phone} onChange={set("phone")} />
          <input className="form-control mb-3" placeholder="Location (village / city)" value={form.location} onChange={set("location")} />
          <button className="btn btn-success w-100">Register</button>
        </form>
        <p className="mt-3">Already registered? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}
