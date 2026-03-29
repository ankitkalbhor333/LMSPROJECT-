const http = require("http");

function testOTP() {
  const data = JSON.stringify({
    name: "Test User",
    email: "test" + Date.now() + "@example.com",
  });

  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/register-email-send-otp",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  };

  const req = http.request(options, (res) => {
    console.log("Status:", res.statusCode);
    
    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });

    res.on("end", () => {
      try {
        const responseData = JSON.parse(body);
        console.log("Response:", JSON.stringify(responseData, null, 2));
      } catch (e) {
        console.log("Raw Response:", body);
      }
    });
  });

  req.on("error", (error) => {
    console.error("Error:", error.message);
  });

  req.write(data);
  req.end();
}

testOTP();
