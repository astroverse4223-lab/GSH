const webpush = require("web-push");

// Test the VAPID keys directly
const publicKey =
  "BJCSEsjnJF5lxM9Oqv7-M4z4Poy8DAU-F80SLjXqkme_VvVdBajn_-J16EYm0i5G8iaDJOj4baDKCwhpCckEFQw";
const privateKey = "BcicunC7Fi2ldgY1PpH_McfsShqCsALXlCiqF_QQjSA";

console.log("Testing VAPID keys...");

// Configure web-push
webpush.setVapidDetails(
  "mailto:admin@realmoflegends.info",
  publicKey,
  privateKey
);

// Test subscription from your browser with fixed endpoint
let testSubscription = {
  endpoint:
    "https://fcm.googleapis.com/fcm/send/eIeqi5_14Vo:APA91bG3ZJb-xq7xIurzcroIXgs8NXCY2xFfLOZ_PIubushY9mOVcD_tk-i4VxgTlx-Zzw14Aleg467se5Q4odIUL_2nW9P1osW5o_sJ-dHTX_5YupQG_hS2Uu00P7pUKWfC2Mea3sxv",
  expirationTime: null,
  keys: {
    p256dh:
      "BKFX8Iuv6IEpDuRmUhHcyh8t89D_620OkqCEcOz-_Kp3YnfAHJ-FnfvI6iwBebGiALy7XvzSoW7jTH7qEESdgos",
    auth: "6hSnJ5T96aCxjqPgGGehww",
  },
};

// Fix FCM endpoint format
if (testSubscription.endpoint.includes("fcm.googleapis.com/fcm/send/")) {
  const token = testSubscription.endpoint.split("/fcm/send/")[1];
  testSubscription.endpoint = `https://fcm.googleapis.com/wp/${token}`;
  console.log("Fixed endpoint:", testSubscription.endpoint);
}

const payload = JSON.stringify({
  title: "🔔 Direct Test",
  body: "Testing VAPID keys directly!",
  icon: "/images/icon-192.png",
});

console.log("Sending test notification...");

webpush
  .sendNotification(testSubscription, payload)
  .then((result) => {
    console.log("✅ SUCCESS! Notification sent:", result);
  })
  .catch((error) => {
    console.error("❌ ERROR:", error);
    console.error("Status Code:", error.statusCode);
    console.error("Headers:", error.headers);
    console.error("Body:", error.body);
  });
