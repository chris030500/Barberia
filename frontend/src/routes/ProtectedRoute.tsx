import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../stores/auth";

export default function ProtectedRoute() {
  const { accessToken } = useAuth();
  const loc = useLocation();

  if (!accessToken) {
    return <Navigate to="/auth" replace state={{ from: loc.pathname }} />;
  }

  return <Outlet />;
}
