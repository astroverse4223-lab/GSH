const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixAnnouncementDates() {
  console.log("🔧 Fixing announcement dates...");

  try {
    // First, get all announcements to inspect them
    const announcements = await prisma.announcement.findMany();
    console.log(`Found ${announcements.length} announcements`);

    let updatedCount = 0;

    for (const announcement of announcements) {
      const updates = {};

      // Fix null or missing startDate
      if (!announcement.startDate) {
        updates.startDate = announcement.createdAt || new Date();
      }

      // Fix missing type
      if (!announcement.type) {
        updates.type = "GENERAL";
      }

      // Fix missing priority
      if (
        announcement.priority === null ||
        announcement.priority === undefined
      ) {
        updates.priority = 0;
      }

      // Fix missing targetAudience
      if (
        !announcement.targetAudience ||
        announcement.targetAudience.length === 0
      ) {
        updates.targetAudience = ["ALL"];
      }

      // Fix missing active status
      if (announcement.active === null || announcement.active === undefined) {
        updates.active = true;
      }

      // Fix missing viewCount
      if (
        announcement.viewCount === null ||
        announcement.viewCount === undefined
      ) {
        updates.viewCount = 0;
      }

      // Apply updates if needed
      if (Object.keys(updates).length > 0) {
        await prisma.announcement.update({
          where: { id: announcement.id },
          data: updates,
        });
        console.log(`✅ Updated announcement: ${announcement.title}`);
        updatedCount++;
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} announcements!`);

    // Verify the fix
    const problematicAnnouncements = await prisma.announcement.findMany({
      where: {
        OR: [{ startDate: null }],
      },
    });

    if (problematicAnnouncements.length === 0) {
      console.log("✅ All announcements now have valid startDate values");
    } else {
      console.log(
        `⚠️  Still found ${problematicAnnouncements.length} announcements with issues`
      );
    }
  } catch (error) {
    console.error("❌ Error fixing announcements:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAnnouncementDates();
