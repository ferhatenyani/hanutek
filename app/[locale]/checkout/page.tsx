import { setRequestLocale } from "next-intl/server";

/** Checkout lives inside the shared bottom sheet; this spacer keeps the URL valid. */
export default async function CheckoutRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <div aria-hidden="true" className="min-h-[70dvh]" />;
}