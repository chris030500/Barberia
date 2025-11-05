// src/pages/Login.tsx
import { useEffect } from "react";
import { useAuth } from "@/stores/auth";
import { useNavigate } from "react-router-dom";
import SocialButtons from "@/components/SocialButtons";
import OtpLogin from "@/components/OtpLogin";

export default function Login() {
  const token = useAuth((s) => s.accessToken);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate("/", { replace: true });
  }, [token, navigate]);

  return (
    // 👇 NO usamos otro contenedor ancho aquí; AppShell ya aplica .app-container
    <section aria-label="Login" className="grid lg:grid-cols-2 gap-y-8">
      {/* Branding: oculto en móviles para priorizar el login */}
      <div className="hidden lg:flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/25 via-transparent to-cyan-400/20 blur-3xl" />
        <div className="relative z-10 max-w-md text-center px-6">
          <h1 className="text-5xl font-bold leading-tight">
            Barber <span className="text-emerald-500">Pro</span>
          </h1>
          <p className="mt-4 text-zinc-400">
            Gestiona citas, barberos y clientes desde un panel moderno y seguro.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-zinc-400">
            <li>✔ Recordatorios por SMS</li>
            <li>✔ Panel de turnos en tiempo real</li>
            <li>✔ Clientes fidelizados</li>
          </ul>
        </div>
      </div>

      {/* Card de Login: centrado vertical/horizontal en móvil y desktop */}
      <div
        className="
          grid place-items-center
          py-6 sm:py-10 lg:py-12
          min-h-[70svh]                 /* altura sensible a teclado/viewport móvil */
        "
      >
        <div
          className="
            w-full max-w-md mx-auto space-y-5
            [@media(max-width:360px)]:px-1   /* respira en pantallas ultra estrechas */
          "
        >
          <div
            className="
              rounded-2xl border border-zinc-800/80 bg-neutral-900/60 backdrop-blur
              p-5 sm:p-6
              shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_12px_30px_-12px_rgba(0,0,0,0.5)]
            "
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-1.5 sm:mb-2">Acceso</h2>
            <p className="text-sm text-zinc-400 mb-5 sm:mb-6">
              Ingresa con tu número de teléfono o tus redes sociales.
            </p>

            <div className="space-y-5">
              <OtpLogin />

              <div className="relative">
                <div className="my-3 sm:my-4 flex items-center gap-3 text-[12px] text-zinc-500">
                  <span className="flex-1 h-px bg-zinc-800/80" />
                  <span className="shrink-0">o continúa con</span>
                  <span className="flex-1 h-px bg-zinc-800/80" />
                </div>
                <SocialButtons />
              </div>
            </div>
          </div>

          <p className="px-2 text-[11px] sm:text-xs leading-relaxed text-center text-zinc-400">
            Al continuar aceptas nuestros{" "}
            <a href="#" className="text-emerald-500 hover:underline">Términos</a>{" "}
            y el{" "}
            <a href="#" className="text-emerald-500 hover:underline">Aviso de privacidad</a>.
          </p>
        </div>
      </div>
    </section>
  );
}