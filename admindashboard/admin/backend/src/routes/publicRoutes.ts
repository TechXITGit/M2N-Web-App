import express, { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { upload } from '../config/cloudinary';

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
    const cleanImg = (u: string) => (typeof u === 'string' ? u.trim().replace(/&amp;/g, '&').replace(/&#38;/g, '&') : '');
    const formattedCategories = categories.map(c => ({
      ...c,
      images: (c.images || []).map(cleanImg),
      galleryImages: (c.galleryImages || []).map(cleanImg),
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

    const cleanImg = (u: string) => (typeof u === 'string' ? u.trim().replace(/&amp;/g, '&').replace(/&#38;/g, '&') : '');
    const activeCategories = categories.map(c => ({
      ...c,
      images: (c.images || []).map(cleanImg),
      galleryImages: (c.galleryImages || []).map(cleanImg),
      _id: c.id,
      hotelId: c.hotel
    }));

    res.json(activeCategories);
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// @desc    Get curated experiences (synchronized across website and mobile app)
// @route   GET /api/public/experiences
router.get('/experiences', async (req: Request, res: Response): Promise<void> => {
  try {
    const dbExperiences = await prisma.experience.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: 'asc' },
    });

    if (dbExperiences && dbExperiences.length > 0) {
      const formatted = dbExperiences.map((exp, index) => {
        const numPrice = Number(exp.numericPrice || 0);
        const formattedPrice = exp.price || `₹${numPrice.toLocaleString('en-IN')}`;
        const numStr = String(index + 1).padStart(2, '0');

        return {
          id: exp.id,
          _id: exp.id,
          num: numStr,
          title: exp.title,
          name: exp.title,
          location: exp.location,
          tag: exp.tag || 'CULTURE',
          duration: exp.duration || '3 HOURS',
          price: formattedPrice,
          numericPrice: numPrice,
          unit: '/ GUEST',
          description: exp.description || '',
          fullDescription: exp.fullDescription || exp.description || '',
          maxGuests: exp.maxGuests || 12,
          meetingPoint: exp.meetingPoint || 'Palace Concierge Desk',
          image: exp.image || '',
          highlights: Array.isArray(exp.highlights) ? exp.highlights : [],
          whatsIncluded: Array.isArray(exp.whatsIncluded) ? exp.whatsIncluded : [],
          status: exp.status || 'Published',
          isArchived: !!exp.isArchived,
          createdAt: exp.createdAt,
          updatedAt: exp.updatedAt,
        };
      });
      res.json(formatted);
      return;
    }
  } catch (dbErr) {
    console.warn('Could not fetch experiences from PostgreSQL, using fallback:', dbErr);
  }

  // Fallback defaults if database has not yet been seeded
  const fallbackExperiences = [
    {
      id: 'heritage-walks',
      num: '01',
      title: 'Heritage Walks',
      name: 'Heritage Walks',
      location: 'JAIPUR',
      duration: '3 HOURS',
      price: '₹4,500',
      numericPrice: 4500,
      unit: '/ GUEST',
      description: 'The old city before the shops open — havelis, stepwells, and the smell of first chai, with our resident historian.',
      image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=80',
      highlights: ['Guided by Senior Royal Historian', 'Exclusive Entry to Centuries-old Stepwells', 'Morning Kulhad Masala Chai', 'Intimate Curated Walk (Max 8 Guests)']
    },
    {
      id: 'cooking-masterclass',
      num: '02',
      title: 'Cooking Masterclass',
      name: 'Cooking Masterclass',
      location: 'JAIPUR',
      duration: '4 HOURS',
      price: '₹8,500',
      numericPrice: 8500,
      unit: '/ GUEST',
      description: 'Laal maas and ker sangri from the palace kitchens — market to kadhai with our executive chef.',
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
      highlights: ['Private Session in Royal Palace Kitchens', 'Secret Rajasthani Spice Blending', 'Hands-on Preparation of Delicacies', '4-Course Degustation Lunch']
    },
    {
      id: 'sunset-boat',
      num: '03',
      title: 'Sunset Boat Ride',
      name: 'Sunset Boat Ride',
      location: 'UDAIPUR',
      duration: '2 HOURS',
      price: '₹6,000',
      numericPrice: 6000,
      unit: '/ GUEST',
      description: 'A restored wooden launch, jasmine on the water, and the city palace turning amber ghat by ghat.',
      image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
      highlights: ['Private Restored Mahogany Launch', 'Panoramic Lake Pichola Sunset', 'Live Classical Flutist on Board', 'Chilled Sparkling Beverages & Canapés']
    },
    {
      id: 'royal-astrology',
      num: '04',
      title: 'Royal Astrology',
      name: 'Royal Astrology',
      location: 'JAIPUR',
      duration: '90 MINUTES',
      price: '₹7,500',
      numericPrice: 7500,
      unit: '/ GUEST',
      description: 'A private chart reading with the court astrologer’s seventh-generation successor, under the observatory dome.',
      image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=80',
      highlights: ['Private Horoscope Consultation', 'Hand-drawn Kundali Keepsake', 'Vedic Gemstone Recommendations', 'Under Historic Observatory Dome']
    },
    {
      id: 'artisan-workshop',
      num: '05',
      title: 'Artisan Workshop',
      name: 'Artisan Workshop',
      location: 'DELHI',
      duration: '3 HOURS',
      price: '₹5,500',
      numericPrice: 5500,
      unit: '/ GUEST',
      description: 'Blue pottery, miniature painting or block print — a working morning in a master craftsman’s studio.',
      image: 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=1200&q=80',
      highlights: ['Hands-on Master Studio Session', 'Handmade Craft You Take Home', 'Raw Natural Pigment Demonstrations', 'Artisanal High Tea']
    },
    {
      id: 'forest-yoga',
      num: '06',
      title: 'Forest Yoga & Meditation',
      name: 'Forest Yoga',
      location: 'SHIMLA',
      duration: '75 MINUTES',
      price: '₹3,200',
      numericPrice: 3200,
      unit: '/ GUEST',
      description: 'Sun salutations on a cedar deck at 2,400 metres, while the valley below burns off its fog.',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
      highlights: ['High-Altitude Cedar Deck Session', 'Singing Bowl Sound Bath', 'Organic Himalayan Herbal Infusions', 'Certified Ashtanga Master']
    },
    {
      id: 'royal-dining',
      num: '07',
      title: 'Royal Dining by the Lake',
      name: 'Royal Dining',
      location: 'UDAIPUR',
      duration: 'EVENING',
      price: '₹18,000',
      numericPrice: 18000,
      unit: '/ GUEST',
      description: 'Seven courses on the lake terrace — recipes from the Mewar court kitchens, served as the ghat lights come on.',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
      highlights: ['Private Candlelit Lake Terrace', '7-Course Mewar Royal Feast', 'Live Classical Sarangi Player', 'Personal Butler Service']
    },
    {
      id: 'cliff-swim',
      num: '08',
      title: 'Cliff Swim & Coves',
      name: 'Cliff Swim & Coves',
      location: 'GOA',
      duration: 'HALF DAY',
      price: '₹5,000',
      numericPrice: 5000,
      unit: '/ GUEST',
      description: 'A guided swim through three private coves, ending with grilled catch and cold toddy on the sand.',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
      highlights: ['Private Hidden Coves Expedition', 'Marine Biologist Escort', 'Seaside Barbecue on Secluded Sand', 'Cold Feni & Fresh Coconut Cocktails']
    }
  ];
  res.json(fallbackExperiences);
});

// @desc    Direct Cloudinary Image Upload for properties, rooms, avatars
// @route   POST /api/public/upload-image
router.post('/upload-image', upload.single('image'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No image file uploaded' });
    return;
  }
  const fileUrl = (req.file as any).path;
  res.json({
    success: true,
    url: fileUrl,
    public_id: (req.file as any).filename,
    folder: 'm2n-hotels'
  });
});

export default router;

