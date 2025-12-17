"use client";

import { useEffect, useState } from "react";
import styles from "./Announcements.module.css";
import { useSession } from "next-auth/react";

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
  createdAt: string;
}

export function Announcements() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<{
    tier: string;
    status: string;
    isActive: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
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

    fetchAnnouncements();
  }, []);

  // Fetch subscription status when component mounts
  useEffect(() => {
    const fetchSubscription = async () => {
      if (session?.user) {
        try {
          const res = await fetch("/api/subscription/status");
          if (res.ok) {
            const data = await res.json();
            setUserSubscription(data.subscription);
          }
        } catch (error) {
          console.error("Failed to fetch subscription status:", error);
        }
      }
    };
    fetchSubscription();
  }, [session]);

  const getTypeIcon = (type: Announcement["type"]) => {
    switch (type) {
      case "EMERGENCY":
        return "🚨";
      case "MAINTENANCE":
        return "🔧";
      case "UPDATE":
        return "📢";
      default:
        return "📌";
    }
  };

  if (loading || announcements.length === 0) {
    return null;
  }

  const isRelevantForUser = (announcement: Announcement) => {
    if (announcement.targetAudience.includes("ALL")) return true;
    if (
      userSubscription?.isActive &&
      announcement.targetAudience.includes("PRO_USERS")
    )
      return true;
    if (
      !userSubscription?.isActive &&
      announcement.targetAudience.includes("FREE_USERS")
    )
      return true;
    return false;
  };

  const filteredAnnouncements = announcements
    .filter(isRelevantForUser)
    .sort((a, b) => {
      // Sort by priority first
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Then by date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (filteredAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className={styles.announcements}>
      {filteredAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className={`${styles.announcement} ${
            styles[announcement.type.toLowerCase()]
          } ${announcement.priority > 0 ? styles.important : ""}`}>
          <div className={styles.icon}>{getTypeIcon(announcement.type)}</div>
          <div className={styles.content}>
            <h3 className={styles.title}>{announcement.title}</h3>
            <p className={styles.message}>{announcement.content}</p>
          </div>
          {announcement.type === "EMERGENCY" && (
            <button
              className={styles.closeButton}
              onClick={(e) => {
                e.currentTarget.parentElement?.remove();
              }}>
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
