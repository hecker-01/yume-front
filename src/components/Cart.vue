<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  getCart,
  setCartItem,
  removeFromCart,
  clearCart,
} from "@/services/cartService";
import api from "@/services/apiService";
import { BASE_URL } from "@/services/apiService";
import authService from "@/services/authService";

const emit = defineEmits(["close", "update"]);
const router = useRouter();

const cart = ref([]);
const dishes = ref([]);
const loading = ref(true);

const cartItems = computed(() => {
  return cart.value
    .map((item) => {
      const dish = dishes.value.find((d) => d.DishID === item.dishId);
      return dish
        ? {
            ...dish,
            quantity: item.quantity,
            subtotal: dish.Price * item.quantity,
          }
        : null;
    })
    .filter((item) => item !== null);
});

const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.subtotal, 0);
});

const totalItems = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0);
});

const loadCart = async () => {
  loading.value = true;
  try {
    cart.value = getCart();

    // Fetch all dishes to get details
    const data = await api.getDishes();
    if (Array.isArray(data)) {
      dishes.value = data;
    } else if (data && Array.isArray(data.data)) {
      dishes.value = data.data;
    } else if (data && Array.isArray(data.dishes)) {
      dishes.value = data.dishes;
    }
  } catch (error) {
    console.error("Error loading cart:", error);
  } finally {
    loading.value = false;
  }
};

const updateQuantity = (dishId, newQuantity) => {
  if (newQuantity <= 0) {
    removeItem(dishId);
  } else {
    setCartItem(dishId, newQuantity);
    cart.value = getCart();
    emit("update");
  }
};

const removeItem = (dishId) => {
  removeFromCart(dishId);
  cart.value = getCart();
  emit("update");
};

const clearAllCart = () => {
  clearCart();
  cart.value = [];
  emit("update");
};

const checkout = () => {
  // Check if user is logged in
  if (!authService.isAuthenticated()) {
    // Close cart and redirect to login with redirect back to checkout
    emit("close");
    router.push({ name: "Login", query: { redirect: "/checkout" } });
  } else {
    // User is logged in, proceed to checkout
    emit("close");
    router.push({ name: "Checkout" });
  }
};

const getImageUrl = (dish) => {
  return dish.Image ? BASE_URL + dish.Image : null;
};

onMounted(() => {
  loadCart();
});

// Watch for cart updates from outside
watch(
  () => getCart(),
  () => {
    cart.value = getCart();
  }
);
</script>

<template>
  <div class="cart-overlay" @click="$emit('close')">
    <div class="cart-container" @click.stop>
      <!-- Header -->
      <div class="cart-header">
        <h2 class="cart-title">Your Cart</h2>
        <button
          class="close-btn"
          @click="$emit('close')"
          aria-label="Close cart"
        >
          <font-awesome-icon icon="times" />
        </button>
      </div>

      <!-- Content -->
      <div class="cart-content">
        <div v-if="loading" class="cart-loading">Loading cart...</div>

        <div v-else-if="cartItems.length === 0" class="cart-empty">
          <p>Your cart is empty</p>
          <p class="cart-empty-hint">
            Add some delicious dishes to get started!
          </p>
        </div>

        <div v-else class="cart-items">
          <div v-for="item in cartItems" :key="item.DishID" class="cart-item">
            <div class="cart-item-image">
              <img
                v-if="getImageUrl(item)"
                :src="getImageUrl(item)"
                :alt="item.Name"
              />
              <div v-else class="no-image-placeholder">
                <img src="/favicon.svg" alt="No image" />
              </div>
            </div>

            <div class="cart-item-details">
              <h3 class="cart-item-name">{{ item.Name }}</h3>
              <p class="cart-item-price">${{ item.Price.toFixed(2) }} each</p>

              <div class="cart-item-controls">
                <div class="quantity-controls">
                  <button
                    class="quantity-btn"
                    @click="updateQuantity(item.DishID, item.quantity - 1)"
                    aria-label="Decrease quantity"
                  >
                    <font-awesome-icon icon="minus" />
                  </button>
                  <span class="quantity">{{ item.quantity }}</span>
                  <button
                    class="quantity-btn"
                    @click="updateQuantity(item.DishID, item.quantity + 1)"
                    aria-label="Increase quantity"
                  >
                    <font-awesome-icon icon="plus" />
                  </button>
                </div>

                <button
                  class="remove-btn"
                  @click="removeItem(item.DishID)"
                  aria-label="Remove item"
                >
                  <font-awesome-icon icon="trash" />
                </button>
              </div>
            </div>

            <div class="cart-item-subtotal">
              ${{ item.subtotal.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="cartItems.length > 0" class="cart-footer">
        <div class="cart-summary">
          <div class="cart-total">
            <span>Total ({{ totalItems }} items):</span>
            <span class="total-price">${{ totalPrice.toFixed(2) }}</span>
          </div>
        </div>

        <div class="cart-actions">
          <button class="clear-cart-btn" @click="clearAllCart">
            <font-awesome-icon icon="trash-alt" />
            <span>Clear Cart</span>
          </button>
          <button class="checkout-btn" @click="checkout">
            <font-awesome-icon icon="shopping-cart" />
            <span>Proceed to Checkout</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

@media (max-width: 768px) {
  .cart-overlay {
    padding: 0;
    align-items: stretch;
  }
}

.cart-container {
  background-color: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

@media (max-width: 768px) {
  .cart-container {
    max-width: 100%;
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
  }
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.cart-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--charcoal);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--charcoal);
}

.cart-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.cart-loading,
.cart-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.cart-empty-hint {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
}

.cart-item-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: white;
}

.cart-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
}

.no-image-placeholder img {
  width: 40%;
  height: 40%;
  opacity: 0.3;
}

.cart-item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cart-item-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--charcoal);
  margin: 0;
}

.cart-item-price {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.cart-item-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: auto;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.quantity-btn {
  background: none;
  border: none;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--torii);
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.quantity-btn:hover {
  background-color: #f3f4f6;
}

.quantity {
  font-size: 1rem;
  font-weight: 500;
  min-width: 2rem;
  text-align: center;
  color: var(--charcoal);
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.remove-btn:hover {
  opacity: 0.7;
}

.cart-item-subtotal {
  font-size: 1rem;
  font-weight: 600;
  color: var(--torii);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.cart-footer {
  border-top: 1px solid #e5e7eb;
  padding: 1.5rem;
  background-color: #f9fafb;
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;
}

@media (max-width: 768px) {
  .cart-footer {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}

.cart-summary {
  margin-bottom: 1rem;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--charcoal);
}

.total-price {
  color: var(--torii);
  font-size: 1.5rem;
}

.cart-actions {
  display: flex;
  gap: 1rem;
}

@media (max-width: 480px) {
  .cart-actions {
    flex-direction: column;
  }
}

.clear-cart-btn,
.checkout-btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.clear-cart-btn {
  background-color: white;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.clear-cart-btn:hover {
  background-color: #f9fafb;
  color: var(--charcoal);
}

.checkout-btn {
  background-color: var(--torii);
  color: white;
}

.checkout-btn:hover {
  background-color: #c83e3e;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
</style>
