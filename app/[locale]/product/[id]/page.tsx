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

/** The product story is a step of the shared bottom sheet, not a page. */
export default async function ProductRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  if (!productById(id)) notFound();
  return <div aria-hidden="true" className="min-h-[70dvh]" />;
}