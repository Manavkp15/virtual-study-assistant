import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'study_assistant_super_secret_jwt_key_2026_antigravity';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, standard } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'STUDENT';
    const userStandard = standard || 'Standard 8';

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: userRole,
        profile: userRole === 'STUDENT' ? {
          create: {
            standard: userStandard,
            availableHoursPerDay: 2.5,
            targetPercentage: 85.0,
            streakCount: 1,
            lastActiveDate: new Date()
          }
        } : undefined
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update streak count if student
    if (user.role === 'STUDENT' && user.profile) {
      const now = new Date();
      const lastActive = new Date(user.profile.lastActiveDate);
      const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 3600);

      let newStreak = user.profile.streakCount;
      if (diffHours >= 24 && diffHours < 48) {
        newStreak += 1;
      } else if (diffHours >= 48) {
        newStreak = 1;
      }

      await prisma.studentProfile.update({
        where: { userId: user.id },
        data: {
          streakCount: newStreak,
          lastActiveDate: now
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        profile: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { availableHoursPerDay, examDate, targetPercentage, name, standard } = req.body;

    if (name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name }
      });
    }

    const updatedProfile = await prisma.studentProfile.upsert({
      where: { userId },
      update: {
        standard: standard || undefined,
        availableHoursPerDay: availableHoursPerDay !== undefined ? parseFloat(availableHoursPerDay) : undefined,
        examDate: examDate ? new Date(examDate) : undefined,
        targetPercentage: targetPercentage !== undefined ? parseFloat(targetPercentage) : undefined
      },
      create: {
        userId,
        standard: standard || 'Standard 8',
        availableHoursPerDay: availableHoursPerDay ? parseFloat(availableHoursPerDay) : 2.5,
        examDate: examDate ? new Date(examDate) : undefined,
        targetPercentage: targetPercentage ? parseFloat(targetPercentage) : 85.0
      }
    });

    res.json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: 'No account registered with this email address' });
  }

  // Demo reset
  res.json({ message: 'Password reset link sent to your email address (Simulated).' });
};
