import express from 'express';
import { createHotel, getHotels, updateHotel, deleteHotel, restoreHotel, approveAction, rejectAction } from '../controllers/hotelController';
import { createRoomCategory, getRoomCategoriesByHotel, updateRoomCategory, deleteRoomCategory } from '../controllers/roomCategoryController';
import { protect } from '../middlewares/authMiddleware';
import { upload } from '../config/cloudinary';

const router = express.Router();

// Hotel routes
router.route('/')
  .post(protect, upload.array('images', 5), createHotel)
  .get(protect, getHotels);

router.route('/:id')
  .put(protect, upload.array('images', 5), updateHotel)
  .delete(protect, deleteHotel);

router.post('/:id/restore', protect, restoreHotel);

// Approval actions (public)
router.get('/action/approve/:token', approveAction);
router.get('/action/reject/:token', rejectAction);

// Room Category routes
router.route('/:hotelId/categories')
  .post(protect, upload.fields([{ name: 'images', maxCount: 5 }, { name: 'galleryImages', maxCount: 10 }]), createRoomCategory)
  .get(protect, getRoomCategoriesByHotel);

router.route('/:hotelId/categories/:categoryId')
  .put(protect, upload.fields([{ name: 'images', maxCount: 5 }, { name: 'galleryImages', maxCount: 10 }]), updateRoomCategory)
  .delete(protect, deleteRoomCategory);

export default router;
