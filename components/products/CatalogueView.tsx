"use client";

import {
  ArrowsDownUp,
  Money,
  Check,
  Funnel,
  MagnifyingGlass,
  Package,
  Tag,
  Truck,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "@/components/navbar/SearchBar";
import ProductCard from "@/components/products/ProductCard";
import Dropdown from "@/components/ui/Dropdown";
import { useDialog, useMounted, useScrollLock } from "@/lib/hooks";
import { formatDA } from "@/lib/money";
import {
  categories,
  priceBandOf,
  products,
  type PriceBand,
  type ProductCategory,
} from "@/lib/products";
import { searchStore, useSearchQuery } from "@/lib/search-store";
import { cn } from "@/lib/utils";

type Sort = "featured" | "asc" | "desc";
type Filter = ProductCategory | "all";

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Catalogue as a command centre: compact hero, one fused toolbar, and — from
 * lg up — two independently scrolling panes so the wheel over the filters
 * never moves the products, and vice versa.
 */
export default function CatalogueView({
  initialCategory = "all",
}: {
  initialCategory?: Filter;
}) {
  const t = useTranslations("products");
  const locale = useLocale();
  const query = useSearchQuery();
  const [sort, setSort] = useState<Sort>("featured");
  const [filter, setFilter] = useState<Filter>(initialCategory);
  const [band, setBand] = useState<PriceBand>("all");
  const [stockOnly, setStockOnly] = useState(false);
  const [lastCategory, setLastCategory] = useState<Filter>(initialCategory);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
  const filtersRef = useDialog<HTMLDivElement>(filtersOpen, () => setFiltersOpen(false));
  useScrollLock(filtersOpen);

  if (initialCategory !== lastCategory) {
    setLastCategory(initialCategory);
    setFilter(initialCategory);
  }

  useEffect(() => {
    if (window.location.hash === "#recherche") {
      const frame = requestAnimationFrame(() =>
        searchRef.current?.querySelector("input")?.focus(),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  const list = useMemo(() => {
    const byCategory =
      filter === "all" ? products : products.filter((p) => p.category === filter);
    const narrowed = byCategory.filter(
      (p) => priceBandOf(p.price, band) && (!stockOnly || p.inStock),
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
  }, [filter, sort, band, stockOnly, query, t]);

  const reset = () => {
    setFilter("all");
    setSort("featured");
    setBand("all");
    setStockOnly(false);
    searchStore.clear();
  };

  const activeCount =
    (filter !== "all" ? 1 : 0) + (band !== "all" ? 1 : 0) + (stockOnly ? 1 : 0);
  const isFiltered = activeCount > 0 || sort !== "featured" || query.trim() !== "";

  const sortOptions = [
    { value: "featured", label: t("sortFeatured") },
    { value: "asc", label: t("sortAsc") },
    { value: "desc", label: t("sortDesc") },
  ];
  const bandOptions = [
    { value: "all", label: t("facets.priceAll") },
    { value: "under5000", label: t("facets.under5000") },
    { value: "mid", label: t("facets.mid") },
    { value: "high", label: t("facets.high") },
  ];
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: t("categories.all"), count: products.length },
    ...categories.map((c) => ({
      value: c,
      label: t(`categories.${c}` as "categories.cameras"),
      count: products.filter((p) => p.category === c).length,
    })),
  ];

  const panelProps = {
    filters,
    filter,
    setFilter,
    band,
    setBand,
    stockOnly,
    setStockOnly,
    bandOptions,
    activeCount,
    reset,
  };

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] sm:px-6 lg:flex lg:h-[calc(100dvh-72px)] lg:flex-col lg:overflow-hidden lg:px-10 lg:pb-6">
        {/* Hero — the command centre header */}
        <header className="shrink-0 pt-5 lg:pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[600px]">
              <span className="inline-flex items-center gap-1.5 rounded-control bg-blue-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-deep rtl:tracking-normal">
                <Package size={13} weight="fill" aria-hidden="true" />
                {t("catalogueEyebrow")}
              </span>
              <h1 className="display-cut mt-3 text-[28px] leading-[1.08] text-ink sm:text-[34px] lg:text-[38px]">
                {t("catalogueTitle")}
              </h1>
              <p className="mt-2 max-w-[48ch] text-[13.5px] leading-relaxed text-muted sm:text-[14px]">
                {t("catalogueSubtitle")}
              </p>
            </div>
            <ul className="flex flex-wrap items-center gap-2">
              {[
                { Icon: Package, label: t("statProducts", { count: products.length }) },
                { Icon: Tag, label: t("statCategories", { count: categories.length }) },
                { Icon: Truck, label: t("statDelivery") },
                { Icon: Money, label: t("statCod") },
              ].map(({ Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-1.5 rounded-control border border-line bg-mist px-3 py-1.5 text-[11.5px] font-semibold text-muted"
                >
                  <Icon size={13} aria-hidden="true" className="text-blue" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Fused toolbar */}
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div ref={searchRef} className="min-w-0 flex-1 lg:max-w-[520px]">
              <SearchBar id="recherche" />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className={cn(
                  "relative inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-control border px-5 text-[13px] font-semibold transition-colors sm:flex-none lg:hidden",
                  activeCount > 0
                    ? "border-blue/30 bg-blue-soft text-blue-deep"
                    : "border-line bg-white text-ink hover:bg-mist",
                )}
              >
                <Funnel size={16} weight="bold" aria-hidden="true" />
                {t("filters")}
                {activeCount > 0 && (
                  <span className="num flex h-5 min-w-5 items-center justify-center rounded-full bg-blue px-1 text-[10px] font-bold text-white">
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
                className="[&>button]:h-11 [&>button]:px-4"
              />
            </div>
          </div>

          {/* Category quick-pick, phones and tablets */}
          <div
            role="group"
            aria-label={t("filterLabel")}
            className="scrollbar-hide -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden"
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
                    "h-9 shrink-0 whitespace-nowrap rounded-control border px-3.5 text-[12.5px] font-semibold transition-colors",
                    active
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-muted hover:border-ink/30 hover:text-ink",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Active filters + count */}
          <div className="mt-3 flex min-h-8 flex-wrap items-center gap-2">
            <span className="text-[12.5px] font-medium text-muted" aria-live="polite">
              {query.trim() ? `${t("searchFor", { query: query.trim() })} · ` : ""}
              {t("count", { count: list.length })}
            </span>
            {isFiltered && (
              <>
                <span aria-hidden="true" className="text-line">|</span>
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
                {stockOnly && <Chip onClear={() => setStockOnly(false)}>{t("facets.inStock")}</Chip>}
                <button
                  type="button"
                  onClick={reset}
                  className="ms-1 inline-flex items-center gap-1 text-[12px] font-semibold text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                >
                  <X size={12} weight="bold" aria-hidden="true" />
                  {t("reset")}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Body — two independent scroll panes from lg up */}
        <div className="mt-4 grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden lg:block lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pe-1">
            <FilterPanel {...panelProps} />
          </aside>

          <section
            aria-label={t("title")}
            className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pe-1"
          >
            {list.length === 0 ? (
              <div className="rounded-panel border border-line bg-mist px-6 py-16 text-center sm:py-20">
                <span
                  aria-hidden="true"
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-soft text-blue"
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
                  className="mt-6 h-11 rounded-control bg-blue px-6 text-[13px] font-semibold text-white transition-colors hover:bg-blue-deep"
                >
                  {t("reset")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4">
                {list.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    title={t(`items.${p.id}.title` as "items.p1.title")}
                    price={formatDA(p.price, locale)}
                    oldPrice={p.oldPrice ? formatDA(p.oldPrice, locale) : undefined}
                  />
                ))}
              </div>
            )}
            <p className="mt-8 pb-2 text-center text-[12px] text-faint">{t("catalogueNote")}</p>
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
                className="absolute inset-0 bg-ink/30 backdrop-blur-[8px]"
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
                    className="flex h-10 w-10 items-center justify-center rounded-control bg-mist text-muted"
                  >
                    <X size={17} weight="bold" aria-hidden="true" />
                  </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
                  <FilterPanel {...panelProps} mobile />
                </div>
                <div className="shrink-0 border-t border-line bg-white px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="h-12 w-full rounded-control bg-blue text-[14px] font-semibold text-white transition-colors hover:bg-blue-deep"
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

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  const t = useTranslations("products");
  return (
    <span className="inline-flex items-center gap-1.5 rounded-control bg-blue-soft px-2.5 py-1 text-[11.5px] font-semibold text-blue-deep">
      {children}
      <button
        type="button"
        onClick={onClear}
        aria-label={t("chipRemove", { label: String(children) })}
        className="-my-1 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-blue/15"
      >
        <X size={10} weight="bold" aria-hidden="true" />
      </button>
    </span>
  );
}

type FilterPanelProps = {
  filters: { value: Filter; label: string; count: number }[];
  filter: Filter;
  setFilter: (value: Filter) => void;
  band: PriceBand;
  setBand: (value: PriceBand) => void;
  stockOnly: boolean;
  setStockOnly: (value: boolean) => void;
  bandOptions: { value: string; label: string }[];
  activeCount: number;
  reset: () => void;
};

function FilterPanel({
  filters,
  filter,
  setFilter,
  band,
  setBand,
  stockOnly,
  setStockOnly,
  bandOptions,
  activeCount,
  reset,
  mobile = false,
}: FilterPanelProps & { mobile?: boolean }) {
  const t = useTranslations("products");

  return (
    <div
      className={cn(
        !mobile && "rounded-panel border border-line bg-white p-5",
        mobile && "pb-2",
      )}
    >
      {!mobile && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <Funnel size={15} weight="bold" aria-hidden="true" className="text-blue" />
            {t("filters")}
            {activeCount > 0 && (
              <span className="num flex h-5 min-w-5 items-center justify-center rounded-full bg-blue px-1 text-[10px] font-bold text-white">
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
        <legend className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-faint rtl:tracking-normal">
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
                    "flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-start text-[13px] transition-colors",
                    active
                      ? "bg-blue-soft font-semibold text-blue-deep"
                      : "text-muted hover:bg-mist hover:text-ink",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      active ? "border-blue bg-blue text-white" : "border-line bg-white",
                    )}
                  >
                    {active && <Check size={10} weight="bold" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span
                    dir="ltr"
                    className={cn("num text-[11px]", active ? "text-blue-deep/70" : "text-faint")}
                  >
                    {item.count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset className="mt-5 border-t border-line pt-4">
        <legend className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-faint rtl:tracking-normal">
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
                  "flex items-center gap-2.5 rounded-control px-2.5 py-2 text-start text-[13px] transition-colors",
                  active
                    ? "bg-blue-soft font-semibold text-blue-deep"
                    : "text-muted hover:bg-mist hover:text-ink",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    active ? "border-blue" : "border-line",
                  )}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-blue" />}
                </span>
                <span className="flex-1">{option.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5 border-t border-line pt-4">
        <legend className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-faint rtl:tracking-normal">
          {t("stockTitle")}
        </legend>
        <button
          type="button"
          role="switch"
          aria-checked={stockOnly}
          onClick={() => setStockOnly(!stockOnly)}
          className="flex w-full items-center justify-between gap-3 rounded-control px-2.5 py-2 text-[13px] text-ink transition-colors hover:bg-mist"
        >
          <span className="font-medium">{t("facets.inStock")}</span>
          <span
            aria-hidden="true"
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
              stockOnly ? "bg-blue" : "bg-line",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[inset-inline-start] duration-200 ease-out-quint",
                stockOnly ? "start-[calc(100%-1.375rem)]" : "start-0.5",
              )}
            />
          </span>
        </button>
      </fieldset>
    </div>
  );
}