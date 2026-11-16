"use client";

import { Minus, Plus } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { AnimatedNumber } from "@/components/ui/library/animated-number";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  tone?: "solid" | "outline";
  label?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Quantity control: one rounded pill with circular steppers and the count in
 * the middle. `solid` is the soft brand tint used inside the cart, `outline`
 * the white version used inside product details.
 */
export default function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 9,
  size = "md",
  tone = "solid",
  label,
  disabled = false,
  className,
}: Props) {
  const t = useTranslations("cart");
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  const box = size === "sm" ? "h-10" : "h-11";
  const key = size === "sm" ? "text-[14px]" : "text-[15px]";
  const solid = tone === "solid";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-control border p-0.5",
        box,
        solid
          ? "border-brand/15 bg-brand-soft text-brand-deep"
          : "border-hairline bg-white text-ink shadow-soft",
        disabled && "opacity-45",
        className,
      )}
      aria-label={label ?? t("quantity")}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label={t("decrease")}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-control transition-colors disabled:cursor-not-allowed disabled:opacity-30",
          solid ? "hover:bg-white" : "hover:bg-mist",
        )}
      >
        <Minus size={14} weight="bold" aria-hidden="true" />
      </button>

      <span
        className={cn(
          "flex min-w-[2ch] items-center justify-center font-semibold num leading-none",
          key,
        )}
      >
        <AnimatedNumber value={value} />
      </span>

      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label={t("increase")}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-control transition-colors disabled:cursor-not-allowed disabled:opacity-30",
          solid ? "hover:bg-white" : "hover:bg-mist",
        )}
      >
        <Plus size={14} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
}