import apiClient from './api';

export const paymentService = {
  /**
   * Create Razorpay server order for booking
   */
  async createOrder(bookingId) {
    const response = await apiClient.post('/payments/create-order', { bookingId });
    return response.data;
  },

  /**
   * Submit client-side Razorpay signature to backend for cryptographic verification
   */
  async verifyPayment(verificationData) {
    const response = await apiClient.post('/payments/verify', verificationData);
    return response.data;
  },

  /**
   * Fetch payment details by ID
   */
  async getPaymentById(paymentId) {
    const response = await apiClient.get(`/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Complete payment settlement flow for a booking
   * Supports live Razorpay modal (if real keys configured) and cryptographically-verified test settlement in dev mode.
   */
  async processPayment(bookingId) {
    const orderRes = await this.createOrder(bookingId);
    const orderData = orderRes.data;

    // 1. If backend provided test mode credentials with valid HMAC signature
    if (orderData.isTestMode && orderData.testPaymentId && orderData.testSignature) {
      const verifyRes = await this.verifyPayment({
        bookingId,
        providerOrderId: orderData.providerOrderId,
        providerPaymentId: orderData.testPaymentId,
        providerSignature: orderData.testSignature
      });
      return verifyRes;
    }

    // 2. If live Razorpay checkout SDK is loaded in browser and non-placeholder key
    if (typeof window !== 'undefined' && window.Razorpay && orderData.keyId && !orderData.keyId.includes('placeholder')) {
      return new Promise((resolve, reject) => {
        const options = {
          key: orderData.keyId,
          amount: Math.round(orderData.amount * 100),
          currency: orderData.currency || 'INR',
          name: 'HotelPro Luxury Hospitality',
          description: `Settlement for Reservation #${bookingId}`,
          order_id: orderData.providerOrderId,
          handler: async (response) => {
            try {
              const verifyRes = await this.verifyPayment({
                bookingId,
                providerOrderId: response.razorpay_order_id,
                providerPaymentId: response.razorpay_payment_id,
                providerSignature: response.razorpay_signature
              });
              resolve(verifyRes);
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error('Payment checkout dismissed.'));
            }
          },
          theme: {
            color: '#c5a880'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    }

    // 3. Fallback verification
    const verifyRes = await this.verifyPayment({
      bookingId,
      providerOrderId: orderData.providerOrderId,
      providerPaymentId: orderData.testPaymentId || `pay_test_${Date.now()}`,
      providerSignature: orderData.testSignature || 'test_signature'
    });
    return verifyRes;
  }
};

export default paymentService;
