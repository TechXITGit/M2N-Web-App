import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

/**
 * Normalizes an Experience record from PostgreSQL to consistent client format
 */
function formatExperience(exp: any, index: number = 0) {
  if (!exp) return null;
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
    highlights: Array.isArray(exp.highlights) ? exp.highlights : [],
    whatsIncluded: Array.isArray(exp.whatsIncluded) ? exp.whatsIncluded : [],
    image: exp.image || '',
    status: exp.status || 'Published',
    isArchived: !!exp.isArchived,
    createdAt: exp.createdAt,
    updatedAt: exp.updatedAt,
  };
}

// @desc    Get all experiences
// @route   GET /api/experiences
// @access  Public / Private
export const getExperiences = async (req: Request, res: Response): Promise<void> => {
  try {
    const { archived } = req.query;

    let where: any = {};
    if (archived === 'true') {
      where.isArchived = true;
    } else if (archived !== 'all') {
      where.isArchived = false;
    }

    const experiences = await prisma.experience.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const formatted = experiences.map((exp, idx) => formatExperience(exp, idx));
    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching experiences:', error);
    res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error',
    });
  }
};

// @desc    Get single experience by ID
// @route   GET /api/experiences/:id
// @access  Public
export const getExperienceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const exp = await prisma.experience.findUnique({
      where: { id },
    });

    if (!exp) {
      res.status(404).json({ message: 'Experience not found' });
      return;
    }

    res.json(formatExperience(exp));
  } catch (error: any) {
    res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error',
    });
  }
};

// @desc    Create a new experience in PostgreSQL
// @route   POST /api/experiences
// @access  Private (Admin)
export const createExperience = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      location,
      tag,
      duration,
      description,
      fullDescription,
      numericPrice,
      price,
      maxGuests,
      meetingPoint,
      highlights,
      whatsIncluded,
      image,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ message: 'Experience title is required' });
      return;
    }

    const numPrice = Number(
      numericPrice !== undefined
        ? numericPrice
        : typeof price === 'string'
        ? price.replace(/[^\d.]/g, '')
        : price || 0
    ) || 0;

    // Normalize highlights and whatsIncluded if passed as string
    const parseList = (val: any) => {
      if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
      if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
      return [];
    };

    const newExp = await prisma.experience.create({
      data: {
        title: title.trim(),
        location: (location || 'JAIPUR').trim().toUpperCase(),
        tag: (tag || 'CULTURE').trim().toUpperCase(),
        duration: (duration || '3 HOURS').trim().toUpperCase(),
        description: (description || '').trim(),
        fullDescription: (fullDescription || description || '').trim(),
        numericPrice: numPrice,
        price: numPrice,
        maxGuests: Number(maxGuests) || 12,
        meetingPoint: (meetingPoint || 'Palace Concierge Desk').trim(),
        highlights: parseList(highlights),
        whatsIncluded: parseList(whatsIncluded),
        image: image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        status: status || 'Published',
        isArchived: false,
      },
    });

    res.status(201).json(formatExperience(newExp));
  } catch (error: any) {
    console.error('Error creating experience in DB:', error);
    res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error',
    });
  }
};

// @desc    Update an existing experience in PostgreSQL
// @route   PUT /api/experiences/:id
// @access  Private (Admin)
export const updateExperience = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.experience.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ message: 'Experience not found' });
      return;
    }

    const {
      title,
      location,
      tag,
      duration,
      description,
      fullDescription,
      numericPrice,
      price,
      maxGuests,
      meetingPoint,
      highlights,
      whatsIncluded,
      image,
      status,
      isArchived,
    } = req.body;

    const parseList = (val: any) => {
      if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
      if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
      return undefined;
    };

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (location !== undefined) updateData.location = location.trim().toUpperCase();
    if (tag !== undefined) updateData.tag = tag.trim().toUpperCase();
    if (duration !== undefined) updateData.duration = duration.trim().toUpperCase();
    if (description !== undefined) updateData.description = description.trim();
    if (fullDescription !== undefined) updateData.fullDescription = fullDescription.trim();
    if (numericPrice !== undefined) {
      const num = Number(numericPrice) || 0;
      updateData.numericPrice = num;
      updateData.price = num;
    } else if (price !== undefined) {
      const num = typeof price === 'number' ? price : Number(String(price).replace(/[^\d.]/g, '')) || 0;
      updateData.numericPrice = num;
      updateData.price = num;
    }
    if (maxGuests !== undefined) updateData.maxGuests = Number(maxGuests) || 12;
    if (meetingPoint !== undefined) updateData.meetingPoint = meetingPoint.trim();
    if (highlights !== undefined) updateData.highlights = parseList(highlights);
    if (whatsIncluded !== undefined) updateData.whatsIncluded = parseList(whatsIncluded);
    if (image !== undefined) updateData.image = image;
    if (status !== undefined) updateData.status = status;
    if (isArchived !== undefined) updateData.isArchived = Boolean(isArchived);

    const updated = await prisma.experience.update({
      where: { id },
      data: updateData,
    });

    res.json(formatExperience(updated));
  } catch (error: any) {
    console.error('Error updating experience in DB:', error);
    res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error',
    });
  }
};

// @desc    Delete / Remove experience from PostgreSQL
// @route   DELETE /api/experiences/:id
// @access  Private (Admin)
export const deleteExperience = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.experience.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ message: 'Experience not found' });
      return;
    }

    // Permanently remove or soft-delete depending on query param
    if (req.query.soft === 'true') {
      await prisma.experience.update({
        where: { id },
        data: { isArchived: true },
      });
      res.json({ message: 'Experience archived successfully' });
    } else {
      await prisma.experience.delete({ where: { id } });
      res.json({ message: 'Experience deleted successfully', id });
    }
  } catch (error: any) {
    console.error('Error deleting experience from DB:', error);
    res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error',
    });
  }
};
