const prisma = require("../prismaClient");

const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const holdSeats = async (req, res) => {
  const { showId } = req.params;
  const { seatIds } = req.body; // array of ShowSeat ids
  const userId = req.user.userId;

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: "seatIds must be a non-empty array" });
  }

  const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MS);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const heldSeats = [];

      for (const seatId of seatIds) {
        const updateResult = await tx.showSeat.updateMany({
          where: {
            id: seatId,
            showId,
            OR: [
              { status: "AVAILABLE" },
              { status: "HELD", holdExpiresAt: { lt: new Date() } },
            ],
          },
          data: {
            status: "HELD",
            heldBy: userId,
            holdExpiresAt,
          },
        });

        if (updateResult.count === 0) {
          throw new Error(`SEAT_UNAVAILABLE:${seatId}`);
        }
        heldSeats.push(seatId);
      }

      return heldSeats;
    }, {
        maxWait: 10000,
        timeout: 15000,
    });

    return res.status(200).json({
      message: "Seats held successfully",
      heldSeatIds: result,
      holdExpiresAt,
    });
  } catch (err) {
    if (err.message.startsWith("SEAT_UNAVAILABLE:")) {
      const seatId = err.message.split(":")[1];
      return res.status(409).json({
        error: "One or more seats are no longer available",
        conflictSeatId: seatId,
      });
    }
    console.error(err);
    return res.status(500).json({ error: "Failed to hold seats" });
  }
};

module.exports = { holdSeats };