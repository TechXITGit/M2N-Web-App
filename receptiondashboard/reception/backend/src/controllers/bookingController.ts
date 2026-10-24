import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { sendEmail } from '../utils/sendEmail';
import { AuthRequest } from '../middlewares/authMiddleware';
import { uploadToDrive } from '../utils/googleDrive';

export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = {};
    if (req.user && req.user.role === 'receptionist' && req.user.hotelId) {
      query.hotelId = req.user.hotelId;
    }

    const bookings = await prisma.booking.findMany({
      where: query,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        hotel: { select: { name: true, city: true, state: true } },
        roomCategory: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
      
    const formattedBookings = bookings.map(b => ({
      ...b,
      _id: b.id,
      userId: b.user ? { ...b.user, _id: b.userId } : null,
      hotelId: b.hotel ? { ...b.hotel, _id: b.hotelId } : null,
      roomCategoryId: b.roomCategory ? { ...b.roomCategory, _id: b.roomCategoryId } : null
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { bookingId: req.params.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        hotel: { select: { id: true, name: true, city: true, state: true } },
        roomCategory: { select: { name: true } }
      }
    });

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    if (req.user && req.user.role === 'receptionist' && req.user.hotelId) {
      if (booking.hotelId !== req.user.hotelId) {
        res.status(403).json({ message: 'Not authorized to view this booking' });
        return;
      }
    }

    res.json({
      ...booking,
      _id: booking.id,
      userId: booking.user,
      hotelId: { ...booking.hotel, _id: booking.hotel.id },
      roomCategoryId: booking.roomCategory
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkInBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { roomId, categoryId } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    if (req.user && req.user.role === 'receptionist' && req.user.hotelId) {
      if (booking.hotelId !== req.user.hotelId) {
        res.status(403).json({ message: 'Not authorized' });
        return;
      }
    }

    const file = req.file as Express.Multer.File;
    if (!file) {
      res.status(400).json({ message: 'Valid ID file is required' });
      return;
    }

    // Update Room Status
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

    // Get Hotel name for folder structure
    const hotel = await prisma.hotel.findUnique({ where: { id: booking.hotelId } });
    if (!hotel) {
      res.status(404).json({ message: 'Hotel not found' });
      return;
    }

    // Upload to Google Drive
    const extension = file.originalname.split('.').pop() || 'png';
    const driveUrl = await uploadToDrive(
      file.buffer,
      file.mimetype,
      extension,
      booking.id,
      hotel.name
    );

    roomsData[roomIndex].status = 'CheckIn';
    await prisma.roomCategory.update({
      where: { id: categoryId },
      data: { rooms: roomsData }
    });

    // Update Booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        validIdUrl: driveUrl,
        assignedRoomNumber: roomsData[roomIndex].roomNumber,
      }
    });

    res.json({ message: 'Checked in successfully', booking: { ...updatedBooking, _id: updatedBooking.id } });
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as any).message });
  }
};

export const getHotelBookings = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const bookings = await prisma.booking.findMany({
      where: { hotelId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        roomCategory: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedBookings = bookings.map(b => ({
      ...b,
      _id: b.id,
      userId: b.user ? { ...b.user, _id: b.userId } : null,
      roomCategoryId: b.roomCategory ? { ...b.roomCategory, _id: b.roomCategoryId } : null
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Get hotel bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true } },
        hotel: { select: { name: true } }
      }
    });

    if (booking) {
      const updatedBooking = await prisma.booking.update({
        where: { id: req.params.id },
        data: { status: 'cancelled' },
        include: {
          user: { select: { name: true, email: true } },
          hotel: { select: { name: true } }
        }
      });
      
      const user = updatedBooking.user;
      const hotel = updatedBooking.hotel;
      
      if (user && user.email) {
        try {
          await sendEmail({
            email: user.email,
            subject: 'Booking Cancelled',
            message: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Booking Cancellation</h2>
                <p>Dear ${user.name},</p>
                <p>We are writing to inform you that your booking at <strong>${hotel?.name || 'our hotel'}</strong> has been cancelled by the administration.</p>
                <p>If you have any questions or concerns, please contact our support.</p>
                <p>We hope to serve you again in the future.</p>
                <br/>
                <p>Best regards,<br/>M2N Group of Hotels</p>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Failed to send cancellation email:', emailError);
        }
      }

      res.json({
        ...updatedBooking,
        _id: updatedBooking.id,
        userId: updatedBooking.user ? { ...updatedBooking.user, _id: updatedBooking.userId } : null,
        hotelId: updatedBooking.hotel ? { ...updatedBooking.hotel, _id: updatedBooking.hotelId } : null
      });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCancellationRequests = async (req: AuthRequest, res: Response) => {
  try {
    const whereConditions: any = { 
      OR: [
        { cancellationRequested: true, status: 'confirmed' },
        { status: 'cancelled' }
      ]
    };
    if (req.user && req.user.role === 'receptionist' && req.user.hotelId) {
      whereConditions.hotelId = req.user.hotelId;
    }

    const requests = await prisma.booking.findMany({
      where: whereConditions,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        hotel: { select: { name: true, city: true, state: true } },
        roomCategory: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedRequests = requests.map(r => ({
      ...r,
      _id: r.id,
      userId: r.user ? { ...r.user, _id: r.userId } : null,
      hotelId: r.hotel ? { ...r.hotel, _id: r.hotelId } : null,
      roomCategoryId: r.roomCategory ? { ...r.roomCategory, _id: r.roomCategoryId } : null
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Get cancellation requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const acceptCancellation = async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true } },
        hotel: { select: { name: true } }
      }
    });

    if (booking) {
      const updatedBooking = await prisma.booking.update({
        where: { id: req.params.id },
        data: { status: 'cancelled' },
        include: {
          user: { select: { name: true, email: true } },
          hotel: { select: { name: true } }
        }
      });
      
      const user = updatedBooking.user;
      const hotel = updatedBooking.hotel;
      
      if (user && user.email) {
        try {
          await sendEmail({
            email: user.email,
            subject: 'Cancellation Request Accepted - Refund Initiated',
            message: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #B65C43;">Cancellation Request Accepted</h2>
                <p>Dear ${user.name},</p>
                <p>We are writing to inform you that your request to cancel your booking at <strong>${hotel?.name || 'our hotel'}</strong> has been accepted and processed.</p>
                <p><strong>Your refund has been initiated</strong> and you will receive it in your original payment method within <strong>5 to 7 business days</strong>.</p>
                <p>We hope to serve you again in the future.</p>
                <br/>
                <p>Best regards,<br/><strong>M2N Group of Hotels</strong></p>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Failed to send cancellation email:', emailError);
        }
      }

      res.json({
        ...updatedBooking,
        _id: updatedBooking.id,
        userId: updatedBooking.user ? { ...updatedBooking.user, _id: updatedBooking.userId } : null,
        hotelId: updatedBooking.hotel ? { ...updatedBooking.hotel, _id: updatedBooking.hotelId } : null
      });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error: any) {
    console.error('Accept cancellation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAvailableRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryId, checkIn, checkOut } = req.query;
    
    if (!categoryId || !checkIn || !checkOut) {
      res.status(400).json({ message: 'Missing parameters' });
      return;
    }

    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);

    // Get the category and its rooms
    const category = await prisma.roomCategory.findUnique({ where: { id: categoryId as string } });
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const allRooms = Array.isArray(category.rooms) ? category.rooms : [];

    // Find overlapping bookings for this category
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        roomCategoryId: categoryId as string,
        status: 'confirmed',
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate }
      }
    });

    const bookedRoomNumbers = overlappingBookings.map(b => b.assignedRoomNumber).filter(Boolean);

    // Filter available rooms (only show rooms that are physically 'Ready' and not booked)
    const availableRooms = allRooms.filter((room: any) => 
      room && 
      room.status === 'Ready' && 
      !bookedRoomNumbers.includes(room.roomNumber)
    );

    res.json(availableRooms);
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createWalkinBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { hotelId, roomCategoryId, checkIn, checkOut, quantity, adults, children, guestName, phone, email, address, nationality, assignedRoomNumber } = req.body;
    const file = req.file as Express.Multer.File;
    
    if (!guestName || !phone || !assignedRoomNumber || !file) {
      res.status(400).json({ message: 'Missing required fields or ID document' });
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Handle User creation or lookup
    let user;
    if (email && email !== 'null' && email !== '') {
      user = await prisma.user.findUnique({ where: { email } });
    }
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: guestName,
          email: (email && email !== 'null' && email !== '') ? email : `walkin_${Date.now()}@m2n.com`, // dummy email if none provided
          phone: phone,
          nationality: (nationality && nationality !== 'null') ? nationality : null
        }
      });
    }

    const category = await prisma.roomCategory.findUnique({ where: { id: roomCategoryId } });
    if (!category) {
       res.status(404).json({ message: 'Category not found' });
       return;
    }

    // Get Hotel name for folder structure
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      res.status(404).json({ message: 'Hotel not found' });
      return;
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
    const totalAmount = nights * category.price * Number(quantity || 1);

    // Generate 5-digit ID
    const lastBooking = await prisma.booking.findFirst({ orderBy: { createdAt: 'desc' } });
    let newBookingIdStr = '00000';
    if (lastBooking && lastBooking.bookingId) {
      const lastIdNum = parseInt(lastBooking.bookingId, 10);
      newBookingIdStr = (lastIdNum + 1).toString().padStart(5, '0');
    }

    // Upload to Google Drive
    const extension = file.originalname.split('.').pop() || 'png';
    const driveUrl = await uploadToDrive(
      file.buffer,
      file.mimetype,
      extension,
      newBookingIdStr, // Using bookingId as folder/reference
      hotel.name
    );

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingId: newBookingIdStr,
        userId: user.id,
        hotelId,
        roomCategoryId,
        checkIn: checkInDate,
        checkInTime: "12:00", // default
        checkOut: checkOutDate,
        checkOutTime: "11:00", // default
        quantity: Number(quantity || 1),
        adults: Number(adults || 1),
        children: Number(children || 0),
        totalAmount,
        status: 'confirmed', // walkins are confirmed immediately
        validIdUrl: driveUrl,
        assignedRoomNumber
      }
    });

    // Update Room Status in RoomCategory
    let roomsData = Array.isArray(category.rooms) ? category.rooms : [];
    const roomIndex = roomsData.findIndex((r: any) => r.roomNumber === assignedRoomNumber);
    if (roomIndex !== -1 && roomsData[roomIndex]) {
      (roomsData[roomIndex] as any).status = 'CheckIn'; // or 'Occupied'
      await prisma.roomCategory.update({
        where: { id: roomCategoryId },
        data: { rooms: roomsData }
      });
    }

    res.json({ message: 'Walk-in booking created successfully', booking: { ...booking, _id: booking.id } });
  } catch (error) {
    console.error('Create walkin booking error:', error);
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (error as any).message });
  }
};
