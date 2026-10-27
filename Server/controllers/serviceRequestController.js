const ServiceRequest = require('../models/ServiceRequest');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/service-requests
 */
const createRequest = asyncHandler(async (req, res) => {
  const { bookingId, requestType, description } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Forbidden: You do not own this reservation.');
  }

  const request = await ServiceRequest.create({
    booking: booking._id,
    hotel: booking.hotel,
    room: booking.room,
    guest: req.user._id,
    requestType,
    description
  });

  res.status(201).json({
    success: true,
    message: 'Service request dispatched to hotel concierge.',
    data: request
  });
});

/**
 * GET /api/v1/service-requests
 */
const getRequests = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'guest') {
    filter.guest = req.user._id;
  } else if (req.user.role === 'staff' && req.user.assignedHotel) {
    filter.hotel = req.user.assignedHotel;
  }

  const requests = await ServiceRequest.find(filter)
    .populate('hotel', 'name')
    .populate('room', 'roomNumber')
    .populate('guest', 'name phone')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: requests
  });
});

/**
 * PATCH /api/v1/service-requests/:id/status
 */
const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const request = await ServiceRequest.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, 'Service request not found.');
  }

  if (req.user.role === 'staff' && req.user.assignedHotel?.toString() !== request.hotel.toString()) {
    throw new ApiError(403, 'Forbidden: Request belongs to another hotel property.');
  }

  request.status = status;
  if (status === 'resolved' || status === 'in_progress') {
    request.handledBy = req.user._id;
  }
  await request.save();

  res.status(200).json({
    success: true,
    message: 'Service request status updated.',
    data: request
  });
});

module.exports = {
  createRequest,
  getRequests,
  updateRequestStatus
};
