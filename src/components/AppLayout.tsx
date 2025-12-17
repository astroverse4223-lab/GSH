"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { ChatPopup } from "./chat/ChatPopup";
import styles from "./AppLayout.module.css";
import { useSession } from "next-auth/react";
export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth/");
  const { data: session } = useSession();

  return (
    <div className={styles.layout}>
      <div className={styles.content}>
        {!isAuthPage && <Navbar />}
        <main className={styles.main}>{children}</main>
        {!isAuthPage && session?.user && <ChatPopup />}
      </div>
    </div>
  );
}
