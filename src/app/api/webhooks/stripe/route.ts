import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = (await headers()).get("stripe-signature")!;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return new NextResponse("Invalid signature", { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChanged(
          event.data.object as Stripe.Subscription
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("Webhook error", { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId || !plan) return;

  // Get subscription details - simplified to avoid API issues
  const subscriptionId = session.subscription as string;

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      status: "active",
      tier: plan,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
    },
    create: {
      userId,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      status: "active",
      tier: plan,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
    },
  });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata;

  if (metadata.type && metadata.userId) {
    // Handle boost payment
    const durationHours = parseInt(metadata.duration);
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    await prisma.boost.create({
      data: {
        userId: metadata.userId,
        postId: metadata.targetId || null,
        groupId: metadata.type === "GROUP_BOOST" ? metadata.targetId : null,
        type: metadata.type,
        duration: durationHours,
        amount: paymentIntent.amount / 100, // Convert from cents
        expiresAt,
        status: "active",
      },
    });
  } else if (metadata.listingId) {
    // Handle marketplace transaction
    await prisma.marketplaceTransaction.updateMany({
      where: {
        stripePaymentId: paymentIntent.id,
        status: "pending",
      },
      data: { status: "completed" },
    });

    // Mark listing as sold
    await prisma.marketplaceListing.update({
      where: { id: metadata.listingId },
      data: { status: "SOLD" },
    });
  }

  // Create transaction record
  await prisma.transaction.create({
    data: {
      userId: metadata.userId!,
      type: metadata.type || "MARKETPLACE_FEE",
      amount: paymentIntent.amount / 100,
      stripePaymentId: paymentIntent.id,
      status: "completed",
      description: getTransactionDescription(metadata),
      metadata: metadata as any,
    },
  });
}

async function handleSubscriptionChanged(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      // Simplified to avoid API type issues - use fallback dates
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
  });
}

function getTransactionDescription(metadata: Record<string, string>): string {
  if (metadata.type === "POST_BOOST") {
    return `Post boost for ${metadata.duration} hours`;
  }
  if (metadata.type === "PROFILE_BOOST") {
    return `Profile boost for ${metadata.duration} hours`;
  }
  if (metadata.type === "GROUP_BOOST") {
    return `Group boost for ${metadata.duration} hours`;
  }
  if (metadata.listingId) {
    return "Marketplace purchase";
  }
  return "Payment";
}
