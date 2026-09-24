export type EventName =
  | "search"
  | "search_result_click"
  | "product_view"
  | "telegram_order_click"
  | "order_submit"
  | "favorite_toggle";

export type EventValue = string | number | boolean | null;

export interface AnalyticsEvent {
  name: EventName;
  sessionId: string;
  timestamp: string;
  /** Shaxsiy ma’lumot (ism, telefon) bu yerga yozilmaydi. */
  payload: Record<string, EventValue>;
}
