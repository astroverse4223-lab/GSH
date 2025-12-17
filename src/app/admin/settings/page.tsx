"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./settings.module.css";

interface PlatformSettings {
  siteName: string;
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maxUploadSizeMB: number;
  maxPostLength: number;
  maxImagesPerPost: number;
  userLimits: {
    maxFriends: number;
    maxGroups: number;
  };
  features: {
    enableComments: boolean;
    enableLikes: boolean;
    enableSharing: boolean;
    enableMessaging: boolean;
    enableGroups: boolean;
    enableMarketplace: boolean;
    enableNotifications: boolean;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  subscription?: {
    tier: string;
    status: string;
    currentPeriodEnd?: string;
  };
}

export default function PlatformSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.email) {
      router.push("/auth/signin");
      return;
    }

    // Check if user is admin
    const isAdmin = session?.user?.email === "countryboya20@gmail.com";
    if (!isAdmin) {
      router.push("/");
      return;
    }

    fetchSettings();
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        throw new Error("Failed to fetch settings");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    if (!settings) return;

    setSettings((prev) => {
      if (!prev) return prev;

      // Handle nested keys like 'features.enableComments'
      if (key.includes(".")) {
        const [parentKey, childKey] = key.split(".");
        return {
          ...prev,
          [parentKey]: {
            ...(prev[parentKey as keyof PlatformSettings] as any),
            [childKey]: value,
          },
        };
      }

      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleUserSearch = async (query: string) => {
    if (query.length < 2) {
      setUserSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const users = await response.json();
        setUserSearchResults(users);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handleUserProStatus = async (userId: string, enablePro: boolean) => {
    setProcessingUser(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/pro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: enablePro }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: `User pro status ${
            enablePro ? "enabled" : "disabled"
          } successfully!`,
        });
        // Refresh user search results
        const currentQuery = (
          document.querySelector(
            'input[placeholder*="Search users"]'
          ) as HTMLInputElement
        )?.value;
        if (currentQuery) {
          handleUserSearch(currentQuery);
        }
      } else {
        throw new Error("Failed to update user pro status");
      }
    } catch (error) {
      console.error("Error updating user pro status:", error);
      setMessage({
        type: "error",
        text: "Failed to update user pro status",
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setProcessingUser(userToDelete.id);
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "User deleted successfully!",
        });
        // Remove user from search results
        setUserSearchResults((prev) =>
          prev.filter((u) => u.id !== userToDelete.id)
        );
        setShowDeleteConfirm(false);
        setUserToDelete(null);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete user",
      });
    } finally {
      setProcessingUser(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.backgroundPattern}></div>
        <div className={styles.loadingWrapper}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Loading platform settings...</div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={styles.container}>
        <div className={styles.backgroundPattern}></div>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorText}>
            Error loading platform settings
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundPattern}></div>

      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>⚙️</span>
            Platform Settings
          </h1>
          <p className={styles.subtitle}>
            Configure your platform's features, limits, and behavior
          </p>
        </div>

        {/* Quick Stats Overview */}
        <div className={styles.statsOverview}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {settings?.siteName || "N/A"}
            </div>
            <div className={styles.statLabel}>Site Name</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {settings?.registrationEnabled ? "Open" : "Closed"}
            </div>
            <div className={styles.statLabel}>Registration</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {settings?.maintenanceMode ? "Maintenance" : "Live"}
            </div>
            <div className={styles.statLabel}>Site Status</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {settings?.maxUploadSizeMB || 0}MB
            </div>
            <div className={styles.statLabel}>Max Upload</div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          <span className={styles.messageIcon}>
            {message.type === "success" ? "✅" : "❌"}
          </span>
          {message.text}
        </div>
      )}

      <div className={styles.settingsContent}>
        <div className={styles.settingsGrid}>
          {/* General Settings Card */}
          <div className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>🌐</div>
              <div className={styles.cardTitleGroup}>
                <h3 className={styles.cardTitle}>General Settings</h3>
                <p className={styles.cardDescription}>
                  Basic platform configuration and site behavior
                </p>
              </div>
            </div>

            <div className={styles.cardContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange("siteName", e.target.value)}
                  className={styles.input}
                  placeholder="Enter your site name"
                />
              </div>

              <div className={styles.switchGroup}>
                <div className={styles.switchContainer}>
                  <label className={styles.switchLabel}>
                    <input
                      type="checkbox"
                      checked={settings.registrationEnabled}
                      onChange={(e) =>
                        handleChange("registrationEnabled", e.target.checked)
                      }
                      className={styles.switchInput}
                      aria-label="Enable User Registration"
                    />
                    <span className={styles.switchSlider}></span>
                    <span className={styles.switchText}>
                      Enable User Registration
                    </span>
                  </label>
                </div>

                <div className={styles.switchContainer}>
                  <label className={styles.switchLabel}>
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) =>
                        handleChange("maintenanceMode", e.target.checked)
                      }
                      className={styles.switchInput}
                      aria-label="Enable Maintenance Mode"
                    />
                    <span className={styles.switchSlider}></span>
                    <span className={styles.switchText}>Maintenance Mode</span>
                  </label>
                </div>
              </div>

              {settings.maintenanceMode && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Maintenance Message</label>
                  <textarea
                    value={settings.maintenanceMessage || ""}
                    onChange={(e) =>
                      handleChange("maintenanceMessage", e.target.value)
                    }
                    className={styles.textarea}
                    placeholder="Enter maintenance message for users"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content Limits Card */}
          <div className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>📏</div>
              <div className={styles.cardTitleGroup}>
                <h3 className={styles.cardTitle}>Content Limits</h3>
                <p className={styles.cardDescription}>
                  Configure upload and content restrictions
                </p>
              </div>
            </div>

            <div className={styles.cardContent}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Max Upload Size (MB)</label>
                  <input
                    type="number"
                    value={settings.maxUploadSizeMB}
                    onChange={(e) =>
                      handleChange("maxUploadSizeMB", parseInt(e.target.value))
                    }
                    className={styles.input}
                    min="1"
                    max="100"
                    aria-label="Maximum upload size in megabytes"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Max Post Length</label>
                  <input
                    type="number"
                    value={settings.maxPostLength}
                    onChange={(e) =>
                      handleChange("maxPostLength", parseInt(e.target.value))
                    }
                    className={styles.input}
                    min="100"
                    max="10000"
                    aria-label="Maximum post length in characters"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Max Images Per Post</label>
                <input
                  type="number"
                  value={settings.maxImagesPerPost}
                  onChange={(e) =>
                    handleChange("maxImagesPerPost", parseInt(e.target.value))
                  }
                  className={styles.input}
                  min="1"
                  max="20"
                  aria-label="Maximum images allowed per post"
                />
              </div>
            </div>
          </div>

          {/* User Pro Management Card */}
          <div className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>👥</div>
              <div className={styles.cardTitleGroup}>
                <h3 className={styles.cardTitle}>Pro User Management</h3>
                <p className={styles.cardDescription}>
                  Manage user pro subscriptions and deletions
                </p>
              </div>
            </div>

            <div className={styles.cardContent}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Search users by name or email"
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className={styles.searchInput}
                />
                <span className={styles.searchIcon}>🔍</span>
              </div>

              <div className={styles.userResults}>
                {userSearchResults.map((user) => (
                  <div key={user.id} className={styles.userCard}>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {user.image ? (
                          <img src={user.image} alt={user.name} />
                        ) : (
                          <span className={styles.avatarPlaceholder}>
                            {user.name?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                        {user.subscription?.tier === "pro" &&
                          user.subscription?.status === "active" && (
                            <div className={styles.userSubscription}>
                              <span
                                className={`${styles.subscriptionBadge} ${styles.active}`}>
                                PRO{" "}
                                {user.subscription.currentPeriodEnd
                                  ? ` until ${new Date(
                                      user.subscription.currentPeriodEnd
                                    ).toLocaleDateString()}`
                                  : ""}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                    <div className={styles.userActions}>
                      <button
                        onClick={() =>
                          handleUserProStatus(
                            user.id,
                            user.subscription?.tier !== "pro" ||
                              user.subscription?.status !== "active"
                          )
                        }
                        className={
                          user.subscription?.tier === "pro" &&
                          user.subscription?.status === "active"
                            ? styles.deleteButton
                            : styles.saveButton
                        }
                        disabled={processingUser === user.id}>
                        {processingUser === user.id
                          ? "Processing..."
                          : user.subscription?.tier === "pro" &&
                            user.subscription?.status === "active"
                          ? "Disable Pro"
                          : "Enable Pro"}
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteUser(user)}
                        disabled={processingUser === user.id}>
                        {processingUser === user.id
                          ? "Deleting..."
                          : "Delete User"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Features Card */}
          <div className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>🎯</div>
              <div className={styles.cardTitleGroup}>
                <h3 className={styles.cardTitle}>Platform Features</h3>
                <p className={styles.cardDescription}>
                  Enable or disable platform features
                </p>
              </div>
            </div>

            <div className={styles.cardContent}>
              <div className={styles.featureGrid}>
                {settings.features &&
                  Object.entries(settings.features).map(([key, value]) => (
                    <div key={key} className={styles.featureItem}>
                      <label className={styles.featureLabel}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            handleChange(`features.${key}`, e.target.checked)
                          }
                          className={styles.featureInput}
                          aria-label={`Enable ${
                            key.charAt(0).toUpperCase() +
                            key.slice(1).replace(/([A-Z])/g, " $1")
                          }`}
                        />
                        <span className={styles.featureSlider}></span>
                        <span className={styles.featureText}>
                          {key.charAt(0).toUpperCase() +
                            key.slice(1).replace(/([A-Z])/g, " $1")}
                        </span>
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className={styles.saveSection}>
          <button
            onClick={handleSave}
            disabled={saving}
            className={styles.saveButton}>
            <span className={styles.saveIcon}>{saving ? "⏳" : "💾"}</span>
            {saving ? "Saving Changes..." : "Save All Changes"}
          </button>
        </div>
      </div>

      {/* Delete User Confirmation Dialog */}
      {showDeleteConfirm && userToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Confirm User Deletion</h2>
            <p className={styles.modalText}>
              Are you sure you want to delete user {userToDelete.name}? This
              action cannot be undone.
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setUserToDelete(null);
                }}>
                Cancel
              </button>
              <button
                className={styles.deleteButton}
                onClick={confirmDelete}
                disabled={!!processingUser}>
                {processingUser ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
