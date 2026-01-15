<script setup>
import { defineProps, computed } from "vue";

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

const getProgressWidth = () => {
  if (!props.order) return "0%";

  const currentStatus = (
    props.order.Status ||
    props.order.status ||
    ""
  ).toLowerCase();

  // Calculate progress based on order status
  if (currentStatus === "completed") return "75%";
  if (currentStatus === "delivering") return "50%";
  if (currentStatus === "processing" || currentStatus === "preparing")
    return "25%";
  if (currentStatus === "ordered" || currentStatus === "pending") return "0%";

  return "0%";
};

const getCurrentActiveStep = () => {
  if (!props.order) return null;

  const currentStatus = (
    props.order.Status ||
    props.order.status ||
    ""
  ).toLowerCase();

  // Return the current active step based on status
  // If completed, return null (no animation)
  if (currentStatus === "completed") return null;
  if (currentStatus === "delivering") return "delivering";
  if (currentStatus === "processing" || currentStatus === "preparing")
    return "processing";
  if (currentStatus === "ordered" || currentStatus === "pending")
    return "ordered";

  return null;
};

// Helper to check if a step should be shown as active
// based on the current order status (not just timestamps)
const isStepActive = (step) => {
  if (!props.order) return false;

  const currentStatus = (
    props.order.Status ||
    props.order.status ||
    ""
  ).toLowerCase();

  // Define the order of statuses
  const statusOrder = [
    "ordered",
    "pending",
    "processing",
    "preparing",
    "delivering",
    "completed",
  ];

  // Map step names to their status equivalents
  const stepToStatus = {
    ordered: ["ordered", "pending"],
    processing: ["processing", "preparing"],
    delivering: ["delivering"],
    completed: ["completed"],
  };

  // Get the minimum index of the current status
  const currentIndex = Math.min(
    ...statusOrder
      .map((s, i) =>
        currentStatus.includes(s) || currentStatus === s ? i : Infinity
      )
      .filter((i) => i !== Infinity)
  );

  // Get the minimum index of the step we're checking
  const stepStatuses = stepToStatus[step] || [];
  const stepIndex = Math.min(
    ...stepStatuses.map((s) => statusOrder.indexOf(s)).filter((i) => i >= 0)
  );

  // Step is active if current status index is >= step index
  return !isNaN(currentIndex) && !isNaN(stepIndex) && currentIndex >= stepIndex;
};

// Helper to get display text for step timestamp
const getStepDisplayTime = (step) => {
  if (!props.order) return "Pending";

  // First check if this step should be active based on progress
  // If not active, always show Pending regardless of timestamp
  if (!isStepActive(step)) {
    return "Pending";
  }

  // Step is active, now check if it has a timestamp
  let timestamp = null;
  switch (step) {
    case "ordered":
      timestamp = props.order.Ordered_at;
      break;
    case "processing":
      timestamp = props.order.processing_at;
      break;
    case "delivering":
      timestamp = props.order.Delivering_at;
      break;
    case "completed":
      timestamp = props.order.Completed_at;
      break;
  }

  // If timestamp exists, format it
  if (timestamp) {
    return formatDate(timestamp).split(",")[0];
  }

  // If no timestamp but step is active, show N/A
  return "N/A";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
};
</script>

<template>
  <h2 class="text-lg font-semibold text-gray-900 mb-8">Order Status</h2>

  <!-- Modern Horizontal Timeline -->
  <transition name="timeline-update" mode="out-in">
    <div :key="getCurrentActiveStep()" class="relative timeline-container">
      <!-- Timeline Steps Container -->
      <div class="relative flex justify-between items-start">
        <!-- Progress Line Background -->
        <div class="absolute progress-line-bg"></div>

        <!-- Active Progress Line with Animation -->
        <div
          class="absolute progress-line-active"
          :style="{ width: getProgressWidth() }"
        ></div>

        <!-- Step 1: Ordered -->
        <div
          class="flex flex-col items-center flex-1 timeline-step"
          :class="{
            active: isStepActive('ordered'),
            'current-step': getCurrentActiveStep() === 'ordered',
          }"
        >
          <div
            class="relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-500 shadow-lg"
            :class="
              isStepActive('ordered')
                ? 'bg-torii border-torii-hover'
                : 'bg-white border-gray-300'
            "
          >
            <font-awesome-icon
              icon="shopping-bag"
              class="text-xl transition-all duration-500"
              :class="[
                isStepActive('ordered') ? 'text-white' : 'text-gray-400',
                getCurrentActiveStep() === 'ordered' ? 'icon-bounce' : '',
              ]"
            />
          </div>
          <div class="mt-4 text-center px-2">
            <p
              class="text-sm font-bold transition-colors duration-300 whitespace-nowrap"
              :class="isStepActive('ordered') ? 'text-black' : 'text-gray-500'"
            >
              Ordered
            </p>
            <p class="text-xs text-gray-500 mt-1 whitespace-nowrap">
              {{ getStepDisplayTime("ordered") }}
            </p>
          </div>
        </div>

        <!-- Step 2: Processing -->
        <div
          class="flex flex-col items-center flex-1 timeline-step"
          :class="{
            active: isStepActive('processing'),
            'current-step': getCurrentActiveStep() === 'processing',
          }"
        >
          <div
            class="relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-500 shadow-lg"
            :class="
              isStepActive('processing')
                ? 'bg-torii border-torii-hover'
                : 'bg-white border-gray-300'
            "
          >
            <font-awesome-icon
              icon="utensils"
              class="text-xl transition-all duration-500"
              :class="[
                isStepActive('processing') ? 'text-white' : 'text-gray-400',
                getCurrentActiveStep() === 'processing' ? 'icon-bounce' : '',
              ]"
            />
          </div>
          <div class="mt-4 text-center px-2">
            <p
              class="text-sm font-bold transition-colors duration-300 whitespace-nowrap"
              :class="
                isStepActive('processing') ? 'text-black' : 'text-gray-500'
              "
            >
              Processing
            </p>
            <p class="text-xs text-gray-500 mt-1 whitespace-nowrap">
              {{ getStepDisplayTime("processing") }}
            </p>
          </div>
        </div>

        <!-- Step 3: Delivering -->
        <div
          class="flex flex-col items-center flex-1 timeline-step"
          :class="{
            active: isStepActive('delivering'),
            'current-step': getCurrentActiveStep() === 'delivering',
          }"
        >
          <div
            class="relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-500 shadow-lg"
            :class="
              isStepActive('delivering')
                ? 'bg-torii border-torii-hover'
                : 'bg-white border-gray-300'
            "
          >
            <font-awesome-icon
              icon="truck"
              class="text-xl transition-all duration-500"
              :class="[
                isStepActive('delivering') ? 'text-white' : 'text-gray-400',
                getCurrentActiveStep() === 'delivering' ? 'icon-bounce' : '',
              ]"
            />
          </div>
          <div class="mt-4 text-center px-2">
            <p
              class="text-sm font-bold transition-colors duration-300 whitespace-nowrap"
              :class="
                isStepActive('delivering') ? 'text-black' : 'text-gray-500'
              "
            >
              Delivering
            </p>
            <p class="text-xs text-gray-500 mt-1 whitespace-nowrap">
              {{ getStepDisplayTime("delivering") }}
            </p>
          </div>
        </div>

        <!-- Step 4: Completed -->
        <div
          class="flex flex-col items-center flex-1 timeline-step"
          :class="{ active: isStepActive('completed') }"
        >
          <div
            class="relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-500 shadow-lg"
            :class="
              isStepActive('completed')
                ? 'bg-torii border-torii-hover'
                : 'bg-white border-gray-300'
            "
          >
            <font-awesome-icon
              icon="check-circle"
              class="text-xl transition-all duration-500"
              :class="
                isStepActive('completed') ? 'text-white' : 'text-gray-400'
              "
            />
          </div>
          <div class="mt-4 text-center px-2">
            <p
              class="text-sm font-bold transition-colors duration-300 whitespace-nowrap"
              :class="
                isStepActive('completed') ? 'text-black' : 'text-gray-500'
              "
            >
              Completed
            </p>
            <p class="text-xs text-gray-500 mt-1 whitespace-nowrap">
              {{ getStepDisplayTime("completed") }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Smooth transition for timeline updates */
.timeline-update-enter-active,
.timeline-update-leave-active {
  transition: all 0.4s ease;
}

.timeline-update-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.timeline-update-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Timeline Container */
.timeline-container {
  padding: 2rem 2rem;
}

/* Progress Line Background */
.progress-line-bg {
  top: 2rem;
  left: 12.5%;
  right: 12.5%;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
}

/* Active Progress Line */
.progress-line-active {
  top: 2rem;
  left: 12.5%;
  height: 4px;
  background: #c0392b;
  transition: width 1s ease-out;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
  border-radius: 2px;
}

/* Icon bounce animation - only for current step */
.timeline-step.current-step .icon-bounce {
  animation: iconBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes iconBounce {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* Pulse animation for current step only */
.timeline-step.current-step > div:first-child {
  position: relative;
  animation: iconScale 0.5s ease-out forwards;
}

@keyframes iconScale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1.05);
  }
}

/* Glowing effect for current step only */
.timeline-step.current-step > div:first-child::before {
  content: "";
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.2;
  animation: pulseGlow 2s infinite;
  z-index: -1;
}

@keyframes pulseGlow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.2;
  }
  50% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* Responsive Timeline for tablets */
@media (max-width: 768px) {
  .timeline-container {
    padding: 1.5rem 1rem;
  }

  .progress-line-bg,
  .progress-line-active {
    top: 1.75rem;
    left: 12.5%;
    right: 12.5%;
  }

  .timeline-step > div:first-child {
    width: 3.5rem;
    height: 3.5rem;
  }

  .timeline-step svg {
    font-size: 1rem !important;
  }

  .timeline-step p {
    font-size: 0.75rem !important;
  }

  .timeline-step p.text-xs {
    font-size: 0.625rem !important;
  }
}

/* Responsive Timeline for mobile */
@media (max-width: 640px) {
  .timeline-container {
    padding: 1.5rem 0.5rem;
  }

  .progress-line-bg,
  .progress-line-active {
    top: 1.5rem;
    left: 12.5%;
    right: 12.5%;
    height: 3px;
  }

  .timeline-step > div:first-child {
    width: 3rem;
    height: 3rem;
  }

  .timeline-step svg {
    font-size: 0.875rem !important;
  }

  .timeline-step p {
    font-size: 0.625rem !important;
  }

  .timeline-step p.text-xs {
    display: none;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .timeline-container {
    padding: 1.25rem 0.25rem;
  }

  .progress-line-bg,
  .progress-line-active {
    top: 1.25rem;
    left: 12.5%;
    right: 12.5%;
    height: 2px;
  }

  .timeline-step > div:first-child {
    width: 2.5rem;
    height: 2.5rem;
    border-width: 3px;
  }

  .timeline-step svg {
    font-size: 0.75rem !important;
  }

  .timeline-step p {
    font-size: 0.5rem !important;
  }
}
</style>
