"use client";

import { useCallback, useSyncExternalStore } from "react";
import { favoritesStore } from "@/lib/favorites-store";

export function useFavorites() {
  const ids = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    favoritesStore.getServerSnapshot,
  );

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  return {
    ids,
    count: ids.length,
    has,
    toggle: favoritesStore.toggle,
    remove: favoritesStore.remove,
  };
}
