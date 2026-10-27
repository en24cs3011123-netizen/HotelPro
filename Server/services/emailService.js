const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465,
      auth: { user, pass }
    });
  } else {
    // Development / Test stub
    transporter = {
      sendMail: async (options) => {
        console.log(`[EmailService STUB] To: ${options.to} | Subject: ${options.subject}`);
        return { messageId: `mock_${Date.now()}` };
      }
    };
  }
  return transporter;
};

const sendBookingConfirmation = async (booking, recipientEmail) => {
  try {
    const mailer = getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"HotelPro Concierge" <no-reply@hotelpro.com>',
      to: recipientEmail,
      subject: `HotelPro Booking Confirmation — ${booking.bookingReference}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #2b2d42;">
          <h2 style="color: #c5a880;">Reservation Confirmed</h2>
          <p>Dear ${booking.guestDetails.fullName},</p>
          <p>Thank you for choosing HotelPro. Your booking details are confirmed below:</p>
          <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin-top: 15px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Booking Reference:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.bookingReference}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Check-In:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(booking.checkIn).toLocaleDateString()}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Check-Out:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(booking.checkOut).toLocaleDateString()}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.currency} ${booking.totalAmount}</td></tr>
          </table>
          <p style="margin-top: 20px;">We look forward to welcoming you.</p>
        </div>
      `
    };
    return await mailer.sendMail(mailOptions);
  } catch (error) {
    console.error(`[EmailService] Failed to send booking confirmation: ${error.message}`);
    // Do not crash booking flow on email error
    return null;
  }
};

const sendCancellationNotice = async (booking, recipientEmail) => {
  try {
    const mailer = getTransporter();
    return await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"HotelPro Concierge" <no-reply@hotelpro.com>',
      to: recipientEmail,
      subject: `HotelPro Booking Cancellation — ${booking.bookingReference}`,
      text: `Your reservation ${booking.bookingReference} has been cancelled successfully.`
    });
  } catch (error) {
    console.error(`[EmailService] Failed to send cancellation notice: ${error.message}`);
    return null;
  }
};

const sendPasswordResetEmail = async (recipientEmail, resetToken) => {
  try {
    const baseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    return await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"HotelPro Security" <no-reply@hotelpro.com>',
      to: recipientEmail,
      subject: 'HotelPro — Password Reset Request',
      html: `
        <p>You requested a password reset. Please click the link below to set a new password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
      `
    });
  } catch (error) {
    console.error(`[EmailService] Failed to send password reset: ${error.message}`);
    return null;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendCancellationNotice,
  sendPasswordResetEmail
};
