const BASE_URL = "https://yume-api.bram-jesse.sd-lab.nl/";
const BASE_URL_LOCAL = "http://localhost:443/";

// Detect if running locally
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "";

const API_BASE_URL = (isLocalhost ? BASE_URL_LOCAL : BASE_URL) + "api/v1";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Helper method to get headers
  getHeaders(isMultipart = false) {
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

      // Create error with status code included
      const errorMessage =
        error.message || `HTTP error! status: ${response.status}`;
      const err = new Error(errorMessage);
      err.status = response.status;
      throw err;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return response;
  }

  // Authenticated fetch with automatic token refresh on 401
  async authenticatedFetch(url, options = {}) {
    const defaultOptions = {
      credentials: "include", // Send HTTP-only cookies
      headers: this.getHeaders(),
      ...options,
    };

    let response = await fetch(url, defaultOptions);

    // If 401 Unauthorized, try to refresh the token
    if (response.status === 401) {
      try {
        const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: this.getHeaders(),
        });

        if (refreshResponse.ok) {
          // Token refreshed successfully, retry the original request
          response = await fetch(url, defaultOptions);
        } else {
          // Refresh failed, throw 401 error
          const err = new Error("Unauthorized");
          err.status = 401;
          throw err;
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
        const err = new Error("Unauthorized");
        err.status = 401;
        throw err;
      }
    }

    return response;
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

      return data;
    } catch (error) {
      // Clear local state even if logout API fails
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
   * Get all orders for the current user
   * @returns {Promise<Array>} - List of user's orders
   */
  async getOrders() {
    const response = await this.authenticatedFetch(`${this.baseURL}/orders`, {
      method: "GET",
    });

    return await this.handleResponse(response);
  }

  /**
   * Create a new order
   * @param {Array} items - Array of items with dishID and quantity
   * @param {string} deliveryAddress - Delivery address for the order
   * @returns {Promise<Object>} - Created order details
   */
  async createOrder(items, deliveryAddress) {
    const orderData = { items };

    // Add delivery address if provided
    if (deliveryAddress) {
      orderData.delivery_address = deliveryAddress;
    }

    const response = await this.authenticatedFetch(`${this.baseURL}/orders`, {
      method: "POST",
      body: JSON.stringify(orderData),
    });

    return await this.handleResponse(response);
  }

  /**
   * Get a specific order by ID
   * @param {number} id - Order ID
   * @returns {Promise<Object>} - Order details
   */
  async getOrderById(id) {
    const response = await this.authenticatedFetch(
      `${this.baseURL}/orders/${id}`,
      {
        method: "GET",
      }
    );

    return await this.handleResponse(response);
  }

  /**
   * Mark an order as paid (complete payment)
   * @param {number} id - Order ID
   * @returns {Promise<Object>} - Updated order details
   */
  async paymentComplete(id) {
    const response = await this.authenticatedFetch(
      `${this.baseURL}/orders/${id}`,
      {
        method: "PUT",
        body: JSON.stringify({ Paid: true }),
      }
    );

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
    const response = await this.authenticatedFetch(
      `${this.baseURL}/users/${id}`,
      {
        method: "GET",
      }
    );

    return await this.handleResponse(response);
  }

  /**
   * Update user by ID (update own account)
   * @param {number} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} - Update response
   */
  async updateUser(id, userData) {
    const response = await this.authenticatedFetch(
      `${this.baseURL}/users/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(userData),
      }
    );

    return await this.handleResponse(response);
  }

  /**
   * Delete user by ID (delete own account)
   * @param {number} id - User ID
   * @returns {Promise<Object>} - Delete response
   */
  async deleteUser(id) {
    const response = await this.authenticatedFetch(
      `${this.baseURL}/users/${id}`,
      {
        method: "DELETE",
      }
    );

    return await this.handleResponse(response);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

export { BASE_URL };
export default apiService;
