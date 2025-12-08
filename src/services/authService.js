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

      if (!response.user) {
        throw new Error("Login response missing user data.");
      }

      // Store user data (excluding sensitive info)
      // Tokens are stored in HTTP-Only cookies by the server
      this.currentUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
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
   * Check if user is authenticated (client-side only).
   * This only checks local state and may be out of sync with the server.
   * For critical actions, use verifyAuthentication() to check with the server.
   * @returns {boolean} - True if authenticated (client-side state)
   */
  isAuthenticated() {
    return this.isLoggedIn && this.currentUser !== null;
  }

  /**
   * Verify authentication status with the server.
   * Makes a request to the server to confirm session validity.
   * @returns {Promise<boolean>} - True if authenticated (server-side)
   */
  async verifyAuthentication() {
    try {
      // Replace with the actual endpoint your API provides for session/user status
      const response = await apiService.getCurrentUser?.();
      if (response && response.user) {
        // Optionally update local state
        this.currentUser = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
        };
        this.isLoggedIn = true;
        localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
        return true;
      } else {
        this.isLoggedIn = false;
        this.currentUser = null;
        localStorage.removeItem("currentUser");
        return false;
      }
    } catch (error) {
      this.isLoggedIn = false;
      this.currentUser = null;
      localStorage.removeItem("currentUser");
      return false;
    }
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
