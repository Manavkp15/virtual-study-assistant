import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { removeAvatarFile, AVATARS_UPLOAD_DIR, persistFile, deletePersistedFile } from '../services/fileStorage';
import { isValidEmail, normalizeEmail } from '../utils/emailValidator';
import { generateSecureToken, hashToken, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';
import {
  ensureSubjectInDatabase,
  getCanonicalSubjectName,
  isValidTeacherSubject,
  TEACHER_SUBJECTS,
  getTeacherAssignedSubjects
} from '../utils/subjectConstants';

const JWT_SECRET = process.env.JWT_SECRET || 'study_assistant_super_secret_jwt_key_2026_antigravity';

// In-memory cooldown tracker for resending verification emails (1 minute cooldown per email)
const resendCooldowns = new Map<string, number>();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, standard, subject, teacherSubject } = req.body;

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

    // REQUIREMENT: One teacher can teach multiple subjects.
    // The teacher MUST select at least one subject.
    // Validation: "Please select at least one subject." / "કૃપા કરીને ઓછામાં ઓછો એક વિષય પસંદ કરો."
    let teacherSubjectList: string[] = [];
    if (userRole === 'TEACHER') {
      const { subjects, teachingSubjects, teacherSubjects: bodyTeacherSubjects } = req.body;
      const rawList = subjects || bodyTeacherSubjects || teachingSubjects || subject || teacherSubject;

      if (Array.isArray(rawList)) {
        teacherSubjectList = rawList.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof rawList === 'string' && rawList.trim()) {
        teacherSubjectList = rawList.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (teacherSubjectList.length === 0) {
        return res.status(400).json({
          error: 'Please select at least one subject.',
          messageGu: 'કૃપા કરીને ઓછામાં ઓછો એક વિષય પસંદ કરો.'
        });
      }

      // Validate each subject is in the 7 allowed canonical subjects
      const validCanonicalSubjects: string[] = [];
      for (const raw of teacherSubjectList) {
        if (!isValidTeacherSubject(raw)) {
          return res.status(400).json({
            error: `Invalid subject: "${raw}". Allowed subjects are: ${TEACHER_SUBJECTS.map(s => s.name).join(', ')}`,
            messageGu: 'અમાન્ય વિષય પસંદ કર્યો છે.'
          });
        }
        validCanonicalSubjects.push(getCanonicalSubjectName(raw));
      }
      teacherSubjectList = Array.from(new Set(validCanonicalSubjects));
    }

    const primarySubject = teacherSubjectList.length > 0 ? teacherSubjectList[0] : null;

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        role: userRole,
        teacherSubject: primarySubject,
        teachingSubjects: teacherSubjectList.join(', '),
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
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
        teacherSubject: true,
        teachingSubjects: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Auto-link teacher to all assigned subjects in TeacherSubject and TeacherSubjectMapping
    if (userRole === 'TEACHER' && teacherSubjectList.length > 0) {
      try {
        for (const subName of teacherSubjectList) {
          const sub = await ensureSubjectInDatabase(prisma, subName);
          if (sub) {
            await prisma.teacherSubject.upsert({
              where: {
                teacherId_subjectId: {
                  teacherId: user.id,
                  subjectId: sub.id
                }
              },
              create: {
                teacherId: user.id,
                subjectId: sub.id
              },
              update: {}
            });
            await prisma.teacherSubjectMapping.upsert({
              where: {
                teacherId_subjectId: {
                  teacherId: user.id,
                  subjectId: sub.id
                }
              },
              create: {
                teacherId: user.id,
                subjectId: sub.id
              },
              update: {}
            });
          }
        }
      } catch (mappingErr) {
        console.warn('Auto teacher subject mapping warning:', mappingErr);
      }
    }

    res.status(201).json({
      message: 'Account created successfully! You can now log in.',
      email: normalizedEmail,
      unverified: false,
      user: {
        ...user,
        subjects: teacherSubjectList
      }
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
      include: {
        profile: true,
        teacherSubjects: {
          include: { subject: true }
        },
        subjectMappings: {
          include: { subject: true }
        }
      }
    });

    // Do NOT reveal whether an email exists on login
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // If user's email was not marked verified previously, auto-mark it as verified on successful login
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          emailVerificationTokenHash: null,
          emailVerificationExpiresAt: null
        }
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

    // Collect all assigned subjects for teacher
    const tsSubjectObjs = (user.teacherSubjects || []).map(ts => ts.subject);
    const smSubjectObjs = (user.subjectMappings || []).map(sm => sm.subject);
    const combinedObjs = tsSubjectObjs.length > 0 ? tsSubjectObjs : smSubjectObjs;

    let assignedSubjects: string[] = Array.from(new Set(combinedObjs.map(s => s.name)));
    if (assignedSubjects.length === 0 && (user.teachingSubjects || user.teacherSubject)) {
      const raw = user.teachingSubjects || user.teacherSubject || '';
      assignedSubjects = Array.from(new Set(raw.split(',').map(s => s.trim()).filter(Boolean)));
    }

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
        teachingSubjects: assignedSubjects.join(', ') || user.teachingSubjects,
        teacherSubject: assignedSubjects[0] || user.teacherSubject,
        subjects: assignedSubjects,
        teacherSubjects: combinedObjs,
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

    const emailResult = await sendVerificationEmail(user.email, rawToken, user.name);

    res.json({
      message: 'Verification email sent. Please check your inbox.',
      email: normalizedEmail,
      verificationUrl: emailResult.verificationUrl,
      simulated: emailResult.simulated
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
};

/**
 * Instant verification for development / fallback mode or direct verification from login page.
 */
export const quickVerify = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.emailVerified) {
      return res.json({
        status: 'ALREADY_VERIFIED',
        message: 'Your email is already verified.',
        email: user.email
      });
    }

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
    console.error('Quick verify error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
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
        teachingSubjects: true,
        teacherSubject: true,
        createdAt: true,
        profile: true,
        teacherSubjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                nameGu: true,
                code: true,
                standard: true,
                icon: true,
                description: true,
                descriptionGu: true
              }
            }
          }
        },
        subjectMappings: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                nameGu: true,
                code: true,
                standard: true,
                icon: true,
                description: true,
                descriptionGu: true
              }
            }
          }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Collect all assigned subjects
    const tsSubjectObjs = (user.teacherSubjects || []).map(ts => ts.subject);
    const smSubjectObjs = (user.subjectMappings || []).map(sm => sm.subject);
    const combinedObjs = tsSubjectObjs.length > 0 ? tsSubjectObjs : smSubjectObjs;

    let assignedSubjects: string[] = Array.from(new Set(combinedObjs.map(s => s.name)));
    if (assignedSubjects.length === 0 && (user.teachingSubjects || user.teacherSubject)) {
      const raw = user.teachingSubjects || user.teacherSubject || '';
      assignedSubjects = Array.from(new Set(raw.split(',').map(s => s.trim()).filter(Boolean)));
    }

    res.json({
      user: {
        ...user,
        subjects: assignedSubjects,
        teacherSubjects: combinedObjs,
        teachingSubjects: assignedSubjects.join(', ') || user.teachingSubjects,
        teacherSubject: assignedSubjects[0] || user.teacherSubject
      }
    });
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
      standard,
      teachingSubjects,
      teacherSubject,
      subject,
      subjectIds
    } = req.body;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const isTeacher = currentUser.role === 'TEACHER' || currentUser.role === 'ADMIN';

    const userUpdateData: any = {};
    if (name && typeof name === 'string' && name.trim()) {
      userUpdateData.name = name.trim();
    }

    if (isTeacher) {
      // Extract subjects list from subjects, teacherSubjects, teachingSubjects, subject, or subjectIds
      const incomingList = req.body.subjects !== undefined
        ? req.body.subjects
        : req.body.teacherSubjects !== undefined
        ? req.body.teacherSubjects
        : req.body.subjectIds !== undefined
        ? req.body.subjectIds
        : req.body.subject !== undefined
        ? req.body.subject
        : req.body.teachingSubjects;

      if (incomingList !== undefined) {
        let requestedSubjects: string[] = [];
        if (Array.isArray(incomingList)) {
          requestedSubjects = incomingList.map(s => String(s).trim()).filter(Boolean);
        } else if (typeof incomingList === 'string' && incomingList.trim()) {
          requestedSubjects = incomingList.split(',').map(s => s.trim()).filter(Boolean);
        }

        // VALIDATION: Teacher MUST have at least one subject!
        if (requestedSubjects.length === 0) {
          return res.status(400).json({
            error: 'Please select at least one subject.',
            messageGu: 'કૃપા કરીને ઓછામાં ઓછો એક વિષય પસંદ કરો.'
          });
        }

        // Validate subjects against canonical subjects (support ID or name)
        const canonicalNames: string[] = [];
        const subjectRecordIds: string[] = [];

        for (const item of requestedSubjects) {
          const matchedById = await prisma.subject.findUnique({ where: { id: item } });
          if (matchedById) {
            if (!isValidTeacherSubject(matchedById.name)) {
              return res.status(400).json({
                error: `Invalid subject: "${matchedById.name}". Allowed subjects are: ${TEACHER_SUBJECTS.map(s => s.name).join(', ')}`,
                messageGu: 'અમાન્ય વિષય પસંદ કર્યો છે.'
              });
            }
            canonicalNames.push(getCanonicalSubjectName(matchedById.name));
            subjectRecordIds.push(matchedById.id);
          } else {
            if (!isValidTeacherSubject(item)) {
              return res.status(400).json({
                error: `Invalid subject: "${item}". Allowed subjects are: ${TEACHER_SUBJECTS.map(s => s.name).join(', ')}`,
                messageGu: 'અમાન્ય વિષય પસંદ કર્યો છે.'
              });
            }
            const cName = getCanonicalSubjectName(item);
            canonicalNames.push(cName);
            const sub = await ensureSubjectInDatabase(prisma, cName);
            if (sub) subjectRecordIds.push(sub.id);
          }
        }

        const uniqueNames = Array.from(new Set(canonicalNames));
        const uniqueIds = Array.from(new Set(subjectRecordIds));

        userUpdateData.teacherSubject = uniqueNames[0] || null;
        userUpdateData.teachingSubjects = uniqueNames.join(', ');

        // Synchronize TeacherSubject table
        await prisma.teacherSubject.deleteMany({ where: { teacherId: userId } });
        for (const sid of uniqueIds) {
          await prisma.teacherSubject.create({
            data: { teacherId: userId, subjectId: sid }
          });
        }

        // Synchronize TeacherSubjectMapping table
        await prisma.teacherSubjectMapping.deleteMany({ where: { teacherId: userId } });
        for (const sid of uniqueIds) {
          await prisma.teacherSubjectMapping.create({
            data: { teacherId: userId, subjectId: sid }
          });
        }
      }
    } else {
      if (teachingSubjects !== undefined) {
        if (typeof teachingSubjects === 'string') {
          userUpdateData.teachingSubjects = teachingSubjects.trim() || null;
        } else if (Array.isArray(teachingSubjects)) {
          userUpdateData.teachingSubjects = JSON.stringify(teachingSubjects);
        } else {
          userUpdateData.teachingSubjects = null;
        }
      }
    }

    // Mobile number is only updated for students; for teachers it is omitted
    if (!isTeacher && mobileNumber !== undefined) {
      userUpdateData.mobileNumber = mobileNumber ? String(mobileNumber).trim() : null;
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData
      });
    }

    // Student profile updates (only for students)
    let updatedProfile = currentUser?.profile;
    if (!isTeacher) {
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
        teachingSubjects: true,
        teacherSubject: true,
        createdAt: true,
        profile: true,
        teacherSubjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                nameGu: true,
                code: true,
                standard: true,
                icon: true,
                description: true,
                descriptionGu: true
              }
            }
          }
        },
        subjectMappings: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                nameGu: true,
                code: true,
                standard: true,
                icon: true,
                description: true,
                descriptionGu: true
              }
            }
          }
        }
      }
    });

    const tsSubjectObjs = (freshUser?.teacherSubjects || []).map(ts => ts.subject);
    const smSubjectObjs = (freshUser?.subjectMappings || []).map(sm => sm.subject);
    const combinedObjs = tsSubjectObjs.length > 0 ? tsSubjectObjs : smSubjectObjs;

    let assignedSubjects: string[] = Array.from(new Set(combinedObjs.map(s => s.name)));
    if (assignedSubjects.length === 0 && (freshUser?.teachingSubjects || freshUser?.teacherSubject)) {
      const raw = freshUser?.teachingSubjects || freshUser?.teacherSubject || '';
      assignedSubjects = Array.from(new Set(raw.split(',').map(s => s.trim()).filter(Boolean)));
    }

    const formattedUser = freshUser ? {
      ...freshUser,
      subjects: assignedSubjects,
      teacherSubjects: combinedObjs,
      teachingSubjects: assignedSubjects.join(', ') || freshUser.teachingSubjects,
      teacherSubject: assignedSubjects[0] || freshUser.teacherSubject
    } : null;

    res.json({
      message: isTeacher ? 'Teacher profile updated successfully' : 'Profile updated successfully',
      user: formattedUser,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Get all available subjects along with teacher's currently mapped subjects
 */
export const getTeacherSubjectMappings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [allSubjects, mappings] = await Promise.all([
      prisma.subject.findMany({
        orderBy: [{ standard: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: {
              chapters: true,
              tests: true,
              homeworks: true,
              studyMaterials: true
            }
          }
        }
      }),
      prisma.teacherSubject.findMany({
        where: { teacherId: userId },
        include: { subject: true }
      })
    ]);

    const mappedSubjectIds = mappings.map(m => m.subjectId);

    res.json({
      allSubjects,
      mappings,
      mappedSubjectIds
    });
  } catch (error) {
    console.error('getTeacherSubjectMappings error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher subject mappings' });
  }
};

/**
 * Update teacher's mapped subjects
 */
export const updateTeacherSubjectMappings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { subjectIds, subjects } = req.body;
    const rawIds = Array.isArray(subjectIds) ? subjectIds : Array.isArray(subjects) ? subjects : [];

    if (rawIds.length === 0) {
      return res.status(400).json({
        error: 'Please select at least one subject.',
        messageGu: 'કૃપા કરીને ઓછામાં ઓછો એક વિષય પસંદ કરો.'
      });
    }

    const validSubjects = await prisma.subject.findMany({
      where: {
        OR: [
          { id: { in: rawIds.map(String) } },
          { name: { in: rawIds.map(String) } }
        ]
      },
      select: { id: true, name: true }
    });

    if (validSubjects.length === 0) {
      return res.status(400).json({
        error: 'Please select at least one subject.',
        messageGu: 'કૃપા કરીને ઓછામાં ઓછો એક વિષય પસંદ કરો.'
      });
    }

    // Verify all belong to the 7 canonical subjects
    for (const vs of validSubjects) {
      if (!isValidTeacherSubject(vs.name)) {
        return res.status(400).json({
          error: `Invalid subject: "${vs.name}". Allowed subjects are: ${TEACHER_SUBJECTS.map(s => s.name).join(', ')}`,
          messageGu: 'અમાન્ય વિષય પસંદ કર્યો છે.'
        });
      }
    }

    const canonicalNames = validSubjects.map(s => getCanonicalSubjectName(s.name));

    await prisma.user.update({
      where: { id: userId },
      data: {
        teacherSubject: canonicalNames[0],
        teachingSubjects: canonicalNames.join(', ')
      }
    });

    await prisma.teacherSubject.deleteMany({ where: { teacherId: userId } });
    await prisma.teacherSubjectMapping.deleteMany({ where: { teacherId: userId } });

    for (const sub of validSubjects) {
      await prisma.teacherSubject.create({
        data: { teacherId: userId, subjectId: sub.id }
      });
      await prisma.teacherSubjectMapping.create({
        data: { teacherId: userId, subjectId: sub.id }
      });
    }

    const updatedMappings = await prisma.teacherSubject.findMany({
      where: { teacherId: userId },
      include: { subject: true }
    });

    res.json({
      message: 'Subject mappings updated successfully',
      mappings: updatedMappings,
      mappedSubjectIds: updatedMappings.map(m => m.subjectId),
      subjects: canonicalNames
    });
  } catch (error) {
    console.error('updateTeacherSubjectMappings error:', error);
    res.status(500).json({ error: 'Failed to update teacher subject mappings' });
  }
};

/**
 * Get assigned subjects for authenticated teacher
 */
export const getTeacherAssignedSubjectsList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const subjects = await getTeacherAssignedSubjects(prisma, userId);
    res.json({ subjects });
  } catch (error) {
    console.error('getTeacherAssignedSubjectsList error:', error);
    res.status(500).json({ error: 'Failed to fetch assigned subjects' });
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
      await deletePersistedFile(currentUser.avatarUrl, AVATARS_UPLOAD_DIR);
    }

    await persistFile(req.file.path, req.file.filename, req.file.mimetype, req.file.originalname);

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
      await deletePersistedFile(currentUser.avatarUrl, AVATARS_UPLOAD_DIR);
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
