const rateLimit = require('express-rate-limit');

/**
 * Standard API Rate Limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this client. Please retry after 15 minutes.'
  }
});

/**
 * Sensitive Authentication Limiter (Login, Register, Forgot Password)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 20, // generous in test, strict in production
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts. For your security, this action has been temporarily locked.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
