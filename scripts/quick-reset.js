const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function quickReset() {
  try {
    console.log("🧹 Quick database cleanup...");

    // Clear main content that's causing issues
    await prisma.comment.deleteMany();
    console.log("✅ Cleared comments");

    await prisma.post.deleteMany();
    console.log("✅ Cleared posts");

    await prisma.group.deleteMany();
    console.log("✅ Cleared groups");

    console.log("🎉 Quick cleanup completed!");
    console.log("💡 Your live site should work now - try refreshing it.");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

quickReset();
