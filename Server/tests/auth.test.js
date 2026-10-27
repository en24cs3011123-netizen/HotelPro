const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { generateAccessToken, hashToken } = require('../utils/generateToken');

test('Auth API Test Suite', async (t) => {
  await t.test('POST /api/v1/auth/register rejects missing or invalid inputs', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'A',
        email: 'invalid-email',
        password: 'weak'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.length > 0);
  });

  await t.test('POST /api/v1/auth/register rejects mismatched confirmPassword', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        phone: '9876543210',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    const hasMismatch = res.body.errors.some((e) => e.message.includes('do not match'));
    assert.ok(hasMismatch);
  });

  await t.test('GET /api/v1/auth/me rejects unauthenticated request without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('GET /api/v1/auth/me rejects invalid or forged bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid_forged_jwt_token_12345');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('Token generation and SHA-256 token hashing', () => {
    const dummyUser = { _id: '507f1f77bcf86cd799439011', email: 'test@hotelpro.com', role: 'guest' };
    const token = generateAccessToken(dummyUser);
    assert.ok(typeof token === 'string' && token.length > 20);

    const hashed = hashToken('secret_reset_token_test');
    assert.equal(typeof hashed, 'string');
    assert.equal(hashed.length, 64); // SHA-256 hex string is 64 characters
  });
});
