const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Webhook endpoint (Signature verified independently via raw body)
router.post('/webhook', paymentController.handleWebhook);

// Protected endpoints
router.post('/create-order', authenticate, paymentController.createOrder);
router.post('/verify', authenticate, paymentController.verifyPayment);
router.get('/:paymentId', authenticate, paymentController.getPaymentById);
router.post('/:paymentId/refund', authenticate, authorize('admin'), paymentController.processRefund);

module.exports = router;
