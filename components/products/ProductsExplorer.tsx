"use client";

import {
  ArrowsDownUp,
  MagnifyingGlass,
  Package,
  Star,
  Tag,
  X,
} from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
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
import ProductCard from "./ProductCard";
import { pseudoRating } from "./meta";

type Sort = "featured" | "asc" | "desc";
type Filter = ProductCategory | "all";

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export default function ProductsExplorer({
  limit,
  showSearch = false,
  initialCategory = "all",
  heading = "section",
}: {
  /** Truncate the grid for the home page and offer the full catalogue. */
  limit?: number;
  showSearch?: boolean;
  initialCategory?: Filter;
  /** `section` renders an h2 for the home page, `page` an h1 for /products. */
  heading?: "section" | "page";
}) {
  const t = useTranslations("products");
  const locale = useLocale();
  const query = useSearchQuery();
  const [sort, setSort] = useState<Sort>("featured");
  const [filter, setFilter] = useState<Filter>(initialCategory);
  const [band, setBand] = useState<PriceBand>("all");
  const [floor, setFloor] = useState<RatingFloor>("all");
  const [stockOnly, setStockOnly] = useState(false);
  const [lastCategory, setLastCategory] = useState<Filter>(initialCategory);
  const searchRef = useRef<HTMLInputElement>(null);

  // React's documented way to follow a prop: adjust during render rather than
  // in an effect, so a category link never costs an extra frame.
  if (initialCategory !== lastCategory) {
    setLastCategory(initialCategory);
    setFilter(initialCategory);
  }

  // Arriving from the header search icon focuses the field immediately.
  useEffect(() => {
    if (!showSearch) return;
    if (window.location.hash === "#recherche") {
      const frame = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [showSearch]);

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
    const ordered =
      sort === "asc"
        ? [...searched].sort((a, b) => a.price - b.price)
        : sort === "desc"
          ? [...searched].sort((a, b) => b.price - a.price)
          : searched;
    return limit ? ordered.slice(0, limit) : ordered;
  }, [filter, sort, band, floor, stockOnly, query, t, limit]);

  const reset = () => {
    setFilter("all");
    setSort("featured");
    setBand("all");
    setFloor("all");
    setStockOnly(false);
    searchStore.clear();
  };
  const isFiltered =
    filter !== "all" ||
    sort !== "featured" ||
    band !== "all" ||
    floor !== "all" ||
    stockOnly ||
    query.trim() !== "";

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
  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: t("categories.all") },
    ...categories.map((c) => ({
      value: c,
      label: t(`categories.${c}` as "categories.cameras"),
    })),
  ];

  const Heading = heading === "page" ? "h1" : "h2";

  return (
    <>
      <div className={heading === "page" ? "max-w-[560px]" : "mx-auto max-w-[560px] text-center"}>
        <Heading className="display-cut text-[28px] leading-[1.1] text-obsidian sm:text-[34px] lg:text-[38px]">
          {t("title")}
        </Heading>
        <p
          className={
            heading === "page"
              ? "mt-3 max-w-[460px] text-sm leading-relaxed text-obsidian/65"
              : "mx-auto mt-3 max-w-[460px] text-sm leading-relaxed text-obsidian/65"
          }
        >
          {t("subtitle")}
        </p>
      </div>

      {showSearch && (
        <div className="relative mt-6">
          <MagnifyingGlass
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate"
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
            className="h-12 w-full rounded-control border border-line bg-white ps-10 pe-10 text-[15px] text-obsidian transition-colors placeholder:text-slate/75 hover:border-slate/45 focus:border-primary/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          />
          {query && (
            <button
              type="button"
              onClick={() => searchStore.clear()}
              aria-label={t("searchClear")}
              className="absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate transition-colors hover:bg-canvas hover:text-obsidian"
            >
              <X size={15} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className={heading === "page" ? "mt-6" : "mt-7 flex flex-col items-center sm:mt-8"}>
        <div
          role="group"
          aria-label={t("filterLabel")}
          className={
            heading === "page"
              ? "scrollbar-hide flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
              : "scrollbar-hide flex w-full gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0"
          }
        >
          {filters.map((item) => {
            const active = item.value === filter;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={active}
                className={`h-9 shrink-0 whitespace-nowrap rounded-control border px-3.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "border-obsidian bg-obsidian text-white"
                    : "border-line bg-white text-slate hover:border-obsidian/40 hover:text-obsidian"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div
          className={
            heading === "page"
              ? "mt-3 flex flex-wrap items-center gap-2"
              : "mt-3 flex w-full flex-wrap items-center justify-center gap-2"
          }
        >
          <Dropdown
            label={t("facets.priceLabel")}
            value={band}
            onChange={(next) => setBand(next as PriceBand)}
            options={bandOptions}
            prefix={t("facets.pricePrefix")}
            icon={<Tag size={15} aria-hidden="true" />}
            shape="square"
          />
          <Dropdown
            label={t("facets.ratingLabel")}
            value={floor}
            onChange={(next) => setFloor(next as RatingFloor)}
            options={floorOptions}
            prefix={t("facets.ratingPrefix")}
            icon={<Star size={15} weight="fill" aria-hidden="true" />}
            shape="square"
          />
          <button
            type="button"
            onClick={() => setStockOnly((on) => !on)}
            aria-pressed={stockOnly}
            className={`inline-flex h-10 items-center gap-2 rounded-control border px-3 text-sm transition-colors ${
              stockOnly
                ? "border-obsidian bg-obsidian text-white"
                : "border-line bg-white text-obsidian hover:border-obsidian/40 hover:bg-canvas"
            }`}
          >
            <Package
              size={15}
              aria-hidden="true"
              className={stockOnly ? "text-white" : "text-slate"}
            />
            <span className="font-medium">{t("facets.inStock")}</span>
          </button>
          <Dropdown
            label={t("sortLabel")}
            value={sort}
            onChange={(next) => setSort(next as Sort)}
            options={sortOptions}
            prefix={t("sortPrefix")}
            icon={<ArrowsDownUp size={15} aria-hidden="true" />}
            shape="square"
          />
        </div>

        <div
          className={
            heading === "page"
              ? "mt-3 flex flex-wrap items-center gap-x-3 gap-y-1"
              : "mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
          }
        >
          <span className="text-xs text-obsidian/65" aria-live="polite">
            {query.trim() ? `${t("searchFor", { query: query.trim() })} · ` : ""}
            {t("count", { count: list.length })}
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-xs font-medium text-obsidian/65 underline decoration-obsidian/30 underline-offset-4 transition-colors hover:text-obsidian"
            >
              <X size={12} weight="bold" aria-hidden="true" />
              {t("reset")}
            </button>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mx-auto mt-8 max-w-sm py-16 text-center sm:py-20">
          <p className="text-base font-semibold text-obsidian">{t("noResults")}</p>
          <p className="mt-2 text-sm leading-relaxed text-obsidian/65">
            {t("noResultsHint")}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 h-11 rounded-control bg-obsidian px-5 text-sm font-semibold text-white transition-colors hover:bg-obsidian/90"
          >
            {t("reset")}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                title={t(`items.${p.id}.title` as "items.p1.title")}
                price={format.format(p.price)}
                oldPrice={p.oldPrice ? format.format(p.oldPrice) : undefined}
              />
            ))}
          </div>

          {limit !== undefined && products.length > limit && (
            <div className="mt-8 flex justify-center">
              <Link
                href={`/${locale}/products`}
                className="inline-flex h-12 items-center gap-2 rounded-pill border border-line bg-white px-6 text-[14px] font-semibold text-obsidian transition-colors hover:border-obsidian/35 hover:bg-canvas"
              >
                {t("viewAll")}
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
