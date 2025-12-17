const { MongoClient } = require("mongodb");
require("dotenv").config();

async function debugActiveAnnouncements() {
  const client = new MongoClient(process.env.DATABASE_URL);

  try {
    await client.connect();
    console.log("🔗 Connected to MongoDB");

    const db = client.db();
    const collection = db.collection("Announcement");

    const allAnnouncements = await collection.find({}).toArray();
    const now = new Date();

    console.log(`\n📅 Current time: ${now.toISOString()}\n`);
    console.log(`📋 Found ${allAnnouncements.length} total announcements:\n`);

    allAnnouncements.forEach((ann, index) => {
      const startDate = new Date(ann.startDate);
      const endDate = ann.endDate ? new Date(ann.endDate) : null;

      const isActive = ann.active;
      const startDateCheck = startDate <= now;
      const endDateCheck = !endDate || endDate >= now;
      const shouldBeActiveByFilter = isActive && startDateCheck && endDateCheck;

      console.log(`${index + 1}. "${ann.title}"`);
      console.log(`   - Active field: ${ann.active}`);
      console.log(
        `   - Start Date: ${ann.startDate} (${
          startDateCheck ? "PAST/NOW" : "FUTURE"
        })`
      );
      console.log(
        `   - End Date: ${
          ann.endDate
            ? ann.endDate + " (" + (endDateCheck ? "FUTURE/NOW" : "PAST") + ")"
            : "null (no end)"
        }`
      );
      console.log(
        `   - Should appear in "Active" filter: ${shouldBeActiveByFilter}`
      );
      console.log("");
    });

    // Test the actual filter logic
    const activeFilter = {
      active: true,
      startDate: { $lte: now },
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
    };

    const activeAnnouncements = await collection.find(activeFilter).toArray();
    console.log(
      `🔍 Active filter results: ${activeAnnouncements.length} announcements`
    );
    activeAnnouncements.forEach((ann) => {
      console.log(`   - ${ann.title}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

debugActiveAnnouncements();
