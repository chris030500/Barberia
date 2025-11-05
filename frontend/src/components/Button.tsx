import { ComponentProps } from "react";
function clsx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type Props = ComponentProps<"button"> & {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export default function Button({ variant="primary", size="md", className, ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-emerald-600/40 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  }[size];
  const variants = {
    primary: "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500",
    ghost:   "border-border bg-transparent text-neutral-200 hover:bg-neutral-800",
    danger:  "border-red-600 bg-red-600 text-white hover:bg-red-500",
  }[variant];

  return <button className={clsx(base, sizes, variants, className)} {...props} />;
}
