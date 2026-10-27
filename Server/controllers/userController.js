const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/users/me
 */
const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
});

/**
 * PATCH /api/v1/users/me
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;

  // Never allow changing role or email directly here
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: {
      user
    }
  });
});

module.exports = {
  getProfile,
  updateProfile
};
