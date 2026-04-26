// src/auth/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  // Güvenlik: sadece `user` bilgisini kontrol et. localStorage'deki
  // `token` varlığı doğrulanmamışsa yanlış pozitiflere yol açabiliyordu.
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
