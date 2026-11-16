import { setRequestLocale } from "next-intl/server";

/**
 * The cart has no page: the URL opens the shared bottom sheet (ShopSheet in
 * the layout). This spacer only keeps the route valid for hard loads.
 */
export default async function CartRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <div aria-hidden="true" className="min-h-[70dvh]" />;
}