import { cn } from "@/lib/utils";

/**
 * Money display. Values are always LTR tabular figures so a price never
 * reflows inside the Arabic layout, and the strike/savings pair stays one unit.
 */
export default function Price({
  value,
  old,
  savings,
  size = "md",
  tone = "default",
  className,
}: {
  value: string;
  old?: string;
  savings?: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "default" | "invert";
  className?: string;
}) {
  const scale = {
    sm: "text-[14px]",
    md: "text-[16px]",
    lg: "text-[20px]",
    xl: "text-[26px] sm:text-[30px]",
  }[size];

  const ink = tone === "invert" ? "text-white" : "text-obsidian";
  const muted = tone === "invert" ? "text-white/70" : "text-slate";

  return (
    <span className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span dir="ltr" className={cn("font-semibold num tracking-[-0.01em]", ink, scale)}>
        {value}
      </span>
      {old && (
        <span dir="ltr" className={cn("text-[13px] num line-through", muted)}>
          {old}
        </span>
      )}
      {savings && (
        <span
          dir="ltr"
          className={cn(
            "rounded-control px-1.5 py-0.5 text-[11px] font-semibold num",
            tone === "invert" ? "bg-white/15 text-white" : "bg-sale/10 text-sale",
          )}
        >
          {savings}
        </span>
      )}
    </span>
  );
}
