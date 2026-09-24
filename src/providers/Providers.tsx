"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "./ToastProvider";
import { UIProvider } from "./UIProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <UIProvider>{children}</UIProvider>
    </ToastProvider>
  );
}
