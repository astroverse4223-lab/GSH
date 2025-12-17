import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:your-email@example.com", // Replace with your email
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// This is used by your app to send notifications
// For example, when someone receives a new message or friend request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, title, body, url } = await request.json();

    // Get the user's push subscription
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true },
    });

    if (!targetUser?.pushSubscription) {
      return NextResponse.json(
        {
          error: "User has no push subscription",
        },
        { status: 400 }
      );
    }

    try {
      // Parse the subscription
      const subscription = JSON.parse(targetUser.pushSubscription);

      // Create the notification payload
      const payload = JSON.stringify({
        title,
        body,
        icon: "/images/icon-192.png",
        badge: "/images/badge-72.png",
        url: url || "/",
        data: {
          url: url || "/",
          timestamp: Date.now(),
        },
      });

      // Send the push notification
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        await webpush.sendNotification(subscription, payload);
        console.log("✅ Push notification sent successfully");
      } else {
        console.log("⚠️ VAPID keys not configured - notification logged only");
        console.log("Would send notification:", {
          subscription: targetUser.pushSubscription,
          payload: { title, body, url },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Notification sent",
      });
    } catch (pushError) {
      console.error("Error sending push notification:", pushError);
      return NextResponse.json(
        {
          error: "Failed to send push notification",
          details:
            pushError instanceof Error ? pushError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in notification API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
