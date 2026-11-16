"use client";

import { Heart } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";
import EmptyState from "@/components/ui/EmptyState";
import ProductCard from "@/components/products/ProductCard";
import { favoritesStore, useFavorites } from "@/lib/favorites-store";
import { formatDA } from "@/lib/money";
import { productById } from "@/lib/products";

export default function FavoritesView() {
  const t = useTranslations("favorites");
  const tp = useTranslations("products");
  const locale = useLocale();

  const ids = useFavorites();
  const items = useMemo(
    () => ids.flatMap((id) => (productById(id) ? [productById(id)!] : [])),
    [ids],
  );

  return (
    <div className="min-h-[70dvh] bg-white">
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-9">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-panel bg-sale-soft text-sale"
            >
              <Heart size={22} weight="fill" />
            </span>
            <div>
              <h1 className="display-cut text-[26px] leading-tight text-ink sm:text-[32px]">
                {t("title")}
              </h1>
              <p className="mt-1 text-[13px] text-muted">{t("count", { count: items.length })}</p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => favoritesStore.clear()}
              className="inline-flex h-10 items-center gap-2 rounded-control border border-line bg-white px-4 text-[12px] font-semibold text-muted transition-colors hover:border-sale/30 hover:text-sale"
            >
              {t("clear")}
            </button>
          )}
        </header>

        {items.length === 0 ? (
          <div className="mt-6 rounded-panel border border-line bg-mist">
            <EmptyState
              icon={<Heart size={26} weight="bold" />}
              title={t("emptyTitle")}
              body={t("emptyBody")}
              action={t("browse")}
              actionHref={`/${locale}/products`}
            />
          </div>
        ) : (
          <>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4">
              {items.map((product) => (
                <li key={product.id}>
                  <ProductCard
                    product={product}
                    title={tp(`items.${product.id}.title` as "items.p1.title")}
                    price={formatDA(product.price, locale)}
                    oldPrice={product.oldPrice ? formatDA(product.oldPrice, locale) : undefined}
                  />
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-center gap-2 rounded-panel border border-dashed border-blue/25 bg-blue-tint px-6 py-7 text-center">
              <p className="text-[13.5px] font-semibold text-ink">{t("crossSellTitle")}</p>
              <p className="max-w-[44ch] text-[12.5px] leading-relaxed text-muted">
                {t("crossSellBody")}
              </p>
              <Link
                href={`/${locale}/products`}
                className="mt-1 text-[12.5px] font-semibold text-blue underline underline-offset-4"
              >
                {t("browse")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}