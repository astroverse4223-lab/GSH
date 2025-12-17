const { MongoClient } = require("mongodb");
require("dotenv").config();

async function checkAnnouncementData() {
  const client = new MongoClient(process.env.DATABASE_URL);

  try {
    await client.connect();
    console.log("🔗 Connected to MongoDB");

    const db = client.db();
    const collection = db.collection("Announcement");

    const allAnnouncements = await collection.find({}).toArray();
    console.log(`\n📋 Found ${allAnnouncements.length} announcements:\n`);

    const now = new Date();
    console.log(`Current time: ${now.toISOString()}\n`);

    allAnnouncements.forEach((ann, index) => {
      console.log(`${index + 1}. "${ann.title}"`);
      console.log(`   - ID: ${ann._id}`);
      console.log(`   - Active: ${ann.active}`);
      console.log(`   - Type: ${ann.type || "undefined"}`);
      console.log(`   - Priority: ${ann.priority}`);
      console.log(
        `   - Start Date: ${
          ann.startDate ? ann.startDate.toISOString() : "null"
        }`
      );
      console.log(
        `   - End Date: ${ann.endDate ? ann.endDate.toISOString() : "null"}`
      );
      console.log(
        `   - Target Audience: ${JSON.stringify(ann.targetAudience)}`
      );
      console.log(
        `   - Created At: ${
          ann.createdAt ? ann.createdAt.toISOString() : "null"
        }`
      );
      console.log(
        `   - Updated At: ${
          ann.updatedAt ? ann.updatedAt.toISOString() : "null"
        }`
      );

      // Check if it should be active
      const shouldBeActive =
        ann.active &&
        ann.startDate &&
        ann.startDate <= now &&
        (!ann.endDate || ann.endDate >= now);
      console.log(`   - Should be active: ${shouldBeActive}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkAnnouncementData();
