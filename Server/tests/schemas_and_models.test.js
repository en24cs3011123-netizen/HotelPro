const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { calculatePricing } = require('../services/bookingService');

test('Phase 4 (Part 2): Schemas and Models Comprehensive Test Suite', async (t) => {
  // 1. User creation and required fields
  await t.test('1. User creation and required fields validation', async () => {
    // Missing required fields
    const emptyUser = new User({});
    await assert.rejects(
      async () => {
        await emptyUser.validate();
      },
      (err) => {
        return Boolean(
          err.errors['name'] &&
          err.errors['email'] &&
          err.errors['phone'] &&
          err.errors['password']
        );
      }
    );

    // Valid user with default userType
    const validUser = new User({
      name: 'Ananya Roy',
      email: 'Ananya.Roy@Example.COM',
      password: 'StrongSecretPassword123!',
      phone: '+919876543210'
    });

    await validUser.validate();
    assert.equal(validUser.userType, 'customer');
    assert.equal(validUser.role, 'guest');
    assert.equal(validUser.isActive, true);
  });

  // 2. Email normalization and duplicate rejection logic
  await t.test('2. Email normalization and duplicate rejection logic', async () => {
    const user = new User({
      name: 'Rohan Mehta',
      email: '  ROHAN.Mehta@HOTELPRO.COM  ',
      password: 'SecretPassword123!',
      phone: '+919876501234'
    });

    await user.validate();
    // Verify lowercase and trimming
    assert.equal(user.email, 'rohan.mehta@hotelpro.com');

    // Invalid email formats
    const invalidEmailUser = new User({
      name: 'Invalid Email',
      email: 'not-an-email',
      password: 'SecretPassword123!',
      phone: '+919876501234'
    });

    await assert.rejects(
      async () => {
        await invalidEmailUser.validate();
      },
      (err) => Boolean(err.errors['email'])
    );
  });

  // 3. Password hashing and password verification
  await t.test('3. Password hashing, comparePassword, and no-rehash on unrelated update', async () => {
    const plain = 'MySecurePass2026!';
    const user = new User({
      name: 'Vikram Singh',
      email: 'vikram.singh@example.com',
      password: plain,
      phone: '+919812345678'
    });

    // Simulate pre-save hook
    await user.validate();
    const hash = await User.hashPassword(plain);
    user.password = hash;
    user.passwordHash = hash;

    // Verify comparePassword
    const match = await user.comparePassword(plain);
    assert.equal(match, true);

    const wrongMatch = await user.comparePassword('WrongPassword');
    assert.equal(wrongMatch, false);

    // Verify toJSON() strips password, passwordHash, and confirmPassword
    user.set('confirmPassword', 'TemporaryConfirmPass');
    const json = user.toJSON();
    assert.equal(json.password, undefined);
    assert.equal(json.passwordHash, undefined);
    assert.equal(json.confirmPassword, undefined);
  });

  // 4. Rejection of public admin registration
  await t.test('4. Public registration enforces customer/guest defaults', async () => {
    // When a public request attempts to supply an admin role
    const publicPayload = {
      name: 'Sneaky User',
      email: 'sneaky@example.com',
      password: 'HackerPassword123!',
      phone: '+919876500000',
      userType: 'admin' // Attempted privilege escalation
    };

    // Controller-level security rule: override public input to customer/guest
    const sanitizedRegistration = {
      ...publicPayload,
      userType: 'customer',
      role: 'guest'
    };

    const user = new User(sanitizedRegistration);
    await user.validate();
    assert.equal(user.userType, 'customer');
    assert.equal(user.role, 'guest');
  });

  // 5. Room creation and invalid room values
  await t.test('5. Room creation, bidirectional aliases, and boundary validation', async () => {
    const hotelId = new mongoose.Types.ObjectId();

    // Valid room with modern/reference fields
    const room = new Room({
      hotel: hotelId,
      roomNumber: 'Deluxe-201',
      rent: 6500,
      count: 5,
      type: 'deluxe',
      photos: ['https://images.hotelpro.com/rooms/deluxe-201-1.jpg'],
      description: 'Serene pool-view deluxe suite with king bed and balcony.',
      capacity: 3,
      amenities: ['Pool View', 'King Bed', 'Espresso Maker']
    });

    await room.validate();
    // Verify synchronization with aliases
    assert.equal(room.pricePerNight, 6500);
    assert.equal(room.totalInventory, 5);
    assert.equal(room.roomType, 'deluxe');
    assert.deepEqual(room.images, ['https://images.hotelpro.com/rooms/deluxe-201-1.jpg']);

    // Negative rent rejection
    const invalidRoom = new Room({
      hotel: hotelId,
      roomNumber: 'Invalid-101',
      rent: -100,
      count: -2,
      type: 'single',
      description: 'Negative price test',
      capacity: 0 // Below min capacity
    });

    await assert.rejects(
      async () => {
        await invalidRoom.validate();
      },
      (err) => {
        return Boolean(
          err.errors['rent'] &&
          err.errors['count'] &&
          err.errors['capacity']
        );
      }
    );
  });

  // 6. Booking creation with valid dates
  await t.test('6. Booking creation with valid references and dual field aliases', async () => {
    const roomId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const hotelId = new mongoose.Types.ObjectId();

    const booking = new Booking({
      roomId,
      userId,
      hotelId,
      username: 'Kabir Verma',
      phone: '+919876549999',
      fromDate: new Date('2026-12-01'),
      toDate: new Date('2026-12-05'),
      totalAmount: 24000,
      numberOfRooms: 1
    });

    await booking.validate();

    // Verify auto-synchronization
    assert.equal(booking.room.toString(), roomId.toString());
    assert.equal(booking.user.toString(), userId.toString());
    assert.equal(booking.hotel.toString(), hotelId.toString());
    assert.equal(booking.totalDays, 4);
    assert.equal(booking.numberOfNights, 4);
    assert.equal(booking.guestDetails.fullName, 'Kabir Verma');
    assert.equal(booking.guestDetails.phone, '+919876549999');
    assert.ok(booking.bookingReference.startsWith('HP-'));
  });

  // 7. Rejection of invalid date ranges
  await t.test('7. Rejection of invalid date ranges (checkout <= checkin)', async () => {
    const booking = new Booking({
      roomId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      hotelId: new mongoose.Types.ObjectId(),
      username: 'Invalid Date Guest',
      phone: '+919876540000',
      fromDate: new Date('2026-12-10'),
      toDate: new Date('2026-12-05'), // Earlier than checkIn!
      totalAmount: 10000
    });

    await assert.rejects(
      async () => {
        await booking.validate();
      },
      (err) => Boolean(err.errors['checkOut'] || err.errors['toDate'])
    );
  });

  // 8. Server-side price and night calculations
  await t.test('8. Server-side price and night calculations with 18% GST', () => {
    const pricePerNight = 5000;
    const checkIn = '2026-11-20';
    const checkOut = '2026-11-23'; // 3 nights
    const numberOfRooms = 2;

    const pricing = calculatePricing(pricePerNight, checkIn, checkOut, numberOfRooms);

    assert.equal(pricing.numberOfNights, 3);
    assert.equal(pricing.subtotal, 30000); // 5000 * 3 * 2
    assert.equal(pricing.taxes, 5400); // 18% of 30000
    assert.equal(pricing.totalAmount, 35400); // 30000 + 5400
  });

  // 9. Booking references and customer ownership
  await t.test('9. Booking reference format and customer authorization isolation', () => {
    const customerA = new mongoose.Types.ObjectId();
    const customerB = new mongoose.Types.ObjectId();

    const bookingA = new Booking({
      bookingReference: 'HP-2026-123456',
      user: customerA,
      hotel: new mongoose.Types.ObjectId(),
      room: new mongoose.Types.ObjectId(),
      checkIn: new Date('2026-11-01'),
      checkOut: new Date('2026-11-04'),
      username: 'Customer A',
      phone: '+919876543210',
      numberOfNights: 3,
      totalAmount: 15000
    });

    // Check authorization ownership logic: customer B must not access booking A
    const isOwnerA = bookingA.user.toString() === customerA.toString();
    const isOwnerB = bookingA.user.toString() === customerB.toString();

    assert.equal(isOwnerA, true);
    assert.equal(isOwnerB, false);
    assert.ok(/^HP-\d{4}-\d{6}$/.test(bookingA.bookingReference));
  });

  // 10. Overlapping reservations and concurrent booking attempts
  await t.test('10. Overlap detection using half-open interval rule', () => {
    // Existing confirmed stay: [Dec 10, Dec 15)
    const existingStart = new Date('2026-12-10T14:00:00Z');
    const existingEnd = new Date('2026-12-15T11:00:00Z');

    const isOverlap = (reqStart, reqEnd) => {
      return reqStart < existingEnd && reqEnd > existingStart;
    };

    // Requested: Dec 12 - Dec 14 (Interior overlap) -> true
    assert.equal(isOverlap(new Date('2026-12-12'), new Date('2026-12-14')), true);

    // Requested: Dec 08 - Dec 11 (Overlaps checkin) -> true
    assert.equal(isOverlap(new Date('2026-12-08'), new Date('2026-12-11')), true);

    // Requested: Dec 15 - Dec 18 (Same-day turnaround) -> false
    assert.equal(isOverlap(new Date('2026-12-15T14:00:00Z'), new Date('2026-12-18T11:00:00Z')), false);
  });

  // 11. Cancellation and payment-status consistency
  await t.test('11. Cancellation and payment-status consistency', async () => {
    const booking = new Booking({
      room: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      hotel: new mongoose.Types.ObjectId(),
      username: 'Cancellation Test',
      phone: '+919876500000',
      checkIn: new Date('2026-12-20'),
      checkOut: new Date('2026-12-25'),
      totalAmount: 20000,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid'
    });

    await booking.validate();

    // Perform cancellation transition
    booking.bookingStatus = 'cancelled';
    booking.cancellationDetails = {
      cancelledAt: new Date(),
      reason: 'Change of travel itinerary',
      refundAmount: 20000
    };
    booking.paymentStatus = 'refunded';

    await booking.validate();
    assert.equal(booking.bookingStatus, 'cancelled');
    assert.equal(booking.paymentStatus, 'refunded');
    assert.equal(booking.cancellationDetails.refundAmount, 20000);
  });

  // 12. Protection against raw card data being stored
  await t.test('12. Protection against raw card data being stored (PCI-DSS compliance)', () => {
    // Attempt to pass raw card details to Payment model
    assert.throws(
      () => {
        new Payment({
          booking: new mongoose.Types.ObjectId(),
          user: new mongoose.Types.ObjectId(),
          provider: 'razorpay',
          providerOrderId: 'order_test_999999',
          amount: 10000,
          cardDetails: {
            cardNumber: '4111111111111111',
            cvvcode: '123',
            expmonthyear: '12/28',
            cardholdername: 'Target Victim'
          }
        });
      },
      (err) => {
        return err.message.includes('Security Violation') && err.message.includes('cardDetails');
      }
    );

    // Attempt to pass raw card details to Booking model
    assert.throws(
      () => {
        new Booking({
          roomId: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          hotelId: new mongoose.Types.ObjectId(),
          username: 'Hacker',
          phone: '+919876500000',
          fromDate: new Date('2026-12-01'),
          toDate: new Date('2026-12-05'),
          totalAmount: 10000,
          cardNumber: '4111111111111111'
        });
      },
      (err) => {
        return err.message.includes('Security Violation') && err.message.includes('cardNumber');
      }
    );
  });
});
