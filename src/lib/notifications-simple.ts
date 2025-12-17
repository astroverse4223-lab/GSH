// Simplified push notification and background sync utilities
export class NotificationManager {
  private static instance: NotificationManager;

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("Notifications not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  // Show local notification
  async showNotification(
    title: string,
    body: string,
    url?: string
  ): Promise<void> {
    if (await this.requestPermission()) {
      new Notification(title, {
        body,
        icon: "/images/icon-192.png",
        badge: "/images/badge-72.png",
        data: { url: url || "/" },
      });
    }
  }

  // Subscribe to push notifications (basic version)
  async enableNotifications(): Promise<boolean> {
    const hasPermission = await this.requestPermission();
    if (hasPermission) {
      localStorage.setItem("notifications-enabled", "true");
      return true;
    }
    return false;
  }

  // Disable notifications
  async disableNotifications(): Promise<void> {
    localStorage.setItem("notifications-enabled", "false");
  }

  // Check if notifications are enabled
  isEnabled(): boolean {
    return localStorage.getItem("notifications-enabled") === "true";
  }
}

// Background sync utilities
export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager;

  public static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager();
    }
    return BackgroundSyncManager.instance;
  }

  // Queue post for when online
  async queuePost(postData: any): Promise<void> {
    try {
      // Try immediate upload first
      if (navigator.onLine) {
        await this.uploadPostImmediately(postData);
        return;
      }

      // Store for later if offline
      await this.storeOfflinePost(postData);

      // Show user feedback
      const notificationManager = NotificationManager.getInstance();
      if (notificationManager.isEnabled()) {
        await notificationManager.showNotification(
          "Post queued",
          "Your post will be uploaded when you're back online"
        );
      }

      console.log("Post queued for when online");
    } catch (error) {
      console.error("Failed to queue post:", error);
    }
  }

  // Queue message for when online
  async queueMessage(messageData: any): Promise<void> {
    try {
      if (navigator.onLine) {
        await this.uploadMessageImmediately(messageData);
        return;
      }

      await this.storeOfflineMessage(messageData);

      const notificationManager = NotificationManager.getInstance();
      if (notificationManager.isEnabled()) {
        await notificationManager.showNotification(
          "Message queued",
          "Your message will be sent when you're back online"
        );
      }

      console.log("Message queued for when online");
    } catch (error) {
      console.error("Failed to queue message:", error);
    }
  }

  // Process queued items when back online
  async processQueue(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      const [posts, messages] = await Promise.all([
        this.getPendingPosts(),
        this.getPendingMessages(),
      ]);

      // Upload pending posts
      for (const post of posts) {
        try {
          await this.uploadPostImmediately(post);
          await this.removePendingPost(post.id);
        } catch (error) {
          console.error("Failed to sync post:", error);
        }
      }

      // Upload pending messages
      for (const message of messages) {
        try {
          await this.uploadMessageImmediately(message);
          await this.removePendingMessage(message.id);
        } catch (error) {
          console.error("Failed to sync message:", error);
        }
      }

      if (posts.length > 0 || messages.length > 0) {
        const notificationManager = NotificationManager.getInstance();
        if (notificationManager.isEnabled()) {
          await notificationManager.showNotification(
            "Sync complete",
            `Uploaded ${posts.length} posts and ${messages.length} messages`
          );
        }
      }
    } catch (error) {
      console.error("Error processing queue:", error);
    }
  }

  // Store post in localStorage (simplified)
  private async storeOfflinePost(postData: any): Promise<void> {
    const posts = JSON.parse(localStorage.getItem("offline-posts") || "[]");
    const postWithId = {
      ...postData,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    posts.push(postWithId);
    localStorage.setItem("offline-posts", JSON.stringify(posts));
  }

  // Store message in localStorage (simplified)
  private async storeOfflineMessage(messageData: any): Promise<void> {
    const messages = JSON.parse(
      localStorage.getItem("offline-messages") || "[]"
    );
    const messageWithId = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    messages.push(messageWithId);
    localStorage.setItem("offline-messages", JSON.stringify(messages));
  }

  // Get pending posts
  private async getPendingPosts(): Promise<any[]> {
    return JSON.parse(localStorage.getItem("offline-posts") || "[]");
  }

  // Get pending messages
  private async getPendingMessages(): Promise<any[]> {
    return JSON.parse(localStorage.getItem("offline-messages") || "[]");
  }

  // Remove synced post
  private async removePendingPost(id: string): Promise<void> {
    const posts = JSON.parse(localStorage.getItem("offline-posts") || "[]");
    const filtered = posts.filter((p: any) => p.id !== id);
    localStorage.setItem("offline-posts", JSON.stringify(filtered));
  }

  // Remove synced message
  private async removePendingMessage(id: string): Promise<void> {
    const messages = JSON.parse(
      localStorage.getItem("offline-messages") || "[]"
    );
    const filtered = messages.filter((m: any) => m.id !== id);
    localStorage.setItem("offline-messages", JSON.stringify(filtered));
  }

  // Upload post immediately
  private async uploadPostImmediately(postData: any): Promise<void> {
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload post: ${response.statusText}`);
    }
  }

  // Upload message immediately
  private async uploadMessageImmediately(messageData: any): Promise<void> {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload message: ${response.statusText}`);
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    pendingPosts: number;
    pendingMessages: number;
  }> {
    const posts = await this.getPendingPosts();
    const messages = await this.getPendingMessages();

    return {
      pendingPosts: posts.length,
      pendingMessages: messages.length,
    };
  }
}

// Initialize when the script loads
if (typeof window !== "undefined") {
  const syncManager = BackgroundSyncManager.getInstance();

  // Process queue when coming back online
  window.addEventListener("online", () => {
    console.log("Back online - processing queue");
    syncManager.processQueue();
  });

  // Check for pending items on load
  window.addEventListener("load", async () => {
    try {
      if (navigator.onLine) {
        await syncManager.processQueue();
      }

      const status = await syncManager.getSyncStatus();
      if (status.pendingPosts > 0 || status.pendingMessages > 0) {
        console.log(
          `Pending items: ${status.pendingPosts} posts, ${status.pendingMessages} messages`
        );
      }
    } catch (error) {
      console.log("Error checking sync status:", error);
    }
  });
}
