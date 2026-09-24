import type { EventName, EventValue } from "@/types";

/**
 * Klientdan `/api/events`ga voqealarni yuboradi (`navigator.sendBeacon` — sahifa yopilayotganda
 * ham yetkazib beradi). Xato bo‘lsa jimgina o‘tkaziladi: analytics sayt ishlashiga ta’sir qilmaydi.
 * Shaxsiy ma’lumot (ism/telefon) hech qachon `payload`ga qo‘shilmaydi.
 */

const SESSION_KEY = "zamon:session-id";

function getSessionId(): string {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-session";
  }
}

export function trackEvent(name: EventName, payload: Record<string, EventValue> = {}): void {
  if (typeof window === "undefined") return;

  try {
    const body = JSON.stringify({ name, sessionId: getSessionId(), payload });

    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/events", blob);
      if (sent) return;
    }

    // sendBeacon yo‘q yoki navbatga qo‘ya olmadi — oddiy so‘rov bilan zaxira.
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // e'tiborsiz qoldiriladi
    });
  } catch {
    // e'tiborsiz qoldiriladi
  }
}
