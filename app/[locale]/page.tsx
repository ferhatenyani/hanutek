import ServiceStrip from "@/components/home/ServiceStrip";
import HeroBanner from "@/components/hero/HeroBanner";
import ProductsSection from "@/components/products/ProductsSection";
import { setRequestLocale } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroBanner />
      <ServiceStrip />
      <ProductsSection />
    </>
  );
}