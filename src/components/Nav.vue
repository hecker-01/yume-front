<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { getCartItemCount } from "@/services/cartService";
import Cart from "@/components/Cart.vue";
import apiService from "@/services/apiService";
import authService from "@/services/authService";

const route = useRoute();
const router = useRouter();
const showCart = ref(false);
const cartItemCount = ref(0);
const hasUnpaidOrders = ref(false);

const updateCartCount = () => {
  cartItemCount.value = getCartItemCount();
};

const toggleCart = () => {
  showCart.value = !showCart.value;
};

const closeCart = () => {
  showCart.value = false;
};

const hasCartItems = computed(() => cartItemCount.value > 0);

const checkUnpaidOrders = async () => {
  // Check if user is logged in
  if (!authService.isAuthenticated()) {
    hasUnpaidOrders.value = false;
    localStorage.removeItem("hasUnpaidOrders");
    return;
  }

  // Check localStorage first to avoid API spam
  const cachedStatus = localStorage.getItem("hasUnpaidOrders");
  const lastCheck = localStorage.getItem("lastUnpaidOrderCheck");
  const now = Date.now();

  // Use cached value if it exists and was checked recently (within 5 minutes)
  if (
    cachedStatus !== null &&
    lastCheck &&
    now - parseInt(lastCheck) < 5 * 60 * 1000
  ) {
    hasUnpaidOrders.value = cachedStatus === "true";
    return;
  }

  // Fetch from API
  try {
    const response = await apiService.getOrders();
    const orders = response.orders || response || [];

    // Check if any order is unpaid
    const hasUnpaid = orders.some(
      (order) => !order.Paid && order.Paid !== true
    );

    hasUnpaidOrders.value = hasUnpaid;
    localStorage.setItem("hasUnpaidOrders", hasUnpaid.toString());
    localStorage.setItem("lastUnpaidOrderCheck", now.toString());
  } catch (error) {
    console.error("Failed to check unpaid orders:", error);
  }
};

const handleUnpaidOrdersUpdated = () => {
  // Force recheck when this event is triggered
  localStorage.removeItem("lastUnpaidOrderCheck");
  checkUnpaidOrders();
};

const goToOrders = () => {
  router.push("/orders");
};

// Update cart count on mount
onMounted(() => {
  updateCartCount();
  checkUnpaidOrders();

  // Listen for storage events to update cart count when changed in other tabs/components
  window.addEventListener("storage", updateCartCount);
  // Custom event for same-tab updates
  window.addEventListener("cartUpdated", updateCartCount);
  // Custom event for unpaid orders updates
  window.addEventListener("unpaidOrdersUpdated", handleUnpaidOrdersUpdated);
});

onUnmounted(() => {
  window.removeEventListener("storage", updateCartCount);
  window.removeEventListener("cartUpdated", updateCartCount);
  window.removeEventListener("unpaidOrdersUpdated", handleUnpaidOrdersUpdated);
});
</script>

<template>
  <nav class="nav-container">
    <!-- Unpaid Orders Banner -->
    <div v-if="hasUnpaidOrders" class="unpaid-banner" @click="goToOrders">
      <font-awesome-icon icon="exclamation-circle" class="banner-icon" />
      <span class="banner-text">You have unpaid orders</span>
      <font-awesome-icon icon="chevron-right" class="banner-arrow" />
    </div>

    <!-- Floating Cart Icon -->
    <button
      v-if="hasCartItems"
      class="floating-cart-btn"
      @click="toggleCart"
      aria-label="View cart"
    >
      <font-awesome-icon icon="shopping-cart" class="cart-icon" />
      <span class="cart-badge">{{ cartItemCount }}</span>
    </button>

    <ul class="nav-list">
      <!-- Orders -->
      <li>
        <router-link
          to="/orders"
          class="nav-link"
          :class="{ active: route.name === 'Orders' }"
        >
          <font-awesome-icon icon="clipboard-list" class="nav-icon" />
          <span class="nav-label">Orders</span>
        </router-link>
      </li>

      <!-- Home (Larger on Mobile) -->
      <li>
        <router-link
          to="/"
          class="nav-link"
          :class="{ active: route.name === 'Home' }"
        >
          <font-awesome-icon icon="home" class="nav-icon nav-icon-home" />
          <span class="nav-label">Home</span>
        </router-link>
      </li>

      <!-- Account -->
      <li>
        <router-link
          to="/account"
          class="nav-link"
          :class="{ active: route.name === 'Account' }"
        >
          <font-awesome-icon icon="user-circle" class="nav-icon" />
          <span class="nav-label">Account</span>
        </router-link>
      </li>
    </ul>

    <!-- Cart Popup -->
    <Cart v-if="showCart" @close="closeCart" @update="updateCartCount" />
  </nav>
</template>

<style scoped>
.nav-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--charcoal);
  color: white;
  z-index: 50;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Unpaid Orders Banner */
.unpaid-banner {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: var(--charcoal);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  .unpaid-banner {
    border-top-left-radius: 1rem;
    border-top-right-radius: 1rem;
    font-size: 0.95rem;
  }
}

.unpaid-banner:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  transform: translateY(-2px);
}

.banner-icon {
  font-size: 1.1rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.banner-text {
  flex: 1;
  text-align: center;
}

@media (min-width: 768px) {
  .banner-text {
    flex: initial;
  }
}

.banner-arrow {
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  .nav-container {
    background-color: var(--card-bg);
    margin-left: 2rem;
    margin-right: 2rem;
    margin-bottom: 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid var(--border-subtle);
  }
}

/* Floating Cart Button */
.floating-cart-btn {
  position: absolute;
  top: -1.5rem;
  right: 1rem;
  background-color: var(--torii);
  color: white;
  border: none;
  border-radius: 50%;
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 60;
}

@media (min-width: 768px) {
  .floating-cart-btn {
    top: -1.75rem;
    right: 2rem;
    width: 4rem;
    height: 4rem;
  }
}

.floating-cart-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.4);
  background-color: #c83e3e;
}

.floating-cart-btn:active {
  transform: translateY(-2px);
}

.cart-icon {
  font-size: 1.5rem;
}

@media (min-width: 768px) {
  .cart-icon {
    font-size: 1.75rem;
  }
}

.cart-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background-color: #fbbf24;
  color: var(--charcoal);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.nav-list {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

@media (min-width: 768px) {
  .nav-list {
    padding-top: 1rem;
    padding-bottom: 1rem;
    padding-left: 2rem;
    padding-right: 2rem;
    justify-content: center;
    gap: 3rem;
  }
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s;
  color: #6b7280;
}

@media (min-width: 768px) {
  .nav-link {
    flex-direction: row;
    gap: 0.75rem;
    color: var(--sumi);
  }

  .nav-link:hover {
    color: var(--torii);
    background-color: #f9fafb;
  }
}

.nav-link.active {
  color: white;
}

@media (min-width: 768px) {
  .nav-link.active {
    background-color: var(--torii);
    color: white;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
}

.nav-icon {
  font-size: 1.5rem;
}

.nav-icon-home {
  font-size: 1.875rem;
}

@media (min-width: 768px) {
  .nav-icon-home {
    font-size: 1.5rem;
  }
}

.nav-label {
  font-size: 0.75rem;
}

@media (min-width: 768px) {
  .nav-label {
    font-size: 1rem;
    font-weight: 500;
  }
}
</style>
