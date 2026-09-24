import type { Product } from "@/types";
import {
  chargerProducts,
  earbudProducts,
  otherAccessoryProducts,
  powerbankProducts,
  watchProducts,
  wiredAudioProducts,
} from "./accessories";
import {
  honorProducts,
  infinixProducts,
  otherPhoneProducts,
  pocoProducts,
  xiaomiProducts,
} from "./android";
import { caseProducts } from "./cases";
import { iphoneProducts } from "./iphone";
import { laptopProducts } from "./laptops";
import { samsungProducts } from "./samsung";

export const allProducts: Product[] = [
  ...iphoneProducts,
  ...samsungProducts,
  ...infinixProducts,
  ...honorProducts,
  ...xiaomiProducts,
  ...pocoProducts,
  ...otherPhoneProducts,
  ...caseProducts,
  ...earbudProducts,
  ...wiredAudioProducts,
  ...chargerProducts,
  ...powerbankProducts,
  ...watchProducts,
  ...otherAccessoryProducts,
  ...laptopProducts,
];
