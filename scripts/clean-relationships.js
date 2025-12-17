const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    console.log("🧹 Cleaning up database relationships...");

    // Find and delete posts that reference non-existent users
    const posts = await prisma.post.findMany({
      include: {
        user: true,
      },
    });

    const postsToDelete = posts.filter((post) => !post.user);

    if (postsToDelete.length > 0) {
      await prisma.post.deleteMany({
        where: {
          id: {
            in: postsToDelete.map((p) => p.id),
          },
        },
      });
      console.log(`✅ Deleted ${postsToDelete.length} posts with null users`);
    }

    // Find and delete groups that reference non-existent owners
    const groups = await prisma.group.findMany({
      include: {
        owner: true,
      },
    });

    const groupsToDelete = groups.filter((group) => !group.owner);

    if (groupsToDelete.length > 0) {
      await prisma.group.deleteMany({
        where: {
          id: {
            in: groupsToDelete.map((g) => g.id),
          },
        },
      });
      console.log(
        `✅ Deleted ${groupsToDelete.length} groups with null owners`
      );
    }

    console.log("🎉 Database cleanup completed!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
