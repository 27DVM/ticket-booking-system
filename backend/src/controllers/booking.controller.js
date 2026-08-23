const prisma = require("../prismaClient");
const QRCode = require("qrcode");
const crypto = require("crypto");
const { sendBookingConfirmationEmail } = require("../utils/mailer");
const { offerSeatToNextInWaitlist } = require('./waitlist.controller');

function generateReferenceCode() {
  return "BK-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

const confirmBooking = async (req, res) => {
  const { showId, seatIds } = req.body;
  const userId = req.user.userId;

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: "seatIds must be a non-empty array" });
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Fetch the seats and verify they're all HELD by this user, not expired
      const seats = await tx.showSeat.findMany({
        where: { id: { in: seatIds }, showId },
      });

      if (seats.length !== seatIds.length) {
        throw new Error("SEATS_NOT_FOUND");
      }

      for (const seat of seats) {
        if (
          seat.status !== "HELD" ||
          seat.heldBy !== userId ||
          !seat.holdExpiresAt ||
          seat.holdExpiresAt < new Date()
        ) {
          throw new Error(`SEAT_NOT_HELD_BY_USER:${seat.id}`);
        }
      }

      const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);
      const referenceCode = generateReferenceCode();

      const newBooking = await tx.booking.create({
        data: {
          userId,
          showId,
          referenceCode,
          totalAmount,
          status: "CONFIRMED",
        },
      });

      // Move seats from HELD -> BOOKED, attach bookingId, clear hold fields
      await tx.showSeat.updateMany({
        where: { id: { in: seatIds } },
        data: {
          status: "BOOKED",
          bookingId: newBooking.id,
          heldBy: null,
          holdExpiresAt: null,
        },
      });

      return { ...newBooking, seats };
    }, {
      maxWait: 10000,
      timeout: 15000,
    });

    // Generate QR code (encodes the reference code)
    const qrDataUrl = await QRCode.toDataURL(booking.referenceCode);
    

    // Send confirmation email (best-effort — don't fail the booking if email fails)
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        await sendBookingConfirmationEmail({
          to: user.email,
          referenceCode: booking.referenceCode,
          totalAmount: booking.totalAmount,
          qrCodeDataUrl: qrDataUrl,
        });
      }
    } catch (emailErr) {
      console.error("[email] Failed to send booking confirmation:", emailErr.message);
    }

    return res.status(201).json({
      message: "Booking confirmed",
      booking: {
        id: booking.id,
        referenceCode: booking.referenceCode,
        totalAmount: booking.totalAmount,
        seats: booking.seats.map((s) => s.id),
        qrCode: qrDataUrl,
      },
    });
  } catch (err) {
    if (err.message === "SEATS_NOT_FOUND") {
      return res.status(404).json({ error: "One or more seats not found for this show" });
    }
    if (err.message.startsWith("SEAT_NOT_HELD_BY_USER:")) {
      const seatId = err.message.split(":")[1];
      return res.status(409).json({
        error: "One or more seats are not currently held by you (hold may have expired)",
        conflictSeatId: seatId,
      });
    }
    console.error(err);
    return res.status(500).json({ error: "Failed to confirm booking" });
  }
};

async function cancelBooking(req, res) {
  const { bookingId } = req.params;
  const userId = req.user.userId; // remember: userId, NOT id

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { seats: true } // adjust relation name if yours differs
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isOwner = booking.userId === userId;
    const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'ORGANISER';
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(409).json({ error: 'Booking already cancelled' });
    }

    await prisma.$transaction(async (tx) => {
      for (const seat of booking.seats) {
        const offered = await offerSeatToNextInWaitlist(
          tx,
          booking.showId,
          seat.categoryId,
          seat.id
        );

        if (!offered) {
          await tx.showSeat.update({
            where: { id: seat.id },
            data: { status: 'AVAILABLE', heldBy: null, holdExpiresAt: null, bookingId: null }
          });
        }
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });
    }, { maxWait: 10000, timeout: 15000 });

    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('[cancelBooking] Error:', err.message);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
}

module.exports = { confirmBooking, cancelBooking };