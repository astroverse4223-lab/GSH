require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createSamplePost() {
  try {
    const post = await prisma.post.create({
      data: {
        userId: "68b068cec2052033ac1bbc66",
        content:
          "Welcome back! 🎮 Testing our monetization features - try the subscription page and boost buttons!",
      },
    });

    console.log(`✅ Created sample post: ${post.content}`);
  } catch (error) {
    console.error("❌ Error creating post:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSamplePost();
