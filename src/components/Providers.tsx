"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";
import { ActivityTracker } from "./ActivityTracker";
import { ToastProvider } from "./ui/Toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          <ActivityTracker />
          {children}
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
