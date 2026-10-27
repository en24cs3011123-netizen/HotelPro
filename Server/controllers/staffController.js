const Booking = require('../models/Booking');
const Room = require('../models/Room');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/staff/lookup
 */
const lookupReservation = asyncHandler(async (req, res) => {
  const { query, hotelId } = req.query;

  // Property scoping: staff must be assigned to this hotel
  const targetHotelId = req.user.role === 'staff' ? req.user.assignedHotel : hotelId;

  if (!targetHotelId && req.user.role === 'staff') {
    throw new ApiError(403, 'Forbidden: You have not been assigned to a hotel property.');
  }

  const filter = {};
  if (targetHotelId) filter.hotel = targetHotelId;

  if (query) {
    filter.$or = [
      { bookingReference: { $regex: new RegExp(query, 'i') } },
      { 'guestDetails.fullName': { $regex: new RegExp(query, 'i') } },
      { 'guestDetails.phone': { $regex: new RegExp(query, 'i') } }
    ];
  }

  const bookings = await Booking.find(filter)
    .populate('hotel', 'name')
    .populate('room', 'roomNumber roomType operationalStatus')
    .populate('user', 'name email phone')
    .sort({ checkIn: 1 })
    .limit(25);

  res.status(200).json({
    success: true,
    data: bookings
  });
});

/**
 * POST /api/v1/staff/check-in
 */
const checkIn = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (req.user.role === 'staff' && req.user.assignedHotel?.toString() !== booking.hotel.toString()) {
    throw new ApiError(403, 'Forbidden: This reservation belongs to another property.');
  }

  if (booking.bookingStatus !== 'confirmed') {
    throw new ApiError(
      400,
      `Cannot check-in booking with status '${booking.bookingStatus}'. Must be confirmed.`
    );
  }

  booking.bookingStatus = 'checked_in';
  await booking.save();

  // Update room operational status
  await Room.findByIdAndUpdate(booking.room, { operationalStatus: 'occupied' });

  res.status(200).json({
    success: true,
    message: 'Guest checked-in successfully.',
    data: booking
  });
});

/**
 * POST /api/v1/staff/check-out
 */
const checkOut = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (req.user.role === 'staff' && req.user.assignedHotel?.toString() !== booking.hotel.toString()) {
    throw new ApiError(403, 'Forbidden: This reservation belongs to another property.');
  }

  if (booking.bookingStatus !== 'checked_in') {
    throw new ApiError(
      400,
      `Cannot check-out booking with status '${booking.bookingStatus}'. Must be currently checked_in.`
    );
  }

  booking.bookingStatus = 'checked_out';
  await booking.save();

  // Flag room for housekeeping turnover
  await Room.findByIdAndUpdate(booking.room, { operationalStatus: 'maintenance' });

  res.status(200).json({
    success: true,
    message: 'Guest checked-out successfully. Room scheduled for housekeeping turnover.',
    data: booking
  });
});

module.exports = {
  lookupReservation,
  checkIn,
  checkOut
};
