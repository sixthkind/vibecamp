<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-lg font-semibold">{{ editMode ? 'Edit List' : 'New List' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal">
            <Icon name="lucide:x" size="20px" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="p-6">
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">
              Name
            </label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="e.g., Launch Tasks"
              class="w-full px-3 py-2.5 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxlength="255"
              required
              autofocus
            />
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">
              Description <span class="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              v-model="formData.description"
              placeholder="What is this list for?"
              rows="3"
              class="w-full px-3 py-2.5 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxlength="1000"
            />
          </div>
        </div>
      </div>
    </ion-content>
    
    <div class="border-t border-gray-200 p-4 bg-gray-50">
      <div class="flex gap-3 justify-end">
        <button
          @click="closeModal"
          class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
          :disabled="!formData.name.trim() || isSaving"
          class="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ion-spinner v-if="isSaving" name="crescent" class="w-4 h-4"></ion-spinner>
          <span v-else>{{ editMode ? 'Save' : 'Create List' }}</span>
        </button>
      </div>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface TodoList {
  id?: string;
  name: string;
  description?: string;
}

const props = defineProps<{
  isOpen: boolean;
  list?: TodoList;
}>();

const emit = defineEmits<{
  close: [];
  submit: [data: { name: string; description?: string }];
}>();

const editMode = ref(false);
const isSaving = ref(false);
const formData = ref({
  name: '',
  description: '',
});

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    if (props.list) {
      editMode.value = true;
      formData.value = {
        name: props.list.name,
        description: props.list.description || '',
      };
    } else {
      editMode.value = false;
      formData.value = {
        name: '',
        description: '',
      };
    }
  }
});

function closeModal() {
  emit('close');
}

function handleSubmit() {
  if (!formData.value.name.trim()) return;
  
  emit('submit', {
    name: formData.value.name.trim(),
    description: formData.value.description.trim() || undefined,
  });
}
</script>

<style scoped>
.space-y-5 > * + * {
  margin-top: 1.25rem;
}
</style>

