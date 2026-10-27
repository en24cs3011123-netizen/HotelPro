const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { generateAccessToken } = require('../utils/generateToken');

test('Rooms & Hotels API Test Suite', async (t) => {
  const guestToken = generateAccessToken({
    _id: '507f1f77bcf86cd799439011',
    email: 'guest@hotelpro.com',
    role: 'guest'
  });

  await t.test('GET /api/v1/rooms/availability rejects checkout before or equal to checkin', async () => {
    const res = await request(app)
      .get('/api/v1/rooms/availability?checkIn=2026-11-10&checkOut=2026-11-09');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/v1/hotels rejects non-admin users (Role-Based Authorization)', async () => {
    const res = await request(app)
      .post('/api/v1/hotels')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        name: 'Malicious Fake Hotel',
        description: 'Testing unauthorized hotel creation',
        address: '123 Fake Street',
        city: 'Mumbai'
      });

    // 403 Forbidden because guest is not admin
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/v1/rooms rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/v1/rooms')
      .send({
        hotel: '507f1f77bcf86cd799439012',
        roomNumber: '101',
        roomType: 'deluxe',
        description: 'Deluxe room',
        capacity: 2,
        pricePerNight: 5000
      });

    assert.equal(res.status, 401);
  });

  await t.test('POST /api/v1/rooms rejects invalid room types', async () => {
    const adminToken = generateAccessToken({
      _id: '507f1f77bcf86cd799439099',
      email: 'admin@hotelpro.com',
      role: 'admin'
    });

    const res = await request(app)
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        hotel: '507f1f77bcf86cd799439012',
        roomNumber: '999',
        roomType: 'invalid_submarine_category',
        description: 'Test invalid category',
        capacity: 2,
        pricePerNight: 5000
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });
});
