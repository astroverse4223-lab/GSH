"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import XPDashboard from "@/components/XPDashboard";
import { XPNotificationDemo } from "@/components/XPNotificationDemo";
import styles from "./admin.module.css";

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalReports: number;
  pendingReports: number;
  bannedUsers: number;
  todaySignups: number;
}

interface RecentActivity {
  id: string;
  type: "USER_JOINED" | "POST_CREATED" | "REPORT_FILED" | "USER_BANNED";
  description: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  const isAdmin = session?.user?.email === "countryboya20@gmail.com";

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (!isAdmin) {
      router.push("/");
      return;
    }

    fetchAdminData();
  }, [session, status, isAdmin, router]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/recent-activity"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading admin dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "USER_JOINED":
        return "👤";
      case "POST_CREATED":
        return "📝";
      case "REPORT_FILED":
        return "⚠️";
      case "USER_BANNED":
        return "🔨";
      default:
        return "📋";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Manage your gaming social platform</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <h3>Total Users</h3>
            <p className={styles.statNumber}>{stats?.totalUsers || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📝</div>
          <div className={styles.statContent}>
            <h3>Total Posts</h3>
            <p className={styles.statNumber}>{stats?.totalPosts || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚠️</div>
          <div className={styles.statContent}>
            <h3>Pending Reports</h3>
            <p className={styles.statNumber}>{stats?.pendingReports || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔨</div>
          <div className={styles.statContent}>
            <h3>Banned Users</h3>
            <p className={styles.statNumber}>{stats?.bannedUsers || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✨</div>
          <div className={styles.statContent}>
            <h3>Today's Signups</h3>
            <p className={styles.statNumber}>{stats?.todaySignups || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <h3>Total Reports</h3>
            <p className={styles.statNumber}>{stats?.totalReports || 0}</p>
          </div>
        </div>
      </div>

      {/* Admin Tools */}
      <div className={styles.toolsSection}>
        <h2 className={styles.sectionTitle}>Admin Tools</h2>
        <div className={styles.toolsGrid}>
          <Link href="/admin/users" className={styles.toolCard}>
            <div className={styles.toolIcon}>👥</div>
            <div className={styles.toolContent}>
              <h3>User Management</h3>
              <p>Ban, unban, and manage user accounts</p>
            </div>
          </Link>

          <Link href="/admin/reports" className={styles.toolCard}>
            <div className={styles.toolIcon}>📋</div>
            <div className={styles.toolContent}>
              <h3>Reports Dashboard</h3>
              <p>Review and handle user reports</p>
            </div>
          </Link>

          <Link href="/admin/moderation" className={styles.toolCard}>
            <div className={styles.toolIcon}>📝</div>
            <div className={styles.toolContent}>
              <h3>Content Moderation</h3>
              <p>Moderate posts, comments, and media</p>
            </div>
          </Link>

          <Link href="/admin/analytics" className={styles.toolCard}>
            <div className={styles.toolIcon}>📊</div>
            <div className={styles.toolContent}>
              <h3>Analytics</h3>
              <p>View platform statistics and insights</p>
            </div>
          </Link>

          <Link href="/admin/announcements" className={styles.toolCard}>
            <div className={styles.toolIcon}>📢</div>
            <div className={styles.toolContent}>
              <h3>Announcements</h3>
              <p>Create platform-wide announcements</p>
            </div>
          </Link>

          <Link href="/admin/settings" className={styles.toolCard}>
            <div className={styles.toolIcon}>⚙️</div>
            <div className={styles.toolContent}>
              <h3>Platform Settings</h3>
              <p>Configure site settings and features</p>
            </div>
          </Link>
        </div>
      </div>

      {/* XP System Management */}
      <div className={styles.xpSection}>
        <h2 className={styles.sectionTitle}>XP System Management</h2>
        <div className={styles.xpContainer}>
          <XPDashboard />
        </div>
      </div>

      {/* XP Notification Testing */}
      <div className={styles.xpSection}>
        <h2 className={styles.sectionTitle}>🎮 XP Notification System</h2>
        <div className={styles.xpContainer}>
          <p className={styles.sectionDescription}>
            Test the XP toast notification system and see all available XP
            awards with live notifications.
          </p>
          <XPNotificationDemo />
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.activitySection}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        <div className={styles.activityList}>
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityDescription}>
                    {activity.description}
                  </p>
                  <span className={styles.activityTime}>
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noActivity}>
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
