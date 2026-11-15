"use client";

import AddToCartBar from "@/components/products/AddToCartBar";
import ProductDetail from "@/components/products/ProductDetail";
import RelatedProducts from "@/components/products/RelatedProducts";
import { CaretRight, House } from "@phosphor-icons/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { defaultColorway, type ColorwayKey, type Product } from "@/lib/products";

export default function ProductPage({ product }: { product: Product }) {
  const t = useTranslations("product");
  const tp = useTranslations("products");
  const locale = useLocale();
  const [colorway, setColorway] = useState<ColorwayKey>(() => defaultColorway(product));
  const [qty, setQty] = useState(1);

  return (
    <div className="bg-mist">
      <nav
        aria-label={t("breadcrumbLabel")}
        className="mx-auto w-full max-w-[1320px] px-4 pt-4 sm:px-6 lg:px-8"
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
          <li>
            <Link
              href={`/${locale}`}
              className="flex h-7 items-center gap-1 rounded-full px-2 transition-colors hover:bg-white hover:text-brand"
            >
              <House size={12} weight="fill" aria-hidden="true" />
              {t("crumbs.shop")}
            </Link>
          </li>
          <CaretRight size={10} aria-hidden="true" className="text-muted/50" />
          <li>
            <Link
              href={`/${locale}/products`}
              className="flex h-7 items-center rounded-full px-2 transition-colors hover:bg-white hover:text-brand"
            >
              {tp("title")}
            </Link>
          </li>
          <CaretRight size={10} aria-hidden="true" className="text-muted/50" />
          <li>
            <Link
              href={`/${locale}/products?cat=${product.category}`}
              className="flex h-7 items-center rounded-full px-2 transition-colors hover:bg-white hover:text-brand"
            >
              {tp(`categories.${product.category}` as "categories.cameras")}
            </Link>
          </li>
          <CaretRight size={10} aria-hidden="true" className="text-muted/50" />
          <li aria-current="page" className="max-w-[200px] truncate px-2 font-semibold text-ink">
            {product.brand}
          </li>
        </ol>
      </nav>

      <ProductDetail
        product={product}
        colorway={colorway}
        variant="page"
        onColorway={setColorway}
        buySlot={
          <AddToCartBar
            product={product}
            colorway={colorway}
            qty={qty}
            title={tp(`items.${product.id}.title` as "items.p1.title")}
            onQty={setQty}
            variant="page"
          />
        }
      />

      <div className="mx-auto w-full max-w-[1320px] px-4 pb-[calc(env(safe-area-inset-bottom)+12rem)] sm:px-6 lg:px-8 lg:pb-16">
        <RelatedProducts product={product} className="border-t border-hairline pt-8" />
      </div>
    </div>
  );
}