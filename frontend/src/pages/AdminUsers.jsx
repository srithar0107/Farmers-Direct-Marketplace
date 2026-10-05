import { useEffect, useState } from "react";
import api, { errMsg } from "../api.js";

const empty = { name: "", email: "", password: "", role: "customer", phone: "", location: "" };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = () => api.get("/users").then((r) => setUsers(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editId) await api.put(`/users/${editId}`, form);
      else await api.post("/users", form);
      setForm(empty); setEditId(null); load();
    } catch (err) { setError(errMsg(err)); }
  };

  const edit = (u) => {
    setEditId(u._id);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, phone: u.phone || "", location: u.location || "" });
    window.scrollTo(0, 0);
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this user and their products?")) return;
    try { await api.delete(`/users/${id}`); load(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <>
      <h2 className="mb-3">User management</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form className="row g-2 mb-4" onSubmit={submit}>
        <div className="col-md-4"><input className="form-control" placeholder="Name" required value={form.name} onChange={set("name")} /></div>
        <div className="col-md-4"><input className="form-control" type="email" placeholder="Email" required value={form.email} onChange={set("email")} /></div>
        <div className="col-md-4"><input className="form-control" type="password" placeholder={editId ? "New password (optional)" : "Password"} required={!editId} value={form.password} onChange={set("password")} /></div>
        <div className="col-md-3">
          <select className="form-select" value={form.role} onChange={set("role")}>
            <option>customer</option><option>farmer</option><option>admin</option>
          </select>
        </div>
        <div className="col-md-3"><input className="form-control" placeholder="Phone" value={form.phone} onChange={set("phone")} /></div>
        <div className="col-md-3"><input className="form-control" placeholder="Location" value={form.location} onChange={set("location")} /></div>
        <div className="col-md-3">
          <button className="btn btn-success me-2">{editId ? "Update user" : "Add user"}</button>
          {editId && <button type="button" className="btn btn-outline-secondary" onClick={() => { setEditId(null); setForm(empty); }}>Cancel</button>}
        </div>
      </form>
      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Location</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.phone}</td><td>{u.location}</td>
                <td className="text-nowrap">
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => edit(u)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => remove(u._id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
