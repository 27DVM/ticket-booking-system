const prisma = require("../prismaClient");

async function createEvent(req, res) {
  try {
    const { title, description, venueId } = req.body;

    if (!title || !venueId) {
      return res.status(400).json({ error: "Title and venueId are required" });
    }

    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        organiserId: req.user.userId,
        venueId,
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong creating the event" });
  }
}

async function getEvents(req, res) {
  const events = await prisma.event.findMany({
    include: { venue: true, shows: true },
  });
  res.json(events);
}

async function createShow(req, res) {
  try {
    const { eventId } = req.params;
    const { dateTime, seatPricing } = req.body;
    // seatPricing example: { "categoryId1": 300, "categoryId2": 150 }

    if (!dateTime || !seatPricing) {
      return res.status(400).json({ error: "dateTime and seatPricing are required" });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const venueSeats = await prisma.seat.findMany({ where: { venueId: event.venueId } });

    const show = await prisma.show.create({
      data: {
        eventId,
        dateTime: new Date(dateTime),
      },
    });

    const showSeatsData = venueSeats
      .filter((seat) => seatPricing[seat.categoryId] !== undefined)
      .map((seat) => ({
        showId: show.id,
        seatId: seat.id,
        categoryId: seat.categoryId,
        price: seatPricing[seat.categoryId],
      }));

    await prisma.showSeat.createMany({ data: showSeatsData, skipDuplicates: true });

    res.status(201).json({ show, seatsGenerated: showSeatsData.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong creating the show" });
  }
}

async function getShowSeats(req, res) {
  const { showId } = req.params;
  const seats = await prisma.showSeat.findMany({
    where: { showId },
    include: { seat: true, category: true },
  });
  res.json(seats);
}

module.exports = { createEvent, getEvents, createShow, getShowSeats };