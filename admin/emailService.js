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
 //};// emailService.js - Add more detailed logging
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('Email service loading...');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready to send messages');
  }
});

export const sendOTPEmail = async (email, otp) => {
  console.log(`Attempting to send OTP ${otp} to ${email} from ${process.env.EMAIL_USER}`);
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for School Management System',
    text: `Your OTP is: ${otp}\nThis OTP is valid for 5 minutes.`,
    html: `<p>Your OTP is: <strong>${otp}</strong></p><p>This OTP is valid for 5 minutes.</p>`,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', email);
    console.log('Message ID:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};