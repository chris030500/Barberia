import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { enviarOtp, verificarOtp, me } from "../api/auth";
import { useAuth } from "../stores/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  telefono: z
    .string()
    .min(10, "Ingresa un teléfono válido")
    .regex(/^\+?\d{10,15}$/, "Formato sugerido: E.164 (+52155...)"),
  codigo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function OtpLogin() {
  const { setSession } = useAuth();
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState<"enviar" | "verificar" | null>(null);
  const nav = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { telefono: "" },
  });

  const onEnviar = async () => {
    try {
      setLoading("enviar");
      const tel = getValues("telefono").replace(/\s+/g, "");
      await enviarOtp(tel);
      setEnviado(true);
    } catch (e) {
      console.error("Error enviando OTP:", e);
      alert("No se pudo enviar el código. Intenta de nuevo.");
    } finally {
      setLoading(null);
    }
  };

  const onVerificar = async () => {
    try {
      setLoading("verificar");
      const tel = getValues("telefono").replace(/\s+/g, "");
      const code = (getValues("codigo") ?? "").trim();

      if (!code || code.length < 4) {
        alert("Ingresa el código recibido.");
        return;
      }

      // Debe devolver { accessToken }
      const { accessToken } = await verificarOtp(tel, code);

      // 1) Guarda token en el store para que el interceptor ponga Authorization
      setSession(accessToken, null);

      // 2) Pide /me con el token ya activo en el interceptor
      let user = null;
      try {
        user = await me().then((r) => r);
      } catch {
        /* si falla /me, seguimos con token */
      }

      // 3) Actualiza usuario (si llegó)
      if (user) {
        setSession(accessToken, {
          id: user.id,
          nombre: user.nombre,
          avatarUrl: user.avatarUrl,
          telefonoE164: user.telefonoE164,
        });
      }

      nav("/dashboard");
    } catch (e) {
      console.error("Error verificando OTP:", e);
      alert("Código inválido o expirado. Intenta nuevamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
      <div>
        <label className="text-sm opacity-80">Teléfono</label>
        <input
          className="mt-1 w-full rounded-lg bg-neutral-800 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/40"
          placeholder="+52 55 1234 5678"
          {...register("telefono")}
        />
        {errors.telefono && (
          <p className="text-red-400 text-sm mt-1">{errors.telefono.message}</p>
        )}
      </div>

      {!enviado ? (
        <button
          onClick={handleSubmit(onEnviar)}
          disabled={loading === "enviar"}
          className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 py-2 font-medium"
        >
          {loading === "enviar" ? "Enviando..." : "Enviar código"}
        </button>
      ) : (
        <>
          <div>
            <label className="text-sm opacity-80">Código</label>
            <input
              className="mt-1 w-full rounded-lg bg-neutral-800 border border-white/10 px-3 py-2 outline-none tracking-widest text-center"
              placeholder="000000"
              maxLength={6}
              {...register("codigo")}
            />
          </div>
          <button
            onClick={handleSubmit(onVerificar)}
            disabled={loading === "verificar"}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 py-2 font-medium"
          >
            {loading === "verificar" ? "Verificando..." : "Verificar y entrar"}
          </button>

          <button
            type="button"
            onClick={handleSubmit(onEnviar)}
            disabled={loading === "enviar"}
            className="w-full rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 py-2 font-medium"
          >
            Reenviar código
          </button>
        </>
      )}
    </div>
  );
}
