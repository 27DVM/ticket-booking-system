const express = require("express");
const router = express.Router();
const {
  createEvent,
  getEvents,
  createShow,
  getShowSeats,
} = require("../controllers/event.controller");
const { holdSeats } = require("../controllers/hold.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.post("/", authenticate, authorize("ORGANISER", "ADMIN"), createEvent);
router.get("/", getEvents);
router.post("/:eventId/shows", authenticate, authorize("ORGANISER", "ADMIN"), createShow);
router.get("/shows/:showId/seats", getShowSeats);
router.post("/shows/:showId/hold", authenticate, holdSeats);

module.exports = router;