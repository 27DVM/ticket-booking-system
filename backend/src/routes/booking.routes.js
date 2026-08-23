const express = require("express");
const router = express.Router();
const { confirmBooking, cancelBooking } = require("../controllers/booking.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/confirm", authenticate, confirmBooking);
router.post("/:bookingId/cancel", authenticate, cancelBooking);

module.exports = router;