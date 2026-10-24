import express from 'express';
import { protect, superadmin } from '../middlewares/authMiddleware';
import {
  createReceptionist,
  getReceptionists,
  updateReceptionist,
  deleteReceptionist,
} from '../controllers/receptionistController';

const router = express.Router();
console.log('DEBUG receptionistRoutes:', { protect: !!protect, superadmin: !!superadmin, createReceptionist: !!createReceptionist });

router
  .route('/')
  .post(protect, superadmin, createReceptionist)
  .get(protect, superadmin, getReceptionists);

router
  .route('/:id')
  .put(protect, superadmin, updateReceptionist)
  .delete(protect, superadmin, deleteReceptionist);

export default router;
