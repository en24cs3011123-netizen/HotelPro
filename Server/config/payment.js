const Razorpay = require('razorpay');

const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_key_secret';

let razorpayClient = null;

try {
  razorpayClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
} catch (error) {
  console.warn(`[Payment] Razorpay initialization notice: ${error.message}`);
}

module.exports = {
  razorpayClient,
  keyId,
  keySecret
};
