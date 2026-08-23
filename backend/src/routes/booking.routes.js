const express = require("express");
const router = express.Router();
const { confirmBooking } = require("../controllers/booking.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/confirm", authenticate, confirmBooking);

module.exports = router;