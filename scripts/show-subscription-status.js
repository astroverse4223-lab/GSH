const { PrismaClient } = require("@prisma/client");

async function showSubscriptionTiers() {
  console.log("📋 Subscription Tiers Overview:\n");

  console.log("🆓 FREE TIER:");
  console.log("   • Storage: 1GB");
  console.log("   • Posts per day: 10");
  console.log("   • Groups created: 2");
  console.log("   • Boosts per month: 5\n");

  console.log("💎 PREMIUM TIER:");
  console.log("   • Storage: 10GB");
  console.log("   • Posts per day: 50");
  console.log("   • Groups created: 10");
  console.log("   • Boosts per month: 25\n");

  console.log("🚀 PRO TIER:");
  console.log("   • Storage: UNLIMITED");
  console.log("   • Posts per day: UNLIMITED");
  console.log("   • Groups created: UNLIMITED");
  console.log("   • Boosts per month: UNLIMITED\n");

  console.log("👤 Your Account Status:");

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findFirst({
      where: { email: "countryboya20@gmail.com" },
      include: {
        subscription: true,
      },
    });

    if (user) {
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(
        `   Tier: ${
          user.subscription && user.subscription.tier
            ? user.subscription.tier.toUpperCase()
            : "FREE"
        }`
      );
      console.log(
        `   Status: ${
          user.subscription && user.subscription.status
            ? user.subscription.status
            : "inactive"
        }`
      );
      console.log(
        `   Storage Used: ${Number(user.storageUsed) / (1024 * 1024 * 1024)}GB`
      );

      if (user.subscription && user.subscription.tier === "pro") {
        console.log("   🎉 You have UNLIMITED STORAGE!");
      }
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

showSubscriptionTiers();
