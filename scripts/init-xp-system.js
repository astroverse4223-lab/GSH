const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function initializeUserXP() {
  try {
    console.log("Initializing XP fields for existing users...");

    // Find all users without XP or level fields
    const users = await prisma.user.findMany({
      where: {
        OR: [{ xp: undefined }, { level: undefined }],
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    console.log(`Found ${users.length} users to update`);

    // Update each user with default XP and level
    for (const user of users) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            xp: 0,
            level: 1,
          },
        });
        console.log(`Updated user ${user.id}`);
      } catch (error) {
        console.error(`Error updating user ${user.id}:`, error);
      }
    }

    console.log("XP initialization complete!");
  } catch (error) {
    console.error("Error initializing XP:", error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeUserXP();
