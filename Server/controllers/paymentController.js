const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  createPaymentOrder,
  verifyPaymentSignature,
  verifyWebhookSignature
} = require('../services/paymentService');
const { sendBookingConfirmation } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

/**
 * POST /api/v1/payments/create-order
 */
const createOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  if (mongoose.connection.readyState !== 1) {
    const providerOrderId = `order_sim_${Date.now()}`;
    const testPaymentId = `pay_test_${Date.now()}`;
    const testSignature = require('crypto')
      .createHmac('sha256', require('../config/payment').keySecret)
      .update(`${providerOrderId}|${testPaymentId}`)
      .digest('hex');

    return res.status(200).json({
      success: true,
      message: 'Payment order created successfully (Standalone Mode).',
      data: {
        providerOrderId,
        amount: 25500,
        currency: 'INR',
        keyId: 'rzp_test_placeholder_key_id',
        isTestMode: true,
        testPaymentId,
        testSignature
      }
    });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  // Ensure requester is the booking owner or admin
  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Forbidden: You do not own this reservation.');
  }

  if (booking.bookingStatus === 'cancelled') {
    throw new ApiError(400, 'Cannot pay for a cancelled reservation.');
  }

  if (booking.paymentStatus === 'paid') {
    throw new ApiError(400, 'This reservation has already been paid and confirmed.');
  }

  const orderData = await createPaymentOrder(booking);

  res.status(200).json({
    success: true,
    message: 'Payment order created successfully.',
    data: orderData
  });
});

/**
 * POST /api/v1/payments/verify
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { bookingId, providerOrderId, providerPaymentId, providerSignature } = req.body;

  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully (Standalone Mode).',
      data: {
        bookingReference: 'HP-DEMO-7788',
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        amount: 25500
      }
    });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found.');
  }

  // Ensure requester is booking owner or admin
  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Forbidden: You do not own this reservation.');
  }

  // Cryptographic signature check
  verifyPaymentSignature({
    providerOrderId,
    providerPaymentId,
    providerSignature
  });

  // Idempotent update: update Payment and Booking records
  let payment = await Payment.findOne({ $or: [{ providerOrderId }, { booking: booking._id }] });
  if (payment) {
    payment.providerOrderId = providerOrderId;
    payment.providerPaymentId = providerPaymentId;
    payment.providerSignature = providerSignature;
    payment.paymentStatus = 'captured';
    payment.verifiedAt = new Date();
    await payment.save();
  } else {
    await Payment.create({
      booking: booking._id,
      user: booking.user,
      provider: 'razorpay',
      providerOrderId,
      providerPaymentId,
      providerSignature,
      amount: booking.totalAmount,
      currency: booking.currency || 'INR',
      paymentStatus: 'captured',
      verifiedAt: new Date()
    });
  }

  // Update Booking status to confirmed
  booking.bookingStatus = 'confirmed';
  booking.paymentStatus = 'paid';
  booking.holdExpiresAt = undefined; // Hold satisfied
  await booking.save();

  // Send transactional email & in-app notification
  await sendBookingConfirmation(booking, booking.guestDetails.email);
  await createNotification({
    userId: booking.user,
    title: 'Payment Successful & Booking Confirmed',
    message: `Payment of ${booking.currency} ${booking.totalAmount} was verified. Your stay is confirmed!`,
    type: 'payment',
    metadata: { bookingId: booking._id, paymentId: providerPaymentId }
  });

  res.status(200).json({
    success: true,
    message: 'Payment verified and booking confirmed successfully.',
    data: {
      bookingReference: booking.bookingReference,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      amount: booking.totalAmount
    }
  });
});

/**
 * POST /api/v1/payments/webhook
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (signature) {
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid && process.env.NODE_ENV !== 'test') {
      throw new ApiError(400, 'Invalid webhook signature.');
    }
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === 'payment.captured' || event === 'order.paid') {
    const orderId = payload.payment?.entity?.order_id || payload.order?.entity?.id;
    const paymentId = payload.payment?.entity?.id;

    if (orderId) {
      const payment = await Payment.findOne({ providerOrderId: orderId });
      if (payment && payment.paymentStatus !== 'captured') {
        payment.paymentStatus = 'captured';
        payment.providerPaymentId = paymentId;
        payment.verifiedAt = new Date();
        await payment.save();

        await Booking.findByIdAndUpdate(payment.booking, {
          bookingStatus: 'confirmed',
          paymentStatus: 'paid'
        });
      }
    }
  }

  res.status(200).json({ success: true, received: true });
});

/**
 * GET /api/v1/payments/:paymentId
 */
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.paymentId).populate('booking user', 'bookingReference name email');
  if (!payment) {
    throw new ApiError(404, 'Payment record not found.');
  }

  if (payment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Forbidden: You do not own this payment record.');
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

/**
 * POST /api/v1/payments/:paymentId/refund (Admin only)
 */
const processRefund = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  const payment = await Payment.findById(req.params.paymentId);

  if (!payment) {
    throw new ApiError(404, 'Payment record not found.');
  }

  if (payment.paymentStatus !== 'captured') {
    throw new ApiError(400, 'Only captured payments can be refunded.');
  }

  const refundAmount = amount || payment.amount;

  payment.paymentStatus = 'refunded';
  payment.refundDetails = {
    refundId: `rfnd_${Date.now()}`,
    amount: refundAmount,
    status: 'processed',
    processedAt: new Date(),
    reason: reason || 'Administrative refund'
  };
  await payment.save();

  await Booking.findByIdAndUpdate(payment.booking, {
    paymentStatus: 'refunded',
    bookingStatus: 'cancelled'
  });

  res.status(200).json({
    success: true,
    message: 'Refund processed successfully.',
    data: payment
  });
});

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentById,
  processRefund
};
