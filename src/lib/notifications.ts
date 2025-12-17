// Push notification and background sync utilities

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>;
  };
}

interface NotificationOptionsWithVibrate extends NotificationOptions {
  vibrate?: number[];
}

interface OfflineItem {
  id: string;
  synced: boolean;
  timestamp: number;
}

interface OfflineItem {
  id: string;
  synced: boolean;
  timestamp: number;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
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

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          this.vapidPublicKey
        ) as BufferSource,
      });

      // Send subscription to server
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      return subscription;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify server
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription),
        });
      }

      return true;
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      return false;
    }
  }

  // Show local notification
  async showNotification(
    title: string,
    body: string,
    url?: string
  ): Promise<void> {
    if (await this.requestPermission()) {
      const registration = await navigator.serviceWorker.ready;

      const options: any = {
        body,
        icon: "/images/icon-192.png",
        badge: "/images/badge-72.png",
        data: { url: url || "/" },
      };

      // Add vibration if supported
      if ("vibrate" in navigator) {
        options.vibrate = [200, 100, 200];
      }

      await registration.showNotification(title, options);
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
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

  // Queue post for background sync
  async queuePost(postData: any): Promise<void> {
    if (
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        // Store in IndexedDB for sync
        await this.storeOfflinePost(postData);

        // Register sync
        const registration = await navigator.serviceWorker.ready;
        await (registration as ServiceWorkerRegistrationWithSync).sync.register(
          "post-sync"
        );

        console.log("Post queued for sync");
      } catch (error) {
        console.error("Failed to queue post:", error);
        // Fallback: try immediate upload
        this.uploadPostImmediately(postData);
      }
    } else {
      // Fallback for browsers without background sync
      await this.uploadPostImmediately(postData);
    }
  }

  // Queue message for background sync
  async queueMessage(messageData: any): Promise<void> {
    if (
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        await this.storeOfflineMessage(messageData);

        const registration = await navigator.serviceWorker.ready;
        await (registration as ServiceWorkerRegistrationWithSync).sync.register(
          "message-sync"
        );

        console.log("Message queued for sync");
      } catch (error) {
        console.error("Failed to queue message:", error);
        this.uploadMessageImmediately(messageData);
      }
    } else {
      await this.uploadMessageImmediately(messageData);
    }
  }

  // Store post in IndexedDB
  private async storeOfflinePost(postData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("GamerSocialDB", 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["posts"], "readwrite");
        const store = transaction.objectStore("posts");

        const postWithId = {
          ...postData,
          id: Date.now().toString(),
          timestamp: Date.now(),
          synced: false,
        };

        store.add(postWithId);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("posts")) {
          db.createObjectStore("posts", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("messages")) {
          db.createObjectStore("messages", { keyPath: "id" });
        }
      };
    });
  }

  // Store message in IndexedDB
  private async storeOfflineMessage(messageData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("GamerSocialDB", 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["messages"], "readwrite");
        const store = transaction.objectStore("messages");

        const messageWithId = {
          ...messageData,
          id: Date.now().toString(),
          timestamp: Date.now(),
          synced: false,
        };

        store.add(messageWithId);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  // Immediate upload fallback
  private async uploadPostImmediately(postData: any): Promise<void> {
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
    } catch (error) {
      console.error("Failed to upload post immediately:", error);
    }
  }

  // Immediate message upload fallback
  private async uploadMessageImmediately(messageData: any): Promise<void> {
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });
    } catch (error) {
      console.error("Failed to upload message immediately:", error);
    }
  }

  // Check sync status
  async getSyncStatus(): Promise<{
    pendingPosts: number;
    pendingMessages: number;
  }> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("GamerSocialDB", 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["posts", "messages"], "readonly");

        let pendingPosts = 0;
        let pendingMessages = 0;

        const postsStore = transaction.objectStore("posts");
        const messagesStore = transaction.objectStore("messages");

        postsStore.getAll().onsuccess = (event) => {
          const target = event.target as IDBRequest;
          const posts = target?.result || [];
          pendingPosts = posts.filter((p: OfflineItem) => !p.synced).length;
        };

        messagesStore.getAll().onsuccess = (event) => {
          const target = event.target as IDBRequest;
          const messages = target?.result || [];
          pendingMessages = messages.filter(
            (m: OfflineItem) => !m.synced
          ).length;
        };

        transaction.oncomplete = () => {
          resolve({ pendingPosts, pendingMessages });
        };
      };
    });
  }
}

// Initialize when the script loads
if (typeof window !== "undefined") {
  // Auto-setup notifications and sync
  window.addEventListener("load", async () => {
    const notificationManager = NotificationManager.getInstance();
    const syncManager = BackgroundSyncManager.getInstance();

    // Check if user wants notifications
    if (localStorage.getItem("notifications-enabled") === "true") {
      await notificationManager.subscribeToPush();
    }

    // Check for pending syncs
    const status = await syncManager.getSyncStatus();
    if (status.pendingPosts > 0 || status.pendingMessages > 0) {
      console.log(
        `Pending syncs: ${status.pendingPosts} posts, ${status.pendingMessages} messages`
      );
    }
  });
}
