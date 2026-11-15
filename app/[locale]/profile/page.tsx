import ProfileView from "@/components/account/ProfileView";
import { setRequestLocale } from "next-intl/server";

export default async function ProfileRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProfileView />;
}
