import express from 'express';
import { getAllBookings, getHotelBookings, cancelBooking, getCancellationRequests, acceptCancellation, getBookingById, checkInBooking, getAvailableRooms, createWalkinBooking } from '../controllers/bookingController';
import { protect, superadmin } from '../middlewares/authMiddleware';
import multer from 'multer';

// Memory storage for Google Drive upload
const memoryUpload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/', protect, getAllBookings);
router.get('/cancellation-requests', protect, getCancellationRequests);
router.get('/hotel/:hotelId', protect, getHotelBookings);
router.get('/available-rooms', protect, getAvailableRooms);
router.post('/walkin', protect, memoryUpload.single('validId'), createWalkinBooking);
router.get('/:id', protect, getBookingById);
router.post('/:id/checkin', protect, memoryUpload.single('validId'), checkInBooking);
router.put('/:id/cancel', protect, cancelBooking);
router.post('/:id/accept-cancellation', protect, acceptCancellation);

export default router;
