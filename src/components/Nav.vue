<script setup>
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <nav class="nav-container">
    <ul class="nav-list">
      <!-- Orders -->
      <li>
        <router-link
          to="/orders"
          class="nav-link"
          :class="{ active: route.name === 'Orders' }"
        >
          <font-awesome-icon icon="clipboard-list" class="nav-icon" />
          <span class="nav-label">Orders</span>
        </router-link>
      </li>

      <!-- Home (Larger on Mobile) -->
      <li>
        <router-link
          to="/"
          class="nav-link"
          :class="{ active: route.name === 'Home' }"
        >
          <font-awesome-icon icon="home" class="nav-icon nav-icon-home" />
          <span class="nav-label">Home</span>
        </router-link>
      </li>

      <!-- Account -->
      <li>
        <router-link
          to="/account"
          class="nav-link"
          :class="{ active: route.name === 'Account' }"
        >
          <font-awesome-icon icon="user-circle" class="nav-icon" />
          <span class="nav-label">Account</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.nav-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--charcoal);
  color: white;
  z-index: 50;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .nav-container {
    background-color: var(--card-bg);
    margin-left: 2rem;
    margin-right: 2rem;
    margin-bottom: 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid var(--border-subtle);
  }
}

.nav-list {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

@media (min-width: 768px) {
  .nav-list {
    padding-top: 1rem;
    padding-bottom: 1rem;
    padding-left: 2rem;
    padding-right: 2rem;
    justify-content: center;
    gap: 3rem;
  }
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s;
  color: #6b7280;
}

@media (min-width: 768px) {
  .nav-link {
    flex-direction: row;
    gap: 0.75rem;
    color: var(--sumi);
  }

  .nav-link:hover {
    color: var(--torii);
    background-color: #f9fafb;
  }
}

.nav-link.active {
  color: white;
}

@media (min-width: 768px) {
  .nav-link.active {
    background-color: var(--torii);
    color: white;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
}

.nav-icon {
  font-size: 1.5rem;
}

.nav-icon-home {
  font-size: 1.875rem;
}

@media (min-width: 768px) {
  .nav-icon-home {
    font-size: 1.5rem;
  }
}

.nav-label {
  font-size: 0.75rem;
}

@media (min-width: 768px) {
  .nav-label {
    font-size: 1rem;
    font-weight: 500;
  }
}
</style>
