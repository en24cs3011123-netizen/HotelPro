const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/hotels
 */
const getHotels = asyncHandler(async (req, res) => {
  const { city, search, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };

  if (city) {
    filter.city = { $regex: new RegExp(city, 'i') };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: new RegExp(search, 'i') } },
      { description: { $regex: new RegExp(search, 'i') } },
      { city: { $regex: new RegExp(search, 'i') } }
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [hotels, totalRecords] = await Promise.all([
    Hotel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Hotel.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: hotels,
    meta: {
      page: pageNum,
      limit: limitNum,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum) || 1
    }
  });
});

/**
 * GET /api/v1/hotels/:hotelId
 */
const getHotelById = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;

  let hotel;
  if (hotelId.match(/^[0-9a-fA-F]{24}$/)) {
    hotel = await Hotel.findById(hotelId);
  } else {
    hotel = await Hotel.findOne({ slug: hotelId });
  }

  if (!hotel || !hotel.isActive) {
    throw new ApiError(404, 'Hotel property not found.');
  }

  const rooms = await Room.find({ hotel: hotel._id, isActive: true });

  res.status(200).json({
    success: true,
    data: {
      hotel,
      rooms
    }
  });
});

/**
 * POST /api/v1/hotels (Admin only)
 */
const createHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Hotel property registered successfully.',
    data: hotel
  });
});

/**
 * PATCH /api/v1/hotels/:hotelId (Admin only)
 */
const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(req.params.hotelId, req.body, {
    new: true,
    runValidators: true
  });

  if (!hotel) {
    throw new ApiError(404, 'Hotel not found.');
  }

  res.status(200).json({
    success: true,
    message: 'Hotel property updated successfully.',
    data: hotel
  });
});

/**
 * DELETE /api/v1/hotels/:hotelId (Admin only - soft delete)
 */
const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(
    req.params.hotelId,
    { isActive: false },
    { new: true }
  );

  if (!hotel) {
    throw new ApiError(404, 'Hotel not found.');
  }

  res.status(200).json({
    success: true,
    message: 'Hotel property deactivated successfully.'
  });
});

module.exports = {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel
};
