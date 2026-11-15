"use client";

import AddToCartBar from "@/components/products/AddToCartBar";
import ProductDetail from "@/components/products/ProductDetail";
import RelatedProducts from "@/components/products/RelatedProducts";
import Sheet from "@/components/ui/Sheet";
import { defaultColorway, type ColorwayKey, type Product } from "@/lib/products";
import useCloseSheet from "@/lib/use-close-sheet";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

export default function ProductSheet({ product }: { product: Product }) {
  const tp = useTranslations("products");
  const locale = useLocale();
  const close = useCloseSheet(`/${locale}`);
  const [colorway, setColorway] = useState<ColorwayKey>(() => defaultColorway(product));
  const [qty, setQty] = useState(1);

  const title = tp(`items.${product.id}.title` as "items.p1.title");

  return (
    <Sheet
      title={title}
      eyebrow={product.brand}
      placement="dialog"
      onClose={close}
      footer={
        <AddToCartBar
          product={product}
          colorway={colorway}
          qty={qty}
          title={title}
          onQty={setQty}
        />
      }
    >
      <ProductDetail
        product={product}
        colorway={colorway}
        variant="sheet"
        onColorway={setColorway}
      />
      <RelatedProducts product={product} />
    </Sheet>
  );
}
