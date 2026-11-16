import Skeleton, { ProductCardSkeleton } from "@/components/ui/Skeleton";

/** Route-level loading shells: same geometry as the real page, no layout shift. */
export default function PageSkeleton({
  variant = "grid",
}: {
  variant?: "home" | "catalogue" | "grid" | "form";
}) {
  if (variant === "form") {
    return (
      <div className="mx-auto w-full max-w-[440px] px-4 pt-10 sm:px-0">
        <Skeleton className="mx-auto h-9 w-32" rounded="rounded-control" />
        <Skeleton className="mt-7 h-[480px] w-full" rounded="rounded-panel" />
      </div>
    );
  }

  if (variant === "home") {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4 sm:px-6 lg:px-8">
        <Skeleton className="h-[320px] w-full sm:h-[380px]" rounded="rounded-panel" />
        <div className="mt-12">
          <Skeleton className="h-7 w-56" rounded="rounded-control" />
          <div className="mt-5 flex gap-3 overflow-hidden sm:gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-[46%] shrink-0 sm:w-[236px] lg:w-[264px]">
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "catalogue") {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 pt-5 sm:px-6 lg:px-10">
        <Skeleton className="h-6 w-40" rounded="rounded-control" />
        <Skeleton className="mt-3 h-9 w-72 max-w-full" rounded="rounded-control" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" rounded="rounded-control" />
        <div className="mt-4 flex gap-2.5">
          <Skeleton className="h-11 flex-1 lg:max-w-[520px]" rounded="rounded-control" />
          <Skeleton className="h-11 w-32" rounded="rounded-control" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pt-6 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-64 max-w-full" rounded="rounded-control" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}