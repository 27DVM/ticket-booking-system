const express = require("express");
const router = express.Router();
const { confirmBooking, cancelBooking, getMyBookings } = require("../controllers/booking.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/confirm", authenticate, confirmBooking);
router.post("/:bookingId/cancel", authenticate, cancelBooking);
router.get("/my-bookings", authenticate, getMyBookings);

module.exports = router;
