"use client";

import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type Step = { id: string; label: string };

/**
 * Checkout progress rail. Discrete segments rather than one continuous bar,
 * because the flow has three real stops and the user can jump back to any
 * already-completed one.
 */
export default function Steps({
  steps,
  current,
  furthest,
  onSelect,
  className,
}: {
  steps: Step[];
  current: number;
  furthest: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  return (
    <nav aria-label={steps[current]?.label} className={cn("w-full", className)}>
      <ol className="flex items-stretch gap-2.5">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const reachable = index <= furthest && index !== current;

          return (
            <li key={step.id} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onSelect(index)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "group flex w-full flex-col gap-2 text-start transition-opacity",
                  reachable && "cursor-pointer",
                  !active && !done && "opacity-60",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-full rounded-full transition-colors duration-300",
                    done ? "bg-mint" : active ? "bg-brand" : "bg-hairline",
                  )}
                />
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold num",
                      done
                        ? "bg-mint-soft text-mint-deep"
                        : active
                          ? "bg-brand text-white"
                          : "border border-hairline bg-white text-muted",
                    )}
                  >
                    {done ? <Check size={11} weight="bold" /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      "truncate text-[11.5px] leading-none",
                      active
                        ? "font-semibold text-ink"
                        : done
                          ? "font-medium text-ink/75"
                          : "font-medium text-muted",
                    )}
                  >
                    {step.label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}