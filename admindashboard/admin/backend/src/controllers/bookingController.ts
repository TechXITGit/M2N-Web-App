import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { sendEmail } from '../utils/sendEmail';

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        hotel: { select: { name: true, city: true, state: true } },
        roomCategory: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
      
    // Format for frontend
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
    const bookingId = req.params.id;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { name: true, email: true } },
        hotel: { select: { name: true } }
      }
    });

    if (booking) {
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
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

export const getCancellationRequests = async (req: Request, res: Response) => {
  try {
    const requests = await prisma.booking.findMany({
      where: {
        OR: [
          { cancellationRequested: true, status: 'confirmed' },
          { status: 'cancelled' }
        ]
      },
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
    const bookingId = req.params.id;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { name: true, email: true } },
        hotel: { select: { name: true } }
      }
    });

    if (booking) {
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
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
