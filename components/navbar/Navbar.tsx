"use client";

import {
  Globe,
  Heart,
  MagnifyingGlass,
  ShoppingCart,
  User,
} from "@phosphor-icons/react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { routing } from "@/i18n/routing";
import { searchStore, useSearchQuery } from "@/lib/search-store";
import { useCartCount } from "@/lib/cart-store";
import { useFavorites } from "@/lib/favorites-store";
import Dropdown from "@/components/ui/Dropdown";
import Logo from "@/components/ui/Logo";
import { categories } from "@/lib/products";
import { cn } from "@/lib/utils";

const LOCALE_NAMES: Record<string, string> = {
  fr: "Français",
  ar: "العربية",
};

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-10 items-center rounded-full px-3.5 text-[13.5px] font-semibold transition-colors",
        active
          ? "bg-brand-soft text-brand-deep"
          : "text-muted hover:bg-mist hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const t = useTranslations("navbar");
  const td = useTranslations("dock");
  const tp = useTranslations("products");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const query = useSearchQuery();
  const cartCount = useCartCount();
  const favorites = useFavorites();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 6));

  const hrefFor = (target: string) => {
    const rest = pathname.replace(new RegExp(`^/${locale}`), "");
    return `/${target}${rest || ""}`;
  };

  const on = (href: string, exact = false) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const categoryOptions = [
    { value: "all", label: t("categories") },
    ...categories.map((category) => ({
      value: category,
      label: tp(`categories.${category}` as "categories.cameras"),
    })),
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-appbar)] border-b bg-white/85 backdrop-blur-2xl transition-[border-color,box-shadow] duration-300",
        scrolled
          ? "border-hairline shadow-[0_16px_40px_-36px_rgba(16,24,40,0.5)]"
          : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-4 sm:h-16 sm:px-6 lg:h-[72px] lg:gap-5 lg:px-8">
        <Logo href={`/${locale}`} markSize={30} />

        <nav
          aria-label={td("label")}
          data-testid="desktop-nav"
          className="ms-2 hidden items-center gap-1 lg:flex"
        >
          <NavLink href={`/${locale}`} active={on(`/${locale}`, true)}>
            {td("shop")}
          </NavLink>
          <NavLink href={`/${locale}/products`} active={on(`/${locale}/products`)}>
            {td("catalogue")}
          </NavLink>
          <Dropdown
            label={t("categories")}
            value="all"
            onChange={(next) => {
              if (next === "all") router.push(`/${locale}/products`);
              else router.push(`/${locale}/products?cat=${next}`);
            }}
            options={categoryOptions}
            variant="ghost"
            shape="pill"
            align="start"
            className="[&>button]:h-10 [&>button]:font-semibold [&>button]:text-muted"
          />
        </nav>

        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            router.push(`/${locale}/products`);
          }}
          className="relative ms-auto hidden w-full max-w-[340px] md:block"
        >
          <MagnifyingGlass
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => searchStore.setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
            enterKeyHint="search"
            className="h-11 w-full rounded-full border border-hairline bg-mist/80 ps-11 pe-4 text-[13.5px] text-ink transition-colors placeholder:text-muted/80 hover:bg-mist focus:border-brand/40 focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/10"
          />
        </form>

        <div className="ms-auto flex items-center gap-1 lg:ms-0">
          <Link
            href={`/${locale}/products#recherche`}
            aria-label={t("search")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-mist hover:text-ink lg:hidden"
          >
            <MagnifyingGlass size={20} aria-hidden="true" />
          </Link>

          <Dropdown
            label={t("langLabel")}
            value={locale}
            onChange={(next) => {
              if (next !== locale) router.push(hrefFor(next));
            }}
            options={routing.locales.map((l) => ({
              value: l,
              label: LOCALE_NAMES[l] ?? l,
              shortLabel: l.toUpperCase(),
            }))}
            compact
            variant="ghost"
            icon={<Globe size={16} aria-hidden="true" />}
          />

          <Link
            href={`/${locale}/favorites`}
            data-testid="header-favorites"
            aria-label={`${td("favorites")}${favorites.length ? ` (${favorites.length})` : ""}`}
            className={cn(
              "relative hidden h-10 w-10 items-center justify-center rounded-full transition-colors lg:flex",
              on(`/${locale}/favorites`)
                ? "bg-brand-soft text-brand"
                : "text-muted hover:bg-mist hover:text-ink",
            )}
          >
            <Heart size={20} aria-hidden="true" />
            {favorites.length > 0 && (
              <span
                dir="ltr"
                data-testid="header-favorites-badge"
                className="absolute end-1 top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[9px] font-bold num text-white ring-2 ring-white"
              >
                {favorites.length > 9 ? "9+" : favorites.length}
              </span>
            )}
          </Link>

          <Link
            href={`/${locale}/profile`}
            data-testid="header-account"
            aria-label={td("account")}
            className={cn(
              "hidden h-10 w-10 items-center justify-center rounded-full transition-colors lg:flex",
              on(`/${locale}/profile`) || on(`/${locale}/login`)
                ? "bg-brand-soft text-brand"
                : "text-muted hover:bg-mist hover:text-ink",
            )}
          >
            <User size={20} aria-hidden="true" />
          </Link>

          <Link
            href={`/${locale}/cart`}
            data-testid="header-cart"
            className="relative ms-1 hidden h-10 items-center gap-2 rounded-full bg-brand px-4 text-[13px] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(47,107,255,0.9)] transition-colors hover:bg-brand-deep lg:flex"
          >
            <ShoppingCart size={17} weight="fill" aria-hidden="true" />
            <span className="hidden xl:inline">{td("cart")}</span>
            <span
              dir="ltr"
              data-testid="header-cart-badge"
              className={cn(
                "flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-1 text-[10px] font-bold num",
                cartCount > 0 ? "bg-white text-brand" : "bg-white/20 text-white",
              )}
            >
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}