import LoginForm from "@/components/account/LoginForm";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

export default async function LoginRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense
      fallback={
        <div className="mx-auto my-10 h-[520px] w-full max-w-[1120px] animate-pulse rounded-sheet bg-white/70" />
      }
    >
      <LoginForm />
    </Suspense>
  );
}