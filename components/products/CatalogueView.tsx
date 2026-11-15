"use client";

import {
  ArrowClockwise,
  ArrowsDownUp,
  Check,
  Funnel,
  Heart,
  MagnifyingGlass,
  Package,
  ShieldCheck,
  Star,
  Tag,
  Truck,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  categories,
  meetsRating,
  priceBandOf,
  products,
  type PriceBand,
  type ProductCategory,
  type RatingFloor,
} from "@/lib/products";
import { searchStore, useSearchQuery } from "@/lib/search-store";
import Dropdown from "@/components/ui/Dropdown";
import { useDialog, useMounted, useScrollLock } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import ProductCardSoft from "./ProductCardSoft";
import { pseudoRating } from "./meta";

type Sort = "featured" | "asc" | "desc";
type Filter = ProductCategory | "all";

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export default function CatalogueView({
  initialCategory = "all",
}: {
  initialCategory?: Filter;
}) {
  const t = useTranslations("products");
  const th = useTranslations("hero");
  const locale = useLocale();
  const query = useSearchQuery();
  const [sort, setSort] = useState<Sort>("featured");
  const [filter, setFilter] = useState<Filter>(initialCategory);
  const [band, setBand] = useState<PriceBand>("all");
  const [floor, setFloor] = useState<RatingFloor>("all");
  const [stockOnly, setStockOnly] = useState(false);
  const [lastCategory, setLastCategory] = useState<Filter>(initialCategory);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mounted = useMounted();
  const filtersRef = useDialog<HTMLDivElement>(filtersOpen, () => setFiltersOpen(false));
  useScrollLock(filtersOpen);

  // React's documented way to follow a prop: adjust during render rather than
  // in an effect, so a category link never costs an extra frame.
  if (initialCategory !== lastCategory) {
    setLastCategory(initialCategory);
    setFilter(initialCategory);
  }

  // Arriving from the header search icon focuses the field immediately.
  useEffect(() => {
    if (window.location.hash === "#recherche") {
      const frame = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  const format = useMemo(
    () =>
      new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
        style: "currency",
        currency: "EUR",
      }),
    [locale],
  );

  const list = useMemo(() => {
    const byCategory =
      filter === "all" ? products : products.filter((p) => p.category === filter);
    const narrowed = byCategory.filter(
      (p) =>
        priceBandOf(p.price, band) &&
        meetsRating(pseudoRating(p).rating, floor) &&
        (!stockOnly || p.inStock),
    );
    const needle = fold(query.trim());
    const searched = needle
      ? narrowed.filter((p) => {
          const haystack = fold(
            `${t(`items.${p.id}.title` as "items.p1.title")} ${p.brand} ${t(
              `categories.${p.category}` as "categories.cameras",
            )}`,
          );
          return haystack.includes(needle);
        })
      : narrowed;
    return sort === "asc"
      ? [...searched].sort((a, b) => a.price - b.price)
      : sort === "desc"
        ? [...searched].sort((a, b) => b.price - a.price)
        : searched;
  }, [filter, sort, band, floor, stockOnly, query, t]);

  const reset = () => {
    setFilter("all");
    setSort("featured");
    setBand("all");
    setFloor("all");
    setStockOnly(false);
    searchStore.clear();
  };

  const activeCount =
    (filter !== "all" ? 1 : 0) +
    (band !== "all" ? 1 : 0) +
    (floor !== "all" ? 1 : 0) +
    (stockOnly ? 1 : 0);
  const isFiltered = activeCount > 0 || sort !== "featured" || query.trim() !== "";

  const sortOptions = [
    { value: "featured", label: t("sortFeatured") },
    { value: "asc", label: t("sortAsc") },
    { value: "desc", label: t("sortDesc") },
  ];
  const bandOptions = [
    { value: "all", label: t("facets.priceAll") },
    { value: "under50", label: t("facets.under50") },
    { value: "mid", label: t("facets.mid") },
    { value: "high", label: t("facets.high") },
  ];
  const floorOptions = [
    { value: "all", label: t("facets.ratingAll") },
    { value: "r42", label: t("facets.rating42") },
    { value: "r45", label: t("facets.rating45") },
  ];
  const filters: { value: Filter; label: string; count: number }[] = [
    {
      value: "all",
      label: t("categories.all"),
      count: products.length,
    },
    ...categories.map((c) => ({
      value: c,
      label: t(`categories.${c}` as "categories.cameras"),
      count: products.filter((p) => p.category === c).length,
    })),
  ];

  const filterProps: FilterPanelProps = {
    filters,
    filter,
    setFilter,
    band,
    setBand,
    floor,
    setFloor,
    stockOnly,
    setStockOnly,
    bandOptions,
    floorOptions,
    activeCount,
    reset,
  };

  return (
    <div className="bg-mist">
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-5 sm:px-6 lg:px-8 lg:pb-16 lg:pt-7">
        {/* Header ------------------------------------------------------- */}
        <header className="relative overflow-hidden rounded-sheet border border-hairline bg-white px-5 py-6 shadow-soft sm:px-7 lg:px-9 lg:py-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-16 -top-24 h-56 w-56 rounded-full bg-brand-soft/70 lg:-end-8"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 end-24 h-48 w-48 rounded-full border border-hairline"
          />

          <div className="relative z-10 max-w-[600px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-deep rtl:tracking-normal">
              <Package size={13} weight="fill" aria-hidden="true" />
              {t("catalogueEyebrow")}
            </span>
            <h1 className="display-cut mt-3 text-[30px] leading-[1.06] text-ink sm:text-[38px] lg:text-[44px]">
              {t("catalogueTitle")}
            </h1>
            <p className="mt-3 max-w-[48ch] text-[14px] leading-relaxed text-muted sm:text-[15px]">
              {t("catalogueSubtitle")}
            </p>

            <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-muted">
              <li className="flex items-center gap-1.5">
                <Truck size={14} aria-hidden="true" className="text-brand" />
                {th("trust.delivery")}
              </li>
              <li className="flex items-center gap-1.5">
                <ArrowClockwise size={14} aria-hidden="true" className="text-brand" />
                {th("trust.returns")}
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck size={14} aria-hidden="true" className="text-brand" />
                {th("trust.payment")}
              </li>
            </ul>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute end-10 top-1/2 hidden -translate-y-1/2 items-center lg:flex"
          >
            <span className="relative h-32 w-28 rotate-[-6deg] overflow-hidden rounded-soft-sm border-4 border-white bg-mist shadow-pop xl:h-36 xl:w-32">
              <Image
                src="/assets/products/p6.jpg"
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
            </span>
            <span className="relative -ms-8 mt-10 h-32 w-28 rotate-[7deg] overflow-hidden rounded-soft-sm border-4 border-white bg-mist shadow-pop xl:h-36 xl:w-32">
              <Image
                src="/assets/products/p1.jpg"
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
            </span>
          </div>
        </header>

        {/* Body --------------------------------------------------------- */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[252px_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-[92px]">
              <FilterPanel {...filterProps} />
            </div>
          </aside>

          <section aria-label={t("title")} className="min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 lg:max-w-[520px]">
                <MagnifyingGlass
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  ref={searchRef}
                  id="recherche"
                  type="search"
                  value={query}
                  onChange={(event) => searchStore.setQuery(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchLabel")}
                  enterKeyHint="search"
                  className="h-12 w-full rounded-full border border-hairline bg-white ps-11 pe-11 text-[14px] text-ink shadow-soft transition-colors placeholder:text-muted/75 hover:border-brand/30 focus:border-brand/50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/10"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => searchStore.clear()}
                    aria-label={t("searchClear")}
                    className="absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-mist hover:text-ink"
                  >
                    <X size={15} weight="bold" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className={cn(
                    "relative inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border px-5 text-[13px] font-semibold shadow-soft transition-colors sm:flex-none lg:hidden",
                    activeCount > 0
                      ? "border-brand/30 bg-brand-soft text-brand-deep"
                      : "border-hairline bg-white text-ink hover:bg-brand-tint",
                  )}
                >
                  <Funnel size={16} weight="bold" aria-hidden="true" />
                  {t("filters")}
                  {activeCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold num text-white">
                      {activeCount}
                    </span>
                  )}
                </button>

                <Dropdown
                  label={t("sortLabel")}
                  value={sort}
                  onChange={(next) => setSort(next as Sort)}
                  options={sortOptions}
                  prefix={t("sortPrefix")}
                  icon={<ArrowsDownUp size={15} aria-hidden="true" />}
                  shape="pill"
                  className="[&>button]:h-12 [&>button]:px-4"
                />
              </div>
            </div>

            {/* Category quick-pick, phones and tablets */}
            <div
              role="group"
              aria-label={t("filterLabel")}
              className="scrollbar-hide -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden"
            >
              {filters.map((item) => {
                const active = item.value === filter;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    aria-pressed={active}
                    className={cn(
                      "h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors",
                      active
                        ? "border-brand bg-brand text-white shadow-[0_8px_18px_-12px_rgba(47,107,255,0.9)]"
                        : "border-hairline bg-white text-muted hover:border-brand/30 hover:text-ink",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Active filters + count */}
            <div className="mt-4 flex min-h-8 flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-medium text-muted" aria-live="polite">
                {query.trim() ? `${t("searchFor", { query: query.trim() })} · ` : ""}
                {t("count", { count: list.length })}
              </span>

              {isFiltered && (
                <>
                  <span aria-hidden="true" className="text-hairline">
                    |
                  </span>
                  {filter !== "all" && (
                    <Chip onClear={() => setFilter("all")}>
                      {t(`categories.${filter}` as "categories.cameras")}
                    </Chip>
                  )}
                  {band !== "all" && (
                    <Chip onClear={() => setBand("all")}>
                      {bandOptions.find((option) => option.value === band)?.label}
                    </Chip>
                  )}
                  {floor !== "all" && (
                    <Chip onClear={() => setFloor("all")}>
                      {floorOptions.find((option) => option.value === floor)?.label}
                    </Chip>
                  )}
                  {stockOnly && <Chip onClear={() => setStockOnly(false)}>{t("facets.inStock")}</Chip>}
                  <button
                    type="button"
                    onClick={reset}
                    className="ms-1 inline-flex items-center gap-1 text-[12px] font-semibold text-muted underline decoration-hairline underline-offset-4 transition-colors hover:text-ink"
                  >
                    <X size={12} weight="bold" aria-hidden="true" />
                    {t("reset")}
                  </button>
                </>
              )}
            </div>

            {list.length === 0 ? (
              <div className="mt-6 rounded-sheet border border-hairline bg-white px-6 py-16 text-center shadow-soft sm:py-20">
                <span
                  aria-hidden="true"
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand"
                >
                  <MagnifyingGlass size={26} weight="bold" />
                </span>
                <p className="mt-5 text-[18px] font-semibold text-ink">{t("noResults")}</p>
                <p className="mx-auto mt-2 max-w-[38ch] text-[14px] leading-relaxed text-muted">
                  {t("noResultsHint")}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-6 h-11 rounded-full bg-brand px-6 text-[13px] font-semibold text-white transition-colors hover:bg-brand-deep"
                >
                  {t("reset")}
                </button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4">
                {list.map((p) => (
                  <ProductCardSoft
                    key={p.id}
                    product={p}
                    title={t(`items.${p.id}.title` as "items.p1.title")}
                    price={format.format(p.price)}
                    oldPrice={p.oldPrice ? format.format(p.oldPrice) : undefined}
                  />
                ))}
              </div>
            )}

            <p className="mt-10 flex items-center justify-center gap-2 text-[12px] text-muted">
              <Heart size={13} weight="fill" aria-hidden="true" className="text-sale/70" />
              {t("catalogueNote")}
            </p>
          </section>
        </div>
      </div>

      {/* Mobile / tablet filter sheet */}
      {mounted && (
        <AnimatePresence>
          {filtersOpen && (
            <div className="fixed inset-0 z-[var(--z-sheet)] lg:hidden">
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 bg-ink/40 backdrop-blur-[4px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setFiltersOpen(false)}
              />
              <motion.div
                ref={filtersRef}
                role="dialog"
                aria-modal="true"
                aria-label={t("filtersTitle")}
                tabIndex={-1}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
                className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-sheet bg-white shadow-sheet outline-none"
              >
                <div className="flex shrink-0 justify-center pt-2.5">
                  <span aria-hidden="true" className="h-1 w-10 rounded-full bg-ink/15" />
                </div>
                <header className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-2">
                  <h2 className="flex-1 text-[19px] font-semibold text-ink">
                    {t("filtersTitle")}
                  </h2>
                  {activeCount > 0 && (
                    <button
                      type="button"
                      onClick={reset}
                      className="text-[12px] font-semibold text-muted underline underline-offset-4"
                    >
                      {t("reset")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    aria-label={t("closeFilters")}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-mist text-muted"
                  >
                    <X size={17} weight="bold" aria-hidden="true" />
                  </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
                  <FilterPanel {...filterProps} mobile />
                </div>
                <div className="shrink-0 border-t border-hairline bg-white px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="h-12 w-full rounded-full bg-brand text-[14px] font-semibold text-white transition-colors hover:bg-brand-deep"
                  >
                    {t("showResults", { count: list.length })}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

type FilterPanelProps = {
  filters: { value: Filter; label: string; count: number }[];
  filter: Filter;
  setFilter: (value: Filter) => void;
  band: PriceBand;
  setBand: (value: PriceBand) => void;
  floor: RatingFloor;
  setFloor: (value: RatingFloor) => void;
  stockOnly: boolean;
  setStockOnly: (value: boolean) => void;
  bandOptions: { value: string; label: string }[];
  floorOptions: { value: string; label: string }[];
  activeCount: number;
  reset: () => void;
};

function FilterPanel({
  filters,
  filter,
  setFilter,
  band,
  setBand,
  floor,
  setFloor,
  stockOnly,
  setStockOnly,
  bandOptions,
  floorOptions,
  activeCount,
  reset,
  mobile = false,
}: FilterPanelProps & { mobile?: boolean }) {
  const t = useTranslations("products");

  return (
    <div
      className={cn(
        !mobile &&
          "rounded-soft border border-hairline bg-white p-5 shadow-soft",
        mobile && "pb-2",
      )}
    >
      {!mobile && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <Funnel size={15} weight="bold" aria-hidden="true" className="text-brand" />
            {t("filters")}
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold num text-white">
                {activeCount}
              </span>
            )}
          </h2>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={reset}
              className="text-[11.5px] font-semibold text-muted underline underline-offset-4 transition-colors hover:text-ink"
            >
              {t("reset")}
            </button>
          )}
        </div>
      )}

      <fieldset className={cn(!mobile && "mt-5", mobile && "mt-1")}>
        <legend className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted rtl:tracking-normal">
          {t("categoryTitle")}
        </legend>
        <ul className="flex flex-col gap-0.5">
          {filters.map((item) => {
            const active = item.value === filter;
            return (
              <li key={item.value}>
                <button
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-soft-sm px-2.5 py-2 text-start text-[13px] transition-colors",
                    active
                      ? "bg-brand-soft font-semibold text-brand-deep"
                      : "text-muted hover:bg-mist hover:text-ink",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      active ? "border-brand bg-brand text-white" : "border-hairline bg-white",
                    )}
                  >
                    {active && <Check size={10} weight="bold" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span
                    dir="ltr"
                    className={cn(
                      "text-[11px] num",
                      active ? "text-brand-deep/70" : "text-muted/70",
                    )}
                  >
                    {item.count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset className="mt-5 border-t border-hairline pt-4">
        <legend className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted rtl:tracking-normal">
          <Tag size={12} aria-hidden="true" />
          {t("priceTitle")}
        </legend>
        <div className="flex flex-col gap-0.5">
          {bandOptions.map((option) => {
            const active = option.value === band;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setBand(option.value as PriceBand)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2.5 rounded-soft-sm px-2.5 py-2 text-start text-[13px] transition-colors",
                  active
                    ? "bg-brand-soft font-semibold text-brand-deep"
                    : "text-muted hover:bg-mist hover:text-ink",
                )}
              >
                <RadioDot active={active} />
                <span className="flex-1">{option.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5 border-t border-hairline pt-4">
        <legend className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted rtl:tracking-normal">
          <Star size={12} weight="fill" aria-hidden="true" />
          {t("ratingTitle")}
        </legend>
        <div className="flex flex-col gap-0.5">
          {floorOptions.map((option) => {
            const active = option.value === floor;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFloor(option.value as RatingFloor)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2.5 rounded-soft-sm px-2.5 py-2 text-start text-[13px] transition-colors",
                  active
                    ? "bg-brand-soft font-semibold text-brand-deep"
                    : "text-muted hover:bg-mist hover:text-ink",
                )}
              >
                <RadioDot active={active} />
                <span className="flex-1">{option.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 border-t border-hairline pt-4">
        <button
          type="button"
          onClick={() => setStockOnly(!stockOnly)}
          aria-pressed={stockOnly}
          className="flex w-full items-center justify-between gap-3 rounded-soft-sm px-2.5 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-mist"
        >
          <span className="flex items-center gap-2.5">
            <Package size={15} aria-hidden="true" className="text-muted" />
            {t("inStockOnly")}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "relative h-6 w-10 shrink-0 rounded-full transition-colors",
              stockOnly ? "bg-brand" : "bg-hairline",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[inset-inline-start]",
                stockOnly ? "start-[calc(100%-1.375rem)]" : "start-0.5",
              )}
            />
          </span>
        </button>
      </div>
    </div>
  );
}

function RadioDot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
        active ? "border-brand bg-brand text-white" : "border-hairline bg-white",
      )}
    >
      {active && <Check size={10} weight="bold" />}
    </span>
  );
}

function Chip({
  children,
  onClear,
}: {
  children: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white py-1 pe-1 ps-2.5 text-[11.5px] font-medium text-ink">
      {children}
      <button
        type="button"
        onClick={onClear}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-mist text-muted transition-colors hover:bg-brand-soft hover:text-brand"
      >
        <X size={10} weight="bold" aria-hidden="true" />
      </button>
    </span>
  );
}