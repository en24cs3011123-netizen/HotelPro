const Review = require('../models/Review');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/reviews
 */
const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, title, comment } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  // Verification 1: Requester must be the guest who stayed
  if (booking.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Forbidden: You can only review stays booked by your account.');
  }

  // Verification 2: Review eligibility check: stay must be completed
  if (booking.bookingStatus !== 'checked_out') {
    throw new ApiError(
      400,
      'Review eligibility requirement: You may only submit a review after completing check-out.'
    );
  }

  // Verification 3: 1:1 check (single review per completed reservation)
  const existingReview = await Review.findOne({ booking: bookingId });
  if (existingReview) {
    throw new ApiError(409, 'You have already submitted a review for this completed stay.');
  }

  const review = await Review.create({
    booking: booking._id,
    user: req.user._id,
    hotel: booking.hotel,
    room: booking.room,
    rating,
    title,
    comment
  });

  res.status(201).json({
    success: true,
    message: 'Thank you for your feedback! Review published successfully.',
    data: review
  });
});

/**
 * GET /api/v1/reviews/hotel/:hotelId
 */
const getHotelReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const filter = { hotel: req.params.hotelId, status: 'published' };

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [reviews, totalRecords] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name')
      .populate('room', 'roomType roomNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: reviews,
    meta: {
      page: pageNum,
      limit: limitNum,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum) || 1
    }
  });
});

module.exports = {
  createReview,
  getHotelReviews
};
