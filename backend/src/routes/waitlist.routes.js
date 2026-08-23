const express = require("express");
const router = express.Router();
const { joinWaitlist } = require("../controllers/waitlist.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/shows/:showId/waitlist", authenticate, joinWaitlist);

module.exports = router;