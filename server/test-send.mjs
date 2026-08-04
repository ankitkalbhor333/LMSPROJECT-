import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { sendEmail } from "./utils/sendEmail.js";
(async () => {
  try {
    const result = await sendEmail(process.env.EMAIL_USER, "SMTP Email Test", "<p>This is a test message from LMS app.</p>");
    console.log("SEND RESULT", result);
  } catch (error) {
    console.error("SEND ERROR", error);
    if (error.response) { console.error("SMTP RESPONSE", error.response); }
    if (error.code) { console.error("SMTP CODE", error.code); }
    if (error.responseCode) { console.error("SMTP RESPONSE CODE", error.responseCode); }
    process.exit(1);
  }
})();
