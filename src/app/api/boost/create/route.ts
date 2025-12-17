import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, BOOST_PRICES } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { canUserBoostPost } from "@/lib/subscription";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { type, targetId, duration } = await request.json();

    if (
      !type ||
      !duration ||
      !BOOST_PRICES[type as keyof typeof BOOST_PRICES]
    ) {
      return new NextResponse("Invalid boost parameters", { status: 400 });
    }

    // Check boost permissions and limits
    const boostPermission = await canUserBoostPost(session.user.id);

    // If user has remaining free boosts, create free boost
    if (boostPermission.allowed) {
      const durationHours = parseInt(duration.replace("h", ""));

      // Validate target exists for free boost
      if (type === "POST_BOOST") {
        const post = await prisma.post.findUnique({ where: { id: targetId } });
        if (!post) return new NextResponse("Post not found", { status: 404 });
      } else if (type === "GROUP_BOOST") {
        const group = await prisma.group.findUnique({
          where: { id: targetId },
        });
        if (!group) return new NextResponse("Group not found", { status: 404 });
      }

      const boost = await prisma.boost.create({
        data: {
          userId: session.user.id,
          postId: type === "POST_BOOST" ? targetId : undefined,
          groupId: type === "GROUP_BOOST" ? targetId : undefined,
          type,
          duration: durationHours,
          amount: 0, // Free boost
          status: "active",
          expiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
        },
      });

      return NextResponse.json({
        success: true,
        boost,
        message: `Free boost activated! ${
          boostPermission.remainingBoosts
            ? `${boostPermission.remainingBoosts - 1} remaining this month.`
            : ""
        }`,
      });
    }

    // User has no remaining free boosts, create Stripe payment intent
    const durationHours = parseInt(duration.replace("h", ""));
    const amount =
      BOOST_PRICES[type as keyof typeof BOOST_PRICES][
        duration as keyof (typeof BOOST_PRICES)[keyof typeof BOOST_PRICES]
      ];

    if (!amount) {
      return new NextResponse("Invalid duration", { status: 400 });
    }

    // Validate target exists before creating payment
    if (type === "POST_BOOST") {
      const post = await prisma.post.findUnique({ where: { id: targetId } });
      if (!post) return new NextResponse("Post not found", { status: 404 });
    } else if (type === "GROUP_BOOST") {
      const group = await prisma.group.findUnique({ where: { id: targetId } });
      if (!group) return new NextResponse("Group not found", { status: 404 });
    }

    // Create Stripe payment intent for paid boost
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        userId: session.user.id,
        type,
        targetId: targetId || "",
        duration: durationHours.toString(),
        boostType: "paid_boost",
      },
    });

    return NextResponse.json({
      success: false,
      requiresPayment: true,
      clientSecret: paymentIntent.client_secret,
      amount,
      message: `No free boosts remaining. Purchase boost for $${amount}`,
    });
  } catch (error) {
    console.error("Boost creation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
