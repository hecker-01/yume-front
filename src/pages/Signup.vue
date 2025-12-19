<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import apiService from "@/services/apiService.js";

const router = useRouter();
const formData = ref({
  username: "",
  last_name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone_number: "",
  address: "",
});
const error = ref("");
const isLoading = ref(false);

const handleSignup = async () => {
  error.value = "";

  // Validation
  if (
    !formData.value.username ||
    !formData.value.email ||
    !formData.value.password
  ) {
    error.value = "Please fill in all required fields";
    return;
  }

  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = "Passwords do not match";
    return;
  }

  if (formData.value.password.length < 6) {
    error.value = "Password must be at least 6 characters";
    return;
  }

  isLoading.value = true;

  try {
    await apiService.registerUser({
      username: formData.value.username,
      last_name: formData.value.last_name,
      email: formData.value.email,
      password: formData.value.password,
      phone_number: formData.value.phone_number,
      address: formData.value.address,
      role: "user",
    });

    // Clear any existing unpaid orders data for new user
    localStorage.removeItem("hasUnpaidOrders");
    localStorage.removeItem("lastUnpaidOrderCheck");

    // Redirect to login page after successful signup
    router.push({
      name: "Login",
      query: { message: "Account created successfully! Please sign in." },
    });
  } catch (err) {
    // Check for different error types
    if (err.message.includes("429") || err.message.includes("rate limit")) {
      error.value = "Rate limited. Please try again later.";
    } else if (err.message.includes("400")) {
      error.value = "Invalid information provided. Please check your details.";
    } else if (err.message.includes("500")) {
      error.value = "Something went wrong. Please try again later.";
    } else {
      error.value =
        err.message || "Failed to create account. Please try again.";
    }
    console.error("Signup error:", err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Already have an account?
          <router-link
            to="/login"
            class="font-medium text-red-600 hover:text-red-500"
          >
            Sign in
          </router-link>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSignup">
        <div class="space-y-4">
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-gray-700"
              >Username <span class="text-red-500">*</span></label
            >
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              placeholder="Username"
              :disabled="isLoading"
            />
          </div>

          <!-- <div>
            <label
              for="last_name"
              class="block text-sm font-medium text-gray-700"
              >Last Name</label
            >
            <input
              id="last_name"
              v-model="formData.last_name"
              type="text"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              placeholder="Last Name"
              :disabled="isLoading"
            />
          </div> -->

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700"
              >Email <span class="text-red-500">*</span></label
            >
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              placeholder="Email address"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label
              for="phone_number"
              class="block text-sm font-medium text-gray-700"
              >Phone Number</label
            >
            <input
              id="phone_number"
              v-model="formData.phone_number"
              type="tel"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              placeholder="Phone Number"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label for="address" class="block text-sm font-medium text-gray-700"
              >Address <span class="text-red-500">*</span></label
            >
            <textarea
              id="address"
              required
              v-model="formData.address"
              rows="2"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              placeholder="Delivery Address"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700"
              >Password <span class="text-red-500">*</span></label
            >
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              placeholder="Password (min 6 characters)"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label
              for="confirmPassword"
              class="block text-sm font-medium text-gray-700"
              >Confirm Password <span class="text-red-500">*</span></label
            >
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              placeholder="Confirm Password"
              :disabled="isLoading"
            />
          </div>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
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
              <p class="text-sm font-medium text-red-800">{{ error }}</p>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              v-if="isLoading"
              class="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <font-awesome-icon v-else icon="user-plus" />
            <span>{{ isLoading ? "Creating account..." : "Sign up" }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped></style>
