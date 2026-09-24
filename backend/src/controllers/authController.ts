import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { removeAvatarFile } from '../services/fileStorage';
import { isValidEmail, normalizeEmail } from '../utils/emailValidator';
import { generateSecureToken, hashToken, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'study_assistant_super_secret_jwt_key_2026_antigravity';

// In-memory cooldown tracker for resending verification emails (1 minute cooldown per email)
const resendCooldowns = new Map<string, number>();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, standard } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Full Name is required' });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address (e.g., student@gmail.com).' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = normalizeEmail(email);

    // Check whether an account with this normalized email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in instead.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === 'ADMIN' ? 'ADMIN' : role === 'TEACHER' ? 'TEACHER' : 'STUDENT';
    const userStandard = standard || 'Standard 8';

    // Generate single-use expiring verification token
    const { rawToken, tokenHash, expiresAt } = generateSecureToken(24);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        role: userRole,
        emailVerified: false,
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
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
        emailVerified: true,
        createdAt: true
      }
    });

    // Send verification email to the user
    await sendVerificationEmail(normalizedEmail, rawToken, user.name);

    res.status(201).json({
      message: 'Account created. Please check your email and click the verification link before logging in.',
      email: normalizedEmail,
      unverified: true,
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
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!isValidEmail(email)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true }
    });

    // Do NOT reveal whether an email exists on login
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email has been verified
    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in.',
        unverified: true,
        email: normalizedEmail
      });
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
        avatarUrl: user.avatarUrl,
        mobileNumber: user.mobileNumber,
        emailVerified: user.emailVerified,
        profile: user.profile
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
};

/**
 * Verify user email using cryptographic token.
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const rawToken = (req.query.token as string) || req.body?.token;
    const emailParam = (req.query.email as string) || req.body?.email;

    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(400).json({
        status: 'INVALID_OR_EXPIRED',
        error: 'This verification link is invalid or has expired.'
      });
    }

    const tokenHash = hashToken(rawToken.trim());

    // Look for user with this token hash
    const user = await prisma.user.findFirst({
      where: { emailVerificationTokenHash: tokenHash }
    });

    if (!user) {
      // If token not found, check if user is already verified
      if (emailParam && typeof emailParam === 'string' && isValidEmail(emailParam)) {
        const checkUser = await prisma.user.findUnique({
          where: { email: normalizeEmail(emailParam) }
        });
        if (checkUser && checkUser.emailVerified) {
          return res.json({
            status: 'ALREADY_VERIFIED',
            message: 'Your email is already verified.',
            email: checkUser.email
          });
        }
      }

      return res.status(400).json({
        status: 'INVALID_OR_EXPIRED',
        error: 'This verification link is invalid or has expired.'
      });
    }

    // Check expiration
    if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
      return res.status(400).json({
        status: 'EXPIRED',
        error: 'This verification link is invalid or has expired.'
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.json({
        status: 'ALREADY_VERIFIED',
        message: 'Your email is already verified.',
        email: user.email
      });
    }

    // Mark as verified and invalidate token (single-use)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true
      }
    });

    res.json({
      status: 'SUCCESS',
      message: 'Email verified successfully.',
      email: updatedUser.email
    });
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

/**
 * Resend email verification link with rate limiting.
 */
export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Do NOT reveal non-existence (prevent user enumeration)
    if (!user) {
      return res.json({
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    // If already verified, inform user
    if (user.emailVerified) {
      return res.status(400).json({
        status: 'ALREADY_VERIFIED',
        error: 'Your email is already verified. Please log in.'
      });
    }

    // Rate limiting: 60 seconds cooldown
    const lastSent = resendCooldowns.get(normalizedEmail);
    if (lastSent && Date.now() - lastSent < 60000) {
      const waitSeconds = Math.ceil((60000 - (Date.now() - lastSent)) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSeconds} seconds before requesting another verification email.`
      });
    }

    // Generate new secure token and set expiration
    const { rawToken, tokenHash, expiresAt } = generateSecureToken(24);
    resendCooldowns.set(normalizedEmail, Date.now());

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt
      }
    });

    await sendVerificationEmail(user.email, rawToken, user.name);

    res.json({
      message: 'Verification email sent. Please check your inbox.',
      email: normalizedEmail
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
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
        avatarUrl: true,
        mobileNumber: true,
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

    const {
      name,
      mobileNumber,
      rollNumber,
      udiseCode,
      availableHoursPerDay,
      examDate,
      targetPercentage,
      standard
    } = req.body;

    const userUpdateData: any = {};
    if (name) userUpdateData.name = name;
    if (mobileNumber !== undefined) {
      userUpdateData.mobileNumber = mobileNumber ? String(mobileNumber).trim() : null;
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData
      });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    let updatedProfile = currentUser?.profile;

    if (currentUser?.role === 'STUDENT' || rollNumber !== undefined || udiseCode !== undefined || standard) {
      updatedProfile = await prisma.studentProfile.upsert({
        where: { userId },
        update: {
          standard: standard || undefined,
          rollNumber: rollNumber !== undefined ? (rollNumber ? String(rollNumber).trim() : null) : undefined,
          mobileNumber: mobileNumber !== undefined ? (mobileNumber ? String(mobileNumber).trim() : null) : undefined,
          udiseCode: udiseCode !== undefined ? (udiseCode ? String(udiseCode).trim() : null) : undefined,
          availableHoursPerDay: availableHoursPerDay !== undefined ? parseFloat(availableHoursPerDay) : undefined,
          examDate: examDate ? new Date(examDate) : undefined,
          targetPercentage: targetPercentage !== undefined ? parseFloat(targetPercentage) : undefined
        },
        create: {
          userId,
          standard: standard || 'Standard 8',
          rollNumber: rollNumber ? String(rollNumber).trim() : null,
          mobileNumber: mobileNumber ? String(mobileNumber).trim() : null,
          udiseCode: udiseCode ? String(udiseCode).trim() : null,
          availableHoursPerDay: availableHoursPerDay ? parseFloat(availableHoursPerDay) : 2.5,
          examDate: examDate ? new Date(examDate) : undefined,
          targetPercentage: targetPercentage ? parseFloat(targetPercentage) : 85.0
        }
      });
    }

    const freshUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        mobileNumber: true,
        createdAt: true,
        profile: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: freshUser,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const { rawToken, tokenHash, expiresAt } = generateSecureToken(1); // 1 hour for reset
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt
        }
      });
      await sendPasswordResetEmail(user.email, rawToken, user.name);
    }

    // Always return generic message to prevent email enumeration
    res.json({
      message: 'If an account exists for this email, password reset instructions have been sent.'
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

/**
 * Upload or update student / teacher profile picture (Avatar)
 */
export const uploadAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (currentUser?.avatarUrl) {
      removeAvatarFile(currentUser.avatarUrl);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        mobileNumber: true,
        profile: true
      }
    });

    res.json({
      message: 'Profile picture updated successfully',
      avatarUrl,
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Upload avatar error:', error);
    if (req.file) {
      removeAvatarFile(req.file.filename);
    }
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
};

/**
 * Remove student / teacher profile picture (Avatar)
 */
export const removeAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (currentUser?.avatarUrl) {
      removeAvatarFile(currentUser.avatarUrl);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        profile: true
      }
    });

    res.json({
      message: 'Profile picture removed successfully',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Remove avatar error:', error);
    res.status(500).json({ error: 'Failed to remove profile picture' });
  }
};
