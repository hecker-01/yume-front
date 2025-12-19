<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getCart, clearCart } from "@/services/cartService";
import apiService, { BASE_URL } from "@/services/apiService";
import authService from "@/services/authService";

const router = useRouter();
const isLoading = ref(true);
const isPlacingOrder = ref(false);
const cart = ref([]);
const dishes = ref([]);
const user = ref(null);
const error = ref("");
const useAccountAddress = ref(true);
const customAddress = ref("");

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

const deliveryAddress = computed(() => {
  if (useAccountAddress.value) {
    return user.value?.address || "";
  }
  return customAddress.value;
});

const loadCheckoutData = async () => {
  try {
    isLoading.value = true;
    error.value = "";

    // Check if user is logged in
    if (!authService.isAuthenticated()) {
      router.push({ name: "Login", query: { redirect: "/checkout" } });
      return;
    }

    // Get current user
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      const response = await apiService.getUserById(currentUser.id);
      user.value = response.user || response;
    }

    // Load cart
    cart.value = getCart();

    // Check if cart is empty
    if (cart.value.length === 0) {
      error.value = "Your cart is empty";
      return;
    }

    // Fetch dish details
    const dishResponse = await apiService.getDishes();
    if (Array.isArray(dishResponse)) {
      dishes.value = dishResponse;
    } else if (dishResponse && Array.isArray(dishResponse.data)) {
      dishes.value = dishResponse.data;
    } else if (dishResponse && Array.isArray(dishResponse.dishes)) {
      dishes.value = dishResponse.dishes;
    }
  } catch (err) {
    console.error("Failed to load checkout data:", err);
    error.value = err.message || "Failed to load checkout data";
  } finally {
    isLoading.value = false;
  }
};

const placeOrder = async () => {
  try {
    isPlacingOrder.value = true;
    error.value = "";

    // Validate delivery address
    if (!deliveryAddress.value || deliveryAddress.value.trim() === "") {
      error.value = "Please provide a delivery address";
      return;
    }

    // Prepare order items
    const items = cart.value.map((item) => ({
      dishID: item.dishId,
      quantity: item.quantity,
    }));

    // Create order with delivery address
    const orderResponse = await apiService.createOrder(
      items,
      deliveryAddress.value
    );
    console.log("Order response:", orderResponse);
    console.log("Delivery address sent:", deliveryAddress.value);

    // Try multiple possible response structures
    // According to swagger: returns { message, orderId }
    const orderId =
      orderResponse.orderId || // Most likely based on swagger
      orderResponse.order?.OrderID ||
      orderResponse.order?.id ||
      orderResponse.OrderID ||
      orderResponse.id;

    console.log("Extracted order ID:", orderId);

    if (!orderId) {
      console.error("Could not extract order ID from response:", orderResponse);
      throw new Error("Failed to create order - no order ID returned");
    }

    // Clear cart
    clearCart();

    // Update unpaid orders status (new order is unpaid by default)
    localStorage.setItem("hasUnpaidOrders", "true");
    localStorage.removeItem("lastUnpaidOrderCheck");
    window.dispatchEvent(new Event("unpaidOrdersUpdated"));

    // Redirect to order detail page
    router.push({ name: "OrderDetail", params: { id: orderId } });
  } catch (err) {
    console.error("Failed to place order:", err);
    error.value = err.message || "Failed to place order";
  } finally {
    isPlacingOrder.value = false;
  }
};

const getImageUrl = (dish) => {
  return dish.Image ? BASE_URL + dish.Image : null;
};

onMounted(() => {
  loadCheckoutData();
});
</script>

<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <!-- Loading State -->
      <div v-if="isLoading" class="bg-white shadow rounded-lg p-8">
        <div class="animate-pulse space-y-6">
          <div class="h-8 bg-gray-200 rounded w-1/3"></div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error && (!cart || cart.length === 0)"
        class="bg-red-50 border border-red-200 rounded-lg p-6"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <font-awesome-icon
              icon="exclamation-circle"
              class="h-5 w-5 text-red-400"
            />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">{{ error }}</h3>
            <div class="mt-4">
              <button
                @click="router.push({ name: 'Home' })"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Checkout Content -->
      <div v-else class="space-y-6">
        <!-- Order Items -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
          <div class="space-y-4">
            <div
              v-for="item in cartItems"
              :key="item.DishID"
              class="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-b-0"
            >
              <div
                class="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  v-if="getImageUrl(item)"
                  :src="getImageUrl(item)"
                  :alt="item.Name"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-gray-400"
                >
                  <font-awesome-icon icon="image" class="text-2xl" />
                </div>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ item.Name }}</h3>
                <p class="text-sm text-gray-500">
                  Quantity: {{ item.quantity }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-gray-900">
                  €{{ item.subtotal.toFixed(2) }}
                </p>
                <p class="text-sm text-gray-500">
                  €{{ item.Price.toFixed(2) }} each
                </p>
              </div>
            </div>
          </div>

          <!-- Order Total -->
          <div class="mt-6 pt-6 border-t border-gray-200">
            <div class="flex justify-between items-center">
              <span class="text-lg font-semibold text-gray-900">Total</span>
              <span class="text-2xl font-bold text-red-600"
                >€{{ totalPrice.toFixed(2) }}</span
              >
            </div>
          </div>
        </div>

        <!-- Delivery Address -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            Delivery Address
          </h2>

          <div class="space-y-4">
            <!-- Use Account Address -->
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="use-account-address"
                  v-model="useAccountAddress"
                  type="radio"
                  :value="true"
                  class="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300"
                />
              </div>
              <div class="ml-3">
                <label
                  for="use-account-address"
                  class="font-medium text-gray-700"
                >
                  Use my account address
                </label>
                <p class="text-gray-500 text-sm">
                  {{ user?.address || "No address on file" }}
                </p>
              </div>
            </div>

            <!-- Custom Address -->
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="use-custom-address"
                  v-model="useAccountAddress"
                  type="radio"
                  :value="false"
                  class="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300"
                />
              </div>
              <div class="ml-3 flex-1">
                <label
                  for="use-custom-address"
                  class="font-medium text-gray-700"
                >
                  Use a different address
                </label>
                <textarea
                  v-model="customAddress"
                  :disabled="useAccountAddress"
                  rows="3"
                  class="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Enter delivery address..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Checkout error</h3>
              <p class="mt-2 text-sm text-red-700">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <button
            @click="router.push({ name: 'Home' })"
            :disabled="isPlacingOrder"
            class="flex-1 px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            @click="placeOrder"
            :disabled="isPlacingOrder || !deliveryAddress"
            class="flex-1 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="isPlacingOrder">
              <font-awesome-icon icon="spinner" class="animate-spin" />
              Placing Order...
            </span>
            <span v-else>Place Order</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
