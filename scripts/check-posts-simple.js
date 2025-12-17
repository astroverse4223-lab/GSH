// Simple script to check posts without Prisma issues
const https = require("https");

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        });
      })
      .on("error", reject);
  });
}

async function checkPosts() {
  try {
    console.log("Checking posts via API...");

    // Try to fetch from the main feed API (should show posts with groupId: null)
    const feedPosts = await makeRequest(
      "https://realmoflegends.info/api/posts"
    );

    console.log(
      `Main feed posts (groupId: null): ${
        Array.isArray(feedPosts)
          ? feedPosts.length
          : "Error - " + JSON.stringify(feedPosts)
      }`
    );

    // Check what the feed returns
    if (Array.isArray(feedPosts) && feedPosts.length > 0) {
      console.log("Sample feed posts:");
      feedPosts.slice(0, 3).forEach((post) => {
        console.log(
          `- ${post.user?.name}: "${post.content?.substring(
            0,
            50
          )}..." [groupId: ${post.groupId || "null"}]`
        );
      });
    } else {
      console.log(
        "No posts found in main feed - likely all posts have groupId values"
      );
      console.log(
        "This means all existing posts were created in groups, not on the main feed"
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkPosts();
