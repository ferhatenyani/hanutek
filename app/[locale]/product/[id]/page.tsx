import ProductPage from "@/components/products/ProductPage";
import { productById, products } from "@/lib/products";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const product = productById(id);
  if (!product) return {};
  const t = await getTranslations({ locale, namespace: "products" });
  const title = t(`items.${id}.title` as "items.p1.title");
  return {
    title: `${title} | Hanutek`,
    description: (await getTranslations({ locale, namespace: "product" }))("metaDescription", {
      title,
    }),
  };
}

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const product = productById(id);
  if (!product) notFound();

  return <ProductPage product={product} />;
}
