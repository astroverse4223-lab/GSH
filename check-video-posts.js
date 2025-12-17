const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkVideoPosts() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        video: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    console.log("Recent video posts:");
    posts.forEach((post) => {
      console.log(`- Post ID: ${post.id}`);
      console.log(`  User: ${post.user.name}`);
      console.log(`  Video URL: ${post.video}`);
      console.log(`  Content: ${post.content.substring(0, 50)}...`);
      console.log(`  Created: ${post.createdAt}`);
      console.log("---");
    });

    if (posts.length === 0) {
      console.log("No video posts found in database");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideoPosts();
