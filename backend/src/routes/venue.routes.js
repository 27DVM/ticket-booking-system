const express = require("express");
const router = express.Router();
const { createVenue, getVenues, bulkCreateSeats } = require("../controllers/venue.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.post("/", authenticate, authorize("ADMIN"), createVenue);
router.get("/", getVenues);
router.post("/:venueId/seats/bulk", authenticate, authorize("ADMIN"), bulkCreateSeats);

module.exports = router;