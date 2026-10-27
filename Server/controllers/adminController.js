const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/admin/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;

  if (mongoose.connection.readyState !== 1) {
    const demoUsers = [
      {
        _id: '671d10000000000000000001',
        name: 'Administrator',
        email: 'admin@hotelpro.com',
        phone: '+919800000000',
        role: 'admin',
        userType: 'admin',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        _id: '671d10000000000000000002',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+919876543210',
        role: 'guest',
        userType: 'customer',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      data: demoUsers,
      meta: {
        page: 1,
        limit: 20,
        totalRecords: demoUsers.length,
        totalPages: 1
      }
    });
  }

  const filter = {};

  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: new RegExp(search, 'i') } },
      { email: { $regex: new RegExp(search, 'i') } },
      { phone: { $regex: new RegExp(search, 'i') } }
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [users, totalRecords] = await Promise.all([
    User.find(filter)
      .populate('assignedHotel', 'name city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: users,
    meta: {
      page: pageNum,
      limit: limitNum,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum) || 1
    }
  });
});

/**
 * PATCH /api/v1/admin/users/:id/status
 */
const updateUserRoleStatus = asyncHandler(async (req, res) => {
  const { role, isActive, assignedHotel } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString() && isActive === false) {
    throw new ApiError(400, 'Security constraint: You cannot deactivate your own administrative account.');
  }

  if (role) user.role = role;
  if (typeof isActive === 'boolean') user.isActive = isActive;
  if (assignedHotel !== undefined) user.assignedHotel = assignedHotel || null;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User account status updated successfully.',
    data: user
  });
});

/**
 * GET /api/v1/admin/bookings
 */
const getAllBookings = asyncHandler(async (req, res) => {
  const { status, hotelId, page = 1, limit = 20 } = req.query;

  if (mongoose.connection.readyState !== 1) {
    const demoBookings = [
      {
        _id: '671d30000000000000000001',
        bookingReference: 'HP-DEMO-7788',
        hotel: { name: 'The Grand Palace Hotel', city: 'Mumbai' },
        room: { roomNumber: '101', roomType: 'deluxe', pricePerNight: 8500 },
        user: { name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+919876543210' },
        checkIn: new Date(Date.now() + 86400000 * 2).toISOString(),
        checkOut: new Date(Date.now() + 86400000 * 5).toISOString(),
        numberOfGuests: 2,
        totalAmount: 25500,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        createdAt: new Date().toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      data: demoBookings,
      meta: {
        page: 1,
        limit: 20,
        totalRecords: demoBookings.length,
        totalPages: 1
      }
    });
  }

  const filter = {};

  if (status) filter.bookingStatus = status;
  if (hotelId) filter.hotel = hotelId;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [bookings, totalRecords] = await Promise.all([
    Booking.find(filter)
      .populate('hotel', 'name city')
      .populate('room', 'roomNumber roomType pricePerNight')
      .populate('user', 'name email phone')
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
 * PATCH /api/v1/admin/bookings/:bookingId/status
 */
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingStatus } = req.body;
  const booking = await Booking.findByIdAndUpdate(
    req.params.bookingId,
    { bookingStatus },
    { new: true, runValidators: true }
  );

  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  res.status(200).json({
    success: true,
    message: `Booking status updated to '${bookingStatus}'.`,
    data: booking
  });
});

/**
 * GET /api/v1/admin/reports/occupancy
 */
const getReports = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalHotels: 1,
          totalRooms: 3,
          totalUsers: 2,
          totalBookings: 1,
          confirmedBookings: 1,
          activeStays: 1,
          totalRevenue: 25500,
          occupancyRatePercentage: 33
        }
      }
    });
  }

  const [totalHotels, totalRooms, totalUsers, totalBookings] = await Promise.all([
    Hotel.countDocuments({ isActive: true }),
    Room.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: true }),
    Booking.countDocuments()
  ]);

  // Aggregate total confirmed revenue
  const revenueAggregation = await Booking.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
  ]);

  const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;

  // Active check-ins
  const activeStays = await Booking.countDocuments({ bookingStatus: 'checked_in' });
  const confirmedBookings = await Booking.countDocuments({ bookingStatus: 'confirmed' });

  const estimatedOccupancyRate =
    totalRooms > 0 ? Math.min(100, Math.round((activeStays / totalRooms) * 100)) : 0;

  res.status(200).json({
    success: true,
    data: {
      kpis: {
        totalHotels,
        totalRooms,
        totalUsers,
        totalBookings,
        confirmedBookings,
        activeStays,
        totalRevenue,
        occupancyRatePercentage: estimatedOccupancyRate
      }
    }
  });
});

module.exports = {
  getAllUsers,
  updateUserRoleStatus,
  getAllBookings,
  updateBookingStatus,
  getReports
};
