import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { errMsg, CATEGORIES } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

const empty = {
  name: "",
  category: "Vegetables",
  description: "",
  price: "",
  quantity: "",
  unit: "kg",
  location: "",
  availability: "Available",
  image: "",
  harvestDate: "",
  organic: false,
};

// Shrinks a photo in the browser so it is small and fast to upload
function shrinkPhoto(file, maxSide = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the photo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("This file is not a photo"));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

        let quality = 0.75;
        let out = canvas.toDataURL("image/jpeg", quality);
        while (out.length > 500000 && quality > 0.3) {
          quality -= 0.1;
          out = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProductForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const back = user.role === "admin" ? "/admin/products" : "/farmer/products";
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (id) {
      api
        .get(`/products/${id}`)
        .then((r) =>
          setForm({
            ...empty,
            ...r.data,
            image: r.data.image || "",
            organic: !!r.data.organic,
            harvestDate: r.data.harvestDate ? r.data.harvestDate.slice(0, 10) : "",
          })
        )
        .catch((e) => setError(errMsg(e)));
    }
  }, [id]);

  const choosePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      return setError("Please choose a photo (JPG or PNG)");
    }
    setPhotoBusy(true);
    try {
      const small = await shrinkPhoto(file);
      setForm((f) => ({ ...f, image: small }));
    } catch (err) {
      setError(err.message);
    } finally {
      setPhotoBusy(false);
      e.target.value = "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (Number(form.price) < 0 || Number(form.quantity) < 0) {
      return setError("Price and quantity cannot be negative");
    }
    if (photoBusy) return setError("Please wait, the photo is getting ready");

    const payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      price: form.price,
      quantity: form.quantity,
      unit: form.unit,
      location: form.location,
      availability: form.availability,
      image: form.image,
      organic: form.organic,
    };
    if (form.harvestDate) payload.harvestDate = form.harvestDate;

    try {
      if (id) await api.put(`/products/${id}`, payload);
      else await api.post("/products", payload);
      navigate(back);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-7">
        <h2 className="mb-3">{id ? "Edit product" : "Add product"}</h2>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={submit}>
          {/* PHOTO */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Product photo</label>
            {form.image ? (
              <img
                src={form.image}
                alt="Product"
                style={{
                  width: "100%",
                  maxHeight: 240,
                  objectFit: "cover",
                  borderRadius: 14,
                  marginBottom: 10,
                }}
              />
            ) : (
              <div
                style={{
                  height: 140,
                  borderRadius: 14,
                  background: "#eef6e6",
                  border: "2px dashed #b8d3ad",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#5a6b5a",
                  marginBottom: 10,
                }}
              >
                No photo yet
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={choosePhoto}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="btn btn-outline-success me-2"
              onClick={() => fileRef.current.click()}
              disabled={photoBusy}
            >
              {photoBusy ? "Preparing photo..." : form.image ? "Change photo" : "📷 Choose photo"}
            </button>
            {form.image && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setForm({ ...form, image: "" })}
              >
                Remove photo
              </button>
            )}
            <div className="form-text">
              You can pick a photo from your gallery or take a new one with your camera.
            </div>
          </div>

          <input
            className="form-control mb-3"
            placeholder="Product name (e.g. Grapes)"
            required
            value={form.name}
            onChange={set("name")}
          />

          <select
            className="form-select mb-3"
            value={form.category}
            onChange={set("category")}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <textarea
            className="form-control mb-3"
            rows="3"
            placeholder="Description"
            required
            value={form.description}
            onChange={set("description")}
          />

          <div className="row">
            <div className="col-md-4">
              <input
                className="form-control mb-3"
                type="number"
                min="0"
                placeholder="Price"
                required
                value={form.price}
                onChange={set("price")}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control mb-3"
                type="number"
                min="0"
                placeholder="Quantity"
                required
                value={form.quantity}
                onChange={set("quantity")}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select mb-3"
                value={form.unit}
                onChange={set("unit")}
              >
                {["kg", "quintal", "dozen", "piece", "litre"].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <input
            className="form-control mb-3"
            placeholder="Location (village / city)"
            required
            value={form.location}
            onChange={set("location")}
          />

          <label className="form-label mb-1">Harvest date (optional)</label>
          <input
            className="form-control mb-3"
            type="date"
            value={form.harvestDate}
            onChange={set("harvestDate")}
          />

          <select
            className="form-select mb-3"
            value={form.availability}
            onChange={set("availability")}
          >
            <option>Available</option>
            <option>Out of Stock</option>
          </select>

          <div className="form-check mb-4">
            <input
              className="form-check-input"
              type="checkbox"
              id="organic"
              checked={form.organic}
              onChange={(e) => setForm({ ...form, organic: e.target.checked })}
            />
            <label className="form-check-label" htmlFor="organic">
              This product is organic
            </label>
          </div>

          <button className="btn btn-success me-2" disabled={photoBusy}>
            Save
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate(back)}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}