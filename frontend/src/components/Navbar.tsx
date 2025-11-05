import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import UserMenu from "./UserMenu";
import { useAuth } from "@/stores/auth";

type LinkItem = { to: string; label: string; roles?: Array<"ADMIN" | "BARBERO" | "CLIENTE"> };

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  // Normaliza roles del usuario
  const roles = useMemo(() => (user?.roles ?? []).map((r) => r.toUpperCase()), [user]);
  const isAdmin = roles.includes("ADMIN");
  const isBarbero = roles.includes("BARBERO");
  const isCliente = roles.includes("CLIENTE");

  // Catálogo de enlaces con reglas de visibilidad
  const allLinks: LinkItem[] = useMemo(
    () => [
      { to: "/", label: "Inicio", roles: ["ADMIN", "BARBERO", "CLIENTE"] },
      { to: "/citas", label: "Citas", roles: ["ADMIN", "BARBERO"] },
      { to: "/barberos", label: "Barberos", roles: ["ADMIN"] },
      { to: "/servicios", label: "Servicios", roles: ["ADMIN"] },
      { to: "/booking", label: "Reservar", roles: ["ADMIN", "CLIENTE"] },
      { to: "/disponibilidad", label: "Disponibilidad", roles: ["ADMIN", "BARBERO"] },
    ],
    []
  );

  const visibleLinks = useMemo(() => {
    if (!roles.length) return [];
    return allLinks.filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)));
  }, [roles, allLinks]);

  // Bloquear scroll del body cuando el drawer está abierto (móvil)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 bg-neutral-950/80 backdrop-blur border-b border-zinc-800">
      <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8">
        <div className="h-full flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-emerald-600 inline-block" />
            <span className="font-semibold tracking-tight">
              Barber <span className="text-emerald-500">Pro</span>
            </span>
            {/* insignia de rol (opcional) */}
            {roles.length > 0 && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full border border-zinc-800 text-zinc-400">
                {isAdmin ? "ADMIN" : isBarbero ? "BARBERO" : isCliente ? "CLIENTE" : "USUARIO"}
              </span>
            )}
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            {visibleLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `transition hover:text-emerald-400 ${
                    isActive ? "text-emerald-400" : "text-zinc-300"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <UserMenu />

            {/* Botón hamburguesa */}
            <button
              type="button"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800/80 bg-neutral-900/50 hover:bg-neutral-900 transition"
              aria-label="Abrir menú"
              aria-expanded={open}
              aria-controls="mobile-drawer"
              onClick={() => setOpen(true)}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ====== Drawer móvil ====== */}
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Panel */}
      <aside
        id="mobile-drawer"
        className={`md:hidden fixed top-0 right-0 z-50 h-dvh w-[88%] max-w-sm
                    bg-neutral-950 border-l border-zinc-800 shadow-xl
                    transition-transform duration-200
                    ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header del drawer */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-800">
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-emerald-600 inline-block" />
            <span className="font-semibold tracking-tight">
              Barber <span className="text-emerald-500">Pro</span>
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800/80 bg-neutral-900/50 hover:bg-neutral-900 transition"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
              <path d="M6 6l12 12M18 6l-12 12" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Links */}
        <nav className="px-4 py-3 space-y-1 text-sm">
          {visibleLinks.map((l) => (
            <MobileLink key={l.to} to={l.to} onClick={() => setOpen(false)}>
              {l.label}
            </MobileLink>
          ))}

          <div className="mt-4 rounded-xl border border-zinc-800 p-3 text-xs text-zinc-400">
            ¿Necesitas ayuda? Escríbenos al soporte.
          </div>
        </nav>
      </aside>
    </nav>
  );
}

/** Item estilizado para el menú móvil */
function MobileLink({
  to,
  onClick,
  children,
}: {
  to: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 transition ${
          isActive
            ? "bg-emerald-600/15 text-emerald-400 border border-emerald-700/40"
            : "hover:bg-neutral-900 text-zinc-200 border border-transparent"
        }`
      }
    >
      {children}
    </NavLink>
  );
}