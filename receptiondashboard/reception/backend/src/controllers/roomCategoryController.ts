import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// @desc    Create a new room category for a hotel
// @route   POST /api/hotels/:hotelId/categories
// @access  Private (Admin)
export const createRoomCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    
    if (req.user && req.user.role === 'receptionist' && req.user.hotelId) {
      if (hotelId !== req.user.hotelId) {
        res.status(403).json({ message: 'You can only add categories to your assigned hotel' });
        return;
      }
    }

    // Check if hotel exists
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      res.status(404).json({ message: 'Hotel not found' });
      return;
    }

    const { 
      name, 
      numberOfRooms, 
      roomSize, 
      numberOfBeds, 
      isAC, 
      view, 
      capacity, 
      price, 
      features 
    } = req.body;

    let parsedFeatures: string[] = [];
    if (typeof features === 'string') {
        parsedFeatures = features.split(',').map(f => f.trim()).filter(f => f !== '');
    } else if (Array.isArray(features)) {
        parsedFeatures = features;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const images = files && files['images'] ? files['images'].map(file => file.path) : [];
    const galleryImages = files && files['galleryImages'] ? files['galleryImages'].map(file => file.path) : [];

    const generatedRooms = [];
    for (let i = 1; i <= Number(numberOfRooms); i++) {
      generatedRooms.push({ id: Math.random().toString(36).substring(7), roomNumber: `${i}`, status: 'Ready' });
    }

    const newCategory = await prisma.roomCategory.create({
      data: {
        hotelId,
        name,
        numberOfRooms: Number(numberOfRooms),
        roomSize,
        numberOfBeds: Number(numberOfBeds),
        isAC: isAC === 'true' || isAC === true,
        view,
        capacity: Number(capacity),
        price: Number(price),
        features: parsedFeatures,
        images,
        galleryImages,
        rooms: generatedRooms,
      }
    });

    res.status(201).json({ ...newCategory, _id: newCategory.id });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Get all room categories for a hotel
// @route   GET /api/hotels/:hotelId/categories
// @access  Private (Admin)
export const getRoomCategoriesByHotel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    
    if (req.user && req.user.role === 'receptionist' && req.user.hotelId) {
      if (hotelId !== req.user.hotelId) {
        res.status(403).json({ message: 'You can only view categories for your assigned hotel' });
        return;
      }
    }

    const categories = await prisma.roomCategory.findMany({ where: { hotelId } });
    
    // Backfill rooms for existing legacy data if needed
    for (const cat of categories) {
      let roomsData = cat.rooms as any[];
      if (!roomsData || roomsData.length === 0) {
        const generatedRooms = [];
        for (let i = 1; i <= cat.numberOfRooms; i++) {
          generatedRooms.push({ id: Math.random().toString(36).substring(7), roomNumber: `${i}`, status: 'Ready' });
        }
        await prisma.roomCategory.update({
          where: { id: cat.id },
          data: { rooms: generatedRooms }
        });
        cat.rooms = generatedRooms as any;
      } else {
        roomsData = roomsData.map(r => ({ ...r, _id: r.id }));
        cat.rooms = roomsData as any;
      }
    }

    const formattedCategories = categories.map(c => ({
      ...c,
      _id: c.id
    }));

    res.json(formattedCategories);
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Update a room category
// @route   PUT /api/hotels/:hotelId/categories/:categoryId
// @access  Private (Admin)
export const updateRoomCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryId, hotelId } = req.params; 

    if (req.user && req.user.role === 'receptionist' && req.user.hotelId) {
      if (hotelId && hotelId !== req.user.hotelId) {
        res.status(403).json({ message: 'You can only update categories for your assigned hotel' });
        return;
      }
    }

    const category = await prisma.roomCategory.findUnique({ where: { id: categoryId } });
    
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const { 
      name, numberOfRooms, roomSize, numberOfBeds, isAC, view, capacity, price, features 
    } = req.body;

    let parsedFeatures = category.features;
    if (features !== undefined) {
      if (typeof features === 'string') {
          parsedFeatures = features.split(',').map(f => f.trim()).filter(f => f !== '');
      } else if (Array.isArray(features)) {
          parsedFeatures = features;
      }
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const newImages = files && files['images'] ? files['images'].map(file => file.path) : [];
    const newGalleryImages = files && files['galleryImages'] ? files['galleryImages'].map(file => file.path) : [];

    const updateData: any = {};
    if (name) updateData.name = name;
    if (numberOfRooms !== undefined) updateData.numberOfRooms = Number(numberOfRooms);
    if (roomSize) updateData.roomSize = roomSize;
    if (numberOfBeds !== undefined) updateData.numberOfBeds = Number(numberOfBeds);
    if (isAC !== undefined) updateData.isAC = (isAC === 'true' || isAC === true);
    if (view) updateData.view = view;
    if (capacity !== undefined) updateData.capacity = Number(capacity);
    if (price !== undefined) updateData.price = Number(price);
    updateData.features = parsedFeatures;

    if (newImages.length > 0) {
      updateData.images = [...category.images, ...newImages];
    }
    if (newGalleryImages.length > 0) {
      updateData.galleryImages = [...(category.galleryImages || []), ...newGalleryImages];
    }

    const updatedCategory = await prisma.roomCategory.update({
      where: { id: categoryId },
      data: updateData
    });
    
    res.json({ ...updatedCategory, _id: updatedCategory.id });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Delete a room category
// @route   DELETE /api/hotels/:hotelId/categories/:categoryId
// @access  Private (Admin)
export const deleteRoomCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryId, hotelId } = req.params;
    
    if (req.user && req.user.role === 'receptionist' && req.user.hotelId) {
      if (hotelId && hotelId !== req.user.hotelId) {
        res.status(403).json({ message: 'You can only delete categories for your assigned hotel' });
        return;
      }
    }

    const category = await prisma.roomCategory.findUnique({ where: { id: categoryId } });
    
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    await prisma.roomCategory.delete({ where: { id: categoryId } });
    res.json({ message: 'Category removed' });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Update a room's status
// @route   PATCH /api/hotels/:hotelId/categories/:categoryId/rooms/:roomId/status
// @access  Private (Admin/Receptionist)
export const updateRoomStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryId, roomId, hotelId } = req.params;
    const { status } = req.body;

    if (req.user && req.user.role === 'receptionist' && req.user.hotelId) {
      if (hotelId && hotelId !== req.user.hotelId) {
        res.status(403).json({ message: 'You can only update rooms for your assigned hotel' });
        return;
      }
    }

    if (!['Ready', 'CheckIn', 'HouseKeeping'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const category = await prisma.roomCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    let roomsData = category.rooms as any[];
    const roomIndex = roomsData.findIndex((r: any) => r._id === roomId || r.id === roomId);
    if (roomIndex === -1) {
      res.status(404).json({ message: 'Room not found' });
      return;
    }

    roomsData[roomIndex].status = status;
    
    const updatedCategory = await prisma.roomCategory.update({
      where: { id: categoryId },
      data: { rooms: roomsData }
    });

    const formattedCategory = {
      ...updatedCategory,
      _id: updatedCategory.id,
      rooms: (updatedCategory.rooms as any[]).map(r => ({ ...r, _id: r.id }))
    };

    res.json(formattedCategory);
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};
