import { Navigate } from "react-router-dom";
import { useAuth } from "./stores/auth";

function Skeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-6 w-40 rounded bg-neutral-800 mb-4" />
      <div className="h-4 w-full rounded bg-neutral-800" />
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, user, loading } = useAuth();

  if (loading) return <Skeleton />;

  if (!user) return <Navigate to="/login" replace />;

  // Ejemplo: fuerza onboarding si le faltan datos
  if (!user.nombre) return <Navigate to="/" replace />;

  return <>{children}</>;
}