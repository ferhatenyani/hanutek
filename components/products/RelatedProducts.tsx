"use client";

import ProductCardSoft from "@/components/products/ProductCardSoft";
import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { relatedOf, type Product } from "@/lib/products";

export default function RelatedProducts({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const t = useTranslations("product");
  const tp = useTranslations("products");
  const locale = useLocale();

  const format = useMemo(
    () =>
      new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
    [locale],
  );

  const items = relatedOf(product, 4);

  return (
    <section
      aria-labelledby="related-heading"
      className={className ?? "border-t border-hairline px-4 pt-7 pb-8 sm:px-6"}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="related-heading" className="display-cut text-[20px] text-ink sm:text-[23px]">
            {t("relatedTitle")}
          </h3>
          <p className="mt-1 text-[12.5px] text-muted">{t("relatedBody")}</p>
        </div>
        <Link
          href={`/${locale}/products`}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand transition-colors hover:text-brand-deep"
        >
          {tp("viewAll")}
          <ArrowRight size={13} weight="bold" aria-hidden="true" className="rtl:rotate-180" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <ProductCardSoft
            key={item.id}
            product={item}
            title={tp(`items.${item.id}.title` as "items.p1.title")}
            price={format.format(item.price)}
            oldPrice={item.oldPrice ? format.format(item.oldPrice) : undefined}
          />
        ))}
      </div>
    </section>
  );
}