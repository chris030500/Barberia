import { useAuth } from "../stores/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { accessToken, refresh, user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      if (!accessToken) {
        const t = await refresh();
        if (!t) nav("/auth");
      }
    })();
  }, [accessToken, refresh, nav]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="opacity-80">Bienvenido {user?.nombre ?? "Barber"}</p>
      <div className="rounded-xl border border-white/10 p-6 bg-neutral-900/50">
        <p className="opacity-80">Aquí armaremos: agenda, barberos, clientes y check-in rápido.</p>
      </div>
    </div>
  );
}
