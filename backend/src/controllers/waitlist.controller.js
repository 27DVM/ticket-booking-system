const prisma = require("../prismaClient");
const { sendBookingConfirmationEmail } = require("../utils/mailer");
const nodemailer = require("nodemailer");

const OFFER_DURATION_MS = 5 * 60 * 1000; // 5 minutes to claim an offered seat

// Join the waitlist for a category on a show
const joinWaitlist = async (req, res) => {
  const { showId } = req.params;
  const { categoryId } = req.body;
  const userId = req.user.userId;

  if (!categoryId) {
    return res.status(400).json({ error: "categoryId is required" });
  }

  try {
    const entry = await prisma.waitlist.create({
      data: { userId, showId, categoryId, status: "WAITING" },
    });
    return res.status(201).json({ message: "Added to waitlist", waitlistId: entry.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to join waitlist" });
  }
};

// Called internally when a seat becomes free (from cancellation) to offer it to the next waiter
async function offerSeatToNextInWaitlist(tx, showId, categoryId, seatId) {
  const nextWaiter = await tx.waitlist.findFirst({
    where: { showId, categoryId, status: "WAITING" },
    orderBy: { createdAt: "asc" },
  });

  if (!nextWaiter) {
    return false; // nobody waiting -> caller should mark seat AVAILABLE
  }

  const offerExpiresAt = new Date(Date.now() + OFFER_DURATION_MS);

  await tx.waitlist.update({
    where: { id: nextWaiter.id },
    data: { status: "OFFERED", offeredSeatId: seatId, offerExpiresAt },
  });

  await tx.showSeat.update({
    where: { id: seatId },
    data: {
      status: "HELD",
      heldBy: nextWaiter.userId,
      holdExpiresAt: offerExpiresAt,
    },
  });

  // Notify the waiter (best-effort, outside the transaction ideally, but kept simple here)
  try {
    const user = await tx.user.findUnique({ where: { id: nextWaiter.userId } });
    if (user?.email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      await transporter.sendMail({
        from: `"Ticket Booking System" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "A seat is now available for you!",
        html: `<p>A seat you were waitlisted for is now available. You have 5 minutes to complete your booking before it's offered to the next person.</p>`,
      });
    }
  } catch (emailErr) {
    console.error("[email] Failed to send waitlist offer email:", emailErr.message);
  }

  return true;
}

module.exports = { joinWaitlist, offerSeatToNextInWaitlist };