const mongoose = require('mongoose');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { checkRoomAvailability } = require('../services/bookingService');

const STANDALONE_ROOMS = [
  {
    _id: '671d20000000000000000001',
    roomNumber: '101',
    roomType: 'deluxe',
    type: 'deluxe',
    title: 'Executive Deluxe Suite',
    description: 'Sophisticated king room with sweeping skyline views, plush bedding, and marble bath.',
    pricePerNight: 8500,
    rent: 8500,
    capacity: 2,
    amenities: ['Free High-Speed Wi-Fi', 'King Bed', 'City View', 'Air Conditioning', 'Ensuite Marble Bathroom', 'Smart TV'],
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
    hotel: {
      _id: '671d10000000000000000099',
      name: 'The Grand Palace Hotel',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: '100 Marine Drive'
    },
    operationalStatus: 'available',
    isActive: true
  },
  {
    _id: '671d20000000000000000002',
    roomNumber: '202',
    roomType: 'suite',
    type: 'suite',
    title: 'Presidential Royal Suite',
    description: 'Expansive private suite with separate living area, panoramic balcony, and 24/7 dedicated butler service.',
    pricePerNight: 16000,
    rent: 16000,
    capacity: 4,
    amenities: ['Complimentary Champagne', 'Jacuzzi', 'Dedicated Butler', 'Ocean View', 'Balcony', 'Breakfast Included'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
    hotel: {
      _id: '671d10000000000000000099',
      name: 'The Grand Palace Hotel',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: '100 Marine Drive'
    },
    operationalStatus: 'available',
    isActive: true
  },
  {
    _id: '671d20000000000000000003',
    roomNumber: '305',
    roomType: 'single',
    type: 'single',
    title: 'Business Single Room',
    description: 'Compact, ultra-quiet room optimized for business travelers, featuring ergonomic workstation and espresso bar.',
    pricePerNight: 4500,
    rent: 4500,
    capacity: 1,
    amenities: ['Ergonomic Desk', 'High-Speed Wi-Speed Wi-Fi', 'Espresso Machine', 'Air Conditioning', 'Soundproof Windows'],
    images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'],
    hotel: {
      _id: '671d10000000000000000099',
      name: 'The Grand Palace Hotel',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: '100 Marine Drive'
    },
    operationalStatus: 'available',
    isActive: true
  }
];

/**
 * GET /api/v1/rooms
 */
const getRooms = asyncHandler(async (req, res) => {
  const { hotel, roomType, minPrice, maxPrice, capacity, page = 1, limit = 20 } = req.query;

  // Standalone fallback
  if (mongoose.connection.readyState !== 1) {
    let filtered = STANDALONE_ROOMS;
    if (roomType) filtered = filtered.filter((r) => r.roomType === roomType);
    if (capacity) filtered = filtered.filter((r) => r.capacity >= Number(capacity));
    if (minPrice) filtered = filtered.filter((r) => r.pricePerNight >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter((r) => r.pricePerNight <= Number(maxPrice));

    return res.status(200).json({
      success: true,
      data: filtered,
      meta: {
        page: 1,
        limit: 20,
        totalRecords: filtered.length,
        totalPages: 1
      }
    });
  }

  const filter = { isActive: true };
  if (hotel) filter.hotel = hotel;
  if (roomType) filter.roomType = roomType;
  if (capacity) filter.capacity = { $gte: Number(capacity) };
  if (minPrice || maxPrice) {
    filter.pricePerNight = {};
    if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
    if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [rooms, totalRecords] = await Promise.all([
    Room.find(filter)
      .populate('hotel', 'name city state address')
      .sort({ pricePerNight: 1 })
      .skip(skip)
      .limit(limitNum),
    Room.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: rooms,
    meta: {
      page: pageNum,
      limit: limitNum,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum) || 1
    }
  });
});

/**
 * GET /api/v1/rooms/:roomId
 */
const getRoomById = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const room = STANDALONE_ROOMS.find((r) => r._id === req.params.roomId) || STANDALONE_ROOMS[0];
    return res.status(200).json({
      success: true,
      data: room
    });
  }

  const room = await Room.findById(req.params.roomId).populate('hotel', 'name city address amenities policies');

  if (!room || !room.isActive) {
    throw new ApiError(404, 'Room not found.');
  }

  res.status(200).json({
    success: true,
    data: room
  });
});

/**
 * GET /api/v1/rooms/availability
 */
const checkAvailability = asyncHandler(async (req, res) => {
  const { hotelId, checkIn, checkOut, guests = 1, roomType } = req.query;

  const roomFilter = { isActive: true, operationalStatus: 'available' };
  if (hotelId) roomFilter.hotel = hotelId;
  if (roomType) roomFilter.roomType = roomType;
  if (guests) roomFilter.capacity = { $gte: Number(guests) };

  const rooms = await Room.find(roomFilter).populate('hotel', 'name city');
  const availableRooms = [];

  for (const room of rooms) {
    const status = await checkRoomAvailability({
      roomId: room._id,
      checkIn,
      checkOut,
      requestedRooms: 1
    });

    if (status.available) {
      availableRooms.push({
        ...room.toObject(),
        remainingUnits: status.remainingUnits
      });
    }
  }

  res.status(200).json({
    success: true,
    data: availableRooms,
    meta: {
      totalFound: availableRooms.length,
      checkIn,
      checkOut,
      guests: Number(guests)
    }
  });
});

/**
 * POST /api/v1/rooms (Admin only)
 */
const createRoom = asyncHandler(async (req, res) => {
  const { hotel, roomNumber } = req.body;

  const existingRoom = await Room.findOne({ hotel, roomNumber });
  if (existingRoom) {
    throw new ApiError(409, `Room ${roomNumber} already exists in this hotel.`);
  }

  const room = await Room.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Room inventory created successfully.',
    data: room
  });
});

/**
 * PATCH /api/v1/rooms/:roomId (Staff or Admin)
 */
const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.roomId, req.body, {
    new: true,
    runValidators: true
  });

  if (!room) {
    throw new ApiError(404, 'Room not found.');
  }

  res.status(200).json({
    success: true,
    message: 'Room updated successfully.',
    data: room
  });
});

/**
 * DELETE /api/v1/rooms/:roomId (Admin only)
 */
const deleteRoom = asyncHandler(async (req, res) => {
  // Safety rule: Do not delete if active future bookings exist
  const activeBookings = await Booking.findOne({
    room: req.params.roomId,
    bookingStatus: { $in: ['confirmed', 'checked_in'] },
    checkOut: { $gt: new Date() }
  });

  if (activeBookings) {
    throw new ApiError(
      409,
      'Cannot deactivate or delete room with active or upcoming confirmed reservations.'
    );
  }

  const room = await Room.findByIdAndUpdate(
    req.params.roomId,
    { isActive: false },
    { new: true }
  );

  if (!room) {
    throw new ApiError(404, 'Room not found.');
  }

  res.status(200).json({
    success: true,
    message: 'Room deactivated successfully.'
  });
});

module.exports = {
  getRooms,
  getRoomById,
  checkAvailability,
  createRoom,
  updateRoom,
  deleteRoom
};
