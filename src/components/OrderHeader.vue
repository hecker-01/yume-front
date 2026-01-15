<script setup>
import { defineProps } from "vue";

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

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
</script>

<template>
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
  </div>
</template>
