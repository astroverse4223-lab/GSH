import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserSubscription,
  getUserLimits,
  getUserPostCountToday,
  getUserStorageUsageGB,
  getUserGroupCount,
  getUserBoostCountThisMonth,
} from "@/lib/subscription";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Get subscription info and limits
    const subscription = await getUserSubscription(userId);
    const limits = await getUserLimits(userId);

    // Get current usage stats
    const [postsToday, storageUsedGB, groupCount, boostsThisMonth] =
      await Promise.all([
        getUserPostCountToday(userId),
        getUserStorageUsageGB(userId),
        getUserGroupCount(userId),
        getUserBoostCountThisMonth(userId),
      ]);

    const usage = {
      postsToday,
      storageUsedGB,
      groupCount,
      boostsThisMonth,
    };

    return NextResponse.json({
      subscription,
      limits,
      usage,
      tier: subscription.tier,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
