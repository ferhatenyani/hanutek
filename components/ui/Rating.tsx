"use client";

import { Star } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export default function Rating({
  value,
  reviews,
  size = 12,
  className,
  valueClassName,
}: {
  value: number;
  reviews?: number;
  size?: number;
  className?: string;
  valueClassName?: string;
}) {
  const t = useTranslations("products");
  const rounded = Math.round(value);

  return (
    <div className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1", className)}>
      <span className="flex items-center gap-px" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <Star
            key={index}
            size={size}
            weight={index < rounded ? "fill" : "regular"}
            className={index < rounded ? "text-obsidian" : "text-slate/35"}
          />
        ))}
      </span>
      <span
        dir="ltr"
        className={cn("text-[12px] font-semibold num text-obsidian", valueClassName)}
      >
        {value.toFixed(1)}
      </span>
      {reviews !== undefined && (
        <span className={cn("text-[12px] text-slate", valueClassName)}>
          {t("card.reviews", { count: reviews })}
        </span>
      )}
      <span className="sr-only">
        {t("card.reviewed", { value: value.toFixed(1), count: reviews ?? 0 })}
      </span>
    </div>
  );
}
