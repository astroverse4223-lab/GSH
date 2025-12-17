"use client";

import { useSession } from "next-auth/react";
import { GlowCard } from "@/components/ui/GlowCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { FollowerStats } from "@/components/FollowerStats";
import { PostCard } from "@/components/PostCard";
import { UploadProgress } from "@/components/ui/UploadProgress";
import { Toast } from "@/components/ui/Toast";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import ModernStories from "@/components/ModernStories";
import EnhancedPostCreator from "@/components/EnhancedPostCreator";
import ModernProfileCard from "@/components/ModernProfileCard";
import ModernActiveUsers from "@/components/ModernActiveUsers";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { uploadMedia } from "@/lib/uploadMedia";
import { useTheme } from "@/components/ThemeProvider";
import styles from "./feed.module.css";
import Link from "next/link";
import type { SteamGame } from "@/lib/steam";
import { NewsSection } from "@/components/NewsSection";
import { MarketplacePreview } from "@/components/MarketplacePreview";
import ModernFriendsCard from "@/components/ModernFriendsCard";
import FriendRequestCard from "@/components/FriendRequestCard";
import ModernPopularGroups from "@/components/ModernPopularGroups";

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function Feed() {
  const { data: session, status } = useSession();
  const { currentTheme } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [popularGroups, setPopularGroups] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [trendingGames, setTrendingGames] = useState<
    (SteamGame & { isPlaying?: boolean; _count?: { activePlayers: number } })[]
  >([]);
  const [loadingGames, setLoadingGames] = useState(true);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  // Helper function to show toast notifications
  const showToastNotification = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const fetchPosts = useCallback(async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/posts");
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        console.error("Unexpected posts data format");
        setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  const fetchFriends = useCallback(async () => {
    try {
      const response = await fetch("/api/friends");
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  }, []);

  const fetchFriendRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/friends/requests");
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(
          data.filter(
            (req: any) =>
              req.status === "PENDING" && req.receiverId === session?.user?.id
          )
        );
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const fetchPopularGroups = async () => {
      try {
        const response = await fetch("/api/groups?sort=popular&limit=3");
        if (response.ok) {
          const data = await response.json();
          setPopularGroups(data);
        }
      } catch (error) {
        console.error("Error fetching popular groups:", error);
      }
    };

    const fetchActiveUsers = async () => {
      try {
        const response = await fetch("/api/users/active");
        if (response.ok) {
          const data = await response.json();
          setActiveUsers(data);
        }
      } catch (error) {
        console.error("Error fetching active users:", error);
      }
    };

    const fetchTrendingGames = async () => {
      setLoadingGames(true);
      try {
        const response = await fetch("/api/games/trending");
        if (response.ok) {
          const data = await response.json();
          console.log("Trending games data received:", data);
          setTrendingGames(data);
        } else {
          console.error("Failed to fetch trending games:", response.statusText);
          // Fall back to demo data if API fails
          setTrendingGames([
            {
              id: 730,
              name: "Counter-Strike 2",
              current_players: 896123,
              peak_today: 1023456,
              image_url:
                "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg",
            },
            {
              id: 570,
              name: "Dota 2",
              current_players: 502345,
              peak_today: 625789,
              image_url:
                "https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg",
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching trending games:", error);
        // Fall back to demo data if API fails
        setTrendingGames([
          {
            id: 730,
            name: "Counter-Strike 2",
            current_players: 896123,
            peak_today: 1023456,
            image_url:
              "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg",
          },
          {
            id: 570,
            name: "Dota 2",
            current_players: 502345,
            peak_today: 625789,
            image_url:
              "https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg",
          },
        ]);
      } finally {
        setLoadingGames(false);
      }
    };

    const fetchFriends = async () => {
      try {
        const response = await fetch("/api/friends");
        if (response.ok) {
          const data = await response.json();
          setFriends(data.friends || []);
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    const fetchFriendRequests = async () => {
      try {
        const response = await fetch("/api/friends/requests");
        if (response.ok) {
          const data = await response.json();
          setFriendRequests(
            data.filter(
              (req: any) =>
                req.status === "PENDING" && req.receiverId === session?.user?.id
            )
          );
        }
      } catch (error) {
        console.error("Error fetching friend requests:", error);
      }
    };

    // Initial fetch
    fetchPosts();
    fetchPopularGroups();
    fetchActiveUsers();
    fetchTrendingGames();
    fetchFriends();
    fetchFriendRequests();

    // Set up intervals
    const userInterval = setInterval(fetchActiveUsers, 60000);
    const gamesInterval = setInterval(fetchTrendingGames, 300000); // Update every 5 minutes

    // Clean up intervals
    return () => {
      clearInterval(userInterval);
      clearInterval(gamesInterval);
    };
  }, [session?.user?.id]);

  return (
    <div className={styles.pageContainer}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={styles.header}>
          <h1 className={styles.title}>GamerSocial</h1>
          <p className={styles.subtitle}>Connect, Share, and Play Together</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <ModernProfileCard friends={friends} />

            <GlowCard className="p-4 mt-6" glowColor="secondary">
              <h2 className="text-lg font-semibold mb-3 text-secondary">
                Top Steam Games
              </h2>
              <div className="space-y-3">
                {loadingGames ? (
                  // Loading skeleton
                  Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-[120px] h-[45px] bg-gray-700 rounded animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                          <div className="h-3 bg-gray-700 rounded w-32 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : trendingGames.length > 0 ? (
                  trendingGames.map((game) => (
                    <div key={game.id} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {game.image_url ? (
                            <Image
                              src={game.image_url}
                              alt={game.name}
                              width={240}
                              height={90}
                              className="rounded w-[120px] h-auto"
                            />
                          ) : (
                            <div className="w-[120px] h-[45px] bg-gray-700 rounded flex items-center justify-center">
                              <span className="text-xl text-gray-400">
                                {game.name[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm truncate">
                            {game.name}
                          </h3>
                          <p
                            className={`${styles.textSecondary} text-sm mt-1 truncate`}>
                            {(game.current_players || 0).toLocaleString()}{" "}
                            playing now
                          </p>
                          <p
                            className={`${styles.textSecondary} text-xs mt-0.5 truncate`}>
                            Peak: {game.peak_today?.toLocaleString() || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-center py-2 ${styles.textSecondary}`}>
                    No games trending right now
                  </p>
                )}
              </div>
            </GlowCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnnouncementBanner />

            {/* Stories Section */}
            <GlowCard className="p-6 mb-6" glowColor="primary">
              <ModernStories />
            </GlowCard>

            {/* Enhanced Post Creator */}
            <EnhancedPostCreator
              onPostCreated={() => {
                // Refresh posts when a new post is created
                fetchPosts();
              }}
              onShowToast={showToastNotification}
            />

            {/* Posts Feed */}
            <div className="space-y-6">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-800 rounded-lg p-6 space-y-4 animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-700 rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-24" />
                        <div className="h-3 bg-gray-700 rounded w-16" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={session?.user}
                    onPostDelete={async (postId: string) => {
                      try {
                        const response = await fetch(`/api/posts/${postId}`, {
                          method: "DELETE",
                        });

                        if (response.ok) {
                          // Remove from local state after successful deletion
                          setPosts(posts.filter((p) => p.id !== postId));
                          showToastNotification(
                            "✅ Post deleted successfully!",
                            "success"
                          );
                        } else {
                          console.error(
                            "Failed to delete post:",
                            response.statusText
                          );
                          showToastNotification(
                            "❌ Failed to delete post. Please try again.",
                            "error"
                          );
                        }
                      } catch (error) {
                        console.error("Error deleting post:", error);
                        showToastNotification(
                          "❌ Failed to delete post. Please try again.",
                          "error"
                        );
                      }
                    }}
                    onPostUpdate={(updatedPost) => {
                      // Update the post in the local state when boosted or modified
                      setPosts((currentPosts) =>
                        currentPosts.map((p) =>
                          p.id === updatedPost.id ? { ...p, ...updatedPost } : p
                        )
                      );
                    }}
                    onPostHide={(postId: string) => {
                      // Hide post when user is blocked
                      setPosts(posts.filter((p) => p.id !== postId));
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className={styles.textSecondary}>
                    No posts yet. Be the first to share something!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <ModernActiveUsers activeUsers={activeUsers} />

            {/* Friend Requests Card */}
            <FriendRequestCard className="mt-6" />

            {/* Modern Friends Card */}
            <ModernFriendsCard className="mt-6" />

            {/* Marketplace Preview */}
            <MarketplacePreview className="mt-6" />

            {/* Modern Popular Groups */}
            <ModernPopularGroups className="mt-6" />

            {/* Gaming News Section */}
            <GlowCard className="mt-6">
              <NewsSection />
            </GlowCard>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    </div>
  );
}
