import { useState } from 'react'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth'
import toast from 'react-hot-toast'

export default function SocialButtons() {
  const auth = getAuth()
  const [loading, setLoading] = useState<null | 'google' | 'facebook'>(null)

  const tryPopupThenRedirect = async (provider: GoogleAuthProvider | FacebookAuthProvider, key: 'google' | 'facebook') => {
    try {
      setLoading(key)
      await signInWithPopup(auth, provider)
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-supported-in-this-environment' || String(err?.message || '').includes('popup')) {
        await signInWithRedirect(auth, provider)
      } else {
        toast.error('No se pudo iniciar sesión')
        console.error(err)
      }
    } finally {
      setLoading(null)
    }
  }

  const signInGoogle = () => tryPopupThenRedirect(new GoogleAuthProvider(), 'google')
  const signInFacebook = () => tryPopupThenRedirect(new FacebookAuthProvider(), 'facebook')

  return (
    <div
      className="
        mt-4 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-inner backdrop-blur-sm
      "
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600/10">
          <BoltIcon className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-100">Accede rápidamente</p>
          <p className="text-xs text-zinc-500">Elige tu método preferido</p>
        </div>
      </div>

      <div className="grid gap-2.5">
        {/* Google */}
        <button
          onClick={signInGoogle}
          disabled={loading !== null}
          aria-busy={loading === 'google'}
          className={`
            relative flex h-10 w-full items-center justify-center gap-3 rounded-lg border px-3 text-sm font-medium
            transition-all focus-visible:ring-2 focus-visible:ring-emerald-600/40
            disabled:opacity-50 disabled:cursor-not-allowed
            border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-600
          `}
        >
          <span className="grid place-items-center" aria-hidden>
            <GoogleIcon />
          </span>
          <span>Continuar con Google</span>
          <span className="w-4" />
          {loading === 'google' && <Spinner className="absolute right-3 top-1/2 -translate-y-1/2" />}
        </button>

        {/* Facebook */}
        <button
          onClick={signInFacebook}
          disabled={loading !== null}
          aria-busy={loading === 'facebook'}
          className={`
            relative flex h-10 w-full items-center justify-center gap-3 rounded-lg border px-3 text-sm font-medium
            transition-all focus-visible:ring-2 focus-visible:ring-emerald-600/40
            disabled:opacity-50 disabled:cursor-not-allowed
            border-[#1877F2]/30 bg-[#1877F2]/90 text-white hover:bg-[#1877F2]
          `}
        >
          <span className="grid place-items-center" aria-hidden>
            <FacebookIcon />
          </span>
          <span>Continuar con Facebook</span>
          <span className="w-4" />
          {loading === 'facebook' && <Spinner className="absolute right-3 top-1/2 -translate-y-1/2" />}
        </button>
      </div>

      <p className="mt-3 text-[11px] text-zinc-500">
        Al continuar aceptas los{' '}
        <a href="#" className="underline underline-offset-2 hover:text-zinc-300">Términos</a> y el{' '}
        <a href="#" className="underline underline-offset-2 hover:text-zinc-300">Aviso de Privacidad</a>.
      </p>
    </div>
  )
}

/* ---------- Íconos (inline) ---------- */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.7 3.5-5.5 3.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 4 1.6l2.7-2.6C16.7 2.6 14.5 1.7 12 1.7 6.9 1.7 2.7 5.9 2.7 11s4.2 9.3 9.3 9.3c5.4 0 9-3.8 9-9.1 0-.6-.1-1-.1-1H12z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
      <path d="M22.5 12.06C22.5 6.5 18.04 2 12.5 2S2.5 6.5 2.5 12.06c0 5.04 3.68 9.22 8.49 9.94v-7.03H8.63v-2.91h2.36V9.86c0-2.33 1.38-3.62 3.5-3.62.99 0 2.03.18 2.03.18v2.24h-1.14c-1.12 0-1.47.7-1.47 1.41v1.69h2.5l-.4 2.91h-2.1V22c4.81-.72 8.49-4.9 8.49-9.94z"/>
    </svg>
  )
}

function BoltIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={['fill-emerald-500', className].join(' ')}>
      <path d="M11 21h-1l1-7H7l6-11h1l-1 7h4l-6 11z" />
    </svg>
  )
}

function Spinner({ className = '' }) {
  return (
    <svg
      className={['h-4 w-4 animate-spin text-white', className].join(' ')}
      viewBox="0 0 24 24"
      role="status"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  )
}
