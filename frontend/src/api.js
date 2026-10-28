import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (e) =>
  e.response?.data?.message || e.message || "Something went wrong. Is the backend running?";

export const homeFor = (role) =>
  role === "admin"
    ? "/admin/dashboard"
    : role === "farmer"
    ? "/farmer/dashboard"
    : "/marketplace";

export const CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Greens",
  "Grains",
  "Pulses",
  "Spices",
  "Plantation",
  "Dairy",
  "Other",
];

export const CATEGORY_ICONS = {
  Vegetables: "🥬",
  Fruits: "🍎",
  Greens: "🌿",
  Grains: "🌾",
  Pulses: "🌱",
  Spices: "🌶️",
  Plantation: "🥥",
  Dairy: "🥛",
  Other: "🧺",
};

export const TN_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
  "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
  "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
  "Vellore", "Villupuram", "Virudhunagar"
];

export const formatPrice = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

export default api;