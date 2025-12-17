import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function restoreProSubscription() {
  try {
    // Find your user account (replace with your actual email)
    const user = await prisma.user.findFirst({
      where: {
        // You can replace this with your actual email or another identifier
        email: { contains: "@" }, // This will find the first user with an email
      },
    });

    if (!user) {
      console.error("No user found");
      return;
    }

    console.log("Found user:", user.email);

    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existingSubscription) {
      console.log("Subscription already exists:", existingSubscription);
      return;
    }

    // Create pro subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        tier: "pro",
        status: "active",
        stripeCustomerId: `cus_restored_${user.id}`,
        stripeSubscriptionId: `sub_restored_${user.id}`,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
        createdAt: new Date(),
      },
    });

    console.log("Created pro subscription:", subscription);
    console.log("✅ Pro subscription restored successfully!");
  } catch (error) {
    console.error("Error restoring subscription:", error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreProSubscription();
