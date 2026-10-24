import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { cloudinary } from '../config/cloudinary';

async function ensureCloudinaryUrl(url: string): Promise<string> {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim().replace(/&amp;/g, '&').replace(/&#38;/g, '&');
  if (clean.includes('res.cloudinary.com')) {
    return clean;
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      const uploadRes = await cloudinary.uploader.upload(clean, {
        folder: 'm2n-hotels',
      });
      return uploadRes.secure_url;
    } catch (err: any) {
      console.warn('Failed to upload external link to Cloudinary, keeping sanitized URL:', err.message);
      return clean;
    }
  }
  return clean;
}

// @desc    Create a new room category for a hotel
// @route   POST /api/hotels/:hotelId/categories
// @access  Private (Admin)
export const createRoomCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    
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

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    let images: string[] = files && files['images'] ? files['images'].map(file => file.path) : [];
    let galleryImages: string[] = files && files['galleryImages'] ? files['galleryImages'].map(file => file.path) : [];

    if (images.length === 0) {
      if (Array.isArray(req.body.images)) {
        images = req.body.images.filter(Boolean);
      } else if (typeof req.body.images === 'string' && req.body.images.trim()) {
        images = [req.body.images.trim()];
      } else if (typeof req.body.image === 'string' && req.body.image.trim()) {
        images = [req.body.image.trim()];
      }
    }
    if (galleryImages.length === 0 && Array.isArray(req.body.galleryImages)) {
      galleryImages = req.body.galleryImages.filter(Boolean);
    }

    images = (await Promise.all(images.map(ensureCloudinaryUrl))).filter(Boolean);
    galleryImages = (await Promise.all(galleryImages.map(ensureCloudinaryUrl))).filter(Boolean);

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
export const getRoomCategoriesByHotel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const categories = await prisma.roomCategory.findMany({ where: { hotelId } });
    
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
export const updateRoomCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
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

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    let newImages = files && files['images'] ? files['images'].map(file => file.path) : [];
    let newGalleryImages = files && files['galleryImages'] ? files['galleryImages'].map(file => file.path) : [];

    if (newImages.length === 0) {
      if (Array.isArray(req.body.images)) {
        newImages = req.body.images.filter(Boolean);
      } else if (typeof req.body.images === 'string' && req.body.images.trim()) {
        newImages = [req.body.images.trim()];
      } else if (typeof req.body.image === 'string' && req.body.image.trim()) {
        newImages = [req.body.image.trim()];
      }
    }
    if (newGalleryImages.length === 0 && Array.isArray(req.body.galleryImages)) {
      newGalleryImages = req.body.galleryImages.filter(Boolean);
    }

    newImages = (await Promise.all(newImages.map(ensureCloudinaryUrl))).filter(Boolean);
    newGalleryImages = (await Promise.all(newGalleryImages.map(ensureCloudinaryUrl))).filter(Boolean);

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
      if (req.body.replaceImages === 'true' || req.body.replaceImages === true) {
        updateData.images = newImages;
      } else {
        updateData.images = [...(category.images || []), ...newImages];
      }
    }
    if (newGalleryImages.length > 0) {
      if (req.body.replaceImages === 'true' || req.body.replaceImages === true) {
        updateData.galleryImages = newGalleryImages;
      } else {
        updateData.galleryImages = [...(category.galleryImages || []), ...newGalleryImages];
      }
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
export const deleteRoomCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
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
