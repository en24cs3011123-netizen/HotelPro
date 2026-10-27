import apiClient, { setAccessToken } from './api';

export const authService = {
  /**
   * Register a new guest user
   */
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    if (response.data?.data?.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    return response.data;
  },

  /**
   * Login user with email & password
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data?.data?.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    return response.data;
  },

  /**
   * Retrieve current authenticated user profile
   */
  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Refresh session access token via HttpOnly cookie
   */
  async refreshToken() {
    const response = await apiClient.post('/auth/refresh');
    if (response.data?.data?.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    return response.data;
  },

  /**
   * Logout user and invalidate refresh session
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  /**
   * Request password reset link
   */
  async forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with security token
   */
  async resetPassword(resetData) {
    const response = await apiClient.post('/auth/reset-password', resetData);
    return response.data;
  }
};

export default authService;
