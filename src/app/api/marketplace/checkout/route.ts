import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { MARKETPLACE_FEE_RATE } from "@/lib/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, itemTitle, itemDescription, price, sellerId, imageUrl } =
      await req.json();

    if (!itemId || !itemTitle || !price || !sellerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate fees
    const feeAmount = Math.round(price * MARKETPLACE_FEE_RATE); // in cents
    const sellerAmount = price - feeAmount;

    // Create Stripe checkout session for marketplace purchase
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: session.user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: itemTitle,
              description: itemDescription,
              images: imageUrl ? [imageUrl] : undefined,
            },
            unit_amount: price, // price in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "marketplace_purchase",
        itemId,
        buyerId: session.user.id,
        sellerId,
        feeAmount: feeAmount.toString(),
        sellerAmount: sellerAmount.toString(),
      },
      success_url: `${req.nextUrl.origin}/marketplace/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/marketplace?canceled=true`,
      automatic_tax: { enabled: true },
    });

    // Create pending marketplace transaction record
    await prisma.marketplaceTransaction.create({
      data: {
        listingId: itemId,
        buyerId: session.user.id,
        sellerId,
        amount: price / 100, // Convert cents to dollars
        platformFee: feeAmount / 100,
        sellerAmount: sellerAmount / 100,
        status: "pending",
        stripePaymentId: checkoutSession.id,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error("Marketplace checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
