"use client";

import { useState, useEffect } from "react";

interface FollowerStatsProps {
  userId: string;
}

export function FollowerStats({ userId }: FollowerStatsProps) {
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  const fetchCounts = async () => {
    if (!userId) {
      console.warn("FollowerStats: No userId provided");
      return;
    }

    try {
      const response = await fetch(`/api/follow?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCounts({
          followers: data.followers,
          following: data.following,
        });
      }
    } catch (error) {
      console.error("Error fetching follow counts:", error);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Listen for follow status changes
    const handleFollowStatusChange = (
      event: CustomEvent<{ userId: string }>
    ) => {
      if (event.detail.userId === userId) {
        fetchCounts();
      }
    };

    window.addEventListener(
      "followStatusChanged",
      handleFollowStatusChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "followStatusChanged",
        handleFollowStatusChange as EventListener
      );
    };
  }, [userId]);

  return (
    <>
      <div className="text-xl mb-1">👥</div>
      <div className="text-lg font-bold text-white mb-0.5">
        {counts.followers}
      </div>
      <div className="text-xs text-gray-400 uppercase font-medium">
        Followers
      </div>
    </>
  );
}
