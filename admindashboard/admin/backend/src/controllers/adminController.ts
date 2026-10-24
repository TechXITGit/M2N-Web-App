import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

// @desc    Get all admins
// @route   GET /api/admin
// @access  Private/Superadmin
export const getAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        permissions: true,
        twoFactorEnabled: true,
        twoFactorVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });
    // Frontend might expect _id
    const formattedAdmins = admins.map(admin => ({
      ...admin,
      _id: admin.id
    }));
    res.json(formattedAdmins);
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// @desc    Create an admin
// @route   POST /api/admin
// @access  Private/Superadmin
export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, permissions } = req.body;

    const adminExists = await prisma.admin.findUnique({ where: { email } });

    if (adminExists) {
      res.status(400).json({ message: 'Admin already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        permissions: permissions || [],
      }
    });

    res.status(201).json({
      id: admin.id,
      _id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      phone: admin.phone,
      permissions: admin.permissions,
    });
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// @desc    Update admin (email, password, name)
// @route   PUT /api/admin/:id
// @access  Private/Superadmin
export const updateAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.params.id;
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });

    if (admin) {
      const updateData: any = {};
      
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.phone) updateData.phone = req.body.phone;
      if (req.body.permissions !== undefined) updateData.permissions = req.body.permissions;
      
      if (req.body.password) {
        updateData.password = await bcrypt.hash(req.body.password, 10);
      }

      const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: updateData
      });

      res.json({
        id: updatedAdmin.id,
        _id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        phone: updatedAdmin.phone,
        permissions: updatedAdmin.permissions,
      });
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// @desc    Delete admin
// @route   DELETE /api/admin/:id
// @access  Private/Superadmin
export const deleteAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.params.id;
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });

    if (admin) {
      await prisma.admin.delete({ where: { id: adminId } });
      res.json({ message: 'Admin removed' });
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// @desc    Reset 2FA for an admin
// @route   POST /api/admin/:id/reset-2fa
// @access  Private/Superadmin
export const resetAdmin2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.params.id;
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });

    if (admin) {
      await prisma.admin.update({
        where: { id: adminId },
        data: {
          twoFactorEnabled: false,
          twoFactorVerified: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: [],
          twoFactorSetupCompletedAt: null
        }
      });
      res.json({ message: '2FA has been reset for this admin' });
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};
