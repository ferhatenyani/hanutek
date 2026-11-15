import { ButtonLink, type ButtonVariant } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Composed empty state: glyph, message, and the one action that fixes it.
 * Used by the cart, favourites, search and order history.
 */
export default function EmptyState({
  icon,
  title,
  body,
  action,
  actionHref,
  actionVariant = "primary",
  secondary,
  secondaryHref,
  className,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: string;
  actionHref?: string;
  actionVariant?: ButtonVariant;
  secondary?: string;
  secondaryHref?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center sm:py-20",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand"
      >
        {icon}
      </span>
      <h3 className="display-cut mt-5 text-[20px] text-ink">{title}</h3>
      <p className="mt-2 max-w-[40ch] text-[14px] leading-relaxed text-muted">
        {body}
      </p>
      {(action || secondary) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {action && actionHref && (
            <ButtonLink
              href={actionHref}
              shape="pill"
              size="lg"
              variant={actionVariant}
            >
              {action}
            </ButtonLink>
          )}
          {secondary && secondaryHref && (
            <ButtonLink
              href={secondaryHref}
              variant="ghost"
              shape="pill"
              className="text-ink/70 underline decoration-ink/25 underline-offset-4"
            >
              {secondary}
            </ButtonLink>
          )}
        </div>
      )}
    </div>
  );
}