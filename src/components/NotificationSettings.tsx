"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Wifi, WifiOff } from "lucide-react";
import {
  NotificationManager,
  BackgroundSyncManager,
} from "@/lib/notifications-simple";

interface SyncStatus {
  pendingPosts: number;
  pendingMessages: number;
}

export function NotificationSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    pendingPosts: 0,
    pendingMessages: 0,
  });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial states
    const notificationManager = NotificationManager.getInstance();
    const syncManager = BackgroundSyncManager.getInstance();

    setNotificationsEnabled(notificationManager.isEnabled());
    setIsOnline(navigator.onLine);

    // Get sync status
    syncManager.getSyncStatus().then(setSyncStatus);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Update sync status periodically
    const interval = setInterval(() => {
      syncManager.getSyncStatus().then(setSyncStatus);
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleToggleNotifications = async () => {
    const notificationManager = NotificationManager.getInstance();

    if (notificationsEnabled) {
      await notificationManager.disableNotifications();
      setNotificationsEnabled(false);
    } else {
      const enabled = await notificationManager.enableNotifications();
      setNotificationsEnabled(enabled);

      if (enabled) {
        // Show test notification
        await notificationManager.showNotification(
          "Notifications enabled!",
          "You'll now receive updates for messages and posts"
        );
      }
    }
  };

  const handleProcessQueue = async () => {
    const syncManager = BackgroundSyncManager.getInstance();
    await syncManager.processQueue();

    // Update status
    const newStatus = await syncManager.getSyncStatus();
    setSyncStatus(newStatus);
  };

  const totalPending = syncStatus.pendingPosts + syncStatus.pendingMessages;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5" />
        App Settings
      </h3>

      {/* Notifications Toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-blue-400" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="text-white font-medium">Push Notifications</p>
              <p className="text-gray-400 text-sm">
                Get notified about new messages and posts
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleNotifications}
            title={
              notificationsEnabled
                ? "Disable notifications"
                : "Enable notifications"
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notificationsEnabled
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 hover:bg-gray-500"
            }`}>
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notificationsEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <div>
              <p className="text-white font-medium">Connection Status</p>
              <p
                className={`text-sm ${
                  isOnline ? "text-green-400" : "text-red-400"
                }`}>
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        {totalPending > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 font-medium">Pending Sync</p>
                <p className="text-yellow-200/80 text-sm">
                  {syncStatus.pendingPosts} posts, {syncStatus.pendingMessages}{" "}
                  messages waiting to upload
                </p>
              </div>
              {isOnline && (
                <button
                  onClick={handleProcessQueue}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium transition-colors">
                  Sync Now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Offline Mode Info */}
        {!isOnline && (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <p className="text-blue-300 font-medium">Offline Mode</p>
            <p className="text-blue-200/80 text-sm">
              You can still create posts and messages. They'll be uploaded when
              you're back online.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for using notifications in other components
export function useNotifications() {
  const [manager] = useState(() => NotificationManager.getInstance());
  const [syncManager] = useState(() => BackgroundSyncManager.getInstance());

  const showNotification = async (
    title: string,
    body: string,
    url?: string
  ) => {
    await manager.showNotification(title, body, url);
  };

  const queuePost = async (postData: any) => {
    await syncManager.queuePost(postData);
  };

  const queueMessage = async (messageData: any) => {
    await syncManager.queueMessage(messageData);
  };

  return {
    showNotification,
    queuePost,
    queueMessage,
    isEnabled: manager.isEnabled(),
  };
}
