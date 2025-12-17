// Test script to check groups API
const fetch = require("node-fetch");

async function testGroupsAPI() {
  try {
    console.log("Testing groups API...");
    const response = await fetch(
      "http://localhost:3000/api/groups?sort=popular&limit=3"
    );

    if (!response.ok) {
      console.error(
        "API Response not OK:",
        response.status,
        response.statusText
      );
      return;
    }

    const data = await response.json();
    console.log("Groups data:", JSON.stringify(data, null, 2));
    console.log("Number of groups:", data?.length || 0);
  } catch (error) {
    console.error("Error testing API:", error);
  }
}

testGroupsAPI();
