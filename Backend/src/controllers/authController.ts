import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'feedants_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const signToken = (userId: string) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password, referralCode } = req.body;

  if (!name || !email || !phone || !password) {
    throw createError('name, email, phone and password are required', 400);
  }

  const exists = await User.findOne({ email });
  if (exists) throw createError('Email already registered', 409);

  // Find referrer
  let referredBy;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (referrer) {
      referredBy = referrer._id;
      // Credit referrer
      await User.findByIdAndUpdate(referrer._id, {
        $inc: { referralEarnings: 10 },
      });
    }
  }

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash: password,
    referredBy,
  });

  const token = signToken((user._id as any).toString());
  res.status(201).json({
    success: true,
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email, referralCode: user.referralCode },
    },
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw createError('email and password required', 400);

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw createError('Invalid credentials', 401);
  }

  const token = signToken((user._id as any).toString());
  res.json({
    success: true,
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email, referralCode: user.referralCode },
    },
  });
});

// GET /api/users/me
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw createError('User not found', 404);
  res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      referralCode: user.referralCode,
      referralEarnings: user.referralEarnings,
    },
  });
});
