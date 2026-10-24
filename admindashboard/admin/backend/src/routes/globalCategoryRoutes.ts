import express from 'express';
import {
  createGlobalCategory,
  getGlobalCategories,
  updateGlobalCategory,
  archiveGlobalCategory,
  restoreGlobalCategory
} from '../controllers/globalCategoryController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/')
  .post(protect, createGlobalCategory)
  .get(protect, getGlobalCategories);

router.route('/:id')
  .put(protect, updateGlobalCategory)
  .delete(protect, archiveGlobalCategory);

router.route('/:id/restore')
  .put(protect, restoreGlobalCategory);

export default router;
