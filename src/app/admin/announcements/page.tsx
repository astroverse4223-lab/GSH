"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./announcements.module.css";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "GENERAL" | "MAINTENANCE" | "UPDATE" | "EMERGENCY";
  priority: number;
  startDate: string;
  endDate?: string;
  active: boolean;
  viewCount: number;
  targetAudience: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<Announcement["type"]>("GENERAL");
  const [priority, setPriority] = useState(0);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [targetAudience, setTargetAudience] = useState<string[]>(["ALL"]);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  // Check if user is admin
  const isAdmin = session?.user?.email === "countryboya20@gmail.com";

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !isAdmin) {
      router.push("/");
      return;
    }

    fetchAnnouncements();
  }, [session, status, isAdmin, router, filter]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/announcements?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const announcementData = {
      title,
      content,
      type,
      priority,
      startDate,
      endDate: endDate || undefined,
      targetAudience,
    };

    try {
      const res = await fetch("/api/admin/announcements", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { ...announcementData, id: editingId } : announcementData
        ),
      });

      if (res.ok) {
        const data = await res.json();
        if (editingId) {
          setAnnouncements(
            announcements.map((a) => (a.id === editingId ? data : a))
          );
          setEditingId(null);
        } else {
          setAnnouncements([data, ...announcements]);
        }
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save announcement:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAnnouncements(announcements.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete announcement:", error);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.content);
    setType(announcement.type);
    setPriority(announcement.priority);
    setStartDate(announcement.startDate.split("T")[0]);
    setEndDate(announcement.endDate?.split("T")[0] || "");
    setTargetAudience(announcement.targetAudience);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setType("GENERAL");
    setPriority(0);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setTargetAudience(["ALL"]);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.backgroundPattern}></div>
        <div className={styles.loadingWrapper}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Loading announcements...</div>
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
            <span className={styles.titleIcon}>📢</span>
            Platform Announcements
          </h1>
          <p className={styles.subtitle}>
            Create and manage platform-wide announcements
          </p>
        </div>

        {/* Quick Stats Overview */}
        <div className={styles.statsOverview}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {announcements.filter((a) => a.active).length}
            </div>
            <div className={styles.statLabel}>Active</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {
                announcements.filter(
                  (a) => !a.active && new Date(a.startDate) > new Date()
                ).length
              }
            </div>
            <div className={styles.statLabel}>Scheduled</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {
                announcements.filter(
                  (a) => a.endDate && new Date(a.endDate) < new Date()
                ).length
              }
            </div>
            <div className={styles.statLabel}>Expired</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {announcements.reduce((sum, a) => sum + a.viewCount, 0)}
            </div>
            <div className={styles.statLabel}>Total Views</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className={styles.filterSection}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter announcements">
            <option value="all">All Announcements</option>
            <option value="active">Active Only</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Create/Edit Form Card */}
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>✏️</div>
            <div className={styles.cardTitleGroup}>
              <h3 className={styles.cardTitle}>
                {editingId ? "Edit Announcement" : "Create New Announcement"}
              </h3>
              <p className={styles.cardDescription}>
                {editingId
                  ? "Update announcement details"
                  : "Compose a new platform announcement"}
              </p>
            </div>
          </div>

          <div className={styles.cardContent}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter announcement title"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Type</label>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as Announcement["type"])
                    }
                    className={styles.select}
                    aria-label="Announcement type">
                    <option value="GENERAL">📝 General</option>
                    <option value="MAINTENANCE">🔧 Maintenance</option>
                    <option value="UPDATE">🚀 Update</option>
                    <option value="EMERGENCY">🚨 Emergency</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className={styles.select}
                    aria-label="Announcement priority">
                    <option value={0}>📋 Normal</option>
                    <option value={1}>⚠️ Important</option>
                    <option value={2}>🚨 Critical</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className={styles.input}
                    aria-label="Announcement start date"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={styles.input}
                    aria-label="Announcement end date (optional)"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your announcement content here..."
                  required
                  className={styles.textarea}
                  rows={4}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Target Audience</label>
                <div className={styles.checkboxGroup}>
                  {["ALL", "FREE_USERS", "PRO_USERS"].map((audience) => (
                    <label key={audience} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={targetAudience.includes(audience)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetAudience([...targetAudience, audience]);
                          } else {
                            setTargetAudience(
                              targetAudience.filter((a) => a !== audience)
                            );
                          }
                        }}
                        className={styles.checkboxInput}
                      />
                      <span className={styles.checkboxSlider}></span>
                      <span className={styles.checkboxText}>
                        {audience === "ALL"
                          ? "👥 All Users"
                          : audience === "FREE_USERS"
                          ? "🆓 Free Users"
                          : "💎 Pro Users"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>
                  <span className={styles.buttonIcon}>
                    {editingId ? "✏️" : "➕"}
                  </span>
                  {editingId ? "Update Announcement" : "Create Announcement"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className={styles.cancelButton}>
                    <span className={styles.buttonIcon}>❌</span>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Announcements List Card */}
        <div className={styles.listCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>📋</div>
            <div className={styles.cardTitleGroup}>
              <h3 className={styles.cardTitle}>Announcements</h3>
              <p className={styles.cardDescription}>
                {announcements.length} announcement
                {announcements.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>

          <div className={styles.cardContent}>
            {announcements.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📢</div>
                <div className={styles.emptyText}>No announcements found</div>
                <div className={styles.emptySubtext}>
                  Create your first announcement to get started
                </div>
              </div>
            ) : (
              <div className={styles.announcementsList}>
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`${styles.announcementCard} ${
                      styles[announcement.type.toLowerCase()]
                    } ${announcement.priority > 0 ? styles.priority : ""}`}>
                    <div className={styles.announcementHeader}>
                      <div className={styles.announcementTitle}>
                        <span className={styles.typeIcon}>
                          {announcement.type === "GENERAL"
                            ? "📝"
                            : announcement.type === "MAINTENANCE"
                            ? "🔧"
                            : announcement.type === "UPDATE"
                            ? "🚀"
                            : "🚨"}
                        </span>
                        <h4>{announcement.title}</h4>
                      </div>

                      <div className={styles.announcementTags}>
                        <span className={`${styles.tag} ${styles.typeTag}`}>
                          {announcement.type}
                        </span>
                        {announcement.priority > 0 && (
                          <span
                            className={`${styles.tag} ${styles.priorityTag}`}>
                            {announcement.priority === 2
                              ? "CRITICAL"
                              : "IMPORTANT"}
                          </span>
                        )}
                        <span
                          className={`${styles.tag} ${styles.statusTag} ${
                            announcement.active
                              ? styles.active
                              : styles.inactive
                          }`}>
                          {announcement.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.announcementContent}>
                      <p>{announcement.content}</p>
                    </div>

                    <div className={styles.announcementMeta}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>📅</span>
                        <span>
                          Start:{" "}
                          {new Date(
                            announcement.startDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      {announcement.endDate && (
                        <div className={styles.metaItem}>
                          <span className={styles.metaIcon}>⏰</span>
                          <span>
                            End:{" "}
                            {new Date(
                              announcement.endDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>👁️</span>
                        <span>{announcement.viewCount} views</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>🎯</span>
                        <span>{announcement.targetAudience.join(", ")}</span>
                      </div>
                    </div>

                    <div className={styles.announcementActions}>
                      <button
                        onClick={() => handleEdit(announcement)}
                        className={styles.editButton}>
                        <span className={styles.buttonIcon}>✏️</span>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className={styles.deleteButton}>
                        <span className={styles.buttonIcon}>🗑️</span>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
