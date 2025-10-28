import { Facebook, Mail } from "lucide-react";

type Props = {
  onGoogle?: () => void;
  onFacebook?: () => void;
};

export default function SocialButtons({ onGoogle, onFacebook }: Props) {
  return (
    <div className="grid gap-3">
      <button
        onClick={onGoogle}
        className="inline-flex items-center justify-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-white/5"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" />
        Continuar con Google
      </button>
      <button
        onClick={onFacebook}
        className="inline-flex items-center justify-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-white/5"
      >
        <Facebook className="h-5 w-5 text-[#0866FF]" />
        Continuar con Facebook
      </button>
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Mail className="h-4 w-4" />
        <span>También podrás ingresar con tu teléfono.</span>
      </div>
    </div>
  );
}
