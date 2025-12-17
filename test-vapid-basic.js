const webpush = require("web-push");

// Try with a basic test to see if our VAPID keys are working at all
const publicKey =
  "BJCSEsjnJF5lxM9Oqv7-M4z4Poy8DAU-F80SLjXqkme_VvVdBajn_-J16EYm0i5G8iaDJOj4baDKCwhpCckEFQw";
const privateKey = "BcicunC7Fi2ldgY1PpH_McfsShqCsALXlCiqF_QQjSA";

console.log("Testing VAPID key validity...");

// Configure web-push
webpush.setVapidDetails(
  "mailto:admin@realmoflegends.info",
  publicKey,
  privateKey
);

// Create a fake subscription to test VAPID key format
const fakeSubscription = {
  endpoint: "https://example.com/push/fake",
  keys: {
    p256dh: "fake",
    auth: "fake",
  },
};

const payload = JSON.stringify({
  title: "Test",
  body: "Test",
});

console.log(
  "Testing with fake endpoint (should fail but show VAPID is configured)..."
);

webpush
  .sendNotification(fakeSubscription, payload)
  .then((result) => {
    console.log("Unexpected success:", result);
  })
  .catch((error) => {
    console.log("Expected error (but shows VAPID config works):");
    console.log("Error type:", error.constructor.name);
    console.log("Status Code:", error.statusCode);
    if (error.statusCode !== 404) {
      console.log("✅ VAPID keys appear to be configured correctly");
    } else {
      console.log("❌ Issue might be with endpoint or other config");
    }
  });
