import FavoritesView from "@/components/account/FavoritesView";
import { setRequestLocale } from "next-intl/server";

export default async function FavoritesRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FavoritesView />;
}
