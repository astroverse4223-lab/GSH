const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log("🧹 Resetting database to clean state...");

    // Delete all data in order (foreign keys first)
    await prisma.postReaction.deleteMany();
    console.log("✅ Cleared post reactions");

    await prisma.comment.deleteMany();
    console.log("✅ Cleared comments");

    await prisma.post.deleteMany();
    console.log("✅ Cleared posts");

    await prisma.group.deleteMany();
    console.log("✅ Cleared groups");

    await prisma.marketplaceListing.deleteMany();
    console.log("✅ Cleared marketplace listings");

    await prisma.boost.deleteMany();
    console.log("✅ Cleared boosts");

    await prisma.subscription.deleteMany();
    console.log("✅ Cleared subscriptions");

    await prisma.transaction.deleteMany();
    console.log("✅ Cleared transactions");

    await prisma.notification.deleteMany();
    console.log("✅ Cleared notifications");

    await prisma.friendship.deleteMany();
    console.log("✅ Cleared friendships");

    await prisma.followRelation.deleteMany();
    console.log("✅ Cleared follow relations");

    // Keep users - just clean their data
    console.log("✅ Kept user accounts intact");

    console.log("🎉 Database reset completed! Your site should work now.");
    console.log("💡 You can create new posts and groups through the UI.");
  } catch (error) {
    console.error("❌ Error during reset:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
