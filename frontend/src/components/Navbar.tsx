import { LogOut, ScissorsLineDashed, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  onLogout?: () => void;
  userName?: string;
  avatarUrl?: string | null;
};

export default function Navbar({ onLogout, userName, avatarUrl }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-neutral-950/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="group inline-flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand/15 text-brand">
            <ScissorsLineDashed className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight group-hover:text-brand transition-colors">
            BarberPro
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link to="/citas" className="rounded-md px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white">
            Citas
          </Link>
          <Link to="/clientes" className="rounded-md px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white">
            Clientes
          </Link>
          <Link to="/servicios" className="rounded-md px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white">
            Servicios
          </Link>

          <div className="mx-2 h-6 w-px bg-[var(--color-border)]" />

          <div className="flex items-center gap-2">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName ?? "Usuario"} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                <UserRound className="h-4 w-4 text-neutral-300" />
              </div>
            )}
            {userName && <span className="hidden sm:block text-sm text-neutral-300">{userName}</span>}
            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-neutral-200 hover:bg-white/5"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Salir</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
