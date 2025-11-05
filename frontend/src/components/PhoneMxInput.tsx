import { ComponentProps, useMemo } from "react";

type Props = {
  value: string;                   // solo dígitos (máx 10)
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string | null;
  helperText?: string | null;
} & Omit<ComponentProps<"input">, "value" | "onChange">;

function formatDisplay(v: string) {
  // 55 1234 5678 (agrega espacios mientras escribe)
  const d = v.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`;
}

export default function PhoneMxInput({
  value,
  onChange,
  disabled,
  error,
  helperText,
  ...rest
}: Props) {

  const display = useMemo(() => formatDisplay(value), [value]);
  const hasError = Boolean(error);

  return (
    <div className="w-full">
      <label className="mb-1 block text-xs text-zinc-400">Teléfono (México)</label>

      <div
        className={[
          "group relative flex items-center overflow-hidden rounded-xl border bg-zinc-900/60 backdrop-blur-sm",
          hasError ? "border-red-600/60 focus-within:border-red-600"
                   : "border-zinc-800 focus-within:border-emerald-700",
          "focus-within:ring-2 focus-within:ring-emerald-600/30 transition-colors"
        ].join(" ")}
      >
        {/* Badge +52 con banderita */}
        <div className="ml-2 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/70 px-2.5 py-1.5">
          {/* Bandera MX en SVG (mini) */}
          <svg width="16" height="12" viewBox="0 0 3 2" aria-hidden className="rounded-[2px]">
            <rect width="1" height="2" x="0" y="0" fill="#006847" />
            <rect width="1" height="2" x="1" y="0" fill="#fff" />
            <rect width="1" height="2" x="2" y="0" fill="#ce1126" />
          </svg>
          <span className="text-[11px] font-medium text-zinc-200">+52</span>
        </div>

        {/* separador */}
        <div className="mx-2 h-6 w-px bg-zinc-800" />

        {/* input */}
        <input
          {...rest}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="55 1234 5678"
          className={[
            "flex-1 bg-transparent pr-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500",
            "tracking-[0.06em]"
          ].join(" ")}
          value={display}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
            onChange(digits);
          }}
          disabled={disabled}
        />

        {/* estado/ayuda al final */}
        {!hasError && (
          <span className="mr-3 text-[11px] text-zinc-500">
            {value.length}/10
          </span>
        )}
      </div>

      {/* helper / error */}
      {hasError ? (
        <p className="mt-1 text-[11px] text-red-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-[11px] text-zinc-500">{helperText}</p>
      ) : null}
    </div>
  );
}
