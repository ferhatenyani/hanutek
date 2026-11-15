import CatalogueView from "@/components/products/CatalogueView";
import { setRequestLocale } from "next-intl/server";
import { categories, type ProductCategory } from "@/lib/products";

/** The category facet comes from the query string, so this route is on-demand. */
export const instant = false;

export default async function ProductsRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { cat } = await searchParams;
  const initial = (categories as readonly string[]).includes(cat ?? "")
    ? (cat as ProductCategory)
    : "all";

  return <CatalogueView initialCategory={initial} />;
}
