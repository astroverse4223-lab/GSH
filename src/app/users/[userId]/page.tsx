"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { GlowCard } from "@/components/ui/GlowCard";
import { PostCard } from "@/components/PostCard";
import styles from "./userProfile.module.css";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  bannerImage?: string;
  createdAt: string;
  lastSeen?: string;
  followers: number;
  following: number;
  friends: number;
  isFollowing?: boolean;
  isFriend?: boolean;
  isBlocked?: boolean;
  friendRequestSent?: boolean;
}

interface Post {
  id: string;
  content: string;
  image?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  reactions: any[];
  comments: any[];
  _count: {
    reactions: number;
    comments: number;
  };
}

export default function UserProfilePage() {
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const params = useParams();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setIsFollowing(data.isFollowing || false);
        setIsFriend(data.isFriend || false);
        setIsBlocked(data.isBlocked || false);
        setFriendRequestSent(data.friendRequestSent || false);
      } else {
        console.error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!session || followLoading) return;

    try {
      setFollowLoading(true);

      const method = isFollowing ? "DELETE" : "POST";
      const response = await fetch("/api/follow", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(!isFollowing);
        // Update follower count
        if (profile) {
          setProfile({
            ...profile,
            followers: !isFollowing
              ? profile.followers + 1
              : profile.followers - 1,
          });
        }
      }
    } catch (error) {
      console.error("Error following user:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (!session || !isFriend) return;

    try {
      const response = await fetch("/api/friends", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setIsFriend(false);
        // Also unfollow if they were following
        setIsFollowing(false);
        if (profile) {
          setProfile({
            ...profile,
            followers: profile.followers - 1,
          });
        }
      }
    } catch (error) {
      console.error("Error unfriending user:", error);
    }
  };

  const handleAddFriend = async () => {
    if (!session || friendRequestSent || isFriend) return;

    console.log("[FRIEND_REQUEST] Attempting to add friend:", userId);
    console.log("[FRIEND_REQUEST] Current user:", session.user?.id);

    try {
      const response = await fetch("/api/friends/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      console.log("[FRIEND_REQUEST] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[FRIEND_REQUEST] Success:", data);
        setFriendRequestSent(true);
        // If they auto-accepted (mutual follow), update friend status
        if (data.autoAccepted) {
          setIsFriend(true);
        }
      } else {
        const errorText = await response.text();
        console.error("[FRIEND_REQUEST] Error:", response.status, errorText);
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const handleBlock = async () => {
    if (!session) return;

    try {
      const response = await fetch("/api/privacy/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setIsBlocked(true);
        setIsFriend(false);
        setIsFollowing(false);
      }
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  const handleReport = async (reason: string) => {
    if (!session) return;

    try {
      const response = await fetch("/api/privacy/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "USER",
          category: reason.toUpperCase(),
          description: `Reported user ${profile?.name} for ${reason}`,
          reportedUserId: userId,
        }),
      });

      if (response.ok) {
        setShowReportModal(false);
        // You might want to show a success toast here
      } else {
        console.error("Failed to report user:", await response.text());
      }
    } catch (error) {
      console.error("Error reporting user:", error);
    }
  };

  const getThemeClass = () => {
    const theme = currentTheme?.name || currentTheme;
    switch (theme) {
      case "cyberpunk":
        return styles.cyberpunk;
      case "neon":
        return styles.neon;
      case "galaxy":
        return styles.galaxy;
      case "ocean":
        return styles.ocean;
      case "forest":
        return styles.forest;
      case "sunset":
        return styles.sunset;
      case "arctic":
        return styles.arctic;
      case "desert":
        return styles.desert;
      case "volcano":
        return styles.volcano;
      case "space":
        return styles.space;
      default:
        return "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className={`${styles.pageContainer} ${getThemeClass()}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className={styles.loadingSkeleton}>
            <div className={styles.bannerSkeleton}></div>
            <div className={styles.profileSkeleton}></div>
            <div className={styles.contentSkeleton}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`${styles.pageContainer} ${getThemeClass()}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className={styles.errorState}>
            <h2>User not found</h2>
            <p>
              The user you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/users" className={styles.backButton}>
              Back to Users
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.pageContainer} ${getThemeClass()}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link href="/users" className={styles.backLink}>
          <svg
            className={styles.backIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 12H5M12 19l-7-7 7-7"
            />
          </svg>
          Back to Users
        </Link>

        {/* Modern Profile Layout */}
        <div className={styles.profileLayout}>
          {/* Profile Header Card */}
          <GlowCard className={styles.profileHeaderCard} glowColor="primary">
            {/* Cover/Banner Section */}
            <div className={styles.coverSection}>
              {profile.bannerImage ? (
                <Image
                  src={profile.bannerImage}
                  alt="Profile banner"
                  fill
                  className={styles.coverImage}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              ) : (
                <div className={styles.defaultCover}></div>
              )}
            </div>

            {/* Profile Avatar - Positioned relative to the entire card */}
            <div className={styles.avatarWrapper}>
              <div className={styles.avatarContainer}>
                {profile.image ? (
                  <Image
                    src={profile.image}
                    alt={profile.name}
                    width={120}
                    height={120}
                    className={styles.avatar}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}
                <div className={styles.avatarFallback}>
                  {getInitials(profile.name)}
                </div>

                {/* Online Status Indicator */}
                <div className={styles.statusIndicator}>
                  <div className={styles.statusDot}></div>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className={styles.profileContent}>
              <div className={styles.profileHeader}>
                <div className={styles.profileText}>
                  <h1 className={styles.profileName}>{profile.name}</h1>
                  <p className={styles.profileBio}>
                    {profile.bio ||
                      "Gaming enthusiast 🎮 Ready to connect and play!"}
                  </p>

                  {/* Join Date */}
                  <div className={styles.joinDate}>
                    <svg
                      className={styles.calendarIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Joined{" "}
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                {session?.user?.id !== profile.id && !isBlocked && (
                  <div className={styles.actionButtons}>
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`${styles.primaryButton} ${
                        isFollowing ? styles.followingState : styles.followState
                      }`}>
                      <svg
                        className={styles.buttonIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor">
                        {isFollowing ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        )}
                      </svg>
                      {followLoading
                        ? "Loading..."
                        : isFollowing
                        ? "Following"
                        : "Follow"}
                    </button>

                    {/* Friend Actions */}
                    {isFriend ? (
                      <button
                        onClick={handleUnfriend}
                        className={styles.secondaryButton}>
                        <svg
                          className={styles.buttonIcon}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Unfriend
                      </button>
                    ) : friendRequestSent ? (
                      <button disabled className={styles.pendingButton}>
                        <svg
                          className={styles.buttonIcon}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12,6 12,12 16,14" />
                        </svg>
                        Request Sent
                      </button>
                    ) : (
                      <button
                        onClick={handleAddFriend}
                        className={styles.friendButton}>
                        <svg
                          className={styles.buttonIcon}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197v0z"
                          />
                        </svg>
                        Add Friend
                      </button>
                    )}

                    {/* More Actions Dropdown */}
                    <div className={styles.moreActions}>
                      <button
                        className={styles.moreButton}
                        title="More actions">
                        <svg
                          className={styles.buttonIcon}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                      </button>
                      <div className={styles.dropdown}>
                        <button
                          onClick={handleBlock}
                          className={styles.dropdownItem}>
                          <svg
                            className={styles.dropdownIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                          Block User
                        </button>
                        <button
                          onClick={() => setShowReportModal(true)}
                          className={styles.dropdownItem}>
                          <svg
                            className={styles.dropdownIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          Report User
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isBlocked && (
                  <div className={styles.blockedState}>
                    <svg
                      className={styles.blockedIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    <span>You have blocked this user</span>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statNumber}>
                      {profile.followers}
                    </span>
                    <span className={styles.statLabel}>Followers</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statNumber}>
                      {profile.following}
                    </span>
                    <span className={styles.statLabel}>Following</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197v0z"
                      />
                    </svg>
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statNumber}>{profile.friends}</span>
                    <span className={styles.statLabel}>Friends</span>
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Posts Section */}
          <div className={styles.postsContainer}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <svg
                  className={styles.sectionIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
                Posts by {profile.name}
              </h2>
              <div className={styles.postCount}>
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </div>
            </div>

            {posts.length > 0 ? (
              <div className={styles.postsGrid}>
                {posts.map((post) => (
                  <GlowCard
                    key={post.id}
                    className={styles.postCard}
                    glowColor="secondary">
                    <div className={styles.postContent}>
                      <p className={styles.postText}>{post.content}</p>
                      {post.image && (
                        <div className={styles.postImageWrapper}>
                          <Image
                            src={post.image}
                            alt="Post image"
                            width={400}
                            height={300}
                            className={styles.postImage}
                          />
                        </div>
                      )}
                    </div>

                    <div className={styles.postMeta}>
                      <div className={styles.postDate}>
                        <svg
                          className={styles.timeIcon}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12,6 12,12 16,14" />
                        </svg>
                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>

                      <div className={styles.postStats}>
                        <span className={styles.postStat}>
                          <svg
                            className={styles.statIconSmall}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          {post._count?.reactions || 0}
                        </span>
                        <span className={styles.postStat}>
                          <svg
                            className={styles.statIconSmall}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          {post._count?.comments || 0}
                        </span>
                      </div>
                    </div>
                  </GlowCard>
                ))}
              </div>
            ) : (
              <GlowCard className={styles.emptyState} glowColor="secondary">
                <div className={styles.emptyIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.286a1 1 0 00-.293-.707l-6.414-6.414A1 1 0 0016.586 1H7a1 1 0 00-1 1v3m0 0h6.5l6.5 6.5V19a1 1 0 01-1 1z"
                    />
                  </svg>
                </div>
                <h3 className={styles.emptyTitle}>No posts yet</h3>
                <p className={styles.emptyDescription}>
                  {profile.name} hasn't shared anything yet. Check back later
                  for new content!
                </p>
              </GlowCard>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.reportModal}>
            <h3>Report User</h3>
            <p>Why are you reporting {profile?.name}?</p>

            <div className={styles.reportOptions}>
              <button
                onClick={() => handleReport("spam")}
                className={styles.reportOption}>
                Spam
              </button>
              <button
                onClick={() => handleReport("harassment")}
                className={styles.reportOption}>
                Harassment
              </button>
              <button
                onClick={() => handleReport("inappropriate_content")}
                className={styles.reportOption}>
                Inappropriate Content
              </button>
              <button
                onClick={() => handleReport("scam")}
                className={styles.reportOption}>
                Scam
              </button>
              <button
                onClick={() => handleReport("other")}
                className={styles.reportOption}>
                Other
              </button>
            </div>

            <div className={styles.reportModalActions}>
              <button
                onClick={() => setShowReportModal(false)}
                className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
