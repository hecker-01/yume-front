const API_BASE_URL = "http://localhost:3000/api/v1";

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

    if (includeAuth && this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

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
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    // Store in localStorage for persistence
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  }

  // Clear tokens (call this after logout)
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  // Load tokens from localStorage
  loadTokens() {
    this.accessToken = localStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }

  // ========== AUTH ENDPOINTS ==========

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Login response with tokens and user data
   */
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await this.handleResponse(response);

    // Store tokens
    if (data.accessToken && data.refreshToken) {
      this.setTokens(data.accessToken, data.refreshToken);
    }

    return data;
  }

  /**
   * Refresh access token
   * @returns {Promise<Object>} - New access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ token: this.refreshToken }),
    });

    const data = await this.handleResponse(response);

    // Update access token
    if (data.accessToken) {
      this.accessToken = data.accessToken;
      localStorage.setItem("accessToken", data.accessToken);
    }

    return data;
  }

  /**
   * Logout user (revoke refresh token)
   * @returns {Promise<Object>} - Logout response
   */
  async logout() {
    if (!this.refreshToken) {
      this.clearTokens();
      return { message: "Already logged out" };
    }

    const response = await fetch(`${this.baseURL}/auth/logout`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ token: this.refreshToken }),
    });

    const data = await this.handleResponse(response);
    this.clearTokens();

    return data;
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
    });

    return await this.handleResponse(response);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

// Load tokens on initialization
apiService.loadTokens();

export default apiService;
