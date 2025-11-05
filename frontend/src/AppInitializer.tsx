import { useEffect, useState } from "react";
import { useAuth } from "@/stores/auth";

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const { refresh } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        await refresh(); // intenta recuperar sesión con cookie refreshToken
      } catch {
        // ignora si no hay cookie
      } finally {
        setReady(true);
      }
    })();
  }, [refresh]);

  if (!ready) return null; // o spinner si prefieres
  return <>{children}</>;
}
