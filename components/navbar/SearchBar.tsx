"use client";

import { MagnifyingGlass, Storefront, Tag, X } from "@phosphor-icons/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories, products } from "@/lib/products";
import { formatDA } from "@/lib/money";
import { searchStore, useSearchQuery } from "@/lib/search-store";
import { cn } from "@/lib/utils";

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

type Suggestion =
  | { kind: "product"; id: string; title: string; image: string; price: number }
  | { kind: "category"; value: string; label: string; count: number }
  | { kind: "brand"; label: string };

/**
 * Search field with a real suggestion dropdown: matching products, categories
 * and brands, keyboard navigable, plus a view-all escape hatch.
 */
export default function SearchBar({
  id,
  autoFocus = false,
  className,
}: {
  id: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const t = useTranslations("navbar");
  const tp = useTranslations("products");
  const locale = useLocale();
  const router = useRouter();
  const query = useSearchQuery();
  const [deferred, setDeferred] = useState(query);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDeferred(query), 120);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const needle = fold(deferred.trim());
    if (!needle) return [];
    const items: Suggestion[] = [];
    for (const p of products) {
      const title = tp(`items.${p.id}.title` as "items.p1.title");
      if (fold(`${title} ${p.brand}`).includes(needle)) {
        items.push({ kind: "product", id: p.id, title, image: p.image, price: p.price });
      }
      if (items.filter((i) => i.kind === "product").length >= 5) break;
    }
    for (const c of categories) {
      const label = tp(`categories.${c}` as "categories.cameras");
      if (fold(label).includes(needle)) {
        items.push({
          kind: "category",
          value: c,
          label,
          count: products.filter((p) => p.category === c).length,
        });
      }
      if (items.filter((i) => i.kind === "category").length >= 2) break;
    }
    const brands = [...new Set(products.map((p) => p.brand))];
    for (const b of brands) {
      if (fold(b).includes(needle)) items.push({ kind: "brand", label: b });
      if (items.filter((i) => i.kind === "brand").length >= 2) break;
    }
    return items.slice(0, 8);
  }, [deferred, tp]);

  // Reset the keyboard cursor when the suggestion list changes, during render
  // rather than in an effect so no extra frame is spent.
  const [lastDeferred, setLastDeferred] = useState(deferred);
  if (deferred !== lastDeferred) {
    setLastDeferred(deferred);
    setActive(-1);
  }

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const showList = open && deferred.trim().length > 0;

  const choose = (item: Suggestion) => {
    setOpen(false);
    if (item.kind === "product") {
      searchStore.clear();
      router.push(`/${locale}/product/${item.id}`);
    } else if (item.kind === "category") {
      searchStore.clear();
      router.push(`/${locale}/products?cat=${item.value}`);
    } else {
      searchStore.setQuery(item.label);
      router.push(`/${locale}/products`);
    }
  };

  const viewAll = () => {
    setOpen(false);
    router.push(`/${locale}/products`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showList) return;
    const count = suggestions.length + 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % count);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + count) % count);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active >= 0 && active < suggestions.length) choose(suggestions[active]);
      else viewAll();
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          viewAll();
        }}
      >
        <MagnifyingGlass
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          ref={inputRef}
          id={id}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          value={query}
          onChange={(event) => {
            searchStore.setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          enterKeyHint="search"
          autoComplete="off"
          className="h-11 w-full rounded-control border border-line bg-mist ps-11 pe-10 text-[14px] text-ink transition-colors placeholder:text-faint hover:bg-white focus:border-blue/50 focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue/10"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              searchStore.clear();
              inputRef.current?.focus();
            }}
            aria-label={t("searchClear")}
            className="absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-control text-muted transition-colors hover:bg-mist hover:text-ink"
          >
            <X size={15} weight="bold" aria-hidden="true" />
          </button>
        )}
      </form>

      {showList && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          aria-label={t("suggestionsLabel")}
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-panel border border-line bg-white shadow-pop"
        >
          {suggestions.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-muted">{t("suggestionsEmpty")}</p>
          ) : (
            <ul className="max-h-[320px] overflow-y-auto p-1.5">
              {suggestions.map((item, index) => (
                <li key={`${item.kind}-${index}`} role="none">
                  <button
                    id={`${id}-opt-${index}`}
                    type="button"
                    role="option"
                    aria-selected={active === index}
                    tabIndex={-1}
                    onClick={() => choose(item)}
                    onMouseEnter={() => setActive(index)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-control px-2.5 py-2 text-start transition-colors",
                      active === index ? "bg-blue-tint" : "hover:bg-mist",
                    )}
                  >
                    {item.kind === "product" ? (
                      <>
                        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-control bg-mist">
                          <Image src={item.image} alt="" fill sizes="36px" className="object-cover" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                          {item.title}
                        </span>
                        <span dir="ltr" className="num shrink-0 text-[12px] font-semibold text-muted">
                          {formatDA(item.price, locale)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-mist text-muted">
                          {item.kind === "category" ? (
                            <Tag size={15} aria-hidden="true" />
                          ) : (
                            <Storefront size={15} aria-hidden="true" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                          {item.label}
                        </span>
                        <span className="shrink-0 rounded-full bg-mist px-2 py-0.5 text-[10.5px] font-semibold text-muted">
                          {item.kind === "category"
                            ? t("suggestionCategory", { count: item.count })
                            : t("suggestionBrand")}
                        </span>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            role="option"
            aria-selected={active === suggestions.length}
            id={`${id}-opt-${suggestions.length}`}
            onClick={viewAll}
            onMouseEnter={() => setActive(suggestions.length)}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 border-t border-line px-4 py-2.5 text-[12.5px] font-semibold text-blue transition-colors",
              active === suggestions.length ? "bg-blue-tint" : "hover:bg-blue-tint",
            )}
          >
            {t("suggestionsViewAll", { query: deferred.trim() })}
          </button>
        </div>
      )}
    </div>
  );
}