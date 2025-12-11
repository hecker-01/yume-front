const CART_STORAGE_KEY = "yume_shopping_cart";

/**
 * Get the entire shopping cart
 * @returns {Array} Array of cart items with {dishId, quantity}
 */
export const getCart = () => {
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error("Error getting cart:", error);
    return [];
  }
};

/**
 * Save cart to localStorage
 * @param {Array} cart - Cart items array
 */
const saveCart = (cart) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    // Dispatch custom event for same-tab cart updates
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (error) {
    console.error("Error saving cart:", error);
  }
};

/**
 * Set the quantity for a dish in the cart
 * Overwrites existing quantity or adds new item. If quantity is 0, removes the item.
 * @param {string|number} dishId - The dish ID
 * @param {number} quantity - The quantity to set
 * @returns {Array} Updated cart
 */
export const setCartItem = (dishId, quantity) => {
  const cart = getCart();
  const itemIndex = cart.findIndex((item) => item.dishId === dishId);

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    if (itemIndex !== -1) {
      cart.splice(itemIndex, 1);
    }
  } else {
    if (itemIndex !== -1) {
      // Item exists, overwrite quantity
      cart[itemIndex].quantity = quantity;
    } else {
      // New item, add to cart
      cart.push({ dishId, quantity });
    }
  }

  saveCart(cart);
  return cart;
};

/**
 * Remove an item from the cart
 * @param {string|number} dishId - The dish ID to remove
 * @returns {Array} Updated cart
 */
export const removeFromCart = (dishId) => {
  const cart = getCart();
  const filteredCart = cart.filter((item) => item.dishId !== dishId);
  saveCart(filteredCart);
  return filteredCart;
};

/**
 * Get a specific item from the cart
 * @param {string|number} dishId - The dish ID
 * @returns {Object|null} Cart item or null if not found
 */
export const getCartItem = (dishId) => {
  const cart = getCart();
  return cart.find((item) => item.dishId === dishId) || null;
};

/**
 * Clear the entire cart
 * @returns {Array} Empty cart
 */
export const clearCart = () => {
  saveCart([]);
  return [];
};

/**
 * Get the total number of items in the cart
 * @returns {number} Total quantity of all items
 */
export const getCartItemCount = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Check if an item exists in the cart
 * @param {string|number} dishId - The dish ID
 * @returns {boolean} True if item exists in cart
 */
export const isInCart = (dishId) => {
  const cart = getCart();
  return cart.some((item) => item.dishId === dishId);
};
