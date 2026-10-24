import express from 'express';
import { protect, superadmin } from '../middlewares/authMiddleware';
import {
  createReceptionist,
  getReceptionists,
  updateReceptionist,
  deleteReceptionist,
} from '../controllers/receptionistController';

const router = express.Router();

router
  .route('/')
  .post(protect, superadmin, createReceptionist)
  .get(protect, superadmin, getReceptionists);

router
  .route('/:id')
  .put(protect, superadmin, updateReceptionist)
  .delete(protect, superadmin, deleteReceptionist);

export default router;
