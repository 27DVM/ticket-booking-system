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

module.exports = { createVenue, getVenues };