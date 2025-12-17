"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./analytics.module.css";

interface AnalyticsData {
  userStats: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    bannedUsers: number;
    proUsers: number;
    retentionRate: string;
  };
  contentStats: {
    totalPosts: number;
    newPosts: number;
    totalComments: number;
    newComments: number;
    totalMedia: number;
    contentGrowth: string;
  };
  engagementStats: {
    likes: number;
    shares: number;
    views: number;
    messagesSent: number;
    averageEngagementRate: number;
  };
  moderationStats: {
    totalReports: number;
    resolvedReports: number;
    deletedContent: number;
    bannedUsers: number;
    resolutionRate: number;
  };
  revenueStats: {
    totalSubscriptions: number;
    newSubscriptions: number;
    cancelledSubscriptions: number;
    marketplaceRevenue: number;
    churnRate: number;
  };
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [period, setPeriod] = useState("30days");
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userStats: {
      totalUsers: 0,
      newUsers: 0,
      activeUsers: 0,
      bannedUsers: 0,
      proUsers: 0,
      retentionRate: "0",
    },
    contentStats: {
      totalPosts: 0,
      newPosts: 0,
      totalComments: 0,
      newComments: 0,
      totalMedia: 0,
      contentGrowth: "0",
    },
    engagementStats: {
      likes: 0,
      shares: 0,
      views: 0,
      messagesSent: 0,
      averageEngagementRate: 0,
    },
    moderationStats: {
      totalReports: 0,
      resolvedReports: 0,
      deletedContent: 0,
      bannedUsers: 0,
      resolutionRate: 0,
    },
    revenueStats: {
      totalSubscriptions: 0,
      newSubscriptions: 0,
      cancelledSubscriptions: 0,
      marketplaceRevenue: 0,
      churnRate: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.email === "countryboya20@gmail.com";

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !isAdmin) {
      router.push("/");
      return;
    }

    fetchAnalytics();
  }, [session, status, isAdmin, router, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Loading analytics data...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={styles.container}>
        <div className={styles.errorWrapper}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorText}>Failed to load analytics data.</div>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getGrowthIndicator = (value: number | string, isPercentage = false) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    const isPositive = numValue > 0;
    const isNegative = numValue < 0;

    return (
      <span
        className={`${styles.growthIndicator} ${
          isPositive
            ? styles.positive
            : isNegative
            ? styles.negative
            : styles.neutral
        }`}>
        {isPositive ? "↗" : isNegative ? "↘" : "→"} {Math.abs(numValue)}
        {isPercentage ? "%" : ""}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundPattern}></div>

      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              <span className={styles.titleIcon}>📊</span>
              Platform Analytics
            </h1>
            <p className={styles.subtitle}>
              Real-time insights into your platform's performance
            </p>
          </div>

          <div className={styles.controls}>
            <div className={styles.periodSelector}>
              <label className={styles.periodLabel}>Time Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className={styles.periodSelect}
                aria-label="Select time period">
                <option value="24hours">Last 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <section className={styles.overviewSection}>
        <div className={styles.overviewGrid}>
          <div className={`${styles.overviewCard} ${styles.primary}`}>
            <div className={styles.overviewIcon}>👥</div>
            <div className={styles.overviewContent}>
              <h3>Total Users</h3>
              <div className={styles.overviewValue}>
                {formatNumber(analytics.userStats.totalUsers)}
              </div>
              <div className={styles.overviewChange}>
                +{analytics.userStats.newUsers} new{" "}
                {getGrowthIndicator(analytics.userStats.newUsers)}
              </div>
            </div>
          </div>

          <div className={`${styles.overviewCard} ${styles.success}`}>
            <div className={styles.overviewIcon}>📝</div>
            <div className={styles.overviewContent}>
              <h3>Total Posts</h3>
              <div className={styles.overviewValue}>
                {formatNumber(analytics.contentStats.totalPosts)}
              </div>
              <div className={styles.overviewChange}>
                +{analytics.contentStats.newPosts} new{" "}
                {getGrowthIndicator(analytics.contentStats.newPosts)}
              </div>
            </div>
          </div>

          <div className={`${styles.overviewCard} ${styles.warning}`}>
            <div className={styles.overviewIcon}>💰</div>
            <div className={styles.overviewContent}>
              <h3>Revenue</h3>
              <div className={styles.overviewValue}>
                ${analytics.revenueStats.marketplaceRevenue.toFixed(0)}
              </div>
              <div className={styles.overviewChange}>
                {analytics.revenueStats.totalSubscriptions} subscriptions
              </div>
            </div>
          </div>

          <div className={`${styles.overviewCard} ${styles.info}`}>
            <div className={styles.overviewIcon}>⚡</div>
            <div className={styles.overviewContent}>
              <h3>Engagement</h3>
              <div className={styles.overviewValue}>
                {analytics.engagementStats.averageEngagementRate.toFixed(1)}%
              </div>
              <div className={styles.overviewChange}>
                {formatNumber(analytics.engagementStats.views)} views
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Metrics */}
      <div className={styles.metricsContainer}>
        {/* User Metrics */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>👥</span>
              User Metrics
            </h2>
            <div className={styles.sectionBadge}>Active</div>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3>Total Users</h3>
                <div className={styles.statIcon}>👥</div>
              </div>
              <div className={styles.statValue}>
                {formatNumber(analytics.userStats.totalUsers)}
              </div>
              <div className={styles.statDetails}>
                <span className={styles.statChange}>
                  +{analytics.userStats.newUsers} new users
                </span>
                <div className={styles.statProgress}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3>Active Users</h3>
                <div className={styles.statIcon}>🟢</div>
              </div>
              <div className={styles.statValue}>
                {formatNumber(analytics.userStats.activeUsers)}
              </div>
              <div className={styles.statDetails}>
                <span className={styles.statChange}>
                  {analytics.userStats.retentionRate}% retention
                </span>
                {getGrowthIndicator(
                  parseFloat(analytics.userStats.retentionRate),
                  true
                )}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3>Pro Users</h3>
                <div className={styles.statIcon}>⭐</div>
              </div>
              <div className={styles.statValue}>
                {formatNumber(analytics.userStats.proUsers)}
              </div>
              <div className={styles.statDetails}>
                <span className={styles.statChange}>
                  {(
                    (analytics.userStats.proUsers /
                      analytics.userStats.totalUsers) *
                    100
                  ).toFixed(1)}
                  % of total
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Metrics */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📝</span>
              Content Metrics
            </h2>
            <div className={styles.sectionBadge}>Growing</div>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3>Total Posts</h3>
                <div className={styles.statIcon}>📝</div>
              </div>
              <div className={styles.statValue}>
                {formatNumber(analytics.contentStats.totalPosts)}
              </div>
              <div className={styles.statDetails}>
                <span className={styles.statChange}>
                  +{analytics.contentStats.newPosts} new posts
                </span>
                {getGrowthIndicator(analytics.contentStats.newPosts)}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3>Comments</h3>
                <div className={styles.statIcon}>💬</div>
              </div>
              <div className={styles.statValue}>
                {formatNumber(analytics.contentStats.totalComments)}
              </div>
              <div className={styles.statDetails}>
                <span className={styles.statChange}>
                  +{analytics.contentStats.newComments} new
                </span>
                {getGrowthIndicator(analytics.contentStats.newComments)}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3>Media Files</h3>
                <div className={styles.statIcon}>🖼️</div>
              </div>
              <div className={styles.statValue}>
                {formatNumber(analytics.contentStats.totalMedia)}
              </div>
              <div className={styles.statDetails}>
                <span className={styles.statChange}>
                  {analytics.contentStats.contentGrowth}% growth
                </span>
                {getGrowthIndicator(
                  parseFloat(analytics.contentStats.contentGrowth),
                  true
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Engagement Metrics */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⚡</span>
              Engagement
            </h2>
            <div className={styles.sectionBadge}>Interactive</div>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3>Total Interactions</h3>
                <div className={styles.statIcon}>❤️</div>
              </div>
              <div className={styles.statValue}>
                {formatNumber(
                  analytics.engagementStats.likes +
                    analytics.engagementStats.shares
                )}
              </div>
              <div className={styles.statDetails}>
                <span className={styles.statChange}>
                  {analytics.engagementStats.averageEngagementRate.toFixed(1)}%
                  rate
                </span>
                {getGrowthIndicator(
                  analytics.engagementStats.averageEngagementRate,
                  true
                )}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3>Content Views</h3>
                <div className={styles.statIcon}>👁️</div>
              </div>
              <div className={styles.statValue}>
                {formatNumber(analytics.engagementStats.views)}
              </div>
              <div className={styles.statDetails}>
                <span className={styles.statChange}>Impressions</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <h3>Messages</h3>
                <div className={styles.statIcon}>💌</div>
              </div>
              <div className={styles.statValue}>
                {formatNumber(analytics.engagementStats.messagesSent)}
              </div>
              <div className={styles.statDetails}>
                <span className={styles.statChange}>Sent</span>
              </div>
            </div>
          </div>
        </section>

        {/* Moderation & Revenue Grid */}
        <div className={styles.bottomGrid}>
          {/* Moderation Metrics */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🛡️</span>
                Moderation
              </h2>
              <div className={styles.sectionBadge}>Secure</div>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <h3>Reports</h3>
                  <div className={styles.statIcon}>🚨</div>
                </div>
                <div className={styles.statValue}>
                  {analytics.moderationStats.totalReports}
                </div>
                <div className={styles.statDetails}>
                  <span className={styles.statChange}>
                    {analytics.moderationStats.resolutionRate.toFixed(1)}%
                    resolved
                  </span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <h3>Deleted Content</h3>
                  <div className={styles.statIcon}>🗑️</div>
                </div>
                <div className={styles.statValue}>
                  {analytics.moderationStats.deletedContent}
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <h3>Banned Users</h3>
                  <div className={styles.statIcon}>🚫</div>
                </div>
                <div className={styles.statValue}>
                  {analytics.moderationStats.bannedUsers}
                </div>
              </div>
            </div>
          </section>

          {/* Revenue Metrics */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>💰</span>
                Revenue
              </h2>
              <div className={styles.sectionBadge}>Profitable</div>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <h3>Active Subscriptions</h3>
                  <div className={styles.statIcon}>💳</div>
                </div>
                <div className={styles.statValue}>
                  {analytics.revenueStats.totalSubscriptions}
                </div>
                <div className={styles.statDetails}>
                  <span className={styles.statChange}>
                    +{analytics.revenueStats.newSubscriptions} new
                  </span>
                  {getGrowthIndicator(analytics.revenueStats.newSubscriptions)}
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <h3>Marketplace Revenue</h3>
                  <div className={styles.statIcon}>🏪</div>
                </div>
                <div className={styles.statValue}>
                  ${analytics.revenueStats.marketplaceRevenue.toFixed(0)}
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <h3>Churn Rate</h3>
                  <div className={styles.statIcon}>📉</div>
                </div>
                <div className={styles.statValue}>
                  {analytics.revenueStats.churnRate.toFixed(1)}%
                </div>
                <div className={styles.statDetails}>
                  <span className={styles.statChange}>
                    {analytics.revenueStats.cancelledSubscriptions}{" "}
                    cancellations
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
