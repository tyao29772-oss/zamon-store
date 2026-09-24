import { store } from "@/data/store";
import type { Store } from "@/types";

export async function getStore(): Promise<Store> {
  return store;
}
