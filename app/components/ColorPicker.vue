<template>
  <div class="relative inline-flex">
    <button
      type="button"
      class="relative rounded p-1 hover:bg-white/70"
      :title="title || 'Color'"
      @click.stop="toggleOpen"
    >
      <Icon name="lucide:palette" size="15px" />
    </button>
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="close"
    />
    <div
      v-if="isOpen"
      class="absolute right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
      @click.stop
    >
      <div class="space-y-1.5">
        <div class="flex gap-1.5">
          <button
            v-for="color in row1"
            :key="color"
            class="h-5 w-5 rounded-full border border-gray-300 transition-transform hover:scale-110"
            :style="{ backgroundColor: color }"
            :class="{ 'ring-2 ring-blue-400 ring-offset-1': color === modelValue }"
            @click="selectColor(color)"
          />
        </div>
        <div class="flex gap-1.5">
          <button
            v-for="color in row2"
            :key="color"
            class="h-5 w-5 rounded-full border border-gray-300 transition-transform hover:scale-110"
            :style="{ backgroundColor: color }"
            :class="{ 'ring-2 ring-blue-400 ring-offset-1': color === modelValue }"
            @click="selectColor(color)"
          />
        </div>
        <div class="flex justify-center border-t border-gray-100 pt-1.5">
          <button
            class="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Remove color"
            @click="removeColor"
          >
            <svg viewBox="0 0 20 20" fill="none" class="h-3.5 w-3.5">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5" />
              <line x1="5" y1="5" x2="15" y2="15" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  modelValue?: string;
  title?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
}>();

const isOpen = ref(false);

const PRESET_COLORS = [
  '#FAD1D1',
  '#FDE2C8',
  '#FDF5C9',
  '#E2F0CB',
  '#D0F0D0',
  '#C8F0EA',
  '#C8E0F0',
  '#D1D9FD',
  '#DFD1F0',
  '#F0C8E8',
];

const row1 = PRESET_COLORS.slice(0, 5);
const row2 = PRESET_COLORS.slice(5, 10);

function toggleOpen() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

function selectColor(color: string) {
  emit('update:modelValue', color);
  isOpen.value = false;
}

function removeColor() {
  emit('update:modelValue', undefined);
  isOpen.value = false;
}
</script>
