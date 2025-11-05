import { Navigate } from "react-router-dom";
import { useAuth } from "@/stores/auth";

/**
 * Protege rutas por rol.
 * Ejemplo de uso:
 *   <RequireRole roles={["ADMIN", "BARBERO"]}>
 *      <CitasPage />
 *   </RequireRole>
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: JSX.Element;
}) {
  const { user } = useAuth();

  // Si no hay usuario autenticado, redirige al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normaliza roles (por si vienen en mayúsculas/minúsculas)
  const userRoles = (user.roles ?? []).map((r) => r.toUpperCase());
  const allowedRoles = roles.map((r) => r.toUpperCase());

  // Verifica si tiene al menos uno de los roles permitidos
  const hasAccess = allowedRoles.some((r) => userRoles.includes(r));

  if (!hasAccess) {
    // Puedes cambiar esto a una pantalla personalizada de "No autorizado"
    return <Navigate to="/" replace />;
  }

  return children;
}