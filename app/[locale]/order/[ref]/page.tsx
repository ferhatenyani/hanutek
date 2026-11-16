import { setRequestLocale } from "next-intl/server";

/** Order confirmation is a step of the shared bottom sheet, not a page. */
export default async function OrderRoute({
  params,
}: {
  params: Promise<{ locale: string; ref: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <div aria-hidden="true" className="min-h-[70dvh]" />;
}