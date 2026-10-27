const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate short-lived Access Token
 */
const generateAccessToken = (user) => {
  const secret = process.env.JWT_SECRET || 'hotelpro_jwt_default_secret_key_min_32_chars';
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn }
  );
};

/**
 * Generate long-lived Refresh Token
 */
const generateRefreshToken = (user) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'hotelpro_jwt_refresh_secret_key_min_32_chars';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn }
  );
};

/**
 * Verify Access Token
 */
const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET || 'hotelpro_jwt_default_secret_key_min_32_chars';
  return jwt.verify(token, secret);
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'hotelpro_jwt_refresh_secret_key_min_32_chars';
  return jwt.verify(token, secret);
};

/**
 * Hash one-time tokens (e.g., password reset tokens)
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken
};
