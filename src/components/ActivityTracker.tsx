"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function ActivityTracker() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    // Update activity immediately when user logs in
    updateActivity();

    // Then update every minute
    const interval = setInterval(updateActivity, 60 * 1000);

    return () => clearInterval(interval);

    async function updateActivity() {
      try {
        if (!session?.user?.id) return;
        await fetch(`/api/users/${session.user.id}/update-activity`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to update activity:", error);
      }
    }
  }, [session?.user?.id]);

  return null;
}
