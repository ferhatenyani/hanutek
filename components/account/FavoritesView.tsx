"use client";

import { Heart } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";
import EmptyState from "@/components/ui/EmptyState";
import ProductCardSoft from "@/components/products/ProductCardSoft";
import { favoritesStore, useFavorites } from "@/lib/favorites-store";
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

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
    [locale],
  );

  return (
    <div className="min-h-[70dvh] bg-mist">
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-5 sm:px-6 lg:px-8 lg:pb-16 lg:pt-7">
        <header className="relative overflow-hidden rounded-sheet border border-hairline bg-white px-5 py-6 shadow-soft sm:px-7 lg:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-12 -top-16 h-44 w-44 rounded-full bg-sale/5"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sale/10 text-sale"
              >
                <Heart size={26} weight="fill" />
              </span>
              <div>
                <h1 className="display-cut text-[28px] leading-tight text-ink sm:text-[34px]">
                  {t("title")}
                </h1>
                <p className="mt-1 text-[13px] text-muted">{t("count", { count: items.length })}</p>
              </div>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={() => favoritesStore.clear()}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-white px-4 text-[12px] font-semibold text-muted transition-colors hover:border-sale/30 hover:text-sale"
              >
                {t("clear")}
              </button>
            )}
          </div>
        </header>

        {items.length === 0 ? (
          <div className="mt-6 rounded-sheet border border-hairline bg-white shadow-soft">
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
                  <ProductCardSoft
                    product={product}
                    title={tp(`items.${product.id}.title` as "items.p1.title")}
                    price={money.format(product.price)}
                    oldPrice={product.oldPrice ? money.format(product.oldPrice) : undefined}
                  />
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-center gap-2 rounded-sheet border border-dashed border-brand/25 bg-brand-tint px-6 py-7 text-center">
              <p className="text-[13.5px] font-semibold text-ink">{t("crossSellTitle")}</p>
              <p className="max-w-[44ch] text-[12.5px] leading-relaxed text-muted">
                {t("crossSellBody")}
              </p>
              <Link
                href={`/${locale}/products`}
                className="mt-1 text-[12.5px] font-semibold text-brand underline underline-offset-4"
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