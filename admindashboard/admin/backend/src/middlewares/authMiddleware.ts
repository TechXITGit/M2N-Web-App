import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

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

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const superadmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as superadmin' });
  }
};
