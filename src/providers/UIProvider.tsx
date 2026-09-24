"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface UIContextValue {
  catalogOpen: boolean;
  openCatalog: () => void;
  closeCatalog: () => void;
  toggleCatalog: () => void;

  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

/** Header va pastki navigatsiya orasida umumiy holat: katalog/qidiruv paneli ochiq/yopiq. */
export function UIProvider({ children }: { children: ReactNode }) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Bir vaqtda faqat bitta to‘liq ekranli panel ochiq turadi.
  const openCatalog = useCallback(() => {
    setSearchOpen(false);
    setCatalogOpen(true);
  }, []);
  const closeCatalog = useCallback(() => setCatalogOpen(false), []);
  const toggleCatalog = useCallback(() => {
    setSearchOpen(false);
    setCatalogOpen((open) => !open);
  }, []);

  const openSearch = useCallback(() => {
    setCatalogOpen(false);
    setSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const toggleSearch = useCallback(() => {
    setCatalogOpen(false);
    setSearchOpen((open) => !open);
  }, []);

  const value = useMemo(
    () => ({
      catalogOpen,
      openCatalog,
      closeCatalog,
      toggleCatalog,
      searchOpen,
      openSearch,
      closeSearch,
      toggleSearch,
    }),
    [catalogOpen, openCatalog, closeCatalog, toggleCatalog, searchOpen, openSearch, closeSearch, toggleSearch],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI UIProvider ichida ishlatilishi kerak");
  return context;
}
