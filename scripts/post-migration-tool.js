require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function showPostsForMigration() {
  try {
    console.log("🔍 Finding posts available for migration...\n");

    // Get recent posts from groups that could be moved to main feed
    const groupPosts = await prisma.post.findMany({
      where: {
        groupId: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    console.log(`📊 Found ${groupPosts.length} posts in groups\n`);

    if (groupPosts.length > 0) {
      console.log("Available posts to migrate to main feed:");
      console.log("=====================================");

      groupPosts.forEach((post, index) => {
        const preview =
          post.content.length > 60
            ? post.content.substring(0, 60) + "..."
            : post.content;

        console.log(`${index + 1}. [${post.id}] by ${post.user.name}`);
        console.log(`   Group: "${post.group.name}"`);
        console.log(`   Content: "${preview}"`);
        console.log(
          `   Stats: ${post._count.reactions} reactions, ${post._count.comments} comments`
        );
        console.log(`   Created: ${post.createdAt.toLocaleDateString()}`);
        console.log("   ---");
      });

      console.log(
        "\n💡 To migrate specific posts, edit this script and call migrateSpecificPosts() with post IDs"
      );
      console.log(
        "💡 To migrate recent posts automatically, call migrateRecentPosts()"
      );
    }

    // Also show current main feed post count
    const mainFeedPosts = await prisma.post.count({
      where: { groupId: null },
    });

    console.log(`\n📈 Current main feed posts: ${mainFeedPosts}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function migrateSpecificPosts(postIds) {
  try {
    console.log(`🔄 Migrating specific posts: ${postIds.join(", ")}`);

    // Get post details before migration
    const postsToMigrate = await prisma.post.findMany({
      where: {
        id: { in: postIds },
        groupId: { not: null },
      },
      include: {
        user: { select: { name: true } },
        group: { select: { name: true } },
      },
    });

    if (postsToMigrate.length === 0) {
      console.log("⚠️  No valid group posts found with those IDs");
      return;
    }

    console.log("\nPosts being migrated:");
    postsToMigrate.forEach((post) => {
      console.log(
        `• ${post.user.name}: "${post.content.substring(0, 50)}..." [from "${
          post.group.name
        }"]`
      );
    });

    // Migrate posts
    const result = await prisma.post.updateMany({
      where: {
        id: { in: postIds },
      },
      data: {
        groupId: null,
      },
    });

    console.log(
      `\n✅ Successfully migrated ${result.count} posts to main feed!`
    );
    console.log("These posts will now appear on the main feed at /feed");
  } catch (error) {
    console.error("❌ Error migrating posts:", error.message);
  }
}

async function migrateRecentPosts(count = 5) {
  try {
    console.log(`🔄 Auto-migrating ${count} most recent group posts...`);

    const recentPosts = await prisma.post.findMany({
      where: { groupId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: count,
      select: { id: true },
    });

    if (recentPosts.length > 0) {
      await migrateSpecificPosts(recentPosts.map((p) => p.id));
    } else {
      console.log("⚠️  No group posts found to migrate");
    }
  } catch (error) {
    console.error("❌ Error migrating recent posts:", error.message);
  }
}

// Main execution
async function main() {
  console.log("🚀 Post Migration Tool");
  console.log("====================\n");

  // Show available posts for migration
  await showPostsForMigration();

  console.log("\n🎯 Ready for migration commands:");
  console.log("1. Uncomment migrateRecentPosts(5) to migrate 5 recent posts");
  console.log(
    "2. Uncomment migrateSpecificPosts([...]) with specific post IDs"
  );
  console.log("3. Or modify this script to suit your needs\n");

  // Uncomment one of these to perform migration:
  // await migrateRecentPosts(5);  // Migrate 5 most recent posts
  // await migrateSpecificPosts(['post-id-1', 'post-id-2']);  // Migrate specific posts

  await prisma.$disconnect();
}

main().catch(console.error);
