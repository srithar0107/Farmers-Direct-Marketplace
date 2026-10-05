import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { homeFor } from "../api.js";

export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
