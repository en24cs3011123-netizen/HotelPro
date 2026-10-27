const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { createBookingHold } = require('../services/bookingService');
const { sendCancellationNotice } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

/**
 * POST /api/v1/bookings
 */
const createBooking = asyncHandler(async (req, res) => {
  const { hotel, room, checkIn, checkOut, numberOfGuests, numberOfRooms, guestDetails } = req.body;

  if (mongoose.connection.readyState !== 1) {
    const booking = {
      _id: '671d30000000000000000002',
      bookingReference: `HP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      hotel: hotel || '671d10000000000000000099',
      room: room || '671d20000000000000000001',
      checkIn,
      checkOut,
      numberOfGuests: numberOfGuests || 1,
      numberOfRooms: numberOfRooms || 1,
      totalAmount: 17000,
      bookingStatus: 'pending',
      paymentStatus: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    };

    return res.status(201).json({
      success: true,
      message: 'Temporary booking hold created (Standalone Mode).',
      data: booking
    });
  }

  // Derive identity from authenticated session, NEVER client-supplied ID
  const booking = await createBookingHold({
    user: req.user,
    hotelId: hotel,
    roomId: room,
    checkIn,
    checkOut,
    numberOfGuests,
    numberOfRooms,
    guestDetails
  });

  await createNotification({
    userId: req.user._id,
    title: 'Reservation Hold Created',
    message: `Your booking hold (${booking.bookingReference}) is active for 15 minutes. Complete payment to confirm.`,
    type: 'booking',
    metadata: { bookingId: booking._id, bookingReference: booking.bookingReference }
  });

  res.status(201).json({
    success: true,
    message: 'Temporary booking hold created. Please complete payment within 15 minutes.',
    data: booking
  });
});

/**
 * GET /api/v1/bookings/my
 */
const getMyBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json({
      success: true,
      data: [
        {
          _id: '671d30000000000000000001',
          bookingReference: 'HP-DEMO-7788',
          hotel: {
            _id: '671d10000000000000000099',
            name: 'The Grand Palace Hotel',
            city: 'Mumbai',
            address: '100 Marine Drive',
            contact: { phone: '+91 22 1234 5678', email: 'concierge@grandpalace.com' }
          },
          room: {
            _id: '671d20000000000000000001',
            roomNumber: '101',
            roomType: 'deluxe',
            pricePerNight: 8500
          },
          checkIn: new Date(Date.now() + 86400000 * 2).toISOString(),
          checkOut: new Date(Date.now() + 86400000 * 5).toISOString(),
          numberOfGuests: 2,
          totalAmount: 25500,
          bookingStatus: 'confirmed',
          paymentStatus: 'paid',
          createdAt: new Date().toISOString()
        }
      ],
      meta: {
        page: 1,
        limit: 20,
        totalRecords: 1,
        totalPages: 1
      }
    });
  }
  const filter = { user: req.user._id };

  if (status) {
    filter.bookingStatus = status;
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [bookings, totalRecords] = await Promise.all([
    Booking.find(filter)
      .populate('hotel', 'name city address contact images')
      .populate('room', 'roomNumber roomType pricePerNight images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Booking.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: bookings,
    meta: {
      page: pageNum,
      limit: limitNum,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum) || 1
    }
  });
});

/**
 * GET /api/v1/bookings/:bookingId
 */
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate('hotel', 'name city address contact policies amenities images')
    .populate('room', 'roomNumber roomType description amenities images pricePerNight')
    .populate('user', 'name email phone');

  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  // Authorization check: guest must own booking, staff must be assigned to hotel, or admin
  const isOwner = booking.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  const isAssignedStaff =
    req.user.role === 'staff' &&
    req.user.assignedHotel &&
    req.user.assignedHotel.toString() === booking.hotel._id.toString();

  if (!isOwner && !isAdmin && !isAssignedStaff) {
    throw new ApiError(403, 'Forbidden: You do not have permission to view this reservation.');
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

/**
 * PATCH /api/v1/bookings/:bookingId
 */
const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  const isOwner = booking.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'Forbidden: Cannot modify this reservation.');
  }

  // Guests can only update special requests or guest contact details
  if (isOwner && !isAdmin) {
    if (req.body.guestDetails) {
      booking.guestDetails = {
        ...booking.guestDetails,
        ...req.body.guestDetails
      };
    }
  } else if (isAdmin) {
    // Admin can update bookingStatus, paymentStatus, etc.
    if (req.body.bookingStatus) booking.bookingStatus = req.body.bookingStatus;
    if (req.body.paymentStatus) booking.paymentStatus = req.body.paymentStatus;
    if (req.body.guestDetails) booking.guestDetails = req.body.guestDetails;
  }

  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking updated successfully.',
    data: booking
  });
});

/**
 * POST /api/v1/bookings/:bookingId/cancel
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  const isOwner = booking.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'Forbidden: You do not own this reservation.');
  }

  if (booking.bookingStatus === 'cancelled') {
    throw new ApiError(400, 'This booking has already been cancelled.');
  }

  if (booking.bookingStatus === 'checked_out') {
    throw new ApiError(400, 'Cannot cancel a completed past reservation.');
  }

  // Update status and record cancellation details
  booking.bookingStatus = 'cancelled';
  booking.cancellationDetails = {
    cancelledAt: new Date(),
    reason: reason || 'Customer request',
    cancelledBy: req.user._id,
    refundAmount: booking.paymentStatus === 'paid' ? booking.totalAmount : 0
  };

  await booking.save();

  // Send cancellation email & notification
  await sendCancellationNotice(booking, booking.guestDetails.email);
  await createNotification({
    userId: booking.user,
    title: 'Booking Cancelled',
    message: `Reservation ${booking.bookingReference} was cancelled successfully.`,
    type: 'booking',
    metadata: { bookingId: booking._id }
  });

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully.',
    data: booking
  });
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBooking,
  cancelBooking
};
