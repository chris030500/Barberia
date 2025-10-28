import { useEffect } from "react";
import OtpLogin from "../components/OtpLogin";
import SocialButtons from "../components/SocialButtons";
import { useAuth } from "../stores/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Login() {
  const token = useAuth((s) => s.accessToken);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  const handleGoogle = () => {
    // Aquí integraremos el SDK para obtener idToken y llamar /auth/google
    toast("Pronto: login con Google", { icon: "⚙️" });
  };

  const handleFacebook = () => {
    // Aquí integraremos el SDK para obtener accessToken y llamar /auth/facebook
    toast("Pronto: login con Facebook", { icon: "⚙️" });
  };

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-10 lg:grid-cols-2">
      <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-b from-neutral-900/60 to-neutral-900/30 p-6">
        <h1 className="mb-2 text-2xl font-semibold">Bienvenido a BarberPro</h1>
        <p className="mb-6 text-sm text-neutral-400">
          Gestiona citas, clientes y servicios desde un panel rápido y moderno.
        </p>

        <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-lg font-medium">Acceso con teléfono (OTP)</h2>
          <OtpLogin />
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-lg font-medium">O bien, usa tus redes</h2>
          <SocialButtons onGoogle={handleGoogle} onFacebook={handleFacebook} />
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-20 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <div className="mb-6 h-40 w-full rounded-xl bg-gradient-to-br from-brand/30 via-transparent to-brand/10" />
          <h3 className="mb-2 text-xl font-semibold">Diseño profesional</h3>
          <p className="text-sm text-neutral-400">
            Tipografía cuidada, colores sobrios, bordes sutiles y componentes listos para producción.
            Todo optimizado para un flujo de reservas ágil.
          </p>
        </div>
      </div>
    </div>
  );
}
