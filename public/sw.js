// Service Worker for PWA functionality
const CACHE_NAME = "gamer-social-v1";
const urlsToCache = [
  "/",
  "/feed",
  "/messages",
  "/profile",
  "/games/arcade",
  "/groups",
  "/leaderboard",
  "/marketplace",
  "/streams",
  "/manifest.json",
  // Add important images
  "/images/rlg-logo.svg",
  "/images/shieldLogo.png",
  "/images/icon-192.png",
  "/images/badge-72.png",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event - serve from cache when offline, but handle auth properly
self.addEventListener("fetch", (event) => {
  // Completely skip service worker for localhost development
  if (event.request.url.includes("localhost")) {
    return;
  }

  // Skip service worker for authentication routes and API calls
  if (
    event.request.url.includes("/api/auth/") ||
    event.request.url.includes("/auth/") ||
    event.request.url.includes("/_next/") ||
    event.request.method !== "GET"
  ) {
    // Let these requests go directly to the network
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response;
      }

      // Create a new request with proper redirect handling
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest, {
        redirect: "follow",
        credentials: "same-origin",
      }).catch((error) => {
        console.log("Fetch failed, returning offline page:", error);
        // Could return a fallback page here if needed
        throw error;
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "post-sync") {
    event.waitUntil(syncPosts());
  }
  if (event.tag === "message-sync") {
    event.waitUntil(syncMessages());
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/images/icon-192.png",
      badge: "/images/badge-72.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1,
        url: data.url || "/",
      },
      actions: [
        {
          action: "explore",
          title: "Open App",
          icon: "/images/checkmark.png",
        },
        {
          action: "close",
          title: "Close",
          icon: "/images/close.png",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});

// Sync functions
async function syncPosts() {
  try {
    // Get pending posts from IndexedDB
    const pendingPosts = await getPendingPosts();

    for (const post of pendingPosts) {
      try {
        await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(post),
        });

        // Remove from pending queue
        await removePendingPost(post.id);
      } catch (error) {
        console.log("Failed to sync post:", error);
      }
    }
  } catch (error) {
    console.log("Error during post sync:", error);
  }
}

async function syncMessages() {
  try {
    const pendingMessages = await getPendingMessages();

    for (const message of pendingMessages) {
      try {
        await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });

        await removePendingMessage(message.id);
      } catch (error) {
        console.log("Failed to sync message:", error);
      }
    }
  } catch (error) {
    console.log("Error during message sync:", error);
  }
}

// IndexedDB helper functions (simplified)
async function getPendingPosts() {
  // Implementation for getting pending posts from IndexedDB
  return [];
}

async function removePendingPost(id) {
  // Implementation for removing synced post
}

async function getPendingMessages() {
  // Implementation for getting pending messages
  return [];
}

async function removePendingMessage(id) {
  // Implementation for removing synced message
}
