<script setup>
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 bg-charcoal text-white z-50 shadow-lg md:bg-card-bg md:mx-8 md:mb-6 md:rounded-2xl md:shadow-2xl md:border md:border-border-subtle"
  >
    <ul
      class="flex justify-around items-center py-3 md:py-4 md:px-8 md:justify-center md:gap-12"
    >
      <!-- Orders -->
      <li>
        <router-link
          to="/orders"
          class="flex flex-col items-center gap-1 md:flex-row md:gap-3 px-4 py-2 rounded-lg transition-all duration-300"
          :class="
            route.name === 'Orders'
              ? 'text-torii md:bg-torii md:text-white md:shadow-lg'
              : 'text-gray-400 hover:text-white md:text-sumi md:hover:text-torii md:hover:bg-gray-50'
          "
        >
          <font-awesome-icon
            icon="clipboard-list"
            class="text-2xl md:text-2xl"
          />
          <span class="text-xs md:text-base md:font-medium">Orders</span>
        </router-link>
      </li>

      <!-- Home (Larger on Mobile) -->
      <li>
        <router-link
          to="/"
          class="flex flex-col items-center gap-1 md:flex-row md:gap-3 px-4 py-2 rounded-lg transition-all duration-300"
          :class="
            route.name === 'Home'
              ? 'text-torii md:bg-torii md:text-white md:shadow-lg'
              : 'text-gray-400 hover:text-white md:text-sumi md:hover:text-torii md:hover:bg-gray-50'
          "
        >
          <font-awesome-icon icon="home" class="text-3xl md:text-2xl" />
          <span class="text-xs md:text-base md:font-medium">Home</span>
        </router-link>
      </li>

      <!-- Account -->
      <li>
        <router-link
          to="/account"
          class="flex flex-col items-center gap-1 md:flex-row md:gap-3 px-4 py-2 rounded-lg transition-all duration-300"
          :class="
            route.name === 'Account'
              ? 'text-torii md:bg-torii md:text-white md:shadow-lg'
              : 'text-gray-400 hover:text-white md:text-sumi md:hover:text-torii md:hover:bg-gray-50'
          "
        >
          <font-awesome-icon icon="user-circle" class="text-2xl md:text-2xl" />
          <span class="text-xs md:text-base md:font-medium">Account</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<style scoped></style>
