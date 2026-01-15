<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";
import Payment from "@/components/Payment.vue";
import OrderHeader from "@/components/OrderHeader.vue";
import OrderTimeline from "@/components/OrderTimeline.vue";
import OrderItemsList from "@/components/OrderItemsList.vue";
import DeliveryInfo from "@/components/DeliveryInfo.vue";

const router = useRouter();
const route = useRoute();
const isLoading = ref(true);
const order = ref(null);
const error = ref("");
const dishDetails = ref(new Map());
const showPaymentPopup = ref(false);
let refreshInterval = null;

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

const fetchOrderDetails = async (showLoading = true) => {
  try {
    // Only show loading state on initial load
    if (showLoading) {
      isLoading.value = true;
    }
    error.value = "";

    const response = await apiService.getOrderById(orderId);
    const newOrder = response.order || response;

    // Compare the new data with existing data
    const hasChanged = JSON.stringify(order.value) !== JSON.stringify(newOrder);

    // Only update if data has changed
    if (hasChanged) {
      order.value = newOrder;

      // Fetch detailed information for each dish
      if (order.value?.items && order.value.items.length > 0) {
        await fetchDishDetails(order.value.items);
      }
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
    if (showLoading) {
      isLoading.value = false;
    }
  }
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
  fetchOrderDetails(true);

  // Refresh order data every 10 seconds for real-time updates
  refreshInterval = setInterval(() => {
    // Silent refresh without loading state
    fetchOrderDetails(false);
  }, 10000);
});

onBeforeUnmount(() => {
  // Clean up interval when component is unmounted
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
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
        <OrderHeader :order="order" />

        <!-- Order Timeline -->
        <div class="bg-white shadow rounded-lg p-6">
          <OrderTimeline :order="order" />
        </div>

        <!-- Order Items -->
        <OrderItemsList
          :order="order"
          :dishDetails="dishDetails"
          :orderTotal="orderTotal"
          @openPayment="openPaymentPopup"
        />

        <!-- Delivery Information -->
        <DeliveryInfo
          v-if="order.delivery_address"
          :deliveryAddress="order.delivery_address"
        />
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
