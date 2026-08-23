const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendBookingConfirmationEmail({ to, referenceCode, totalAmount, qrCodeDataUrl }) {
  const qrCid = "qrcode-image";

  await transporter.sendMail({
    from: `"Ticket Booking System" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Booking Confirmed — ${referenceCode}`,
    html: `
      <h2>Your booking is confirmed!</h2>
      <p><strong>Reference Code:</strong> ${referenceCode}</p>
      <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
      <p>Show this QR code at the venue entrance:</p>
      <img src="cid:${qrCid}" alt="Booking QR Code" />
    `,
    attachments: [
      {
        filename: "qrcode.png",
        content: qrCodeDataUrl.split(",")[1],
        encoding: "base64",
        cid: qrCid,
      },
    ],
  });
}

module.exports = { sendBookingConfirmationEmail };