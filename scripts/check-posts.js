require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkPosts() {
  try {
    console.log("Checking posts in database...");

    const allPosts = await prisma.post.findMany({
      select: {
        id: true,
        content: true,
        groupId: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    console.log(`Total posts found: ${allPosts.length}`);

    const postsWithoutGroup = allPosts.filter((post) => post.groupId === null);
    const postsWithGroup = allPosts.filter((post) => post.groupId !== null);

    console.log(
      `Posts without group (groupId: null): ${postsWithoutGroup.length}`
    );
    console.log(`Posts with group: ${postsWithGroup.length}`);

    console.log("\nRecent posts:");
    allPosts.forEach((post) => {
      console.log(
        `- ${post.user.name}: "${post.content.substring(0, 50)}..." [groupId: ${
          post.groupId
        }]`
      );
    });
  } catch (error) {
    console.error("Error checking posts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPosts();
