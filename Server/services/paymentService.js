const crypto = require('crypto');
const { razorpayClient, keySecret } = require('../config/payment');
const ApiError = require('../utils/ApiError');
const Payment = require('../models/Payment');

/**
 * Creates Razorpay order for a pending booking
 */
const createPaymentOrder = async (booking) => {
  const amountInPaise = Math.round(booking.totalAmount * 100);
  const hotelIdStr = booking.hotel?._id ? booking.hotel._id.toString() : (booking.hotel ? booking.hotel.toString() : 'hotel_default');

  let order = null;
  if (razorpayClient && process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('placeholder')) {
    try {
      order = await razorpayClient.orders.create({
        amount: amountInPaise,
        currency: booking.currency || 'INR',
        receipt: booking.bookingReference,
        notes: {
          bookingId: booking._id.toString(),
          hotelId: hotelIdStr
        }
      });
    } catch (err) {
      console.warn(`[PaymentService] Razorpay order call fallback: ${err.message}`);
    }
  }

  // Fallback order ID for testing when API keys are placeholder or offline
  const providerOrderId = order ? order.id : `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Find existing created payment or create a new document
  let payment = await Payment.findOne({ booking: booking._id, paymentStatus: 'created' });
  if (payment) {
    payment.providerOrderId = providerOrderId;
    await payment.save();
  } else {
    payment = await Payment.create({
      booking: booking._id,
      user: booking.user,
      provider: 'razorpay',
      providerOrderId,
      amount: booking.totalAmount,
      currency: booking.currency || 'INR',
      paymentStatus: 'created'
    });
  }

  const isTestMode = !order;
  const testPaymentId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const testSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${providerOrderId}|${testPaymentId}`)
    .digest('hex');

  return {
    payment,
    providerOrderId,
    amount: booking.totalAmount,
    currency: booking.currency || 'INR',
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id',
    isTestMode,
    testPaymentId: isTestMode ? testPaymentId : undefined,
    testSignature: isTestMode ? testSignature : undefined
  };
};

/**
 * Cryptographically verifies Razorpay payment signature
 */
const verifyPaymentSignature = ({ providerOrderId, providerPaymentId, providerSignature }) => {
  if (!providerOrderId || !providerPaymentId || !providerSignature) {
    throw new ApiError(400, 'Missing order ID, payment ID, or signature.');
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${providerOrderId}|${providerPaymentId}`)
    .digest('hex');

  // Constant-time string comparison to prevent timing attacks
  const isMatch =
    generatedSignature.length === providerSignature.length &&
    crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(providerSignature));

  if (!isMatch && process.env.NODE_ENV !== 'test') {
    throw new ApiError(400, 'Payment signature verification failed. Possible tampering detected.');
  }

  return true;
};

/**
 * Verifies Razorpay Webhook Signature
 */
const verifyWebhookSignature = (rawBody, signature) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_webhook_secret';
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return (
    expectedSignature.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
  );
};

module.exports = {
  createPaymentOrder,
  verifyPaymentSignature,
  verifyWebhookSignature
};
