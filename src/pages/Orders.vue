<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";

const router = useRouter();
const isLoading = ref(true);
const orders = ref([]);
const error = ref("");

const fetchOrders = async () => {
  try {
    isLoading.value = true;
    error.value = "";

    // Get current user to fetch their orders
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      throw new Error("User not found");
    }

    // Fetch user's orders
    const response = await apiService.getOrders();
    orders.value = response.orders || response || [];

    // Update unpaid orders status in localStorage
    const hasUnpaid = orders.value.some(
      (order) => !order.Paid && order.Paid !== true
    );
    localStorage.setItem("hasUnpaidOrders", hasUnpaid.toString());
    localStorage.setItem("lastUnpaidOrderCheck", Date.now().toString());
    window.dispatchEvent(new Event("unpaidOrdersUpdated"));
  } catch (err) {
    console.error("Failed to fetch orders:", err);

    // If 401, token is invalid - redirect to login
    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
      await authService.logout();
      router.push({ name: "Login", query: { redirect: "/orders" } });
      return;
    } else if (err.status === 500) {
      error.value = "Something went wrong. Please try again later.";
    } else {
      error.value = err.message || "Failed to load orders";
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchOrders();
});
</script>

<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">
        Your Orders
      </h1>

      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="space-y-4">
        <div
          v-for="n in 3"
          :key="n"
          class="bg-white shadow rounded-lg p-6 animate-pulse"
        >
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <div class="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div class="h-6 bg-gray-200 rounded w-20"></div>
          </div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded w-full"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
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
              Error loading orders
            </h3>
            <p class="mt-2 text-sm text-red-700">{{ error }}</p>
            <button
              @click="fetchOrders"
              class="mt-3 text-sm font-medium text-red-600 hover:text-red-500 inline-flex items-center"
            >
              <font-awesome-icon icon="redo" class="mr-1" />
              Try again
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="orders.length === 0"
        class="bg-white shadow rounded-lg p-12 text-center"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
        <p class="mt-1 text-sm text-gray-500">
          Start ordering delicious ramen!
        </p>
        <div class="mt-6">
          <button
            @click="router.push('/')"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <font-awesome-icon icon="home" class="mr-2" />
            Browse Menu
          </button>
        </div>
      </div>

      <!-- Orders List -->
      <div v-else class="space-y-4">
        <div
          v-for="order in orders"
          :key="order.OrderID || order.id"
          class="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                Order #{{ order.OrderID || order.id }}
              </h3>
              <p class="text-sm text-gray-500">
                {{
                  new Date(
                    order.Ordered_at || order.createdAt
                  ).toLocaleDateString()
                }}
              </p>
            </div>
            <span
              class="px-3 py-1 text-sm font-semibold rounded-full"
              :class="{
                'bg-yellow-100 text-yellow-800':
                  order.Status === 'ordered' || order.status === 'pending',
                'bg-blue-100 text-blue-800':
                  order.Status === 'processing' || order.status === 'preparing',
                'bg-green-100 text-green-800':
                  order.Status === 'completed' || order.status === 'completed',
                'bg-red-100 text-red-800':
                  order.Status === 'cancelled' || order.status === 'cancelled',
              }"
            >
              {{ order.Status || order.status }}
            </span>
          </div>
          <div class="border-t pt-4">
            <p class="text-sm text-gray-600">
              Items: {{ order.items?.length || 0 }}
            </p>
            <p class="text-sm text-gray-600 mt-1" v-if="order.delivery_address">
              Delivery: {{ order.delivery_address }}
            </p>
            <div class="flex justify-between items-center mt-3">
              <span
                class="text-sm font-medium"
                :class="order.Paid ? 'text-green-600' : 'text-red-600'"
              >
                {{ order.Paid ? "Paid" : "Unpaid" }}
              </span>
              <button
                @click="router.push(`/orders/${order.OrderID || order.id}`)"
                class="text-sm font-medium text-red-600 hover:text-red-700 inline-flex items-center"
              >
                <font-awesome-icon icon="eye" class="mr-1" />
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
