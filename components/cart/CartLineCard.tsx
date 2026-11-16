"use client";

import { Trash } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import QtyStepper from "@/components/ui/QtyStepper";
import { cartStore, type ResolvedLine } from "@/lib/cart-store";
import { formatDA } from "@/lib/money";

/** Cart line: media, identity, quantity, price and a quiet remove control. */
export default function CartLineCard({ line }: { line: ResolvedLine }) {
  const t = useTranslations("cart");
  const tp = useTranslations("products");
  const locale = useLocale();

  const { product, qty, lineTotal } = line;
  const soldOut = !product.inStock;
  const title = tp(`items.${product.id}.title` as "items.p1.title");

  return (
    <article data-testid="cart-line" className="flex gap-3.5 px-4 py-4 sm:gap-4 sm:px-5">
      <Link
        href={`/${locale}/product/${product.id}`}
        className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-control bg-mist ring-1 ring-inset ring-ink/[0.05] sm:h-[96px] sm:w-[96px]"
      >
        <Image src={product.image} alt={title} fill sizes="96px" className="object-cover" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-faint rtl:tracking-normal">
              {product.brand}
            </p>
            <h3 className="mt-0.5 line-clamp-2 text-[13.5px] font-semibold leading-[1.35] text-ink">
              <Link href={`/${locale}/product/${product.id}`} className="transition-colors hover:text-blue">
                {title}
              </Link>
            </h3>
            {soldOut && (
              <span className="mt-1.5 inline-block rounded-control bg-sale-soft px-2 py-0.5 text-[10.5px] font-semibold text-sale">
                {t("soldOutLine")}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => cartStore.remove(line.key)}
            aria-label={t("remove", { title })}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-sale-soft hover:text-sale"
          >
            <Trash size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-3">
          <QtyStepper
            value={qty}
            onChange={(next) => cartStore.setQty(line.key, next)}
            size="sm"
            tone={soldOut ? "outline" : "solid"}
            disabled={soldOut}
            label={t("quantityFor", { title })}
          />

          <div className="text-end">
            <p dir="ltr" className="num text-[15px] font-bold leading-none text-ink">
              {formatDA(lineTotal, locale)}
            </p>
            <p dir="ltr" className="num mt-1 text-[10.5px] text-muted">
              {formatDA(product.price, locale)} · {t("eachQty", { qty })}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}