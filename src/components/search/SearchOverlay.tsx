"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { History, Search, SearchX, TrendingUp, X } from "lucide-react";
import { POPULAR_SEARCHES } from "@/config/synonyms";
import { trackEvent } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { STOCK_LABELS } from "@/lib/product";
import { addRecentSearch, getRecentSearches, removeRecentSearch } from "@/lib/recent-searches";
import { searchHref } from "@/lib/urls";
import { useUI } from "@/providers/UIProvider";
import type { SearchSuggestion } from "@/app/api/search/route";

const DEBOUNCE_MS = 220;

/**
 * Qidiruv paneli: header'dagi ikonka va mobil pastki navigatsiyadagi «Qidiruv» shu panelni ochadi.
 * Desktop — header ostidagi panel, mobil — to‘liq ekran (CatalogPanel bilan bir xil uslub).
 *
 * Faqat `searchOpen` bo‘lganda mount qilinadi (shart bu yerda, ichkarida emas) — shunda har safar
 * ochilganda ichki holat (so‘rov, natijalar) qo‘lda tozalanishi shart bo‘lmaydi, komponent tabiiy
 * ravishda «toza» boshlanadi.
 */
export function SearchOverlay() {
  const { searchOpen } = useUI();
  return searchOpen ? <SearchOverlayPanel /> : null;
}

function SearchOverlayPanel() {
  const { closeSearch } = useUI();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  // Natijalar qaysi so‘rov uchun ekanini saqlaydi — "loading" shundan render paytida hosil bo‘ladi.
  const [resultsFor, setResultsFor] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(() => getRecentSearches());

  const inputRef = useRef<HTMLInputElement>(null);
  const mountedPathname = useRef(pathname);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Sahifa o‘zgarsa (havola bosilsa) panel yopiladi.
  useEffect(() => {
    if (pathname !== mountedPathname.current) closeSearch();
  }, [pathname, closeSearch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSearch();
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [closeSearch]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: { results: SearchSuggestion[] }) => {
          setResults(data.results ?? []);
          setResultsFor(trimmed);
          trackEvent("search", { query: trimmed, resultCount: data.results?.length ?? 0 });
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setResults([]);
            setResultsFor(trimmed);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function runSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    router.push(searchHref(trimmed));
  }

  const trimmedQuery = query.trim();
  const showEmpty = trimmedQuery.length === 0;
  const loading = !showEmpty && trimmedQuery !== resultsFor;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={closeSearch}
        className="fade-in fixed inset-0 z-[55] bg-ink/45 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Qidiruv"
        className="sheet-in fixed inset-x-0 bottom-0 top-0 z-[60] flex flex-col overflow-y-auto bg-surface p-5 pb-8 shadow-pop outline-none lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-[84px] lg:h-auto lg:max-h-[75dvh] lg:w-[min(640px,calc(100%-64px))] lg:-translate-x-1/2 lg:rounded-[28px] lg:p-6"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runSearch(query);
          }}
          className="flex items-center gap-2"
        >
          <div className="flex h-12 flex-1 items-center gap-2.5 rounded-full border border-line bg-page px-4">
            <Search className="size-[18px] shrink-0 text-ink-muted" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="iPhone, Samsung, zaryadchik…"
              aria-label="Qidiruv so‘zi"
              autoComplete="off"
              className="h-full flex-1 min-w-0 bg-transparent text-[15px] outline-none placeholder:text-ink-muted"
            />
          </div>
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Yopish"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-muted"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-5">
          {showEmpty ? (
            <div className="space-y-6">
              {recent.length > 0 && (
                <div>
                  <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    <History className="size-3.5" aria-hidden="true" />
                    Oxirgi qidiruvlar
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {recent.map((term) => (
                      <li key={term} className="group relative">
                        <button
                          type="button"
                          onClick={() => runSearch(term)}
                          className="inline-flex h-9 items-center rounded-full border border-line bg-surface pl-4 pr-9 text-sm text-ink transition-colors hover:border-ink/40"
                        >
                          {term}
                        </button>
                        <button
                          type="button"
                          aria-label={`«${term}» ni o‘chirish`}
                          onClick={() => setRecent(removeRecentSearch(term))}
                          className="absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink"
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  <TrendingUp className="size-3.5" aria-hidden="true" />
                  Ko‘p qidiriladi
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <li key={term}>
                      <button
                        type="button"
                        onClick={() => runSearch(term)}
                        className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-4 text-sm text-ink transition-colors hover:border-ink/40"
                      >
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <SearchResultsList
              query={query}
              loading={loading}
              results={results}
              onNavigate={(item) => {
                addRecentSearch(query);
                trackEvent("search_result_click", { query, productId: item.slug });
              }}
            />
          )}
        </div>

        {!showEmpty && (
          <button
            type="button"
            onClick={() => runSearch(query)}
            className="mt-4 inline-flex h-11 shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            «{query.trim()}» bo‘yicha barcha natijalar
          </button>
        )}
      </div>
    </>
  );
}

function SearchResultsList({
  query,
  loading,
  results,
  onNavigate,
}: {
  query: string;
  loading: boolean;
  results: SearchSuggestion[];
  onNavigate: (item: SearchSuggestion) => void;
}) {
  if (loading && results.length === 0) {
    return (
      <ul className="space-y-1" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="skeleton h-16 rounded-2xl" />
        ))}
      </ul>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <SearchX className="size-8 text-ink-muted" aria-hidden="true" />
        <p className="mt-3 text-sm text-ink-muted">
          «{query.trim()}» bo‘yicha natija yo‘q. Boshqa so‘z bilan urinib ko‘ring.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {results.map((item) => (
        <li key={item.slug}>
          <Link
            href={item.href}
            onClick={() => onNavigate(item)}
            className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-surface-muted"
          >
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-medium text-ink">{item.name}</span>
              <span className="block truncate text-[13px] text-ink-muted">
                {[item.brandName, item.categoryName].filter(Boolean).join(" · ")}
                {item.stockStatus === "out_of_stock" ? ` · ${STOCK_LABELS.out_of_stock}` : ""}
              </span>
            </span>
            <span className={`shrink-0 text-sm font-semibold ${item.hasDiscount ? "text-sale" : "text-ink"}`}>
              {formatPrice(item.price)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
