const prisma = require("../prismaClient");

const SWEEP_INTERVAL_MS = 30 * 1000; // run every 30 seconds

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

function startSweeper() {
  setInterval(sweepExpiredHolds, SWEEP_INTERVAL_MS);
  console.log(`[sweeper] Started, running every ${SWEEP_INTERVAL_MS / 1000}s`);
}

module.exports = { startSweeper };