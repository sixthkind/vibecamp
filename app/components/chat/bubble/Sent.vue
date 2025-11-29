<template>
  <div class="flex justify-end">
    <div class="max-w-[70%]">
      <div class="bg-blue-600 text-white rounded-lg px-4 py-2">
        <div v-if="message.content" class="text-[15px] leading-relaxed whitespace-pre-wrap">{{ message.content }}</div>
        
        <!-- File attachments -->
        <div v-if="message.files && message.files.length > 0" :class="message.content ? 'mt-2' : ''" class="space-y-2">
          <div v-for="(file, index) in message.files" :key="index" @click="openFile(file)" class="cursor-pointer hover:opacity-80 transition-opacity">
            <img 
              v-if="isImage(file)" 
              :src="getFileURL(file)" 
              :alt="file" 
              class="max-w-full rounded-lg"
            />
            <div v-else class="flex items-center gap-2 p-2 bg-white/20 rounded-lg">
              <Icon name="lucide:file-text" size="20px" />
              <span class="text-sm truncate">{{ file }}</span>
            </div>
          </div>
        </div>

        <!-- Edit indicator -->
        <div v-if="message.edited" class="flex items-center gap-1 mt-1 text-xs opacity-70">
          <Icon name="lucide:pencil" size="10px" />
          <span>edited</span>
        </div>
      </div>

      <!-- Message actions -->
      <div v-if="editMode" class="flex gap-2 mt-2 justify-end">
        <button 
          @click="$emit('editMessage', message)" 
          class="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
        >
          <Icon name="lucide:edit-2" size="14px" />
          <span>Edit</span>
        </button>
        <button 
          @click="$emit('confirmDelete', message)" 
          class="px-3 py-1 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm flex items-center gap-1"
        >
          <Icon name="lucide:trash-2" size="14px" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { pb } from '~/utils/pb';

interface Message {
  id: string;
  content: string;
  files?: string[];
  edited?: boolean;
  created: string;
  updated: string;
  user: string;
}

const props = defineProps<{
  message: Message;
  editMode?: boolean;
}>();

const emit = defineEmits<{
  editMessage: [message: Message];
  confirmDelete: [message: Message];
}>();

function isImage(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

function getFileURL(filename: string): string {
  if (!props.message.id) return '';
  return `${pb.baseUrl}/api/files/chat_messages/${props.message.id}/${filename}`;
}

function openFile(filename: string) {
  window.open(getFileURL(filename), '_blank');
}
</script>


