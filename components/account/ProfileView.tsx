"use client";

import {
  ArrowRight,
  Money,
  Heart,
  Package,
  Receipt,
  ShieldCheck,
  SignOut,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Badge from "@/components/ui/Badge";
import type { BadgeTone } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { logout, useSession } from "@/lib/session-store";
import { useOrders } from "@/lib/orders-store";
import { useFavorites } from "@/lib/favorites-store";
import { useMounted } from "@/lib/hooks";
import { formatDA } from "@/lib/money";
import { toastStore } from "@/lib/toast-store";
import type { OrderStatus } from "@/lib/orders-store";

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  processing: "neutral",
  shipped: "new",
  delivered: "success",
};

export default function ProfileView() {
  const t = useTranslations("account");
  const locale = useLocale();
  const user = useSession();
  const orders = useOrders();
  const favorites = useFavorites();
  const mounted = useMounted();
  const router = useRouter();

  useEffect(() => {
    // Wait for hydration: the server snapshot has no user, and redirecting on
    // that snapshot would kick a signed-in visitor off a hard-loaded /profile.
    if (mounted && !user) router.replace(`/${locale}/login?next=/profile`);
  }, [mounted, user, locale, router]);

  const date = (iso: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));

  if (!mounted) {
    return (
      <div className="min-h-[60dvh] bg-white">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-7 sm:px-6 lg:px-8">
          <Skeleton className="h-44 w-full" rounded="rounded-panel" />
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Skeleton className="h-96 w-full" rounded="rounded-panel" />
            <Skeleton className="h-72 w-full" rounded="rounded-panel" />
          </div>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const spent = orders.reduce((sum, order) => sum + order.totals.total, 0);

  const stats = [
    { key: "orders", label: t("statsOrders"), value: String(orders.length), Icon: Package },
    { key: "favorites", label: t("statsFavorites"), value: String(favorites.length), Icon: Heart },
    { key: "spent", label: t("statsSpent"), value: formatDA(spent, locale), Icon: Money },
  ];

  return (
    <div className="min-h-[70dvh] bg-white">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-5 sm:px-6 lg:px-8 lg:pb-16 lg:pt-7">
        {/* Account header */}
        <header className="relative overflow-hidden rounded-panel border border-line bg-white px-5 py-6 shadow-soft sm:px-7 lg:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-20 -top-24 h-56 w-56 rounded-full bg-blue-soft"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <span
                aria-hidden="true"
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue text-[20px] font-bold text-white shadow-[0_12px_28px_-14px_rgba(46,98,245,0.9)]"
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue rtl:tracking-normal">
                  {t("eyebrow")}
                </p>
                <h1 className="display-cut mt-1 break-words text-[22px] leading-tight text-ink sm:text-[30px]">
                  {t("hello", { name: user.name })}
                </h1>
                <p dir="ltr" className="mt-1 truncate text-[12.5px] text-muted">
                  {user.email}
                </p>
                <p className="mt-0.5 text-[11.5px] text-faint">
                  {t("memberSince", { date: date(`${user.joinedAt}T12:00:00Z`) })}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              leading={<SignOut size={15} aria-hidden="true" />}
              onClick={() => {
                logout();
                toastStore.push({ message: t("signedOut"), tone: "neutral" });
              }}
            >
              {t("signOut")}
            </Button>
          </div>

          <ul className="relative mt-6 grid grid-cols-3 gap-2.5">
            {stats.map(({ key, label, value, Icon }) => (
              <li
                key={key}
                className="flex flex-col items-start gap-1.5 rounded-control bg-mist px-3 py-3 sm:flex-row sm:items-center sm:gap-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-white text-blue shadow-sm">
                  <Icon size={15} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span dir="ltr" className="num block truncate text-[15px] font-bold leading-none text-ink sm:text-[17px]">
                    {value}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-medium leading-tight text-muted">
                    {label}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* Orders */}
          <section
            id="orders"
            aria-labelledby="orders-heading"
            className="overflow-hidden rounded-panel border border-line bg-white shadow-soft"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
              <div>
                <h2 id="orders-heading" className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">
                  <span className="flex h-8 w-8 items-center justify-center rounded-control bg-blue-soft text-blue">
                    <Receipt size={16} aria-hidden="true" />
                  </span>
                  {t("orders")}
                </h2>
                <p className="mt-1 text-[11.5px] text-muted" dir="ltr">
                  {t("ordersCount", { count: orders.length })}
                </p>
              </div>
              <ButtonLink
                href={`/${locale}/products`}
                variant="outline"
                size="sm"
                trailing={<ArrowRight size={13} aria-hidden="true" className="rtl:rotate-180" />}
              >
                {t("startShopping")}
              </ButtonLink>
            </div>

            {orders.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <span
                  aria-hidden="true"
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mist text-muted"
                >
                  <Package size={24} />
                </span>
                <p className="mt-4 text-[15px] font-semibold text-ink">{t("noOrders")}</p>
                <p className="mx-auto mt-1.5 max-w-[38ch] text-[12.5px] leading-relaxed text-muted">
                  {t("noOrdersBody")}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {orders.map((order) => (
                  <li key={order.ref}>
                    <Link
                      href={`/${locale}/order/${order.ref}`}
                      className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-blue-tint sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                    >
                      <span className="flex min-w-0 items-center gap-3 sm:flex-1">
                        <span className="flex shrink-0 -space-x-2.5">
                          {order.lines.slice(0, 3).map((line) => (
                            <span
                              key={line.id}
                              className="relative h-12 w-12 overflow-hidden rounded-control bg-mist ring-2 ring-white"
                            >
                              <Image src={line.image} alt="" fill sizes="48px" className="object-cover" />
                            </span>
                          ))}
                          {order.lines.length > 3 && (
                            <span
                              dir="ltr"
                              className="num flex h-12 w-12 items-center justify-center rounded-control bg-mist text-[11px] font-semibold text-ink ring-2 ring-white"
                            >
                              +{order.lines.length - 3}
                            </span>
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            dir="ltr"
                            className="num block whitespace-nowrap text-[13px] font-semibold text-ink sm:text-[13.5px]"
                          >
                            {order.ref}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted sm:text-[11.5px]">
                            {date(order.placedAt)} · {t("orderItems", { count: order.totals.itemCount })}
                          </span>
                        </span>
                      </span>

                      <span className="flex items-center justify-between gap-3 sm:shrink-0">
                        <Badge tone={STATUS_TONE[order.status]}>
                          {t(`status.${order.status}` as "status.processing")}
                        </Badge>

                        <span dir="ltr" className="num text-[14px] font-bold text-ink sm:text-[15px]">
                          {formatDA(order.totals.total, locale)}
                        </span>

                        <ArrowRight
                          size={15}
                          aria-hidden="true"
                          className="text-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Side */}
          <div className="flex flex-col gap-5">
            <section
              aria-labelledby="prefs-heading"
              className="rounded-panel border border-line bg-white shadow-soft"
            >
              <h2
                id="prefs-heading"
                className="flex items-center gap-2.5 border-b border-line px-4 py-3.5 text-[14px] font-semibold text-ink"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-control bg-blue-soft text-blue">
                  <ShieldCheck size={15} aria-hidden="true" />
                </span>
                {t("shortcut")}
              </h2>

              <div className="flex flex-col gap-2 p-4">
                <Link
                  href={`/${locale}/favorites`}
                  className="flex items-center justify-between gap-3 rounded-control border border-line px-3.5 py-3 transition-colors hover:border-blue/30 hover:bg-blue-tint"
                >
                  <span className="flex items-center gap-2.5 text-[13px] font-medium text-ink">
                    <Heart size={15} aria-hidden="true" className="text-sale" />
                    {t("favoritesLink")}
                  </span>
                  <span dir="ltr" className="num flex items-center gap-2 text-[11px] font-semibold text-muted">
                    {favorites.length}
                    <ArrowRight size={13} aria-hidden="true" className="rtl:rotate-180" />
                  </span>
                </Link>

                <Link
                  href={`/${locale}/products`}
                  className="flex items-center justify-between gap-3 rounded-control border border-line px-3.5 py-3 transition-colors hover:border-blue/30 hover:bg-blue-tint"
                >
                  <span className="flex items-center gap-2.5 text-[13px] font-medium text-ink">
                    <Package size={15} aria-hidden="true" className="text-blue" />
                    {t("browseLink")}
                  </span>
                  <ArrowRight size={13} aria-hidden="true" className="text-muted rtl:rotate-180" />
                </Link>

                <p className="mt-1 px-1 text-[11px] leading-relaxed text-muted">{t("privacyNote")}</p>
              </div>
            </section>

            <section className="rounded-panel border border-line bg-mist px-4 py-4">
              <h2 className="flex items-center gap-2.5 text-[14px] font-semibold text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-control bg-white text-success shadow-sm">
                  <Money size={15} aria-hidden="true" />
                </span>
                {t("codTitle")}
              </h2>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">{t("codBody")}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}