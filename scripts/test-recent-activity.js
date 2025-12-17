const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testRecentActivity() {
  try {
    console.log("🔍 Testing Recent Activity Data...\n");

    // Check recent users
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    console.log(`📊 Recent Users (${recentUsers.length}):`);
    recentUsers.forEach((user) => {
      console.log(
        `  - ${
          user.name || user.email
        } joined ${user.createdAt.toLocaleDateString()}`
      );
    });

    // Check recent posts
    const recentPosts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    console.log(`\n📝 Recent Posts (${recentPosts.length}):`);
    recentPosts.forEach((post) => {
      const preview =
        post.content.substring(0, 50) + (post.content.length > 50 ? "..." : "");
      console.log(
        `  - ${
          post.user.name || post.user.email
        }: "${preview}" (${post.createdAt.toLocaleDateString()})`
      );
    });

    // Check for reports table
    try {
      const recentReports = await prisma.report.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          category: true,
          description: true,
          createdAt: true,
          reporter: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      console.log(`\n⚠️ Recent Reports (${recentReports.length}):`);
      recentReports.forEach((report) => {
        const preview =
          report.description.substring(0, 50) +
          (report.description.length > 50 ? "..." : "");
        console.log(
          `  - ${report.reporter.name || report.reporter.email}: ${
            report.category
          } - "${preview}" (${report.createdAt.toLocaleDateString()})`
        );
      });
    } catch (error) {
      console.log("\n⚠️ No reports table found or error accessing it");
    }

    console.log("\n✅ Recent Activity Test Complete!");
  } catch (error) {
    console.error("❌ Error testing recent activity:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testRecentActivity();
