const prisma = require("../prismaClient");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const OFFER_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function generateReferenceCode() {
  return "BK-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

// Join the waitlist for a category on a show
const joinWaitlist = async (req, res) => {
  const { showId } = req.params;
  const { categoryId } = req.body;
  const userId = req.user.userId;

  if (!categoryId) {
    return res.status(400).json({
      error: "categoryId is required",
    });
  }

  try {
    // Prevent the same user from joining the same waitlist
    // multiple times while already waiting/offered.
    const existing = await prisma.waitlist.findFirst({
      where: {
        userId,
        showId,
        categoryId,
        status: {
          in: ["WAITING", "OFFERED"],
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        error: "You are already on the waitlist for this category",
        waitlistId: existing.id,
        status: existing.status,
      });
    }

    const entry = await prisma.waitlist.create({
      data: {
        userId,
        showId,
        categoryId,
        status: "WAITING",
      },
    });

    return res.status(201).json({
      message: "Added to waitlist",
      waitlistId: entry.id,
      status: entry.status,
    });
  } catch (err) {
    console.error("[joinWaitlist] Error:", err);
    return res.status(500).json({
      error: "Failed to join waitlist",
    });
  }
};


// Called internally when a seat becomes free
// from cancellation or an expired offer.
async function offerSeatToNextInWaitlist(
  tx,
  showId,
  categoryId,
  seatId
) {
  const nextWaiter = await tx.waitlist.findFirst({
    where: {
      showId,
      categoryId,
      status: "WAITING",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!nextWaiter) {
    return false;
  }

  const offerExpiresAt = new Date(
    Date.now() + OFFER_DURATION_MS
  );

  await tx.waitlist.update({
    where: {
      id: nextWaiter.id,
    },
    data: {
      status: "OFFERED",
      offeredSeatId: seatId,
      offerExpiresAt,
    },
  });

  await tx.showSeat.update({
    where: {
      id: seatId,
    },
    data: {
      status: "HELD",
      heldBy: nextWaiter.userId,
      holdExpiresAt: offerExpiresAt,
    },
  });

  // Send email notification.
  try {
    const user = await tx.user.findUnique({
      where: {
        id: nextWaiter.userId,
      },
    });

    if (user?.email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Ticket Booking System" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "A seat is now available for you!",
        html: `
          <p>
            A seat you were waitlisted for is now available.
          </p>
          <p>
            You have <strong>5 minutes</strong> to complete
            your booking before it is offered to the next person.
          </p>
        `,
      });
    }
  } catch (emailErr) {
    console.error(
      "[email] Failed to send waitlist offer email:",
      emailErr.message
    );
  }

  return true;
}


// Get the current user's waitlist entries
const getMyWaitlist = async (req, res) => {
  const userId = req.user.userId;

  try {
    const entries = await prisma.waitlist.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        show: {
          include: {
            event: true,
          },
        },
        category: true,
      },
    });

    return res.status(200).json({
      waitlist: entries,
    });
  } catch (err) {
    console.error("[getMyWaitlist] Error:", err);

    return res.status(500).json({
      error: "Failed to fetch waitlist",
    });
  }
};


// Claim an offered seat and convert it into a booking.
const claimWaitlistOffer = async (req, res) => {
  const { waitlistId } = req.params;
  const userId = req.user.userId;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const entry = await tx.waitlist.findUnique({
          where: {
            id: waitlistId,
          },
        });

        if (!entry) {
          throw new Error("WAITLIST_NOT_FOUND");
        }

        if (entry.userId !== userId) {
          throw new Error("NOT_AUTHORIZED");
        }

        if (entry.status !== "OFFERED") {
          throw new Error("OFFER_NOT_AVAILABLE");
        }

        if (
          !entry.offeredSeatId ||
          !entry.offerExpiresAt ||
          entry.offerExpiresAt < new Date()
        ) {
          throw new Error("OFFER_EXPIRED");
        }

        const seat = await tx.showSeat.findUnique({
          where: {
            id: entry.offeredSeatId,
          },
        });

        if (!seat) {
          throw new Error("SEAT_NOT_FOUND");
        }

        // Make absolutely sure the seat is still held
        // specifically for this user.
        if (
          seat.status !== "HELD" ||
          seat.heldBy !== userId ||
          !seat.holdExpiresAt ||
          seat.holdExpiresAt < new Date()
        ) {
          throw new Error("SEAT_NO_LONGER_HELD");
        }

        const referenceCode = generateReferenceCode();

        const booking = await tx.booking.create({
          data: {
            userId,
            showId: entry.showId,
            referenceCode,
            totalAmount: seat.price,
            status: "CONFIRMED",
          },
        });

        await tx.showSeat.update({
          where: {
            id: seat.id,
          },
          data: {
            status: "BOOKED",
            bookingId: booking.id,
            heldBy: null,
            holdExpiresAt: null,
          },
        });

        await tx.waitlist.update({
          where: {
            id: entry.id,
          },
          data: {
            status: "CONVERTED",
            offerExpiresAt: null,
          },
        });

        return {
          booking,
          seat,
        };
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    return res.status(201).json({
      message: "Waitlist offer claimed successfully",
      booking: {
        id: result.booking.id,
        referenceCode: result.booking.referenceCode,
        totalAmount: result.booking.totalAmount,
        seats: [result.seat.id],
      },
    });
  } catch (err) {
    if (err.message === "WAITLIST_NOT_FOUND") {
      return res.status(404).json({
        error: "Waitlist entry not found",
      });
    }

    if (err.message === "NOT_AUTHORIZED") {
      return res.status(403).json({
        error: "You are not authorized to claim this offer",
      });
    }

    if (err.message === "OFFER_NOT_AVAILABLE") {
      return res.status(409).json({
        error: "This waitlist offer is no longer available",
      });
    }

    if (
      err.message === "OFFER_EXPIRED" ||
      err.message === "SEAT_NO_LONGER_HELD"
    ) {
      return res.status(409).json({
        error: "This waitlist offer has expired",
      });
    }

    if (err.message === "SEAT_NOT_FOUND") {
      return res.status(404).json({
        error: "The offered seat could not be found",
      });
    }

    console.error("[claimWaitlistOffer] Error:", err);

    return res.status(500).json({
      error: "Failed to claim waitlist offer",
    });
  }
};


module.exports = {
  joinWaitlist,
  getMyWaitlist,
  claimWaitlistOffer,
  offerSeatToNextInWaitlist,
};