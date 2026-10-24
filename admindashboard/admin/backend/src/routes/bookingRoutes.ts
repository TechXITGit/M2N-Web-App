import express from 'express';
import { getAllBookings, getHotelBookings, cancelBooking, getCancellationRequests, acceptCancellation } from '../controllers/bookingController';
import { protect, superadmin } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', protect, getAllBookings);
router.get('/cancellation-requests', protect, getCancellationRequests);
router.get('/hotel/:hotelId', protect, getHotelBookings);
router.put('/:id/cancel', protect, cancelBooking);
router.post('/:id/accept-cancellation', protect, acceptCancellation);

export default router;
