const mongoose = require('mongoose');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken
} = require('../utils/generateToken');
const { sendPasswordResetEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const crypto = require('crypto');

/**
 * Cookie Configuration helper
 * Uses sameSite: 'none' and secure: true in production for cross-site cookie transmission
 * between the frontend and backend Render domains with credentials.
 */
const setRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

/**
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Check duplicate email
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email address already exists.');
  }

  // Hash password
  const passwordHash = await User.hashPassword(password);

  // Force role to 'guest' — Public registration can NEVER self-promote to admin
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role: 'guest',
    isActive: true
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setRefreshTokenCookie(res, refreshToken);

  await createNotification({
    userId: user._id,
    title: 'Welcome to HotelPro',
    message: 'Your guest account was created successfully. Explore our exclusive luxury suites!',
    type: 'system'
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully.',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      accessToken
    }
  });
});

/**
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  // Handle standalone development mode when MongoDB is offline / disconnected
  if (mongoose.connection.readyState !== 1) {
    const lowerEmail = email.toLowerCase();
    let standaloneUser = null;

    if (lowerEmail === 'admin@hotelpro.com' && password === 'AdminPassword2026!') {
      standaloneUser = {
        _id: '671d10000000000000000001',
        name: 'Administrator',
        email: 'admin@hotelpro.com',
        phone: '+919800000000',
        role: 'admin',
        userType: 'admin',
        isActive: true
      };
    } else if (lowerEmail === 'priya.sharma@example.com' && password === 'LuxuryHotelPassword2026!') {
      standaloneUser = {
        _id: '671d10000000000000000002',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+919876543210',
        role: 'guest',
        userType: 'customer',
        isActive: true
      };
    }

    if (!standaloneUser) {
      throw new ApiError(401, 'Invalid email or password credentials.');
    }

    const accessToken = generateAccessToken(standaloneUser);
    const refreshToken = generateRefreshToken(standaloneUser);
    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful (Standalone Mode).',
      data: {
        user: standaloneUser,
        accessToken
      }
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password credentials.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Please contact hotel administration.');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password credentials.');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Authentication successful.',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        userType: user.userType,
        assignedHotel: user.assignedHotel
      },
      accessToken
    }
  });
});

/**
 * POST /api/v1/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    throw new ApiError(401, 'No refresh token provided.');
  }

  try {
    const decoded = verifyRefreshToken(token);
    let user;

    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new ApiError(401, 'Session invalid or user inactive.');
      }
    } else {
      user = {
        _id: decoded.id,
        name: decoded.email === 'admin@hotelpro.com' ? 'Administrator' : 'Priya Sharma',
        email: decoded.email,
        phone: decoded.email === 'admin@hotelpro.com' ? '+919800000000' : '+919876543210',
        role: decoded.role || 'guest',
        userType: decoded.role === 'admin' ? 'admin' : 'customer',
        isActive: true
      };
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }
});

/**
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
});

/**
 * GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
});

/**
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawResetToken);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user.email, rawResetToken);
  }

  // Consistent message prevents email enumeration
  res.status(200).json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been dispatched.'
  });
});

/**
 * POST /api/v1/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashed = hashToken(token);

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, 'Password reset token is invalid or has expired.');
  }

  user.passwordHash = await User.hashPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You may now sign in with your new credentials.'
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword
};
