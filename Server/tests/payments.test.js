const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const crypto = require('crypto');
const app = require('../app');
const { verifyPaymentSignature, verifyWebhookSignature } = require('../services/paymentService');
const { keySecret } = require('../config/payment');
const { generateAccessToken } = require('../utils/generateToken');

test('Payment Gateway & Verification Test Suite', async (t) => {
  const guestToken = generateAccessToken({
    _id: '507f1f77bcf86cd799439011',
    email: 'guest@hotelpro.com',
    role: 'guest'
  });

  await t.test('verifyPaymentSignature approves matching HMAC SHA256 signature', () => {
    const orderId = 'order_valid_12345';
    const paymentId = 'pay_valid_67890';
    const validSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const result = verifyPaymentSignature({
      providerOrderId: orderId,
      providerPaymentId: paymentId,
      providerSignature: validSignature
    });

    assert.equal(result, true);
  });

  await t.test('verifyPaymentSignature rejects tampered signature', () => {
    const orderId = 'order_valid_12345';
    const paymentId = 'pay_valid_67890';
    const tamperedSignature = 'a'.repeat(64); // Invalid signature

    // Set NODE_ENV to production to enforce strict throw
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    assert.throws(
      () => {
        verifyPaymentSignature({
          providerOrderId: orderId,
          providerPaymentId: paymentId,
          providerSignature: tamperedSignature
        });
      },
      (err) => {
        return err.statusCode === 400 && err.message.includes('signature verification failed');
      }
    );

    process.env.NODE_ENV = originalEnv;
  });

  await t.test('POST /api/v1/payments/:id/refund rejects guest user (Admin only)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/507f1f77bcf86cd799439011/refund')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        amount: 5000,
        reason: 'Unauthorized guest refund request'
      });

    // 403 Forbidden
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/v1/payments/create-order rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .send({
        bookingId: '507f1f77bcf86cd799439011'
      });

    assert.equal(res.status, 401);
  });
});
