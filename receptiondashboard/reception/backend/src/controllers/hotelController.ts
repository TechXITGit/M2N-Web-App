import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { sendEmail } from '../utils/sendEmail';
import { AuthRequest } from '../middlewares/authMiddleware';

// @desc    Create a new hotel
// @route   POST /api/hotels
// @access  Private (Admin)
export const createHotel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, city, state, type, tagline, address, lat, lng, description } = req.body;

    // Type casting to handle Multer's file array
    const files = req.files as Express.Multer.File[];
    const images = files ? files.map(file => file.path) : [];

    const newHotel = await prisma.hotel.create({
      data: {
        name,
        city,
        state,
        type,
        tagline,
        address,
        lat: Number(lat),
        lng: Number(lng),
        description,
        images,
        // @ts-ignore
        addedBy: req.user?._id || req.user?.id
      }
    });

    res.status(201).json({ ...newHotel, _id: newHotel.id });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Get all hotels
// @route   GET /api/hotels
// @access  Private (Admin)
export const getHotels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { archived } = req.query;

    let filter: any = {};
    if (archived === 'true') {
      filter.isArchived = true;
    } else if (archived !== 'all') {
      filter.isArchived = false;
    }

    const hotels = await prisma.hotel.findMany({
      where: filter,
      include: {
        admin: {
          select: { name: true, email: true }
        }
      }
    });

    const formattedHotels = hotels.map(hotel => ({
      ...hotel,
      _id: hotel.id,
      addedBy: hotel.admin,
      coords: { lat: hotel.lat, lng: hotel.lng }
    }));

    res.json(formattedHotels);
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Update a hotel
// @route   PUT /api/hotels/:id
// @access  Private (Admin)
export const updateHotel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const hotel = await prisma.hotel.findUnique({ where: { id } });

    if (!hotel) {
      res.status(404).json({ message: 'Hotel not found' });
      return;
    }

    const { name, city, state, type, tagline, address, lat, lng, description } = req.body;

    const files = req.files as Express.Multer.File[];
    const newImages = files && files.length > 0 ? files.map(file => file.path) : [];

    const updateData: any = {};
    if (name) updateData.name = name;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (type) updateData.type = type;
    if (tagline) updateData.tagline = tagline;
    if (address) updateData.address = address;
    if (lat !== undefined) updateData.lat = Number(lat);
    if (lng !== undefined) updateData.lng = Number(lng);
    if (description) updateData.description = description;

    if (newImages.length > 0) {
      updateData.images = [...hotel.images, ...newImages];
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id },
      data: updateData
    });

    res.json({ ...updatedHotel, _id: updatedHotel.id, coords: { lat: updatedHotel.lat, lng: updatedHotel.lng } });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Delete a hotel
// @route   DELETE /api/hotels/:id
// @access  Private (Admin)
export const deleteHotel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const hotel = await prisma.hotel.findUnique({ where: { id } });

    if (!hotel) {
      res.status(404).json({ message: 'Hotel not found' });
      return;
    }

    if (req.user && req.user.role === 'superadmin') {
      await prisma.hotel.update({
        where: { id },
        data: { isArchived: true }
      });
      res.json({ message: 'Hotel archived successfully.' });
      return;
    }

    const token = jwt.sign({ hotelId: id, action: 'delete' }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    const approveUrl = `${process.env.API_URL || 'http://localhost:5000/api'}/hotels/action/approve/${token}`;
    const rejectUrl = `${process.env.API_URL || 'http://localhost:5000/api'}/hotels/action/reject/${token}`;

    const message = `
      <h2>Hotel Deletion Request</h2>
      <p>A request has been made to delete the hotel: <strong>${hotel.name}</strong>.</p>
      <p>Please approve or reject this request by clicking one of the links below:</p>
      <br />
      <a href="${approveUrl}" style="padding:10px 20px; background-color:green; color:white; text-decoration:none; border-radius:5px;">Accept Deletion</a>
      &nbsp;&nbsp;&nbsp;
      <a href="${rejectUrl}" style="padding:10px 20px; background-color:red; color:white; text-decoration:none; border-radius:5px;">Reject Deletion</a>
    `;

    await sendEmail({
      email: 'm2n.hotel@gmail.com',
      subject: `Approval Required: Delete Hotel ${hotel.name}`,
      message
    });

    res.json({ message: 'Approval email sent for deletion.' });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Initiate restore hotel
// @route   POST /api/hotels/:id/restore
// @access  Private (Admin)
export const restoreHotel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const hotel = await prisma.hotel.findUnique({ where: { id } });

    if (!hotel) {
      res.status(404).json({ message: 'Hotel not found' });
      return;
    }

    if (req.user && req.user.role === 'superadmin') {
      await prisma.hotel.update({
        where: { id },
        data: { isArchived: false }
      });
      res.json({ message: 'Hotel restored successfully.' });
      return;
    }

    const token = jwt.sign({ hotelId: id, action: 'restore' }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    const approveUrl = `${process.env.API_URL || 'http://localhost:5000/api'}/hotels/action/approve/${token}`;
    const rejectUrl = `${process.env.API_URL || 'http://localhost:5000/api'}/hotels/action/reject/${token}`;

    const message = `
      <h2>Hotel Restore Request</h2>
      <p>A request has been made to restore the archived hotel: <strong>${hotel.name}</strong>.</p>
      <p>Please approve or reject this request by clicking one of the links below:</p>
      <br />
      <a href="${approveUrl}" style="padding:10px 20px; background-color:green; color:white; text-decoration:none; border-radius:5px;">Accept Restore</a>
      &nbsp;&nbsp;&nbsp;
      <a href="${rejectUrl}" style="padding:10px 20px; background-color:red; color:white; text-decoration:none; border-radius:5px;">Reject Restore</a>
    `;

    await sendEmail({
      email: 'm2n.hotel@gmail.com',
      subject: `Approval Required: Restore Hotel ${hotel.name}`,
      message
    });

    res.json({ message: 'Approval email sent for restoration.' });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message || 'Server Error' });
  }
};

// @desc    Approve action
// @route   GET /api/hotels/action/approve/:token
// @access  Public
export const approveAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { hotelId: string, action: string };

    const hotel = await prisma.hotel.findUnique({ where: { id: decoded.hotelId } });
    if (!hotel) {
      res.status(404).send('<h1>Hotel not found</h1>');
      return;
    }

    if (decoded.action === 'delete') {
      await prisma.hotel.update({
        where: { id: decoded.hotelId },
        data: { isArchived: true }
      });
      res.send(`<h1>Hotel "${hotel.name}" has been successfully deleted.</h1>`);
    } else if (decoded.action === 'restore') {
      await prisma.hotel.update({
        where: { id: decoded.hotelId },
        data: { isArchived: false }
      });
      res.send(`<h1>Hotel "${hotel.name}" has been successfully restored.</h1>`);
    } else {
      res.status(400).send('<h1>Invalid action</h1>');
    }
  } catch (error) {
    res.status(400).send('<h1>Invalid or expired token</h1>');
  }
};

// @desc    Reject action
// @route   GET /api/hotels/action/reject/:token
// @access  Public
export const rejectAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { hotelId: string, action: string };

    const hotel = await prisma.hotel.findUnique({ where: { id: decoded.hotelId } });
    if (!hotel) {
      res.status(404).send('<h1>Hotel not found</h1>');
      return;
    }

    res.send(`<h1>The ${decoded.action} request for hotel "${hotel.name}" was successfully rejected.</h1>`);
  } catch (error) {
    res.status(400).send('<h1>Invalid or expired token</h1>');
  }
};
