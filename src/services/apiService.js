const BASE_URL = "http://localhost:3000/";
const API_BASE_URL = BASE_URL + "api/v1";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Helper method to get headers
  getHeaders(includeAuth = false, isMultipart = false) {
    const headers = {};

    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }

    // With HTTP-Only cookies, the browser automatically includes credentials
    // No need to manually add Authorization header
    // This parameter is kept for backward compatibility but not used

    return headers;
  }

  // Helper method to handle responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return response;
  }

  // Set tokens (call this after login)
  // Tokens are now stored in HTTP-Only cookies set by the server
  setTokens(accessToken, refreshToken) {
    // Note: HTTP-Only cookies are set by the server in the Set-Cookie header
    // The client does not need to store them explicitly
    // This method kept for compatibility but tokens come from cookies
  }

  // Clear tokens (call this after logout)
  clearTokens() {
    // HTTP-Only cookies are managed by the server
    // Client cannot directly delete them, but server will invalidate on logout
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Load tokens from localStorage (not used with HTTP-Only cookies)
  loadTokens() {
    // With HTTP-Only cookies, tokens are automatically sent by the browser
    // This method is kept for backward compatibility
  }

  // Check if user is authenticated
  // With HTTP-Only cookies, we rely on server validation
  // Client tracks authentication state through authService
  isAuthenticated() {
    // This is maintained for backward compatibility
    // Actual authentication check is done by authService
    return true; // Cookie presence is verified by server
  }

  // ========== AUTH ENDPOINTS ==========

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Login response with user data
   */
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
      credentials: "include", // Include cookies in request
    });

    const data = await this.handleResponse(response);

    // Note: Tokens are stored in HTTP-Only cookies by the server
    // No client-side token storage needed

    return data;
  }

  /**
   * Refresh access token
   * @returns {Promise<Object>} - New access token
   */
  async refreshAccessToken() {
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include", // Include refresh token cookie
    });

    const data = await this.handleResponse(response);

    // Token is stored in HTTP-Only cookie by the server
    return data;
  }

  /**
   * Logout user (revoke refresh token)
   * @returns {Promise<Object>} - Logout response
   */
  async logout() {
    try {
      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: "POST",
        headers: this.getHeaders(),
        credentials: "include", // Include cookies
      });

      const data = await this.handleResponse(response);
      this.clearTokens();

      return data;
    } catch (error) {
      // Clear local state even if logout API fails
      this.clearTokens();
      throw error;
    }
  }

  // ========== DISHES ENDPOINTS ==========

  /**
   * Get all dishes
   * @returns {Promise<Array>} - List of all dishes
   */
  async getDishes() {
    const response = await fetch(`${this.baseURL}/dishes`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return await this.handleResponse(response);
  }

  /**
   * Get a specific dish by ID
   * @param {number} id - Dish ID
   * @returns {Promise<Object>} - Dish details
   */
  async getDishById(id) {
    const response = await fetch(`${this.baseURL}/dishes/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return await this.handleResponse(response);
  }

  // ========== ORDERS ENDPOINTS ==========

  /**
   * Create a new order
   * @param {Array} items - Array of items with dishID and quantity
   * @returns {Promise<Object>} - Created order details
   */
  async createOrder(items) {
    const response = await fetch(`${this.baseURL}/orders`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify({ items }),
      credentials: "include",
    });

    return await this.handleResponse(response);
  }

  /**
   * Get a specific order by ID
   * @param {number} id - Order ID
   * @returns {Promise<Object>} - Order details
   */
  async getOrderById(id) {
    const response = await fetch(`${this.baseURL}/orders/${id}`, {
      method: "GET",
      headers: this.getHeaders(true),
      credentials: "include",
    });

    return await this.handleResponse(response);
  }

  // ========== USERS ENDPOINTS ==========

  /**
   * Register a new user
   * @param {Object} userData - User data (username, password, email, address)
   * @returns {Promise<Object>} - Created user details
   */
  async registerUser(userData) {
    const response = await fetch(`${this.baseURL}/users`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });

    return await this.handleResponse(response);
  }

  /**
   * Get user by ID (view own account)
   * @param {number} id - User ID
   * @returns {Promise<Object>} - User details
   */
  async getUserById(id) {
    const response = await fetch(`${this.baseURL}/users/${id}`, {
      method: "GET",
      headers: this.getHeaders(true),
      credentials: "include",
    });

    return await this.handleResponse(response);
  }

  /**
   * Update user by ID (update own account)
   * @param {number} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} - Update response
   */
  async updateUser(id, userData) {
    const response = await fetch(`${this.baseURL}/users/${id}`, {
      method: "PUT",
      headers: this.getHeaders(true),
      body: JSON.stringify(userData),
      credentials: "include",
    });

    return await this.handleResponse(response);
  }

  /**
   * Delete user by ID (delete own account)
   * @param {number} id - User ID
   * @returns {Promise<Object>} - Delete response
   */
  async deleteUser(id) {
    const response = await fetch(`${this.baseURL}/users/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(true),
      credentials: "include",
    });

    return await this.handleResponse(response);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

// Load tokens on initialization
apiService.loadTokens();

export { BASE_URL };
export default apiService;
