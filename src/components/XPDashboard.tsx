"use client";

import React, { useState, useEffect } from "react";
import XPProgressBar from "./XPProgressBar";
import XPNotification from "./XPNotification";
import { useEnhancedXP } from "@/hooks/useEnhancedXP";
import { ENHANCED_XP_REWARDS } from "@/lib/enhanced-xp-system";
import styles from "./XPDashboard.module.css";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  subscription?: any;
}

export default function XPDashboard() {
  const { progress, awardXP, handleDailyLogin, autoAwardXP, loading } =
    useEnhancedXP();
  const [notification, setNotification] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] =
    useState<string>("DAILY_LOGIN");

  // Admin XP awarding states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adminActivity, setAdminActivity] = useState<string>("DAILY_LOGIN");
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);

  const handleAwardXP = async () => {
    const result = await awardXP(selectedActivity as any);
    if (result) {
      setNotification({
        xpGained: result.xpGained,
        newLevel: result.newLevel,
        leveledUp: result.leveledUp,
        activity: selectedActivity,
      });
    }
  };

  const handleDailyLoginReward = async () => {
    const results = await handleDailyLogin();
    if (results && results.length > 0) {
      const totalXP = results.reduce((sum, r) => sum + r.xpGained, 0);
      setNotification({
        xpGained: totalXP,
        newLevel: results[results.length - 1].newLevel,
        leveledUp: results.some((r) => r.leveledUp),
        activity: "DAILY_LOGIN",
      });
    }
  };

  // Admin functions for user search and XP awarding
  const searchUsers = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const users = await response.json();
        setSearchResults(users);
      } else {
        console.error("Failed to search users");
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const awardXPToUser = async () => {
    if (!selectedUser || !adminActivity) return;

    setIsAwarding(true);
    try {
      const response = await fetch("/api/admin/users/award-xp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          activity: adminActivity,
          amount: customAmount > 0 ? customAmount : undefined,
          reason: reason.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setNotification({
          xpGained: result.xpGained,
          newLevel: result.newLevel,
          leveledUp: result.leveledUp,
          activity: adminActivity,
          targetUser: selectedUser.name,
        });

        // Clear form
        setSelectedUser(null);
        setSearchQuery("");
        setSearchResults([]);
        setReason("");
        setCustomAmount(0);
      } else {
        const error = await response.json();
        alert(`Failed to award XP: ${error.error}`);
      }
    } catch (error) {
      console.error("Error awarding XP:", error);
      alert("Failed to award XP");
    } finally {
      setIsAwarding(false);
    }
  };

  // Search users when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const quickActions = [
    { key: "POST_CREATION", label: "Create Post", icon: "📝" },
    { key: "COMMENT", label: "Add Comment", icon: "💬" },
    { key: "ADD_FRIEND", label: "Add Friend", icon: "👥" },
    { key: "PLAY_GAME", label: "Play Game", icon: "🎮" },
    { key: "STREAM_STARTED", label: "Start Stream", icon: "📺" },
    { key: "JOIN_GROUP", label: "Join Group", icon: "🏘️" },
  ];

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>Loading XP Dashboard...</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2 className={styles.title}>XP Dashboard</h2>
        <p className={styles.subtitle}>Track your progress and earn rewards!</p>
      </div>

      <div className={styles.progressSection}>
        <XPProgressBar showEnhancedInfo={true} />
      </div>

      <div className={styles.actionsSection}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.quickActions}>
          {quickActions.map((action) => (
            <button
              key={action.key}
              className={styles.actionButton}
              onClick={() =>
                autoAwardXP(action.key.toLowerCase().replace(/_/g, "_"))
              }>
              <span className={styles.actionIcon}>{action.icon}</span>
              <span className={styles.actionLabel}>{action.label}</span>
              <span className={styles.actionXP}>
                +
                {
                  ENHANCED_XP_REWARDS[
                    action.key as keyof typeof ENHANCED_XP_REWARDS
                  ]
                }{" "}
                XP
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.specialActions}>
        <h3 className={styles.sectionTitle}>Special Rewards</h3>
        <div className={styles.specialButtons}>
          <button
            className={styles.dailyLoginButton}
            onClick={handleDailyLoginReward}>
            <span className={styles.specialIcon}>🌅</span>
            <div className={styles.specialContent}>
              <div className={styles.specialTitle}>Daily Login</div>
              <div className={styles.specialDescription}>
                Claim your daily XP + streak bonuses
              </div>
            </div>
          </button>

          <button
            className={styles.luckyButton}
            onClick={() => autoAwardXP("reaction_given")}>
            <span className={styles.specialIcon}>🍀</span>
            <div className={styles.specialContent}>
              <div className={styles.specialTitle}>Lucky Interaction</div>
              <div className={styles.specialDescription}>
                Random bonus XP for being active!
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className={styles.testSection}>
        <h3 className={styles.sectionTitle}>Test XP Awards</h3>
        <div className={styles.testControls}>
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            className={styles.activitySelect}
            title="Select XP activity to test"
            aria-label="Select XP activity to test">
            {Object.keys(ENHANCED_XP_REWARDS).map((activity) => (
              <option key={activity} value={activity}>
                {activity.replace(/_/g, " ")} (+
                {
                  ENHANCED_XP_REWARDS[
                    activity as keyof typeof ENHANCED_XP_REWARDS
                  ]
                }{" "}
                XP)
              </option>
            ))}
          </select>
          <button className={styles.testButton} onClick={handleAwardXP}>
            Award XP
          </button>
        </div>
      </div>

      <div className={styles.adminSection}>
        <h3 className={styles.sectionTitle}>Admin: Award XP to Users</h3>

        <div className={styles.userSearch}>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />

          {isSearching && (
            <div className={styles.searchStatus}>Searching...</div>
          )}

          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className={`${styles.userResult} ${
                    selectedUser?.id === user.id ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedUser(user)}>
                  {user.image && (
                    <img
                      src={user.image}
                      alt={user.name}
                      className={styles.userAvatar}
                    />
                  )}
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedUser && (
          <div className={styles.awardForm}>
            <div className={styles.selectedUser}>
              <strong>Selected User:</strong> {selectedUser.name} (
              {selectedUser.email})
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="adminActivity">Activity:</label>
                <select
                  id="adminActivity"
                  value={adminActivity}
                  onChange={(e) => setAdminActivity(e.target.value)}
                  className={styles.activitySelect}>
                  {Object.keys(ENHANCED_XP_REWARDS).map((activity) => (
                    <option key={activity} value={activity}>
                      {activity.replace(/_/g, " ")} (+
                      {
                        ENHANCED_XP_REWARDS[
                          activity as keyof typeof ENHANCED_XP_REWARDS
                        ]
                      }{" "}
                      XP)
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="customAmount">Custom Amount (optional):</label>
                <input
                  id="customAmount"
                  type="number"
                  min="0"
                  value={customAmount}
                  onChange={(e) =>
                    setCustomAmount(parseInt(e.target.value) || 0)
                  }
                  className={styles.numberInput}
                  placeholder="Leave 0 for default"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="reason">Reason (optional):</label>
              <input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={styles.textInput}
                placeholder="Admin bonus, manual adjustment, etc."
              />
            </div>

            <div className={styles.awardActions}>
              <button
                className={styles.awardButton}
                onClick={awardXPToUser}
                disabled={isAwarding}>
                {isAwarding ? "Awarding..." : "Award XP"}
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setSelectedUser(null);
                  setSearchQuery("");
                  setSearchResults([]);
                  setReason("");
                  setCustomAmount(0);
                }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {progress && (
        <div className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>Your Stats</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{progress.level}</div>
              <div className={styles.statLabel}>Level</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {progress.xp.toLocaleString()}
              </div>
              <div className={styles.statLabel}>Total XP</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{progress.loginStreak}</div>
              <div className={styles.statLabel}>Login Streak</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {progress.daysSinceJoining}
              </div>
              <div className={styles.statLabel}>Days Active</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{progress.averageXPPerDay}</div>
              <div className={styles.statLabel}>Avg XP/Day</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {progress.progressPercent}%
              </div>
              <div className={styles.statLabel}>Level Progress</div>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <XPNotification
          {...notification}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
