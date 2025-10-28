import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { enviarOtp, verificarOtp, me } from "../api/auth";
import { useAuth } from "../stores/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  telefono: z.string().min(10, "Ingresa un teléfono válido (E.164 o local)"),
  codigo: z.string().optional()
});

type FormData = z.infer<typeof schema>;

export default function OtpLogin() {
  const { setSession } = useAuth();
  const [enviado, setEnviado] = useState(false);
  const nav = useNavigate();

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { telefono: "" }
  });

  const onEnviar = async () => {
    const tel = getValues("telefono");
    await enviarOtp(tel);
    setEnviado(true);
  };

  const onVerificar = async () => {
    const tel = getValues("telefono");
    const code = getValues("codigo") ?? "";
    const res = await verificarOtp(tel, code);
    const token = res?.token as string;
    // opcional: pedir datos del usuario con /api/usuarios/me
    let user = null;
    try { user = await me(token); } catch {}
    setSession(token, user ? {
      id: user.id, nombre: user.nombre, avatarUrl: user.avatarUrl, telefonoE164: user.telefonoE164
    } : null);
    nav("/dashboard");
  };

  return (
    <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
      <div>
        <label className="text-sm opacity-80">Teléfono</label>
        <input
          className="mt-1 w-full rounded-lg bg-neutral-800 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/40"
          placeholder="+52 442 108 3497"
          {...register("telefono")}
        />
        {errors.telefono && <p className="text-red-400 text-sm mt-1">{errors.telefono.message}</p>}
      </div>

      {!enviado ? (
        <button onClick={handleSubmit(onEnviar)} className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 font-medium">
          Enviar código
        </button>
      ) : (
        <>
          <div>
            <label className="text-sm opacity-80">Código</label>
            <input
              className="mt-1 w-full rounded-lg bg-neutral-800 border border-white/10 px-3 py-2 outline-none tracking-widest text-center"
              placeholder="000000"
              {...register("codigo")}
            />
          </div>
          <button onClick={handleSubmit(onVerificar)} className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 font-medium">
            Verificar y entrar
          </button>
        </>
      )}
    </div>
  );
}
