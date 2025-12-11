<script setup>
import { ref, onMounted } from "vue";
import api from "@/services/apiService";
import Dish from "@/components/Dish.vue";

const dishes = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    loading.value = true;
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
});
</script>

<template>
  <div class="home-page">
    <h1 class="page-title">Our Menu</h1>
    <div v-if="loading" class="loading">Loading dishes...</div>
    <div v-else-if="error" class="error">
      <p>Error: {{ error }}</p>
      <p class="error-hint">
        Make sure the API server is running on http://localhost:3000
      </p>
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

.loading,
.error,
.empty {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error {
  color: #ef4444;
}

.error-hint {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.dishes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  overflow: visible;
}
</style>
