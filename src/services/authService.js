import apiService from "./apiService.js";

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isLoggedIn = false;
    this.loadUserFromStorage();
  }

  /**
   * Load user data from localStorage if available
   * HTTP-Only cookies are managed by the browser automatically
   */
  loadUserFromStorage() {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.isLoggedIn = true;
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem("currentUser");
      }
    }
  }

  /**
   * Login a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User data
   */
  async login(email, password) {
    try {
      const response = await apiService.login(email, password);

      // Store user data (excluding sensitive info)
      // Tokens are stored in HTTP-Only cookies by the server
      this.currentUser = {
        id: response.user?.id,
        email: response.user?.email,
        name: response.user?.name,
        role: response.user?.role,
      };

      this.isLoggedIn = true;
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser));

      return response;
    } catch (error) {
      console.error("Login failed:", error);
      this.isLoggedIn = false;
      throw error;
    }
  }

  /**
   * Logout the current user
   * @returns {Promise<Object>} - Logout response
   */
  async logout() {
    try {
      await apiService.logout();
      this.currentUser = null;
      this.isLoggedIn = false;
      localStorage.removeItem("currentUser");
      return { message: "Logged out successfully" };
    } catch (error) {
      console.error("Logout error:", error);
      // Clear local data even if API call fails
      this.currentUser = null;
      this.isLoggedIn = false;
      localStorage.removeItem("currentUser");
      apiService.clearTokens();
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   * With HTTP-Only cookies, authentication is verified by the server
   * @returns {boolean} - True if authenticated
   */
  isAuthenticated() {
    return this.isLoggedIn && this.currentUser !== null;
  }

  /**
   * Get current user data
   * @returns {Object|null} - Current user data or null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Refresh access token
   * @returns {Promise<Object>} - New token data
   */
  async refreshToken() {
    try {
      return await apiService.refreshAccessToken();
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.logout();
      throw error;
    }
  }
}

export default new AuthService();
