const { PrismaClient } = require("@prisma/client");

async function testConnection() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log("Database connection successful");
    // Try to query users to verify the connection
    const userCount = await prisma.user.count();
    console.log(`Number of users in database: ${userCount}`);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
