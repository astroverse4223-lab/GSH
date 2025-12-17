import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { MARKETPLACE_FEE_RATE } from "@/lib/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId } = await params;

    // Find the marketplace listing
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        seller: true,
        images: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot purchase your own listing" },
        { status: 400 }
      );
    }

    if (listing.status !== "active") {
      return NextResponse.json(
        { error: "Listing is not available" },
        { status: 400 }
      );
    }

    // Calculate marketplace fees
    const itemPrice = Math.round(listing.price * 100); // Convert to cents
    const feeAmount = Math.round(itemPrice * MARKETPLACE_FEE_RATE);
    const sellerAmount = itemPrice - feeAmount;

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: session.user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listing.title,
              description: listing.description || undefined,
              images: listing.images?.[0]?.url
                ? [listing.images[0].url]
                : undefined,
            },
            unit_amount: itemPrice,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "marketplace_purchase",
        listingId: listing.id,
        buyerId: session.user.id,
        sellerId: listing.sellerId,
        feeAmount: feeAmount.toString(),
        sellerAmount: sellerAmount.toString(),
      },
      success_url: `${req.nextUrl.origin}/marketplace/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/marketplace/${listingId}?canceled=true`,
    });

    // Create pending marketplace transaction
    await prisma.marketplaceTransaction.create({
      data: {
        listingId: listing.id,
        buyerId: session.user.id,
        sellerId: listing.sellerId,
        amount: itemPrice / 100, // Convert back to dollars for storage
        platformFee: feeAmount / 100,
        sellerAmount: sellerAmount / 100,
        status: "pending",
        stripePaymentId: checkoutSession.id,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error("Marketplace purchase error:", error);
    return NextResponse.json(
      { error: "Failed to create purchase session" },
      { status: 500 }
    );
  }
}
