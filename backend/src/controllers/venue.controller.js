const prisma = require("../prismaClient");

async function createVenue(req, res) {
  try {
    const { name, address, categories } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: "Name and address are required" });
    }

    const venue = await prisma.venue.create({
      data: {
        name,
        address,
        createdBy: req.user.userId,
        categories: {
          create: (categories || []).map((c) => ({
            name: c.name,
            colorTag: c.colorTag || null,
          })),
        },
      },
      include: { categories: true },
    });

    res.status(201).json(venue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong creating the venue" });
  }
}

async function getVenues(req, res) {
  const venues = await prisma.venue.findMany({ include: { categories: true } });
  res.json(venues);
}

async function bulkCreateSeats(req, res) {
  try {
    const { venueId } = req.params;
    const { categoryId, rows, seatsPerRow, startRow } = req.body;

    if (!categoryId || !rows || !seatsPerRow) {
      return res.status(400).json({ error: "categoryId, rows, and seatsPerRow are required" });
    }

    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const rowLetters = [];
    const startCharCode = (startRow || "A").charCodeAt(0);
    for (let i = 0; i < rows; i++) {
      rowLetters.push(String.fromCharCode(startCharCode + i));
    }

    const seatsToCreate = [];
    for (const row of rowLetters) {
      for (let num = 1; num <= seatsPerRow; num++) {
        seatsToCreate.push({
          venueId,
          categoryId,
          row,
          number: num,
          label: `${row}${num}`,
        });
      }
    }

    const result = await prisma.seat.createMany({
      data: seatsToCreate,
      skipDuplicates: true,
    });

    res.status(201).json({ created: result.count, totalRequested: seatsToCreate.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong creating seats" });
  }
}

module.exports = { createVenue, getVenues, bulkCreateSeats };