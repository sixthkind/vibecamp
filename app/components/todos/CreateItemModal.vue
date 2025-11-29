<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title class="text-lg font-semibold">{{ editMode ? 'Edit To-do' : 'Add To-do' }}</ion-title>
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
              To-do
            </label>
            <input
              v-model="formData.content"
              type="text"
              placeholder="e.g., Review design mockups"
              class="w-full px-3 py-2.5 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxlength="500"
              required
              autofocus
            />
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">
              Notes <span class="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              v-model="formData.description"
              placeholder="Add any extra details..."
              rows="3"
              class="w-full px-3 py-2.5 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxlength="2000"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-900 mb-2">
                Assign to
              </label>
              <select
                v-model="formData.assignee"
                class="w-full px-3 py-2.5 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option :value="null">No one</option>
                <option 
                  v-for="member in projectMembers" 
                  :key="member.id" 
                  :value="member.id"
                >
                  {{ member.name || member.email }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-semibold text-gray-900 mb-2">
                Due date
              </label>
              <input
                v-model="formData.dueDate"
                type="date"
                class="w-full px-3 py-2.5 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
          :disabled="!formData.content.trim() || isSaving"
          class="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ion-spinner v-if="isSaving" name="crescent" class="w-4 h-4"></ion-spinner>
          <span v-else>{{ editMode ? 'Save' : 'Add To-do' }}</span>
        </button>
      </div>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface TodoItem {
  id?: string;
  content: string;
  description?: string;
  assignee?: string;
  due_date?: string;
}

interface ProjectMember {
  id: string;
  name?: string;
  email: string;
}

const props = defineProps<{
  isOpen: boolean;
  item?: TodoItem;
  projectMembers: ProjectMember[];
}>();

const emit = defineEmits<{
  close: [];
  submit: [data: {
    content: string;
    description?: string;
    assignee?: string | null;
    due_date?: string | null;
  }];
}>();

const editMode = ref(false);
const isSaving = ref(false);
const formData = ref({
  content: '',
  description: '',
  assignee: null as string | null,
  dueDate: '',
});

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    if (props.item) {
      editMode.value = true;
      formData.value = {
        content: props.item.content,
        description: props.item.description || '',
        assignee: props.item.assignee || null,
        dueDate: props.item.due_date ? props.item.due_date.split(' ')[0] : '',
      };
    } else {
      editMode.value = false;
      formData.value = {
        content: '',
        description: '',
        assignee: null,
        dueDate: '',
      };
    }
  }
});

function closeModal() {
  emit('close');
}

function handleSubmit() {
  if (!formData.value.content.trim()) return;
  
  emit('submit', {
    content: formData.value.content.trim(),
    description: formData.value.description.trim() || undefined,
    assignee: formData.value.assignee || null,
    due_date: formData.value.dueDate || null,
  });
}
</script>

<style scoped>
.space-y-5 > * + * {
  margin-top: 1.25rem;
}
</style>

