const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function setAdminRole() {
  try {
    console.log("Setting admin role...");

    // Get the first user (assuming it's you) or find by email
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log("Current users:");
    users.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.name || "No name"} (${user.email}) - Role: ${
          user.role
        }`
      );
    });

    if (users.length === 0) {
      console.log("No users found!");
      return;
    }

    // Set the first user as admin (you can modify this if needed)
    const firstUser = users[0];

    const updatedUser = await prisma.user.update({
      where: {
        id: firstUser.id,
      },
      data: {
        role: "ADMIN",
      },
    });

    console.log(
      `Successfully set ${updatedUser.name || updatedUser.email} as ADMIN!`
    );
  } catch (error) {
    console.error("Error setting admin role:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminRole();
