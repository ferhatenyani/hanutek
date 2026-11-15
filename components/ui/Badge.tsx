import { cn } from "@/lib/utils";

const TONE = {
  best: "bg-ink text-white",
  new: "bg-brand text-white",
  promo: "bg-sale text-white",
  neutral: "bg-mist text-ink",
  success: "bg-mint-soft text-mint-deep",
  outline: "border border-hairline bg-white text-muted",
} as const;

export type BadgeTone = keyof typeof TONE;

export default function Badge({
  children,
  tone = "neutral",
  uppercase = true,
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  uppercase?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold leading-none tracking-[0.08em] rtl:tracking-normal",
        uppercase && "uppercase",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}