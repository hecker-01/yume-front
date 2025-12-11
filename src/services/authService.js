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

      // Check if we got a userId from the login response
      if (!response.userId && !response.user) {
        throw new Error("Login response missing user data.");
      }

      // If we have userId but not full user object, fetch user details
      let userId = response.userId || response.user?.id;
      if (userId && !response.user) {
        const userResponse = await apiService.getUserById(userId);
        const userData = userResponse.user || userResponse;

        this.currentUser = {
          id: userData.id || userId,
          email: userData.email || email,
          name: userData.name || userData.username,
          role: userData.role,
        };
      } else if (response.user) {
        // Store user data (excluding sensitive info)
        this.currentUser = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name || response.user.username,
          role: response.user.role,
        };
      }

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
   * Check if user is logged in with JWT token validation.
   * Attempts to validate token, refresh if needed, or redirect to login.
   * @returns {Promise<boolean>} - True if authenticated with valid token
   */
  async isLoggedInWithTokenCheck() {
    // Check if we have user data
    if (!this.isAuthenticated()) {
      return false;
    }

    // Try to verify authentication with the server
    try {
      // Attempt to get current user (this will use the JWT token)
      const isValid = await this.verifyAuthentication();
      if (isValid) {
        return true;
      }
    } catch (error) {
      // Token might be expired, try to refresh
      console.log("Token validation failed, attempting refresh...");
      try {
        await this.refreshToken();
        // Try verification again after refresh
        const isValid = await this.verifyAuthentication();
        if (isValid) {
          return true;
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }
    }

    // All attempts failed, clear local state
    this.currentUser = null;
    this.isLoggedIn = false;
    localStorage.removeItem("currentUser");
    return false;
  }

  /**
   * Verify authentication status with the server.
   * Makes a request to the server to confirm session validity.
   * @returns {Promise<boolean>} - True if authenticated (server-side)
   */
  async verifyAuthentication() {
    try {
      // Try to get current user info - this will validate the JWT token
      // We'll use the getUserById endpoint with the current user's ID
      if (!this.currentUser || !this.currentUser.id) {
        return false;
      }

      const response = await apiService.getUserById(this.currentUser.id);
      // Handle both response.user and direct user object
      const userData = response.user || response;

      if (userData && (userData.id || userData.UserID)) {
        // Update local state with fresh data
        this.currentUser = {
          id: userData.id || userData.UserID,
          email: userData.email || userData.Email,
          name: userData.name || userData.username || userData.Username,
          role: userData.role || userData.Role,
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
      console.error("Authentication verification failed:", error);
      // Don't clear state here - let the caller decide
      throw error;
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
      await this.logout();
      throw error;
    }
  }
}

export default new AuthService();
