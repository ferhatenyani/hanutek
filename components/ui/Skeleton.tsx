import { cn } from "@/lib/utils";

/** Shimmer placeholder that matches the shape of what it stands in for. */
export default function Skeleton({
  className,
  rounded = "rounded-card",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block overflow-hidden bg-well",
        rounded,
        className,
      )}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent motion-safe:animate-[hanutek-shimmer_1.4s_infinite]" />
    </span>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-white">
      <Skeleton className="aspect-square w-full" rounded="rounded-none" />
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <Skeleton className="h-3.5 w-[85%]" />
        <Skeleton className="h-3.5 w-[60%]" />
        <Skeleton className="mt-auto h-6 w-[45%]" />
        <Skeleton className="h-10 w-full" rounded="rounded-control" />
      </div>
    </div>
  );
}
