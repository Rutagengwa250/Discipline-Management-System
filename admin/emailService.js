// import { Resend } from 'resend';
// import dotenv from 'dotenv';

// dotenv.config();

// const resend = new Resend(process.env.RESEND_API_KEY);

// export const sendOTPEmail = async (email, otp) => {
//   try {
//     await resend.emails.send({  // corrected 'emails' instead of 'email'
//       from: 'onboarding@resend.dev',  // test sender
//       to: 'delivered@resend.dev',     // test recipient provided by Resend
//       subject: 'Your OTP for School Management System',
//       html: `<p>Your OTP is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
//     });

//     console.log('OTP email sent successfully');
//   } catch (error) {
//     console.error('Error sending OTP email:', error);
//     throw error;
//   }
 //};
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for School Management System',
    text: `Your OTP is: ${otp}\nThis OTP is valid for 5 minutes.`,
    html: `<p>Your OTP is: <strong>${otp}</strong></p><p>This OTP is valid for 5 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully');
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};