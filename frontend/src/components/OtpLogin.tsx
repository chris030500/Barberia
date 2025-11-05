// src/components/OtpLogin.tsx
import { useEffect, useRef, useState } from "react";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import toast from "react-hot-toast";

const toMxE164 = (national10: string) => {
  const only = (national10 || "").replace(/\D/g, "");
  if (only.length !== 10) return null;
  return `+52${only}`;
};

export default function OtpLogin() {
  const auth = getAuth();

  const [mxPhone, setMxPhone] = useState(""); // 10 dígitos MX
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const confirmRef = useRef<ConfirmationResult | null>(null);
  const timerRef = useRef<number | null>(null);

  // ===== reCAPTCHA inline =====
  useEffect(() => {
    if ((window as any).recaptchaVerifier) return;

    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-slot", {
      size: "invisible",
      badge: "inline",
      callback: () => {},
      "expired-callback": () => toast.error("reCAPTCHA expiró, intenta de nuevo"),
    });

    return () => {
      const v = (window as any).recaptchaVerifier as RecaptchaVerifier | undefined;
      v?.clear();
      (window as any).recaptchaVerifier = undefined;
    };
  }, [auth]);

  // temporizador de reenvío
  useEffect(() => {
    if (resendIn <= 0) return;
    timerRef.current = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [resendIn]);

  const onChangeMxPhone = (v: string) => {
    const only = v.replace(/\D/g, "").slice(0, 10);
    setMxPhone(only);
  };

  const sendCode = async () => {
    const e164 = toMxE164(mxPhone);
    if (!e164) return toast.error("Ingresa 10 dígitos de México. Ej.: 5512345678");

    setLoading(true);
    try {
      const verifier = (window as any).recaptchaVerifier as RecaptchaVerifier | undefined;
      if (!verifier) throw new Error("reCAPTCHA no inicializado");

      const result = await signInWithPhoneNumber(auth, e164, verifier);
      confirmRef.current = result;
      setStep("code");
      setResendIn(45);
      toast.success("SMS enviado");
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.code === "auth/too-many-requests"
          ? "Demasiados intentos. Espera un momento."
          : err?.code === "auth/invalid-phone-number"
          ? "Teléfono inválido."
          : err?.message ?? "Error enviando código";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    if (!confirmRef.current) return toast.error("Primero envía el código");
    if (!/^\d{4,8}$/.test(code)) return toast.error("Código inválido");

    setLoading(true);
    try {
      await confirmRef.current.confirm(code);
      toast.success("Autenticado");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.code === "auth/invalid-verification-code"
          ? "Código incorrecto"
          : "No se pudo verificar"
      );
    } finally {
      setLoading(false);
    }
  };

  const backToPhone = () => {
    setStep("phone");
    setCode("");
  };

  return (
    <div className="space-y-4">
      {/* === STEP: TELÉFONO === */}
      {step === "phone" && (
        <>
          <label className="block text-sm text-neutral-400 mb-1">Teléfono</label>

          {/* Contenedor pill con banderita y chip +52 */}
          <div
            className="
              flex items-center gap-2 rounded-2xl border border-border bg-surface/90
              shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
              focus-within:border-emerald-700 focus-within:ring focus-within:ring-emerald-600/30
              px-2 py-2
            "
          >
            {/* Banderita México */}
            <span
              className="
                inline-flex h-6 w-8 overflow-hidden rounded-md ring-1 ring-black/10
                shadow-sm
              "
              aria-hidden
              title="México"
            >
              {/* SVG bandera MX */}
              <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                <rect width="1" height="2" x="0" fill="#006847" />
                <rect width="1" height="2" x="1" fill="#fff" />
                <rect width="1" height="2" x="2" fill="#ce1126" />
              </svg>
            </span>

            {/* Chip +52 */}
            <span
              className="
                select-none rounded-full border border-neutral-700/60 bg-gradient-to-b
                from-neutral-900/60 to-neutral-900/20 px-2.5 py-1 text-xs font-medium
                text-neutral-200 shadow-sm
              "
            >
              +52
            </span>

            {/* Separador tenue */}
            <div className="h-6 w-px bg-neutral-800/70" />

            {/* Input nacional 10 dígitos */}
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              className="
                flex-1 bg-transparent px-2 py-1.5 outline-none placeholder:text-neutral-600
                text-[15px]
              "
              placeholder="5512345678"
              value={mxPhone}
              onChange={(e) => onChangeMxPhone(e.target.value)}
            />

            {/* Botón enviar dentro del pill */}
            <button
              onClick={sendCode}
              disabled={loading || mxPhone.length !== 10}
              className="
                rounded-xl border border-emerald-700 bg-emerald-900/30 px-3 py-1.5 text-sm
                hover:bg-emerald-900/50 disabled:opacity-60 transition-colors
              "
            >
              {loading ? "Enviando…" : "Enviar código"}
            </button>
          </div>
        </>
      )}

      {/* === STEP: CÓDIGO === */}
      {step === "code" && (
        <>
          <label className="block text-sm text-neutral-400 mb-1">Código SMS</label>

          <div
            className="
              flex items-center gap-2 rounded-2xl border border-border bg-surface/90
              shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
              focus-within:border-emerald-700 focus-within:ring focus-within:ring-emerald-600/30
              px-2 py-2
            "
          >
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              className="flex-1 bg-transparent px-3 py-1.5 outline-none placeholder:text-neutral-600 text-[15px]"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            />

            <div className="flex gap-2">
              <button
                onClick={confirmCode}
                disabled={loading}
                className="
                  rounded-xl border border-border px-3 py-1.5 text-sm
                  hover:bg-neutral-800 disabled:opacity-60 transition-colors
                "
              >
                Confirmar
              </button>

              <button
                onClick={backToPhone}
                className="
                  rounded-xl border border-border px-3 py-1.5 text-sm
                  hover:bg-neutral-800 transition-colors
                "
              >
                Cambiar número
              </button>
            </div>
          </div>

          {/* Reenviar */}
          <p className="mt-2 text-center text-xs text-neutral-500">
            {resendIn > 0 ? (
              <>Reenviar en <span className="tabular-nums">{resendIn}s</span></>
            ) : (
              <button
                onClick={sendCode}
                className="underline underline-offset-2 hover:text-neutral-300"
              >
                Reenviar código
              </button>
            )}
          </p>
        </>
      )}

      {/* Footer / reCAPTCHA inline */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-zinc-500">
          Protegido por reCAPTCHA.{" "}
          <a
            className="underline hover:text-zinc-300"
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Privacidad
          </a>{" "}
          y{" "}
          <a
            className="underline hover:text-zinc-300"
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noreferrer"
          >
            Términos
          </a>.
        </p>
        <div id="recaptcha-slot" className="shrink-0" />
      </div>
    </div>
  );
}
