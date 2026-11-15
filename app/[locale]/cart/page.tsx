import CartPanel from "@/components/cart/CartPanel";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, LockKey } from "@phosphor-icons/react/dist/ssr";

export default async function CartRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "cart" });

  return (
    <div className="min-h-[70dvh] bg-mist">
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-[calc(env(safe-area-inset-bottom)+11rem)] pt-5 sm:px-6 lg:px-8 lg:pb-16 lg:pt-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand rtl:tracking-normal">
              <LockKey size={12} weight="fill" aria-hidden="true" />
              {t("secureNote")}
            </p>
            <h1 className="display-cut mt-2 text-[30px] leading-tight text-ink sm:text-[36px]">
              {t("title")}
            </h1>
            <p className="mt-1.5 text-[13.5px] text-muted">{t("subtitle")}</p>
          </div>

          <Link
            href={`/${locale}/products`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-white px-4 text-[12.5px] font-semibold text-ink shadow-soft transition-colors hover:border-brand/30 hover:text-brand"
          >
            <ArrowLeft size={14} weight="bold" aria-hidden="true" className="rtl:rotate-180" />
            {t("keepShopping")}
          </Link>
        </div>

        <div className="mt-6">
          <CartPanel />
        </div>
      </div>
    </div>
  );
}