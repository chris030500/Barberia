import { useEffect } from "react";
import OtpLogin from "@/components/OtpLogin";
import SocialButtons from "@/components/SocialButtons";
import { useAuth } from "@/stores/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const token = useAuth((s) => s.accessToken);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate("/", { replace: true });
  }, [token, navigate]);

  const API = import.meta.env.VITE_API_URL;

  // Ajusta estas rutas si en tu backend usas /auth/google/init y /auth/facebook/init
  const handleGoogle = () => (window.location.href = `${API}/oauth2/authorization/google`);
  const handleFacebook = () => (window.location.href = `${API}/oauth2/authorization/facebook`);

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-10 lg:grid-cols-2">
      <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-b from-neutral-900/60 to-neutral-900/30 p-6">
        <h1 className="mb-2 text-2xl font-semibold">Acceso</h1>
        <p className="mb-6 text-sm text-neutral-400">Ingresa con tu teléfono o con tus redes.</p>

        <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-lg font-medium">Teléfono (OTP)</h2>
          <OtpLogin />
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-lg font-medium">O continúa con</h2>
          <SocialButtons onGoogle={handleGoogle} onFacebook={handleFacebook} />
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-20 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <div className="mb-6 h-40 w-full rounded-xl bg-gradient-to-br from-emerald-500/30 via-transparent to-emerald-500/10" />
          <h3 className="mb-2 text-xl font-semibold">Barber Pro</h3>
          <p className="text-sm text-neutral-400">Administra citas y clientes desde un panel moderno.</p>
        </div>
      </div>
    </div>
  );
}
