<script setup>
import { defineProps } from "vue";

const props = defineProps({
  deliveryAddress: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="bg-white shadow rounded-lg p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">
      Delivery Information
    </h2>
    <p class="text-gray-700">{{ deliveryAddress }}</p>
  </div>
</template>
