const { PrismaClient } = require("@prisma/client");

async function updateUserStorage() {
  const prisma = new PrismaClient();

  try {
    // Get the first user (assuming that's your account)
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        storageUsed: true,
        subscription: {
          select: {
            tier: true,
            status: true,
          },
        },
      },
    });

    console.log("Current users:");
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(
        `   Storage Used: ${Number(user.storageUsed) / (1024 * 1024 * 1024)}GB`
      );
      console.log(
        `   Subscription: ${user.subscription?.tier || "free"} (${
          user.subscription?.status || "none"
        })`
      );
      console.log("");
    });

    if (users.length === 0) {
      console.log("No users found in the database.");
      return;
    }

    // Update the first user to have premium subscription
    const userToUpdate = users[0];

    // First, create or update subscription to pro (unlimited storage)
    const subscription = await prisma.subscription.upsert({
      where: { userId: userToUpdate.id },
      update: {
        tier: "pro",
        status: "active",
      },
      create: {
        userId: userToUpdate.id,
        tier: "pro",
        status: "active",
      },
    });

    console.log("✅ User subscription updated successfully!");
    console.log(`Updated user: ${userToUpdate.name} (${userToUpdate.email})`);
    console.log(`New subscription tier: ${subscription.tier}`);
    console.log(`Subscription status: ${subscription.status}`);
    console.log("🎉 You now have unlimited storage!");
  } catch (error) {
    console.error("❌ Error updating user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserStorage();
