"use client";

import { Globe, Heart, ShoppingCart, User } from "@phosphor-icons/react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { routing } from "@/i18n/routing";
import { useCartCount, useCartStore } from "@/lib/cart-store";
import { useFavorites } from "@/lib/favorites-store";
import { EASE } from "@/lib/motion";
import Dropdown from "@/components/ui/Dropdown";
import Logo from "@/components/ui/Logo";
import SearchBar from "@/components/navbar/SearchBar";
import { FLY_EVENT } from "@/components/products/useCardCart";
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
        "relative flex h-10 items-center rounded-control px-3.5 text-[13.5px] font-semibold transition-colors",
        active ? "bg-blue-soft text-blue-deep" : "text-muted hover:bg-mist hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

type Fly = { x: number; y: number; tx: number; ty: number; key: number };

export default function Navbar() {
  const t = useTranslations("navbar");
  const td = useTranslations("dock");
  const tp = useTranslations("products");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const cartCount = useCartCount();
  const pulse = useCartStore((s) => s.pulse);
  const spotlight = useCartStore((s) => s.spotlight);
  const favorites = useFavorites();
  const { scrollY } = useScroll();
  const cartRef = useRef<HTMLAnchorElement>(null);
  const [fly, setFly] = useState<Fly | null>(null);

  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 6));

  // Fly-to-cart dot: card CTA centre -> header cart icon centre. The target is
  // measured in the handler, never during render.
  useEffect(() => {
    const onFly = (event: Event) => {
      const { x, y } = (event as CustomEvent<{ x: number; y: number }>).detail;
      const rect = cartRef.current?.getBoundingClientRect();
      const target = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: window.innerWidth - 40, y: 32 };
      setFly({ x, y, tx: target.x, ty: target.y, key: Date.now() });
    };
    window.addEventListener(FLY_EVENT, onFly);
    return () => window.removeEventListener(FLY_EVENT, onFly);
  }, []);

  // First-ever add: blur the page behind the crisp header, then release.
  useEffect(() => {
    if (!spotlight) return;
    const timer = window.setTimeout(() => useCartStore.getState().endSpotlight(), 1900);
    return () => window.clearTimeout(timer);
  }, [spotlight]);

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

  const cartBadge = (invert: boolean) => (
    <span
      dir="ltr"
      data-testid="header-cart-badge"
      className={cn(
        "num flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
        invert
          ? cartCount > 0
            ? "bg-white text-blue"
            : "bg-white/20 text-white"
          : "bg-blue text-white ring-2 ring-white",
      )}
    >
      {cartCount > 9 ? "9+" : cartCount}
    </span>
  );

  return (
    <>
      <AnimatePresence>
        {spotlight && (
          <motion.div
            aria-hidden="true"
            data-testid="cart-spotlight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="pointer-events-none fixed inset-0 z-30 bg-ink/25 backdrop-blur-[6px]"
          />
        )}
      </AnimatePresence>

      <header
        className={cn(
          "sticky top-0 z-[var(--z-appbar)] border-b bg-white/85 backdrop-blur-2xl transition-[border-color,box-shadow] duration-300",
          scrolled
            ? "border-line shadow-[0_16px_40px_-36px_rgba(11,13,16,0.5)]"
            : "border-transparent",
        )}
      >
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="flex h-14 items-center gap-2 sm:h-16 sm:gap-3 lg:h-[72px] lg:gap-4">
            <Logo href={`/${locale}`} markSize={30} />

            <nav
              aria-label={td("label")}
              data-testid="desktop-nav"
              className="ms-2 hidden shrink-0 items-center gap-1 lg:flex"
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
                align="start"
                className="[&>button]:h-10 [&>button]:font-semibold [&>button]:text-muted"
              />
            </nav>

            {/* Search sits left, directly after the nav, and grows with space. */}
            <SearchBar
              id="header-search"
              className="ms-1 hidden min-w-0 flex-1 md:block lg:ms-4 lg:max-w-[560px]"
            />

            <div className="ms-auto flex shrink-0 items-center gap-1">
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
                  "relative hidden h-10 w-10 items-center justify-center rounded-control transition-colors lg:flex",
                  on(`/${locale}/favorites`)
                    ? "bg-blue-soft text-blue"
                    : "text-muted hover:bg-mist hover:text-ink",
                )}
              >
                <Heart size={20} aria-hidden="true" />
                {favorites.length > 0 && (
                  <span
                    dir="ltr"
                    data-testid="header-favorites-badge"
                    className="num absolute end-0.5 top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[9px] font-bold text-white ring-2 ring-white"
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
                  "hidden h-10 w-10 items-center justify-center rounded-control transition-colors lg:flex",
                  on(`/${locale}/profile`) || on(`/${locale}/login`)
                    ? "bg-blue-soft text-blue"
                    : "text-muted hover:bg-mist hover:text-ink",
                )}
              >
                <User size={20} aria-hidden="true" />
              </Link>

              {/* Cart is present at every breakpoint: pill at lg+, icon below. */}
              <motion.span
                key={pulse}
                initial={false}
                animate={pulse > 0 ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="relative ms-1 inline-flex"
              >
                <Link
                  ref={cartRef}
                  href={`/${locale}/cart`}
                  data-testid="header-cart"
                  aria-label={`${td("cart")} (${cartCount})`}
                  className={cn(
                    "relative hidden h-10 items-center gap-2 rounded-control bg-blue px-4 text-[13px] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(46,98,245,0.9)] transition-colors hover:bg-blue-deep lg:flex",
                    spotlight && "ring-4 ring-blue/30",
                  )}
                >
                  <ShoppingCart size={17} weight="fill" aria-hidden="true" />
                  <span className="hidden xl:inline">{td("cart")}</span>
                  {cartBadge(true)}
                </Link>
                <Link
                  href={`/${locale}/cart`}
                  data-testid="header-cart-compact"
                  aria-label={`${td("cart")} (${cartCount})`}
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-control bg-blue text-white shadow-[0_10px_22px_-12px_rgba(46,98,245,0.9)] transition-colors hover:bg-blue-deep lg:hidden",
                    spotlight && "ring-4 ring-blue/30",
                  )}
                >
                  <ShoppingCart size={18} weight="fill" aria-hidden="true" />
                  <span className="absolute -end-1 -top-1">{cartBadge(false)}</span>
                </Link>
              </motion.span>
            </div>
          </div>

          {/* Phones get a dedicated full-width search row. */}
          <div className="pb-3 md:hidden">
            <SearchBar id="header-search-mobile" />
          </div>
        </div>

        <AnimatePresence>
          {spotlight && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="absolute end-4 top-full mt-2 rounded-control bg-ink px-3 py-2 text-[12px] font-semibold text-white shadow-pop sm:end-6 lg:end-10"
            >
              {t("spotlight")}
            </motion.p>
          )}
        </AnimatePresence>
      </header>

      {fly && (
        <motion.span
          key={fly.key}
          aria-hidden="true"
          initial={{ x: fly.x, y: fly.y, scale: 1, opacity: 1 }}
          animate={{ x: fly.tx, y: fly.ty, scale: 0.35, opacity: 0.9 }}
          transition={{ duration: 0.55, ease: EASE }}
          onAnimationComplete={() => setFly(null)}
          className="pointer-events-none fixed left-0 top-0 z-[65] h-3.5 w-3.5 rounded-full bg-blue shadow-[0_0_0_4px_rgba(46,98,245,0.18)]"
        />
      )}
    </>
  );
}