import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  "mailto:admin@realmoflegends.info",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

console.log("VAPID Configuration:");
console.log("Public Key exists:", !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
console.log("Private Key exists:", !!process.env.VAPID_PRIVATE_KEY);
console.log(
  "Public Key (first 20 chars):",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.substring(0, 20)
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription } = body;

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription provided" },
        { status: 400 }
      );
    }

    // Validate VAPID keys exist
    if (
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      !process.env.VAPID_PRIVATE_KEY
    ) {
      console.error("Missing VAPID keys");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const payload = JSON.stringify({
      title: "🔔 Test Notification",
      body: "Push notifications are working!",
      icon: "/images/icon-192.png",
      badge: "/images/badge-72.png",
      data: {
        url: "/",
        type: "test",
      },
    });

    console.log("Sending test notification to:", subscription.endpoint);
    console.log(
      "VAPID Public Key being used:",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    );

    // Fix FCM endpoint format if needed
    let fixedSubscription = { ...subscription };
    if (subscription.endpoint.includes("fcm.googleapis.com/fcm/send/")) {
      // Transform FCM endpoint from /fcm/send/ to /wp/ format
      const token = subscription.endpoint.split("/fcm/send/")[1];
      fixedSubscription.endpoint = `https://fcm.googleapis.com/wp/${token}`;
      console.log("Fixed FCM endpoint format:", fixedSubscription.endpoint);
    }

    // Retry mechanism for FCM 404 issues
    let result;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        result = await webpush.sendNotification(fixedSubscription, payload);
        console.log("Test notification sent successfully, response:", result);
        break;
      } catch (retryError: any) {
        attempts++;
        if (retryError.statusCode === 404 && attempts < maxAttempts) {
          console.log(
            `FCM 404 error, retrying... (attempt ${attempts}/${maxAttempts})`
          );
          // Wait 2 seconds before retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          throw retryError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Test notification sent successfully!",
      attempts: attempts,
      fcmResponse: result,
    });
  } catch (error: any) {
    console.error("Error sending test notification:", error);

    // Provide more specific error information
    let errorMessage = "Failed to send notification";
    let suggestions = "";

    if (error.statusCode === 410) {
      errorMessage = "Subscription has expired";
      suggestions = "Please unsubscribe and subscribe again.";
    } else if (error.statusCode === 413) {
      errorMessage = "Payload too large";
    } else if (error.statusCode === 400) {
      errorMessage = "Invalid request";
    } else if (error.statusCode === 404) {
      errorMessage = "FCM endpoint not found";
      suggestions =
        "This is a known issue with Chrome's FCM integration. Try using Firefox browser for better web push compatibility, or wait for Chrome to register the subscription properly.";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        suggestions: suggestions,
        details: error.message,
        statusCode: error.statusCode,
        note: "If using Chrome, this 404 error is common with FCM. Try Firefox or wait and retry.",
      },
      {
        status: 500,
      }
    );
  }
}
