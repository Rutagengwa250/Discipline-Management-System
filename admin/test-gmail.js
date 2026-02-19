// test-gmail.js
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('🔍 Testing Gmail Configuration:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set (length: ' + process.env.EMAIL_PASSWORD.length + ')' : 'NOT SET');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.log('❌ ERROR: Email credentials are missing from .env file');
  console.log('💡 Fix: Make sure your .env file has:');
  console.log('   EMAIL_USER=your_email@gmail.com');
  console.log('   EMAIL_PASSWORD=your_16_char_app_password');
  process.exit(1);
}

// Check if it's a Gmail address
if (!process.env.EMAIL_USER.includes('@gmail.com')) {
  console.log('⚠️ WARNING: Email is not a Gmail address. Gmail service requires @gmail.com');
}

// Check password format
if (process.env.EMAIL_PASSWORD.includes(' ')) {
  console.log('⚠️ WARNING: Password contains spaces. Removing spaces...');
  process.env.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD.replace(/\s/g, '');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // For testing
  }
});

console.log('\n🔧 Testing Gmail connection...');

transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Gmail connection FAILED:', error.message);
    
    // Common error solutions
    if (error.code === 'EAUTH') {
      console.log('\n🔑 COMMON SOLUTIONS:');
      console.log('1. Make sure you have 2-Step Verification enabled on your Google account');
      console.log('2. Generate an App Password (not your regular password):');
      console.log('   - Go to https://myaccount.google.com/security');
      console.log('   - Enable 2-Step Verification');
      console.log('   - Go to "App passwords"');
      console.log('   - Generate password for "Mail"');
      console.log('   - Use the 16-character password (no spaces)');
      console.log('3. Check if "Less secure app access" is enabled (deprecated but might help)');
    }
    
    // Test with Ethereal as fallback
    console.log('\n🔄 Testing with Ethereal fallback...');
    testEthereal();
  } else {
    console.log('✅ Gmail connection SUCCESSFUL!');
    testSendEmail();
  }
});

function testSendEmail() {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Send to yourself
    subject: 'Test Email from DMS System',
    text: 'This is a test email to verify your setup is working!',
    html: '<h2>Test Email Successful! 🎉</h2><p>Your email configuration is working correctly.</p>'
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('❌ Email sending failed:', error.message);
    } else {
      console.log('✅ Test email SENT successfully!');
      console.log('📧 Message ID:', info.messageId);
      console.log('📧 Response:', info.response);
    }
  });
}

function testEthereal() {
  // Create a test Ethereal account
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.log('❌ Ethereal test failed:', err.message);
      return;
    }

    console.log('✅ Ethereal test account created!');
    console.log('📧 Login: https://ethereal.email/login');
    console.log('📧 Email:', account.user);
    console.log('📧 Password:', account.pass);

    const etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });

    const mailOptions = {
      from: '"DMS System" <dms@example.com>',
      to: account.user, // Send to the test account
      subject: 'Test from Ethereal',
      text: 'Ethereal email is working!'
    };

    etherealTransporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('❌ Ethereal email failed:', error);
      } else {
        console.log('✅ Ethereal email sent!');
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    });
  });
}