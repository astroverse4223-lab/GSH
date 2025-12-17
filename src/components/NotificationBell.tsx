"use client";

import { useState, useEffect } from "react";
import { BiBell } from "react-icons/bi";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Notification {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  read: boolean;
  link?: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Mark notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    setIsMarking(true);
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds }),
      });
      await fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    } finally {
      setIsMarking(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id]);
    }
    if (notification.link) {
      router.push(notification.link);
    }
    setIsOpen(false);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000; // difference in seconds

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return date.toLocaleDateString();
  };

  // Fetch notifications on mount and setup polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full dark:text-gray-300 dark:hover:bg-gray-700">
        <BiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
          {unreadCount > 0 && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {unreadCount} unread{" "}
                {unreadCount === 1 ? "notification" : "notifications"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                disabled={isMarking}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed">
                {isMarking ? "Marking..." : "Mark all as read"}
              </button>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {notifications.filter((n) => !n.read).length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No unread notifications
              </div>
            ) : (
              notifications
                .filter((n) => !n.read)
                .map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                      !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {notification.sender.image ? (
                          <Image
                            src={notification.sender.image}
                            alt={notification.sender.name || "User"}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                              {(notification.sender.name ||
                                "U")[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatTimestamp(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
