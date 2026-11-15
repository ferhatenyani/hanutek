"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { categories, products } from "@/lib/products";

/**
 * Category browse. Every tile carries a real product photograph rather than an
 * illustration, so the row is also a preview of what the category contains.
 */
export default function CategoryBrowse() {
  const t = useTranslations("products");
  const th = useTranslations("home");
  const locale = useLocale();

  const tiles = categories.map((category) => {
    const inCategory = products.filter((p) => p.category === category);
    const hero = inCategory.find((p) => p.inStock) ?? inCategory[0];
    return { category, hero, count: inCategory.length };
  });

  return (
    <section aria-labelledby="browse-heading" className="mx-auto w-full max-w-[1280px] px-4 pt-12 sm:px-6 lg:px-8 lg:pt-16">
      <div className="flex items-end justify-between gap-4">
        <h2 id="browse-heading" className="display-cut text-[22px] leading-tight text-obsidian sm:text-[26px]">
          {th("browseTitle")}
        </h2>
        <Link
          href={`/${locale}/products`}
          className="shrink-0 text-[13px] font-semibold text-obsidian underline decoration-obsidian/25 underline-offset-4 transition-colors hover:decoration-obsidian"
        >
          {th("browseAll")}
        </Link>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.category}>
            <Link
              href={`/${locale}/products?cat=${tile.category}`}
              className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white transition-[border-color,box-shadow] duration-300 ease-out-quint hover:border-obsidian/25 hover:shadow-lift"
            >
              <span className="relative aspect-[4/3] w-full overflow-hidden bg-canvas ring-1 ring-inset ring-obsidian/[0.07]">
                <Image
                  src={tile.hero.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
                  className="object-cover transition-transform duration-500 ease-out-quint motion-safe:group-hover:scale-[1.05]"
                />
              </span>
              <span className="flex items-baseline justify-between gap-2 px-3.5 py-3">
                <span className="text-[13.5px] font-semibold text-obsidian">
                  {t(`categories.${tile.category}` as "categories.cameras")}
                </span>
                <span dir="ltr" className="shrink-0 text-[11px] num text-slate">
                  {tile.count}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
