console.log("--- Mailer.ts file was loaded successfully! ---");

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (to: string, otp: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Keke App <onboarding@resend.dev>",
      to: [to],
      subject: "Your Keke App Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Welcome to Keke App!</h2>
          <p>Your verification code is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
          <br>
          <p>Best,</p>
          <p>The Keke App Team</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error:", JSON.stringify(error, null, 2));
      throw new Error("Failed to send OTP email.");
    }

    console.log("OTP Email sent successfully:", data);
  } catch (error) {
    console.error("Critical error in sendOtpEmail function:", error);
    throw error;
  }
};
