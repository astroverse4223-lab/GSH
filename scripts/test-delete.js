const https = require("https");
const http = require("http");

async function testDeleteAPI() {
  try {
    console.log("Testing delete announcement API...");

    // First, let's get the list of announcements to get an ID
    const listOptions = {
      hostname: "localhost",
      port: 3000,
      path: "/api/admin/announcements?filter=all",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(listOptions, (res) => {
      console.log("List Status:", res.statusCode);

      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          console.log("Available announcements:");
          parsed.forEach((ann, index) => {
            console.log(`${index + 1}. ${ann.title} (ID: ${ann.id})`);
          });

          if (parsed.length > 0) {
            console.log("\nTo delete an announcement:");
            console.log("1. Go to http://localhost:3000/admin/announcements");
            console.log("2. Sign in as countryboya20@gmail.com");
            console.log(
              '3. Look for the red "Delete" button on each announcement card'
            );
            console.log("4. Click it and confirm the deletion");
          }
        } catch (e) {
          console.log("Raw response:", data);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Request failed:", error.message);
    });

    req.end();
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testDeleteAPI();
