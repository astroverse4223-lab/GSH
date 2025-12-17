"use client";

import React, { useState, useEffect } from "react";
import styles from "./XPNotification.module.css";

interface XPNotificationProps {
  xpGained: number;
  newLevel?: number;
  leveledUp?: boolean;
  activity?: string;
  targetUser?: string; // For admin awards to other users
  onClose?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export default function XPNotification({
  xpGained,
  newLevel,
  leveledUp = false,
  activity,
  targetUser,
  onClose,
  autoHide = true,
  duration = 3000,
}: XPNotificationProps) {
  const [visible, setVisible] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setAnimate(true), 50);

    if (autoHide) {
      const hideTimer = setTimeout(() => {
        setAnimate(false);
        setTimeout(() => {
          setVisible(false);
          onClose?.();
        }, 300);
      }, duration);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }

    return () => clearTimeout(timer);
  }, [autoHide, duration, onClose]);

  if (!visible) return null;

  const getActivityDisplayName = (activity?: string) => {
    const activityNames: Record<string, string> = {
      DAILY_LOGIN: "Daily Login",
      POST_CREATION: "Creating Post",
      COMMENT: "Adding Comment",
      ADD_FRIEND: "Adding Friend",
      BOOST_POST: "Boosting Post",
      PLAY_GAME: "Playing Game",
      WIN_GAME: "Winning Game",
      STREAM_STARTED: "Starting Stream",
      GROUP_JOINED: "Joining Group",
      POPULAR_POST: "Popular Post",
      VIRAL_POST: "Viral Post",
      DAILY_LOGIN_STREAK_3: "3-Day Streak",
      DAILY_LOGIN_STREAK_7: "7-Day Streak",
      DAILY_LOGIN_STREAK_30: "30-Day Streak",
    };

    return activity
      ? activityNames[activity] || activity.replace(/_/g, " ")
      : "";
  };

  return (
    <div
      className={`${styles.notification} ${animate ? styles.show : ""} ${
        leveledUp ? styles.levelUp : ""
      }`}>
      <div className={styles.content}>
        {leveledUp && newLevel && (
          <div className={styles.levelUpBanner}>
            <div className={styles.levelUpIcon}>🎉</div>
            <div className={styles.levelUpText}>
              <div className={styles.levelUpTitle}>LEVEL UP!</div>
              <div className={styles.levelUpLevel}>Level {newLevel}</div>
            </div>
            <div className={styles.levelUpIcon}>🎉</div>
          </div>
        )}

        <div className={styles.xpGain}>
          <div className={styles.xpIcon}>⚡</div>
          <div className={styles.xpText}>
            <span className={styles.xpAmount}>+{xpGained} XP</span>
            {targetUser && (
              <span className={styles.targetUser}>awarded to {targetUser}</span>
            )}
            {activity && (
              <span className={styles.xpActivity}>
                {getActivityDisplayName(activity)}
              </span>
            )}
          </div>
        </div>

        {!autoHide && (
          <button
            className={styles.closeButton}
            onClick={() => {
              setAnimate(false);
              setTimeout(() => {
                setVisible(false);
                onClose?.();
              }, 300);
            }}
            aria-label="Close notification">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
