"use client";

import { Heart, House, ShoppingCart, SquaresFour, User } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartCount } from "@/lib/cart-store";
import { useFavorites } from "@/lib/favorites-store";
import { cn } from "@/lib/utils";

function Badge({ count, id }: { count: number; id: string }) {
  if (!count) return null;
  return (
    <span
      dir="ltr"
      data-testid={id}
      aria-hidden="true"
      className="num absolute -top-0.5 end-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-blue px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/**
 * Bottom tab bar for phones and tablets only; desktop navigation lives in the
 * header. Tablets get a narrower, shorter bar so it never feels oversized.
 */
export default function AppDock() {
  const t = useTranslations("dock");
  const locale = useLocale();
  const pathname = usePathname();
  const cartCount = useCartCount();
  const favorites = useFavorites();

  const on = (href: string, exact = false) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const items = [
    { key: "shop", label: t("shop"), href: `/${locale}`, Icon: House, active: on(`/${locale}`, true) },
    { key: "catalogue", label: t("catalogue"), href: `/${locale}/products`, Icon: SquaresFour, active: on(`/${locale}/products`) },
    { key: "favorites", label: t("favorites"), href: `/${locale}/favorites`, Icon: Heart, active: on(`/${locale}/favorites`), count: favorites.length, badgeId: "favorites-badge" },
    { key: "cart", label: t("cart"), href: `/${locale}/cart`, Icon: ShoppingCart, active: on(`/${locale}/cart`), count: cartCount, badgeId: "cart-badge" },
    { key: "account", label: t("account"), href: `/${locale}/profile`, Icon: User, active: on(`/${locale}/profile`) || on(`/${locale}/login`) },
  ];

  return (
    <nav
      aria-label={t("label")}
      data-testid="dock"
      className="fixed inset-x-0 bottom-0 z-[var(--z-dock)] lg:hidden"
    >
      <div className="mx-auto w-full max-w-[560px] px-3 pb-[max(env(safe-area-inset-bottom),0.6rem)] sm:max-w-[420px]">
        <ul className="flex items-stretch gap-0.5 rounded-panel border border-line/80 bg-white/95 p-1 shadow-pop backdrop-blur-2xl sm:p-1">
          {items.map(({ key, label, href, Icon, active, count, badgeId }) => (
            <li key={key} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="group flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-control transition-colors hover:bg-mist/70 sm:h-[46px]"
              >
                <span
                  className={cn(
                    "relative flex h-7 w-12 items-center justify-center rounded-control transition-colors duration-200 sm:h-6 sm:w-10",
                    active ? "bg-blue-soft text-blue" : "text-muted group-hover:text-ink",
                  )}
                >
                  <Icon size={19} weight={active ? "fill" : "regular"} aria-hidden="true" />
                  {badgeId && count ? <Badge count={count} id={badgeId} /> : null}
                </span>
                <span
                  className={cn(
                    "truncate text-[10px] font-semibold leading-none sm:text-[9.5px]",
                    active ? "text-blue-deep" : "text-muted",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}