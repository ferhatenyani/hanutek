"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "outline"
  | "ghost"
  | "danger"
  | "quiet";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-[0_10px_24px_-14px_rgba(47,107,255,0.8)] hover:bg-brand-deep active:bg-brand-deep",
  accent:
    "bg-mint text-white shadow-[0_10px_24px_-14px_rgba(18,183,106,0.8)] hover:bg-mint-deep active:bg-mint-deep",
  outline:
    "border border-hairline bg-white text-ink hover:border-brand/35 hover:bg-brand-tint",
  ghost: "text-muted hover:bg-mist hover:text-ink",
  danger: "border border-sale/25 bg-sale/5 text-sale hover:bg-sale/10",
  quiet:
    "text-ink/70 underline decoration-ink/25 underline-offset-4 hover:text-ink",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-10 px-4 text-[14px] gap-2",
  lg: "h-12 px-5 text-[15px] gap-2",
  xl: "h-14 px-6 text-[15px] gap-2.5",
};

const SHAPE = {
  soft: "rounded-soft-sm",
  control: "rounded-control",
  pill: "rounded-full",
} as const;

const BASE =
  "relative inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out-quint active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 disabled:active:scale-100";

export type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: keyof typeof SHAPE;
  block?: boolean;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "prefix">;

export function Button({
  children,
  variant = "primary",
  size = "md",
  shape = "soft",
  block = false,
  loading = false,
  leading,
  trailing,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(BASE, VARIANT[variant], SIZE[size], SHAPE[shape], block && "w-full", className)}
      {...props}
    >
      {loading && <Spinner />}
      {!loading && leading}
      <span className="contents">{children}</span>
      {!loading && trailing}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  size = "md",
  shape = "soft",
  block = false,
  leading,
  trailing,
  className,
  ...props
}: {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: keyof typeof SHAPE;
  block?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANT[variant], SIZE[size], SHAPE[shape], block && "w-full", className)}
      {...props}
    >
      {leading}
      <span className="contents">{children}</span>
      {trailing}
    </Link>
  );
}

export function IconButton({
  label,
  children,
  variant = "ghost",
  size = "md",
  className,
  ...props
}: {
  label: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "prefix">) {
  const box = { sm: "h-9 w-9", md: "h-10 w-10", lg: "h-12 w-12" }[size];
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        BASE,
        VARIANT[variant],
        "rounded-full",
        box,
        "shrink-0 p-0",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      className={cn(
        "inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none",
        className,
      )}
    >
      <span className="sr-only">…</span>
    </span>
  );
}