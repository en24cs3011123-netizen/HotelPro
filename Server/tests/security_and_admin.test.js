const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { generateAccessToken } = require('../utils/generateToken');

test('Security & Administration RBAC Test Suite', async (t) => {
  const guestToken = generateAccessToken({
    _id: '507f1f77bcf86cd799439011',
    email: 'guest@hotelpro.com',
    role: 'guest'
  });

  const staffToken = generateAccessToken({
    _id: '507f1f77bcf86cd799439022',
    email: 'staff@hotelpro.com',
    role: 'staff'
  });

  await t.test('GET /api/v1/admin/users rejects guest with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${guestToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('Forbidden'));
  });

  await t.test('GET /api/v1/admin/users rejects staff with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${staffToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('Forbidden'));
  });

  await t.test('GET /api/v1/admin/reports/occupancy rejects guest with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/reports/occupancy')
      .set('Authorization', `Bearer ${guestToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  await t.test('GET /api/v1/health returns 200 OK without leaking sensitive configuration', async () => {
    const res = await request(app).get('/api/v1/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.service, 'HotelPro Backend API');
    assert.equal(res.body.status, 'healthy');

    // Security assertions: Never leak database passwords, JWT secrets, or internal stacks
    assert.equal(res.body.password, undefined);
    assert.equal(res.body.jwtSecret, undefined);
    assert.equal(res.body.stack, undefined);
  });

  await t.test('Unknown route triggers centralized 404 handler', async () => {
    const res = await request(app).get('/api/v1/non_existent_route_path');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('not found'));
  });

  await t.test('CORS permits exact production frontend origin https://hotelpro-1frontend.onrender.com with credentials', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://hotelpro-1frontend.onrender.com');

    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], 'https://hotelpro-1frontend.onrender.com');
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
    // Ensure wildcard is never used in headers when credentials are true
    assert.notEqual(res.headers['access-control-allow-origin'], '*');
  });

  await t.test('CORS preflight OPTIONS request for production frontend returns 204 with required headers', async () => {
    const res = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', 'https://hotelpro-1frontend.onrender.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

    assert.equal(res.status, 204);
    assert.equal(res.headers['access-control-allow-origin'], 'https://hotelpro-1frontend.onrender.com');
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
    assert.ok(res.headers['access-control-allow-methods'].includes('POST'));
  });

  await t.test('CORS permits local development origin with credentials', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');

    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
  });

  await t.test('CORS rejects unauthorized origin and does not emit Access-Control-Allow-Origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://malicious-phishing-site.example.com');

    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });
});
