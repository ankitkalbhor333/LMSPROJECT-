import 'dotenv/config';
import { sendEmail } from './utils/sendEmail.js';

const email = process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'test@example.com';
console.log('Sending test email to:', email);

try {
  const result = await sendEmail(
    email,
    'Nodemailer SMTP Configuration Test',
    '<p>This is a Nodemailer SMTP configuration test email.</p>'
  );
  console.log('SEND RESULT:', result);
} catch (err) {
  console.error('SEND ERROR:', err);
  process.exit(1);
}
