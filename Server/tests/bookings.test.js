const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { calculatePricing } = require('../services/bookingService');
const { generateAccessToken } = require('../utils/generateToken');

test('Booking Engine & Validation Test Suite', async (t) => {
  const guestToken = generateAccessToken({
    _id: '507f1f77bcf86cd799439011',
    email: 'guest@hotelpro.com',
    role: 'guest'
  });

  await t.test('calculatePricing computes correct nights, subtotal, 18% taxes, and total', () => {
    const pricePerNight = 5000;
    const checkIn = '2026-11-10';
    const checkOut = '2026-11-13'; // 3 nights
    const numberOfRooms = 2;

    const pricing = calculatePricing(pricePerNight, checkIn, checkOut, numberOfRooms);

    assert.equal(pricing.numberOfNights, 3);
    assert.equal(pricing.subtotal, 5000 * 3 * 2); // 30,000
    assert.equal(pricing.taxes, Math.round(30000 * 0.18)); // 5,400 (18% GST)
    assert.equal(pricing.fees, 0);
    assert.equal(pricing.totalAmount, 30000 + 5400); // 35,400
  });

  await t.test('POST /api/v1/bookings rejects check-out date before check-in date', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        hotel: '507f1f77bcf86cd799439012',
        room: '507f1f77bcf86cd799439013',
        checkIn: '2026-12-15',
        checkOut: '2026-12-10', // Invalid: before check-in
        numberOfGuests: 2,
        numberOfRooms: 1,
        guestDetails: {
          fullName: 'Aarav Sharma',
          email: 'aarav@example.com',
          phone: '9876543210'
        }
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    const hasDateError = res.body.errors.some((e) => e.message.includes('checkOut must be strictly after checkIn'));
    assert.ok(hasDateError);
  });

  await t.test('POST /api/v1/bookings rejects past check-in dates', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        hotel: '507f1f77bcf86cd799439012',
        room: '507f1f77bcf86cd799439013',
        checkIn: '2020-01-01', // Past date
        checkOut: '2020-01-05',
        numberOfGuests: 2,
        guestDetails: {
          fullName: 'Past Traveler',
          email: 'past@example.com',
          phone: '9876543210'
        }
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/v1/bookings rejects requests missing required guest contact details', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        hotel: '507f1f77bcf86cd799439012',
        room: '507f1f77bcf86cd799439013',
        checkIn: '2026-12-01',
        checkOut: '2026-12-04',
        numberOfGuests: 2,
        guestDetails: {
          fullName: '', // empty
          email: 'not-an-email',
          phone: ''
        }
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });
});
