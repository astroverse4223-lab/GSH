// Simple test script to check push notifications
const webpush = require("web-push");

const vapidKeys = {
  publicKey:
    "BCDKNngZ48X5urC_JnUMPe0PiIw7GJNT3-8-QhXulEPEwpj9rdg2pZK8QdbafJsHw07s-hT0aJOU0LkxN0VzJ4s",
  privateKey: "QWfSrHdPZ7dczgHGrCFKw37IDxBmjZEyv-0wlAxtWnI",
};

webpush.setVapidDetails(
  "mailto:test@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

console.log("VAPID keys configured successfully!");
console.log("Public key:", vapidKeys.publicKey);

// Test subscription format
const testSubscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/test",
  keys: {
    auth: "test-auth-key",
    p256dh: "test-p256dh-key",
  },
};

console.log(
  "Test subscription format:",
  JSON.stringify(testSubscription, null, 2)
);
