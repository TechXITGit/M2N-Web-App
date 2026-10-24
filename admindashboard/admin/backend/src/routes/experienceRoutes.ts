import express, { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import {
  getExperiences,
  getExperienceById,
  createExperience,
  updateExperience,
  deleteExperience,
} from '../controllers/experienceController';

const router = express.Router();

/**
 * Flexible admin auth middleware:
 * Validates JWT in production, allows dev requests if token is absent/in-preview
 */
const flexibleAdminProtect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      if (decoded.role === 'superadmin') {
        req.user = { id: 'superadmin', _id: 'superadmin', role: 'superadmin', email: process.env.SUPERADMIN_EMAIL };
      } else {
        const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
        if (admin) {
          const { password, ...adminWithoutPassword } = admin;
          req.user = { ...adminWithoutPassword, _id: admin.id };
        }
      }
      return next();
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[experienceRoutes] Token verification skipped for local dev');
        return next();
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};

// Collection routes
router
  .route('/')
  .get(getExperiences)
  .post(flexibleAdminProtect, createExperience);

// Single item routes
router
  .route('/:id')
  .get(getExperienceById)
  .put(flexibleAdminProtect, updateExperience)
  .delete(flexibleAdminProtect, deleteExperience);

export default router;
