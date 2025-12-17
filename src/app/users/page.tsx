"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import Image from "next/image";
import Link from "next/link";
import { GlowCard } from "@/components/ui/GlowCard";
import { NeonButton } from "@/components/ui/NeonButton";
import styles from "./users.module.css";

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  lastSeen?: Date;
  followers?: number;
  following?: number;
  friends?: number;
  isFollowing?: boolean;
  isFriend?: boolean;
  friendRequestSent?: boolean;
}

interface FilterType {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");

  const isRecentlyActive = (lastSeen?: Date) => {
    if (!lastSeen) return false;
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInHours =
      (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24;
  };

  const filters: FilterType[] = [
    { id: "all", label: "All Players", icon: "👥", count: users.length },
    {
      id: "friends",
      label: "Friends",
      icon: "👫",
      count: users.filter((u) => u.isFriend).length,
    },
    {
      id: "following",
      label: "Following",
      icon: "🔄",
      count: users.filter((u) => u.isFollowing).length,
    },
    {
      id: "active",
      label: "Recently Active",
      icon: "🟢",
      count: users.filter((u) => isRecentlyActive(u.lastSeen)).length,
    },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, activeFilter, sortBy]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = users.filter(
      (user) => user._id !== session?.user?.id // Exclude current user
    );

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case "friends":
        filtered = filtered.filter((user) => user.isFriend);
        break;
      case "following":
        filtered = filtered.filter((user) => user.isFollowing);
        break;
      case "active":
        filtered = filtered.filter((user) => isRecentlyActive(user.lastSeen));
        break;
      // "all" case - no additional filtering needed
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        // Keep default order (newest first)
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "followers":
        filtered.sort((a, b) => (b.followers || 0) - (a.followers || 0));
        break;
      case "active":
        filtered.sort((a, b) => {
          const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
          const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
          return bTime - aTime;
        });
        break;
    }

    setFilteredUsers(filtered);
  };

  const getThemeClass = () => {
    switch (currentTheme.id) {
      case "valorant":
        return styles.valorant;
      case "cyberpunk2077":
        return styles.cyberpunk;
      case "fortnite":
        return styles.fortnite;
      case "matrix":
        return styles.matrix;
      case "synthwave":
        return styles.synthwave;
      case "witcher":
        return styles.witcher;
      case "ghostrunner":
        return styles.ghostrunner;
      case "darksouls":
        return styles.darksouls;
      case "halo":
        return styles.halo;
      case "default":
        return styles.default;
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

  const getStatusIndicator = (user: User) => {
    if (user.isFriend) return { text: "Friend", color: "success", icon: "✅" };
    if (user.isFollowing)
      return { text: "Following", color: "primary", icon: "🔄" };
    if (user.friendRequestSent)
      return { text: "Request Sent", color: "warning", icon: "⏳" };
    if (isRecentlyActive(user.lastSeen))
      return { text: "Online", color: "success", icon: "🟢" };
    return { text: "Offline", color: "secondary", icon: "⚫" };
  };

  const getRelativeTime = (date?: Date) => {
    if (!date) return "Never";
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - new Date(date).getTime()) / 1000
    );

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      const response = await fetch("/api/friends/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverId: userId }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Refresh users or update UI
        fetchUsers();
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  if (loading) {
    return (
      <div className={`${styles.pageContainer} ${getThemeClass()}`}>
        <div className={styles.backgroundPattern}></div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className={styles.modernHeader}>
            <div className={styles.headerContent}>
              <div className={styles.headerIcon}>👥</div>
              <div className={styles.headerText}>
                <h1 className={styles.modernTitle}>Discover Players</h1>
                <p className={styles.modernSubtitle}>
                  Building gaming connections...
                </p>
              </div>
            </div>
          </div>
          <div className={styles.loadingGrid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.modernLoadingSkeleton}>
                <div className={styles.skeletonAvatar}></div>
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonLine}></div>
                  <div className={styles.skeletonLine}></div>
                  <div className={styles.skeletonButtons}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.pageContainer} ${getThemeClass()}`}>
      <div className={styles.backgroundPattern}></div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Modern Header */}
        <div className={styles.modernHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>👥</div>
            <div className={styles.headerText}>
              <h1 className={styles.modernTitle}>Discover Players</h1>
              <p className={styles.modernSubtitle}>
                Connect with {filteredUsers.length} fellow gamers • Build your
                gaming network
              </p>
            </div>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statBadge}>
              <span className={styles.statNumber}>{users.length}</span>
              <span className={styles.statLabel}>Total Players</span>
            </div>
            <div className={styles.statBadge}>
              <span className={styles.statNumber}>
                {users.filter((u) => isRecentlyActive(u.lastSeen)).length}
              </span>
              <span className={styles.statLabel}>Online Now</span>
            </div>
          </div>
        </div>

        {/* Advanced Controls */}
        <div className={styles.modernControls}>
          {/* Search Bar */}
          <div className={styles.modernSearchWrapper}>
            <div className={styles.searchIconContainer}>
              <span className={styles.modernSearchIcon}>🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search by username, bio, or interests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.modernSearchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className={styles.clearSearchBtn}>
                ✕
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className={styles.modernFilterTabs}>
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`${styles.modernFilterTab} ${
                  activeFilter === filter.id ? styles.activeFilterTab : ""
                }`}>
                <span className={styles.filterTabIcon}>{filter.icon}</span>
                <span className={styles.filterTabLabel}>{filter.label}</span>
                <span className={styles.filterTabCount}>{filter.count}</span>
              </button>
            ))}
          </div>

          {/* Sort and View Options */}
          <div className={styles.modernOptions}>
            <div className={styles.sortWrapper}>
              <label className={styles.optionLabel}>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.modernSelect}
                aria-label="Sort players by">
                <option value="newest">Newest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="followers">Most Followers</option>
                <option value="active">Recently Active</option>
              </select>
            </div>

            <div className={styles.viewToggle}>
              <button
                onClick={() => setViewMode("grid")}
                className={`${styles.viewBtn} ${
                  viewMode === "grid" ? styles.activeViewBtn : ""
                }`}>
                ⊞
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`${styles.viewBtn} ${
                  viewMode === "list" ? styles.activeViewBtn : ""
                }`}>
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Modern Users Grid */}
        <div className={`${styles.modernUsersGrid} ${styles[viewMode]}`}>
          {filteredUsers.map((user) => {
            const status = getStatusIndicator(user);
            return (
              <GlowCard
                key={user._id}
                className={styles.modernUserCard}
                glowColor="primary">
                {/* User Card Header */}
                <div className={styles.modernCardHeader}>
                  <div className={styles.modernAvatarContainer}>
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={80}
                        height={80}
                        className={styles.modernAvatar}
                        unoptimized
                      />
                    ) : (
                      <div className={styles.modernAvatarPlaceholder}>
                        <span className={styles.modernAvatarInitials}>
                          {getInitials(user.name)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`${styles.statusIndicator} ${
                        styles[status.color]
                      }`}>
                      <span className={styles.statusIcon}>{status.icon}</span>
                    </div>
                  </div>

                  <div className={styles.modernUserInfo}>
                    <div className={styles.userNameRow}>
                      <h3 className={styles.modernUserName}>{user.name}</h3>
                      <span
                        className={`${styles.statusBadge} ${
                          styles[status.color]
                        }`}>
                        {status.text}
                      </span>
                    </div>
                    <p className={styles.modernUserBio}>
                      {user.bio || "Ready to game together! 🎮"}
                    </p>
                    <div className={styles.lastSeenInfo}>
                      <span className={styles.lastSeenText}>
                        Last seen {getRelativeTime(user.lastSeen)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Stats */}
                <div className={styles.modernUserStats}>
                  <div className={styles.modernStat}>
                    <span className={styles.modernStatNumber}>
                      {user.followers || 0}
                    </span>
                    <span className={styles.modernStatLabel}>Followers</span>
                  </div>
                  <div className={styles.modernStat}>
                    <span className={styles.modernStatNumber}>
                      {user.following || 0}
                    </span>
                    <span className={styles.modernStatLabel}>Following</span>
                  </div>
                  <div className={styles.modernStat}>
                    <span className={styles.modernStatNumber}>
                      {user.friends || 0}
                    </span>
                    <span className={styles.modernStatLabel}>Friends</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.modernUserActions}>
                  <Link
                    href={`/users/${user._id}`}
                    className={styles.modernViewProfileBtn}>
                    <span className={styles.actionIcon}>👤</span>
                    View Profile
                  </Link>

                  {!user.isFriend && !user.friendRequestSent && (
                    <NeonButton
                      onClick={() => handleSendFriendRequest(user._id)}
                      variant="secondary"
                      size="sm"
                      className={styles.modernActionBtn}>
                      <span className={styles.actionIcon}>👫</span>
                      Add Friend
                    </NeonButton>
                  )}

                  {!user.isFollowing && (
                    <NeonButton
                      onClick={() => handleFollow(user._id)}
                      variant="accent"
                      size="sm"
                      className={styles.modernActionBtn}>
                      <span className={styles.actionIcon}>🔄</span>
                      Follow
                    </NeonButton>
                  )}
                </div>

                {/* Card Overlay Effect */}
                <div className={styles.cardHoverOverlay}></div>
              </GlowCard>
            );
          })}
        </div>

        {/* Modern Empty State */}
        {filteredUsers.length === 0 && !loading && (
          <div className={styles.modernEmptyState}>
            <div className={styles.emptyStateIcon}>
              <div className={styles.emptyIconContainer}>
                <span className={styles.emptyMainIcon}>�</span>
                <span className={styles.emptyFloatingIcon1}>�👥</span>
                <span className={styles.emptyFloatingIcon2}>🎮</span>
              </div>
            </div>
            <div className={styles.emptyStateContent}>
              <h3 className={styles.modernEmptyTitle}>
                {searchTerm
                  ? "No players match your search"
                  : "No players in this category"}
              </h3>
              <p className={styles.modernEmptyText}>
                {searchTerm
                  ? `We couldn't find any players matching "${searchTerm}". Try adjusting your search terms.`
                  : "This filter doesn't have any players yet. Try a different category or check back later."}
              </p>
              <div className={styles.emptyStateActions}>
                {searchTerm && (
                  <NeonButton
                    onClick={() => setSearchTerm("")}
                    variant="primary">
                    Clear Search
                  </NeonButton>
                )}
                <NeonButton
                  onClick={() => setActiveFilter("all")}
                  variant="accent">
                  View All Players
                </NeonButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
