import { prisma } from "../src/lib/prisma.js";

async function checkGroups() {
  try {
    console.log("Checking groups in database...");

    const groupCount = await prisma.group.count();
    console.log(`Total groups in database: ${groupCount}`);

    if (groupCount > 0) {
      const groups = await prisma.group.findMany({
        include: {
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
        },
        take: 5,
      });

      console.log("Sample groups:");
      groups.forEach((group, index) => {
        console.log(
          `${index + 1}. ${group.name} - ${group._count.members} members`
        );
      });
    } else {
      console.log("❌ No groups found in database!");
      console.log("Creating some sample groups...");

      // Create sample groups
      const sampleGroups = [
        {
          name: "Valorant Competitive",
          description: "Competitive Valorant players looking for ranked games",
          category: "FPS",
          ownerId: "sample-owner-id", // This would need to be a real user ID
        },
        {
          name: "Minecraft Builders",
          description: "Creative builders and redstone engineers",
          category: "Sandbox",
          ownerId: "sample-owner-id",
        },
        {
          name: "League of Legends",
          description: "LoL players for normals and ranked matches",
          category: "MOBA",
          ownerId: "sample-owner-id",
        },
      ];

      // Note: This would fail without real user IDs, but shows the structure
      console.log("Sample group structure:", sampleGroups[0]);
    }
  } catch (error) {
    console.error("Error checking groups:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGroups();
