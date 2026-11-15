"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type Choice = {
  value: string;
  title: string;
  description?: string;
  trailing?: ReactNode;
  disabled?: boolean;
};

/**
 * Radio group built on native inputs: keyboard arrows, grouping and form
 * semantics come for free, only the presentation is ours.
 */
export default function ChoiceCard({
  name,
  options,
  value,
  onChange,
  className,
}: {
  name: string;
  options: Choice[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" className={cn("flex flex-col gap-2", className)}>
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-soft-sm border bg-white p-3.5 transition-[border-color,box-shadow,background-color] duration-200 ease-out-quint",
              checked
                ? "border-brand/35 bg-brand-tint shadow-[0_0_0_1px_var(--color-brand)]"
                : "border-hairline hover:border-brand/25 hover:bg-brand-tint/50",
              option.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                "mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                checked ? "border-brand" : "border-muted/40",
              )}
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full bg-brand transition-transform duration-200",
                  checked ? "scale-100" : "scale-0",
                )}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-[14px] font-semibold text-ink">{option.title}</span>
                {option.trailing && (
                  <span className="text-[13px] font-semibold num text-ink">
                    {option.trailing}
                  </span>
                )}
              </span>
              {option.description && (
                <span className="mt-1 block text-[12.5px] leading-snug text-muted">
                  {option.description}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}