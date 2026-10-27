const mongoose = require('mongoose');
const { verifyAccessToken } = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Authentication Middleware: Verifies Bearer JWT or Cookie and attaches authenticated User
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      // 2. Check HttpOnly Cookie fallback
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new ApiError(401, 'Authentication required. No token provided.'));
    }

    // 3. Cryptographically verify token
    const decoded = verifyAccessToken(token);

    // 4. Fetch User record from database if connected
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user) {
        return next(new ApiError(401, 'User account no longer exists.'));
      }

      if (!user.isActive) {
        return next(new ApiError(403, 'Your account has been deactivated. Please contact support.'));
      }

      req.user = user;
    } else {
      // Standalone / Test mode fallback: attach verified identity from cryptographic token
      req.user = {
        _id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'guest',
        isActive: true
      };
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(error);
    }
    return next(new ApiError(401, 'Authentication failed.'));
  }
};

module.exports = authenticate;
