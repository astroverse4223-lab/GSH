"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GamesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the arcade games page
    router.replace("/games/arcade");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-lg">Redirecting to games...</div>
    </div>
  );
}
