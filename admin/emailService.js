import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email, otp) => {
  try {
    await resend.emails.send({  // corrected 'emails' instead of 'email'
      from: 'onboarding@resend.dev',  // test sender
      to: 'delivered@resend.dev',     // test recipient provided by Resend
      subject: 'Your OTP for School Management System',
      html: `<p>Your OTP is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
    });

    console.log('OTP email sent successfully');
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};
