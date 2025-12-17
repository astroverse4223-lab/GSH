const http = require("http");

async function testActiveFilter() {
  try {
    console.log("Testing active announcements filter...");

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/admin/announcements?filter=active",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: "next-auth.session-token=your-session-token-here", // This won't work but let's see what happens
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
          console.log("Active filter results:");
          if (Array.isArray(parsed)) {
            console.log(`Found ${parsed.length} active announcements:`);
            parsed.forEach((ann, index) => {
              console.log(`${index + 1}. ${ann.title} (ID: ${ann.id})`);
            });
          } else {
            console.log("Response:", parsed);
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

testActiveFilter();
