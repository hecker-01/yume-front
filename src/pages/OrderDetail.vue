<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
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

const getProgressWidth = () => {
  if (!order.value) return "0%";

  const currentStatus = (
    order.value.Status ||
    order.value.status ||
    ""
  ).toLowerCase();

  // Calculate progress based on order status
  if (currentStatus === "completed") return "75%";
  if (currentStatus === "delivering") return "50%";
  if (currentStatus === "processing" || currentStatus === "preparing")
    return "25%";
  if (currentStatus === "ordered" || currentStatus === "pending") return "0%";

  return "0%";
};

const getCurrentActiveStep = () => {
  if (!order.value) return null;

  const currentStatus = (
    order.value.Status ||
    order.value.status ||
    ""
  ).toLowerCase();

  // Return the current active step based on status
  // If completed, return null (no animation)
  if (currentStatus === "completed") return null;
  if (currentStatus === "delivering") return "delivering";
  if (currentStatus === "processing" || currentStatus === "preparing")
    return "processing";
  if (currentStatus === "ordered" || currentStatus === "pending")
    return "ordered";

  return null;
};

// Helper to check if a step should be shown as active
// based on the current order status (not just timestamps)
const isStepActive = (step) => {
  if (!order.value) return false;

  const currentStatus = (
    order.value.Status ||
    order.value.status ||
    ""
  ).toLowerCase();

  // Define the order of statuses
  const statusOrder = [
    "ordered",
    "pending",
    "processing",
    "preparing",
    "delivering",
    "completed",
  ];

  // Map step names to their status equivalents
  const stepToStatus = {
    ordered: ["ordered", "pending"],
    processing: ["processing", "preparing"],
    delivering: ["delivering"],
    completed: ["completed"],
  };

  // Get the index of the current status
  const currentIndex = Math.max(
    ...statusOrder.map((s, i) =>
      currentStatus.includes(s) || currentStatus === s ? i : -1
    )
  );

  // Get the index of the step we're checking
  const stepStatuses = stepToStatus[step] || [];
  const stepIndex = Math.max(
    ...stepStatuses.map((s) => statusOrder.indexOf(s))
  );

  // Step is active if current status index is >= step index
  return currentIndex >= stepIndex && stepIndex >= 0;
};

// Helper to get display text for step timestamp
const getStepDisplayTime = (step) => {
  if (!order.value) return "Pending";

  // First check if this step should be active based on progress
  // If not active, always show Pending regardless of timestamp
  if (!isStepActive(step)) {
    return "Pending";
  }

  // Step is active, now check if it has a timestamp
  let timestamp = null;
  switch (step) {
    case "ordered":
      timestamp = order.value.Ordered_at;
      break;
    case "processing":
      timestamp = order.value.processing_at;
      break;
    case "delivering":
      timestamp = order.value.Delivering_at;
      break;
    case "completed":
      timestamp = order.value.Completed_at;
      break;
  }

  // If timestamp exists, format it
  if (timestamp) {
    return formatDate(timestamp).split(",")[0];
  }

  // If no timestamp but step is active, show N/A
  return "N/A";
};

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

  // Refresh order data every 10 seconds for real-time updates
  refreshInterval = setInterval(() => {
    fetchOrderDetails();
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
              {{
                (order.Status || order.status).charAt(0).toUpperCase() +
                (order.Status || order.status).slice(1)
              }}
            </span>
          </div>

          <!-- Order Timeline -->
          <div class="border-t pt-6 mt-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-8">
              Order Status
            </h2>

            <!-- Modern Horizontal Timeline -->
            <transition name="timeline-update" mode="out-in">
              <div
                :key="getCurrentActiveStep()"
                class="relative timeline-container"
              >
                <!-- Timeline Steps Container -->
                <div class="relative flex justify-between items-start">
                  <!-- Progress Line Background -->
                  <div class="absolute progress-line-bg"></div>

                  <!-- Active Progress Line with Animation -->
                  <div
                    class="absolute progress-line-active"
                    :style="{ width: getProgressWidth() }"
                  ></div>

                  <!-- Step 1: Ordered -->
                  <div
                    class="flex flex-col items-center flex-1 timeline-step"
                    :class="{
                      active: isStepActive('ordered'),
                      'current-step': getCurrentActiveStep() === 'ordered',
                    }"
                  >
                    <div
                      class="relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-500 shadow-lg"
                      :class="
                        isStepActive('ordered')
                          ? 'bg-torii border-torii-hover'
                          : 'bg-white border-gray-300'
                      "
                    >
                      <font-awesome-icon
                        icon="shopping-bag"
                        class="text-xl transition-all duration-500"
                        :class="[
                          isStepActive('ordered')
                            ? 'text-white'
                            : 'text-gray-400',
                          getCurrentActiveStep() === 'ordered'
                            ? 'icon-bounce'
                            : '',
                        ]"
                      />
                    </div>
                    <div class="mt-4 text-center px-2">
                      <p
                        class="text-sm font-bold transition-colors duration-300 whitespace-nowrap"
                        :class="
                          isStepActive('ordered')
                            ? 'text-black'
                            : 'text-gray-500'
                        "
                      >
                        Ordered
                      </p>
                      <p class="text-xs text-gray-500 mt-1 whitespace-nowrap">
                        {{ getStepDisplayTime("ordered") }}
                      </p>
                    </div>
                  </div>

                  <!-- Step 2: Processing -->
                  <div
                    class="flex flex-col items-center flex-1 timeline-step"
                    :class="{
                      active: isStepActive('processing'),
                      'current-step': getCurrentActiveStep() === 'processing',
                    }"
                  >
                    <div
                      class="relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-500 shadow-lg"
                      :class="
                        isStepActive('processing')
                          ? 'bg-torii border-torii-hover'
                          : 'bg-white border-gray-300'
                      "
                    >
                      <font-awesome-icon
                        icon="utensils"
                        class="text-xl transition-all duration-500"
                        :class="[
                          isStepActive('processing')
                            ? 'text-white'
                            : 'text-gray-400',
                          getCurrentActiveStep() === 'processing'
                            ? 'icon-bounce'
                            : '',
                        ]"
                      />
                    </div>
                    <div class="mt-4 text-center px-2">
                      <p
                        class="text-sm font-bold transition-colors duration-300 whitespace-nowrap"
                        :class="
                          isStepActive('processing')
                            ? 'text-black'
                            : 'text-gray-500'
                        "
                      >
                        Processing
                      </p>
                      <p class="text-xs text-gray-500 mt-1 whitespace-nowrap">
                        {{ getStepDisplayTime("processing") }}
                      </p>
                    </div>
                  </div>

                  <!-- Step 3: Delivering -->
                  <div
                    class="flex flex-col items-center flex-1 timeline-step"
                    :class="{
                      active: isStepActive('delivering'),
                      'current-step': getCurrentActiveStep() === 'delivering',
                    }"
                  >
                    <div
                      class="relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-500 shadow-lg"
                      :class="
                        isStepActive('delivering')
                          ? 'bg-torii border-torii-hover'
                          : 'bg-white border-gray-300'
                      "
                    >
                      <font-awesome-icon
                        icon="truck"
                        class="text-xl transition-all duration-500"
                        :class="[
                          isStepActive('delivering')
                            ? 'text-white'
                            : 'text-gray-400',
                          getCurrentActiveStep() === 'delivering'
                            ? 'icon-bounce'
                            : '',
                        ]"
                      />
                    </div>
                    <div class="mt-4 text-center px-2">
                      <p
                        class="text-sm font-bold transition-colors duration-300 whitespace-nowrap"
                        :class="
                          isStepActive('delivering')
                            ? 'text-black'
                            : 'text-gray-500'
                        "
                      >
                        Delivering
                      </p>
                      <p class="text-xs text-gray-500 mt-1 whitespace-nowrap">
                        {{ getStepDisplayTime("delivering") }}
                      </p>
                    </div>
                  </div>

                  <!-- Step 4: Completed -->
                  <div
                    class="flex flex-col items-center flex-1 timeline-step"
                    :class="{ active: isStepActive('completed') }"
                  >
                    <div
                      class="relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-500 shadow-lg"
                      :class="
                        isStepActive('completed')
                          ? 'bg-torii border-torii-hover'
                          : 'bg-white border-gray-300'
                      "
                    >
                      <font-awesome-icon
                        icon="check-circle"
                        class="text-xl transition-all duration-500"
                        :class="
                          isStepActive('completed')
                            ? 'text-white'
                            : 'text-gray-400'
                        "
                      />
                    </div>
                    <div class="mt-4 text-center px-2">
                      <p
                        class="text-sm font-bold transition-colors duration-300 whitespace-nowrap"
                        :class="
                          isStepActive('completed')
                            ? 'text-black'
                            : 'text-gray-500'
                        "
                      >
                        Completed
                      </p>
                      <p class="text-xs text-gray-500 mt-1 whitespace-nowrap">
                        {{ getStepDisplayTime("completed") }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
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
                    draggable="false"
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

<style scoped>
/* Smooth transition for timeline updates */
.timeline-update-enter-active,
.timeline-update-leave-active {
  transition: all 0.4s ease;
}

.timeline-update-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.timeline-update-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Timeline Container */
.timeline-container {
  padding: 2rem 2rem;
}

/* Progress Line Background */
.progress-line-bg {
  top: 2rem;
  left: 12.5%;
  right: 12.5%;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
}

/* Active Progress Line */
.progress-line-active {
  top: 2rem;
  left: 12.5%;
  height: 4px;
  background: #c0392b;
  transition: width 1s ease-out;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
  border-radius: 2px;
}

/* Icon bounce animation - only for current step */
.timeline-step.current-step .icon-bounce {
  animation: iconBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes iconBounce {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* Pulse animation for current step only */
.timeline-step.current-step > div:first-child {
  position: relative;
  animation: iconScale 0.5s ease-out forwards;
}

@keyframes iconScale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1.05);
  }
}

/* Glowing effect for current step only */
.timeline-step.current-step > div:first-child::before {
  content: "";
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.2;
  animation: pulseGlow 2s infinite;
  z-index: -1;
}

@keyframes pulseGlow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.2;
  }
  50% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* Responsive Timeline for tablets */
@media (max-width: 768px) {
  .timeline-container {
    padding: 1.5rem 1rem;
  }

  .progress-line-bg,
  .progress-line-active {
    top: 1.75rem;
    left: 12.5%;
    right: 12.5%;
  }

  .timeline-step > div:first-child {
    width: 3.5rem;
    height: 3.5rem;
  }

  .timeline-step svg {
    font-size: 1rem !important;
  }

  .timeline-step p {
    font-size: 0.75rem !important;
  }

  .timeline-step p.text-xs {
    font-size: 0.625rem !important;
  }
}

/* Responsive Timeline for mobile */
@media (max-width: 640px) {
  .timeline-container {
    padding: 1.5rem 0.5rem;
  }

  .progress-line-bg,
  .progress-line-active {
    top: 1.5rem;
    left: 12.5%;
    right: 12.5%;
    height: 3px;
  }

  .timeline-step > div:first-child {
    width: 3rem;
    height: 3rem;
  }

  .timeline-step svg {
    font-size: 0.875rem !important;
  }

  .timeline-step p {
    font-size: 0.625rem !important;
  }

  .timeline-step p.text-xs {
    display: none;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .timeline-container {
    padding: 1.25rem 0.25rem;
  }

  .progress-line-bg,
  .progress-line-active {
    top: 1.25rem;
    left: 12.5%;
    right: 12.5%;
    height: 2px;
  }

  .timeline-step > div:first-child {
    width: 2.5rem;
    height: 2.5rem;
    border-width: 3px;
  }

  .timeline-step svg {
    font-size: 0.75rem !important;
  }

  .timeline-step p {
    font-size: 0.5rem !important;
  }
}
</style>
