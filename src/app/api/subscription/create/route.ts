import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, SUBSCRIPTION_PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    console.log("Starting subscription creation...");

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("No session found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("User session found:", session.user.id);

    const { plan } = await request.json();
    console.log("Requested plan:", plan);

    if (!plan || !SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
      console.log("Invalid plan:", plan);
      console.log("Available plans:", Object.keys(SUBSCRIPTION_PLANS));
      return new NextResponse("Invalid plan", { status: 400 });
    }

    console.log(
      "Plan configuration:",
      SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]
    );

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (!user) {
      console.log("User not found in database");
      return new NextResponse("User not found", { status: 404 });
    }

    console.log(
      "User found, existing customer ID:",
      user.subscription?.stripeCustomerId
    );

    let customerId = user.subscription?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      console.log("Creating new Stripe customer...");
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      console.log("Created customer:", customerId);
    }

    // Create checkout session
    console.log("Creating checkout session...");
    const planConfig =
      SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];
    console.log("Using price ID:", planConfig.priceId);
    console.log(
      "Success URL:",
      `${process.env.NEXTAUTH_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`
    );
    console.log(
      "Cancel URL:",
      `${process.env.NEXTAUTH_URL}/subscription/canceled`
    );

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscription/canceled`,
      metadata: {
        userId: user.id,
        plan: plan,
      },
    });

    console.log("Checkout session created:", checkoutSession.id);
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Subscription error details:", error);
    console.error(
      "Error name:",
      error instanceof Error ? error.name : "Unknown"
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "No message"
    );
    if (error instanceof Error && "type" in error) {
      console.error("Stripe error type:", (error as any).type);
      console.error("Stripe error code:", (error as any).code);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
