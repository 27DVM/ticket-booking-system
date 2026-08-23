const prisma = require("../prismaClient");
const { offerSeatToNextInWaitlist } = require("../controllers/waitlist.controller");

const SWEEP_INTERVAL_MS = 30 * 1000; // run every 30 seconds

async function sweepExpiredWaitlistOffers() {
  try {
    const expiredOffers = await prisma.waitlist.findMany({
      where: {
        status: "OFFERED",
        offerExpiresAt: { lt: new Date() },
      },
    });

    for (const offer of expiredOffers) {
      await prisma.$transaction(async (tx) => {
        await tx.waitlist.update({
          where: { id: offer.id },
          data: { status: "EXPIRED" },
        });

        const offered = await offerSeatToNextInWaitlist(
          tx,
          offer.showId,
          offer.categoryId,
          offer.offeredSeatId
        );

        if (!offered) {
          await tx.showSeat.update({
            where: { id: offer.offeredSeatId },
            data: { status: "AVAILABLE", heldBy: null, holdExpiresAt: null },
          });
        }
      }, { maxWait: 10000, timeout: 15000 });

      console.log(`[sweeper] Expired waitlist offer ${offer.id}, chained to next waiter or released seat`);
    }
  } catch (err) {
    console.error("[sweeper] Error sweeping expired waitlist offers:", err.message);
  }
}

async function sweepExpiredHolds() {
  try {
    const result = await prisma.showSeat.updateMany({
      where: {
        status: "HELD",
        holdExpiresAt: { lt: new Date() },
      },
      data: {
        status: "AVAILABLE",
        heldBy: null,
        holdExpiresAt: null,
      },
    });

    if (result.count > 0) {
      console.log(`[sweeper] Released ${result.count} expired seat hold(s)`);
    }
  } catch (err) {
    console.error("[sweeper] Error sweeping expired holds:", err.message);
  }
}

async function runSweep() {
  await sweepExpiredWaitlistOffers();
  await sweepExpiredHolds();
}

function startSweeper() {
  setInterval(runSweep, SWEEP_INTERVAL_MS);
  console.log(`[sweeper] Started, running every ${SWEEP_INTERVAL_MS / 1000}s`);
}

module.exports = { startSweeper };