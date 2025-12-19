<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import apiService from "@/services/apiService.js";
import { BASE_URL } from "@/services/apiService.js";
import authService from "@/services/authService.js";
import Payment from "@/components/Payment.vue";

const router = useRouter();
const route = useRoute();
const isLoading = ref(true);
const order = ref(null);
const error = ref("");
const dishDetails = ref(new Map());
const showPaymentPopup = ref(false);

const orderId = route.params.id;

const orderTotal = computed(() => {
  if (!order.value?.items) return 0;
  return order.value.items.reduce((total, item) => {
    const price = getItemPrice(item);
    const quantity = getItemQuantity(item);
    return total + price * quantity;
  }, 0);
});

const getItemPrice = (item) => {
  // Try to get price from item first, then from dish details
  if (item.price) return item.price;
  const dishId = item.dishID || item.id;
  const dish = dishDetails.value.get(dishId);
  return dish?.Price || 0;
};

const getItemQuantity = (item) => {
  // Handle various quantity field names and default to 1
  return item.quantity || item.Quantity || item.aantal || 1;
};

const getItemSubtotal = (item) => {
  const price = getItemPrice(item);
  const quantity = getItemQuantity(item);
  return price * quantity;
};

const fetchDishDetails = async (items) => {
  try {
    const dishPromises = items.map(async (item) => {
      const dishId = item.dishID || item.id;
      if (dishId && !dishDetails.value.has(dishId)) {
        try {
          const dishData = await apiService.getDishById(dishId);
          return { dishId, data: dishData.dish || dishData };
        } catch (err) {
          console.error(`Failed to fetch dish ${dishId}:`, err);
          return { dishId, data: null };
        }
      }
      return null;
    });

    const results = await Promise.all(dishPromises);

    // Store dish details in the Map
    results.forEach((result) => {
      if (result && result.data) {
        dishDetails.value.set(result.dishId, result.data);
      }
    });
  } catch (err) {
    console.error("Failed to fetch dish details:", err);
  }
};

const fetchOrderDetails = async () => {
  try {
    isLoading.value = true;
    error.value = "";

    const response = await apiService.getOrderById(orderId);
    order.value = response.order || response;

    // Fetch detailed information for each dish
    if (order.value?.items && order.value.items.length > 0) {
      await fetchDishDetails(order.value.items);
    }
  } catch (err) {
    console.error("Failed to fetch order details:", err);

    // If 401, check if user is actually logged in
    if (
      err.status === 401 ||
      err.message.includes("401") ||
      err.message.includes("Unauthorized")
    ) {
      if (!authService.isAuthenticated()) {
        // Not logged in, redirect to login
        await authService.logout();
        router.push({ name: "Login", query: { redirect: route.fullPath } });
        return;
      } else {
        // Logged in but order not accessible (likely doesn't belong to user)
        error.value = "Order not found";
      }
    } else if (err.status === 404) {
      // Order doesn't exist
      error.value = "Order not found";
    } else if (err.status === 500) {
      // Server error
      error.value = "Something went wrong. Please try again later.";
    } else {
      error.value = err.message || "Failed to load order details";
    }
  } finally {
    isLoading.value = false;
  }
};

const getStatusColor = (status) => {
  const statusMap = {
    ordered: "bg-yellow-100 text-yellow-800 border-yellow-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
    preparing: "bg-blue-100 text-blue-800 border-blue-200",
    delivering: "bg-purple-100 text-purple-800 border-purple-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    statusMap[status?.toLowerCase()] ||
    "bg-gray-100 text-gray-800 border-gray-200"
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
};

const getImageUrl = (item) => {
  // Try item.image first, then dish details
  const imagePath =
    item.image || dishDetails.value.get(item.dishID || item.id)?.Image;

  if (!imagePath) return null;

  // If it's already a full URL (starts with http), use it as-is
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Otherwise, prepend BASE_URL
  return BASE_URL + imagePath;
};

const openPaymentPopup = () => {
  showPaymentPopup.value = true;
};

const closePaymentPopup = () => {
  showPaymentPopup.value = false;
};

const handlePaymentComplete = async () => {
  // Close popup
  closePaymentPopup();

  // Refresh order details to show updated payment status
  await fetchOrderDetails();

  // Update unpaid orders status
  localStorage.removeItem("lastUnpaidOrderCheck");
  window.dispatchEvent(new Event("unpaidOrdersUpdated"));
};

onMounted(() => {
  fetchOrderDetails();
});
</script>

<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Back Button -->
      <button
        @click="router.push('/orders')"
        class="mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <font-awesome-icon icon="arrow-left" class="mr-2" />
        Back to Orders
      </button>

      <!-- Loading State -->
      <div v-if="isLoading" class="bg-white shadow rounded-lg p-8">
        <div class="animate-pulse space-y-6">
          <div class="h-8 bg-gray-200 rounded w-1/3"></div>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
            <div class="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-lg p-6"
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
            <h3 class="text-sm font-medium text-red-800">
              Error loading order
            </h3>
            <p class="mt-2 text-sm text-red-700">{{ error }}</p>
            <div class="mt-3 space-x-3">
              <button
                v-if="error !== 'Order not found'"
                @click="fetchOrderDetails"
                class="text-sm font-medium text-red-600 hover:text-red-500 inline-flex items-center"
              >
                <font-awesome-icon icon="redo" class="mr-1" />
                Try again
              </button>
              <button
                @click="router.push('/orders')"
                class="text-sm font-medium text-red-600 hover:text-red-500 inline-flex items-center"
              >
                <font-awesome-icon icon="clipboard-list" class="mr-1" />
                View all orders
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Details -->
      <div v-else-if="order" class="space-y-6">
        <!-- Order Header -->
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">
                Order #{{ order.OrderID || order.id }}
              </h1>
              <p class="text-sm text-gray-500 mt-1">
                Placed on {{ formatDate(order.Ordered_at || order.createdAt) }}
              </p>
            </div>
            <span
              class="px-4 py-2 text-sm font-semibold rounded-lg border-2"
              :class="getStatusColor(order.Status || order.status)"
            >
              {{ order.Status || order.status }}
            </span>
          </div>

          <!-- Order Timeline -->
          <div class="border-t pt-6 mt-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              Order Status
            </h2>
            <div class="space-y-3">
              <div class="flex items-center">
                <div
                  class="w-3 h-3 rounded-full"
                  :class="order.Ordered_at ? 'bg-green-500' : 'bg-gray-300'"
                ></div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Ordered</p>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(order.Ordered_at) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center">
                <div
                  class="w-3 h-3 rounded-full"
                  :class="order.processing_at ? 'bg-green-500' : 'bg-gray-300'"
                ></div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Processing</p>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(order.processing_at) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center">
                <div
                  class="w-3 h-3 rounded-full"
                  :class="order.Delivering_at ? 'bg-green-500' : 'bg-gray-300'"
                ></div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Delivering</p>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(order.Delivering_at) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center">
                <div
                  class="w-3 h-3 rounded-full"
                  :class="order.Completed_at ? 'bg-green-500' : 'bg-gray-300'"
                ></div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">Completed</p>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(order.Completed_at) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Items -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
          <div class="divide-y">
            <div
              v-for="item in order.items"
              :key="item.dishID || item.id"
              class="py-4"
            >
              <div class="flex justify-between items-start">
                <div class="flex items-start space-x-4 flex-1">
                  <img
                    v-if="getImageUrl(item)"
                    :src="getImageUrl(item)"
                    :alt="item.name || item.dishName"
                    class="w-20 h-20 object-cover rounded"
                  />
                  <div class="flex-1">
                    <p class="font-medium text-gray-900 text-lg">
                      {{
                        item.name ||
                        item.dishName ||
                        dishDetails.get(item.dishID || item.id)?.Name ||
                        `Dish #${item.dishID}`
                      }}
                    </p>
                    <p class="text-gray-500 mt-1">
                      Quantity: {{ getItemQuantity(item) }}
                    </p>
                    <p class="text-sm text-gray-600 mt-1">
                      ${{ getItemPrice(item).toFixed(2) }} each
                    </p>

                    <!-- Display ingredients from detailed dish data -->
                    <div
                      v-if="
                        dishDetails.get(item.dishID || item.id)?.Ingredients
                      "
                      class="mt-2"
                    >
                      <p class="text-xs font-semibold text-gray-700 uppercase">
                        Ingredients:
                      </p>
                      <p class="text-sm text-gray-600 mt-1">
                        {{
                          dishDetails.get(item.dishID || item.id)?.Ingredients
                        }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="ml-4 text-right">
                  <p class="font-semibold text-gray-900 text-lg">
                    ${{ getItemSubtotal(item).toFixed(2) }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ getItemQuantity(item) }} × ${{
                      getItemPrice(item).toFixed(2)
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Total -->
          <div class="border-t pt-4 mt-4">
            <div class="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>${{ orderTotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between items-center mt-2">
              <span class="text-sm font-medium">Payment Status</span>
              <span
                class="text-sm font-semibold"
                :class="order.Paid ? 'text-green-600' : 'text-red-600'"
              >
                {{ order.Paid ? "Paid" : "Unpaid" }}
              </span>
            </div>

            <!-- Payment Button (shown when order is not paid) -->
            <div v-if="!order.Paid" class="mt-4">
              <button
                @click="openPaymentPopup"
                class="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                <font-awesome-icon icon="credit-card" class="mr-2" />
                Pay Now
              </button>
            </div>
          </div>
        </div>

        <!-- Delivery Information -->
        <div
          v-if="order.delivery_address"
          class="bg-white shadow rounded-lg p-6"
        >
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Delivery Information
          </h2>
          <p class="text-gray-700">{{ order.delivery_address }}</p>
        </div>
      </div>

      <!-- Payment Component -->
      <Payment
        v-if="showPaymentPopup"
        :orderId="orderId"
        :orderTotal="orderTotal"
        @close="closePaymentPopup"
        @paymentComplete="handlePaymentComplete"
      />
    </div>
  </div>
</template>

<style scoped></style>
