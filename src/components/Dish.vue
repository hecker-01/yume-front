<script setup>
import { defineProps } from "vue";
import { useRouter } from "vue-router";
import { BASE_URL } from "@/services/apiService";

const props = defineProps({
  dish: {
    type: Object,
    required: true,
  },
});

const router = useRouter();

const imageUrl = props.dish.Image ? BASE_URL + props.dish.Image : null;

const viewDetails = () => {
  router.push(`/dish/${props.dish.DishID}`);
};
console.log("Dish component received dish:", props.dish);
</script>

<template>
  <div class="dish-card" @click="viewDetails">
    <div class="dish-image">
      <img v-if="imageUrl" :src="imageUrl" :alt="dish.Name" />
      <div v-else class="no-image">No Image</div>
    </div>
    <div class="dish-content">
      <h3 class="dish-name">{{ dish.Name }}</h3>
      <p class="dish-description">{{ dish.Ingredients }}</p>
      <div class="dish-footer">
        <span class="dish-price">${{ dish.Price?.toFixed(2) }}</span>
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

.dish-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 1rem;
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
}

.dish-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
}

.dish-available {
  color: #059669;
  font-size: 0.875rem;
  font-weight: 500;
}

.dish-unavailable {
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
