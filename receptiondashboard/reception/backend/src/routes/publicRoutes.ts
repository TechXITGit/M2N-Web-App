import express, { Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = express.Router();

// @desc    Get all hotels (public) with aggregation for rooms and price
// @route   GET /api/public/hotels
router.get('/hotels', async (req: Request, res: Response): Promise<void> => {
  try {
    const hotels = await prisma.hotel.findMany({
      where: { isArchived: false },
      include: {
        categories: {
          select: { numberOfRooms: true, price: true }
        }
      }
    });

    const formattedHotels = hotels.map(hotel => {
      const totalRooms = hotel.categories.reduce((acc, cat) => acc + cat.numberOfRooms, 0);
      const priceFrom = hotel.categories.length > 0 ? Math.min(...hotel.categories.map(cat => cat.price)) : null;
      
      // Exclude categories to match the original $project
      const { categories, ...rest } = hotel;

      return {
        ...rest,
        _id: hotel.id,
        coords: { lat: hotel.lat, lng: hotel.lng },
        totalRooms,
        priceFrom
      };
    });

    res.json(formattedHotels);
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// @desc    Get single hotel
// @route   GET /api/public/hotels/:id
router.get('/hotels/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const hotel = await prisma.hotel.findFirst({
      where: { id: req.params.id, isArchived: false }
    });
    if (!hotel) {
      res.status(404).json({ message: 'Hotel not found' });
      return;
    }
    res.json({ ...hotel, _id: hotel.id, coords: { lat: hotel.lat, lng: hotel.lng } });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// @desc    Get room categories for a hotel
// @route   GET /api/public/hotels/:id/categories
router.get('/hotels/:id/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.roomCategory.findMany({
      where: { hotelId: req.params.id }
    });
    const formattedCategories = categories.map(c => ({
      ...c,
      _id: c.id
    }));
    res.json(formattedCategories);
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// @desc    Get all room categories (for general rooms page)
// @route   GET /api/public/categories
router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.roomCategory.findMany({
      where: {
        hotel: { isArchived: false }
      },
      include: {
        hotel: { select: { name: true, city: true } }
      }
    });

    const activeCategories = categories.map(c => ({
      ...c,
      _id: c.id,
      hotelId: c.hotel
    }));

    res.json(activeCategories);
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

export default router;
