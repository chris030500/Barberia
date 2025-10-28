import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./stores/auth";
import { useEffect, useRef } from "react";

export default function App() {
  const { accessToken, refresh, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const triedRefresh = useRef(false);

  useEffect(() => {
    if (!accessToken && !triedRefresh.current) {
      triedRefresh.current = true;
      // refresh debe devolver boolean (true si refrescó, false si no hay cookie)
      refresh().then(ok => {
        if (!ok && !loc.pathname.startsWith("/auth")) {
          nav("/auth");
        }
      });
    }
  }, [accessToken, refresh, loc.pathname, nav]);

  const handleLogout = async () => {
    await logout();     // limpia token + pega /auth/logout
    nav("/auth");
  };

  const isAuthPage = loc.pathname.startsWith("/auth");

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-white/10 sticky top-0 backdrop-blur bg-neutral-950/70">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-wide">Barber Pro</Link>
          <nav className="flex gap-4 text-sm">
            {!isAuthPage && accessToken && (
              <>
                <Link className="opacity-90 hover:opacity-100" to="/dashboard">Dashboard</Link>
                <button onClick={handleLogout} className="opacity-90 hover:opacity-100">Salir</button>
              </>
            )}
            {!isAuthPage && !accessToken && (
              <Link className="opacity-90 hover:opacity-100" to="/auth">Ingresar</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
