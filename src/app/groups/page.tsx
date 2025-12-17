"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { GlowCard } from "@/components/ui/GlowCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Toast } from "@/components/ui/Toast";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import {
  generateFallbackGroupIcon,
  getUserImageWithFallback,
} from "@/lib/fallback-images";
import styles from "./styles.module.css";

type Group = {
  id: string;
  name: string;
  description: string;
  image?: string | null;
  category: string;
  members: {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

export default function GroupsPage() {
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "members" | "newest">("newest");
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    category: "fps",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  const categories = [
    {
      id: "all",
      name: "All Groups",
      icon: "🎮",
      color: "from-purple-500 to-pink-500",
    },
    { id: "fps", name: "FPS", icon: "🔫", color: "from-red-500 to-orange-500" },
    {
      id: "mmorpg",
      name: "MMORPG",
      icon: "⚔️",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "racing",
      name: "Racing",
      icon: "🏎️",
      color: "from-yellow-500 to-red-500",
    },
    {
      id: "strategy",
      name: "Strategy",
      icon: "🧠",
      color: "from-green-500 to-blue-500",
    },
    {
      id: "sports",
      name: "Sports",
      icon: "⚽",
      color: "from-orange-500 to-yellow-500",
    },
  ];

  useEffect(() => {
    fetchGroups();
  }, [selectedCategory]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/groups${
          selectedCategory !== "all" ? `?category=${selectedCategory}` : ""
        }`
      );
      if (!response.ok) throw new Error("Failed to fetch groups");
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to show toast notifications
  const showToastNotification = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Filter and sort groups
  const filteredAndSortedGroups = groups
    .filter(
      (group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "members":
          return b.members.length - a.members.length;
        case "newest":
        default:
          return 0; // Keep original order (newest first from API)
      }
    });

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete group");
      }

      // Remove the group from the state
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group.id !== groupId)
      );
      setShowDeleteConfirm(null);
      showToastNotification("Group deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting group:", error);
      showToastNotification(
        "Failed to delete group. Please try again.",
        "error"
      );
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", newGroup.name);
      formData.append("description", newGroup.description);
      formData.append("category", newGroup.category);
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const response = await fetch("/api/groups/create", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 403) {
          // Subscription limit reached
          showToastNotification(
            `🚫 ${errorData.error} Upgrade your subscription to create more groups!`,
            "warning"
          );
          return;
        }

        throw new Error("Failed to create group");
      }

      const createdGroup = await response.json();
      setGroups((prev) => [createdGroup, ...prev]);
      setShowCreateModal(false);
      setNewGroup({ name: "", description: "", category: "fps" });
      setSelectedFile(null);
      setPreviewUrl(null);
      showToastNotification("🎉 Group created successfully!", "success");
    } catch (error) {
      console.error("Error creating group:", error);
      showToastNotification(
        "❌ Failed to create group. Please try again.",
        "error"
      );
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Gaming Communities
                <span className={styles.heroGradient}>Connect & Conquer</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Join thousands of gamers in epic communities. Find your squad,
                share strategies, and dominate together.
              </p>
              <div className={styles.heroStats}>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{groups.length}+</span>
                  <span className={styles.statLabel}>Active Groups</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>
                    {groups.reduce(
                      (acc, group) => acc + group.members.length,
                      0
                    )}
                    +
                  </span>
                  <span className={styles.statLabel}>Members</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>24/7</span>
                  <span className={styles.statLabel}>Gaming</span>
                </div>
              </div>
            </div>
            <div className={styles.heroActions}>
              <NeonButton
                onClick={() => setShowCreateModal(true)}
                className={styles.heroPrimaryButton}>
                <span className={styles.buttonIcon}>⚡</span>
                Create Group
              </NeonButton>
              {session && (
                <Link href="/profile" className={styles.heroSecondaryButton}>
                  <span className={styles.buttonIcon}>👥</span>
                  My Profile
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className={styles.controlsSection}>
          <div className={styles.searchSection}>
            <div className={styles.searchContainer}>
              <div className={styles.searchIcon}>🔍</div>
              <input
                type="text"
                placeholder="Search groups by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={styles.clearSearch}>
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className={styles.filtersSection}>
            <div className={styles.viewToggle}>
              <button
                onClick={() => setViewMode("grid")}
                className={`${styles.viewButton} ${
                  viewMode === "grid" ? styles.viewButtonActive : ""
                }`}>
                <span className={styles.viewIcon}>⊞</span>
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`${styles.viewButton} ${
                  viewMode === "list" ? styles.viewButtonActive : ""
                }`}>
                <span className={styles.viewIcon}>☰</span>
                List
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "name" | "members" | "newest")
              }
              className={styles.sortSelect}>
              <option value="newest">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="members">Most Members</option>
            </select>
          </div>
        </div>

        {/* Enhanced Categories */}
        <div className={styles.categoriesSection}>
          <h3 className={styles.categoriesTitle}>Browse by Category</h3>
          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`${styles.categoryCard} ${
                  selectedCategory === category.id
                    ? styles.categoryCardActive
                    : ""
                }`}>
                <div className={styles.categoryIcon}>{category.icon}</div>
                <span className={styles.categoryName}>{category.name}</span>
                <div className={styles.categoryCount}>
                  {category.id === "all"
                    ? groups.length
                    : groups.filter((g) => g.category === category.id)
                        .length}{" "}
                  groups
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Groups Grid/List */}
        {loading ? (
          <div className={styles.loadingSection}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading gaming communities...</p>
          </div>
        ) : filteredAndSortedGroups.length > 0 ? (
          <div
            className={
              viewMode === "grid" ? styles.groupGrid : styles.groupList
            }>
            {filteredAndSortedGroups.map((group) => (
              <GlowCard
                key={group.id}
                className={
                  viewMode === "grid" ? styles.groupCard : styles.groupCardList
                }>
                <div className={styles.groupImageContainer}>
                  <Image
                    src={group.image || generateFallbackGroupIcon(group.name)}
                    alt={group.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={styles.groupImage}
                  />
                  <div className={styles.groupBadge}>
                    {categories.find((cat) => cat.id === group.category)?.icon}
                  </div>
                </div>
                <div className={styles.groupContent}>
                  <div className={styles.groupHeader}>
                    <h3 className={styles.groupName}>{group.name}</h3>
                    <div className={styles.memberBadge}>
                      <span className={styles.memberIcon}>👥</span>
                      {group.members.length}
                    </div>
                  </div>
                  <p className={styles.groupDescription}>{group.description}</p>
                  <div className={styles.groupMeta}>
                    <div className={styles.ownerInfo}>
                      <div className={styles.ownerAvatar}>
                        <Image
                          src={getUserImageWithFallback(group.owner)}
                          alt={group.owner.name || "Group Owner"}
                          fill
                          sizes="24px"
                          className="rounded-full object-cover"
                        />
                      </div>
                      <span className={styles.ownerName}>
                        Created by{" "}
                        <Link
                          href={
                            session?.user?.id === group.owner.id
                              ? "/profile"
                              : `/users/${group.owner.id}`
                          }
                          className={styles.ownerLink}>
                          {group.owner.name || "Anonymous"}
                        </Link>
                      </span>
                    </div>
                  </div>
                  <div className={styles.actionButtons}>
                    <NeonButton
                      variant="secondary"
                      onClick={() =>
                        (window.location.href = `/groups/${group.id}`)
                      }
                      className={styles.viewButton}>
                      <span className={styles.buttonIcon}>🚀</span>
                      Join Group
                    </NeonButton>
                    {session?.user?.id === group.owner.id && (
                      <button
                        onClick={() => setShowDeleteConfirm(group.id)}
                        className={styles.deleteButton}
                        aria-label="Delete group">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎮</div>
            <h3 className={styles.emptyTitle}>No groups found</h3>
            <p className={styles.emptyDescription}>
              {searchQuery
                ? `No groups match "${searchQuery}". Try adjusting your search.`
                : "No groups in this category yet. Be the first to create one!"}
            </p>
            <NeonButton
              onClick={() => setShowCreateModal(true)}
              className={styles.emptyAction}>
              Create First Group
            </NeonButton>
          </div>
        )}

        {/* Enhanced Create Group Modal */}
        {showCreateModal && (
          <div className={styles.modalOverlay}>
            <GlowCard className={styles.createModal}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  <span className={styles.modalIcon}>⚡</span>
                  Create Gaming Community
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={styles.modalClose}>
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateGroup} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span className={styles.labelIcon}>🏷️</span>
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, name: e.target.value })
                    }
                    className={styles.formInput}
                    placeholder="Enter an epic group name..."
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span className={styles.labelIcon}>📝</span>
                    Description
                  </label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, description: e.target.value })
                    }
                    className={styles.formTextarea}
                    placeholder="Describe your gaming community..."
                    rows={4}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span className={styles.labelIcon}>🖼️</span>
                    Group Banner (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        const url = URL.createObjectURL(file);
                        setPreviewUrl(url);
                      }
                    }}
                    className={styles.formFile}
                  />
                  {previewUrl && (
                    <div className={styles.previewContainer}>
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className={styles.previewImage}
                      />
                    </div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span className={styles.labelIcon}>🎯</span>
                    Category
                  </label>
                  <select
                    value={newGroup.category}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, category: e.target.value })
                    }
                    className={styles.formSelect}>
                    {categories
                      .filter((cat) => cat.id !== "all")
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className={styles.cancelButton}>
                    Cancel
                  </button>
                  <NeonButton type="submit" className={styles.createButton}>
                    <span className={styles.buttonIcon}>🚀</span>
                    Launch Community
                  </NeonButton>
                </div>
              </form>
            </GlowCard>
          </div>
        )}

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className={styles.modalOverlay}>
            <GlowCard className={styles.deleteModal}>
              <div className={styles.deleteHeader}>
                <h2 className={styles.deleteTitle}>
                  <span className={styles.deleteIcon}>⚠️</span>
                  Delete Community
                </h2>
              </div>
              <p className={styles.deleteDescription}>
                Are you sure you want to delete this gaming community? This
                action cannot be undone and all members will lose access.
              </p>
              <div className={styles.deleteActions}>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className={styles.cancelButton}>
                  Keep Community
                </button>
                <button
                  onClick={() =>
                    showDeleteConfirm && handleDeleteGroup(showDeleteConfirm)
                  }
                  className={styles.confirmDeleteButton}>
                  <span className={styles.buttonIcon}>🗑️</span>
                  Delete Forever
                </button>
              </div>
            </GlowCard>
          </div>
        )}

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
