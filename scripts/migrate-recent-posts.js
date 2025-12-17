require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migratePosts() {
  try {
    console.log("🔧 Migrating posts to fix groupId issues...\n");

    // Find the most recent posts that should be main feed posts
    // These are likely posts created from the main feed but somehow got groupId values
    const recentPosts = await prisma.post.findMany({
      where: {
        groupId: { not: null },
      },
      include: {
        user: {
          select: { name: true },
        },
        group: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    console.log("📋 Recent posts that might need migration:");
    recentPosts.forEach((post, index) => {
      const preview =
        post.content.substring(0, 50) + (post.content.length > 50 ? "..." : "");
      console.log(`${index + 1}. ${post.user.name}: "${preview}"`);
      console.log(`   Group: ${post.group?.name || "Unknown"}`);
      console.log(`   Created: ${post.createdAt.toLocaleString()}`);
      console.log(`   PostId: ${post.id}\n`);
    });

    // Ask which posts to migrate (for now, let's migrate the most recent 5)
    console.log("🚀 Migrating the 5 most recent posts to main feed...");

    const postsToMigrate = recentPosts.slice(0, 5);

    if (postsToMigrate.length > 0) {
      const result = await prisma.post.updateMany({
        where: {
          id: { in: postsToMigrate.map((p) => p.id) },
        },
        data: {
          groupId: null,
        },
      });

      console.log(`✅ Migrated ${result.count} posts to main feed!`);

      // Show new counts
      const mainFeedCount = await prisma.post.count({
        where: { groupId: null },
      });
      console.log(`📈 Main feed now has ${mainFeedCount} posts`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

migratePosts();
