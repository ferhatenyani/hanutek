"use client";

import { useTranslations } from "next-intl";
import HomeRail from "@/components/home/HomeRail";
import { products } from "@/lib/products";

/** Two dot-paginated rails: the proven picks, then the fresh arrivals. */
export default function ProductsSection() {
  const t = useTranslations("home");
  const featured = products.filter((p) => p.badge === "best" || p.badge === "promo");
  const fresh = products.filter((p) => p.badge !== "best" && p.badge !== "promo");

  return (
    <section
      id="selection"
      className="scroll-mt-28 py-12 lg:scroll-mt-32 lg:py-16"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <HomeRail
          title={t("railFeaturedTitle")}
          subtitle={t("railFeaturedSub")}
          items={featured}
        />
        <HomeRail title={t("railNewTitle")} subtitle={t("railNewSub")} items={fresh} />
      </div>
    </section>
  );
}