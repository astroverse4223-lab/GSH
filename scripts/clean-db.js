require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log("🧹 Cleaning orphaned data...");

    // First, let's see what users exist
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });
    console.log(`📊 Found ${users.length} users:`, users);

    // Clean up all data but preserve users
    const deletedFriends = await prisma.friend.deleteMany({});
    console.log(`✅ Deleted ${deletedFriends.count} friend records`);

    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(
      `✅ Deleted ${deletedNotifications.count} notification records`
    );

    const deletedListings = await prisma.marketplaceListing.deleteMany({});
    console.log(
      `✅ Deleted ${deletedListings.count} marketplace listing records`
    );

    const deletedGroups = await prisma.group.deleteMany({});
    console.log(`✅ Deleted ${deletedGroups.count} group records`);

    const deletedComments = await prisma.comment.deleteMany({});
    console.log(`✅ Deleted ${deletedComments.count} comment records`);

    const deletedPosts = await prisma.post.deleteMany({});
    console.log(`✅ Deleted ${deletedPosts.count} post records`);

    // Create a sample post for the first user if any exist
    if (users.length > 0) {
      const samplePost = await prisma.post.create({
        data: {
          userId: users[0].id,
          content:
            "Welcome to our gaming social site! 🎮 This is a sample post to test our monetization features.",
          type: "text",
        },
      });
      console.log(`✅ Created sample post for user: ${users[0].name}`);
    }

    console.log("✨ Database cleanup complete - users preserved!");
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
