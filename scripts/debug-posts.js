require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugPosts() {
  try {
    console.log("🔍 Debugging posts in database...\n");

    // Show all posts with their groupId status
    const allPostsWithDetails = await prisma.post.findMany({
      select: {
        id: true,
        content: true,
        groupId: true,
        createdAt: true,
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

    console.log("📊 Recent 10 posts:");
    allPostsWithDetails.forEach((post, index) => {
      const preview =
        post.content.substring(0, 50) + (post.content.length > 50 ? "..." : "");
      console.log(
        `${index + 1}. [${post.groupId ? "GROUP" : "MAIN FEED"}] ${
          post.user.name
        }: "${preview}"`
      );
      console.log(`   ID: ${post.id}`);
      console.log(`   GroupId: ${post.groupId || "null"}`);
      if (post.group) {
        console.log(`   Group: ${post.group.name}`);
      }
      console.log(`   Created: ${post.createdAt.toLocaleString()}\n`);
    });

    // Count breakdown
    const totalPosts = await prisma.post.count();
    const mainFeedPosts = await prisma.post.count({ where: { groupId: null } });
    const groupPosts = await prisma.post.count({
      where: { groupId: { not: null } },
    });

    console.log("📈 Summary:");
    console.log(`   Total posts: ${totalPosts}`);
    console.log(`   Main feed posts (groupId: null): ${mainFeedPosts}`);
    console.log(`   Group posts (groupId: not null): ${groupPosts}`);

    if (mainFeedPosts === 0) {
      console.log(
        "\n⚠️  No main feed posts found! This explains why the feed is empty."
      );
      console.log(
        "💡 All posts have groupId values, so they only appear in groups."
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugPosts();
