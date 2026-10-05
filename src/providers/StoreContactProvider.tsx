"use client";

import { createContext, useContext, type ReactNode } from "react";
import { publicEnv } from "@/config/env";
import { siteConfig } from "@/config/site";

/**
 * Do‘kon aloqa ma’lumotlari brauzerdagi komponentlar uchun (buyurtma tugmalari). Qiymat
 * serverda admin «Sozlamalar»idan olinadi — build paytida kodga qotirilmaydi.
 */
interface StoreContact {
  telegramUsername: string;
  storeName: string;
}

const StoreContactContext = createContext<StoreContact>({ telegramUsername: publicEnv.telegramUsername, storeName: siteConfig.name });

export function StoreContactProvider({ value, children }: { value: StoreContact; children: ReactNode }) {
  return <StoreContactContext.Provider value={value}>{children}</StoreContactContext.Provider>;
}

export function useStoreContact(): StoreContact {
  return useContext(StoreContactContext);
}
