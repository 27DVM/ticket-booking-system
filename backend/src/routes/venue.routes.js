const express = require("express");
const router = express.Router();
const { createVenue, getVenues } = require("../controllers/venue.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.post("/", authenticate, authorize("ADMIN"), createVenue);
router.get("/", getVenues);

module.exports = router;