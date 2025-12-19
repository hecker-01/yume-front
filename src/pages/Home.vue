<script setup>
import { ref, onMounted } from "vue";
import api from "@/services/apiService";
import Dish from "@/components/Dish.vue";

const dishes = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchDishes = async () => {
  try {
    loading.value = true;
    error.value = null;
    const data = await api.getDishes();
    console.log("Fetched dishes:", data);

    // Handle different response structures
    if (Array.isArray(data)) {
      dishes.value = data;
    } else if (data && Array.isArray(data.data)) {
      dishes.value = data.data;
    } else if (data && Array.isArray(data.dishes)) {
      dishes.value = data.dishes;
    } else {
      console.warn("Unexpected data structure:", data);
      dishes.value = [];
    }

    console.log("Processed dishes:", dishes.value);
  } catch (err) {
    if (err.status === 500) {
      error.value = "Something went wrong. Please try again later.";
    } else {
      error.value = err.message || "Failed to fetch dishes";
    }
    console.error("Error fetching dishes:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDishes();
});
</script>

<template>
  <div class="home-page">
    <h1 class="page-title">Our Menu</h1>

    <!-- Skeleton Loading -->
    <div v-if="loading" class="dishes-grid">
      <div
        v-for="n in 6"
        :key="n"
        class="bg-white shadow rounded-lg overflow-hidden animate-pulse"
      >
        <div class="w-full h-48 bg-gray-200"></div>
        <div class="p-4 space-y-3">
          <div class="h-6 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-full"></div>
          <div class="h-4 bg-gray-200 rounded w-5/6"></div>
          <div class="flex justify-between items-center mt-4">
            <div class="h-6 bg-gray-200 rounded w-20"></div>
            <div class="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto"
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
          <h3 class="text-sm font-medium text-red-800">Error loading dishes</h3>
          <p class="mt-2 text-sm text-red-700">{{ error }}</p>
          <p class="mt-1 text-sm text-red-600">
            Make sure the API server is running and accessible.
          </p>
          <button
            @click="fetchDishes"
            class="mt-3 text-sm font-medium text-red-600 hover:text-red-500 inline-flex items-center"
          >
            <font-awesome-icon icon="redo" class="mr-1" />
            Try again
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="dishes.length === 0" class="empty">
      <p>No dishes available at the moment.</p>
    </div>
    <div v-else class="dishes-grid">
      <Dish v-for="dish in dishes" :key="dish.DishID" :dish="dish" />
    </div>
  </div>
</template>

<style scoped>
.home-page {
  padding: 2rem;
}

.page-title {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: bold;
}

.empty {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.dishes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  overflow: visible;
}
</style>
