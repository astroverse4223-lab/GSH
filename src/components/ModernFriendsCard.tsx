import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { getUserImageWithFallback } from "@/lib/fallback-images";
import styles from "./ModernFriendsCard.module.css";

interface Friend {
  id: string;
  name: string;
  image?: string;
  isOnline?: boolean;
  lastSeen?: string;
  mutualFriends?: number;
}

interface ModernFriendsCardProps {
  className?: string;
}

export default function ModernFriendsCard({
  className = "",
}: ModernFriendsCardProps) {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchFriends();
    }
  }, [session?.user?.id]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/friends");
      if (!response.ok) {
        throw new Error("Failed to fetch friends");
      }
      const data = await response.json();
      setFriends(data.friends || []);
    } catch (err) {
      console.error("Error fetching friends:", err);
      setError("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) return null;

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Enhanced Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.iconWrapper}>
            <svg
              className={styles.headerIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.196-2.12m0 0L12 15l4.804-2.12m0 0L18 11.5M7 20H2v-2a3 3 0 015.196-2.12m0 0L12 15l-4.804-2.12m0 0L6 11.5m6 0a4 4 0 100-8 4 4 0 000 8z"
              />
            </svg>
          </div>
          <h3 className={styles.title}>Friends</h3>
          <div className={styles.friendCount}>{friends.length}</div>
        </div>
        <Link href="/users" className={styles.viewAll}>
          <span>View All</span>
          <svg
            className={styles.arrowIcon}
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={styles.friendSkeleton}>
                <div className={styles.avatarSkeleton}>
                  <div className={styles.skeletonShimmer}></div>
                </div>
                <div className={styles.infoSkeleton}>
                  <div className={styles.nameSkeleton}>
                    <div className={styles.skeletonShimmer}></div>
                  </div>
                  <div className={styles.statusSkeleton}>
                    <div className={styles.skeletonShimmer}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className={styles.error}>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className={styles.errorText}>{error}</p>
            <button onClick={fetchFriends} className={styles.retryBtn}>
              Try Again
            </button>
          </div>
        ) : friends.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197v0z"
                />
              </svg>
            </div>
            <h4 className={styles.emptyTitle}>No Friends Yet</h4>
            <p className={styles.emptyText}>
              Start building your gaming network
            </p>
            <Link href="/users" className={styles.findFriendsBtn}>
              <svg
                className={styles.buttonIcon}
                viewBox="0 0 20 20"
                fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Find Friends
            </Link>
          </div>
        ) : (
          <div className={styles.friendsList}>
            {friends.slice(0, 6).map((friend, index) => (
              <Link
                key={friend.id}
                href={`/users/${friend.id}`}
                className={styles.friendItem}
                style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={styles.avatarContainer}>
                  <Image
                    src={getUserImageWithFallback(friend)}
                    alt={friend.name}
                    width={48}
                    height={48}
                    className={styles.avatar}
                  />
                  {friend.isOnline && (
                    <div className={styles.onlineIndicator}>
                      <div className={styles.onlinePulse}></div>
                    </div>
                  )}
                </div>
                <div className={styles.friendInfo}>
                  <span className={styles.friendName}>{friend.name}</span>
                  <span className={styles.friendStatus}>
                    {friend.isOnline ? (
                      <span className={styles.online}>
                        <div className={styles.statusDot}></div>
                        Online
                      </span>
                    ) : friend.lastSeen ? (
                      <span className={styles.offline}>
                        <svg
                          className={styles.clockIcon}
                          viewBox="0 0 20 20"
                          fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formatLastSeen(friend.lastSeen)}
                      </span>
                    ) : (
                      <span className={styles.offline}>
                        <div className={styles.statusDot}></div>
                        Offline
                      </span>
                    )}
                  </span>
                </div>
                <div className={styles.hoverEffect}></div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {friends.length > 6 && (
        <div className={styles.footer}>
          <Link href="/users" className={styles.seeMore}>
            <span>See {friends.length - 6} more friends</span>
            <svg
              className={styles.moreIcon}
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}

function formatLastSeen(lastSeen: string): string {
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
