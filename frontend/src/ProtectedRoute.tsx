import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./stores/auth";

function Skeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-6 w-40 rounded bg-neutral-800 mb-4" />
      <div className="h-4 w-full rounded bg-neutral-800" />
    </div>
  );
}

type Props = {
  children: React.ReactNode;
  requireProfileComplete?: boolean;
};

export default function ProtectedRoute({ children, requireProfileComplete = false }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Skeleton />;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  const roles = user.roles ?? [];
  const requiereDatosBasicos = requireProfileComplete && roles.includes("CLIENTE");

  const nombreValido = typeof user.nombre === "string" && user.nombre.trim().length > 0;
  const telefonoValido =
    typeof user.telefonoE164 === "string" && user.telefonoE164.trim().length > 0;
  const perfilCompleto = nombreValido && telefonoValido;

  if (requiereDatosBasicos && !perfilCompleto) {
    return <Navigate to="/perfil/completar" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
