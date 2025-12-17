require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function recreateUser() {
  try {
    console.log("🔧 Recreating user account...");

    // Create the user that's in the session
    const user = await prisma.user.create({
      data: {
        id: "68b068cec2052033ac1bbc66",
        name: "Dave420",
        email: "countryboya20@gmail.com",
        image:
          "https://res.cloudinary.com/dry3a7yrv/image/upload/v1756751948/gamer-social-hub/45539142_rqtnu7.jpg",
        bio: "Owner Welcome to the website hope you enjoy",
        bannerImage:
          "https://res.cloudinary.com/dry3a7yrv/image/upload/v1756578009/gamer-social-hub/hacker-in-front-of-a-laptop-with-binary-code-on-the-background-hacker-without-a-face-is-trying-to-steal-cryptocurrency-using-a-computer-ai-generated-free-photo_ou17um.jpg",
        musicUrl:
          "https://open.spotify.com/playlist/6CTo7JqFz1WidcFAxTpqrK?si=d7e5b1845e294cec",
        lastSeen: new Date(),
      },
    });

    console.log(`✅ Created user: ${user.name} (${user.email})`);

    // Create a sample post
    const samplePost = await prisma.post.create({
      data: {
        userId: user.id,
        content:
          "Welcome back! 🎮 Testing our monetization features - try the subscription page!",
      },
    });

    console.log(`✅ Created sample post`);

    console.log("✨ User recreation complete!");
  } catch (error) {
    if (error.code === "P2002") {
      console.log("ℹ️ User already exists, updating instead...");

      const user = await prisma.user.update({
        where: { id: "68b068cec2052033ac1bbc66" },
        data: {
          lastSeen: new Date(),
        },
      });

      console.log(`✅ Updated user: ${user.name}`);
    } else {
      console.error("❌ Error recreating user:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

recreateUser();
