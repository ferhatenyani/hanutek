import { cn } from "@/lib/utils";

/**
 * Quantity digits. The previous odometer used motion `layout` measurements,
 * which could resolve a detached node while a sheet unmounted mid-navigation
 * and threw a page error. A tabular, non-animated count is calmer and safe.
 */
function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span dir="ltr" className={cn("num", className)}>
      {value}
    </span>
  );
}

function AnimatedScore({
  value,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  return (
    <span dir="ltr" className={cn("num", className)}>
      {value}
    </span>
  );
}

export { AnimatedNumber, AnimatedScore };