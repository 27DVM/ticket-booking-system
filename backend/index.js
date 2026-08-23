const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./src/routes/auth.routes");
const venueRoutes = require("./src/routes/venue.routes");
const eventRoutes = require("./src/routes/event.routes");
const bookingRoutes = require("./src/routes/booking.routes");
const waitlistRoutes = require("./src/routes/waitlist.routes"); 
const { startSweeper } = require("./src/utils/sweeper");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/events", waitlistRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Ticket Booking System API is running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startSweeper();
});