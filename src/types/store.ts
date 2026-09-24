import type { Money } from "./product";

export interface DeliveryZone {
  name: string;
  price: Money;
  note?: string;
}

export interface WorkingHours {
  label: string;
  hours: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description: string;
  aboutLong: string[];
  foundedYear: number;
  address: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  telegramUsername: string;
  instagramUrl: string;
  workingHours: WorkingHours[];
  warrantyPolicy: string[];
  returnPolicy: string[];
  deliveryPolicy: string[];
  deliveryZones: DeliveryZone[];
  privacyPolicy: string[];
  createdAt: string;
  updatedAt: string;
}
