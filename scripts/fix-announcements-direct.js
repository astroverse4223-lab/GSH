const { MongoClient } = require("mongodb");
require("dotenv").config();

async function fixAnnouncementData() {
  const client = new MongoClient(process.env.DATABASE_URL);

  try {
    await client.connect();
    console.log("🔗 Connected to MongoDB");

    const db = client.db();
    const collection = db.collection("Announcement");

    // Find all announcements to inspect them
    const allAnnouncements = await collection.find({}).toArray();
    console.log(`Found ${allAnnouncements.length} total announcements`);

    let updatedCount = 0;

    for (const announcement of allAnnouncements) {
      const updates = {};

      // Fix null or missing startDate
      if (!announcement.startDate) {
        updates.startDate = announcement.createdAt || new Date();
        console.log(`Fixing startDate for: ${announcement.title}`);
      }

      // Fix null or missing updatedAt
      if (!announcement.updatedAt) {
        updates.updatedAt = announcement.createdAt || new Date();
        console.log(`Fixing updatedAt for: ${announcement.title}`);
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
        await collection.updateOne(
          { _id: announcement._id },
          { $set: updates }
        );
        console.log(`✅ Updated announcement: ${announcement.title}`);
        updatedCount++;
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} announcements!`);

    // Show final state
    const finalAnnouncements = await collection.find({}).toArray();
    console.log("\n📋 Final announcement states:");
    finalAnnouncements.forEach((ann) => {
      console.log(
        `- ${ann.title}: startDate=${
          ann.startDate ? "SET" : "NULL"
        }, updatedAt=${ann.updatedAt ? "SET" : "NULL"}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

fixAnnouncementData();
