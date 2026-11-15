import OrderConfirmation from "@/components/checkout/OrderConfirmation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

/** The reference is generated at pay time, so this route cannot be prerendered. */
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "order" });
  return { title: t("metaTitle") };
}

export default async function OrderRoute({
  params,
}: {
  params: Promise<{ locale: string; ref: string }>;
}) {
  const { locale, ref } = await params;
  setRequestLocale(locale);
  return <OrderConfirmation reference={ref} />;
}
