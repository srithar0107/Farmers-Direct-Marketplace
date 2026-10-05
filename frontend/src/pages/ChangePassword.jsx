import { useState } from "react";
import api, { errMsg } from "../api.js";

export default function ChangePassword() {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put("/auth/change-password", form);
      setMsg({ type: "success", text: data.message });
      setForm({ oldPassword: "", newPassword: "" });
    } catch (err) { setMsg({ type: "danger", text: errMsg(err) }); }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <h2 className="mb-3">Change password</h2>
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
        <form onSubmit={submit}>
          <input className="form-control mb-3" type="password" placeholder="Old password" required
            value={form.oldPassword} onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} />
          <input className="form-control mb-3" type="password" placeholder="New password" required
            value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          <button className="btn btn-success w-100">Update password</button>
        </form>
      </div>
    </div>
  );
}
