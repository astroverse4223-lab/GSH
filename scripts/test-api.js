const https = require("https");
const http = require("http");

async function testAPI() {
  try {
    console.log("Testing active announcements API...");

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/announcements/active",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      console.log("Status:", res.statusCode);

      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          console.log("Response:", JSON.stringify(parsed, null, 2));
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

testAPI();
