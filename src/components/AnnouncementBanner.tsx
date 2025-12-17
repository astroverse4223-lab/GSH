"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./AnnouncementBanner.module.css";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "GENERAL" | "MAINTENANCE" | "UPDATE" | "EMERGENCY";
  priority: number;
  startDate: string;
  endDate?: string;
  active: boolean;
  targetAudience: string[];
}

export default function AnnouncementBanner() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<
    string[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchActiveAnnouncements();
    // Load dismissed announcements from localStorage
    const dismissed = localStorage.getItem("dismissedAnnouncements");
    if (dismissed) {
      setDismissedAnnouncements(JSON.parse(dismissed));
    }
  }, []);

  useEffect(() => {
    // Cycle through announcements every 10 seconds
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [announcements.length]);

  const fetchActiveAnnouncements = async () => {
    try {
      const response = await fetch("/api/announcements/active");
      if (response.ok) {
        const data = await response.json();
        // Filter announcements based on user type and current date
        const userType =
          (session?.user as any)?.subscription?.tier === "pro"
            ? "PRO_USERS"
            : "FREE_USERS";

        const filteredAnnouncements = data.filter(
          (announcement: Announcement) => {
            // Check if announcement is active and within date range
            const now = new Date();
            const startDate = new Date(announcement.startDate);
            const endDate = announcement.endDate
              ? new Date(announcement.endDate)
              : null;

            const isInDateRange =
              startDate <= now && (!endDate || endDate >= now);
            const isTargeted =
              announcement.targetAudience.includes("ALL") ||
              announcement.targetAudience.includes(userType);

            return announcement.active && isInDateRange && isTargeted;
          }
        );

        // Sort by priority (higher first) then by start date
        filteredAnnouncements.sort((a: Announcement, b: Announcement) => {
          if (a.priority !== b.priority) return b.priority - a.priority;
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
        });

        setAnnouncements(filteredAnnouncements);
        if (filteredAnnouncements.length > 0) {
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const dismissAnnouncement = (announcementId: string) => {
    const newDismissed = [...dismissedAnnouncements, announcementId];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem(
      "dismissedAnnouncements",
      JSON.stringify(newDismissed)
    );

    // If this was the last visible announcement, hide the banner
    const visibleAnnouncements = announcements.filter(
      (a) => !newDismissed.includes(a.id)
    );
    if (visibleAnnouncements.length === 0) {
      setIsVisible(false);
    } else if (currentIndex >= visibleAnnouncements.length) {
      setCurrentIndex(0);
    }
  };

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedAnnouncements.includes(a.id)
  );

  if (!isVisible || visibleAnnouncements.length === 0) {
    return null;
  }

  const currentAnnouncement =
    visibleAnnouncements[currentIndex % visibleAnnouncements.length];

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case "GENERAL":
        return "📢";
      case "MAINTENANCE":
        return "🔧";
      case "UPDATE":
        return "🚀";
      case "EMERGENCY":
        return "🚨";
      default:
        return "📢";
    }
  };

  const getAnnouncementClass = (type: string, priority: number) => {
    let className = styles.announcement;
    if (priority > 0) className += ` ${styles.priority}`;
    if (priority === 2) className += ` ${styles.critical}`;
    return `${className} ${styles[type.toLowerCase()]}`;
  };

  return (
    <div
      className={getAnnouncementClass(
        currentAnnouncement.type,
        currentAnnouncement.priority
      )}>
      <div className={styles.content}>
        <div className={styles.icon}>
          {getAnnouncementIcon(currentAnnouncement.type)}
        </div>

        <div className={styles.text}>
          <div className={styles.title}>{currentAnnouncement.title}</div>
          <div className={styles.message}>{currentAnnouncement.content}</div>
        </div>

        <div className={styles.meta}>
          <span className={styles.type}>{currentAnnouncement.type}</span>
          {currentAnnouncement.priority > 0 && (
            <span className={styles.priorityBadge}>
              {currentAnnouncement.priority === 2 ? "CRITICAL" : "IMPORTANT"}
            </span>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        {visibleAnnouncements.length > 1 && (
          <div className={styles.indicators}>
            {visibleAnnouncements.map((_, index) => (
              <button
                key={index}
                className={`${styles.indicator} ${
                  index === currentIndex ? styles.active : ""
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Show announcement ${index + 1}`}
              />
            ))}
          </div>
        )}

        <button
          className={styles.dismissButton}
          onClick={() => dismissAnnouncement(currentAnnouncement.id)}
          aria-label="Dismiss announcement"
          title="Dismiss this announcement">
          ✕
        </button>
      </div>
    </div>
  );
}
