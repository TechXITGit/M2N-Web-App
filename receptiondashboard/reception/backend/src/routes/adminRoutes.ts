import express from 'express';
import {
  createAdmin,
  getAdmins,
  updateAdmin,
  deleteAdmin,
  resetAdmin2FA,
} from '../controllers/adminController';
import { protect, superadmin } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/').post(protect, superadmin, createAdmin).get(protect, superadmin, getAdmins);
router
  .route('/:id')
  .put(protect, superadmin, updateAdmin)
  .delete(protect, superadmin, deleteAdmin);

router.post('/:id/reset-2fa', protect, superadmin, resetAdmin2FA);

export default router;
