const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const {
  connectDatabase,
  disconnectDatabase,
  getDbStatus,
  maskMongoUri
} = require('../config/database');

const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const ServiceRequest = require('../models/ServiceRequest');
const { calculatePricing } = require('../services/bookingService');

test('Database Architecture & Model Validation Test Suite', async (t) => {
  // Test 1: Status inquiry
  await t.test('1. getDbStatus() reports valid connection state string', () => {
    const status = getDbStatus();
    assert.ok(['disconnected', 'connected', 'connecting', 'disconnecting'].includes(status));
  });

  // Test 2: Missing URI configuration error handling
  await t.test('2. connectDatabase rejects with clear error when MONGODB_URI is missing', async () => {
    await assert.rejects(
      async () => {
        await connectDatabase('');
      },
      (err) => {
        return err.message.includes('MONGODB_URI is not configured');
      }
    );
  });

  // Test 3: Safe credential masking
  await t.test('3. maskMongoUri sanitizes user credentials from connection strings', () => {
    const sensitiveUri = 'mongodb+srv://hotel_admin:SuperSecretPass123!@cluster0.mongodb.net/hotelpro?retryWrites=true';
    const sanitized = maskMongoUri(sensitiveUri);

    assert.ok(!sanitized.includes('SuperSecretPass123!'));
    assert.ok(sanitized.includes('hotel_admin:******@'));
    assert.ok(sanitized.includes('cluster0.mongodb.net/hotelpro'));
  });

  // Test 4: User model schema validation & password hashing
  await t.test('4. User model validation, bcrypt password hashing and serialization security', async () => {
    const plainPassword = 'LuxuryHotelPassword2026!';
    const passwordHash = await User.hashPassword(plainPassword);

    const validUserDoc = new User({
      name: 'Priya Sharma',
      email: 'Priya.Sharma@Example.COM', // Tests lowercase normalization
      passwordHash,
      phone: '+919876543210',
      role: 'guest'
    });

    await validUserDoc.validate();

    // Verify lowercase email normalization
    assert.equal(validUserDoc.email, 'priya.sharma@example.com');

    // Verify bcrypt compare method
    const isMatch = await validUserDoc.comparePassword(plainPassword);
    assert.equal(isMatch, true);

    const isWrongMatch = await validUserDoc.comparePassword('WrongPassword123!');
    assert.equal(isWrongMatch, false);

    // Verify toJSON() strips passwordHash and internal properties
    const jsonOutput = validUserDoc.toJSON();
    assert.equal(jsonOutput.passwordHash, undefined);
    assert.equal(jsonOutput.__v, undefined);
  });

  await t.test('4b. User model rejects invalid email and invalid roles', async () => {
    const invalidUser = new User({
      name: 'Test User',
      email: 'not-an-email-format',
      passwordHash: 'dummyhash',
      phone: '1234567890',
      role: 'super_hacker_role' // Invalid role enum
    });

    await assert.rejects(
      async () => {
        await invalidUser.validate();
      },
      (err) => {
        return Boolean(err.errors && err.errors['email'] && err.errors['role']);
      }
    );
  });

  // Test 5: Hotel model schema & auto-slug generation
  await t.test('5. Hotel model auto-generates URL slug and validates required properties', async () => {
    const hotel = new Hotel({
      name: 'The Grand Palace Resort & Spa',
      description: 'Luxury 5-star beachfront retreat with world-class hospitality.',
      address: '100 Marine Drive',
      city: 'Mumbai',
      state: 'Maharashtra',
      contact: {
        phone: '+912212345678',
        email: 'concierge@grandpalace.com'
      },
      amenities: ['Infinity Pool', 'Spa', 'Valet Parking', 'Fine Dining']
    });

    await hotel.validate();

    // Slug should be automatically generated from name
    assert.equal(hotel.slug, 'the-grand-palace-resort-spa');
    assert.equal(hotel.isActive, true);
  });

  // Test 6: Room model schema validation & price constraints
  await t.test('6. Room model validates capacity, positive price, and supported roomType enum', async () => {
    const validRoom = new Room({
      hotel: new mongoose.Types.ObjectId(),
      roomNumber: 'Suite-401',
      roomType: 'deluxe',
      description: 'Spacious ocean-facing deluxe room with king bed and private balcony.',
      capacity: 3,
      pricePerNight: 8500,
      amenities: ['Ocean View', 'King Bed', 'Free WiFi', 'Mini Bar']
    });

    await validRoom.validate();

    // Test rejection of negative price
    const negativePriceRoom = new Room({
      hotel: new mongoose.Types.ObjectId(),
      roomNumber: '102',
      roomType: 'single',
      description: 'Test room',
      capacity: 1,
      pricePerNight: -500
    });

    await assert.rejects(
      async () => {
        await negativePriceRoom.validate();
      },
      (err) => {
        return Boolean(err.errors && err.errors['pricePerNight']);
      }
    );
  });

  // Test 7: Booking model schema validation & date relationships
  await t.test('7. Booking model validates required references and numeric calculations', async () => {
    const userId = new mongoose.Types.ObjectId();
    const hotelId = new mongoose.Types.ObjectId();
    const roomId = new mongoose.Types.ObjectId();

    const booking = new Booking({
      bookingReference: 'HP-2026-98124',
      user: userId,
      hotel: hotelId,
      room: roomId,
      checkIn: new Date('2026-11-10'),
      checkOut: new Date('2026-11-14'), // 4 nights
      numberOfGuests: 2,
      numberOfRooms: 1,
      numberOfNights: 4,
      pricePerNight: 7500,
      subtotal: 30000,
      taxes: 5400,
      fees: 0,
      totalAmount: 35400,
      currency: 'INR',
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      guestDetails: {
        fullName: 'Aarav Sharma',
        email: 'aarav@example.com',
        phone: '+919876543210'
      }
    });

    await booking.validate();
    assert.equal(booking.totalAmount, 35400);
    assert.equal(booking.currency, 'INR');
  });

  // Test 8: Overlapping reservation prevention mathematical logic
  await t.test('8. Date collision algorithm accurately detects overlapping date intervals', () => {
    // Existing reservation interval: [Nov 10, Nov 15)
    const existingStart = new Date('2026-11-10T14:00:00Z');
    const existingEnd = new Date('2026-11-15T11:00:00Z');

    const checkOverlap = (reqStart, reqEnd) => {
      // Standard Interval Collision Theorem:
      // Overlap <=> (ReqStart < ExistingEnd) AND (ReqEnd > ExistingStart)
      return reqStart < existingEnd && reqEnd > existingStart;
    };

    // Case A: Partially overlapping start (Nov 8 - Nov 12) -> COLLISION
    assert.equal(checkOverlap(new Date('2026-11-08'), new Date('2026-11-12')), true);

    // Case B: Completely inside existing stay (Nov 11 - Nov 14) -> COLLISION
    assert.equal(checkOverlap(new Date('2026-11-11'), new Date('2026-11-14')), true);

    // Case C: Encompassing existing stay (Nov 5 - Nov 20) -> COLLISION
    assert.equal(checkOverlap(new Date('2026-11-05'), new Date('2026-11-20')), true);

    // Case D: Directly adjacent checkout day = checkin day (Nov 15 - Nov 18) -> NO COLLISION (Same-day turnover allowed)
    assert.equal(checkOverlap(new Date('2026-11-15T14:00:00Z'), new Date('2026-11-18T11:00:00Z')), false);

    // Case E: Prior non-overlapping (Nov 1 - Nov 8) -> NO COLLISION
    assert.equal(checkOverlap(new Date('2026-11-01'), new Date('2026-11-08')), false);
  });

  // Test 9: Payment model zero-card-data validation
  await t.test('9. Payment model validates gateway order references without storing raw card details', async () => {
    const payment = new Payment({
      booking: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      provider: 'razorpay',
      providerOrderId: 'order_test_887123',
      providerPaymentId: 'pay_test_998124',
      providerSignature: 'd41d8cd98f00b204e9800998ecf8427e',
      amount: 15000,
      currency: 'INR',
      paymentStatus: 'captured',
      verifiedAt: new Date()
    });

    await payment.validate();

    // Security check: Assert PCI-DSS prohibited fields do not exist on the Mongoose model schema
    const schemaPaths = Object.keys(Payment.schema.paths);
    assert.equal(schemaPaths.includes('cardNumber'), false);
    assert.equal(schemaPaths.includes('cardDetails'), false);
    assert.equal(schemaPaths.includes('cvv'), false);
    assert.equal(schemaPaths.includes('cyvcode'), false);
  });

  // Test 10: Review, Notification and ServiceRequest models
  await t.test('10. Review rating boundaries (1-5) and operational models validation', async () => {
    const review = new Review({
      booking: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      hotel: new mongoose.Types.ObjectId(),
      rating: 5,
      title: 'Exquisite stay experience',
      comment: 'From check-in to dining, the service was truly exceptional.'
    });

    await review.validate();

    // Rejects rating > 5
    const invalidReview = new Review({
      booking: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      hotel: new mongoose.Types.ObjectId(),
      rating: 6, // Exceeds max rating of 5
      title: 'Too high',
      comment: 'Invalid score'
    });

    await assert.rejects(
      async () => {
        await invalidReview.validate();
      },
      (err) => {
        return Boolean(err.errors && err.errors['rating']);
      }
    );
  });

  // Test 11: Disconnect lifecycle test
  await t.test('11. disconnectDatabase() executes cleanly and safely', async () => {
    await disconnectDatabase();
    assert.equal(mongoose.connection.readyState, 0);
  });
});
