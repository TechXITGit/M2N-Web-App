import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// @desc    Create a new global category
// @route   POST /api/global-categories
// @access  Private (Admin)
export const createGlobalCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, amenities } = req.body;

    const categoryExists = await prisma.globalRoomCategory.findFirst({
      where: { name, isArchived: false }
    });
    
    if (categoryExists) {
      res.status(400).json({ message: 'Category already exists' });
      return;
    }

    const newCategory = await prisma.globalRoomCategory.create({
      data: {
        name,
        amenities: amenities || [],
      }
    });

    res.status(201).json({ ...newCategory, _id: newCategory.id });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Get global categories
// @route   GET /api/global-categories
// @access  Private (Admin)
export const getGlobalCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const archived = req.query.archived === 'true';
    const categories = await prisma.globalRoomCategory.findMany({
      where: { isArchived: archived }
    });
    
    const formattedCategories = categories.map(c => ({
      ...c,
      _id: c.id
    }));
    
    res.json(formattedCategories);
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Update a global category
// @route   PUT /api/global-categories/:id
// @access  Private (Admin)
export const updateGlobalCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, amenities } = req.body;

    const category = await prisma.globalRoomCategory.findUnique({ where: { id } });

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const updateData: any = {};

    if (name) {
        const existing = await prisma.globalRoomCategory.findFirst({
          where: { name, isArchived: false }
        });
        if (existing && existing.id !== id) {
             res.status(400).json({ message: 'Another category with this name already exists' });
             return;
        }
        updateData.name = name;
    }
    
    if (amenities) {
        updateData.amenities = amenities;
    }

    const updatedCategory = await prisma.globalRoomCategory.update({
      where: { id },
      data: updateData
    });
    
    res.json({ ...updatedCategory, _id: updatedCategory.id });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Archive a global category (soft delete)
// @route   DELETE /api/global-categories/:id
// @access  Private (Admin)
export const archiveGlobalCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await prisma.globalRoomCategory.findUnique({ where: { id } });

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    await prisma.globalRoomCategory.update({
      where: { id },
      data: { isArchived: true }
    });
    
    res.json({ message: 'Category archived' });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Restore an archived global category
// @route   PUT /api/global-categories/:id/restore
// @access  Private (Admin)
export const restoreGlobalCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await prisma.globalRoomCategory.findUnique({ where: { id } });

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    await prisma.globalRoomCategory.update({
      where: { id },
      data: { isArchived: false }
    });
    
    res.json({ message: 'Category restored' });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};
