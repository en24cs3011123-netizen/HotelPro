import apiClient from './api';

export const bookingService = {
  /**
   * Create a 15-minute temporary reservation hold
   */
  async createBooking(bookingData) {
    const response = await apiClient.post('/bookings', bookingData);
    return response.data;
  },

  /**
   * Get authenticated user's bookings history
   */
  async getMyBookings(params = {}) {
    try {
      const response = await apiClient.get('/bookings/my', { params });
      return response.data;
    } catch {
      // In-memory or empty if offline
      return { success: true, data: [], meta: { totalRecords: 0 } };
    }
  },

  /**
   * Get single reservation details by ID
   */
  async getBookingById(bookingId) {
    const response = await apiClient.get(`/bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId, reason) {
    const response = await apiClient.post(`/bookings/${bookingId}/cancel`, { reason });
    return response.data;
  }
};

export default bookingService;
