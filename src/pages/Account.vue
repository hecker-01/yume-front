<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";

const router = useRouter();
const isLoading = ref(true);
const user = ref(null);
const error = ref("");
const isEditing = ref(false);
const editForm = ref({
  username: "",
  email: "",
  address: "",
});

const fetchUserData = async () => {
  try {
    isLoading.value = true;
    error.value = "";

    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      throw new Error("User not found");
    }

    const response = await apiService.getUserById(currentUser.id);
    user.value = response.user || response;

    // Initialize edit form
    editForm.value = {
      username: user.value.username || user.value.name || "",
      email: user.value.email || "",
      address: user.value.address || "",
    };
  } catch (err) {
    console.error("Failed to fetch user data:", err);
    error.value = err.message || "Failed to load account information";

    // If 401, token is invalid - redirect to login
    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
      await authService.logout();
      router.push({ name: "Login", query: { redirect: "/account" } });
    }
  } finally {
    isLoading.value = false;
  }
};

const handleUpdateProfile = async () => {
  try {
    error.value = "";
    const currentUser = authService.getCurrentUser();

    await apiService.updateUser(currentUser.id, editForm.value);

    // Refresh user data
    await fetchUserData();
    isEditing.value = false;
  } catch (err) {
    console.error("Failed to update profile:", err);
    error.value = err.message || "Failed to update profile";
  }
};

const handleLogout = async () => {
  try {
    await authService.logout();
    router.push({ name: "Home" });
  } catch (err) {
    console.error("Logout failed:", err);
    // Still redirect even if logout fails
    router.push({ name: "Home" });
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  if (user.value) {
    editForm.value = {
      username: user.value.username || user.value.name || "",
      email: user.value.email || "",
      address: user.value.address || "",
    };
  }
};

onMounted(() => {
  fetchUserData();
});
</script>

<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Account Settings</h1>
        <button
          @click="handleLogout"
          class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
        >
          Logout
        </button>
      </div>

      <!-- Loading Skeleton -->
      <div
        v-if="isLoading"
        class="bg-white shadow rounded-lg p-6 animate-pulse"
      >
        <div class="space-y-6">
          <div>
            <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div class="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div>
            <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div class="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div>
            <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div class="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error && !user"
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
            <h3 class="text-sm font-medium text-red-800">
              Error loading account
            </h3>
            <p class="mt-2 text-sm text-red-700">{{ error }}</p>
            <button
              @click="fetchUserData"
              class="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>

      <!-- Account Information -->
      <div v-else-if="user" class="bg-white shadow rounded-lg">
        <!-- View Mode -->
        <div v-if="!isEditing" class="p-6">
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Username</label
              >
              <p class="mt-1 text-lg text-gray-900">
                {{ user.username || user.name || "N/A" }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Email</label
              >
              <p class="mt-1 text-lg text-gray-900">
                {{ user.email || "N/A" }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Address</label
              >
              <p class="mt-1 text-lg text-gray-900">
                {{ user.address || "Not set" }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Account Type</label
              >
              <p class="mt-1">
                <span
                  class="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800"
                >
                  {{ user.role || "User" }}
                </span>
              </p>
            </div>

            <div class="pt-4 border-t">
              <button
                @click="isEditing = true"
                class="w-full sm:w-auto px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <!-- Edit Mode -->
        <div v-else class="p-6">
          <form @submit.prevent="handleUpdateProfile" class="space-y-6">
            <div v-if="error" class="rounded-md bg-red-50 p-4">
              <p class="text-sm text-red-800">{{ error }}</p>
            </div>

            <div>
              <label
                for="username"
                class="block text-sm font-medium text-gray-700"
                >Username</label
              >
              <input
                id="username"
                v-model="editForm.username"
                type="text"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700"
                >Email</label
              >
              <input
                id="email"
                v-model="editForm.email"
                type="email"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label
                for="address"
                class="block text-sm font-medium text-gray-700"
                >Address</label
              >
              <textarea
                id="address"
                v-model="editForm.address"
                rows="3"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div class="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                class="flex-1 sm:flex-none px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Save Changes
              </button>
              <button
                type="button"
                @click="cancelEdit"
                class="flex-1 sm:flex-none px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
