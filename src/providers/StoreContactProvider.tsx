"use client";

import { createContext, useContext, type ReactNode } from "react";
import { publicEnv } from "@/config/env";

/**
 * Do‘kon aloqa ma’lumotlari brauzerdagi komponentlar uchun (buyurtma tugmalari). Qiymat
 * serverda admin «Sozlamalar»idan olinadi — build paytida kodga qotirilmaydi.
 */
interface StoreContact {
  telegramUsername: string;
}

const StoreContactContext = createContext<StoreContact>({ telegramUsername: publicEnv.telegramUsername });

export function StoreContactProvider({ value, children }: { value: StoreContact; children: ReactNode }) {
  return <StoreContactContext.Provider value={value}>{children}</StoreContactContext.Provider>;
}

export function useStoreContact(): StoreContact {
  return useContext(StoreContactContext);
}
