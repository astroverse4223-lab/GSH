const { MongoClient } = require("mongodb");
require("dotenv").config();

async function testConnection() {
  console.log("Testing MongoDB Atlas connection...");

  const uri = process.env.DATABASE_URL;
  console.log("URI:", uri ? "Found" : "Not found");

  if (!uri) {
    console.error("DATABASE_URL not found in environment variables");
    return;
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000, // 10 second timeout
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
  });

  try {
    console.log("Attempting to connect...");
    await client.connect();
    console.log("✅ Successfully connected to MongoDB Atlas!");

    // Test a simple operation
    const db = client.db("gamer_social_hub");
    const collections = await db.listCollections().toArray();
    console.log(
      "Available collections:",
      collections.map((c) => c.name)
    );
  } catch (error) {
    console.error("❌ Connection failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (error.message.includes("Server selection timeout")) {
      console.log("\n🔧 Possible solutions:");
      console.log("1. Check your internet connection");
      console.log(
        "2. Verify MongoDB Atlas IP whitelist includes your current IP"
      );
      console.log(
        "3. Check if your firewall/antivirus is blocking the connection"
      );
      console.log("4. Verify the database credentials are correct");
    }
  } finally {
    await client.close();
  }
}

testConnection();
