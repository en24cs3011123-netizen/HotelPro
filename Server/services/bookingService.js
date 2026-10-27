const Booking = require('../models/Booking');
const Room = require('../models/Room');
const ApiError = require('../utils/ApiError');

/**
 * Calculates server-authoritative pricing
 */
const calculatePricing = (pricePerNight, checkIn, checkOut, numberOfRooms = 1) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const diffTime = Math.abs(checkOutDate - checkInDate);
  const numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  const subtotal = Math.round(pricePerNight * numberOfNights * numberOfRooms);
  // Standard 18% GST for hotel accommodations
  const taxes = Math.round(subtotal * 0.18);
  const fees = 0;
  const totalAmount = subtotal + taxes + fees;

  return {
    numberOfNights,
    pricePerNight,
    subtotal,
    taxes,
    fees,
    totalAmount
  };
};

/**
 * Checks room availability for a given date range
 */
const checkRoomAvailability = async ({ roomId, checkIn, checkOut, requestedRooms = 1 }) => {
  const room = await Room.findById(roomId);
  if (!room || !room.isActive) {
    throw new ApiError(404, 'Room not found or currently inactive.');
  }

  if (room.operationalStatus !== 'available') {
    return { available: false, remainingUnits: 0, room };
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const now = new Date();

  // Find conflicting reservations:
  // (checkIn < existingCheckOut) AND (checkOut > existingCheckIn)
  const conflictingBookings = await Booking.find({
    room: roomId,
    $or: [
      { bookingStatus: { $in: ['confirmed', 'checked_in'] } },
      { bookingStatus: 'pending', holdExpiresAt: { $gt: now } }
    ],
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate }
  });

  const bookedUnits = conflictingBookings.reduce((sum, b) => sum + (b.numberOfRooms || 1), 0);
  const remainingUnits = Math.max(0, (room.totalInventory || 1) - bookedUnits);

  return {
    available: remainingUnits >= requestedRooms,
    remainingUnits,
    totalInventory: room.totalInventory || 1,
    bookedUnits,
    room
  };
};

/**
 * Generates an alphanumeric reference code
 */
const generateBookingReference = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `HP-${new Date().getFullYear()}-${random}`;
};

/**
 * Creates temporary hold reservation
 */
const createBookingHold = async ({
  user,
  hotelId,
  roomId,
  checkIn,
  checkOut,
  numberOfGuests,
  numberOfRooms = 1,
  guestDetails
}) => {
  // 1. Verify date validity
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (checkOutDate <= checkInDate) {
    throw new ApiError(400, 'Check-out date must be strictly after check-in date.');
  }

  // 2. Verify availability
  const { available, remainingUnits, room } = await checkRoomAvailability({
    roomId,
    checkIn,
    checkOut,
    requestedRooms: numberOfRooms
  });

  if (!available) {
    throw new ApiError(
      409,
      `Requested room is fully booked for these dates. Only ${remainingUnits} unit(s) remaining.`
    );
  }

  if (numberOfGuests > room.capacity * numberOfRooms) {
    throw new ApiError(
      400,
      `Number of guests exceeds total room capacity (${room.capacity * numberOfRooms} max).`
    );
  }

  // 3. Compute server-side trusted pricing
  const pricing = calculatePricing(room.pricePerNight, checkIn, checkOut, numberOfRooms);

  // 4. Temporary 15-minute hold
  const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const bookingReference = generateBookingReference();

  const booking = await Booking.create({
    bookingReference,
    user: user._id,
    hotel: hotelId,
    room: roomId,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    numberOfGuests,
    numberOfRooms,
    numberOfNights: pricing.numberOfNights,
    pricePerNight: pricing.pricePerNight,
    subtotal: pricing.subtotal,
    taxes: pricing.taxes,
    fees: pricing.fees,
    totalAmount: pricing.totalAmount,
    currency: 'INR',
    bookingStatus: 'pending',
    paymentStatus: 'pending',
    guestDetails,
    holdExpiresAt
  });

  return booking;
};

module.exports = {
  calculatePricing,
  checkRoomAvailability,
  createBookingHold,
  generateBookingReference
};
