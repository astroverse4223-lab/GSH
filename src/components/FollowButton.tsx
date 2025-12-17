"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface FollowButtonProps {
  userId: string;
  onFollowChange?: (counts: { followers: number; following: number }) => void;
}

export function FollowButton({ userId, onFollowChange }: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial follow status
  useEffect(() => {
    const fetchFollowStatus = async () => {
      try {
        const response = await fetch(`/api/follow?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error("Error fetching follow status:", error);
      }
    };

    if (session?.user?.id && userId) {
      fetchFollowStatus();
    }
  }, [userId, session?.user?.id]);

  const handleFollow = async () => {
    if (!session?.user?.id || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        // Dispatch a custom event that FollowerStats can listen to
        const event = new CustomEvent("followStatusChanged", {
          detail: { userId },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if viewing own profile
  if (session?.user?.id === userId) {
    return null;
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`px-4 py-2 rounded-full font-medium transition-all duration-300
        ${
          isFollowing
            ? "bg-gray-600 text-white hover:bg-red-500 dark:bg-gray-700 dark:hover:bg-red-600"
            : "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        }
        disabled:opacity-50
      `}>
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
