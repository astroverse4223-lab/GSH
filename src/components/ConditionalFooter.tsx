"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on authentication pages
  const hideFooter = pathname?.startsWith("/auth");

  if (hideFooter) {
    return null;
  }

  return <Footer />;
}
