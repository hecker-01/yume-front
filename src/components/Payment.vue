<script setup>
import { ref } from "vue";
import apiService from "@/services/apiService";

const paymentMethods = [
  {
    id: "credit_card",
    name: "Credit/Debit Card",
    description: "Pay securely with your card",
    icon: "credit-card",
    available: false,
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Pay with your PayPal account",
    icon: "wallet",
    available: false,
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    description: "Direct bank transfer",
    icon: "university",
    available: false,
  },
  {
    id: "mobile_payment",
    name: "Mobile Payment",
    description: "Pay with mobile wallet",
    icon: "mobile-alt",
    available: false,
  },
  {
    id: "cash_on_delivery",
    name: "Cash on Delivery",
    description: "Pay when you receive your order",
    icon: "money-bill-wave",
    available: false,
  },
  {
    id: "debug_payment",
    name: "Debug Payment",
    description: "Test payment for development",
    icon: "bug",
    available: true,
  },
];

const props = defineProps({
  orderId: {
    type: [String, Number],
    required: true,
  },
  orderTotal: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["close", "paymentComplete"]);

const isProcessingPayment = ref(false);
const error = ref("");
const selectedMethod = ref(
  paymentMethods.find((m) => m.available)?.id || paymentMethods[0].id
);

const selectMethod = (method) => {
  if (method.available) {
    selectedMethod.value = method.id;
  }
};

const closePayment = () => {
  emit("close");
};

const processPayment = async () => {
  try {
    isProcessingPayment.value = true;
    error.value = "";

    await apiService.paymentComplete(props.orderId);

    // Emit success event
    emit("paymentComplete");
  } catch (err) {
    console.error("Payment failed:", err);
    error.value = err.message || "Payment failed. Please try again.";
  } finally {
    isProcessingPayment.value = false;
  }
};
</script>

<template>
  <div class="payment-overlay" @click.self="closePayment">
    <div class="payment-container" @click.stop>
      <!-- Header -->
      <div class="payment-header">
        <h3 class="payment-title">Complete Payment</h3>
        <button
          @click="closePayment"
          class="close-btn"
          aria-label="Close payment"
        >
          <font-awesome-icon icon="times" />
        </button>
      </div>

      <!-- Content -->
      <div class="payment-content">
        <!-- Order Summary -->
        <div class="order-summary">
          <div class="summary-row">
            <span class="summary-label">Order #{{ orderId }}</span>
            <span class="summary-value">${{ orderTotal.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Payment Options -->
        <div class="payment-methods">
          <h4 class="section-title">Payment Method</h4>
          <div
            v-for="method in paymentMethods"
            :key="method.id"
            class="method-option"
            :class="{
              'method-selected': selectedMethod === method.id,
              'method-unavailable': !method.available,
            }"
            @click="selectMethod(method)"
          >
            <div class="method-content">
              <font-awesome-icon :icon="method.icon" class="method-icon" />
              <div class="method-details">
                <p class="method-name">{{ method.name }}</p>
                <p class="method-description">
                  {{ method.available ? method.description : "Not available" }}
                </p>
              </div>
              <div v-if="selectedMethod === method.id" class="method-check">
                <font-awesome-icon icon="check-circle" />
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          <div class="error-content">
            <font-awesome-icon icon="exclamation-circle" class="error-icon" />
            <p class="error-text">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="payment-footer">
        <button
          @click="closePayment"
          :disabled="isProcessingPayment"
          class="cancel-btn"
        >
          Cancel
        </button>
        <button
          @click="processPayment"
          :disabled="isProcessingPayment"
          class="pay-btn"
        >
          <font-awesome-icon
            v-if="isProcessingPayment"
            icon="spinner"
            class="animate-spin"
          />
          <span>{{ isProcessingPayment ? "Processing..." : "Pay Now" }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

@media (max-width: 768px) {
  .payment-overlay {
    padding: 0;
    align-items: stretch;
  }
}

.payment-container {
  background-color: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

@media (max-width: 768px) {
  .payment-container {
    max-width: 100%;
    max-height: 100vh;
    height: 100vh;
    border-radius: 0;
  }
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.payment-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--charcoal);
}

@media (min-width: 768px) {
  .payment-title {
    font-size: 1.5rem;
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--charcoal);
}

.payment-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.order-summary {
  background-color: #f9fafb;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.summary-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--charcoal);
}

.payment-methods {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.method-option {
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.75rem;
}

.method-option:last-child {
  margin-bottom: 0;
}

.method-option.method-selected {
  border-color: var(--torii);
  background-color: #fef2f2;
}

.method-option.method-unavailable {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #f9fafb;
}

.method-option:hover:not(.method-unavailable) {
  border-color: var(--torii);
  background-color: #fef2f2;
}

.method-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.method-icon {
  font-size: 1.5rem;
  color: #6b7280;
}

.method-selected .method-icon {
  color: var(--torii);
}

.method-unavailable .method-icon {
  color: #9ca3af;
}

.method-details {
  flex: 1;
}

.method-name {
  font-weight: 600;
  color: var(--charcoal);
  margin: 0;
}

.method-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.method-check {
  color: var(--torii);
  font-size: 1.25rem;
}

.error-message {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.error-content {
  display: flex;
  align-items: start;
  gap: 0.5rem;
}

.error-icon {
  color: #ef4444;
  margin-top: 0.125rem;
}

.error-text {
  font-size: 0.875rem;
  color: #991b1b;
  margin: 0;
}

.payment-footer {
  border-top: 1px solid #e5e7eb;
  padding: 1.5rem;
  background-color: #f9fafb;
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .payment-footer {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    flex-direction: column-reverse;
  }
}

.cancel-btn,
.pay-btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.cancel-btn {
  background-color: white;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #f9fafb;
  color: var(--charcoal);
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pay-btn {
  background-color: var(--torii);
  color: white;
}

.pay-btn:hover:not(:disabled) {
  background-color: #c83e3e;
}

.pay-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
