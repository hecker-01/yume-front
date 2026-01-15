<script setup>
import { defineProps, defineEmits } from "vue";
import { BASE_URL } from "@/services/apiService.js";

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
  dishDetails: {
    type: Map,
    required: true,
  },
  orderTotal: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["openPayment"]);

const getItemPrice = (item) => {
  // Try to get price from item first, then from dish details
  if (item.price) return item.price;
  const dishId = item.dishID || item.id;
  const dish = props.dishDetails.get(dishId);
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

const getImageUrl = (item) => {
  // Try item.image first, then dish details
  const imagePath =
    item.image || props.dishDetails.get(item.dishID || item.id)?.Image;

  if (!imagePath) return null;

  // If it's already a full URL (starts with http), use it as-is
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Otherwise, prepend BASE_URL
  return BASE_URL + imagePath;
};
</script>

<template>
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
                v-if="dishDetails.get(item.dishID || item.id)?.Ingredients"
                class="mt-2"
              >
                <p class="text-xs font-semibold text-gray-700 uppercase">
                  Ingredients:
                </p>
                <p class="text-sm text-gray-600 mt-1">
                  {{ dishDetails.get(item.dishID || item.id)?.Ingredients }}
                </p>
              </div>
            </div>
          </div>
          <div class="ml-4 text-right">
            <p class="font-semibold text-gray-900 text-lg">
              ${{ getItemSubtotal(item).toFixed(2) }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              {{ getItemQuantity(item) }} × ${{ getItemPrice(item).toFixed(2) }}
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
          @click="$emit('openPayment')"
          class="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          <font-awesome-icon icon="credit-card" class="mr-2" />
          Pay Now
        </button>
      </div>
    </div>
  </div>
</template>
