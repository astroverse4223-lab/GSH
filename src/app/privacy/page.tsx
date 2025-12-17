"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GlowCard } from "@/components/ui/GlowCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Toast } from "@/components/ui/Toast";
import styles from "./privacy.module.css";

interface PrivacySettings {
  id: string;
  profileVisibility: string;
  showEmail: boolean;
  showLastSeen: boolean;
  allowFriendRequests: boolean;
  allowMessages: boolean;
  allowGroupInvites: boolean;
  marketplaceNotifications: boolean;
  postNotifications: boolean;
  friendNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
  dataExportRequested: boolean;
  accountDeletionRequested: boolean;
}

interface BlockedUser {
  id: string;
  blocked: {
    id: string;
    name: string;
    image?: string;
  };
  reason?: string;
  createdAt: string;
}

interface Report {
  id: string;
  type: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  reportedUser?: { name: string };
  reportedPost?: { content: string };
  reportedComment?: { content: string };
  reportedListing?: { title: string };
}

export default function PrivacyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  const showToastNotification = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  useEffect(() => {
    if (session?.user) {
      fetchPrivacySettings();
      fetchBlockedUsers();
      fetchReports();

      // Check for account deletion cancellation from email link
      const urlParams = new URLSearchParams(window.location.search);
      const cancelDeletionId = urlParams.get("cancelDeletion");
      if (cancelDeletionId) {
        // Auto-cancel the deletion request
        cancelAccountDeletion();
        // Clean up the URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    }
  }, [session]);

  const fetchPrivacySettings = async () => {
    try {
      const response = await fetch("/api/privacy/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
      showToastNotification("Failed to load privacy settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await fetch("/api/privacy/block");
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data);
      }
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/privacy/report");
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const updateSettings = async (updatedSettings: Partial<PrivacySettings>) => {
    setSaving(true);
    try {
      const response = await fetch("/api/privacy/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });

      if (response.ok) {
        const updated = await response.json();
        setSettings(updated);
        showToastNotification(
          "Privacy settings updated successfully",
          "success"
        );
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      showToastNotification("Failed to update privacy settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      const response = await fetch("/api/privacy/block", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setBlockedUsers((prev) =>
          prev.filter((block) => block.blocked.id !== userId)
        );
        showToastNotification("User unblocked successfully", "success");
      } else {
        throw new Error("Failed to unblock user");
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      showToastNotification("Failed to unblock user", "error");
    }
  };

  const requestDataExport = async () => {
    try {
      const response = await fetch("/api/privacy/export", {
        method: "POST",
      });

      if (response.ok) {
        showToastNotification(
          "Data export requested successfully. You'll receive an email when it's ready.",
          "success"
        );
        if (settings) {
          setSettings({ ...settings, dataExportRequested: true });
        }
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error) {
      console.error("Error requesting data export:", error);
      showToastNotification("Failed to request data export", "error");
    }
  };

  const requestAccountDeletion = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone and your account will be deleted in 30 days."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/privacy/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "User requested deletion" }),
      });

      if (response.ok) {
        showToastNotification(
          "Account deletion requested. Your account will be deleted in 30 days unless you cancel.",
          "warning"
        );
        if (settings) {
          setSettings({ ...settings, accountDeletionRequested: true });
        }
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error) {
      console.error("Error requesting account deletion:", error);
      showToastNotification("Failed to request account deletion", "error");
    }
  };

  const cancelAccountDeletion = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your account deletion? Your account will remain active."
      )
    ) {
      return;
    }

    try {
      // Get the pending deletion request ID
      const requestsResponse = await fetch("/api/privacy/delete-account");
      const requests = await requestsResponse.json();
      const pendingRequest = requests.find((r: any) => r.status === "PENDING");

      if (!pendingRequest) {
        throw new Error("No pending deletion request found");
      }

      const response = await fetch("/api/privacy/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: pendingRequest.id }),
      });

      if (response.ok) {
        showToastNotification(
          "Account deletion cancelled successfully. Your account is safe!",
          "success"
        );
        if (settings) {
          setSettings({ ...settings, accountDeletionRequested: false });
        }
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error) {
      console.error("Error cancelling account deletion:", error);
      showToastNotification("Failed to cancel account deletion", "error");
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading privacy settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Failed to load privacy settings</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.title}>Privacy & Account Settings</h1>
            <p className={styles.subtitle}>
              Manage your privacy, security, and account preferences
            </p>
          </div>
          <button
            className={styles.closeButton}
            onClick={() => router.push("/profile")}
            title="Back to Profile">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "settings" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("settings")}>
          Privacy Settings
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "blocked" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("blocked")}>
          Blocked Users ({blockedUsers.length})
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "reports" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("reports")}>
          My Reports ({reports.length})
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "account" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("account")}>
          Account Management
        </button>
      </div>

      {activeTab === "settings" && (
        <div className={styles.content}>
          <GlowCard className={styles.card}>
            <h2 className={styles.cardTitle}>Profile Visibility</h2>
            <div className={styles.setting}>
              <label className={styles.label}>Profile Visibility</label>
              <select
                value={settings.profileVisibility}
                onChange={(e) =>
                  updateSettings({ profileVisibility: e.target.value })
                }
                className={styles.select}
                disabled={saving}>
                <option value="PUBLIC">Public - Everyone can see</option>
                <option value="FRIENDS">Friends Only</option>
                <option value="PRIVATE">Private - Only you can see</option>
              </select>
            </div>

            <div className={styles.setting}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.showEmail}
                  onChange={(e) =>
                    updateSettings({ showEmail: e.target.checked })
                  }
                  className={styles.checkbox}
                  disabled={saving}
                />
                Show email address on profile
              </label>
            </div>

            <div className={styles.setting}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.showLastSeen}
                  onChange={(e) =>
                    updateSettings({ showLastSeen: e.target.checked })
                  }
                  className={styles.checkbox}
                  disabled={saving}
                />
                Show when I was last seen
              </label>
            </div>
          </GlowCard>

          <GlowCard className={styles.card}>
            <h2 className={styles.cardTitle}>Communication Preferences</h2>
            <div className={styles.setting}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.allowFriendRequests}
                  onChange={(e) =>
                    updateSettings({ allowFriendRequests: e.target.checked })
                  }
                  className={styles.checkbox}
                  disabled={saving}
                />
                Allow friend requests
              </label>
            </div>

            <div className={styles.setting}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.allowMessages}
                  onChange={(e) =>
                    updateSettings({ allowMessages: e.target.checked })
                  }
                  className={styles.checkbox}
                  disabled={saving}
                />
                Allow direct messages
              </label>
            </div>

            <div className={styles.setting}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.allowGroupInvites}
                  onChange={(e) =>
                    updateSettings({ allowGroupInvites: e.target.checked })
                  }
                  className={styles.checkbox}
                  disabled={saving}
                />
                Allow group invitations
              </label>
            </div>
          </GlowCard>

          <GlowCard className={styles.card}>
            <h2 className={styles.cardTitle}>Notification Preferences</h2>
            <div className={styles.setting}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    updateSettings({ emailNotifications: e.target.checked })
                  }
                  className={styles.checkbox}
                  disabled={saving}
                />
                Email notifications
              </label>
            </div>

            <div className={styles.setting}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) =>
                    updateSettings({ pushNotifications: e.target.checked })
                  }
                  className={styles.checkbox}
                  disabled={saving}
                />
                Push notifications
              </label>
            </div>

            <div className={styles.setting}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.postNotifications}
                  onChange={(e) =>
                    updateSettings({ postNotifications: e.target.checked })
                  }
                  className={styles.checkbox}
                  disabled={saving}
                />
                Post notifications
              </label>
            </div>

            <div className={styles.setting}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.friendNotifications}
                  onChange={(e) =>
                    updateSettings({ friendNotifications: e.target.checked })
                  }
                  className={styles.checkbox}
                  disabled={saving}
                />
                Friend notifications
              </label>
            </div>

            <div className={styles.setting}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={settings.marketplaceNotifications}
                  onChange={(e) =>
                    updateSettings({
                      marketplaceNotifications: e.target.checked,
                    })
                  }
                  className={styles.checkbox}
                  disabled={saving}
                />
                Marketplace notifications
              </label>
            </div>
          </GlowCard>
        </div>
      )}

      {activeTab === "blocked" && (
        <div className={styles.content}>
          <GlowCard className={styles.card}>
            <h2 className={styles.cardTitle}>Blocked Users</h2>
            {blockedUsers.length === 0 ? (
              <p className={styles.emptyState}>
                You haven't blocked any users yet.
              </p>
            ) : (
              <div className={styles.blockedList}>
                {blockedUsers.map((block) => (
                  <div key={block.id} className={styles.blockedUser}>
                    <div className={styles.userInfo}>
                      <img
                        src={block.blocked.image || "/default-avatar.png"}
                        alt={block.blocked.name}
                        className={styles.avatar}
                      />
                      <div>
                        <div className={styles.userName}>
                          {block.blocked.name}
                        </div>
                        {block.reason && (
                          <div className={styles.blockReason}>
                            Reason: {block.reason}
                          </div>
                        )}
                        <div className={styles.blockDate}>
                          Blocked on{" "}
                          {new Date(block.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <NeonButton
                      variant="secondary"
                      size="sm"
                      onClick={() => unblockUser(block.blocked.id)}>
                      Unblock
                    </NeonButton>
                  </div>
                ))}
              </div>
            )}
          </GlowCard>
        </div>
      )}

      {activeTab === "reports" && (
        <div className={styles.content}>
          <GlowCard className={styles.card}>
            <h2 className={styles.cardTitle}>My Reports</h2>
            {reports.length === 0 ? (
              <p className={styles.emptyState}>
                You haven't submitted any reports yet.
              </p>
            ) : (
              <div className={styles.reportsList}>
                {reports.map((report) => (
                  <div key={report.id} className={styles.report}>
                    <div className={styles.reportHeader}>
                      <span className={styles.reportType}>{report.type}</span>
                      <span
                        className={`${styles.reportStatus} ${
                          styles[report.status.toLowerCase()]
                        }`}>
                        {report.status}
                      </span>
                    </div>
                    <div className={styles.reportContent}>
                      <div className={styles.reportCategory}>
                        Category: {report.category}
                      </div>
                      <div className={styles.reportDescription}>
                        {report.description}
                      </div>
                      <div className={styles.reportDate}>
                        Reported on{" "}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlowCard>
        </div>
      )}

      {activeTab === "account" && (
        <div className={styles.content}>
          <GlowCard className={styles.card}>
            <h2 className={styles.cardTitle}>Data Export</h2>
            <p className={styles.description}>
              Download a copy of all your data including posts, comments,
              messages, and account information.
            </p>
            <NeonButton
              variant="primary"
              onClick={requestDataExport}
              disabled={settings.dataExportRequested}>
              {settings.dataExportRequested
                ? "Export Requested"
                : "Request Data Export"}
            </NeonButton>
            {settings.dataExportRequested && (
              <p className={styles.note}>
                Your data export has been requested. You'll receive an email
                when it's ready.
              </p>
            )}
          </GlowCard>

          <GlowCard className={`${styles.card} ${styles.dangerCard}`}>
            <h2 className={styles.cardTitle}>Delete Account</h2>
            <p className={styles.description}>
              Permanently delete your account and all associated data. This
              action cannot be undone. Your account will be scheduled for
              deletion in 30 days, giving you time to change your mind.
            </p>
            <NeonButton
              variant="secondary"
              onClick={requestAccountDeletion}
              disabled={settings.accountDeletionRequested}
              className={styles.dangerButton}>
              {settings.accountDeletionRequested
                ? "Deletion Requested"
                : "Delete My Account"}
            </NeonButton>
            {settings.accountDeletionRequested && (
              <div>
                <p className={styles.warningNote}>
                  ⚠️ Your account is scheduled for deletion in 30 days. You can
                  cancel this request at any time.
                </p>
                <NeonButton
                  variant="primary"
                  onClick={cancelAccountDeletion}
                  style={{ marginTop: "15px" }}>
                  Cancel Deletion
                </NeonButton>
              </div>
            )}
          </GlowCard>
        </div>
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
