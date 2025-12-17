"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./reports.module.css";

interface Report {
  id: string;
  type: string;
  category: string;
  description: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  reportedUser?: {
    id: string;
    name: string;
    email: string;
  };
  reportedPost?: {
    id: string;
    content: string;
    user: {
      name: string;
    };
  };
  reportedListing?: {
    id: string;
    title: string;
    seller: {
      name: string;
    };
  };
}

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  // Check if user is admin (you can modify this check)
  const isAdmin = session?.user?.email === "countryboya20@gmail.com";

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !isAdmin) {
      router.push("/");
      return;
    }

    fetchReports();
  }, [session, status, isAdmin, router]);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/admin/reports");
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setReports(
          reports.map((report) =>
            report.id === reportId
              ? { ...report, status: status as any }
              : report
          )
        );
      }
    } catch (error) {
      console.error("Failed to update report:", error);
    }
  };

  const filteredReports = reports.filter(
    (report) => filter === "ALL" || report.status === filter
  );

  if (status === "loading" || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!session || !isAdmin) {
    return <div className={styles.unauthorized}>Unauthorized access</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🛡️ Admin Reports Dashboard</h1>
        <p className={styles.subtitle}>Manage user reports and violations</p>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Status Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.select}
            title="Filter reports by status">
            <option value="ALL">All Reports</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{reports.length}</span>
          <span className={styles.statLabel}>Total Reports</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>
            {reports.filter((r) => r.status === "PENDING").length}
          </span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>
            {reports.filter((r) => r.status === "RESOLVED").length}
          </span>
          <span className={styles.statLabel}>Resolved</span>
        </div>
      </div>

      <div className={styles.reportsList}>
        {filteredReports.length === 0 ? (
          <div className={styles.noReports}>
            No reports found for the selected filter.
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className={styles.reportCard}>
              <div className={styles.reportHeader}>
                <div className={styles.reportInfo}>
                  <span
                    className={`${styles.reportType} ${
                      styles[report.type.toLowerCase()]
                    }`}>
                    {report.type}
                  </span>
                  <span
                    className={`${styles.reportStatus} ${
                      styles[report.status.toLowerCase()]
                    }`}>
                    {report.status}
                  </span>
                  <span className={styles.reportCategory}>
                    {report.category}
                  </span>
                </div>
                <div className={styles.reportDate}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className={styles.reportContent}>
                <div className={styles.reportSection}>
                  <strong>Reporter:</strong> {report.reporter.name} (
                  {report.reporter.email})
                </div>

                {report.reportedUser && (
                  <div className={styles.reportSection}>
                    <strong>Reported User:</strong> {report.reportedUser.name} (
                    {report.reportedUser.email})
                  </div>
                )}

                {report.reportedPost && (
                  <div className={styles.reportSection}>
                    <strong>Reported Post:</strong>
                    <div className={styles.postContent}>
                      "{report.reportedPost.content.substring(0, 100)}..."
                      <br />
                      <small>by {report.reportedPost.user.name}</small>
                    </div>
                  </div>
                )}

                {report.reportedListing && (
                  <div className={styles.reportSection}>
                    <strong>Reported Listing:</strong>
                    <div className={styles.postContent}>
                      "{report.reportedListing.title}"
                      <br />
                      <small>by {report.reportedListing.seller.name}</small>
                    </div>
                  </div>
                )}

                <div className={styles.reportSection}>
                  <strong>Description:</strong>
                  <p className={styles.description}>{report.description}</p>
                </div>
              </div>

              <div className={styles.reportActions}>
                {report.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => updateReportStatus(report.id, "REVIEWED")}
                      className={`${styles.actionBtn} ${styles.reviewBtn}`}>
                      Mark as Reviewed
                    </button>
                    <button
                      onClick={() => updateReportStatus(report.id, "RESOLVED")}
                      className={`${styles.actionBtn} ${styles.resolveBtn}`}>
                      Resolve
                    </button>
                    <button
                      onClick={() => updateReportStatus(report.id, "DISMISSED")}
                      className={`${styles.actionBtn} ${styles.dismissBtn}`}>
                      Dismiss
                    </button>
                  </>
                )}
                {report.status === "REVIEWED" && (
                  <>
                    <button
                      onClick={() => updateReportStatus(report.id, "RESOLVED")}
                      className={`${styles.actionBtn} ${styles.resolveBtn}`}>
                      Resolve
                    </button>
                    <button
                      onClick={() => updateReportStatus(report.id, "DISMISSED")}
                      className={`${styles.actionBtn} ${styles.dismissBtn}`}>
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
