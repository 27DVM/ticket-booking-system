const express = require("express");
const router = express.Router();

const {
  joinWaitlist,
  getMyWaitlist,
  claimWaitlistOffer,
} = require("../controllers/waitlist.controller");

const { authenticate } = require("../middleware/auth.middleware");

// Join waitlist for a show/category
router.post(
  "/shows/:showId/waitlist",
  authenticate,
  joinWaitlist
);

// Get current user's waitlist entries
router.get(
  "/waitlist/my",
  authenticate,
  getMyWaitlist
);

// Claim an offered seat
router.post(
  "/waitlist/:waitlistId/claim",
  authenticate,
  claimWaitlistOffer
);

module.exports = router;