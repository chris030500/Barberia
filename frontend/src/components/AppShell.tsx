import type { ReactNode } from "react";
import Navbar from "./Navbar";

type Props = {
  children: ReactNode;
  onLogout?: () => void;
  userName?: string;
  avatarUrl?: string | null;
};

export default function AppShell({ children, onLogout, userName, avatarUrl }: Props) {
  return (
    <div className="min-h-dvh">
      <Navbar onLogout={onLogout} userName={userName} avatarUrl={avatarUrl} />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <footer className="mt-10 border-t border-[var(--color-border)] py-6 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} BarberPro — Hecho con ♥
      </footer>
    </div>
  );
}
