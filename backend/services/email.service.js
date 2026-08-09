const nodemailer = require('nodemailer');
const env = require('../config/env.config');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.mailUsername,
    pass: env.mailPassword
  }
});

/**
 * Sends a styled HTML OTP email
 */
exports.sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"Cloud IDE Verification" <${env.mailUsername}>`,
    to: email,
    subject: `🔐 Cloud IDE Verification Code: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">Cloud IDE Verification Code</h2>
        <p style="font-size: 16px; color: #333333;">Hello,</p>
        <p style="font-size: 16px; color: #333333;">Your verification code for Cloud IDE is:</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb; background-color: #eff6ff; padding: 10px 20px; border-radius: 6px; display: inline-block;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #666666;">This code is valid for 5 minutes. If you did not request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999999; text-align: center;">Cloud IDE Platform • Automated Notification</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Service] OTP email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ [Email Service] Failed to send OTP email to ${email}:`, error);
    throw error;
  }
};
