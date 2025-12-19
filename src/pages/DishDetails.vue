<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import apiService from "@/services/apiService.js";
import { BASE_URL } from "@/services/apiService";
import { setCartItem, getCartItem } from "@/services/cartService";
import Dish from "@/components/Dish.vue";

const route = useRoute();
const dish = ref(null);
const allDishes = ref([]);
const isLoading = ref(true);
const error = ref("");
const isAddingToCart = ref(false);
const quantity = ref(1);

const dishId = route.params.id;

const imageUrl = computed(() => {
  if (!dish.value?.Image) return null;

  // If it's already a full URL (starts with http), use it as-is
  if (dish.value.Image.startsWith("http")) {
    return dish.value.Image;
  }

  // Otherwise, prepend BASE_URL
  return BASE_URL + dish.value.Image;
});

const fetchDish = async () => {
  try {
    isLoading.value = true;
    error.value = "";
    console.log("Fetching dish with ID:", dishId);
    const response = await apiService.getDishById(dishId);
    console.log("API response:", response);
    dish.value = response.dish || response;
    console.log("Dish image field:", dish.value?.Image);
    console.log("Constructed image URL:", imageUrl.value);
  } catch (err) {
    console.error("Failed to fetch dish:", err);
    error.value = err.message || "Failed to load dish details";
  } finally {
    isLoading.value = false;
  }
};

const fetchAllDishes = async () => {
  try {
    const response = await apiService.getDishes();
    allDishes.value = response.dishes || response;
  } catch (err) {
    console.error("Failed to fetch dishes:", err);
  }
};

const recommendedDishes = () => {
  return allDishes.value
    .filter((d) => d.DishID !== parseInt(dishId))
    .slice(0, 4);
};

const increaseQuantity = () => {
  quantity.value++;
};

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const addToCart = () => {
  const existingItem = getCartItem(dish.value.DishID);
  const currentQuantity = existingItem ? existingItem.quantity : 0;
  setCartItem(dish.value.DishID, currentQuantity + quantity.value);

  // Show feedback
  isAddingToCart.value = true;
  setTimeout(() => {
    isAddingToCart.value = false;
  }, 600);
};

onMounted(() => {
  fetchDish();
  fetchAllDishes();
});
</script>

<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Loading State -->
      <div v-if="isLoading" class="bg-white shadow rounded-lg p-8">
        <div class="animate-pulse space-y-6">
          <div class="h-64 bg-gray-200 rounded"></div>
          <div class="space-y-3">
            <div class="h-8 bg-gray-200 rounded w-1/3"></div>
            <div class="h-4 bg-gray-200 rounded"></div>
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
            <h3 class="text-sm font-medium text-red-800">Error loading dish</h3>
            <p class="mt-2 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Dish Details -->
      <div v-else-if="dish" class="space-y-8">
        <!-- Dish Image and Info -->
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <div class="md:flex">
            <div class="md:w-1/2">
              <div class="dish-image-container">
                <img
                  v-if="imageUrl"
                  :src="imageUrl"
                  :alt="dish.Name"
                  class="w-full h-64 md:h-96 object-cover"
                  draggable="false"
                />
                <div
                  v-else
                  class="no-image flex items-center justify-center h-64 md:h-96 bg-gray-100"
                >
                  <div class="text-center">
                    <img
                      src="/favicon.svg"
                      alt="No image"
                      class="w-16 h-16 mx-auto opacity-50 filter grayscale"
                      draggable="false"
                    />
                    <p class="mt-2 text-gray-500">No Image</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="md:w-1/2 p-6 md:p-8">
              <h1 class="text-3xl font-bold text-gray-900 mb-4">
                {{ dish.Name }}
              </h1>
              <div class="mb-6">
                <h2 class="text-lg font-semibold text-gray-700 mb-2">
                  Ingredients
                </h2>
                <p class="text-gray-600 leading-relaxed">
                  {{ dish.Ingredients }}
                </p>
              </div>

              <div class="flex items-center justify-between mb-4">
                <span class="text-2xl font-bold text-green-600"
                  >${{ dish.Price?.toFixed(2) }}</span
                >
              </div>

              <div class="flex items-center gap-4">
                <div class="quantity-controls">
                  <button
                    class="quantity-btn"
                    @click="decreaseQuantity"
                    :disabled="quantity <= 1"
                    aria-label="Decrease quantity"
                  >
                    <font-awesome-icon icon="minus" />
                  </button>
                  <span class="quantity">{{ quantity }}</span>
                  <button
                    class="quantity-btn"
                    @click="increaseQuantity"
                    aria-label="Increase quantity"
                  >
                    <font-awesome-icon icon="plus" />
                  </button>
                </div>

                <button
                  class="add-to-cart-btn"
                  :class="{ adding: isAddingToCart }"
                  :disabled="isAddingToCart"
                  @click="addToCart"
                >
                  <span v-if="!isAddingToCart" class="btn-content">
                    <font-awesome-icon icon="shopping-cart" />
                    <span>Add to Cart</span>
                  </span>
                  <span v-else class="btn-content">
                    <font-awesome-icon icon="check" />
                    <span>Added!</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- You May Also Like -->
        <div
          v-if="recommendedDishes().length > 0"
          class="bg-white shadow rounded-lg p-6"
        >
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            You May Also Like
          </h2>
          <div class="dishes-grid">
            <Dish
              v-for="recommendedDish in recommendedDishes()"
              :key="recommendedDish.DishID"
              :dish="recommendedDish"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dish-image-container {
  position: relative;
}

.no-image {
  background: #f9fafb;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.quantity-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #c0392b;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.quantity-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity {
  font-size: 1.1rem;
  font-weight: 600;
  min-width: 2.5rem;
  text-align: center;
  color: #111827;
}

.add-to-cart-btn {
  padding: 0.5rem 1rem;
  background: #c0392b;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 110px;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.add-to-cart-btn.adding {
  background: #556b2f;
  transform: scale(0.95);
}

.dishes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
  overflow: visible;
}
</style>
