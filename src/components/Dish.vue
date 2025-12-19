<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { BASE_URL } from "@/services/apiService";
import { setCartItem, getCartItem } from "@/services/cartService";

const props = defineProps({
  dish: {
    type: Object,
    required: true,
  },
});

const router = useRouter();
const isAddingToCart = ref(false);

const imageUrl = props.dish.Image ? BASE_URL + props.dish.Image : null;

const viewDetails = () => {
  router.push(`/details/${props.dish.DishID}`);
};

const addToCart = (event) => {
  event.stopPropagation(); // Prevent triggering viewDetails

  const existingItem = getCartItem(props.dish.DishID);
  const currentQuantity = existingItem ? existingItem.quantity : 0;
  setCartItem(props.dish.DishID, currentQuantity + 1);

  // Show feedback
  isAddingToCart.value = true;
  setTimeout(() => {
    isAddingToCart.value = false;
  }, 600);
};

console.log("Dish component received dish:", props.dish);
</script>

<template>
  <div class="dish-card" @click="viewDetails">
    <div class="dish-image-container">
      <div class="dish-image">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="dish.Name"
          draggable="false"
        />
        <div v-else class="no-image">
          <img
            src="/favicon.svg"
            alt="No image"
            class="placeholder-icon"
            draggable="false"
          />
          <p class="placeholder-text">No Image</p>
        </div>
      </div>
    </div>
    <div class="dish-content">
      <h3 class="dish-name">{{ dish.Name }}</h3>
      <p class="dish-description">{{ dish.Ingredients }}</p>
      <div class="dish-footer">
        <span class="dish-price">${{ dish.Price?.toFixed(2) }}</span>
        <button
          class="add-to-cart-btn"
          :class="{ adding: isAddingToCart }"
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
</template>

<style scoped>
.dish-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.dish-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f3f4f6;
}

.dish-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 1rem;
}

.placeholder-icon {
  width: 50px;
  height: 50px;
  opacity: 0.5;
  filter: grayscale(100%);
}

.placeholder-text {
  margin-top: 0.5rem;
}

.dish-content {
  padding: 1.5rem;
}

.dish-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #111827;
}

.dish-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dish-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.25rem;
  gap: 1rem;
}

.dish-price {
  font-size: 1.15rem;
  font-weight: 700;
  color: #556b2f;
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

.dish-available {
  color: #556b2f;
  font-size: 0.875rem;
  font-weight: 500;
}

.dish-unavailable {
  color: #c0392b;
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
