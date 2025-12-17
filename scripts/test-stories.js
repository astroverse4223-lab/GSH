const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testStoriesSetup() {
  try {
    console.log("🎮 Testing Stories Setup...\n");

    // Check if stories collections exist
    console.log("📊 Checking database structure...");

    // Test creating a sample story (you can comment this out after testing)
    const sampleUser = await prisma.user.findFirst();

    if (sampleUser) {
      console.log(`✅ Found user: ${sampleUser.name || sampleUser.email}`);

      // Create a test story
      const testStory = await prisma.story.create({
        data: {
          userId: sampleUser.id,
          content: "🎮 Currently playing Apex Legends!",
          type: "gaming_status",
          gameTitle: "Apex Legends",
          status: "playing",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      console.log("✅ Created test story:", {
        id: testStory.id,
        content: testStory.content,
        user: testStory.user.name || testStory.user.email,
        type: testStory.type,
        gameTitle: testStory.gameTitle,
        expiresAt: testStory.expiresAt,
      });
    } else {
      console.log("⚠️ No users found in database");
    }

    // Check existing stories
    const existingStories = await prisma.story.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      take: 5,
    });

    console.log(`\n📱 Found ${existingStories.length} stories:`);
    existingStories.forEach((story, index) => {
      console.log(
        `  ${index + 1}. ${story.user.name || story.user.email}: "${
          story.content
        }" (${story.type})`
      );
    });

    console.log("\n✅ Stories setup test complete!");
    console.log("\n🚀 You can now:");
    console.log("   - View stories on the feed page");
    console.log("   - Create new stories with text or gaming status");
    console.log("   - Stories will automatically expire after 24 hours");
  } catch (error) {
    console.error("❌ Error testing stories setup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testStoriesSetup();
