import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (e) => e.response?.data?.message || "Something went wrong. Is the backend running?";
export const homeFor = (role) =>
  role === "admin" ? "/admin/dashboard" : role === "farmer" ? "/farmer/dashboard" : "/marketplace";
export const CATEGORIES = ["Fruits", "Vegetables", "Grains", "Pulses", "Dairy", "Spices", "Other"];
export default api;
